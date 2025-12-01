"""LLM client for AI services."""

import json
import logging
from typing import Optional, Dict, Any, Literal
from openai import OpenAI
from openai import APIError as OpenAIAPIError

from app.core.config import settings

logger = logging.getLogger(__name__)

# Reasoning effort 타입 정의 (GPT-5.1에서 "none" 추가)
ReasoningEffort = Literal["none", "low", "medium", "high"]


class LLMClient:
    """Client for interacting with LLM APIs."""

    def __init__(self):
        """Initialize LLM client."""
        if not settings.OPENAI_API_KEY:
            logger.warning("OPENAI_API_KEY not set. LLM features will not work.")
            self.client = None
        else:
            self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.OPENAI_MODEL
        self.reasoning_model = settings.OPENAI_REASONING_MODEL
        self.reasoning_effort = settings.OPENAI_REASONING_EFFORT

    def generate_completion(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        reasoning_effort: Optional[ReasoningEffort] = "none",
    ) -> str:
        """
        GPT-5.1 Responses API를 사용하여 completion 생성.

        Args:
            system_prompt: System prompt
            user_prompt: User prompt
            temperature: Temperature for generation (reasoning_effort="none"일 때만 적용)
            max_tokens: Maximum tokens to generate
            reasoning_effort: Reasoning effort (기본값: "none" - 빠른 응답)

        Returns:
            Generated text

        Raises:
            ValueError: If API key is not set
            RuntimeError: If API call fails
        """
        if not self.client:
            raise ValueError("OPENAI_API_KEY is not set. Cannot use LLM features.")

        try:
            # GPT-5.1 Responses API는 system message를 지원하지 않으므로 
            # system prompt를 input에 포함
            combined_prompt = f"""[System Instructions]
{system_prompt}

[User Request]
{user_prompt}"""

            logger.info(f"Using GPT-5.1 Responses API: model={self.model}, effort={reasoning_effort}")

            # GPT-5.1 Responses API 사용
            api_params = {
                "model": self.model,
                "input": combined_prompt,
                "reasoning": {"effort": reasoning_effort},
            }
            
            # reasoning_effort가 "none"일 때만 temperature 지원
            if reasoning_effort == "none" and temperature != 0.7:
                # GPT-5.1은 temperature를 직접 지원하지 않음, verbosity로 대체
                pass
            
            # max_tokens가 설정된 경우
            if max_tokens is not None:
                api_params["max_output_tokens"] = max_tokens

            response = self.client.responses.create(**api_params)

            return response.output_text or ""

        except OpenAIAPIError as e:
            logger.error(f"OpenAI API error: {e}")
            raise RuntimeError(f"LLM API call failed: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error in LLM call: {e}", exc_info=True)
            raise RuntimeError(f"Unexpected error in LLM call: {str(e)}")

    def generate_json(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.7,
    ) -> Dict[str, Any]:
        """
        Generate JSON response using LLM.

        Args:
            system_prompt: System prompt (should instruct to return JSON)
            user_prompt: User prompt
            temperature: Temperature for generation

        Returns:
            Parsed JSON as dictionary

        Raises:
            ValueError: If API key is not set or JSON parsing fails
            RuntimeError: If API call fails
        """
        response_text = self.generate_completion(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=temperature,
        )

        # Try to extract JSON from response (might be wrapped in markdown code blocks)
        response_text = response_text.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        response_text = response_text.strip()

        try:
            return json.loads(response_text)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {e}")
            logger.error(f"Response text: {response_text[:500]}")
            raise ValueError(f"Failed to parse JSON response: {str(e)}")

    def generate_with_reasoning(
        self,
        system_prompt: str,
        user_prompt: str,
        reasoning_effort: Optional[ReasoningEffort] = None,
        model: Optional[str] = None,
        verbosity: Optional[Literal["low", "medium", "high"]] = None,
    ) -> str:
        """
        GPT-5.1 Reasoning 모델을 사용하여 completion 생성.
        
        GPT-5.1은 복잡한 추론이 필요한 작업에 적합합니다.
        문제 생성과 같은 고품질 출력이 필요한 경우 사용합니다.

        Args:
            system_prompt: System prompt (reasoning 모델에서는 user prompt에 포함됨)
            user_prompt: User prompt
            reasoning_effort: Reasoning effort level (none, low, medium, high)
                              - none: 낮은 지연시간, GPT-5.1 기본값
                              - low: 빠른 응답
                              - medium: 균형
                              - high: 깊은 추론 (문제 생성에 권장)
            model: 사용할 모델 (기본값: gpt-5.1)
            verbosity: 출력 상세도 (low, medium, high)

        Returns:
            Generated text

        Raises:
            ValueError: If API key is not set
            RuntimeError: If API call fails
        """
        if not self.client:
            raise ValueError("OPENAI_API_KEY is not set. Cannot use LLM features.")

        use_model = model or self.reasoning_model
        effort = reasoning_effort or self.reasoning_effort

        try:
            # GPT-5.1 Responses API는 system message를 지원하지 않으므로 
            # system prompt를 input에 포함
            combined_prompt = f"""[System Instructions]
{system_prompt}

[User Request]
{user_prompt}"""

            logger.info(f"Using GPT-5.1 Responses API: model={use_model}, effort={effort}")

            # GPT-5.1 Responses API 사용
            # https://platform.openai.com/docs/guides/latest-model
            api_params = {
                "model": use_model,
                "input": combined_prompt,
                "reasoning": {"effort": effort},
            }
            
            # verbosity 옵션 추가 (선택적)
            if verbosity:
                api_params["text"] = {"verbosity": verbosity}

            response = self.client.responses.create(**api_params)

            return response.output_text or ""

        except AttributeError:
            # responses API가 없는 경우 chat.completions 사용 (fallback)
            logger.warning(
                "GPT-5.1 Responses API not available, falling back to chat.completions"
            )
            try:
                response = self.client.chat.completions.create(
                    model=use_model,
                    messages=[
                        {"role": "user", "content": combined_prompt},
                    ],
                    # GPT-5.1 reasoning 모델은 temperature 파라미터를 지원하지 않음
                )
                return response.choices[0].message.content or ""
            except OpenAIAPIError as e:
                logger.error(f"OpenAI API error (fallback): {e}")
                raise RuntimeError(f"LLM API call failed: {str(e)}")

        except OpenAIAPIError as e:
            logger.error(f"OpenAI API error: {e}")
            raise RuntimeError(f"LLM API call failed: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error in reasoning LLM call: {e}", exc_info=True)
            raise RuntimeError(f"Unexpected error in LLM call: {str(e)}")

    def generate_json_with_reasoning(
        self,
        system_prompt: str,
        user_prompt: str,
        reasoning_effort: Optional[ReasoningEffort] = None,
        model: Optional[str] = None,
        verbosity: Optional[Literal["low", "medium", "high"]] = None,
    ) -> Dict[str, Any]:
        """
        GPT-5.1 Reasoning 모델을 사용하여 JSON 응답 생성.
        
        문제 생성 등 고품질 구조화된 출력이 필요한 경우 사용합니다.

        Args:
            system_prompt: System prompt (should instruct to return JSON)
            user_prompt: User prompt
            reasoning_effort: Reasoning effort level (none, low, medium, high)
            model: 사용할 모델 (기본값: gpt-5.1)
            verbosity: 출력 상세도 (low, medium, high)

        Returns:
            Parsed JSON as dictionary

        Raises:
            ValueError: If API key is not set or JSON parsing fails
            RuntimeError: If API call fails
        """
        response_text = self.generate_with_reasoning(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            reasoning_effort=reasoning_effort,
            model=model,
            verbosity=verbosity,
        )

        # Try to extract JSON from response (might be wrapped in markdown code blocks)
        response_text = response_text.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        response_text = response_text.strip()

        try:
            return json.loads(response_text)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response (reasoning): {e}")
            logger.error(f"Response text: {response_text[:500]}")
            raise ValueError(f"Failed to parse JSON response: {str(e)}")


# Global LLM client instance
llm_client = LLMClient()

