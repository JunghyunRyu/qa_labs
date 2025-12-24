"""Progress service for user growth dashboard."""

from datetime import datetime, timedelta, timezone
from typing import List, Optional
from uuid import UUID

from sqlalchemy import func, case, text
from sqlalchemy.orm import Session

from app.models.submission import Submission
from app.models.problem import Problem
from app.schemas.progress import (
    DifficultyStats,
    DomainStats,
    SkillStats,
    ProgressSummaryResponse,
    TimelineEntry,
    ProgressTimelineResponse,
)


class ProgressService:
    """Service for user progress statistics."""

    def __init__(self, db: Session):
        self.db = db

    def get_summary(
        self, user_id: Optional[UUID] = None, anonymous_id: Optional[str] = None
    ) -> ProgressSummaryResponse:
        """Get user progress summary.

        Args:
            user_id: User ID for authenticated users
            anonymous_id: Anonymous ID for guest users

        Returns:
            ProgressSummaryResponse with aggregated statistics
        """
        # Build user filter
        user_filter = self._build_user_filter(user_id, anonymous_id)

        # Get basic statistics
        stats = (
            self.db.query(
                func.count(Submission.id).label("total"),
                func.count(case((Submission.status == "SUCCESS", 1))).label("success"),
                func.avg(Submission.score).label("avg_score"),
                func.max(Submission.score).label("best_score"),
                func.avg(
                    case(
                        (
                            Submission.total_mutants > 0,
                            Submission.killed_mutants * 1.0 / Submission.total_mutants,
                        ),
                        else_=None,
                    )
                ).label("avg_kill_ratio"),
            )
            .filter(
                user_filter,
                Submission.status.in_(["SUCCESS", "FAILURE"]),
            )
            .first()
        )

        # Get recent 10 submissions average
        recent_scores = (
            self.db.query(Submission.score)
            .filter(
                user_filter,
                Submission.status.in_(["SUCCESS", "FAILURE"]),
            )
            .order_by(Submission.created_at.desc())
            .limit(10)
            .all()
        )
        recent_avg = (
            sum(s.score for s in recent_scores) / len(recent_scores)
            if recent_scores
            else 0
        )

        return ProgressSummaryResponse(
            total_submissions=stats.total or 0,
            success_submissions=stats.success or 0,
            avg_score=round(stats.avg_score or 0, 1),
            avg_kill_ratio=round(stats.avg_kill_ratio or 0, 2),
            best_score=stats.best_score or 0,
            recent_avg_score=round(recent_avg, 1),
            difficulty_stats=self.get_difficulty_stats(user_id, anonymous_id),
            domain_stats=self.get_domain_stats(user_id, anonymous_id),
            skill_stats=self.get_skill_stats(user_id, anonymous_id),
        )

    def get_difficulty_stats(
        self, user_id: Optional[UUID] = None, anonymous_id: Optional[str] = None
    ) -> List[DifficultyStats]:
        """Get statistics grouped by difficulty level."""
        user_filter = self._build_user_filter(user_id, anonymous_id)

        results = (
            self.db.query(
                Problem.difficulty,
                func.count(Submission.id).label("submission_count"),
                func.avg(Submission.score).label("avg_score"),
                func.count(case((Submission.status == "SUCCESS", 1))).label(
                    "success_count"
                ),
            )
            .join(Submission, Problem.id == Submission.problem_id)
            .filter(
                user_filter,
                Submission.status.in_(["SUCCESS", "FAILURE"]),
            )
            .group_by(Problem.difficulty)
            .all()
        )

        # Define difficulty order
        difficulty_order = {"Very Easy": 0, "Easy": 1, "Medium": 2, "Hard": 3}

        stats = [
            DifficultyStats(
                difficulty=row.difficulty,
                submission_count=row.submission_count,
                avg_score=round(row.avg_score or 0, 1),
                success_rate=round(
                    row.success_count / row.submission_count
                    if row.submission_count > 0
                    else 0,
                    2,
                ),
            )
            for row in results
        ]

        # Sort by difficulty order
        return sorted(stats, key=lambda x: difficulty_order.get(x.difficulty, 99))

    def get_domain_stats(
        self, user_id: Optional[UUID] = None, anonymous_id: Optional[str] = None
    ) -> List[DomainStats]:
        """Get statistics grouped by domain."""
        user_filter = self._build_user_filter(user_id, anonymous_id)

        results = (
            self.db.query(
                Problem.domain,
                func.count(Submission.id).label("submission_count"),
                func.avg(Submission.score).label("avg_score"),
            )
            .join(Submission, Problem.id == Submission.problem_id)
            .filter(
                user_filter,
                Submission.status.in_(["SUCCESS", "FAILURE"]),
            )
            .group_by(Problem.domain)
            .order_by(func.count(Submission.id).desc())
            .all()
        )

        return [
            DomainStats(
                domain=row.domain,
                submission_count=row.submission_count,
                avg_score=round(row.avg_score or 0, 1),
            )
            for row in results
        ]

    def get_skill_stats(
        self, user_id: Optional[UUID] = None, anonymous_id: Optional[str] = None
    ) -> List[SkillStats]:
        """Get statistics grouped by skill/tag.

        Uses PostgreSQL's jsonb_array_elements_text to unpack the skills array.
        """
        # Determine which filter to use
        if user_id:
            user_condition = "s.user_id = :user_id"
            params = {"user_id": str(user_id)}
        elif anonymous_id:
            user_condition = "s.anonymous_id = :anonymous_id"
            params = {"anonymous_id": anonymous_id}
        else:
            return []

        query = text(
            f"""
            SELECT
                skill,
                COUNT(s.id) as submission_count,
                AVG(s.score) as avg_score
            FROM problems p
            CROSS JOIN LATERAL jsonb_array_elements_text(p.skills) as skill
            JOIN submissions s ON p.id = s.problem_id
            WHERE {user_condition}
              AND s.status IN ('SUCCESS', 'FAILURE')
              AND p.skills IS NOT NULL
            GROUP BY skill
            ORDER BY submission_count DESC
            LIMIT 20
            """
        )

        try:
            results = self.db.execute(query, params).fetchall()
            return [
                SkillStats(
                    skill=row.skill,
                    submission_count=row.submission_count,
                    avg_score=round(row.avg_score or 0, 1),
                )
                for row in results
            ]
        except Exception:
            # If skills column is empty or query fails, return empty list
            return []

    def get_timeline(
        self,
        range_str: str = "30d",
        user_id: Optional[UUID] = None,
        anonymous_id: Optional[str] = None,
    ) -> ProgressTimelineResponse:
        """Get progress timeline data.

        Args:
            range_str: Time range - "7d", "30d", "90d", or "all"
            user_id: User ID for authenticated users
            anonymous_id: Anonymous ID for guest users

        Returns:
            ProgressTimelineResponse with daily aggregated data
        """
        user_filter = self._build_user_filter(user_id, anonymous_id)

        # Calculate date range
        days_map = {"7d": 7, "30d": 30, "90d": 90, "all": 365 * 10}
        days = days_map.get(range_str, 30)
        start_date = datetime.now(timezone.utc) - timedelta(days=days)

        # Query for timeline data
        date_filter = Submission.created_at >= start_date if range_str != "all" else True

        results = (
            self.db.query(
                func.date(Submission.created_at).label("date"),
                func.count(Submission.id).label("submission_count"),
                func.avg(Submission.score).label("avg_score"),
                func.avg(
                    case(
                        (
                            Submission.total_mutants > 0,
                            Submission.killed_mutants * 1.0 / Submission.total_mutants,
                        ),
                        else_=None,
                    )
                ).label("avg_kill_ratio"),
            )
            .filter(
                user_filter,
                Submission.status.in_(["SUCCESS", "FAILURE"]),
                date_filter,
            )
            .group_by(func.date(Submission.created_at))
            .order_by(func.date(Submission.created_at))
            .all()
        )

        entries = [
            TimelineEntry(
                date=str(row.date),
                submission_count=row.submission_count,
                avg_score=round(row.avg_score or 0, 1),
                avg_kill_ratio=round(row.avg_kill_ratio or 0, 2),
            )
            for row in results
        ]

        return ProgressTimelineResponse(
            entries=entries,
            range=range_str,
            total_submissions=sum(e.submission_count for e in entries),
        )

    def _build_user_filter(
        self, user_id: Optional[UUID] = None, anonymous_id: Optional[str] = None
    ):
        """Build SQLAlchemy filter for user identification."""
        if user_id:
            return Submission.user_id == user_id
        elif anonymous_id:
            return Submission.anonymous_id == anonymous_id
        else:
            # This should not happen, but return a false condition
            return Submission.id == None  # noqa: E711

    def has_submissions(
        self, user_id: Optional[UUID] = None, anonymous_id: Optional[str] = None
    ) -> bool:
        """Check if user has any submissions."""
        user_filter = self._build_user_filter(user_id, anonymous_id)
        count = (
            self.db.query(func.count(Submission.id))
            .filter(user_filter)
            .scalar()
        )
        return count > 0
