"""Test Quality API endpoints.

Phase 2: 테스트 품질 분석 API.
"""

import logging
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.rate_limiter import limiter
from app.models.db import get_db
from app.models.user import User
from app.repositories.problem_repository import ProblemRepository
from app.repositories.submission_repository import SubmissionRepository
from app.repositories.test_quality_repository import TestQualityRepository
from app.schemas.test_quality import (
    AnalysisRunResponse,
    AnalysisScope,
    AnalysisStatus,
    QualityStatisticsResponse,
    SubmissionQualityResponse,
    ProblemRubricResponse,
    TestQualityAnalysis,
)
from app.services.test_quality_analyzer import (
    TestQualityAnalyzer,
    PARSER_VERSION,
    SCORING_VERSION,
)
from app.services.test_hint_generator import (
    generate_hints_from_analysis,
    HintGenerationResult,
)
from app.core.dependencies import get_current_user_optional

logger = logging.getLogger(__name__)

router = APIRouter()


# =============================================================================
# User Endpoints
# =============================================================================


@router.get(
    "/submissions/{submission_id}/quality",
    response_model=SubmissionQualityResponse,
)
async def get_submission_quality(
    submission_id: UUID,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Get test quality analysis for a submission.

    Args:
        submission_id: Submission UUID
        db: Database session
        current_user: Authenticated user (optional)

    Returns:
        Submission quality analysis

    Raises:
        404: If submission not found or quality not analyzed
    """
    quality_repo = TestQualityRepository(db)
    result = quality_repo.get_submission_quality(submission_id)

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Quality analysis for submission {submission_id} not found",
        )

    return SubmissionQualityResponse(
        submission_id=result["submission_id"],
        test_quality_score=result["test_quality_score"],
        test_quality_grade=result["test_quality_grade"],
        test_quality_analysis=result["test_quality_analysis"],
    )


@router.post("/analyze")
@limiter.limit(settings.RATE_LIMIT_DEFAULT)
async def analyze_code(
    request: Request,
    code: str,
):
    """
    Analyze test code quality (for testing purposes).

    This endpoint allows direct code analysis without creating a submission.
    Useful for testing and debugging.

    Args:
        request: FastAPI request object (for rate limiting)
        code: Test code to analyze

    Returns:
        Analysis result with score, grade, and breakdown
    """
    try:
        analyzer = TestQualityAnalyzer()
        result = analyzer.analyze(code)

        return {
            "score": result.score,
            "grade": result.grade.value,
            "source_hash": result.source_hash,
            "analysis": result.analysis.model_dump(),
        }
    except Exception as e:
        logger.error(f"Code analysis failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Analysis failed: {str(e)}",
        )


@router.get(
    "/submissions/{submission_id}/hints",
    response_model=HintGenerationResult,
)
@limiter.limit(settings.RATE_LIMIT_DEFAULT)
async def get_test_improvement_hints(
    request: Request,
    submission_id: UUID,
    max_hints: int = 3,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Get test improvement hints for a submission.

    Phase 3-2: 사용자용 텍스트 힌트 생성.
    코드 없이 텍스트 힌트만 제공하여 사용자의 사고를 유도합니다.

    Args:
        request: FastAPI request object (for rate limiting)
        submission_id: Submission UUID
        max_hints: Maximum number of hints to return (default: 3, max: 5)
        db: Database session
        current_user: Authenticated user (optional)

    Returns:
        Hints with summary, improvement suggestions, and encouragement

    Raises:
        404: If submission not found or quality not analyzed
        400: If hint generation fails
    """
    # Limit max_hints to prevent abuse
    max_hints = min(max_hints, 5)

    # Get submission with quality analysis
    submission_repo = SubmissionRepository(db)
    submission = submission_repo.get_by_id(submission_id)

    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Submission {submission_id} not found",
        )

    # Check if quality analysis exists
    if not submission.test_quality_analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Quality analysis for submission {submission_id} not found. "
            "Please wait for analysis to complete.",
        )

    # Get problem title for context
    problem_repo = ProblemRepository(db)
    problem = problem_repo.get_by_id(submission.problem_id)
    problem_title = problem.title if problem else "Unknown Problem"

    try:
        # Parse analysis from JSONB
        analysis = TestQualityAnalysis(**submission.test_quality_analysis)

        # Generate hints
        result = generate_hints_from_analysis(
            analysis=analysis,
            problem_title=problem_title,
            max_hints=max_hints,
        )

        logger.info(
            f"[HINT_GENERATION_SUCCESS] submission_id={submission_id} "
            f"hints_count={len(result.hints)}"
        )

        return result

    except Exception as e:
        logger.error(
            f"[HINT_GENERATION_ERROR] submission_id={submission_id} error={str(e)}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Hint generation failed: {str(e)}",
        )


