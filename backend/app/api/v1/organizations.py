"""Organization management endpoints."""
from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.dependencies import CurrentUser, CurrentOrg, DBSession
from app.models.organization import Organization, OrganizationMember
from app.models.user import User
from app.schemas.organization import OrgRead, OrgUpdate, OrgMemberRead, InviteMemberRequest

router = APIRouter()


@router.get("/me", response_model=OrgRead)
async def get_my_org(current_org: CurrentOrg):
    """Return the current organization details."""
    return current_org


@router.patch("/me", response_model=OrgRead)
async def update_my_org(body: OrgUpdate, current_org: CurrentOrg, db: DBSession):
    """Update organization name, email, or settings."""
    if body.name is not None:
        current_org.name = body.name
    if body.email is not None:
        current_org.email = body.email
    if body.settings_json is not None:
        current_org.settings_json = body.settings_json
    await db.flush()
    return current_org


@router.get("/members", response_model=list[OrgMemberRead])
async def list_members(current_org: CurrentOrg, db: DBSession):
    """List all active members of the organization."""
    result = await db.execute(
        select(OrganizationMember).where(
            OrganizationMember.organization_id == current_org.id,
            OrganizationMember.is_active == True,
        )
    )
    return result.scalars().all()


@router.post("/members/invite", response_model=OrgMemberRead, status_code=201)
async def invite_member(
    body: InviteMemberRequest,
    current_org: CurrentOrg,
    current_user: CurrentUser,
    db: DBSession,
):
    """
    Invite a user by email. If the user exists, adds them to the org.
    If not, creates a placeholder (they get full access after signup).
    """
    # Find existing user
    result = await db.execute(select(User).where(User.email == body.email))
    target_user = result.scalar_one_or_none()

    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User with that email has not signed up yet. They must register first.",
        )

    # Check not already a member
    existing = await db.execute(
        select(OrganizationMember).where(
            OrganizationMember.organization_id == current_org.id,
            OrganizationMember.user_id == target_user.id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User is already a member of this organization.",
        )

    member = OrganizationMember(
        organization_id=current_org.id,
        user_id=target_user.id,
        role=body.role,
        invited_by=current_user.id,
    )
    db.add(member)
    await db.flush()
    return member


@router.patch("/members/{user_id}/role", response_model=OrgMemberRead)
async def change_member_role(
    user_id: str,
    role: str,
    current_org: CurrentOrg,
    db: DBSession,
):
    """Change a member's role within the organization."""
    result = await db.execute(
        select(OrganizationMember).where(
            OrganizationMember.organization_id == current_org.id,
            OrganizationMember.user_id == user_id,
            OrganizationMember.is_active == True,
        )
    )
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found.")
    member.role = role
    await db.flush()
    return member


@router.delete("/members/{user_id}", status_code=204)
async def remove_member(user_id: str, current_org: CurrentOrg, db: DBSession):
    """Remove a member from the organization."""
    result = await db.execute(
        select(OrganizationMember).where(
            OrganizationMember.organization_id == current_org.id,
            OrganizationMember.user_id == user_id,
        )
    )
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found.")
    member.is_active = False
    await db.flush()
