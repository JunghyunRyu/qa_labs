"""User-related API endpoints."""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.models.db import get_db
from app.models.user import User
from app.repositories.submission_repository import SubmissionRepository
from app.schemas.submission import (
    SubmissionListItem,
    UserSubmissionsResponse,
    UserStatisticsResponse,
    DifficultyStats,
    RecentActivity,
)
from app.core.dependencies import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/me/submissions", response_model=UserSubmissionsResponse)
async def get_my_submissions(
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(10, ge=1, le=100, description="Number of items per page"),
    status: Optional[str] = Query(
        None,
        description="Filter by status: PENDING, RUNNING, SUCCESS, FAILURE, ERROR"
    ),
    days: Optional[int] = Query(
        None,
        description="Filter by recent N days (e.g., 7, 30)"
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get paginated list of submissions for current user.

    Args:
        page: Page number
        page_size: Number of items per page
        status: Optional status filter
        days: Optional filter for recent N days

    Returns:
        Paginated list of submissions with problem info
    """
    logger.info(f"Fetching submissions for user {current_user.id}, page={page}, status={status}, days={days}")

    repo = SubmissionRepository(db)
    submissions, total = repo.get_by_user_id(
        user_id=current_user.id,
        page=page,
        page_size=page_size,
        status=status,
        days=days,
    )

    # Calculate total pages
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    # Transform submissions to include problem info
    submission_items = []
    for sub in submissions:
        problem = sub.problem
        submission_items.append(
            SubmissionListItem(
                id=sub.id,
                problem_id=sub.problem_id,
                problem_title=problem.title if problem else f"Problem #{sub.problem_id}",
                problem_difficulty=problem.difficulty if problem else "Unknown",
                status=sub.status,
                score=sub.score,
                killed_mutants=sub.killed_mutants,
                total_mutants=sub.total_mutants,
                created_at=sub.created_at,
            )
        )

    logger.info(f"Found {total} submissions for user {current_user.id}")

    return UserSubmissionsResponse(
        submissions=submission_items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/me/statistics", response_model=UserStatisticsResponse)
async def get_my_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get statistics for current user.

    Returns:
        User statistics including total submissions, success rate,
        difficulty breakdown, and recent activity.
    """
    logger.info(f"Fetching statistics for user {current_user.id}")

    repo = SubmissionRepository(db)
    stats = repo.get_user_statistics(user_id=current_user.id)

    # Transform by_difficulty to use DifficultyStats schema
    by_difficulty = {
        k: DifficultyStats(attempted=v["attempted"], solved=v["solved"])
        for k, v in stats["by_difficulty"].items()
    }

    # Transform recent_activity to use RecentActivity schema
    recent_activity = [
        RecentActivity(date=item["date"], submissions=item["submissions"])
        for item in stats["recent_activity"]
    ]

    logger.info(f"Statistics fetched for user {current_user.id}: {stats['total_submissions']} submissions")

    return UserStatisticsResponse(
        total_submissions=stats["total_submissions"],
        total_problems_attempted=stats["total_problems_attempted"],
        total_problems_solved=stats["total_problems_solved"],
        success_rate=stats["success_rate"],
        avg_score=stats["avg_score"],
        best_score=stats["best_score"],
        by_difficulty=by_difficulty,
        recent_activity=recent_activity,
    )
