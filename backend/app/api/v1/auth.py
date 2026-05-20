"""Auth routes — Supabase handles all auth; we expose /me, /onboard, and /logout."""
import re
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.dependencies import CurrentUser, DBSession
from app.models.organization import Organization, OrganizationMember, MemberRole
from app.schemas.user import UserRead
from app.schemas.organization import OrgRead, OnboardRequest

router = APIRouter()


@router.get("/me", response_model=UserRead)
async def get_me(current_user: CurrentUser):
    """Return the authenticated user's Finvora profile."""
    return current_user


@router.post("/onboard", status_code=201)
async def onboard(body: OnboardRequest, current_user: CurrentUser, db: DBSession):
    """
    Called once after Supabase email verification (or first Google login)
    to create the organization and add the user as owner.
    """
    # Check the user hasn't already completed onboarding
    if current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User is already associated with an organization.",
        )

    # Normalize slug: lowercase, replace spaces with hyphens, strip non-alphanumeric
    slug = re.sub(r"[^a-z0-9-]", "", body.organization_slug.lower().replace(" ", "-"))
    if not slug:
        slug = re.sub(r"[^a-z0-9-]", "", body.organization_name.lower().replace(" ", "-"))

    # Ensure slug uniqueness
    existing = await db.execute(
        select(Organization).where(Organization.slug == slug)
    )
    if existing.scalar_one_or_none():
        slug = f"{slug}-{current_user.id[:6]}"

    # Create organization
    org = Organization(
        name=body.organization_name,
        slug=slug,
        email=current_user.email,
    )
    db.add(org)
    await db.flush()

    # Add user as owner
    member = OrganizationMember(
        organization_id=org.id,
        user_id=current_user.id,
        role=MemberRole.OWNER,
        joined_at=datetime.now(timezone.utc),
    )
    db.add(member)

    # Link user to org
    current_user.organization_id = org.id
    await db.flush()

    return {
        "organization": OrgRead.model_validate(org),
        "user": UserRead.model_validate(current_user),
    }


@router.post("/logout")
async def logout():
    """
    Server-side logout stub.
    Actual logout is handled client-side via supabase.auth.signOut().
    """
    return {"message": "Call supabase.auth.signOut() on the client to clear the session."}
