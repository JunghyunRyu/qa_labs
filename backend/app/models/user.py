"""User model."""

from sqlalchemy import Column, String, DateTime, Boolean, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from app.models.db import Base


class User(Base):
    """User model."""

    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(50), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # GitHub OAuth fields
    github_id = Column(String(50), unique=True, nullable=True, index=True)
    github_username = Column(String(100), nullable=True)
    avatar_url = Column(String(500), nullable=True)

    # Google OAuth fields
    google_id = Column(String(50), unique=True, nullable=True, index=True)

    # Account status
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True)

    # Token system for AI features
    token_balance = Column(Integer, default=50, nullable=False)  # Monthly token allocation
    token_used = Column(Integer, default=0, nullable=False)  # Tokens used this month
    token_reset_at = Column(DateTime(timezone=True), nullable=True)  # Next monthly reset
    daily_bonus_used = Column(Integer, default=0, nullable=False)  # Bonus uses today (max 3)
    daily_bonus_reset_at = Column(DateTime(timezone=True), nullable=True)  # Next daily reset
    tier = Column(String(20), default="free", nullable=False)  # free / premium (하위 호환)

    # Plan system (PR1: Entitlement 레이어)
    plan_key = Column(String(20), default="free", nullable=False)  # free / lite / pro
    plan_started_at = Column(DateTime(timezone=True), nullable=True)  # 플랜 시작일
    plan_expires_at = Column(DateTime(timezone=True), nullable=True)  # 플랜 만료일 (NULL = 영구)

    # Terms acceptance
    terms_accepted_at = Column(DateTime(timezone=True), nullable=True)  # 이용약관 동의 시점

    # Onboarding tutorial
    tutorial_completed_at = Column(DateTime(timezone=True), nullable=True)  # 튜토리얼 완료 시점

    # Daily Bounty streak
    bounty_streak = Column(Integer, default=0, nullable=False)  # 현재 연속 완료 일수
    bounty_streak_updated_at = Column(DateTime(timezone=True), nullable=True)  # 마지막 스트릭 업데이트
    last_bounty_completed_at = Column(DateTime(timezone=True), nullable=True)  # 마지막 완료 시점

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, username={self.username})>"

