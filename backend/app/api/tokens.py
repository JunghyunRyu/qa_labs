"""
Token API Endpoints (PR2: 원장 레이어)

토큰 상태 조회 및 거래 내역 API를 제공합니다.
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.models.db import get_db
from app.models.user import User
from app.core.dependencies import get_current_user
from app.services.token_service import get_token_service
from app.schemas.token import (
    TokenStatusResponse,
    TokenHistoryResponse,
    TokenTransactionResponse,
    UsageSummaryResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/tokens", tags=["tokens"])


@router.get("/status", response_model=TokenStatusResponse)
async def get_token_status(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    현재 토큰 상태 조회

    Returns:
        TokenStatusResponse: 토큰 잔액, 사용량, 무료 횟수 등
    """
    token_service = get_token_service(db)
    status = token_service.get_token_status(user)
    return TokenStatusResponse(**status)


@router.get("/history", response_model=TokenHistoryResponse)
async def get_token_history(
    page: int = Query(1, ge=1, description="페이지 번호"),
    page_size: int = Query(20, ge=1, le=100, description="페이지 크기"),
    action_type: Optional[str] = Query(None, description="액션 타입 필터"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    토큰 거래 내역 조회

    Args:
        page: 페이지 번호 (1부터 시작)
        page_size: 페이지당 항목 수 (최대 100)
        action_type: 액션 타입 필터 (선택)

    Returns:
        TokenHistoryResponse: 거래 내역 목록
    """
    token_service = get_token_service(db)
    offset = (page - 1) * page_size

    transactions, total = token_service.get_transaction_history(
        user_id=user.id,
        limit=page_size,
        offset=offset,
        action_type=action_type,
    )

    items = [
        TokenTransactionResponse(
            id=tx.id,
            action_type=tx.action_type,
            source_type=tx.source_type,
            amount=tx.amount,
            balance_before=tx.balance_before,
            balance_after=tx.balance_after,
            submission_id=tx.submission_id,
            description=tx.description,
            created_at=tx.created_at,
        )
        for tx in transactions
    ]

    return TokenHistoryResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        has_more=(offset + len(items)) < total,
    )


@router.get("/usage", response_model=UsageSummaryResponse)
async def get_usage_summary(
    days: int = Query(30, ge=1, le=365, description="조회 기간 (일)"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    토큰 사용량 요약 조회

    Args:
        days: 조회 기간 (기본 30일, 최대 365일)

    Returns:
        UsageSummaryResponse: 사용량 요약
    """
    token_service = get_token_service(db)
    summary = token_service.get_usage_summary(user.id, days)
    return UsageSummaryResponse(**summary)
