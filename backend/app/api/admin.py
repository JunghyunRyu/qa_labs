"""Admin API endpoints."""

import logging
from typing import Optional, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.rate_limiter import limiter
from app.core.dependencies import require_admin_key
from app.models.db import get_db
from app.models.problem import Problem
from app.models.buggy_implementation import BuggyImplementation
from app.repositories.problem_repository import ProblemRepository
from app.repositories.submission_repository import SubmissionRepository
from app.repositories.buggy_implementation_repository import BuggyImplementationRepository
from app.schemas.problem import (
    ProblemGenerateRequest,
    ProblemCreateWithBuggy,
    ProblemResponse,
)
from app.schemas.test_quality import TestQualityAnalysis
from app.services.ai_problem_designer import generate_problem
from app.services.ai_test_generator import (
    generate_tests_for_missing_coverage,
    TestGenerationResult,
)
from app.services.test_quality_analyzer import TestQualityAnalyzer

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/problems/ai-generate")
@limiter.limit(settings.RATE_LIMIT_ADMIN)
async def ai_generate_problem(
    request: Request,
    problem_request: ProblemGenerateRequest,
):
    """
    Generate a problem using AI.

    Args:
        request: FastAPI request object (for rate limiting)
        problem_request: Problem generation request

    Returns:
        Generated problem JSON

    Raises:
        400: If generation fails
        500: If LLM API error occurs
    """
    try:
        result = generate_problem(
            goal=problem_request.goal,
            language=problem_request.language,
            testing_framework=problem_request.testing_framework,
            skills_to_assess=problem_request.skills_to_assess,
            difficulty=problem_request.difficulty,
            problem_style=problem_request.problem_style,
            use_reasoning=problem_request.use_reasoning,
            reasoning_effort=problem_request.reasoning_effort,
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
@limiter.limit(settings.RATE_LIMIT_ADMIN_CREATE)
async def create_problem(
    request: Request,
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
        domain=problem_data.domain,
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


@router.post(
    "/test-quality/generate-tests/{problem_id}",
    response_model=TestGenerationResult,
)
@limiter.limit(settings.RATE_LIMIT_ADMIN)
async def generate_tests_for_problem(
    request: Request,
    problem_id: int,
    max_tests: int = 5,
    submission_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
):
    """
    Generate tests to cover missing quality categories.

    Phase 3-1: Admin용 AI 테스트 생성.
    부족한 테스트 커버리지를 채우는 pytest 코드를 생성합니다.

    Args:
        request: FastAPI request object (for rate limiting)
        problem_id: Problem ID to generate tests for
        max_tests: Maximum number of tests to generate (default: 5, max: 10)
        submission_id: Optional submission ID to use as reference.
                       If provided, uses the submission's analysis.
                       If not, analyzes the problem's golden code.
        db: Database session

    Returns:
        Generated tests with code and coverage improvement info

    Raises:
        404: If problem not found
        400: If test generation fails
    """
    # Limit max_tests
    max_tests = min(max_tests, 10)

    problem_repo = ProblemRepository(db)
    problem = problem_repo.get_by_id(problem_id)

    if not problem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Problem {problem_id} not found",
        )

    # Get current analysis
    current_analysis = None

    if submission_id:
        # Use submission's analysis
        submission_repo = SubmissionRepository(db)
        submission = submission_repo.get_by_id(submission_id)

        if not submission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Submission {submission_id} not found",
            )

        if submission.test_quality_analysis:
            current_analysis = TestQualityAnalysis(**submission.test_quality_analysis)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Submission {submission_id} has no quality analysis",
            )
    else:
        # Analyze golden code to get baseline
        analyzer = TestQualityAnalyzer()
        try:
            result = analyzer.analyze(problem.golden_code)
            current_analysis = result.analysis
        except Exception as e:
            logger.warning(f"Failed to analyze golden code: {e}")
            # Create empty analysis if golden code analysis fails
            current_analysis = TestQualityAnalysis(
                parser_version="1.0.0",
                scoring_version="1.0.0",
                test_count=0,
                effective_test_count=0,
                value_types=[],
                input_diversities=[],
                test_purposes=[],
                antipatterns=[],
                per_test=[],
                overall_confidence=0.0,
            )

    try:
        result = generate_tests_for_missing_coverage(
            function_signature=problem.function_signature,
            golden_code=problem.golden_code,
            problem_description=problem.description_md or problem.title,
            current_analysis=current_analysis,
            max_tests=max_tests,
        )

        logger.info(
            f"[TEST_GENERATION_SUCCESS] problem_id={problem_id} "
            f"tests_count={len(result.generated_tests)}"
        )

        return result

    except Exception as e:
        logger.error(
            f"[TEST_GENERATION_ERROR] problem_id={problem_id} error={str(e)}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Test generation failed: {str(e)}",
        )


