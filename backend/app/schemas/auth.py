"""Authentication schemas."""

from typing import Optional
from pydantic import BaseModel


class UserResponse(BaseModel):
    """User response schema."""
    id: str
    email: str
    username: str
    avatar_url: Optional[str] = None
    github_username: Optional[str] = None


class AuthStatusResponse(BaseModel):
    """Authentication status response."""
    authenticated: bool
    user: Optional[UserResponse] = None
