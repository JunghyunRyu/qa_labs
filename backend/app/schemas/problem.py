"""Problem schemas."""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Any, Literal


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
    use_reasoning: bool = Field(
        default=True,
        description="Reasoning 모델 사용 여부. True면 o3-mini 등 고급 추론 모델 사용"
    )
    reasoning_effort: Optional[Literal["low", "medium", "high"]] = Field(
        default="high",
        description="Reasoning effort level. use_reasoning=True일 때만 적용됨"
    )


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
