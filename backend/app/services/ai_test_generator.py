"""
AI Test Generator Service.

Phase 3-1: Admin용 AI 테스트 생성 서비스.
부족한 테스트 카테고리를 커버하는 pytest 코드를 생성합니다.
"""

import logging
from typing import List, Optional

from pydantic import BaseModel, Field, ValidationError

from app.core.llm_client import llm_client, Verbosity
from app.schemas.test_quality import TestQualityAnalysis

logger = logging.getLogger(__name__)


# ============================================================================
# 응답 스키마
# ============================================================================


class GeneratedTest(BaseModel):
    """생성된 테스트 케이스."""

    test_name: str = Field(..., description="테스트 함수명")
    test_code: str = Field(..., description="pytest 코드")
    target_categories: List[str] = Field(..., description="커버하는 카테고리")
    rationale: str = Field(..., description="생성 이유")


class CoverageImprovement(BaseModel):
    """커버리지 개선 예상."""

    value_types_added: List[str] = Field(default_factory=list)
    diversities_added: List[str] = Field(default_factory=list)
    purposes_added: List[str] = Field(default_factory=list)


class TestGenerationResult(BaseModel):
    """테스트 생성 결과."""

    generated_tests: List[GeneratedTest] = Field(..., description="생성된 테스트들")
    complete_test_file: str = Field(..., description="전체 pytest 파일")
    coverage_improvement: CoverageImprovement = Field(
        ..., description="커버리지 개선 예상"
    )


# ============================================================================
# 카테고리 정의
# ============================================================================

ALL_VALUE_TYPES = ["normal", "boundary", "edge", "negative", "extreme"]
ALL_DIVERSITIES = ["single", "multiple", "empty", "duplicate", "mixed_types"]
ALL_PURPOSES = [
    "happy_path",
    "error_handling",
    "boundary_check",
    "equivalence_partition",
    "state_transition",
]


# ============================================================================
# 프롬프트 템플릿
# ============================================================================

SYSTEM_PROMPT = """너는 시니어 QA 엔지니어이다.

주어진 함수에 대해 테스트 품질을 향상시키는 pytest 테스트 케이스를 생성하라.

테스트 품질 분류 체계:
1. 값 유형(ValueType): NORMAL, BOUNDARY, EDGE, NEGATIVE, EXTREME
2. 입력 다양성(InputDiversity): SINGLE, MULTIPLE, EMPTY, DUPLICATE, MIXED_TYPES
3. 테스트 목적(TestPurpose): HAPPY_PATH, ERROR_HANDLING, BOUNDARY_CHECK, EQUIVALENCE_PARTITION, STATE_TRANSITION

생성 규칙:
- 부족한 카테고리를 우선적으로 커버
- @pytest.mark.parametrize 적극 활용
- 구체적인 값과 기대 결과 명시
- 안티패턴 방지 (NO_ASSERTION, EXCEPTION_SWALLOWED 등)
- 한국어 주석으로 테스트 의도 설명
- 모든 테스트는 반드시 assertion을 포함

테스트 코드 형식:
- import pytest 포함
- from target import 함수명 형태로 임포트
- def test_함수명_케이스(): 형태로 작성
- 각 테스트에 한글 docstring 포함

JSON 형식으로만 응답하세요."""


def _get_missing_categories(
    all_categories: List[str], covered: List[str]
) -> List[str]:
    """부족한 카테고리를 계산합니다."""
    covered_lower = {c.lower() for c in covered}
    return [c for c in all_categories if c.lower() not in covered_lower]


def _build_test_generation_prompt(
    function_signature: str,
    golden_code: str,
    problem_description: str,
    current_analysis: TestQualityAnalysis,
    max_tests: int,
) -> str:
    """테스트 생성을 위한 프롬프트를 구성합니다."""
    # 부족한 카테고리 계산
    missing_value_types = _get_missing_categories(
        ALL_VALUE_TYPES, current_analysis.value_types
    )
    missing_diversities = _get_missing_categories(
        ALL_DIVERSITIES, current_analysis.input_diversities
    )
    missing_purposes = _get_missing_categories(
        ALL_PURPOSES, current_analysis.test_purposes
    )

    # 안티패턴 정보
    antipattern_info = ""
    if current_analysis.antipatterns:
        antipattern_types = [ap.type for ap in current_analysis.antipatterns]
        antipattern_info = f"현재 감지된 안티패턴: {', '.join(antipattern_types)}"

    return f"""[함수 정보]
시그니처: {function_signature}

```python
{golden_code}
```

[문제 설명]
{problem_description[:1000]}

[현재 테스트 분석]
- 테스트 수: {current_analysis.test_count} (유효: {current_analysis.effective_test_count})
- 커버된 값 유형: {current_analysis.value_types if current_analysis.value_types else ['없음']}
- 커버된 입력 다양성: {current_analysis.input_diversities if current_analysis.input_diversities else ['없음']}
- 커버된 테스트 목적: {current_analysis.test_purposes if current_analysis.test_purposes else ['없음']}
{antipattern_info}

[부족한 카테고리]
- 값 유형: {missing_value_types if missing_value_types else ['없음']}
- 입력 다양성: {missing_diversities if missing_diversities else ['없음']}
- 테스트 목적: {missing_purposes if missing_purposes else ['없음']}

[요청사항]
위 부족한 카테고리를 커버하는 테스트 케이스 {max_tests}개를 생성하세요.
각 테스트는 최소 1개의 부족한 카테고리를 커버해야 합니다.
테스트 코드는 실행 가능한 형태로 작성하세요.

JSON 형식:
{{
  "generated_tests": [
    {{
      "test_name": "test_함수명_케이스",
      "test_code": "전체 pytest 함수 코드 (def부터 끝까지)",
      "target_categories": ["BOUNDARY", "EMPTY"],
      "rationale": "이 테스트가 필요한 이유 설명"
    }}
  ],
  "complete_test_file": "import pytest\\nfrom target import ...\\n\\n전체 테스트 파일",
  "coverage_improvement": {{
    "value_types_added": ["boundary"],
    "diversities_added": ["empty"],
    "purposes_added": []
  }}
}}

중요:
- test_code는 def test_...부터 시작하는 완전한 함수여야 합니다
- complete_test_file은 import문부터 시작하는 실행 가능한 전체 파일이어야 합니다
- 모든 테스트에 assertion이 있어야 합니다"""


