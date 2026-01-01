"""Hint view tracking model (M5-5)."""

from sqlalchemy import Column, DateTime, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.models.db import Base


class HintView(Base):
    """Tracks which hints a user has viewed for each problem.

    Score penalty is calculated based on highest hint level viewed:
    - Level 1: No penalty
    - Level 2: -10 points (max score 90)
    - Level 3: -20 points (max score 80)
    """

    __tablename__ = "hint_views"
    __table_args__ = (
        UniqueConstraint("user_id", "problem_id", "hint_level", name="uq_user_problem_hint"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    problem_id = Column(
        Integer,
        ForeignKey("problems.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    hint_level = Column(Integer, nullable=False)  # 1, 2, or 3
    viewed_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", backref="hint_views")
    problem = relationship("Problem", backref="hint_views")

    def __repr__(self):
        return f"<HintView(user_id={self.user_id}, problem_id={self.problem_id}, level={self.hint_level})>"

    @staticmethod
    def get_penalty(hint_level: int) -> int:
        """Get score penalty for a hint level."""
        penalties = {1: 0, 2: 10, 3: 20}
        return penalties.get(hint_level, 0)

    @staticmethod
    def get_max_penalty(viewed_levels: list[int]) -> int:
        """Get maximum penalty based on all viewed hint levels."""
        if not viewed_levels:
            return 0
        max_level = max(viewed_levels)
        return HintView.get_penalty(max_level)
