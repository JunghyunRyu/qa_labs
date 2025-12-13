"""AI Coach Service for QA coaching conversations."""

import logging
import re
from typing import Optional, List, Dict, Tuple

from app.core.llm_client import llm_client
from app.models.ai_conversation import AIConversation, AIMessage
from app.models.problem import Problem

logger = logging.getLogger(__name__)

# Constants
MAX_CONTEXT_MESSAGES = 10  # Include last N messages in context
MAX_CODE_BLOCK_LINES = 10  # Truncate code blocks beyond this
APPROX_CHARS_PER_TOKEN = 4  # Rough estimation for token counting

# System Prompt for AI Coach
COACH_SYSTEM_PROMPT = """당신은 QA/테스트 코드 작성을 도와주는 AI 코치입니다.

## 역할
- 사용자가 더 나은 테스트 코드를 작성할 수 있도록 힌트와 질문을 제공합니다.
- QA 관점에서 누락된 테스트 케이스, 경계값, 반례를 찾도록 유도합니다.

## 금지사항
- 절대로 완성된 테스트 코드나 정답을 직접 제공하지 마세요.
- 함수의 전체 구현을 보여주지 마세요.
- 코드 블록은 최소한으로 사용하고, 힌트 형태로 제공하세요.

## 권장사항
- 질문으로 사용자의 사고를 유도하세요.
- "~를 테스트해 보셨나요?" 형태로 힌트를 주세요.
- 경계값, 예외 케이스, 엣지 케이스를 언급하세요.
- 사용자의 현재 코드에 대한 피드백을 제공하세요.

## 응답 형식
- 한국어로 답변합니다.
- 간결하고 명확하게 답변합니다.
- 코드 블록 사용 시 10줄을 넘기지 마세요.
"""

# Problem-specific system prompt template
PROBLEM_CONTEXT_TEMPLATE = """
## 현재 문제 정보
- 제목: {title}
- 난이도: {difficulty}
- 평가 기술: {skills}

## 문제 설명
{description}

## 함수 시그니처
```python
{signature}
```

사용자가 이 문제를 풀고 있습니다. 힌트를 주되, 정답을 알려주지 마세요.
"""


def estimate_tokens(text: str) -> int:
    """Estimate token count for text."""
    return len(text) // APPROX_CHARS_PER_TOKEN


def truncate_code_blocks(content: str, max_lines: int = MAX_CODE_BLOCK_LINES) -> str:
    """Truncate long code blocks in content."""
    pattern = r'```(\w*)\n(.*?)```'

    def truncate_match(match):
        lang = match.group(1)
        code = match.group(2)
        lines = code.split('\n')
        if len(lines) > max_lines:
            truncated = '\n'.join(lines[:max_lines])
            return f"```{lang}\n{truncated}\n... ({len(lines) - max_lines}줄 생략)\n```"
        return match.group(0)

    return re.sub(pattern, truncate_match, content, flags=re.DOTALL)


def apply_guardrails(response: str) -> str:
    """Apply guardrails to AI response.

    - Truncate long code blocks
    - Add warning if response seems to contain full solution
    """
    # Truncate long code blocks
    response = truncate_code_blocks(response)

    # Check for suspicious patterns (full function definitions)
    full_solution_patterns = [
        r'def test_\w+\([^)]*\):\s*\n(?:\s+.+\n){10,}',  # Function with 10+ lines
        r'assert.*\n.*assert.*\n.*assert.*\n.*assert.*\n.*assert',  # Multiple assertions
    ]

    for pattern in full_solution_patterns:
        if re.search(pattern, response):
            response += "\n\n> 힌트: 위 코드는 참고용입니다. 직접 생각하고 작성해보세요!"
            break

    return response


def build_problem_context(problem: Problem) -> str:
    """Build context string for a problem."""
    skills_text = ", ".join(problem.skills) if problem.skills else "미지정"

    # Truncate description if too long
    description = problem.description_md
    if len(description) > 1000:
        description = description[:1000] + "...(중략)"

    # Get function signature from code template
    signature = problem.code_template or "(시그니처 없음)"

    return PROBLEM_CONTEXT_TEMPLATE.format(
        title=problem.title,
        difficulty=problem.difficulty,
        skills=skills_text,
        description=description,
        signature=signature,
    )


def build_conversation_context(
    messages: List[AIMessage],
    max_messages: int = MAX_CONTEXT_MESSAGES,
) -> List[Dict[str, str]]:
    """Build conversation context for LLM.

    Args:
        messages: List of AIMessage objects
        max_messages: Maximum number of messages to include

    Returns:
        List of message dicts for LLM API
    """
    context = []
    for msg in messages[-max_messages:]:
        if msg.role in ('user', 'assistant'):
            context.append({
                "role": msg.role,
                "content": msg.content
            })
    return context


def generate_response(
    user_message: str,
    conversation_messages: List[AIMessage],
    problem: Optional[Problem] = None,
    code_context: Optional[str] = None,
) -> Tuple[str, int]:
    """
    Generate AI coach response.

    Args:
        user_message: User's current message
        conversation_messages: Previous messages in conversation
        problem: Problem context (optional)
        code_context: User's current code (optional)

    Returns:
        Tuple of (AI response text, estimated token count)
    """
    # Build system prompt
    system_prompt = COACH_SYSTEM_PROMPT
    if problem:
        system_prompt += build_problem_context(problem)

    # Build messages for LLM
    messages = [{"role": "system", "content": system_prompt}]

    # Add conversation history
    context_messages = build_conversation_context(conversation_messages)
    messages.extend(context_messages)

    # Add code context if provided
    if code_context:
        user_message_with_context = f"""현재 작성 중인 코드:
```python
{code_context}
```

{user_message}"""
    else:
        user_message_with_context = user_message

    # Add current user message
    messages.append({"role": "user", "content": user_message_with_context})

    try:
        # Call LLM
        response = llm_client.generate_chat_completion(
            messages=messages,
            temperature=0.7,
        )

        # Apply guardrails
        response = apply_guardrails(response)

        # Estimate tokens
        token_estimate = estimate_tokens(response)

        logger.info(
            f"[AI_COACH] Generated response: "
            f"message_len={len(user_message)}, "
            f"response_len={len(response)}, "
            f"token_estimate={token_estimate}, "
            f"history_count={len(conversation_messages)}"
        )

        return response, token_estimate

    except Exception as e:
        logger.error(f"AI Coach generation failed: {e}", exc_info=True)
        fallback_response = (
            "죄송합니다. 현재 AI 코치 서비스에 문제가 발생했습니다. "
            "잠시 후 다시 시도해주세요."
        )
        return fallback_response, estimate_tokens(fallback_response)
