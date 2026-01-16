"""Daily Bounty API endpoints."""

import logging
from datetime import date, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.models.db import get_db
from app.models.user import User
from app.models.daily_bounty import DailyBountyCompletion
from app.core.dependencies import get_current_user, get_current_user_optional
from app.services.daily_bounty_service import get_daily_bounty_service
from app.schemas.daily_bounty import (
    DailyBountyStatusResponse,
    DailyBountyHistoryResponse,
    DailyBountyHistoryItem,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/daily-bounty", tags=["daily-bounty"])


@router.get("", response_model=DailyBountyStatusResponse)
async def get_daily_bounty_status(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    오늘의 일일 현상금 상태 조회

    비로그인 사용자도 문제 정보는 볼 수 있으나,
    완료 상태와 스트릭은 로그인 시에만 표시됩니다.

    Returns:
        DailyBountyStatusResponse: 일일 현상금 상태
    """
    service = get_daily_bounty_service(db)
    status = service.get_daily_bounty_status(current_user)
    return DailyBountyStatusResponse(**status)


@router.get("/history", response_model=DailyBountyHistoryResponse)
async def get_bounty_history(
    days: int = Query(7, ge=1, le=30, description="조회 기간 (기본 7일, 최대 30일)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    최근 N일간의 일일 현상금 완료 기록

    Args:
        days: 조회 기간 (기본 7일, 최대 30일)

    Returns:
        완료 기록 목록
    """
    start_date = date.today() - timedelta(days=days)

    completions = db.query(DailyBountyCompletion).filter(
        DailyBountyCompletion.user_id == current_user.id,
        DailyBountyCompletion.date >= start_date,
    ).order_by(DailyBountyCompletion.date.desc()).all()

    return DailyBountyHistoryResponse(
        completions=[
            DailyBountyHistoryItem(
                date=c.date.isoformat(),
                problem_id=c.problem_id,
                streak_count=c.streak_count,
                base_reward_granted=c.base_reward_granted,
                streak_bonus_granted=c.streak_bonus_granted,
            )
            for c in completions
        ],
        current_streak=current_user.bounty_streak,
        total_completions=len(completions),
    )
