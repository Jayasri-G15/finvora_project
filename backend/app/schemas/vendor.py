from datetime import datetime
from pydantic import BaseModel, EmailStr


class VendorCreate(BaseModel):
    name: str
    email: EmailStr | None = None
    phone: str | None = None
    gst_number: str | None = None
    pan_number: str | None = None
    address: str | None = None
    bank_ifsc: str | None = None
    payment_terms_days: int | None = None
    category: str | None = None


class VendorRead(BaseModel):
    id: str
    user_id: str
    name: str
    email: str | None
    phone: str | None
    gst_number: str | None
    pan_number: str | None
    payment_terms_days: int | None
    category: str | None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
