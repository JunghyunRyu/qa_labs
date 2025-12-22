"""
Test Hint Generator Service.

Phase 3-2: 사용자용 텍스트 힌트 생성 서비스.
코드 없이 텍스트 힌트만 제공하여 사고를 유도합니다.
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


class TestHint(BaseModel):
    """단일 힌트."""

    category: str = Field(
        ..., description="관련 카테고리 (value_type, diversity, purpose)"
    )
    hint_text: str = Field(..., description="힌트 텍스트")
    difficulty: str = Field(..., description="힌트 난이도 (easy, medium, hard)")
    question: str = Field(..., description="사고 유도 질문")


class HintGenerationResult(BaseModel):
    """힌트 생성 결과."""

    summary: str = Field(..., description="현재 테스트 상태 한 줄 요약")
    hints: List[TestHint] = Field(..., description="제공 힌트 목록")
    encouragement: str = Field(..., description="격려 메시지")
    next_step: str = Field(..., description="다음 단계 제안")


# ============================================================================
# 프롬프트 템플릿
# ============================================================================

SYSTEM_PROMPT = """너는 교육적인 QA 테스트 코치이다.

학생의 테스트 품질 분석 결과를 바탕으로 개선 힌트를 제공하라.

===== 절대 금지 사항 =====
1. 코드 예시 제공 금지 (def, assert, import 등 코드 키워드 사용 금지)
2. 구체적인 테스트 입력값 직접 제시 금지 (예: "5를 넣어보세요" 금지)
3. 정답을 알려주는 직접적인 힌트 금지

===== 허용 사항 =====
1. 테스트 설계 원칙/기법 언급 (예: "경계값 분석", "동치 분할", "오류 추측")
2. 일반적인 상황 예시 (예: "빈 입력이 들어오는 상황", "음수가 입력되는 경우")
3. 질문 형태의 힌트 (예: "~를 고려해보셨나요?")

===== 권장 사항 =====
1. "~을 고려해보셨나요?" 형태의 질문
2. "~라는 상황을 상상해보세요" 형태의 유도
3. 테스트 설계 원칙 언급 (경계값 분석, 동치 분할 등)
4. 격려와 칭찬 포함

===== 좋은 힌트 예시 =====
- "빈 입력이 들어오면 함수가 어떻게 동작해야 할까요? 그 상황을 테스트해보셨나요?"
- "경계값 분석 기법을 적용해보세요. 최소값과 최대값 근처에서 어떤 일이 일어날까요?"
- "음수나 0 같은 특수한 경우도 고려해보면 좋겠어요."

===== 나쁜 힌트 예시 (절대 사용 금지) =====
- "assert func([]) == 0 을 추가하세요" (코드 제공)
- "입력으로 5를 넣어보세요" (구체적 값 제시)
- "정답은 빈 리스트를 테스트하는 것입니다" (직접적 정답)

