"""Problem service."""

from typing import Optional, Tuple, List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.problem_repository import ProblemRepository
from app.models.problem import Problem
from app.schemas.problem import (
    ProblemListResponse,
    ProblemDetailResponse,
    ProblemCreate,
    BuggyImplementationResponse,
)


class ProblemService:
    """Service for problem business logic."""

    def __init__(self, db: Session):
        """Initialize service with database session."""
        self.repository = ProblemRepository(db)

    def create_problem(self, problem_in: ProblemCreate) -> ProblemDetailResponse:
        """
        Create a new problem and return its detail.
        """
        problem = self.repository.create(problem_in)

        return ProblemDetailResponse(
            id=problem.id,
            slug=problem.slug,
            title=problem.title,
            description_md=problem.description_md,
            function_signature=problem.function_signature,
            golden_code=problem.golden_code,
            difficulty=problem.difficulty,
            skills=problem.skills,
            created_at=problem.created_at,
        )    
    
    
    def get_problems(
        self,
        page: int = 1,
        page_size: int = 10,
        difficulty: Optional[str] = None,
        search: Optional[str] = None,
        tags: Optional[List[str]] = None,
    ) -> Tuple[List[ProblemListResponse], int, int]:
        """
        Get paginated and filtered list of problems.

        Args:
            page: Page number (1-indexed)
            page_size: Number of items per page
            difficulty: Filter by difficulty level (e.g., "Easy", "Medium")
            search: Search query for title, slug, or skills
            tags: Filter by skill tags (all tags must match)

        Returns:
            Tuple of (list of problems, total count, total pages)
        """
        if page < 1:
            page = 1
        if page_size < 1:
            page_size = 10
        if page_size > 100:
            page_size = 100

        skip = (page - 1) * page_size
        problems, total = self.repository.get_all(
            skip=skip,
            limit=page_size,
            difficulty=difficulty,
            search=search,
            tags=tags,
        )

        total_pages = (total + page_size - 1) // page_size if total > 0 else 0

        problem_list = [
            ProblemListResponse(
                id=p.id,
                slug=p.slug,
                title=p.title,
                difficulty=p.difficulty,
                skills=p.skills,
                description_md=p.description_md,  # Include description for preview
            )
            for p in problems
        ]

        return problem_list, total, total_pages

    def get_problem_by_id(self, problem_id: int) -> ProblemDetailResponse:
        """
        Get problem detail by ID.

        Args:
            problem_id: Problem ID

        Returns:
            Problem detail

        Raises:
            HTTPException: If problem not found
        """
        problem = self.repository.get_by_id(problem_id)
        if not problem:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Problem with id {problem_id} not found",
            )

        # Convert buggy_implementations to response schema
        buggy_impl_responses = [
            BuggyImplementationResponse(
                id=bi.id,
                buggy_code=bi.buggy_code,
                bug_description=bi.bug_description,
                weight=bi.weight,
            )
            for bi in problem.buggy_implementations
        ]

        return ProblemDetailResponse(
            id=problem.id,
            slug=problem.slug,
            title=problem.title,
            description_md=problem.description_md,
            function_signature=problem.function_signature,
            golden_code=problem.golden_code,
            difficulty=problem.difficulty,
            skills=problem.skills,
            created_at=problem.created_at,
            buggy_implementations=buggy_impl_responses,
        )

    def get_problem_by_slug(self, slug: str) -> ProblemDetailResponse:
        """
        Get problem detail by slug.

        Args:
            slug: Problem slug

        Returns:
            Problem detail

        Raises:
            HTTPException: If problem not found
        """
        problem = self.repository.get_by_slug(slug)
        if not problem:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Problem with slug '{slug}' not found",
            )

        # Convert buggy_implementations to response schema
        buggy_impl_responses = [
            BuggyImplementationResponse(
                id=bi.id,
                buggy_code=bi.buggy_code,
                bug_description=bi.bug_description,
                weight=bi.weight,
            )
            for bi in problem.buggy_implementations
        ]

        return ProblemDetailResponse(
            id=problem.id,
            slug=problem.slug,
            title=problem.title,
            description_md=problem.description_md,
            function_signature=problem.function_signature,
            golden_code=problem.golden_code,
            difficulty=problem.difficulty,
            skills=problem.skills,
            created_at=problem.created_at,
            buggy_implementations=buggy_impl_responses,
        )

