"""Submission schemas."""

from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID
from typing import Optional, Dict, Any


class MutantDetail(BaseModel):
    """Schema for individual mutant test result."""

    mutant_id: str
    killed: bool
    test_output: Optional[str] = None
    execution_time: Optional[float] = None


class ClientExecutionResult(BaseModel):
    """Schema for client-side (Pyodide) execution results.

    This is sent when the code was executed in the browser using Pyodide,
    allowing us to skip server-side Celery execution.
    """

    golden_code_passed: bool
    mutants_killed: int
    total_mutants: int
    score: int  # 0-100
    details: Optional[list[MutantDetail]] = None
    total_execution_time: Optional[float] = None  # milliseconds


class SubmissionCreate(BaseModel):
    """Schema for creating a submission.

    If client_result is provided, server skips Celery task and saves results directly.
    If client_result is None, server queues Celery task for server-side execution.
    """

    problem_id: int
    code: str = Field(..., min_length=10, max_length=50000)  # 10B ~ 50KB 제한
    client_result: Optional[ClientExecutionResult] = None
    website: Optional[str] = None  # Honeypot field - should always be empty


class SubmissionResponse(BaseModel):
    """Schema for submission response."""

    id: UUID
    user_id: Optional[UUID] = None
    anonymous_id: Optional[str] = None
    problem_id: int
    code: str
    status: str
    score: int
    killed_mutants: Optional[int] = None
    total_mutants: Optional[int] = None
    execution_log: Optional[Dict[str, Any]] = None
    feedback_json: Optional[Dict[str, Any]] = None
    created_at: datetime

    # Test Quality (품질 보너스 점수 포함)
    test_quality_score: Optional[float] = None  # 0.0 ~ 100.0
    test_quality_grade: Optional[str] = None  # A/B/C/D/F
    test_quality_analysis: Optional[Dict[str, Any]] = None

    # Client Result Verification (P0 Security)
    execution_mode: str = "client"  # "client" | "server"
    verified: bool = False
    verification_status: Optional[str] = None  # "pending" | "verified" | "mismatch"
    verified_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class SubmissionStatusResponse(BaseModel):
    """Schema for submission status response (lightweight)."""

    id: UUID
    status: str
    score: Optional[int] = None
    killed_mutants: Optional[int] = None
    total_mutants: Optional[int] = None

    model_config = {"from_attributes": True}


# ===== 사용자 제출 히스토리/통계 관련 스키마 =====

class SubmissionListItem(BaseModel):
    """Schema for submission list item (with problem info)."""

    id: UUID
    problem_id: int
    problem_title: str
    problem_difficulty: str
    status: str
    score: int
    killed_mutants: Optional[int] = None
    total_mutants: Optional[int] = None
    has_feedback: bool = False
    created_at: datetime

    model_config = {"from_attributes": True}


class UserSubmissionsResponse(BaseModel):
    """Schema for paginated user submissions response."""

    submissions: list[SubmissionListItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class DifficultyStats(BaseModel):
    """Schema for difficulty-based statistics."""

    attempted: int
    solved: int


class RecentActivity(BaseModel):
    """Schema for recent activity (daily submission count)."""

    date: str  # YYYY-MM-DD
    submissions: int


class UserStatisticsResponse(BaseModel):
    """Schema for user statistics response."""

    total_submissions: int
    total_problems_attempted: int
    total_problems_solved: int
    success_rate: float  # 0.0 ~ 100.0
    avg_score: float
    best_score: int
    by_difficulty: Dict[str, DifficultyStats]
    recent_activity: list[RecentActivity]

