"""Authentication API routes."""

import secrets
import logging
from datetime import datetime, timezone, timedelta

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
from app.services.google_oauth import google_oauth_service
from app.models.user import User
from app.services.token_service import TokenService
from app.models.submission import Submission
from app.schemas.auth import UserResponse, AuthStatusResponse, TokenStatusResponse

logger = logging.getLogger(__name__)

router = APIRouter()


def find_or_create_user_by_oauth(
    db: Session,
    provider: str,
    provider_id: str,
    email: str,
    username: str,
    avatar_url: str | None = None,
) -> tuple[User, bool]:
    """
    Find or create user by OAuth provider.

    Returns:
        (user, is_new_user) tuple
    """
    is_new_user = False

    # 1. Find by provider ID
    if provider == "github":
        user = db.query(User).filter(User.github_id == provider_id).first()
    elif provider == "google":
        user = db.query(User).filter(User.google_id == provider_id).first()
    else:
        raise ValueError(f"Unknown provider: {provider}")

    if user:
        # Existing user - restore if soft-deleted
        if user.is_deleted:
            user.is_deleted = False
            user.deleted_at = None
            logger.info(f"[OAUTH] Restored deleted user: {user.id} ({user.email})")
        return user, False

    # 2. Find by email (link providers)
    user = db.query(User).filter(User.email == email).first()

    if user:
        # Link new provider to existing account
        if provider == "github":
            user.github_id = provider_id
            user.github_username = username
        elif provider == "google":
            user.google_id = provider_id

        if avatar_url and not user.avatar_url:
            user.avatar_url = avatar_url

        if user.is_deleted:
            user.is_deleted = False
            user.deleted_at = None
            logger.info(f"[OAUTH] Restored deleted user (email match): {user.id}")

        return user, False

    # 3. Create new user
    is_new_user = True
    user = User(
        email=email,
        username=username,
        avatar_url=avatar_url,
    )

    if provider == "github":
        user.github_id = provider_id
        user.github_username = username
    elif provider == "google":
        user.google_id = provider_id

    # New user: terms_accepted_at = NULL (will be set after consent)
    db.add(user)
    return user, True


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
        logger.info(f"[OAUTH] Exchanging code for token...")
        github_token = await github_oauth_service.exchange_code_for_token(code)
        logger.info(f"[OAUTH] Token exchange successful")

        # Get user info from GitHub
        logger.info(f"[OAUTH] Getting user info from GitHub...")
        github_user = await github_oauth_service.get_user_info(github_token)
        logger.info(f"[OAUTH] User info retrieved: {github_user.login}, email={github_user.email}")

        if not github_user.email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="GitHub account must have a public email or grant email access"
            )

        # Find or create user using common function
        logger.info(f"[OAUTH] Finding or creating user for github_id={github_user.id}")
        user, is_new_user = find_or_create_user_by_oauth(
            db=db,
            provider="github",
            provider_id=github_user.id,
            email=github_user.email,
            username=github_user.name or github_user.login,
            avatar_url=github_user.avatar_url,
        )

        # Update last login
        user.last_login_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(user)

        logger.info(f"User logged in: {user.email} (GitHub: {github_user.login})")

        # 게스트 제출 마이그레이션: anonymous_id로 된 제출을 user_id로 연결
        # [P1 Fix] 보안 강화: 최근 7일 내 제출만 마이그레이션 (쿠키 탈취 공격 완화)
        anonymous_id = request.cookies.get("qa_anonymous_id")
        if anonymous_id:
            migration_cutoff = datetime.now(timezone.utc) - timedelta(days=7)
            migrated_count = db.query(Submission).filter(
                Submission.anonymous_id == anonymous_id,
                Submission.user_id.is_(None),
                Submission.created_at >= migration_cutoff  # 최근 7일 내 제출만
            ).update({
                "user_id": user.id,
                "anonymous_id": None
            })
            if migrated_count > 0:
                db.commit()
                logger.info(
                    f"[GUEST_SUBMISSIONS_MIGRATED] user_id={user.id} "
                    f"anonymous_id={anonymous_id} count={migrated_count}"
                )

        # Create JWT tokens
        access_token = create_access_token(user.id, user.email, user.username)
        refresh_token = create_refresh_token(user.id)

        # Redirect to frontend with cookies
        frontend_url = getattr(settings, 'FRONTEND_URL', None) or (settings.CORS_ORIGINS[0] if settings.CORS_ORIGINS else "http://localhost:3000")
        response = Response(status_code=status.HTTP_307_TEMPORARY_REDIRECT)
        # Add is_new parameter for frontend to show terms modal
        is_new_param = "true" if is_new_user else "false"
        response.headers["Location"] = f"{frontend_url}/auth/callback?is_new={is_new_param}"

        set_auth_cookies(response, access_token, refresh_token)
        response.delete_cookie("oauth_state", path="/")

        # 로그인 후 anonymous_id 쿠키 삭제 (더 이상 필요 없음)
        response.delete_cookie("qa_anonymous_id", path="/")

        return response

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        # 로그에는 상세 정보 기록 (디버깅용)
        logger.error(f"[OAUTH_ERROR] GitHub OAuth error: {type(e).__name__}: {e}")
        logger.error(f"[OAUTH_ERROR] Traceback: {traceback.format_exc()}")
        # [P1 Fix] 클라이언트에는 일반적인 메시지만 반환 (정보 노출 방지)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication failed. Please try again later."
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
            User.is_active == True,
            User.is_deleted == False
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
        github_username=user.github_username,
        terms_accepted_at=user.terms_accepted_at
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
                github_username=user.github_username,
                terms_accepted_at=user.terms_accepted_at
            )
        )
    return AuthStatusResponse(authenticated=False, user=None)

