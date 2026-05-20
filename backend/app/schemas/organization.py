"""Schemas for Organization and OrganizationMember."""
from datetime import datetime
from pydantic import BaseModel, EmailStr


class OrgRead(BaseModel):
    id: str
    name: str
    slug: str
    email: str | None
    plan: str
    gmail_connected: bool
    last_gmail_sync: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class OrgUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    settings_json: dict | None = None


class OrgMemberRead(BaseModel):
    id: str
    organization_id: str
    user_id: str
    role: str
    is_active: bool
    joined_at: datetime | None

    model_config = {"from_attributes": True}


class InviteMemberRequest(BaseModel):
    email: EmailStr
    role: str = "member"


class OnboardRequest(BaseModel):
    organization_name: str
    organization_slug: str  # auto-generated from name on frontend
