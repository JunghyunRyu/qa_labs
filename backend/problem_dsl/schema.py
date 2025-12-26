"""
Problem DSL 스키마 정의

YAML 파일의 구조를 Pydantic 모델로 정의합니다.
"""

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class FunctionDef(BaseModel):
    """함수 정의"""

    name: str = Field(..., description="함수 이름")
    signature: str = Field(..., description="함수 시그니처 (def ... -> ...)")
    docstring: str = Field(..., description="함수 docstring")
    golden_logic: str = Field(..., description="정답 로직 (함수 본문)")


class BuggyVariant(BaseModel):
    """버그 구현 정의"""

    id: str = Field(..., description="버그 ID (예: direct_comparison)")
    description: str = Field(..., description="버그 설명 (한글)")
    weight: int = Field(ge=1, le=5, default=3, description="버그 난이도 가중치")
    signature: Optional[str] = Field(
        default=None,
        description="시그니처 오버라이드 (기본 인자 버그 등에 사용)"
    )
    logic: str = Field(..., description="버그가 있는 로직")
    detecting_inputs: List[Dict[str, Any]] = Field(
        default_factory=list, description="버그 발견용 테스트 입력"
    )
    skip_auto_validation: bool = Field(
        default=False,
        description="True이면 자동 검증을 건너뜀 (연속 호출이 필요한 버그 등)"
    )


class ProblemDef(BaseModel):
    """단일 문제 정의"""

    id: str = Field(..., description="문제 ID (예: FP-E01)")
    difficulty: str = Field(..., description="난이도 (Very Easy, Easy, Medium, Hard)")
    title: str = Field(..., description="문제 제목")
    domain: str = Field(default="common", description="도메인 (common, fintech 등)")
    tags: List[str] = Field(default_factory=list, description="태그 목록")
    function: FunctionDef = Field(..., description="함수 정의")
    buggy_variants: List[BuggyVariant] = Field(..., description="버그 구현 목록")
    test_template: str = Field(..., description="테스트 템플릿")
    description_md: str = Field(..., description="문제 설명 (마크다운)")


class BugTypeDSL(BaseModel):
    """버그 유형 DSL 전체 스키마"""

    bug_type: str = Field(..., description="버그 유형 식별자 (예: FLOATING_POINT)")
    learning_objective: str = Field(..., description="학습 목표")
    pytest_feature: str = Field(..., description="학습할 pytest 기능")
    problems: List[ProblemDef] = Field(..., description="문제 목록")

    class Config:
        json_schema_extra = {
            "example": {
                "bug_type": "FLOATING_POINT_COMPARISON",
                "learning_objective": "부동소수점 비교의 위험성과 pytest.approx 사용법",
                "pytest_feature": "pytest.approx",
                "problems": [
                    {
                        "id": "FP-E01",
                        "difficulty": "Easy",
                        "title": "부동소수점 덧셈 비교 테스트",
                        "domain": "common",
                        "tags": ["부동소수점", "pytest.approx"],
                        "function": {
                            "name": "is_close",
                            "signature": "def is_close(a: float, b: float) -> bool:",
                            "docstring": "두 부동소수점이 같은지 비교",
                            "golden_logic": "return abs(a - b) < 1e-9",
                        },
                        "buggy_variants": [
                            {
                                "id": "direct_comparison",
                                "description": "직접 == 비교",
                                "weight": 5,
                                "logic": "return a == b",
                                "detecting_inputs": [
                                    {"a": 0.1, "b": 0.1, "expected": True}
                                ],
                            }
                        ],
                        "test_template": "# TODO: 테스트 작성",
                        "description_md": "## 문제 설명\n...",
                    }
                ],
            }
        }
