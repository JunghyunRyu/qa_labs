"""User schemas."""

from pydantic import BaseModel, EmailStr
from datetime import datetime
from uuid import UUID


class UserBase(BaseModel):
    """Base user schema."""

    email: EmailStr
    username: str


class UserCreate(UserBase):
    """Schema for creating a user."""

    pass


class UserResponse(UserBase):
    """Schema for user response."""

    id: UUID
    created_at: datetime

    model_config = {"from_attributes": True}

