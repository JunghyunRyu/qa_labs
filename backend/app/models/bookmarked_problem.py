"""Bookmarked problem model."""

from sqlalchemy import Column, DateTime, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.models.db import Base


class BookmarkedProblem(Base):
    """Bookmarked problem model - links users to their bookmarked problems."""

    __tablename__ = "bookmarked_problems"
    __table_args__ = (
        UniqueConstraint("user_id", "problem_id", name="uq_user_problem_bookmark"),
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
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", backref="bookmarked_problems")
    problem = relationship("Problem", backref="bookmarked_by")

    def __repr__(self):
        return f"<BookmarkedProblem(user_id={self.user_id}, problem_id={self.problem_id})>"
