"""Submissions API endpoints."""

import logging
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.rate_limiter import limiter, check_submission_rate_limit, SubmissionRateLimitExceeded
from app.core.dependencies import get_current_user_optional
from app.models.db import get_db
from app.models.submission import Submission
from app.models.user import User
from app.repositories.submission_repository import SubmissionRepository
from app.repositories.problem_repository import ProblemRepository
from app.schemas.submission import SubmissionCreate, SubmissionResponse
from app.workers.tasks import process_submission_task

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("", response_model=SubmissionResponse, status_code=status.HTTP_201_CREATED)
async def create_submission(
    request: Request,
    submission_data: SubmissionCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Create a new submission.

    Allows both authenticated users and guests.
    - Authenticated users: submission linked to user_id
    - Guests: submission linked to anonymous_id (from cookie)

    Rate limits:
    - Guest: 5/minute, 30/day
    - Member: 10/minute, 200/day

    Args:
        submission_data: Submission data
        db: Database session
        current_user: Authenticated user (optional)

    Returns:
        Created submission

    Raises:
        429: If rate limit exceeded
    """
    # 회원/게스트 구분 및 레이트리밋 체크를 위한 anonymous_id 조기 추출
    anonymous_id = request.cookies.get("qa_anonymous_id") if not current_user else None

    # 게스트/회원 분리 레이트리밋 체크
    try:
        check_submission_rate_limit(request, current_user, anonymous_id)
    except SubmissionRateLimitExceeded as e:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded: {e.limit_str}",
            headers={"Retry-After": str(e.retry_after)},
        )

    # 회원/게스트 구분
    if current_user:
        user_id = current_user.id
        anonymous_id = None
        logger.info(
            f"[SUBMISSION_CREATE_START] problem_id={submission_data.problem_id} "
            f"code_length={len(submission_data.code)} user_id={user_id}"
        )
    else:
        # 게스트: anonymous_id 쿠키 확인
        anonymous_id = request.cookies.get("qa_anonymous_id")
        if not anonymous_id:
            logger.warning(
                f"[SUBMISSION_CREATE_ERROR] problem_id={submission_data.problem_id} "
                f"reason=anonymous_id_missing"
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Anonymous ID cookie required for guest submission",
            )
        user_id = None
        logger.info(
            f"[SUBMISSION_CREATE_START] problem_id={submission_data.problem_id} "
            f"code_length={len(submission_data.code)} anonymous_id={anonymous_id}"
        )

    # 문제 존재 확인
    problem_repo = ProblemRepository(db)
    problem = problem_repo.get_by_id(submission_data.problem_id)
    if not problem:
        logger.warning(f"[SUBMISSION_CREATE_ERROR] problem_id={submission_data.problem_id} reason=problem_not_found")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Problem with id {submission_data.problem_id} not found",
        )

    # 클라이언트 실행 결과가 있는지 확인
    client_result = submission_data.client_result

    if client_result:
        # 클라이언트 사이드 실행 (Pyodide) - Celery 스킵
        submission_status = "SUCCESS" if client_result.golden_code_passed else "FAILURE"

        # execution_log 구성
        execution_log = {
            "execution_mode": "client",  # 클라이언트 실행임을 표시
            "golden_code_passed": client_result.golden_code_passed,
            "total_execution_time_ms": client_result.total_execution_time,
        }
        if client_result.details:
            execution_log["mutant_details"] = [
                {
                    "mutant_id": d.mutant_id,
                    "killed": d.killed,
                    "test_output": d.test_output[:500] if d.test_output else None,  # 로그 크기 제한
                    "execution_time": d.execution_time,
                }
                for d in client_result.details
            ]

        submission = Submission(
            user_id=user_id,
            anonymous_id=anonymous_id,
            problem_id=submission_data.problem_id,
            code=submission_data.code,
            status=submission_status,
            score=client_result.score,
            killed_mutants=client_result.mutants_killed,
            total_mutants=client_result.total_mutants,
            execution_log=execution_log,
        )

        submission_repo = SubmissionRepository(db)
        submission = submission_repo.create(submission)

        identifier = f"user_id={user_id}" if user_id else f"anonymous_id={anonymous_id}"
        logger.info(
            f"[SUBMISSION_CLIENT_EXECUTED] submission_id={submission.id} "
            f"{identifier} problem_id={submission_data.problem_id} "
            f"status={submission_status} score={client_result.score} "
            f"killed={client_result.mutants_killed}/{client_result.total_mutants}"
        )

        return submission

    # 서버 사이드 실행 (기존 Celery 플로우)
    submission = Submission(
        user_id=user_id,
        anonymous_id=anonymous_id,
        problem_id=submission_data.problem_id,
        code=submission_data.code,
        status="PENDING",
        score=0,
    )

    submission_repo = SubmissionRepository(db)
    submission = submission_repo.create(submission)

    # 로그 메시지 (회원/게스트 구분)
    identifier = f"user_id={user_id}" if user_id else f"anonymous_id={anonymous_id}"
    logger.info(
        f"[SUBMISSION_CREATED] submission_id={submission.id} "
        f"{identifier} problem_id={submission_data.problem_id} status=PENDING"
    )

    # Celery Task 발행
    try:
        process_submission_task.delay(str(submission.id))
        logger.info(f"[SUBMISSION_QUEUED] submission_id={submission.id}")
    except Exception as e:
        # Task 발행 실패 시 에러 상태로 업데이트
        logger.error(
            f"[SUBMISSION_QUEUE_ERROR] submission_id={submission.id} "
            f"error_type={type(e).__name__} error_message={str(e)}",
            exc_info=True
        )
        submission.status = "ERROR"
        submission.execution_log = {"error": f"Failed to queue task: {str(e)}"}
        submission_repo.update(submission)
        logger.info(f"[STATUS_CHANGE] submission_id={submission.id} status=PENDING->ERROR")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to queue submission task: {str(e)}",
        )

    return submission


@router.get("/{submission_id}", response_model=SubmissionResponse)
async def get_submission(
    submission_id: UUID,
    db: Session = Depends(get_db),
):
    """
    Get submission result by ID.
    
    Args:
        submission_id: Submission ID
        db: Database session
        
    Returns:
        Submission details including status, score, and results

    Raises:
        404: If submission not found
    """
    logger.info(f"Fetching submission {submission_id}")
    submission_repo = SubmissionRepository(db)
    submission = submission_repo.get_by_id(submission_id)
    
    if not submission:
        logger.warning(f"Submission {submission_id} not found")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Submission with id {submission_id} not found",
        )
    
    logger.info(f"Submission {submission_id} retrieved - status: {submission.status}")
    return submission

