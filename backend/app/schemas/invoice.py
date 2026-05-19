from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel
from app.models.invoice import InvoiceStatus, InvoiceType


class LineItemCreate(BaseModel):
    description: str
    quantity: Decimal = Decimal("1")
    unit_price: Decimal
    tax_rate: Decimal | None = None


class LineItemRead(BaseModel):
    id: str
    description: str
    quantity: Decimal
    unit_price: Decimal
    tax_rate: Decimal | None
    line_total: Decimal

    model_config = {"from_attributes": True}


class InvoiceCreate(BaseModel):
    invoice_number: str
    vendor_id: str | None = None
    type: InvoiceType
    issue_date: date
    due_date: date | None = None
    subtotal: Decimal
    tax_amount: Decimal = Decimal("0")
    gst_number: str | None = None
    total_amount: Decimal
    currency: str = "INR"
    notes: str | None = None
    line_items: list[LineItemCreate] = []


class InvoiceUpdate(BaseModel):
    status: InvoiceStatus | None = None
    due_date: date | None = None
    notes: str | None = None
    rejection_reason: str | None = None


class InvoiceRead(BaseModel):
    id: str
    user_id: str
    invoice_number: str
    vendor_id: str | None
    status: InvoiceStatus
    type: InvoiceType
    issue_date: date
    due_date: date | None
    paid_date: date | None
    subtotal: Decimal
    tax_amount: Decimal
    gst_number: str | None
    total_amount: Decimal
    currency: str
    source_email_id: str | None
    line_items: list[LineItemRead] = []
    created_at: datetime

    model_config = {"from_attributes": True}
