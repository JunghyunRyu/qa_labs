"""
Feedback model for PR4: 심화/성공 분석 및 재생성

피드백 유형별로 별도 레코드를 관리하며, 비동기 생성을 지원합니다.
"""

from enum import Enum
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid

from app.models.db import Base


class FeedbackType(str, Enum):
    """피드백 유형"""
    BASE = "base"                # 기본 피드백 (제출 시 자동 생성)
    DEEP = "deep"                # 심화 분석 (유료)
    SUCCESS = "success"          # 성공 분석 (100점 달성 시)
    REGENERATE = "regenerate"    # 재생성


class FeedbackStatus(str, Enum):
    """피드백 생성 상태"""
    PENDING = "pending"          # 대기 중
    GENERATING = "generating"    # 생성 중
    COMPLETED = "completed"      # 완료
    FAILED = "failed"            # 실패


class Feedback(Base):
    """
    피드백 모델

    각 제출(Submission)에 대해 여러 유형의 피드백을 저장합니다.
    비동기 생성을 지원하며, 생성 상태를 추적합니다.

    Attributes:
        id: 피드백 고유 ID
        submission_id: 연관된 제출 ID
        user_id: 사용자 ID (토큰 차감 기록용)
        feedback_type: 피드백 유형 (base, deep, success, regenerate)
        status: 생성 상태 (pending, generating, completed, failed)
        content: 피드백 내용 (JSONB)
        schema_version: JSON 스키마 버전 (마이그레이션용)
        token_cost: 소비된 토큰 수
        error_message: 실패 시 에러 메시지
        created_at: 생성 시각
        completed_at: 완료 시각
    """

    __tablename__ = "feedbacks"
    __table_args__ = (
        Index("ix_feedbacks_submission_type", "submission_id", "feedback_type"),
        Index("ix_feedbacks_user_status", "user_id", "status"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    submission_id = Column(
        UUID(as_uuid=True),
        ForeignKey("submissions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    feedback_type = Column(
        String(20),
        nullable=False,
        default=FeedbackType.BASE.value,
    )
    status = Column(
        String(20),
        nullable=False,
        default=FeedbackStatus.PENDING.value,
        index=True,
    )
    content = Column(JSONB, nullable=True)
    schema_version = Column(Integer, nullable=False, default=1)
    token_cost = Column(Integer, nullable=False, default=0)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    submission = relationship("Submission", backref="feedbacks")
    user = relationship("User")

    def __repr__(self):
        return (
            f"<Feedback(id={self.id}, submission_id={self.submission_id}, "
            f"type={self.feedback_type}, status={self.status})>"
        )

    def mark_generating(self) -> None:
        """생성 시작으로 상태 변경"""
        self.status = FeedbackStatus.GENERATING.value

    def mark_completed(self, content: dict) -> None:
        """완료로 상태 변경"""
        self.status = FeedbackStatus.COMPLETED.value
        self.content = content
        self.completed_at = func.now()

    def mark_failed(self, error_message: str) -> None:
        """실패로 상태 변경"""
        self.status = FeedbackStatus.FAILED.value
        self.error_message = error_message
        self.completed_at = func.now()

    @property
    def is_completed(self) -> bool:
        """완료 여부"""
        return self.status == FeedbackStatus.COMPLETED.value

    @property
    def is_generating(self) -> bool:
        """생성 중 여부"""
        return self.status == FeedbackStatus.GENERATING.value


# Content schema versions (for migration)
FEEDBACK_SCHEMA_VERSIONS = {
    1: {
        "description": "Initial schema",
        "fields": ["summary", "strengths", "weaknesses", "suggestions", "next_steps"],
    },
    2: {
        "description": "Added detailed analysis",
        "fields": ["summary", "strengths", "weaknesses", "suggestions", "next_steps",
                   "code_quality", "test_coverage", "edge_cases"],
    },
}

CURRENT_SCHEMA_VERSION = 1
