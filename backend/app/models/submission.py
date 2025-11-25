"""Submission model."""

from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid

from app.models.db import Base


class Submission(Base):
    """Submission model."""

    __tablename__ = "submissions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
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
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User")
    problem = relationship("Problem", back_populates="submissions")

    def __repr__(self):
        return (
            f"<Submission(id={self.id}, user_id={self.user_id}, "
            f"problem_id={self.problem_id}, status={self.status}, score={self.score})>"
        )

