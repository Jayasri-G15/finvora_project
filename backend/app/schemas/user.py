from datetime import datetime
from pydantic import BaseModel, EmailStr


class UserRead(BaseModel):
    id: str
    supabase_id: str
    email: EmailStr
    full_name: str | None
    picture_url: str | None
    role: str
    is_active: bool
    organization_id: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
