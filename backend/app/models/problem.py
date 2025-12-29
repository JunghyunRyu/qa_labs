"""Problem model."""

from sqlalchemy import Column, Integer, Float, String, Text, DateTime, CheckConstraint
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
        CheckConstraint("difficulty IN ('Very Easy', 'Easy', 'Medium', 'Hard')"),
        nullable=False,
    )
    domain = Column(
        String(20),
        CheckConstraint("domain IN ('common', 'fintech', 'commerce', 'saas', 'platform', 'content')"),
        nullable=False,
        default='common',
        index=True,
    )
    skills = Column(JSONB)
    summary = Column(Text, nullable=True)  # 핵심 테스트 포인트 요약 (마크다운)
    short_description = Column(String(200), nullable=True)  # 카드용 짧은 설명 (1-2문장)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Rubric Evaluation (Phase 1)
    rubric_score = Column(Float, nullable=True)  # 0.0 ~ 100.0
    rubric_analysis = Column(JSONB, nullable=True)  # RubricAnalysis JSON

    # Relationships
    buggy_implementations = relationship(
        "BuggyImplementation", back_populates="problem", cascade="all, delete-orphan"
    )
    submissions = relationship("Submission", back_populates="problem")

    def __repr__(self):
        return f"<Problem(id={self.id}, slug={self.slug}, title={self.title})>"

