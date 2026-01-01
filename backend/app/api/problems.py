"""Problems API endpoints."""

import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session

from app.models.db import get_db
from app.models.user import User
from app.models.problem import Problem
from app.models.bookmarked_problem import BookmarkedProblem
from app.models.hint_view import HintView
from app.services.problem_service import ProblemService
from app.schemas.problem import (
    ProblemListResponse,
    ProblemDetailResponse,
    ProblemStatsResponse,
    HintResponse,
    HintViewRequest,
    HintLevelResponse,
)
from app.core.dependencies import get_current_user, get_current_user_optional

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("", response_model=dict)
async def get_problems(
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(10, ge=1, le=100, description="Number of items per page"),
    difficulty: Optional[str] = Query(None, description="Filter by difficulty (e.g., 'Easy', 'Medium')"),
    domain: Optional[str] = Query(None, description="Filter by domain (common, fintech, commerce, saas, platform, content)"),
    search: Optional[str] = Query(None, description="Search in title, slug, or skills"),
    tags: Optional[str] = Query(None, description="Comma-separated skill tags to filter by"),
    sort: str = Query("difficulty-asc", description="Sort: difficulty-asc, difficulty-desc, success-rate-desc, success-rate-asc"),
    db: Session = Depends(get_db),
):
    """
    Get paginated and filtered list of problems.

    Returns:
        Dictionary with problems list, total count, and pagination info
    """
    # Parse tags from comma-separated string
    tag_list = [t.strip() for t in tags.split(",")] if tags else None

    logger.info(f"Fetching problems - page: {page}, page_size: {page_size}, difficulty: {difficulty}, domain: {domain}, search: {search}, tags: {tag_list}, sort: {sort}")
    service = ProblemService(db)
    problems, total, total_pages = service.get_problems(
        page=page,
        page_size=page_size,
        difficulty=difficulty,
        domain=domain,
        search=search,
        tags=tag_list,
        sort=sort,
    )
    logger.info(f"Found {total} problems, returning page {page}/{total_pages}")

    return {
        "problems": problems,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


@router.get("/stats", response_model=ProblemStatsResponse)
async def get_problem_stats(
    db: Session = Depends(get_db),
):
    """
    Get aggregate statistics for all problems.

    Returns:
        Total count and counts by difficulty and domain
    """
    logger.info("Fetching problem statistics")
    service = ProblemService(db)
    stats = service.get_stats()
    logger.info(f"Problem stats: total={stats.total}")
    return stats


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
            "domain": problem.domain,
            "skills": problem.skills,
            "bugs_count": len(problem.buggy_implementations),
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
    problem_id: str,
    db: Session = Depends(get_db),
):
    """
    Get problem detail by ID or slug.

    Args:
        problem_id: Problem ID (integer) or slug (string)

    Returns:
        Problem detail

    Raises:
        404: If problem not found
    """
    service = ProblemService(db)

    # Check if problem_id is numeric (ID) or string (slug)
    if problem_id.isdigit():
        logger.info(f"Fetching problem by ID: {problem_id}")
        problem = service.get_problem_by_id(int(problem_id))
    else:
        logger.info(f"Fetching problem by slug: {problem_id}")
        problem = service.get_problem_by_slug(problem_id)

    logger.info(f"Problem retrieved successfully: {problem_id}")
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


# ============================================
# Hint System Endpoints (M5-5)
# ============================================

# Hint level penalties
HINT_PENALTIES = {1: 0, 2: 10, 3: 20}


