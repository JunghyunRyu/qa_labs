"""FastAPI dependencies for authentication."""

from typing import Optional
from uuid import UUID

from fastapi import Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.models.db import get_db
from app.core.auth import decode_token
from app.models.user import User


async def get_current_user_optional(
    request: Request,
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Get current user from cookie if present, None otherwise."""
    access_token = request.cookies.get("access_token")
    if not access_token:
        return None

    try:
        payload = decode_token(access_token)
        if payload.get("type") != "access":
            return None

        user_id = UUID(payload["sub"])
        user = db.query(User).filter(
            User.id == user_id,
            User.is_active == True
        ).first()
        return user
    except Exception:
        return None


async def get_current_user(
    request: Request,
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user (required)."""
    user = await get_current_user_optional(request, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    return user
