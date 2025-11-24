"""Problem repository."""

from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.problem import Problem


class ProblemRepository:
    """Repository for Problem model."""

    def __init__(self, db: Session):
        """Initialize repository with database session."""
        self.db = db

    def get_all(
        self, skip: int = 0, limit: int = 10
    ) -> Tuple[List[Problem], int]:
        """
        Get all problems with pagination.

        Args:
            skip: Number of records to skip
            limit: Maximum number of records to return

        Returns:
            Tuple of (list of problems, total count)
        """
        total = self.db.query(func.count(Problem.id)).scalar()
        problems = (
            self.db.query(Problem)
            .order_by(Problem.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        return problems, total

    def get_by_id(self, problem_id: int) -> Optional[Problem]:
        """
        Get problem by ID.

        Args:
            problem_id: Problem ID

        Returns:
            Problem if found, None otherwise
        """
        return self.db.query(Problem).filter(Problem.id == problem_id).first()

    def get_by_slug(self, slug: str) -> Optional[Problem]:
        """
        Get problem by slug.

        Args:
            slug: Problem slug

        Returns:
            Problem if found, None otherwise
        """
        return self.db.query(Problem).filter(Problem.slug == slug).first()

