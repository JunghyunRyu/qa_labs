"""Submission model."""

from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Text, CheckConstraint, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid

from app.models.db import Base


class Submission(Base):
    """Submission model."""

    __tablename__ = "submissions"
    __table_args__ = (
        CheckConstraint(
            "status IN ('PENDING', 'RUNNING', 'SUCCESS', 'FAILURE', 'ERROR')",
            name='submissions_status_check'
        ),
        CheckConstraint(
            "user_id IS NOT NULL OR anonymous_id IS NOT NULL",
            name='submissions_user_or_anonymous_check'
        ),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    anonymous_id = Column(String(36), nullable=True, index=True)
    problem_id = Column(Integer, ForeignKey("problems.id"), nullable=False, index=True)
    code = Column(Text, nullable=False)
    status = Column(
        String(20),
        default="PENDING",
        nullable=False,
        index=True,
    )  # PENDING, RUNNING, SUCCESS, FAILURE, ERROR
    score = Column(Integer, default=0, nullable=False)
    killed_mutants = Column(Integer)
    total_mutants = Column(Integer)
    execution_log = Column(JSONB)
    feedback_json = Column(JSONB)
    progress = Column(JSONB)  # {"step": "testing_buggy", "current": 2, "total": 4, "percent": 50}
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Test Quality Evaluation (Phase 1)
    test_quality_score = Column(Float, nullable=True)  # 0.0 ~ 100.0
    test_quality_grade = Column(String(1), nullable=True)  # A/B/C/D/F
    test_quality_analysis = Column(JSONB, nullable=True)  # TestQualityAnalysis JSON

    # Client Result Verification (P0 Security)
    execution_mode = Column(String(10), default="client", nullable=False, index=True)  # "client" | "server"
    verified = Column(Boolean, default=False, nullable=False, index=True)  # Server verification completed
    verification_status = Column(String(20), nullable=True, index=True)  # "pending" | "verified" | "mismatch"
    server_score = Column(Integer, nullable=True)  # Score from server re-verification
    verification_triggered_by = Column(String(50), nullable=True)  # Trigger reason
    verified_at = Column(DateTime(timezone=True), nullable=True)  # Verification completion time
    code_hash = Column(String(64), nullable=True, index=True)  # SHA256 for duplicate detection

    # Relationships
    user = relationship("User")
    problem = relationship("Problem", back_populates="submissions")

    def __repr__(self):
        return (
            f"<Submission(id={self.id}, user_id={self.user_id}, "
            f"problem_id={self.problem_id}, status={self.status}, score={self.score})>"
        )

