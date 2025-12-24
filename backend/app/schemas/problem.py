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
    domain: str = "common"
    skills: Optional[List[str]] = None
    summary: Optional[str] = None  # 핵심 테스트 포인트 요약 (마크다운)


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
    domain: str = "common"
    skills: Optional[List[str]] = None
    summary: Optional[str] = None  # 핵심 테스트 포인트 요약
    description_md: Optional[str] = None  # For preview in list view
    success_rate: Optional[float] = None  # 0.0~1.0, None if < 5 submissions

    model_config = {"from_attributes": True}


class BuggyImplementationResponse(BaseModel):
    """Schema for buggy implementation response."""

    id: int
    buggy_code: str
    bug_description: Optional[str] = None
    weight: int = 1

    model_config = {"from_attributes": True}


class ProblemDetailResponse(ProblemBase):
    """Schema for problem detail response (with buggy implementations for client-side execution)."""

    id: int
    created_at: datetime
    buggy_implementations: List[BuggyImplementationResponse] = []

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
    domain: str = "common"
    skills: Optional[List[str]] = None
    summary: Optional[str] = None  # 핵심 테스트 포인트 요약
    buggy_implementations: List[BuggyImplementationCreate] = []
