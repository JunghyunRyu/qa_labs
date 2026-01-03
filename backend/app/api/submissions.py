"""Submissions API endpoints."""

import hashlib
import logging
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.rate_limiter import limiter, check_submission_rate_limit, SubmissionRateLimitExceeded, get_client_ip
from app.core.dependencies import get_current_user_optional
from app.models.db import get_db
from app.models.submission import Submission
from app.models.user import User
from app.models.hint_view import HintView
from app.repositories.submission_repository import SubmissionRepository
from app.repositories.problem_repository import ProblemRepository
from app.schemas.submission import SubmissionCreate, SubmissionResponse
from app.services.test_quality_analyzer import TestQualityAnalyzer, calculate_quality_bonus
from app.services.verification_service import VerificationService
from app.workers.tasks import process_submission_task, generate_feedback_task, verify_submission_task
from app.middleware.request_context import get_request_id

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

    # Honeypot check - bots fill this hidden field
    if submission_data.website:
        logger.warning(
            f"[HONEYPOT_TRIGGERED] problem_id={submission_data.problem_id} "
            f"ip={get_client_ip(request)}"
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid request format",
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

        # 코드 해시 계산 (중복 감지용)
        code_hash = hashlib.sha256(submission_data.code.strip().encode("utf-8")).hexdigest()

        # 힌트 페널티 계산 (로그인 사용자만)
        hint_penalty = 0
        if user_id:
            hint_views = db.query(HintView.hint_level).filter(
                HintView.user_id == user_id,
                HintView.problem_id == submission_data.problem_id,
            ).all()
            if hint_views:
                viewed_levels = [hv.hint_level for hv in hint_views]
                hint_penalty = HintView.get_max_penalty(viewed_levels)
                logger.info(
                    f"[HINT_PENALTY] user_id={user_id} problem_id={submission_data.problem_id} "
                    f"viewed_levels={viewed_levels} penalty={hint_penalty}"
                )

        # 테스트 품질 분석 및 보너스 계산
        quality_bonus = 0
        quality_grade = "F"
        quality_score = 0.0
        quality_analysis = None

        if submission_status == "SUCCESS":
            try:
                analyzer = TestQualityAnalyzer()
                quality_result = analyzer.analyze(submission_data.code)
                quality_grade = quality_result.grade.value
                quality_score = quality_result.score
                quality_analysis = quality_result.analysis.model_dump()
                quality_bonus = calculate_quality_bonus(quality_grade)
                logger.info(
                    f"[QUALITY_BONUS] problem_id={submission_data.problem_id} "
                    f"grade={quality_grade} bonus={quality_bonus}"
                )
            except Exception as qe:
                logger.error(
                    f"[QUALITY_ANALYSIS_ERROR] problem_id={submission_data.problem_id} "
                    f"error={type(qe).__name__}: {str(qe)}",
                    exc_info=True,
                )

        # 최종 점수 = 원점수 - 힌트 페널티 + 품질 보너스 (최소 0점, 최대 100점)
        mutation_score = max(0, client_result.score - hint_penalty)
        final_score = min(100, mutation_score + quality_bonus)

        # execution_log에 점수 분석 추가
        execution_log["score_breakdown"] = {
            "raw_score": client_result.score,
            "hint_penalty": hint_penalty,
            "mutation_score": mutation_score,
            "quality_bonus": quality_bonus,
            "quality_grade": quality_grade,
            "final_score": final_score,
        }

        submission = Submission(
            user_id=user_id,
            anonymous_id=anonymous_id,
            problem_id=submission_data.problem_id,
            code=submission_data.code,
            status=submission_status,
            score=final_score,
            killed_mutants=client_result.mutants_killed,
            total_mutants=client_result.total_mutants,
            execution_log=execution_log,
            # Quality fields
            test_quality_score=quality_score,
            test_quality_grade=quality_grade,
            test_quality_analysis=quality_analysis,
            # Verification fields
            execution_mode="client",
            verified=False,
            code_hash=code_hash,
        )

        submission_repo = SubmissionRepository(db)
        submission = submission_repo.create(submission)

        identifier = f"user_id={user_id}" if user_id else f"anonymous_id={anonymous_id}"
        penalty_info = f" hint_penalty={hint_penalty}" if hint_penalty > 0 else ""
        bonus_info = f" quality_bonus=+{quality_bonus}({quality_grade})" if quality_bonus > 0 else ""
        logger.info(
            f"[SUBMISSION_CLIENT_EXECUTED] submission_id={submission.id} "
            f"{identifier} problem_id={submission_data.problem_id} "
            f"status={submission_status} mutation_score={mutation_score}{penalty_info}{bonus_info} final_score={final_score} "
            f"killed={client_result.mutants_killed}/{client_result.total_mutants}"
        )

        # 클라이언트 결과 재검증 로직 (P0 Security)
        if submission_status == "SUCCESS":
            try:
                verification_service = VerificationService(db)
                client_ip = get_client_ip(request)
                should_verify, trigger_reason = verification_service.should_verify(
                    submission=submission,
                    score=client_result.score,
                    execution_time_ms=client_result.total_execution_time or 0,
                    client_ip=client_ip,
                )

                if should_verify:
                    verification_service.mark_for_verification(submission, trigger_reason)
                    # 비동기 재검증 태스크 발행
                    verify_submission_task.delay(str(submission.id))
                    logger.info(
                        f"[VERIFICATION_QUEUED] submission_id={submission.id} "
                        f"trigger={trigger_reason}"
                    )
            except Exception as ve:
                # 검증 로직 실패해도 채점 결과는 반환
                logger.error(
                    f"[VERIFICATION_ERROR] submission_id={submission.id} "
                    f"error={type(ve).__name__}: {str(ve)}",
                    exc_info=True,
                )

        # 회원이고 SUCCESS인 경우 AI 피드백 비동기 생성
        if user_id and submission_status == "SUCCESS":
            try:
                generate_feedback_task.delay(str(submission.id))
                logger.info(f"[AI_FEEDBACK_QUEUED] submission_id={submission.id}")
            except Exception as e:
                # AI 피드백 큐잉 실패해도 채점 결과는 반환
                logger.error(
                    f"[AI_FEEDBACK_QUEUE_ERROR] submission_id={submission.id} "
                    f"error_type={type(e).__name__} error_message={str(e)}",
                    exc_info=True
                )

        return submission

    # 서버 사이드 실행 (기존 Celery 플로우)
    # prod에서는 서버 사이드 실행 비활성화 (리소스 최적화)
    if not settings.ALLOW_SERVER_EXECUTION:
        logger.warning(
            f"[SUBMISSION_SERVER_BLOCKED] problem_id={submission_data.problem_id} "
            f"reason=server_execution_disabled"
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Server-side execution is disabled. Please use client-side execution.",
        )

    # 서버 사이드 실행은 기본적으로 verified=True
    submission = Submission(
        user_id=user_id,
        anonymous_id=anonymous_id,
        problem_id=submission_data.problem_id,
        code=submission_data.code,
        status="PENDING",
        score=0,
        execution_mode="server",
        verified=True,  # 서버 실행은 기본적으로 신뢰
    )

    submission_repo = SubmissionRepository(db)
    submission = submission_repo.create(submission)

    # 로그 메시지 (회원/게스트 구분)
    identifier = f"user_id={user_id}" if user_id else f"anonymous_id={anonymous_id}"
    logger.info(
        f"[SUBMISSION_CREATED] submission_id={submission.id} "
        f"{identifier} problem_id={submission_data.problem_id} status=PENDING"
    )

    # Celery Task 발행 (correlation_id로 request_id 전달)
    correlation_id = get_request_id()
    try:
        process_submission_task.delay(str(submission.id), correlation_id=correlation_id)
        logger.info(f"[SUBMISSION_QUEUED] submission_id={submission.id} correlation_id={correlation_id}")
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

