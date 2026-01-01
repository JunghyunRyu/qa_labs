"""
Token Schemas (PR2: 원장 레이어)

토큰 거래 및 잔액 관련 API 스키마를 정의합니다.
"""

from typing import Dict, List, Optional
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field


class TokenTransactionResponse(BaseModel):
    """토큰 거래 내역 응답"""
    id: UUID = Field(..., description="거래 ID")
    action_type: str = Field(..., description="액션 타입")
    source_type: str = Field(..., description="출처 타입")
    amount: int = Field(..., description="금액 (양수: 지급, 음수: 차감)")
    balance_before: int = Field(..., description="거래 전 잔액")
    balance_after: int = Field(..., description="거래 후 잔액")
    submission_id: Optional[UUID] = Field(None, description="연관 제출 ID")
    description: Optional[str] = Field(None, description="거래 설명")
    created_at: datetime = Field(..., description="생성 시각")

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None,
            UUID: lambda v: str(v) if v else None,
        }


class TokenHistoryResponse(BaseModel):
    """토큰 거래 내역 목록 응답"""
    items: List[TokenTransactionResponse] = Field(..., description="거래 내역 목록")
    total: int = Field(..., description="전체 개수")
    page: int = Field(..., description="현재 페이지")
    page_size: int = Field(..., description="페이지 크기")
    has_more: bool = Field(..., description="더 많은 데이터 존재 여부")


class TokenStatusResponse(BaseModel):
    """토큰 상태 응답"""
    token_balance: int = Field(..., description="월간 토큰 할당량")
    token_used: int = Field(..., description="이번 달 사용량")
    tokens_remaining: int = Field(..., description="남은 토큰")
    daily_bonus_remaining: int = Field(..., description="오늘 남은 무료 사용 횟수")
    daily_bonus_limit: int = Field(..., description="일일 무료 사용 한도")
    next_reset: Optional[str] = Field(None, description="다음 리셋 시각 (ISO 8601)")
    tier: str = Field(..., description="사용자 티어 (하위 호환)")
    plan_key: str = Field(..., description="플랜 키")


class UsageSummaryResponse(BaseModel):
    """사용량 요약 응답"""
    total_deducted: int = Field(..., description="총 차감량")
    total_granted: int = Field(..., description="총 지급량")
    by_action: Dict[str, dict] = Field(..., description="액션별 사용량")


class ActionUsageDetail(BaseModel):
    """액션별 사용량 상세"""
    action_type: str = Field(..., description="액션 타입")
    total: int = Field(..., description="총 사용량")
    count: int = Field(..., description="사용 횟수")
