"""Admin API endpoints."""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
# slugify is not needed for now

from app.models.db import get_db
from app.models.problem import Problem
from app.models.buggy_implementation import BuggyImplementation
from app.repositories.problem_repository import ProblemRepository
from app.repositories.buggy_implementation_repository import BuggyImplementationRepository
from app.schemas.problem import (
    ProblemGenerateRequest,
    ProblemCreateWithBuggy,
    ProblemResponse,
)
from app.services.ai_problem_designer import generate_problem

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/problems/ai-generate")
async def ai_generate_problem(
    request: ProblemGenerateRequest,
):
    """
    Generate a problem using AI.

    Args:
        request: Problem generation request

    Returns:
        Generated problem JSON

    Raises:
        400: If generation fails
        500: If LLM API error occurs
    """
    try:
        result = generate_problem(
            goal=request.goal,
            language=request.language,
            testing_framework=request.testing_framework,
            skills_to_assess=request.skills_to_assess,
            difficulty=request.difficulty,
            problem_style=request.problem_style,
        )
        return result
    except ValueError as e:
        logger.error(f"Problem generation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except RuntimeError as e:
        logger.error(f"LLM API error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"LLM API error: {str(e)}",
        )
    except Exception as e:
        logger.error(f"Unexpected error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error: {str(e)}",
        )


@router.post("/problems", response_model=ProblemResponse, status_code=status.HTTP_201_CREATED)
async def create_problem(
    problem_data: ProblemCreateWithBuggy,
    db: Session = Depends(get_db),
):
    """
    Create a problem with buggy implementations.

    Args:
        problem_data: Problem data including buggy implementations
        db: Database session

    Returns:
        Created problem

    Raises:
        400: If validation fails
    """
    problem_repo = ProblemRepository(db)
    buggy_repo = BuggyImplementationRepository(db)

    # Check if slug already exists
    existing = problem_repo.get_by_slug(problem_data.slug)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Problem with slug '{problem_data.slug}' already exists",
        )

    # Create problem
    problem = Problem(
        slug=problem_data.slug,
        title=problem_data.title,
        description_md=problem_data.description_md,
        function_signature=problem_data.function_signature,
        golden_code=problem_data.golden_code,
        difficulty=problem_data.difficulty,
        skills=problem_data.skills,
    )
    problem = problem_repo.create(problem)

    # Create buggy implementations
    for buggy_data in problem_data.buggy_implementations:
        buggy_impl = BuggyImplementation(
            problem_id=problem.id,
            buggy_code=buggy_data.buggy_code,
            bug_description=buggy_data.bug_description,
            weight=buggy_data.weight,
        )
        buggy_repo.create(buggy_impl)

    db.refresh(problem)
    return problem

