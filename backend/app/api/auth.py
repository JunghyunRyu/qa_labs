"""Authentication API routes."""

import secrets
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session

from app.models.db import get_db
from app.core.config import settings
from app.core.auth import (
    create_access_token,
    create_refresh_token,
    decode_token,
    set_auth_cookies,
    clear_auth_cookies
)
from app.core.dependencies import get_current_user, get_current_user_optional
from app.services.github_oauth import github_oauth_service
from app.models.user import User
from app.schemas.auth import UserResponse, AuthStatusResponse

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/github/login")
async def github_login(request: Request):
    """Initiate GitHub OAuth login flow."""
    if not settings.GITHUB_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="GitHub OAuth is not configured"
        )

    # Generate state for CSRF protection
    state = secrets.token_urlsafe(32)

    # Get authorization URL
    authorization_url = github_oauth_service.get_authorization_url(state)

    response = Response(status_code=status.HTTP_307_TEMPORARY_REDIRECT)
    response.headers["Location"] = authorization_url
    response.set_cookie(
        key="oauth_state",
        value=state,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite="lax",
        max_age=600,  # 10 minutes
        path="/"
    )
    return response


@router.get("/github/callback")
async def github_callback(
    code: str,
    state: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """Handle GitHub OAuth callback."""
    # Verify state
    stored_state = request.cookies.get("oauth_state")
    if not stored_state or stored_state != state:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OAuth state"
        )

    try:
        # Exchange code for token
        github_token = await github_oauth_service.exchange_code_for_token(code)

        # Get user info from GitHub
        github_user = await github_oauth_service.get_user_info(github_token)

        if not github_user.email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="GitHub account must have a public email or grant email access"
            )

        # Find or create user
        user = db.query(User).filter(User.github_id == github_user.id).first()

        if not user:
            # Check if email already exists
            user = db.query(User).filter(User.email == github_user.email).first()
            if user:
                # Link GitHub to existing account
                user.github_id = github_user.id
                user.github_username = github_user.login
                user.avatar_url = github_user.avatar_url
            else:
                # Create new user
                user = User(
                    email=github_user.email,
                    username=github_user.name or github_user.login,
                    github_id=github_user.id,
                    github_username=github_user.login,
                    avatar_url=github_user.avatar_url,
                )
                db.add(user)

        # Update last login
        user.last_login_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(user)

        logger.info(f"User logged in: {user.email} (GitHub: {github_user.login})")

        # Create JWT tokens
        access_token = create_access_token(user.id, user.email, user.username)
        refresh_token = create_refresh_token(user.id)

        # Redirect to frontend with cookies
        frontend_url = getattr(settings, 'FRONTEND_URL', None) or (settings.CORS_ORIGINS[0] if settings.CORS_ORIGINS else "http://localhost:3000")
        response = Response(status_code=status.HTTP_307_TEMPORARY_REDIRECT)
        response.headers["Location"] = f"{frontend_url}/auth/callback"

        set_auth_cookies(response, access_token, refresh_token)
        response.delete_cookie("oauth_state", path="/")

        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"GitHub OAuth error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication failed"
        )


@router.post("/refresh")
async def refresh_token(
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    """Refresh access token using refresh token."""
    refresh_token_value = request.cookies.get("refresh_token")
    if not refresh_token_value:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token not found"
        )

    try:
        payload = decode_token(refresh_token_value)
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type"
            )

        user_id = payload["sub"]
        user = db.query(User).filter(
            User.id == user_id,
            User.is_active == True
        ).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )

        # Create new tokens
        new_access_token = create_access_token(user.id, user.email, user.username)
        new_refresh_token = create_refresh_token(user.id)

        set_auth_cookies(response, new_access_token, new_refresh_token)

        return {"message": "Token refreshed"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token refresh error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )


@router.post("/logout")
async def logout(response: Response):
    """Logout user by clearing cookies."""
    clear_auth_cookies(response)
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
async def get_me(user: User = Depends(get_current_user)):
    """Get current authenticated user."""
    return UserResponse(
        id=str(user.id),
        email=user.email,
        username=user.username,
        avatar_url=user.avatar_url,
        github_username=user.github_username
    )


@router.get("/status", response_model=AuthStatusResponse)
async def get_auth_status(user: User = Depends(get_current_user_optional)):
    """Check authentication status."""
    if user:
        return AuthStatusResponse(
            authenticated=True,
            user=UserResponse(
                id=str(user.id),
                email=user.email,
                username=user.username,
                avatar_url=user.avatar_url,
                github_username=user.github_username
            )
        )
    return AuthStatusResponse(authenticated=False, user=None)
