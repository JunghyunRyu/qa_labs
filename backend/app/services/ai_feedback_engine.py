"""AI Feedback Engine service."""

import logging
from typing import Dict, Any, List, Optional

from pydantic import BaseModel, ValidationError

from app.core.llm_client import llm_client, Verbosity
from app.schemas.test_quality import TestQualityAnalysis

logger = logging.getLogger(__name__)


# JSON 스키마 정의
class FeedbackSchema(BaseModel):
    """Schema for AI feedback response."""

    summary: str
    strengths: List[str]
    weaknesses: List[str]
    suggested_tests: List[str]
    score_adjustment: int = 0


# Prompt 템플릿
SYSTEM_PROMPT = """너는 시니어 QA 코치이다.

아래는 한 수강생이 작성한 pytest 테스트 코드와, 그 테스트를 돌린 결과(점수, 결함 검출률, pytest 로그)이다.

이 수강생에게 건설적이고 도움이 되는 피드백을 제공하라. 피드백은 다음 형식으로 제공해야 한다:

1) 한 줄 요약 (summary): 전체적인 평가를 한 문장으로 요약
2) 잘한 점 (strengths): 테스트 코드의 장점을 구체적으로 나열 (최소 1개 이상)
3) 아쉬운 점 (weaknesses): 개선이 필요한 부분을 구체적으로 지적 (최소 1개 이상)
4) 추가로 작성하면 좋은 테스트 케이스 (suggested_tests): 구체적인 입력 예시를 포함한 제안 (최소 2개 이상)
5) 점수 조정 (score_adjustment): 현재 점수에 대한 추가 조정 점수 (기본 0)

중요:
- 피드백은 격려적이고 건설적이어야 함
- 구체적인 예시와 함께 제안해야 함
- 테스트 코드의 품질과 커버리지를 평가해야 함
- JSON 형식으로만 응답해야 함"""


def build_user_prompt(
    problem_title: str,
    problem_description: str,
    problem_skills: List[str],
    test_code: str,
    score: int,
    killed_mutants: int,
    total_mutants: int,
    kill_ratio: float,
    execution_log: Dict[str, Any],
    test_quality_analysis: Optional[TestQualityAnalysis] = None,
) -> str:
    """
    Build user prompt for feedback generation.

    Args:
        problem_title: Problem title
        problem_description: Problem description
        problem_skills: Skills assessed by the problem
        test_code: User's test code
        score: Submission score
        killed_mutants: Number of killed mutants
        total_mutants: Total number of mutants
        kill_ratio: Kill ratio (killed_mutants / total_mutants)
        execution_log: Execution log with pytest results
        test_quality_analysis: 테스트 품질 분석 결과 (Phase 3)

    Returns:
        Formatted user prompt
    """
    skills_text = ", ".join(problem_skills) if problem_skills else "없음"

    # Extract pytest output from execution log
    pytest_output = ""
    if execution_log:
        golden_log = execution_log.get("golden", {})
        if golden_log:
            pytest_output += f"Golden Code 테스트 결과:\n{golden_log.get('stdout', '')}\n\n"

        mutants_log = execution_log.get("mutants", [])
        if mutants_log:
            pytest_output += "결함 코드 테스트 결과:\n"
            for i, mutant_log in enumerate(mutants_log[:3], 1):  # 처음 3개만 표시
                pytest_output += f"결함 {i}: {mutant_log.get('stdout', '')[:200]}...\n"

    # Phase 3: 테스트 품질 분석 섹션 추가
    quality_section = ""
    if test_quality_analysis:
        quality_section = _build_quality_analysis_section(test_quality_analysis)

    return f"""[문제 정보]
제목: {problem_title}
설명: {problem_description[:500]}
평가 기술: {skills_text}

[제출된 테스트 코드]
```python
{test_code}
```
{quality_section}
[채점 결과]
점수: {score}/100
발견된 결함: {killed_mutants}건 / 전체: {total_mutants}건
결함 검출률: {kill_ratio:.2%}

[실행 로그]
{pytest_output if pytest_output else "실행 로그 없음"}

[요청사항]
위 정보를 바탕으로 다음 JSON 형식으로 피드백을 제공하세요:
{{
  "summary": "한 줄 요약",
  "strengths": ["잘한 점 1", "잘한 점 2"],
  "weaknesses": ["아쉬운 점 1", "아쉬운 점 2"],
  "suggested_tests": ["제안 1 (구체적인 입력 예시 포함)", "제안 2"],
  "score_adjustment": 0
}}

중요:
- JSON만 반환하세요 (추가 설명 없이)
- 모든 필드는 필수입니다
- suggested_tests는 구체적인 입력 예시를 포함해야 합니다
- 테스트 품질 분석 결과를 참고하여 부족한 카테고리에 대한 구체적인 제안을 포함하세요
"""


