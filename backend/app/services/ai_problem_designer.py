"""AI Problem Designer service."""

import logging
from typing import Dict, Any, List
from pydantic import BaseModel, ValidationError

from app.core.llm_client import llm_client

logger = logging.getLogger(__name__)


# JSON 스키마 정의
class BuggyImplementationSchema(BaseModel):
    """Schema for buggy implementation."""

    bug_description: str
    buggy_code: str
    weight: int = 1


class GeneratedProblemSchema(BaseModel):
    """Schema for generated problem."""

    function_signature: str
    golden_code: str
    buggy_implementations: List[BuggyImplementationSchema]
    description_md: str
    initial_test_template: str
    tags: List[str] = []
    difficulty: str


# Prompt 템플릿
SYSTEM_PROMPT = """너는 테스트 자동화/QA 교육용 문제를 설계하는 시니어 SDET(Software Development Engineer in Test)이다.

입력으로 주어진 목표(goal), 평가하려는 기술(skills_to_assess)을 바탕으로, Python + pytest 기반의 QA 코딩 테스트 문제를 생성하라.

출력은 반드시 JSON 형식으로 반환한다. 코드는 실행 가능한 수준으로 작성한다.

생성해야 할 항목:
1. function_signature: 테스트 대상 함수의 시그니처 (예: "def sum_list(values: list[int]) -> int:")
2. golden_code: 정상 동작하는 구현 코드 (완전한 함수 코드)
3. buggy_implementations: 버그가 있는 구현들 (최소 3-5개)
   - 각 버그 구현은 bug_description, buggy_code, weight를 포함
   - weight는 버그의 중요도 (1-5)
4. description_md: 문제 설명 (Markdown 형식)
5. initial_test_template: 초기 테스트 템플릿 (import 문과 기본 구조)
6. tags: 문제 태그 리스트
7. difficulty: 난이도 ("Easy", "Medium", "Hard")

중요:
- 모든 코드는 실행 가능해야 함
- buggy_code는 실제로 버그가 있어야 함 (테스트로 발견 가능)
- description_md는 명확하고 이해하기 쉬워야 함
- skills_to_assess에 명시된 기술을 평가할 수 있는 버그를 포함해야 함"""


def build_user_prompt(
    goal: str,
    language: str,
    testing_framework: str,
    skills_to_assess: List[str],
    difficulty: str,
    problem_style: str = "unit_test_for_single_function",
) -> str:
    """
    Build user prompt for LLM.

    Args:
        goal: Problem goal/description
        language: Programming language
        testing_framework: Testing framework
        skills_to_assess: List of skills to assess
        difficulty: Difficulty level
        problem_style: Problem style

    Returns:
        Formatted user prompt
    """
    return f"""[GOAL]
{goal}

[LANGUAGE]
{language}

[TEST FRAMEWORK]
{testing_framework}

[SKILLS TO ASSESS]
{', '.join(skills_to_assess)}

[DIFFICULTY]
{difficulty}

[PROBLEM STYLE]
{problem_style}

[OUTPUT SCHEMA]
다음 JSON 형식으로 응답하세요:
{{
  "function_signature": "def function_name(params) -> return_type:",
  "golden_code": "완전한 함수 코드 (여러 줄 가능)",
  "buggy_implementations": [
    {{
      "bug_description": "버그 설명",
      "buggy_code": "버그가 있는 코드",
      "weight": 1
    }}
  ],
  "description_md": "## 문제 설명\\n\\nMarkdown 형식의 설명",
  "initial_test_template": "import pytest\\nfrom target import function_name\\n\\n# TODO: 테스트 케이스를 작성하세요.",
  "tags": ["tag1", "tag2"],
  "difficulty": "Easy"
}}

중요:
- JSON만 반환하세요 (추가 설명 없이)
- 모든 코드는 실행 가능해야 합니다
- buggy_implementations는 최소 3개 이상 포함하세요
"""


def generate_problem(
    goal: str,
    language: str = "python",
    testing_framework: str = "pytest",
    skills_to_assess: List[str] = None,
    difficulty: str = "Easy",
    problem_style: str = "unit_test_for_single_function",
) -> Dict[str, Any]:
    """
    Generate a problem using AI.

    Args:
        goal: Problem goal/description
        language: Programming language (default: python)
        testing_framework: Testing framework (default: pytest)
        skills_to_assess: List of skills to assess
        difficulty: Difficulty level (Easy, Medium, Hard)
        problem_style: Problem style

    Returns:
        Generated problem dictionary

    Raises:
        ValueError: If validation fails or LLM call fails
        RuntimeError: If LLM API call fails
    """
    if skills_to_assess is None:
        skills_to_assess = []

    try:
        user_prompt = build_user_prompt(
            goal=goal,
            language=language,
            testing_framework=testing_framework,
            skills_to_assess=skills_to_assess,
            difficulty=difficulty,
            problem_style=problem_style,
        )

        # LLM 호출
        response = llm_client.generate_json(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=user_prompt,
            temperature=0.7,
        )

        # JSON 스키마 검증
        try:
            validated = GeneratedProblemSchema(**response)
            return validated.model_dump()
        except ValidationError as e:
            logger.error(f"Schema validation failed: {e}")
            raise ValueError(f"Generated problem does not match schema: {e}")

    except ValueError as e:
        raise
    except RuntimeError as e:
        logger.error(f"LLM call failed: {e}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error in generate_problem: {e}", exc_info=True)
        raise ValueError(f"Failed to generate problem: {str(e)}")

