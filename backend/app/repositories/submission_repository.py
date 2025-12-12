"""Submission repository."""

from typing import Optional, Tuple, List, Dict, Any
from uuid import UUID
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct, case

from app.models.submission import Submission
from app.models.problem import Problem


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

    def get_by_user_id(
        self,
        user_id: UUID,
        page: int = 1,
        page_size: int = 10,
        status: Optional[str] = None,
        days: Optional[int] = None,
    ) -> Tuple[List[Submission], int]:
        """
        Get submissions by user ID with pagination and filters.

        Args:
            user_id: User ID
            page: Page number (1-indexed)
            page_size: Number of items per page
            status: Filter by status (PENDING, RUNNING, SUCCESS, FAILURE, ERROR)
            days: Filter by recent N days (e.g., 7, 30)

        Returns:
            Tuple of (submissions list, total count)
        """
        query = self.db.query(Submission).filter(Submission.user_id == user_id)

        # Apply status filter
        if status:
            query = query.filter(Submission.status == status)

        # Apply days filter
        if days:
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            query = query.filter(Submission.created_at >= cutoff_date)

        # Get total count
        total = query.count()

        # Get paginated submissions with problem info
        submissions = (
            query.order_by(Submission.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )

        return submissions, total

    def get_user_statistics(self, user_id: UUID) -> Dict[str, Any]:
        """
        Get aggregated statistics for a user.

        Args:
            user_id: User ID

        Returns:
            Dictionary with statistics data
        """
        # 1. Base statistics
        base_stats = self.db.query(
            func.count(Submission.id).label("total_submissions"),
            func.count(distinct(Submission.problem_id)).label("total_problems_attempted"),
            func.avg(Submission.score).label("avg_score"),
            func.max(Submission.score).label("best_score"),
        ).filter(
            Submission.user_id == user_id
        ).first()

        total_submissions = base_stats.total_submissions or 0
        total_problems_attempted = base_stats.total_problems_attempted or 0
        avg_score = round(float(base_stats.avg_score or 0), 1)
        best_score = base_stats.best_score or 0

        # 2. Count problems solved (at least one SUCCESS submission)
        total_problems_solved = self.db.query(
            func.count(distinct(Submission.problem_id))
        ).filter(
            Submission.user_id == user_id,
            Submission.status == "SUCCESS"
        ).scalar() or 0

        # 3. Success rate calculation
        success_count = self.db.query(
            func.count(Submission.id)
        ).filter(
            Submission.user_id == user_id,
            Submission.status == "SUCCESS"
        ).scalar() or 0

        success_rate = round((success_count / total_submissions * 100), 1) if total_submissions > 0 else 0.0

        # 4. Statistics by difficulty (join with Problem)
        difficulty_stats_raw = self.db.query(
            Problem.difficulty,
            func.count(distinct(Submission.problem_id)).label("attempted"),
            func.count(distinct(
                case(
                    (Submission.status == "SUCCESS", Submission.problem_id),
                    else_=None
                )
            )).label("solved")
        ).join(
            Problem, Submission.problem_id == Problem.id
        ).filter(
            Submission.user_id == user_id
        ).group_by(Problem.difficulty).all()

        by_difficulty = {}
        for row in difficulty_stats_raw:
            by_difficulty[row.difficulty] = {
                "attempted": row.attempted,
                "solved": row.solved
            }

        # 5. Recent activity (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_activity_raw = self.db.query(
            func.date(Submission.created_at).label("date"),
            func.count(Submission.id).label("submissions")
        ).filter(
            Submission.user_id == user_id,
            Submission.created_at >= thirty_days_ago
        ).group_by(
            func.date(Submission.created_at)
        ).order_by(
            func.date(Submission.created_at).desc()
        ).all()

        recent_activity = [
            {"date": str(row.date), "submissions": row.submissions}
            for row in recent_activity_raw
        ]

        return {
            "total_submissions": total_submissions,
            "total_problems_attempted": total_problems_attempted,
            "total_problems_solved": total_problems_solved,
            "success_rate": success_rate,
            "avg_score": avg_score,
            "best_score": best_score,
            "by_difficulty": by_difficulty,
            "recent_activity": recent_activity
        }

