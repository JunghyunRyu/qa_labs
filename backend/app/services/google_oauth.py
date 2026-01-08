"""Google OAuth service."""

import httpx
from urllib.parse import urlencode
from typing import Optional
from dataclasses import dataclass

from app.core.config import settings


@dataclass
class GoogleUser:
    """Google user data."""
    id: str  # Google's 'sub' claim (unique user identifier)
    email: str
    name: Optional[str]
    avatar_url: Optional[str]
    email_verified: bool


class GoogleOAuthService:
    """Service for Google OAuth operations."""

    AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth"
    TOKEN_URL = "https://oauth2.googleapis.com/token"
    USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"

    def get_authorization_url(self, state: str) -> str:
        """Generate Google OAuth authorization URL."""
        params = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "response_type": "code",
            "scope": "openid email profile",
            "state": state,
            "access_type": "offline",  # Get refresh token
            "prompt": "select_account",  # Always show account selector
        }
        return f"{self.AUTHORIZE_URL}?{urlencode(params)}"

    async def exchange_code_for_token(self, code: str) -> str:
        """Exchange authorization code for access token."""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.TOKEN_URL,
                data={
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "code": code,
                    "grant_type": "authorization_code",
                    "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            response.raise_for_status()
            data = response.json()

            if "error" in data:
                raise ValueError(
                    f"Google OAuth error: {data.get('error_description', data['error'])}"
                )

            return data["access_token"]

    async def get_user_info(self, access_token: str) -> GoogleUser:
        """Get user information from Google."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                self.USERINFO_URL,
                headers={"Authorization": f"Bearer {access_token}"},
            )
            response.raise_for_status()
            data = response.json()

            return GoogleUser(
                id=data["sub"],  # Google's unique user ID
                email=data.get("email", ""),
                name=data.get("name"),
                avatar_url=data.get("picture"),
                email_verified=data.get("email_verified", False),
            )


google_oauth_service = GoogleOAuthService()
