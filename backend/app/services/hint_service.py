"""
Hint Generation Service (M5-5).

문제 풀이를 위한 3단계 힌트 생성 서비스.
- Level 1: 방향성 힌트 (코드 없음, ~100자)
- Level 2: 구체적 접근법 (의사코드, ~200자)
- Level 3: 코드 예시 (pytest 예시 1개, ~300자)
"""

import logging
from typing import Optional

from pydantic import BaseModel, Field, ValidationError

from app.core.llm_client import llm_client, Verbosity
from app.models.problem import Problem

logger = logging.getLogger(__name__)


# ============================================================================
# 응답 스키마
# ============================================================================


class ProblemHints(BaseModel):
    """3단계 힌트 구조."""

    level1: str = Field(
        ...,
        description="방향성 힌트 (코드 없이 테스트 방향만, ~100자)",
        max_length=150,
    )
    level2: str = Field(
        ...,
        description="구체적 접근법 (테스트 카테고리, 의사코드, ~200자)",
        max_length=300,
    )
    level3: str = Field(
        ...,
        description="pytest 코드 예시 1개 (~300자)",
        max_length=500,
    )


# ============================================================================
# 프롬프트 템플릿
# ============================================================================

SYSTEM_PROMPT = """너는 QA 테스트 코칭 전문가이다.

주어진 문제에 대해 3단계 힌트를 생성하라:

## Level 1: 방향성 힌트 (100자 이내)
- 테스트 설계 방향만 언급
- 코드 없음
- "경계값을 테스트해보세요", "에러 상황을 고려해보세요" 등

## Level 2: 구체적 접근법 (200자 이내)
- 테스트 카테고리 언급 (경계값, 동치 분할, 에러 처리 등)
- 구체적인 테스트 상황 설명
- 의사코드나 테스트 목록 형태 가능

## Level 3: 코드 예시 (300자 이내)
- pytest 테스트 함수 1개 예시
- 가장 중요한 테스트 케이스 1개만
- 실제 동작하는 코드

응답 형식:
{
  "level1": "방향성 힌트...",
  "level2": "구체적 접근법...",
  "level3": "pytest 코드 예시..."
}

JSON 형식으로만 응답하세요."""


def _build_user_prompt(problem: Problem) -> str:
    """힌트 생성을 위한 사용자 프롬프트 구성."""
    # 버그 요약 (힌트 생성에 참고)
    bug_summaries = []
    if problem.buggy_implementations:
        for i, buggy in enumerate(problem.buggy_implementations[:3], 1):
            if buggy.bug_description:
                bug_summaries.append(f"{i}. {buggy.bug_description}")

    bugs_info = "\n".join(bug_summaries) if bug_summaries else "없음"

    return f"""[문제 정보]
제목: {problem.title}
난이도: {problem.difficulty}
도메인: {problem.domain}

[문제 설명]
{problem.description_md[:1000]}

[함수 시그니처]
{problem.function_signature}

[숨겨진 버그 유형 (참고용)]
{bugs_info}

위 문제에 대해 3단계 힌트를 생성하세요.
학습자가 단계적으로 테스트 설계 능력을 키울 수 있도록 도와주세요."""


def _get_default_hints(problem: Problem) -> ProblemHints:
    """LLM 호출 실패 시 기본 힌트 반환."""
    return ProblemHints(
        level1="경계값과 예외 상황을 테스트해보세요. 정상적인 입력만 고려하면 버그를 놓칠 수 있습니다.",
        level2="다음을 확인해보세요:\n1. 빈 입력/None 처리\n2. 경계값 (최소, 최대)\n3. 잘못된 타입 입력\n4. 극단적인 케이스",
        level3=f"""def test_edge_case():
    # 경계값 또는 예외 상황 테스트
    result = {problem.function_signature.split('(')[0].replace('def ', '')}(경계값)
    assert result == 예상값""",
    )


def generate_problem_hints(
    problem: Problem,
    verbosity: Verbosity = "low",
) -> ProblemHints:
    """
    문제에 대한 3단계 힌트를 생성합니다.

    Args:
        problem: Problem 모델 인스턴스
        verbosity: LLM 출력 상세도

    Returns:
        ProblemHints: 3단계 힌트 (level1, level2, level3)
    """
    try:
        user_prompt = _build_user_prompt(problem)

        logger.info(
            f"Generating hints for problem '{problem.title}' "
            f"(id={problem.id}, verbosity={verbosity})"
        )

        response = llm_client.generate_json_with_responses_api(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=user_prompt,
            verbosity=verbosity,
        )

        # 스키마 검증
        try:
            validated = ProblemHints(**response)
            logger.info(f"Generated hints successfully for problem {problem.id}")
            return validated

        except ValidationError as e:
            logger.error(f"Hint schema validation failed: {e}")
            return _get_default_hints(problem)

    except RuntimeError as e:
        logger.error(f"LLM API error in hint generation: {e}")
        return _get_default_hints(problem)

    except Exception as e:
        logger.error(f"Unexpected error in generate_problem_hints: {e}", exc_info=True)
        return _get_default_hints(problem)


def generate_and_save_hints(
    problem: Problem,
    db_session,
    verbosity: Verbosity = "low",
) -> Optional[dict]:
    """
    문제에 대한 힌트를 생성하고 DB에 저장합니다.

    Args:
        problem: Problem 모델 인스턴스
        db_session: SQLAlchemy 세션
        verbosity: LLM 출력 상세도

    Returns:
        저장된 hints dict 또는 None (실패 시)
    """
    try:
        hints = generate_problem_hints(problem, verbosity)
        hints_dict = {
            "level1": hints.level1,
            "level2": hints.level2,
            "level3": hints.level3,
        }

        # DB에 저장
        problem.hints = hints_dict
        db_session.commit()

        logger.info(f"Saved hints for problem {problem.id}")
        return hints_dict

    except Exception as e:
        logger.error(f"Failed to save hints for problem {problem.id}: {e}")
        db_session.rollback()
        return None
