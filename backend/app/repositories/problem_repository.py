"""Problem repository."""

from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.problem import Problem
from app.schemas.problem import ProblemCreate

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

    def create(self, problem_in: ProblemCreate) -> Problem:
        """
        Create a new Problem row.

        Note: buggy_implementations 저장은 나중에 별도 로직으로 확장해도 됨.
        """
        problem = Problem(
            slug=problem_in.slug,
            title=problem_in.title,
            description_md=problem_in.description_md,
            function_signature=problem_in.function_signature,
            golden_code=problem_in.golden_code,
            difficulty=problem_in.difficulty,
            skills=problem_in.skills,  # JSON 컬럼이면 리스트 그대로, Text면 ",".join(...) 해야 함
        )

        self.db.add(problem)
        self.db.commit()
        self.db.refresh(problem)
        return problem