# =============================================================================
# Admin Endpoints
# =============================================================================


@router.post(
    "/admin/analyze-submission/{submission_id}",
    response_model=SubmissionQualityResponse,
)
@limiter.limit(settings.RATE_LIMIT_ADMIN)
async def admin_analyze_submission(
    request: Request,
    submission_id: UUID,
    force: bool = False,
    db: Session = Depends(get_db),
):
    """
    Manually trigger test quality analysis for a submission.

    Admin endpoint for manual analysis.

    Args:
        request: FastAPI request object (for rate limiting)
        submission_id: Submission UUID to analyze
        force: Force re-analysis even if already analyzed
        db: Database session

    Returns:
        Analysis result

    Raises:
        404: If submission not found
        400: If analysis fails
    """
    submission_repo = SubmissionRepository(db)
    quality_repo = TestQualityRepository(db)

    # Get submission
    submission = submission_repo.get_by_id(submission_id)
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Submission {submission_id} not found",
        )

    # Check for existing analysis (unless force=True)
    if not force and submission.test_quality_score is not None:
        return SubmissionQualityResponse(
            submission_id=submission.id,
            test_quality_score=submission.test_quality_score,
            test_quality_grade=submission.test_quality_grade,
            test_quality_analysis=submission.test_quality_analysis,
        )

    # Check for duplicate analysis
    if not force:
        existing = quality_repo.check_duplicate_analysis(
            source_hash="",  # Will be calculated during analysis
            parser_version=PARSER_VERSION,
            scoring_version=SCORING_VERSION,
            submission_id=submission_id,
        )
        if existing and existing.status == "SUCCESS":
            logger.info(
                f"[QUALITY_ANALYSIS_CACHED] submission_id={submission_id} "
                f"run_id={existing.id}"
            )
            return SubmissionQualityResponse(
                submission_id=submission.id,
                test_quality_score=submission.test_quality_score,
                test_quality_grade=submission.test_quality_grade,
                test_quality_analysis=submission.test_quality_analysis,
            )

    # Create analysis run
    run = quality_repo.create_analysis_run(
        scope=AnalysisScope.SUBMISSION.value,
        parser_version=PARSER_VERSION,
        scoring_version=SCORING_VERSION,
        source_code=submission.code,
        submission_id=submission_id,
    )

    try:
        # Update status to RUNNING
        quality_repo.update_analysis_run_status(run.id, AnalysisStatus.RUNNING.value)

        # Analyze
        analyzer = TestQualityAnalyzer()
        result = analyzer.analyze(submission.code)

        # Update submission quality
        quality_repo.update_submission_quality(
            submission_id=submission_id,
            score=result.score,
            grade=result.grade.value,
            analysis=result.analysis.model_dump(),
        )

        # Update analysis run status
        quality_repo.update_analysis_run_status(
            run_id=run.id,
            status=AnalysisStatus.SUCCESS.value,
            confidence_score=result.analysis.overall_confidence,
            result=result.analysis.model_dump(),
        )

        logger.info(
            f"[QUALITY_ANALYSIS_SUCCESS] submission_id={submission_id} "
            f"run_id={run.id} score={result.score} grade={result.grade.value}"
        )

        return SubmissionQualityResponse(
            submission_id=submission_id,
            test_quality_score=result.score,
            test_quality_grade=result.grade.value,
            test_quality_analysis=result.analysis.model_dump(),
        )

    except Exception as e:
        # Update analysis run with error
        quality_repo.update_analysis_run_status(
            run_id=run.id,
            status=AnalysisStatus.ERROR.value,
            error_message=str(e),
        )

        logger.error(
            f"[QUALITY_ANALYSIS_ERROR] submission_id={submission_id} "
            f"run_id={run.id} error={str(e)}",
            exc_info=True,
        )

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Analysis failed: {str(e)}",
        )