def _get_default_result(
    function_signature: str, current_analysis: TestQualityAnalysis
) -> TestGenerationResult:
    """LLM 호출 실패 시 기본 결과를 반환합니다."""
    # 기본 테스트 템플릿 생성
    func_name = function_signature.split("(")[0].replace("def ", "").strip()

    default_tests = []

    # 부족한 카테고리에 따른 기본 테스트 추가
    missing_vt = _get_missing_categories(ALL_VALUE_TYPES, current_analysis.value_types)
    if "boundary" in missing_vt:
        default_tests.append(
            GeneratedTest(
                test_name=f"test_{func_name}_boundary_zero",
                test_code=f'''def test_{func_name}_boundary_zero():
    """경계값 0에 대한 테스트."""
    # TODO: 경계값 테스트 구현 필요
    # result = {func_name}(0)
    # assert result == expected
    pass  # 구현 필요''',
                target_categories=["BOUNDARY", "BOUNDARY_CHECK"],
                rationale="경계값 0에 대한 테스트가 필요합니다.",
            )
        )

    if "empty" in _get_missing_categories(
        ALL_DIVERSITIES, current_analysis.input_diversities
    ):
        default_tests.append(
            GeneratedTest(
                test_name=f"test_{func_name}_empty_input",
                test_code=f'''def test_{func_name}_empty_input():
    """빈 입력에 대한 테스트."""
    # TODO: 빈 입력 테스트 구현 필요
    # result = {func_name}([])  # 또는 ""
    # assert result == expected
    pass  # 구현 필요''',
                target_categories=["EMPTY", "EDGE"],
                rationale="빈 입력에 대한 테스트가 필요합니다.",
            )
        )

    if not default_tests:
        default_tests.append(
            GeneratedTest(
                test_name=f"test_{func_name}_additional",
                test_code=f'''def test_{func_name}_additional():
    """추가 테스트 케이스."""
    # TODO: 추가 테스트 구현 필요
    pass  # 구현 필요''',
                target_categories=["NORMAL"],
                rationale="추가 테스트 케이스가 필요합니다.",
            )
        )

    complete_file = f'''import pytest
from target import {func_name}

'''
    for test in default_tests:
        complete_file += test.test_code + "\n\n"

    return TestGenerationResult(
        generated_tests=default_tests,
        complete_test_file=complete_file.strip(),
        coverage_improvement=CoverageImprovement(
            value_types_added=[], diversities_added=[], purposes_added=[]
        ),
    )


def generate_tests_for_missing_coverage(
    function_signature: str,
    golden_code: str,
    problem_description: str,
    current_analysis: TestQualityAnalysis,
    max_tests: int = 5,
    verbosity: Verbosity = "high",
) -> TestGenerationResult:
    """
    부족한 카테고리를 커버하는 테스트를 생성합니다.

    Admin 전용 기능입니다.

    Args:
        function_signature: 함수 시그니처
        golden_code: 정답 코드
        problem_description: 문제 설명
        current_analysis: 현재 테스트 품질 분석 결과
        max_tests: 최대 생성 테스트 수 (기본 5)
        verbosity: 출력 상세도

    Returns:
        생성된 테스트 코드 및 메타데이터
    """
    # 최대 테스트 수 제한
    max_tests = min(max_tests, 10)

    try:
        user_prompt = _build_test_generation_prompt(
            function_signature=function_signature,
            golden_code=golden_code,
            problem_description=problem_description,
            current_analysis=current_analysis,
            max_tests=max_tests,
        )

        logger.info(
            f"Generating tests for '{function_signature[:50]}...' "
            f"(max_tests={max_tests}, verbosity={verbosity})"
        )

        response = llm_client.generate_json_with_responses_api(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=user_prompt,
            verbosity=verbosity,
        )

        # 스키마 검증
        try:
            validated = TestGenerationResult(**response)

            # 테스트 개수 제한
            if len(validated.generated_tests) > max_tests:
                validated.generated_tests = validated.generated_tests[:max_tests]

            logger.info(
                f"Generated {len(validated.generated_tests)} tests successfully"
            )
            return validated

        except ValidationError as e:
            logger.error(f"Test generation schema validation failed: {e}")
            return _get_default_result(function_signature, current_analysis)

    except RuntimeError as e:
        logger.error(f"LLM API error in test generation: {e}")
        return _get_default_result(function_signature, current_analysis)

    except Exception as e:
        logger.error(f"Unexpected error in generate_tests: {e}", exc_info=True)
        return _get_default_result(function_signature, current_analysis)


def validate_generated_code(test_code: str) -> bool:
    """
    생성된 테스트 코드의 구문 유효성을 검사합니다.

    Args:
        test_code: 검사할 테스트 코드

    Returns:
        유효하면 True, 아니면 False
    """
    import ast

    try:
        ast.parse(test_code)
        return True
    except SyntaxError:
        return False