def _build_quality_analysis_section(analysis: TestQualityAnalysis) -> str:
    """테스트 품질 분석 섹션을 구성합니다."""
    # 카테고리 이름 한글화
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

    # 커버된 카테고리 한글화
    covered_value_types = [
        VALUE_TYPE_NAMES.get(vt.lower(), vt) for vt in analysis.value_types
    ]
    covered_diversities = [
        DIVERSITY_NAMES.get(d.lower(), d) for d in analysis.input_diversities
    ]
    covered_purposes = [
        PURPOSE_NAMES.get(p.lower(), p) for p in analysis.test_purposes
    ]

    # 누락된 카테고리 계산
    all_value_types = set(VALUE_TYPE_NAMES.keys())
    all_diversities = set(DIVERSITY_NAMES.keys())
    all_purposes = set(PURPOSE_NAMES.keys())

    missing_value_types = [
        VALUE_TYPE_NAMES[vt]
        for vt in all_value_types - {v.lower() for v in analysis.value_types}
    ]
    missing_diversities = [
        DIVERSITY_NAMES[d]
        for d in all_diversities - {d.lower() for d in analysis.input_diversities}
    ]
    missing_purposes = [
        PURPOSE_NAMES[p]
        for p in all_purposes - {p.lower() for p in analysis.test_purposes}
    ]

    # 안티패턴 요약
    antipattern_summary = ""
    if analysis.antipatterns:
        antipattern_types = [ap.type for ap in analysis.antipatterns]
        antipattern_summary = f"감지된 안티패턴: {', '.join(antipattern_types)}"

    # 점수 정보
    score_info = ""
    if analysis.scoring_breakdown:
        sb = analysis.scoring_breakdown
        score_info = f"품질 점수: {sb.final_score:.1f}/100"

    return f"""
[테스트 품질 분석]
테스트 함수 수: {analysis.test_count} (유효 케이스: {analysis.effective_test_count})
분석 신뢰도: {analysis.overall_confidence:.1%}
{score_info}

커버된 값 유형: {', '.join(covered_value_types) if covered_value_types else '없음'}
커버된 입력 다양성: {', '.join(covered_diversities) if covered_diversities else '없음'}
커버된 테스트 목적: {', '.join(covered_purposes) if covered_purposes else '없음'}

부족한 값 유형: {', '.join(missing_value_types) if missing_value_types else '없음'}
부족한 입력 다양성: {', '.join(missing_diversities) if missing_diversities else '없음'}
부족한 테스트 목적: {', '.join(missing_purposes) if missing_purposes else '없음'}
{antipattern_summary}
"""


def generate_feedback(
    problem_title: str,
    problem_description: str,
    problem_skills: List[str],
    test_code: str,
    score: int,
    killed_mutants: int,
    total_mutants: int,
    kill_ratio: float,
    execution_log: Dict[str, Any],
    verbosity: Optional[Verbosity] = None,
    test_quality_analysis: Optional[TestQualityAnalysis] = None,
) -> Dict[str, Any]:
    """
    Generate feedback using AI.

    GPT-5.2 최적화:
    - 점수 기반 verbosity 자동 조절
    - 낮은 점수일수록 더 상세한 피드백 제공
    - 테스트 품질 분석 결과 활용 (Phase 3)

    Args:
        problem_title: Problem title
        problem_description: Problem description
        problem_skills: Skills assessed by the problem
        test_code: User's test code
        score: Submission score
        killed_mutants: Number of killed mutants
        total_mutants: Total number of mutants
        kill_ratio: Kill ratio
        execution_log: Execution log
        verbosity: 출력 상세도 (None이면 점수 기반 자동 설정)
        test_quality_analysis: 테스트 품질 분석 결과 (Optional, Phase 3)

    Returns:
        Feedback dictionary

    Raises:
        ValueError: If validation fails or LLM call fails
        RuntimeError: If LLM API call fails
    """
    # GPT-5.2: 점수 기반 verbosity 자동 조절
    if verbosity is None:
        if score < 30:
            verbosity = "high"    # 낮은 점수: 상세한 개선 지침
        elif score < 70:
            verbosity = "medium"  # 중간 점수: 균형잡힌 피드백
        else:
            verbosity = "low"     # 높은 점수: 간결한 칭찬

    try:
        user_prompt = build_user_prompt(
            problem_title=problem_title,
            problem_description=problem_description,
            problem_skills=problem_skills or [],
            test_code=test_code,
            score=score,
            killed_mutants=killed_mutants,
            total_mutants=total_mutants,
            kill_ratio=kill_ratio,
            execution_log=execution_log or {},
            test_quality_analysis=test_quality_analysis,
        )

        has_quality_analysis = test_quality_analysis is not None
        logger.info(
            f"Generating feedback with GPT-5.2 "
            f"(score={score}, verbosity={verbosity}, quality_analysis={has_quality_analysis})"
        )

        # GPT-5.2: LLM 호출 (Responses API 사용 + verbosity)
        response = llm_client.generate_json_with_responses_api(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=user_prompt,
            verbosity=verbosity,
        )

        # JSON 스키마 검증
        try:
            validated = FeedbackSchema(**response)
            return validated.model_dump()
        except ValidationError as e:
            logger.error(f"Feedback schema validation failed: {e}")
            # 검증 실패 시 기본 피드백 반환
            return {
                "summary": "피드백 생성 중 오류가 발생했습니다.",
                "strengths": [],
                "weaknesses": [],
                "suggested_tests": [],
                "score_adjustment": 0,
            }

    except ValueError as e:
        logger.error(f"Feedback generation failed: {e}")
        # 에러 발생 시 기본 피드백 반환
        return {
            "summary": "피드백 생성 중 오류가 발생했습니다.",
            "strengths": [],
            "weaknesses": [],
            "suggested_tests": [],
            "score_adjustment": 0,
        }
    except RuntimeError as e:
        logger.error(f"LLM API error in feedback generation: {e}")
        # LLM API 에러 시 기본 피드백 반환
        return {
            "summary": "피드백 생성 중 오류가 발생했습니다.",
            "strengths": [],
            "weaknesses": [],
            "suggested_tests": [],
            "score_adjustment": 0,
        }
    except Exception as e:
        logger.error(f"Unexpected error in generate_feedback: {e}", exc_info=True)
        return {
            "summary": "피드백 생성 중 예상치 못한 오류가 발생했습니다.",
            "strengths": [],
            "weaknesses": [],
            "suggested_tests": [],
            "score_adjustment": 0,
        }

