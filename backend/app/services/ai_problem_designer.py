"""AI Problem Designer service."""

import logging
from typing import Dict, Any, List, Optional, Literal
from pydantic import BaseModel, ValidationError

from app.core.llm_client import llm_client, ReasoningEffort

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


# Prompt 템플릿 - 함수로 변경하여 플레이스홀더 치환
def get_system_prompt(testing_framework: str = "pytest", language: str = "python") -> str:
    """
    System prompt를 동적으로 생성합니다.
    
    Args:
        testing_framework: 테스트 프레임워크 (기본값: pytest)
        language: 프로그래밍 언어 (기본값: python)
    
    Returns:
        포맷팅된 시스템 프롬프트 문자열
    """
    return f"""
너는 QA-Arena라는 '테스트 자동화/QA 역량 평가 플랫폼'에서 사용할 문제를 설계하는 시니어 SDET(Software Development Engineer in Test)이다.

이 플랫폼에서 지원자는 '함수를 구현'하는 것이 아니라,
이미 주어진 함수에 대해 {testing_framework} 기반 테스트 코드를 작성하여 버그를 찾아내는 것이 목표이다.
따라서 너의 핵심 임무는 '테스트 관점에서 교육적이고 평가 가능한 버그 세트'를 설계하는 것이다.

[입력으로 주어지는 정보]
- goal: 문제의 전체 목표/맥락 설명
- language: 사용할 프로그래밍 언어 (현재는 대부분 "{language}")
- testing_framework: 사용할 테스트 프레임워크 (예: "{testing_framework}")
- skills_to_assess: 평가하고 싶은 QA 스킬 목록
  예) "boundary value analysis", "equivalence partitioning", "state-based testing",
      "error handling", "api response validation", "data structure reasoning" 등
- difficulty: 난이도 ("Easy", "Medium", "Hard")
- problem_style: 문제 스타일 (예: "unit_test_for_single_function")

[출력]
입력 정보를 반영해서, QA 코딩 테스트 문제를 하나 생성한다.
출력은 반드시 **유효한 JSON 객체 하나만** 문자열 형태로 반환한다.

생성해야 할 항목:
1. function_signature
   - 테스트 대상 함수의 시그니처 (예: "def sum_list(values: list[int]) -> int:")
   - 타입 힌트를 포함하고, 간결한 하나의 함수만 정의한다.
   - I/O(파일, 네트워크, print, input 등)나 랜덤성, 시간 의존성은 사용하지 않는다.

2. golden_code
   - function_signature와 완전히 동일한 시그니처를 가진, 정상 동작하는 구현 코드 (완전한 함수 코드)
   - {language} 문법으로 실행 가능해야 한다.
   - 함수에 짧은 docstring을 포함하여 동작과 주요 경계/예외를 설명한다.
   - 부수 효과(side effect)를 최소화하고 순수 함수에 가깝게 작성한다.

3. buggy_implementations
   - 최소 3개, 최대 5개의 버그 구현을 포함한다.
   - 각 항목은 다음 필드를 가진다:
     - bug_description: 어떤 유형의 버그인지, 어떤 입력/케이스에서 드러나는지 간단 명료하게 설명
     - buggy_code: golden_code와 같은 시그니처를 가지지만, 의도적인 버그가 포함된 완전한 함수 코드
     - weight: 1~5 사이 정수. 버그의 중요도/교육적 가치 (1=사소, 3=보통, 5=핵심)
   - 모든 buggy_code는 문법적으로 유효해야 하며, 실행 시 예외가 발생하더라도 import / 실행 자체는 가능해야 한다.
   - 각 버그는 **skills_to_assess에 포함된 스킬**과 직접적으로 연결되도록 설계한다.
     예)
       - "boundary value analysis": 경계값 포함/미포함, 최소/최대 값 처리 누락, off-by-one 오류 등
       - "equivalence partitioning": 특정 입력 파티션만 잘못 처리하거나 누락
       - "error handling": 특정 예외 상황에서 잘못된 예외 타입, 예외 미발생, 메시지 누락 등
       - "api response validation": 필수 필드 누락, 상태코드/형식 검증 누락 등
   - 가능한 한 서로 다른 유형의 실수를 포함하여, 다양한 테스트 아이디어가 필요하도록 만든다.

4. description_md
   - Markdown 형식의 문제 설명 문자열.
   - 포함해야 할 내용:
     - 짧은 비즈니스/도메인 맥락 (왜 이 함수를 테스트해야 하는지)
     - 함수의 역할, 입력 파라미터, 반환값 설명
     - 정상 동작 예시 1~2개 (간단한 입력/출력 예시)
     - 다루어야 할 경계/예외 상황에 대한 힌트 (정답을 직접적으로 밝히지 말고, 테스트 아이디어를 유도하는 수준)
     - 수험자가 해야 할 일: '{testing_framework} 기반 테스트 코드를 작성해 버그 구현들을 최대한 많이 탐지하라'는 지시
   - skills_to_assess를 자연스러운 문장으로 드러내되, 특정 buggy_implementation 내용을 직접적으로 폭로하지 않는다.

5. initial_test_template
   - {testing_framework} 기반 초기 테스트 템플릿 코드 (문자열).
   - 포함해야 할 것:
     - 필요한 import (예: "import {testing_framework}", "from target import function_name")
     - 최소 2~3개의 빈 테스트 함수 (pass 또는 TODO 주석)
     - skills_to_assess와 difficulty를 반영한 테스트 이름/주석
       예) 경계값 분석 → test_min_boundary, test_max_boundary 등
   - 실제 정답 테스트 케이스(올바른 assert)는 포함하지 않는다. 힌트 수준의 주석만 제공한다.

6. tags
   - 문자열 리스트.
   - 포함 권장:
     - difficulty (예: "easy", "medium", "hard")
     - 주요 skills_to_assess (예: "boundary value analysis", "equivalence partitioning")
     - 도메인/유형 (예: "string", "list", "api", "date-time" 등)

"""
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
    """
    skills_str = ", ".join(skills_to_assess)

    return f"""당신의 역할:
