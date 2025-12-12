"""Submissions API endpoints."""

import logging
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.rate_limiter import limiter
from app.core.dependencies import get_current_user
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
@limiter.limit(settings.RATE_LIMIT_SUBMISSIONS)
async def create_submission(
    request: Request,
    submission_data: SubmissionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new submission.

    Requires authentication.

    Args:
        submission_data: Submission data
        db: Database session
        current_user: Authenticated user

    Returns:
        Created submission
    """
    logger.info(
        f"[SUBMISSION_CREATE_START] problem_id={submission_data.problem_id} "
        f"code_length={len(submission_data.code)} user_id={current_user.id}"
    )
    user = current_user
    
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
        user_id=user.id,
        problem_id=submission_data.problem_id,
        code=submission_data.code,
        status="PENDING",
        score=0,
    )
    
    submission_repo = SubmissionRepository(db)
    submission = submission_repo.create(submission)
    logger.info(
        f"[SUBMISSION_CREATED] submission_id={submission.id} "
        f"user_id={user.id} problem_id={submission_data.problem_id} status=PENDING"
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

