"""FastAPI dependency injection — database session and Supabase auth."""
from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models.user import User
from app.models.organization import Organization, OrganizationMember
from app.utils.security import verify_supabase_token

bearer_scheme = HTTPBearer()


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """
    Verify Supabase JWT and return the corresponding User record.
    Auto-provisions the user in public.users on first API call after OAuth login.
    """
    payload = verify_supabase_token(credentials.credentials)
    supabase_id: str = payload.get("sub", "")
    email: str = payload.get("email", "")
    user_meta: dict = payload.get("user_metadata", {})

    if not supabase_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing subject claim",
        )

    result = await db.execute(select(User).where(User.supabase_id == supabase_id))
    user = result.scalar_one_or_none()

    if not user:
        # First-time login: auto-provision user record from Supabase JWT claims
        user = User(
            supabase_id=supabase_id,
            email=email,
            full_name=user_meta.get("full_name") or user_meta.get("name", ""),
            picture_url=user_meta.get("avatar_url") or user_meta.get("picture", ""),
        )
        db.add(user)
        await db.flush()
    elif not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been disabled",
        )

    return user


async def get_current_org(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Organization:
    """
    Resolve the active organization for the authenticated user.
    Raises 403 if the user has not completed onboarding.
    """
    result = await db.execute(
        select(Organization)
        .join(
            OrganizationMember,
            OrganizationMember.organization_id == Organization.id,
        )
        .where(
            OrganizationMember.user_id == current_user.id,
            OrganizationMember.is_active == True,
        )
    )
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No organization found. Please complete onboarding at /onboard.",
        )
    return org


# ─── Type aliases for route handler injection ───────────────────────────────
CurrentUser = Annotated[User, Depends(get_current_user)]
CurrentOrg = Annotated[Organization, Depends(get_current_org)]
DBSession = Annotated[AsyncSession, Depends(get_db)]