- 당신은 테스트 자동화/QA 교육용 문제를 설계하는 시니어 SDET입니다.
- QA-Arena 플랫폼에서 사용자가 {testing_framework} 기반 테스트 코드를 작성하여
  버그를 찾아내도록 만드는 문제를 설계해야 합니다.

[GOAL]
{goal}

[LANGUAGE]
{language}

[TEST FRAMEWORK]
{testing_framework}

[SKILLS TO ASSESS]
{skills_str}

[DIFFICULTY]
{difficulty}

[PROBLEM STYLE]
{problem_style}

위 정보들을 기반으로, 수험자가 '{testing_framework}'를 사용해 테스트 코드를 작성하면서
위의 SKILLS TO ASSESS를 실제로 연습하고 평가받을 수 있는 문제를 설계하세요.

특히 다음을 만족하도록 하십시오:
- 함수/로직은 실제 서비스에서도 나올 법한 현실적인 시나리오일 것
- 각 buggy_implementation은 SKILLS TO ASSESS 중 하나 이상과 명확히 연결될 것
- 난이도(DIFFICULTY)에 맞는 로직 복잡도와 버그 난이도를 가질 것
- PROBLEM STYLE(예: unit_test_for_single_function)에 맞게, 단일 함수 중심의 테스트가 가능할 것

[OUTPUT SCHEMA]
다음 JSON 형식으로 정확히 응답하세요 (예시는 형식 참고용이며, 값은 상황에 맞게 채우세요):

{{
  "function_signature": "def function_name(params: type) -> return_type:",
  "golden_code": "완전한 함수 코드 (여러 줄 가능, \\n 으로 줄바꿈)",
  "buggy_implementations": [
    {{
      "bug_description": "버그 설명 (어떤 입력/상황에서 실패하는지 명확히)",
      "buggy_code": "버그가 있는 완전한 함수 코드",
      "weight": 3
    }}
  ],
  "description_md": "## 문제 설명\\n\\nMarkdown 형식의 설명 (문제 맥락, 함수 동작, 입력/출력, 예시, 테스트 힌트 포함)",
  "initial_test_template": "import {testing_framework}\\nfrom target import function_name\\n\\n# TODO: 경계값, 예외 상황 등을 포함한 테스트 함수를 작성하세요.\\n",
  "tags": ["{difficulty.lower()}", "qa", "testing", "unit-test"],
  "difficulty": "{difficulty}"
}}

[제약 사항]
- **JSON 객체 하나만** 반환하세요. JSON 앞이나 뒤에 자연어/마크다운/설명 문장을 추가하지 마세요.
- 코드 문자열 안에 ``` 또는 ```python 같은 마크다운 코드 블록 표기를 넣지 마세요.
- 모든 코드는 {language}와 {testing_framework} 기준으로 실행 가능해야 합니다.
- buggy_implementations는 최소 3개 이상, 최대 5개 이하로 생성하세요.
- 각 buggy_implementation의 buggy_code는 function_signature, golden_code와 완전히 동일한 함수 시그니처를 사용해야 합니다.
- initial_test_template에는 최소 2개 이상의 빈 테스트 함수와, SKILLS TO ASSESS에 맞는 테스트 아이디어(TODO 주석)를 포함하세요.
"""



def generate_problem(
    goal: str,
    language: str = "python",
    testing_framework: str = "pytest",
    skills_to_assess: List[str] = None,
    difficulty: str = "Easy",
    problem_style: str = "unit_test_for_single_function",
    use_reasoning: bool = True,
    reasoning_effort: Optional[ReasoningEffort] = "high",
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
        use_reasoning: Reasoning 모델 사용 여부 (기본값: True)
                       True면 o3-mini 등 reasoning 모델 사용, False면 일반 모델 사용
        reasoning_effort: Reasoning effort level (low, medium, high)
                          use_reasoning=True일 때만 적용됨

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

        # 동적으로 시스템 프롬프트 생성
        system_prompt = get_system_prompt(
            testing_framework=testing_framework,
            language=language
        )

        # Reasoning 모델 사용 여부에 따라 다른 LLM 호출
        if use_reasoning:
            logger.info(
                f"Using reasoning model with effort={reasoning_effort} "
                f"for problem generation (difficulty={difficulty})"
            )
            response = llm_client.generate_json_with_reasoning(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                reasoning_effort=reasoning_effort,
            )
        else:
            logger.info(
                f"Using standard model for problem generation (difficulty={difficulty})"
            )
            response = llm_client.generate_json(
                system_prompt=system_prompt,
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

