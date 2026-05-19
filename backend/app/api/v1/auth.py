import secrets
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import RedirectResponse

from app.dependencies import CurrentUser, DBSession
from app.schemas.user import UserRead, TokenResponse
from app.integrations.google.oauth import build_authorization_url, exchange_code
from app.utils.security import create_access_token, encrypt_value
from app.models.user import User
from app.config import get_settings
from sqlalchemy import select
import httpx

settings = get_settings()
router = APIRouter()


@router.get("/google")
async def google_login():
    state = secrets.token_urlsafe(32)
    url = build_authorization_url(state)
    return {"url": url}


@router.get("/callback")
async def google_callback(code: str, state: str, db: DBSession):
    tokens = exchange_code(code)

    # Fetch user info from Google
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {tokens['access_token']}"},
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to fetch user info from Google")

    info = resp.json()
    google_sub = info["sub"]

    # Upsert user
    result = await db.execute(select(User).where(User.google_sub == google_sub))
    user = result.scalar_one_or_none()

    if not user:
        user = User(
            email=info["email"],
            full_name=info.get("name", ""),
            picture_url=info.get("picture"),
            google_sub=google_sub,
        )
        db.add(user)

    user.access_token = encrypt_value(tokens["access_token"])
    user.refresh_token = encrypt_value(tokens.get("refresh_token", ""))
    user.token_expiry = tokens.get("expiry")
    await db.flush()

    token, _ = create_access_token(user.id)
    return RedirectResponse(
        url=f"{settings.frontend_url}/auth/callback?token={token}",
        status_code=302,
    )


@router.get("/me", response_model=UserRead)
async def get_me(current_user: CurrentUser):
    return current_user


@router.post("/logout")
async def logout(current_user: CurrentUser):
    return {"message": "Logged out"}
