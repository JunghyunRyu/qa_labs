"""Submissions API endpoints."""

import logging
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.rate_limiter import limiter
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


def get_submission_rate_limit(request: Request) -> str:
    """Get rate limit based on user type (guest vs member)."""
    access_token = request.cookies.get("access_token")
    if access_token:
        return settings.RATE_LIMIT_MEMBER_SUBMISSIONS
    return settings.RATE_LIMIT_GUEST_SUBMISSIONS


@router.post("", response_model=SubmissionResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit(get_submission_rate_limit)
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

    Args:
        submission_data: Submission data
        db: Database session
        current_user: Authenticated user (optional)

    Returns:
        Created submission
    """
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

    # Submission 생성
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
    if user_id:
        logger.info(
            f"[SUBMISSION_CREATED] submission_id={submission.id} "
            f"user_id={user_id} problem_id={submission_data.problem_id} status=PENDING"
        )
    else:
        logger.info(
            f"[SUBMISSION_CREATED] submission_id={submission.id} "
            f"anonymous_id={anonymous_id} problem_id={submission_data.problem_id} status=PENDING"
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

