"""Problems API endpoints."""

import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session

from app.models.db import get_db
from app.models.user import User
from app.models.bookmarked_problem import BookmarkedProblem
from app.services.problem_service import ProblemService
from app.schemas.problem import ProblemListResponse, ProblemDetailResponse
from app.core.dependencies import get_current_user, get_current_user_optional

logger = logging.getLogger(__name__)
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
    logger.info(f"Fetching problems - page: {page}, page_size: {page_size}")
    service = ProblemService(db)
    problems, total, total_pages = service.get_problems(page=page, page_size=page_size)
    logger.info(f"Found {total} problems, returning page {page}/{total_pages}")

    return {
        "problems": problems,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


@router.get("/bookmarked", response_model=dict)
async def get_bookmarked_problems(
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(10, ge=1, le=100, description="Number of items per page"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get paginated list of bookmarked problems for current user.

    Returns:
        Dictionary with bookmarked problems list and pagination info
    """
    logger.info(f"Fetching bookmarked problems for user {current_user.id}")

    # Get total count
    total = db.query(BookmarkedProblem).filter(
        BookmarkedProblem.user_id == current_user.id
    ).count()

    # Calculate pagination
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1
    offset = (page - 1) * page_size

    # Get bookmarked problems with problem details
    bookmarks = (
        db.query(BookmarkedProblem)
        .filter(BookmarkedProblem.user_id == current_user.id)
        .order_by(BookmarkedProblem.created_at.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )

    problems = []
    for bookmark in bookmarks:
        problem = bookmark.problem
        problems.append({
            "id": problem.id,
            "slug": problem.slug,
            "title": problem.title,
            "difficulty": problem.difficulty,
            "skills": problem.skills,
            "bookmarked_at": bookmark.created_at.isoformat() if bookmark.created_at else None,
        })

    logger.info(f"Found {total} bookmarked problems for user {current_user.id}")

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
    logger.info(f"Fetching problem {problem_id}")
    service = ProblemService(db)
    problem = service.get_problem_by_id(problem_id)
    logger.info(f"Problem {problem_id} retrieved successfully")
    return problem


@router.post("/{problem_id}/bookmark", status_code=status.HTTP_201_CREATED)
async def add_bookmark(
    problem_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Add a problem to user's bookmarks.

    Args:
        problem_id: Problem ID to bookmark

    Returns:
        Success message

    Raises:
        404: If problem not found
        409: If already bookmarked
    """
    logger.info(f"Adding bookmark for problem {problem_id} by user {current_user.id}")

    # Check if problem exists
    service = ProblemService(db)
    service.get_problem_by_id(problem_id)  # Raises 404 if not found

    # Check if already bookmarked
    existing = db.query(BookmarkedProblem).filter(
        BookmarkedProblem.user_id == current_user.id,
        BookmarkedProblem.problem_id == problem_id,
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Problem already bookmarked"
        )

    # Create bookmark
    bookmark = BookmarkedProblem(
        user_id=current_user.id,
        problem_id=problem_id,
    )
    db.add(bookmark)
    db.commit()

    logger.info(f"Bookmark added for problem {problem_id} by user {current_user.id}")
    return {"message": "Problem bookmarked successfully"}


@router.delete("/{problem_id}/bookmark", status_code=status.HTTP_200_OK)
async def remove_bookmark(
    problem_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Remove a problem from user's bookmarks.

    Args:
        problem_id: Problem ID to unbookmark

    Returns:
        Success message

    Raises:
        404: If bookmark not found
    """
    logger.info(f"Removing bookmark for problem {problem_id} by user {current_user.id}")

    # Find and delete bookmark
    bookmark = db.query(BookmarkedProblem).filter(
        BookmarkedProblem.user_id == current_user.id,
        BookmarkedProblem.problem_id == problem_id,
    ).first()

    if not bookmark:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bookmark not found"
        )

    db.delete(bookmark)
    db.commit()

    logger.info(f"Bookmark removed for problem {problem_id} by user {current_user.id}")
    return {"message": "Bookmark removed successfully"}


@router.get("/{problem_id}/bookmark/status")
async def get_bookmark_status(
    problem_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Check if a problem is bookmarked by current user.

    Args:
        problem_id: Problem ID to check

    Returns:
        Bookmark status
    """
    if not current_user:
        return {"is_bookmarked": False}

    bookmark = db.query(BookmarkedProblem).filter(
        BookmarkedProblem.user_id == current_user.id,
        BookmarkedProblem.problem_id == problem_id,
    ).first()

    return {"is_bookmarked": bookmark is not None}

