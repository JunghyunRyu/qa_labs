"""
Test Quality Models.

Phase 1: 분석 실행 이력 관리를 위한 SQLAlchemy 모델.
"""

from sqlalchemy import (
    CheckConstraint,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.models.db import Base


class AnalysisRun(Base):
    """분석 실행 이력 모델."""

    __tablename__ = "analysis_runs"
    __table_args__ = (
        CheckConstraint(
            "scope IN ('submission', 'problem_rubric')",
            name="analysis_runs_scope_check",
        ),
        CheckConstraint(
            "status IN ('PENDING', 'RUNNING', 'SUCCESS', 'ERROR')",
            name="analysis_runs_status_check",
        ),
        CheckConstraint(
            "(submission_id IS NOT NULL AND problem_id IS NULL) OR "
            "(submission_id IS NULL AND problem_id IS NOT NULL)",
            name="analysis_runs_target_check",
        ),
        CheckConstraint(
            "confidence_score IS NULL OR "
            "(confidence_score >= 0.0 AND confidence_score <= 1.0)",
            name="analysis_runs_confidence_check",
        ),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    submission_id = Column(
        UUID(as_uuid=True),
        ForeignKey("submissions.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    problem_id = Column(
        Integer,
        ForeignKey("problems.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    scope = Column(String(20), nullable=False)
    parser_version = Column(String(10), nullable=False)
    scoring_version = Column(String(10), nullable=False)
    source_hash = Column(String(32), nullable=False)
    status = Column(String(20), default="PENDING", nullable=False, index=True)
    confidence_score = Column(Float, nullable=True)
    result = Column(JSONB, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    submission = relationship("Submission", backref="analysis_runs")
    problem = relationship("Problem", backref="analysis_runs")

    def __repr__(self):
        return (
            f"<AnalysisRun(id={self.id}, scope={self.scope}, "
            f"status={self.status}, confidence={self.confidence_score})>"
        )
