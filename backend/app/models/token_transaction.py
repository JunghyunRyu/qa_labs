"""
TokenTransaction Model (PR2: 원장 레이어)

토큰 거래 내역을 불변 원장(APPEND ONLY)으로 기록합니다.
모든 토큰 변동은 이 테이블에 기록되어 추적 가능합니다.
"""

import uuid
from enum import Enum

from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.models.db import Base


class SourceType(str, Enum):
    """토큰 출처 타입"""
    DAILY_BONUS = "daily_bonus"      # 일일 무료 보너스 (소멸성)
    MONTHLY = "monthly"              # 월간 할당 (기간제)
    TOP_UP = "top_up"                # 추가 충전 (영구, 향후)
    ADMIN_GRANT = "admin_grant"      # 관리자 지급
    REFUND = "refund"                # 환불
    SYSTEM = "system"                # 시스템 조정


class ActionType(str, Enum):
    """토큰 사용 액션 타입"""
    # AI 기능 사용
    AI_COACH = "ai_coach"            # AI 코치 (문제 챗봇)
    AI_HINT = "ai_hint"              # AI 힌트
    FEEDBACK_BASE = "feedback_base"  # 기본 피드백
    FEEDBACK_DEEP = "feedback_deep"  # 심화 분석
    FEEDBACK_REGENERATE = "feedback_regenerate"  # 피드백 재생성
    SUCCESS_ANALYSIS = "success_analysis"  # 성공 분석 (100점)

    # 토큰 지급
    DAILY_GRANT = "daily_grant"      # 일일 보너스 지급
    MONTHLY_RESET = "monthly_reset"  # 월간 리셋 지급
    ADMIN_ADJUSTMENT = "admin_adjustment"  # 관리자 조정

    # Daily Bounty
    DAILY_BOUNTY_SOLVE = "daily_bounty_solve"    # 일일 현상금 해결 (+5)
    DAILY_BOUNTY_STREAK = "daily_bounty_streak"  # 3일 연속 보너스 (+50)

    # 기타
    EXPIRED = "expired"              # 만료 차감


class TokenTransaction(Base):
    """
    토큰 거래 내역 (APPEND ONLY)

    이 테이블은 불변 원장으로 설계되었습니다:
    - INSERT만 허용, UPDATE/DELETE 금지
    - 모든 변동은 새 레코드로 기록
    - balance_before/after로 잔액 검증 가능
    - idempotency_key로 중복 처리 방지
    """

    __tablename__ = "token_transactions"

    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # 사용자 참조
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # 거래 유형
    action_type = Column(String(50), nullable=False)  # ActionType enum 값
    source_type = Column(String(50), nullable=False)  # SourceType enum 값

    # 금액 및 잔액
    amount = Column(Integer, nullable=False)  # 양수: 지급, 음수: 차감
    balance_before = Column(Integer, nullable=False)  # 거래 전 잔액
    balance_after = Column(Integer, nullable=False)   # 거래 후 잔액

    # 참조 정보
    submission_id = Column(
        UUID(as_uuid=True),
        ForeignKey("submissions.id", ondelete="SET NULL"),
        nullable=True
    )

    # 멱등성 키 (중복 처리 방지)
    idempotency_key = Column(String(100), unique=True, nullable=True)

    # 메타데이터
    description = Column(String(500), nullable=True)  # 거래 설명

    # 타임스탬프
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    # Relationships
    user = relationship("User", backref="token_transactions")

    # 복합 인덱스
    __table_args__ = (
        # 사용자별 최근 거래 조회 최적화
        Index('ix_token_transactions_user_created', 'user_id', 'created_at'),
        # 멱등성 키 조회
        Index('ix_token_transactions_idempotency', 'idempotency_key'),
        # 액션별 통계
        Index('ix_token_transactions_action_type', 'action_type'),
    )

    def __repr__(self):
        return (
            f"<TokenTransaction(id={self.id}, user_id={self.user_id}, "
            f"action={self.action_type}, amount={self.amount}, "
            f"balance={self.balance_before}→{self.balance_after})>"
        )

    @property
    def is_deduction(self) -> bool:
        """차감 거래인지 확인"""
        return self.amount < 0

    @property
    def is_grant(self) -> bool:
        """지급 거래인지 확인"""
        return self.amount > 0
