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