@router.get("/{problem_id}/hints", response_model=HintResponse)
async def get_hints(
    problem_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Get hints for a problem.

    Returns available hint levels and content for already-viewed hints.
    Hint level N requires viewing level N-1 first (progressive disclosure).

    Args:
        problem_id: Problem ID

    Returns:
        HintResponse with available/viewed levels and hint content
    """
    # Get problem
    problem = db.query(Problem).filter(Problem.id == problem_id).first()
    if not problem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Problem not found"
        )

    # Check if hints exist
    if not problem.hints:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hints not available for this problem"
        )

    # Get viewed levels for this user
    viewed_levels = []
    if current_user:
        views = db.query(HintView).filter(
            HintView.user_id == current_user.id,
            HintView.problem_id == problem_id,
        ).all()
        viewed_levels = sorted([v.hint_level for v in views])

    # Calculate available levels (progressive disclosure)
    # Level 1 is always available, Level N requires Level N-1 to be viewed
    available_levels = [1]
    for level in [2, 3]:
        if (level - 1) in viewed_levels:
            available_levels.append(level)

    # Build hints dict for viewed levels only
    hints_dict = {}
    for level in viewed_levels:
        level_key = f"level{level}"
        content = problem.hints.get(level_key, "")
        if content:
            hints_dict[level] = HintLevelResponse(
                level=level,
                content=content,
                penalty=HINT_PENALTIES.get(level, 0)
            )

    logger.info(f"Hints requested for problem {problem_id}, user={current_user.id if current_user else 'anonymous'}, viewed={viewed_levels}")

    return HintResponse(
        problem_id=problem_id,
        available_levels=available_levels,
        viewed_levels=viewed_levels,
        hints=hints_dict,
    )


@router.post("/{problem_id}/hints/view", response_model=HintLevelResponse)
async def view_hint(
    problem_id: int,
    request: HintViewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    View a hint level (records that the user has viewed this hint).

    Score penalties:
    - Level 1: No penalty
    - Level 2: -10 points (max score 90)
    - Level 3: -20 points (max score 80)

    Args:
        problem_id: Problem ID
        request: HintViewRequest with level

    Returns:
        HintLevelResponse with the hint content

    Raises:
        404: Problem or hints not found
        400: Level not available (must view previous level first)
    """
    level = request.level

    # Get problem
    problem = db.query(Problem).filter(Problem.id == problem_id).first()
    if not problem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Problem not found"
        )

    # Check if hints exist
    if not problem.hints:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hints not available for this problem"
        )

    # Get viewed levels
    views = db.query(HintView).filter(
        HintView.user_id == current_user.id,
        HintView.problem_id == problem_id,
    ).all()
    viewed_levels = [v.hint_level for v in views]

    # Check if already viewed
    if level in viewed_levels:
        # Return existing hint
        level_key = f"level{level}"
        content = problem.hints.get(level_key, "")
        return HintLevelResponse(
            level=level,
            content=content,
            penalty=HINT_PENALTIES.get(level, 0)
        )

    # Check progressive disclosure (Level N requires Level N-1)
    if level > 1 and (level - 1) not in viewed_levels:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Must view level {level - 1} before viewing level {level}"
        )

    # Get hint content
    level_key = f"level{level}"
    content = problem.hints.get(level_key)
    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hint level {level} not available"
        )

    # Record the view
    hint_view = HintView(
        user_id=current_user.id,
        problem_id=problem_id,
        hint_level=level,
    )
    db.add(hint_view)
    db.commit()

    logger.info(f"Hint level {level} viewed for problem {problem_id} by user {current_user.id}, penalty={HINT_PENALTIES.get(level, 0)}")

    return HintLevelResponse(
        level=level,
        content=content,
        penalty=HINT_PENALTIES.get(level, 0)
    )


@router.post("/{problem_id}/hints/generate", status_code=status.HTTP_201_CREATED)
async def generate_hints(
    problem_id: int,
    db: Session = Depends(get_db),
):
    """
    Generate AI hints for a problem (admin endpoint).

    Generates 3 levels of hints using AI and saves them to the problem.

    Args:
        problem_id: Problem ID

    Returns:
        Generated hints

    Note:
        This is an admin-only endpoint. Add authentication in production.
    """
    from app.services.hint_service import generate_and_save_hints

    # Get problem with buggy implementations
    problem = db.query(Problem).filter(Problem.id == problem_id).first()
    if not problem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Problem not found"
        )

    # Generate and save hints
    hints = generate_and_save_hints(problem, db)
    if not hints:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate hints"
        )

    logger.info(f"Generated hints for problem {problem_id}")

    return {
        "problem_id": problem_id,
        "hints": hints,
        "message": "Hints generated successfully"
    }

