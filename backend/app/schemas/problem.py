"""Problem schemas."""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Any, Literal, Dict


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
    short_description: Optional[str] = None  # 카드용 짧은 설명 (1-2문장)


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
    short_description: Optional[str] = None  # 카드용 짧은 설명
    description_md: Optional[str] = None  # For preview in list view
    success_rate: Optional[float] = None  # 0.0~1.0, None if < 5 submissions
    bugs_count: int = 0  # 숨은 버그 수 (buggy_implementations 개수)
    published_at: Optional[datetime] = None  # 공개 시점 (NEW 배지용)

    model_config = {"from_attributes": True}


class BuggyImplementationResponse(BaseModel):
    """Schema for buggy implementation response (public API).

    [P0 Security] bug_description 제거 - 버그 힌트 노출 방지
    """

    id: int
    buggy_code: str
    # bug_description: 보안상 제거됨 (관리자 API에서만 노출)
    weight: int = 1

    model_config = {"from_attributes": True}


class ProblemDetailResponse(BaseModel):
    """Schema for problem detail response (public API).

    [P0 Security] golden_code 제거 - 정답 코드 노출 방지
    클라이언트 실행(Pyodide)은 buggy_code만 필요합니다.
    """

    id: int
    slug: str
    title: str
    description_md: str
    function_signature: str
    # golden_code: 보안상 제거됨 (서버 채점에서만 사용)
    difficulty: str
    domain: str = "common"
    skills: Optional[List[str]] = None
    summary: Optional[str] = None
    short_description: Optional[str] = None
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
    short_description: Optional[str] = None  # 카드용 짧은 설명
    buggy_implementations: List[BuggyImplementationCreate] = []


class ProblemStatsResponse(BaseModel):
    """Schema for problem statistics response."""

    total: int
    by_difficulty: Dict[str, int]  # {"Very Easy": 10, "Easy": 24, ...}
    by_domain: Dict[str, int]  # {"fintech": 18, "commerce": 14, ...}


# ============================================
# Hint System Schemas (M5-5)
# ============================================

class HintData(BaseModel):
    """Structure for hint content at each level."""

    level1: Optional[str] = None  # 방향성 힌트 (~100자)
    level2: Optional[str] = None  # 구체적 접근법 (~200자)
    level3: Optional[str] = None  # 코드 예시 (~300자)


class HintLevelResponse(BaseModel):
    """Response for a single hint level."""

    level: int  # 1, 2, or 3
    content: str
    penalty: int  # 0, -10, or -20


class HintResponse(BaseModel):
    """Response for GET /problems/{id}/hints."""

    problem_id: int
    available_levels: List[int]  # 현재 사용 가능한 레벨들
    viewed_levels: List[int]  # 이미 본 레벨들
    hints: Dict[int, HintLevelResponse]  # 본 힌트들의 내용


class HintViewRequest(BaseModel):
    """Request for POST /problems/{id}/hints/view."""

    level: int = Field(..., ge=1, le=3, description="Hint level to view (1-3)")
