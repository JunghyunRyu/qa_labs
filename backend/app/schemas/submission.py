"""Submission schemas."""

from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from typing import Optional, Dict, Any


class SubmissionCreate(BaseModel):
    """Schema for creating a submission."""

    problem_id: int
    code: str


class SubmissionResponse(BaseModel):
    """Schema for submission response."""

    id: UUID
    user_id: UUID
    problem_id: int
    code: str
    status: str
    score: int
    killed_mutants: Optional[int] = None
    total_mutants: Optional[int] = None
    execution_log: Optional[Dict[str, Any]] = None
    feedback_json: Optional[Dict[str, Any]] = None
    created_at: datetime

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

