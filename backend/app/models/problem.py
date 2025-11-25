"""Problem model."""

from sqlalchemy import Column, Integer, String, Text, DateTime, CheckConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.models.db import Base


class Problem(Base):
    """Problem model."""

    __tablename__ = "problems"

    id = Column(Integer, primary_key=True, autoincrement=True)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description_md = Column(Text, nullable=False)
    function_signature = Column(Text, nullable=False)
    golden_code = Column(Text, nullable=False)
    difficulty = Column(
        String(20),
        CheckConstraint("difficulty IN ('Easy', 'Medium', 'Hard')"),
        nullable=False,
    )
    skills = Column(JSONB)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    buggy_implementations = relationship(
        "BuggyImplementation", back_populates="problem", cascade="all, delete-orphan"
    )
    submissions = relationship("Submission", back_populates="problem")

    def __repr__(self):
        return f"<Problem(id={self.id}, slug={self.slug}, title={self.title})>"

