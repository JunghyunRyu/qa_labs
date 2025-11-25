"""Problem schemas."""

from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Any


class ProblemBase(BaseModel):
    """Base problem schema."""

    slug: str
    title: str
    description_md: str
    function_signature: str
    golden_code: str
    difficulty: str
    skills: Optional[List[str]] = None


class ProblemCreate(ProblemBase):
    """Schema for creating a problem."""

    pass


class ProblemResponse(ProblemBase):
    """Schema for problem response."""

    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class ProblemListResponse(BaseModel):
    """Schema for problem list response."""

    id: int
    slug: str
    title: str
    difficulty: str
    skills: Optional[List[str]] = None

    model_config = {"from_attributes": True}


class ProblemDetailResponse(ProblemBase):
    """Schema for problem detail response."""

    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class ProblemGenerateRequest(BaseModel):
    """Schema for AI problem generation request."""

    goal: str
    language: str = "python"
    testing_framework: str = "pytest"
    skills_to_assess: List[str] = []
    difficulty: str = "Easy"
    problem_style: str = "unit_test_for_single_function"


class BuggyImplementationCreate(BaseModel):
    """Schema for creating buggy implementation."""

    buggy_code: str
    bug_description: Optional[str] = None
    weight: int = 1


class ProblemCreateWithBuggy(BaseModel):
    """Schema for creating problem with buggy implementations."""

    slug: str
    title: str
    description_md: str
    function_signature: str
    golden_code: str
    difficulty: str
    skills: Optional[List[str]] = None
    buggy_implementations: List[BuggyImplementationCreate] = []