@router.post(
    "/admin/analyze-problem/{problem_id}",
    response_model=ProblemRubricResponse,
)
@limiter.limit(settings.RATE_LIMIT_ADMIN)
async def admin_analyze_problem_rubric(
    request: Request,
    problem_id: int,
    force: bool = False,
    db: Session = Depends(get_db),
):
    """
    Analyze problem's golden code to generate rubric.

    Admin endpoint for problem rubric generation.

    Args:
        request: FastAPI request object (for rate limiting)
        problem_id: Problem ID to analyze
        force: Force re-analysis even if already analyzed
        db: Database session

    Returns:
        Problem rubric analysis

    Raises:
        404: If problem not found
        400: If analysis fails
    """
    problem_repo = ProblemRepository(db)
    quality_repo = TestQualityRepository(db)

    # Get problem
    problem = problem_repo.get_by_id(problem_id)
    if not problem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Problem {problem_id} not found",
        )

    # Check for existing analysis (unless force=True)
    if not force and problem.rubric_score is not None:
        return ProblemRubricResponse(
            problem_id=problem.id,
            rubric_score=problem.rubric_score,
            rubric_analysis=problem.rubric_analysis,
        )

    # Create analysis run
    run = quality_repo.create_analysis_run(
        scope=AnalysisScope.PROBLEM_RUBRIC.value,
        parser_version=PARSER_VERSION,
        scoring_version=SCORING_VERSION,
        source_code=problem.golden_code,
        problem_id=problem_id,
    )

    try:
        # Update status to RUNNING
        quality_repo.update_analysis_run_status(run.id, AnalysisStatus.RUNNING.value)

        # Analyze golden code
        analyzer = TestQualityAnalyzer()
        result = analyzer.analyze(problem.golden_code)

        # Create rubric analysis (expected categories from golden code)
        rubric_analysis = {
            "parser_version": PARSER_VERSION,
            "scoring_version": SCORING_VERSION,
            "expected_categories": {
                "value_types": result.analysis.value_types,
                "input_diversities": result.analysis.input_diversities,
                "test_purposes": result.analysis.test_purposes,
            },
            "difficulty_factor": 1.0,  # Default, can be adjusted
            "weights": {
                "value_type_coverage": 0.35,
                "diversity_coverage": 0.30,
                "purpose_coverage": 0.35,
            },
            "test_count": result.analysis.test_count,
            "effective_test_count": result.analysis.effective_test_count,
        }

        # Update problem rubric
        quality_repo.update_problem_rubric(
            problem_id=problem_id,
            score=result.score,
            analysis=rubric_analysis,
        )

        # Update analysis run status
        quality_repo.update_analysis_run_status(
            run_id=run.id,
            status=AnalysisStatus.SUCCESS.value,
            confidence_score=result.analysis.overall_confidence,
            result=rubric_analysis,
        )

        logger.info(
            f"[RUBRIC_ANALYSIS_SUCCESS] problem_id={problem_id} "
            f"run_id={run.id} score={result.score}"
        )

        return ProblemRubricResponse(
            problem_id=problem_id,
            rubric_score=result.score,
            rubric_analysis=rubric_analysis,
        )

    except Exception as e:
        # Update analysis run with error
        quality_repo.update_analysis_run_status(
            run_id=run.id,
            status=AnalysisStatus.ERROR.value,
            error_message=str(e),
        )

        logger.error(
            f"[RUBRIC_ANALYSIS_ERROR] problem_id={problem_id} "
            f"run_id={run.id} error={str(e)}",
            exc_info=True,
        )

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Rubric analysis failed: {str(e)}",
        )


@router.get("/admin/statistics", response_model=QualityStatisticsResponse)
async def admin_get_quality_statistics(
    db: Session = Depends(get_db),
):
    """
    Get overall test quality statistics.

    Admin endpoint for dashboard.

    Args:
        db: Database session

    Returns:
        Quality statistics including grade distribution and averages
    """
    quality_repo = TestQualityRepository(db)
    stats = quality_repo.get_quality_statistics()

    return QualityStatisticsResponse(
        grade_distribution=stats["grade_distribution"],
        average_score=stats["average_score"],
        analyzed_submissions=stats["analyzed_submissions"],
    )


@router.get("/admin/runs")
async def admin_get_analysis_runs(
    status: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """
    Get list of analysis runs.

    Admin endpoint for monitoring.

    Args:
        status: Filter by status (PENDING, RUNNING, SUCCESS, ERROR)
        limit: Maximum number of results
        db: Database session

    Returns:
        List of analysis runs
    """
    quality_repo = TestQualityRepository(db)

    if status:
        runs = quality_repo.get_analysis_runs_by_status(status, limit)
    else:
        # Get all recent runs (would need a new method, for now just get pending)
        runs = quality_repo.get_analysis_runs_by_status("SUCCESS", limit)

    return [
        {
            "id": run.id,
            "scope": run.scope,
            "submission_id": str(run.submission_id) if run.submission_id else None,
            "problem_id": run.problem_id,
            "status": run.status,
            "confidence_score": run.confidence_score,
            "created_at": run.created_at.isoformat() if run.created_at else None,
            "error_message": run.error_message,
        }
        for run in runs
    ]
