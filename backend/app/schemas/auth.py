"""Authentication schemas."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class UserResponse(BaseModel):
    """User response schema."""
    id: str
    email: str
    username: str
    avatar_url: Optional[str] = None
    github_username: Optional[str] = None
    terms_accepted_at: Optional[datetime] = None
    tutorial_completed_at: Optional[datetime] = None


class AuthStatusResponse(BaseModel):
    """Authentication status response."""
    authenticated: bool
    user: Optional[UserResponse] = None


class TokenStatusResponse(BaseModel):
    """Token status response for AI features."""
    token_balance: int
    token_used: int
    tokens_remaining: int
    daily_bonus_remaining: int
    daily_bonus_limit: int
    next_reset: Optional[str] = None
    tier: str
