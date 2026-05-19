from datetime import datetime
from pydantic import BaseModel, EmailStr


class UserRead(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    picture_url: str | None
    role: str
    gmail_history_id: str | None
    gmail_watch_expiry: datetime | None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserRead
