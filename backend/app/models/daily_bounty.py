"""
Daily Bounty Model

일일 현상금 시스템:
- DailyBounty: 날짜별 선정된 문제
- DailyBountyCompletion: 사용자별 완료 기록
"""

import uuid
from sqlalchemy import Column, Date, Integer, DateTime, ForeignKey, Boolean, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.models.db import Base


class DailyBounty(Base):
    """
    Daily Bounty - 날짜별 선정된 문제

    매일 자정(KST) Easy/Medium 문제 중 1개가 선정됩니다.
    """

    __tablename__ = "daily_bounties"

    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(Date, nullable=False, unique=True, index=True)  # KST 기준 날짜
    problem_id = Column(
        Integer,
        ForeignKey("problems.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    problem = relationship("Problem")

    def __repr__(self):
        return f"<DailyBounty(date={self.date}, problem_id={self.problem_id})>"


class DailyBountyCompletion(Base):
    """
    Daily Bounty Completion - 사용자별 완료 기록

    사용자가 일일 현상금 문제를 해결하면 기록됩니다.
    - base_reward_granted: +5 토큰 지급 여부
    - streak_bonus_granted: +50 보너스 지급 여부 (3일 연속)
    """

    __tablename__ = "daily_bounty_completions"
    __table_args__ = (
        Index('ix_dbc_user_date', 'user_id', 'date', unique=True),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    date = Column(Date, nullable=False, index=True)  # 완료한 날짜
    problem_id = Column(
        Integer,
        ForeignKey("problems.id", ondelete="SET NULL"),
        nullable=True,
    )
    submission_id = Column(
        UUID(as_uuid=True),
        ForeignKey("submissions.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Rewards
    base_reward_granted = Column(Boolean, default=False, nullable=False)  # +5 토큰 지급 여부
    streak_bonus_granted = Column(Boolean, default=False, nullable=False)  # +50 보너스 지급 여부
    streak_count = Column(Integer, default=1, nullable=False)  # 완료 시점 스트릭 수

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", backref="daily_bounty_completions")
    problem = relationship("Problem")
    submission = relationship("Submission")

    def __repr__(self):
        return f"<DailyBountyCompletion(user_id={self.user_id}, date={self.date}, streak={self.streak_count})>"