@router.get("/tokens", response_model=TokenStatusResponse)
async def get_token_status(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get AI token status for the authenticated user."""
    token_service = TokenService(db)
    return TokenStatusResponse(**token_service.get_token_status(user))


# ============================================================================
# Google OAuth Endpoints
# ============================================================================

@router.get("/google/login")
async def google_login(request: Request):
    """Initiate Google OAuth login flow."""
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth is not configured"
        )

    # Generate state for CSRF protection
    state = secrets.token_urlsafe(32)

    # Get authorization URL
    authorization_url = google_oauth_service.get_authorization_url(state)

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


@router.get("/google/callback")
async def google_callback(
    code: str,
    state: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """Handle Google OAuth callback."""
    # Verify state
    stored_state = request.cookies.get("oauth_state")
    if not stored_state or stored_state != state:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OAuth state"
        )

    try:
        # Exchange code for token
        logger.info("[OAUTH] Exchanging code for Google token...")
        google_token = await google_oauth_service.exchange_code_for_token(code)
        logger.info("[OAUTH] Google token exchange successful")

        # Get user info from Google
        logger.info("[OAUTH] Getting user info from Google...")
        google_user = await google_oauth_service.get_user_info(google_token)
        logger.info(f"[OAUTH] User info retrieved: {google_user.email}")

        if not google_user.email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Google account must have an email"
            )

        # Find or create user using common function
        logger.info(f"[OAUTH] Finding or creating user for google_id={google_user.id}")
        user, is_new_user = find_or_create_user_by_oauth(
            db=db,
            provider="google",
            provider_id=google_user.id,
            email=google_user.email,
            username=google_user.name or google_user.email.split("@")[0],
            avatar_url=google_user.avatar_url,
        )

        # Update last login
        user.last_login_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(user)

        logger.info(f"User logged in: {user.email} (Google)")

        # Guest submission migration (same as GitHub)
        anonymous_id = request.cookies.get("qa_anonymous_id")
        if anonymous_id:
            migration_cutoff = datetime.now(timezone.utc) - timedelta(days=7)
            migrated_count = db.query(Submission).filter(
                Submission.anonymous_id == anonymous_id,
                Submission.user_id.is_(None),
                Submission.created_at >= migration_cutoff
            ).update({
                "user_id": user.id,
                "anonymous_id": None
            })
            if migrated_count > 0:
                db.commit()
                logger.info(
                    f"[GUEST_SUBMISSIONS_MIGRATED] user_id={user.id} "
                    f"anonymous_id={anonymous_id} count={migrated_count}"
                )

        # Create JWT tokens
        access_token = create_access_token(user.id, user.email, user.username)
        refresh_token = create_refresh_token(user.id)

        # Redirect to frontend with cookies
        frontend_url = getattr(settings, 'FRONTEND_URL', None) or (settings.CORS_ORIGINS[0] if settings.CORS_ORIGINS else "http://localhost:3000")
        response = Response(status_code=status.HTTP_307_TEMPORARY_REDIRECT)
        # Add is_new parameter for frontend to show terms modal
        is_new_param = "true" if is_new_user else "false"
        response.headers["Location"] = f"{frontend_url}/auth/callback?is_new={is_new_param}"

        set_auth_cookies(response, access_token, refresh_token)
        response.delete_cookie("oauth_state", path="/")
        response.delete_cookie("qa_anonymous_id", path="/")

        return response

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        logger.error(f"[OAUTH_ERROR] Google OAuth error: {type(e).__name__}: {e}")
        logger.error(f"[OAUTH_ERROR] Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication failed. Please try again later."
        )


# ============================================================================
# Terms Acceptance Endpoint
# ============================================================================

@router.post("/accept-terms")
async def accept_terms(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Record user's acceptance of terms of service."""
    if user.terms_accepted_at is None:
        user.terms_accepted_at = datetime.now(timezone.utc)
        db.commit()
        logger.info(f"[TERMS] User {user.id} accepted terms at {user.terms_accepted_at}")

    return {
        "message": "Terms accepted",
        "accepted_at": user.terms_accepted_at.isoformat() if user.terms_accepted_at else None
    }



@router.post("/decline-terms")
async def decline_terms(
    response: Response,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Handle user declining terms of service.
    Only deletes account if user has never accepted terms (new signup).
    """
    if user.terms_accepted_at is not None:
        # User already accepted terms before - just logout
        logger.warning(f"[TERMS] User {user.id} tried to decline but already accepted")
        clear_auth_cookies(response)
        return {"message": "Logged out", "account_deleted": False}

    # New user who never accepted - delete account
    user_id = user.id
    user_email = user.email

    # Hard delete since they never actually used the service
    db.delete(user)
    db.commit()

    logger.info(f"[TERMS] New user {user_id} ({user_email}) declined terms - account deleted")

    # Clear auth cookies
    clear_auth_cookies(response)

    return {"message": "Account deleted", "account_deleted": True}
