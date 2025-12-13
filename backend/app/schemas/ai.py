"""AI Coach schemas."""

from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID
from typing import Optional, List
from enum import Enum


class AIChatMode(str, Enum):
    """AI Chat mode enum."""
    OFF = "OFF"
    COACH = "COACH"


class AIChatRequest(BaseModel):
    """Schema for AI chat request."""

    problem_id: int
    submission_id: Optional[UUID] = None
    mode: AIChatMode = AIChatMode.COACH
    message: str = Field(..., min_length=1, max_length=2000)
    code_context: Optional[str] = None
    conversation_id: Optional[UUID] = None  # None for new conversation


class AIChatResponse(BaseModel):
    """Schema for AI chat response."""

    reply: str
    conversation_id: UUID
    message_id: UUID
    token_estimate: Optional[int] = None


class AIMessageResponse(BaseModel):
    """Schema for AI message response."""

    id: UUID
    role: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class AIConversationResponse(BaseModel):
    """Schema for AI conversation response with messages."""

    id: UUID
    problem_id: int
    mode: str
    created_at: datetime
    updated_at: datetime
    messages: List[AIMessageResponse] = []

    model_config = {"from_attributes": True}


class AIConversationListItem(BaseModel):
    """Schema for AI conversation list item."""

    id: UUID
    problem_id: int
    problem_title: Optional[str] = None
    mode: str
    message_count: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AIConversationListResponse(BaseModel):
    """Schema for paginated AI conversation list response."""

    conversations: List[AIConversationListItem]
    total: int
    page: int
    page_size: int
    total_pages: int
