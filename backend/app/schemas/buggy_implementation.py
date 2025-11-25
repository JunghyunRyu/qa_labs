"""BuggyImplementation schemas."""

from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class BuggyImplementationBase(BaseModel):
    """Base buggy implementation schema."""

    buggy_code: str
    bug_description: Optional[str] = None
    weight: int = 1


class BuggyImplementationCreate(BuggyImplementationBase):
    """Schema for creating a buggy implementation."""

    problem_id: int


class BuggyImplementationResponse(BuggyImplementationBase):
    """Schema for buggy implementation response."""

    id: int
    problem_id: int
    created_at: datetime

    model_config = {"from_attributes": True}

