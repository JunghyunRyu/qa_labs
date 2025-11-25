"""LLM client for AI services."""

import json
import logging
from typing import Optional, Dict, Any
from openai import OpenAI
from openai import APIError as OpenAIAPIError

from app.core.config import settings

logger = logging.getLogger(__name__)


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

    def generate_completion(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
    ) -> str:
        """
        Generate completion using LLM.

        Args:
            system_prompt: System prompt
            user_prompt: User prompt
            temperature: Temperature for generation (0.0-2.0)
            max_tokens: Maximum tokens to generate

        Returns:
            Generated text

        Raises:
            ValueError: If API key is not set
            RuntimeError: If API call fails
        """
        if not self.client:
            raise ValueError("OPENAI_API_KEY is not set. Cannot use LLM features.")

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=temperature,
                max_tokens=max_tokens,
            )

            return response.choices[0].message.content or ""

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


# Global LLM client instance
llm_client = LLMClient()

