"""BuggyImplementation repository."""

from typing import List
from sqlalchemy.orm import Session

from app.models.buggy_implementation import BuggyImplementation


class BuggyImplementationRepository:
    """Repository for BuggyImplementation model."""

    def __init__(self, db: Session):
        """Initialize repository with database session."""
        self.db = db

    def get_by_problem_id(self, problem_id: int) -> List[BuggyImplementation]:
        """
        Get all buggy implementations for a problem.

        Args:
            problem_id: Problem ID

        Returns:
            List of buggy implementations
        """
        return (
            self.db.query(BuggyImplementation)
            .filter(BuggyImplementation.problem_id == problem_id)
            .all()
        )

    def create(self, buggy_impl: BuggyImplementation) -> BuggyImplementation:
        """
        Create a new buggy implementation.

        Args:
            buggy_impl: BuggyImplementation instance

        Returns:
            Created buggy implementation
        """
        self.db.add(buggy_impl)
        self.db.commit()
        self.db.refresh(buggy_impl)
        return buggy_impl

