"""Progress API endpoints for user growth dashboard."""

import logging
from typing import Optional, Union

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user_optional
from app.models.db import get_db
from app.models.user import User
from app.schemas.progress import (
    ProgressSummaryResponse,
    ProgressTimelineResponse,
    ProgressEmptyResponse,
)
from app.services.progress_service import ProgressService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/progress", tags=["progress"])


@router.get(
    "/summary",
    response_model=Union[ProgressSummaryResponse, ProgressEmptyResponse],
    summary="Get progress summary",
    description="Get user's progress summary including statistics by difficulty, domain, and skills.",
)
async def get_progress_summary(
    request: Request,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """Get user progress summary.

    Returns aggregated statistics:
    - Total/success submissions
    - Average score and kill ratio
    - Best score
    - Recent average (last 10 submissions)
    - Statistics by difficulty level
    - Statistics by domain
    - Statistics by skill/tag

    Both authenticated users and guests can access this endpoint.
    """
    # Get user identifier
    user_id = current_user.id if current_user else None
    anonymous_id = request.cookies.get("qa_anonymous_id") if not current_user else None

    if not user_id and not anonymous_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User identification required. Please login or enable cookies.",
        )

    service = ProgressService(db)

    # Check if user has any submissions
    if not service.has_submissions(user_id=user_id, anonymous_id=anonymous_id):
        return ProgressEmptyResponse()

    logger.info(
        f"[PROGRESS_SUMMARY] user_id={user_id} anonymous_id={anonymous_id}"
    )

    return service.get_summary(user_id=user_id, anonymous_id=anonymous_id)


@router.get(
    "/timeline",
    response_model=ProgressTimelineResponse,
    summary="Get progress timeline",
    description="Get user's progress timeline with daily aggregated data.",
)
async def get_progress_timeline(
    request: Request,
    range: str = Query(
        default="30d",
        regex="^(7d|30d|90d|all)$",
        description="Time range: 7d, 30d, 90d, or all",
    ),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """Get user progress timeline.

    Returns daily aggregated data:
    - Date
    - Number of submissions
    - Average score
    - Average kill ratio

    Args:
        range: Time range to query (7d, 30d, 90d, or all)

    Both authenticated users and guests can access this endpoint.
    """
    # Get user identifier
    user_id = current_user.id if current_user else None
    anonymous_id = request.cookies.get("qa_anonymous_id") if not current_user else None

    if not user_id and not anonymous_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User identification required. Please login or enable cookies.",
        )

    service = ProgressService(db)

    logger.info(
        f"[PROGRESS_TIMELINE] user_id={user_id} anonymous_id={anonymous_id} range={range}"
    )

    return service.get_timeline(range_str=range, user_id=user_id, anonymous_id=anonymous_id)


@router.get(
    "/difficulty",
    summary="Get difficulty statistics",
    description="Get user's statistics grouped by problem difficulty.",
)
async def get_difficulty_stats(
    request: Request,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """Get statistics by difficulty level."""
    user_id = current_user.id if current_user else None
    anonymous_id = request.cookies.get("qa_anonymous_id") if not current_user else None

    if not user_id and not anonymous_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User identification required.",
        )

    service = ProgressService(db)
    return {"difficulty_stats": service.get_difficulty_stats(user_id=user_id, anonymous_id=anonymous_id)}


@router.get(
    "/skills",
    summary="Get skill statistics",
    description="Get user's statistics grouped by problem skills/tags.",
)
async def get_skill_stats(
    request: Request,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """Get statistics by skill/tag."""
    user_id = current_user.id if current_user else None
    anonymous_id = request.cookies.get("qa_anonymous_id") if not current_user else None

    if not user_id and not anonymous_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User identification required.",
        )

    service = ProgressService(db)
    return {"skill_stats": service.get_skill_stats(user_id=user_id, anonymous_id=anonymous_id)}