# ============================================
# Admin Protected Endpoints (X-Admin-Key 필요)
# ============================================

class ShortDescriptionUpdate(BaseModel):
    """Short description update request schema."""
    id: int
    short_description: str


class BulkUpdateResult(BaseModel):
    """Bulk update result schema."""
    updated: List[int]
    failed: List[int]


@router.patch("/problems/short-descriptions", response_model=BulkUpdateResult)
async def bulk_update_short_descriptions(
    updates: List[ShortDescriptionUpdate],
    admin_key: str = Depends(require_admin_key),
    db: Session = Depends(get_db),
):
    """
    Bulk update short_description for multiple problems.

    Requires X-Admin-Key header for authentication.
    This endpoint is designed to be called from a local machine (UTF-8 environment)
    to bypass SSM terminal encoding issues.

    Args:
        updates: List of {id, short_description} objects
        admin_key: Admin authentication key (via X-Admin-Key header)
        db: Database session

    Returns:
        {updated: [list of updated IDs], failed: [list of failed IDs]}

    Example:
        curl -X PATCH "https://api.example.com/api/admin/problems/short-descriptions" \\
            -H "Content-Type: application/json" \\
            -H "X-Admin-Key: your-secret-key" \\
            -d '[{"id": 1, "short_description": "원화 가격 표시 함수를 테스트합니다."}]'
    """
    problem_repo = ProblemRepository(db)
    result = BulkUpdateResult(updated=[], failed=[])

    for item in updates:
        try:
            success = problem_repo.update_short_description(
                problem_id=item.id,
                short_description=item.short_description
            )
            if success:
                result.updated.append(item.id)
            else:
                result.failed.append(item.id)
        except Exception as e:
            logger.error(f"Failed to update problem {item.id}: {e}")
            result.failed.append(item.id)

    logger.info(
        f"[BULK_UPDATE_SHORT_DESC] updated={len(result.updated)} failed={len(result.failed)}"
    )

    return result


class SkillsUpdate(BaseModel):
    """Skills update request schema."""
    id: int
    skills: List[str]


@router.patch("/problems/skills", response_model=BulkUpdateResult)
async def bulk_update_skills(
    updates: List[SkillsUpdate],
    admin_key: str = Depends(require_admin_key),
    db: Session = Depends(get_db),
):
    """
    Bulk update skills (tags) for multiple problems.

    Requires X-Admin-Key header for authentication.

    Args:
        updates: List of {id, skills} objects
        admin_key: Admin authentication key (via X-Admin-Key header)
        db: Database session

    Returns:
        {updated: [list of updated IDs], failed: [list of failed IDs]}
    """
    problem_repo = ProblemRepository(db)
    result = BulkUpdateResult(updated=[], failed=[])

    for item in updates:
        try:
            success = problem_repo.update_skills(
                problem_id=item.id,
                skills=item.skills
            )
            if success:
                result.updated.append(item.id)
            else:
                result.failed.append(item.id)
        except Exception as e:
            logger.error(f"Failed to update skills for problem {item.id}: {e}")
            result.failed.append(item.id)

    logger.info(
        f"[BULK_UPDATE_SKILLS] updated={len(result.updated)} failed={len(result.failed)}"
    )

    return result

