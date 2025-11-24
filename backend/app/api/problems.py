"""Problems API endpoints."""

from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.models.db import get_db
from app.services.problem_service import ProblemService
from app.schemas.problem import ProblemListResponse, ProblemDetailResponse


router = APIRouter()


@router.get("", response_model=dict)
async def get_problems(
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(10, ge=1, le=100, description="Number of items per page"),
    db: Session = Depends(get_db),
):
    """
    Get paginated list of problems.

    Returns:
        Dictionary with problems list, total count, and pagination info
    """
    service = ProblemService(db)
    problems, total, total_pages = service.get_problems(page=page, page_size=page_size)

    return {
        "problems": problems,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


@router.get("/{problem_id}", response_model=ProblemDetailResponse)
async def get_problem(
    problem_id: int,
    db: Session = Depends(get_db),
):
    """
    Get problem detail by ID.

    Args:
        problem_id: Problem ID

    Returns:
        Problem detail

    Raises:
        404: If problem not found
    """
    service = ProblemService(db)
    return service.get_problem_by_id(problem_id)

