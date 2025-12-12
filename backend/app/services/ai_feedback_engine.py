"""AI Feedback Engine service."""

import logging
from typing import Dict, Any, List
from pydantic import BaseModel, ValidationError

from app.core.llm_client import llm_client, Verbosity
from typing import Optional

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

아래는 한 수강생이 작성한 pytest 테스트 코드와, 그 테스트를 돌린 결과(점수, mutant kill ratio, pytest 로그)이다.

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
            pytest_output += "Mutant 테스트 결과:\n"
            for i, mutant_log in enumerate(mutants_log[:3], 1):  # 처음 3개만 표시
                pytest_output += f"Mutant {i}: {mutant_log.get('stdout', '')[:200]}...\n"

    return f"""[문제 정보]
제목: {problem_title}
설명: {problem_description[:500]}
평가 기술: {skills_text}

[제출된 테스트 코드]
```python
{test_code}
```

[채점 결과]
점수: {score}/100
Killed Mutants: {killed_mutants}/{total_mutants}
Kill Ratio: {kill_ratio:.2%}

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
) -> Dict[str, Any]:
    """
    Generate feedback using AI.

    GPT-5.2 최적화:
    - 점수 기반 verbosity 자동 조절
    - 낮은 점수일수록 더 상세한 피드백 제공

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
        )

        logger.info(f"Generating feedback with GPT-5.2 (score={score}, verbosity={verbosity})")

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