JSON 형식으로만 응답하세요."""


def _get_category_korean_name(category: str, category_type: str) -> str:
    """카테고리 이름을 한글로 변환합니다."""
    VALUE_TYPE_NAMES = {
        "normal": "정상값",
        "boundary": "경계값",
        "edge": "극단값",
        "negative": "음수/유효하지 않은 값",
        "extreme": "매우 큰/작은 값",
    }
    DIVERSITY_NAMES = {
        "single": "단일 요소",
        "multiple": "다중 요소",
        "empty": "빈 입력",
        "duplicate": "중복 포함",
        "mixed_types": "혼합 타입",
    }
    PURPOSE_NAMES = {
        "happy_path": "정상 흐름",
        "error_handling": "에러 처리",
        "boundary_check": "경계값 확인",
        "equivalence_partition": "동치 분할",
        "state_transition": "상태 전이",
    }

    if category_type == "value_type":
        return VALUE_TYPE_NAMES.get(category.lower(), category)
    elif category_type == "diversity":
        return DIVERSITY_NAMES.get(category.lower(), category)
    elif category_type == "purpose":
        return PURPOSE_NAMES.get(category.lower(), category)
    return category


def _identify_weak_areas(analysis: TestQualityAnalysis) -> dict:
    """분석 결과에서 취약한 영역을 식별합니다."""
    ALL_VALUE_TYPES = {"normal", "boundary", "edge", "negative", "extreme"}
    ALL_DIVERSITIES = {"single", "multiple", "empty", "duplicate", "mixed_types"}
    ALL_PURPOSES = {
        "happy_path",
        "error_handling",
        "boundary_check",
        "equivalence_partition",
        "state_transition",
    }

    covered_vt = {v.lower() for v in analysis.value_types}
    covered_div = {d.lower() for d in analysis.input_diversities}
    covered_purp = {p.lower() for p in analysis.test_purposes}

    return {
        "missing_value_types": [
            _get_category_korean_name(vt, "value_type")
            for vt in ALL_VALUE_TYPES - covered_vt
        ],
        "missing_diversities": [
            _get_category_korean_name(d, "diversity")
            for d in ALL_DIVERSITIES - covered_div
        ],
        "missing_purposes": [
            _get_category_korean_name(p, "purpose") for p in ALL_PURPOSES - covered_purp
        ],
        "antipatterns": [ap.type for ap in analysis.antipatterns],
    }


def _build_hint_prompt(
    analysis: TestQualityAnalysis,
    problem_title: str,
    max_hints: int,
) -> str:
    """힌트 생성을 위한 사용자 프롬프트를 구성합니다."""
    weak_areas = _identify_weak_areas(analysis)

    # 점수 정보
    score_info = ""
    if analysis.scoring_breakdown:
        score_info = f"품질 점수: {analysis.scoring_breakdown.final_score:.1f}/100"

    # 커버된 카테고리 한글화
    covered_vt = [
        _get_category_korean_name(v, "value_type") for v in analysis.value_types
    ]
    covered_div = [
        _get_category_korean_name(d, "diversity") for d in analysis.input_diversities
    ]
    covered_purp = [
        _get_category_korean_name(p, "purpose") for p in analysis.test_purposes
    ]

    return f"""[문제]
{problem_title}

[현재 테스트 분석]
테스트 함수 수: {analysis.test_count}
유효 테스트 케이스: {analysis.effective_test_count}
분석 신뢰도: {analysis.overall_confidence:.1%}
{score_info}

커버된 값 유형: {', '.join(covered_vt) if covered_vt else '없음'}
커버된 입력 다양성: {', '.join(covered_div) if covered_div else '없음'}
커버된 테스트 목적: {', '.join(covered_purp) if covered_purp else '없음'}

[개선이 필요한 영역]
부족한 값 유형: {', '.join(weak_areas['missing_value_types']) if weak_areas['missing_value_types'] else '없음'}
부족한 입력 다양성: {', '.join(weak_areas['missing_diversities']) if weak_areas['missing_diversities'] else '없음'}
부족한 테스트 목적: {', '.join(weak_areas['missing_purposes']) if weak_areas['missing_purposes'] else '없음'}
감지된 안티패턴: {', '.join(weak_areas['antipatterns']) if weak_areas['antipatterns'] else '없음'}

[요청사항]
학생이 스스로 생각하고 개선할 수 있도록 힌트 {max_hints}개를 제공하세요.
가장 중요한 개선 영역부터 힌트를 제공하세요.

JSON 형식:
{{
  "summary": "현재 테스트 상태를 한 문장으로 요약",
  "hints": [
    {{
      "category": "value_type 또는 diversity 또는 purpose",
      "hint_text": "테스트 설계 기법을 언급하며 개선 방향 제시",
      "difficulty": "easy 또는 medium 또는 hard",
      "question": "사고를 유도하는 질문"
    }}
  ],
  "encouragement": "학생을 격려하는 메시지",
  "next_step": "다음에 시도해볼 것 제안"
}}

