from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel
from app.models.transaction import TransactionType, TransactionStatus


class TransactionCreate(BaseModel):
    type: TransactionType
    amount: Decimal
    currency: str = "INR"
    description: str
    category: str | None = None
    vendor_id: str | None = None
    transaction_date: date
    reference_number: str | None = None
    notes: str | None = None


class TransactionUpdate(BaseModel):
    description: str | None = None
    category: str | None = None
    status: TransactionStatus | None = None
    notes: str | None = None


class TransactionRead(BaseModel):
    id: str
    user_id: str
    type: TransactionType
    amount: Decimal
    currency: str
    amount_inr: Decimal
    description: str
    category: str | None
    vendor_id: str | None
    invoice_id: str | None
    transaction_date: date
    reference_number: str | None
    status: TransactionStatus
    is_flagged: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class TransactionFilter(BaseModel):
    type: TransactionType | None = None
    status: TransactionStatus | None = None
    category: str | None = None
    vendor_id: str | None = None
    date_from: date | None = None
    date_to: date | None = None
    min_amount: Decimal | None = None
    max_amount: Decimal | None = None
