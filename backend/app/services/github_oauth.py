"""GitHub OAuth service."""

import httpx
from typing import Optional
from dataclasses import dataclass

from app.core.config import settings


@dataclass
class GitHubUser:
    """GitHub user data."""
    id: str
    login: str
    email: Optional[str]
    avatar_url: str
    name: Optional[str]


class GitHubOAuthService:
    """Service for GitHub OAuth operations."""

    AUTHORIZE_URL = "https://github.com/login/oauth/authorize"
    TOKEN_URL = "https://github.com/login/oauth/access_token"
    USER_URL = "https://api.github.com/user"
    USER_EMAILS_URL = "https://api.github.com/user/emails"

    def get_authorization_url(self, state: str) -> str:
        """Generate GitHub OAuth authorization URL."""
        params = {
            "client_id": settings.GITHUB_CLIENT_ID,
            "redirect_uri": settings.GITHUB_REDIRECT_URI,
            "scope": "read:user user:email",
            "state": state,
        }
        query = "&".join(f"{k}={v}" for k, v in params.items())
        return f"{self.AUTHORIZE_URL}?{query}"

    async def exchange_code_for_token(self, code: str) -> str:
        """Exchange authorization code for access token."""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.TOKEN_URL,
                data={
                    "client_id": settings.GITHUB_CLIENT_ID,
                    "client_secret": settings.GITHUB_CLIENT_SECRET,
                    "code": code,
                    "redirect_uri": settings.GITHUB_REDIRECT_URI,
                },
                headers={"Accept": "application/json"}
            )
            response.raise_for_status()
            data = response.json()

            if "error" in data:
                raise ValueError(
                    f"GitHub OAuth error: {data.get('error_description', data['error'])}"
                )

            return data["access_token"]

    async def get_user_info(self, access_token: str) -> GitHubUser:
        """Get user information from GitHub."""
        async with httpx.AsyncClient() as client:
            # Get user profile
            response = await client.get(
                self.USER_URL,
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/json"
                }
            )
            response.raise_for_status()
            user_data = response.json()

            # Get primary email if not public
            email = user_data.get("email")
            if not email:
                email_response = await client.get(
                    self.USER_EMAILS_URL,
                    headers={
                        "Authorization": f"Bearer {access_token}",
                        "Accept": "application/json"
                    }
                )
                if email_response.status_code == 200:
                    emails = email_response.json()
                    primary = next((e for e in emails if e.get("primary")), None)
                    if primary:
                        email = primary["email"]

            return GitHubUser(
                id=str(user_data["id"]),
                login=user_data["login"],
                email=email,
                avatar_url=user_data.get("avatar_url", ""),
                name=user_data.get("name")
            )


github_oauth_service = GitHubOAuthService()
