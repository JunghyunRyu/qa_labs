"""Submission repository."""

from typing import Optional
from uuid import UUID
from sqlalchemy.orm import Session

from app.models.submission import Submission


class SubmissionRepository:
    """Repository for Submission model."""

    def __init__(self, db: Session):
        """Initialize repository with database session."""
        self.db = db

    def create(self, submission: Submission) -> Submission:
        """
        Create a new submission.

        Args:
            submission: Submission instance to create

        Returns:
            Created submission
        """
        self.db.add(submission)
        self.db.commit()
        self.db.refresh(submission)
        return submission

    def get_by_id(self, submission_id: UUID) -> Optional[Submission]:
        """
        Get submission by ID.

        Args:
            submission_id: Submission ID

        Returns:
            Submission if found, None otherwise
        """
        return self.db.query(Submission).filter(Submission.id == submission_id).first()

    def update(self, submission: Submission) -> Submission:
        """
        Update an existing submission.

        Args:
            submission: Submission instance to update

        Returns:
            Updated submission
        """
        self.db.commit()
        self.db.refresh(submission)
        return submission