중요:
- 코드나 구체적인 입력값을 포함하지 마세요!
- 테스트 설계 원칙(경계값 분석, 동치 분할 등)을 언급하세요
- 질문 형태로 사고를 유도하세요"""


def _get_default_hints(analysis: TestQualityAnalysis) -> HintGenerationResult:
    """LLM 호출 실패 시 기본 힌트를 반환합니다."""
    weak_areas = _identify_weak_areas(analysis)

    hints = []

    # 부족한 값 유형에 대한 기본 힌트
    if weak_areas["missing_value_types"]:
        hints.append(
            TestHint(
                category="value_type",
                hint_text="다양한 종류의 입력값을 테스트해보세요. "
                "경계값 분석 기법을 적용하면 좋습니다.",
                difficulty="medium",
                question="함수가 처리해야 하는 다양한 입력 상황을 모두 고려해보셨나요?",
            )
        )

    # 부족한 입력 다양성에 대한 기본 힌트
    if weak_areas["missing_diversities"]:
        hints.append(
            TestHint(
                category="diversity",
                hint_text="입력 데이터의 크기와 구성을 다양하게 테스트해보세요.",
                difficulty="medium",
                question="빈 입력, 단일 요소, 많은 요소 등 다양한 크기의 입력을 테스트해보셨나요?",
            )
        )

    # 부족한 테스트 목적에 대한 기본 힌트
    if weak_areas["missing_purposes"]:
        hints.append(
            TestHint(
                category="purpose",
                hint_text="테스트의 목적을 다양화해보세요. "
                "정상 동작뿐만 아니라 예외 상황도 중요합니다.",
                difficulty="medium",
                question="에러가 발생할 수 있는 상황도 테스트해보셨나요?",
            )
        )

    # 안티패턴에 대한 기본 힌트
    if weak_areas["antipatterns"]:
        hints.append(
            TestHint(
                category="purpose",
                hint_text="테스트 코드의 품질을 점검해보세요. "
                "모든 테스트에 적절한 assertion이 있는지 확인하세요.",
                difficulty="easy",
                question="각 테스트가 명확한 검증(assertion)을 수행하고 있나요?",
            )
        )

    if not hints:
        hints.append(
            TestHint(
                category="value_type",
                hint_text="현재 테스트가 잘 구성되어 있습니다. "
                "더 까다로운 케이스를 추가해보세요.",
                difficulty="hard",
                question="극단적인 상황에서도 함수가 올바르게 동작할까요?",
            )
        )

    return HintGenerationResult(
        summary="테스트 분석이 완료되었습니다.",
        hints=hints[:3],  # 최대 3개
        encouragement="꾸준히 테스트를 개선하고 계시네요! 좋은 자세입니다.",
        next_step="위 힌트를 참고하여 테스트 케이스를 추가해보세요.",
    )


def generate_hints_from_analysis(
    analysis: TestQualityAnalysis,
    problem_title: str,
    max_hints: int = 3,
    verbosity: Verbosity = "medium",
) -> HintGenerationResult:
    """
    테스트 품질 분석 결과에서 힌트를 생성합니다.

    정책:
    - 코드 예시 절대 금지
    - 구체적인 입력값 직접 제시 금지
    - 테스트 설계 원칙/기법 언급 허용
    - 사고 과정 유도 질문 필수

    Args:
        analysis: 테스트 품질 분석 결과
        problem_title: 문제 제목
        max_hints: 최대 힌트 수 (기본 3)
        verbosity: 출력 상세도

    Returns:
        힌트 생성 결과
    """
    try:
        user_prompt = _build_hint_prompt(
            analysis=analysis,
            problem_title=problem_title,
            max_hints=max_hints,
        )

        logger.info(
            f"Generating hints for problem '{problem_title}' "
            f"(max_hints={max_hints}, verbosity={verbosity})"
        )

        response = llm_client.generate_json_with_responses_api(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=user_prompt,
            verbosity=verbosity,
        )

        # 스키마 검증
        try:
            validated = HintGenerationResult(**response)

            # 힌트 개수 제한
            if len(validated.hints) > max_hints:
                validated.hints = validated.hints[:max_hints]

            logger.info(f"Generated {len(validated.hints)} hints successfully")
            return validated

        except ValidationError as e:
            logger.error(f"Hint schema validation failed: {e}")
            return _get_default_hints(analysis)

    except RuntimeError as e:
        logger.error(f"LLM API error in hint generation: {e}")
        return _get_default_hints(analysis)

    except Exception as e:
        logger.error(f"Unexpected error in generate_hints: {e}", exc_info=True)
        return _get_default_hints(analysis)
