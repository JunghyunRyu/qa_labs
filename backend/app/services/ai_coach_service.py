"""AI Coach Service for QA coaching conversations."""

import logging
import re
from typing import Optional, List, Dict, Tuple

from app.core.config import settings
from app.core.llm_client import llm_client
from app.models.ai_conversation import AIConversation, AIMessage
from app.models.problem import Problem

logger = logging.getLogger(__name__)

# Constants
MAX_CONTEXT_MESSAGES = 10  # Include last N messages in context
MAX_CODE_BLOCK_LINES = 10  # Truncate code blocks beyond this
APPROX_CHARS_PER_TOKEN = 4  # Rough estimation for token counting

# System Prompt for AI Coach (간결하게 유지)
COACH_SYSTEM_PROMPT = """QA 테스트 코치. 코드 작성 대신 질문과 힌트로 사고를 유도하세요.
금지: 코드 제공, 정답 공개. 권장: "~는 테스트해보셨나요?" 형태. 한국어, 2-3문장."""

# Problem-specific system prompt template (최소화)
PROBLEM_CONTEXT_TEMPLATE = """
[문제: {title}] {signature}
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
    """Build minimal context string for a problem."""
    signature = problem.function_signature or ""
    return PROBLEM_CONTEXT_TEMPLATE.format(
        title=problem.title,
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
    is_guest: bool = False,
    error_log: Optional[str] = None,
    test_result: Optional[dict] = None,
) -> Tuple[str, int]:
    """
    Generate AI coach response.

    Args:
        user_message: User's current message
        conversation_messages: Previous messages in conversation
        problem: Problem context (optional)
        code_context: User's current code (optional)
        is_guest: Whether the user is a guest (for model routing)
        error_log: Test error log (optional, M3)
        test_result: Test result summary (optional, M3)

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

    # Build context parts (M3: 에러 로그 우선)
    context_parts = []

    # Add error context first (highest priority)
    if error_log:
        truncated_error = error_log[:500]  # 최대 500자
        error_context = f"""[최근 테스트 에러]
```
{truncated_error}
```"""
        if test_result:
            error_context += f"""
테스트 결과: 통과 {test_result.get('passed', 0)}개, 실패 {test_result.get('failed', 0)}개, 에러 {test_result.get('errors', 0)}개"""
        context_parts.append(error_context)

    # Add code context
    if code_context:
        context_parts.append(f"""현재 작성 중인 코드:
```python
{code_context}
```""")

    # Combine context with user message
    if context_parts:
        user_message_with_context = "\n\n".join(context_parts) + f"\n\n{user_message}"
    else:
        user_message_with_context = user_message

    # Add current user message
    messages.append({"role": "user", "content": user_message_with_context})

    try:
        # Guest uses low-cost model, member uses default AI Coach model
        model = settings.AI_GUEST_MODEL if is_guest else llm_client.ai_coach_model

        # Call LLM
        response = llm_client.generate_chat_completion(
            messages=messages,
            temperature=0.7,
            model=model,
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
            f"history_count={len(conversation_messages)}, "
            f"model={model}, is_guest={is_guest}"
        )

        return response, token_estimate

    except Exception as e:
        logger.error(f"AI Coach generation failed: {e}", exc_info=True)
        fallback_response = (
            "죄송합니다. 현재 AI 코치 서비스에 문제가 발생했습니다. "
            "잠시 후 다시 시도해주세요."
        )
        return fallback_response, estimate_tokens(fallback_response)
