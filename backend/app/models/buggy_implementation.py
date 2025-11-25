"""BuggyImplementation model."""

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.models.db import Base


class BuggyImplementation(Base):
    """BuggyImplementation (Mutant) model."""

    __tablename__ = "buggy_implementations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    problem_id = Column(Integer, ForeignKey("problems.id"), nullable=False, index=True)
    buggy_code = Column(Text, nullable=False)
    bug_description = Column(String(255))
    weight = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    problem = relationship("Problem", back_populates="buggy_implementations")

    def __repr__(self):
        return (
            f"<BuggyImplementation(id={self.id}, problem_id={self.problem_id}, "
            f"weight={self.weight})>"
        )

