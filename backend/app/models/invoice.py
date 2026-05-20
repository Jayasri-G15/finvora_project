from datetime import date
from decimal import Decimal
from sqlalchemy import String, Date, Numeric, Text, Enum as SAEnum, Index
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum
from app.models.base import Base, TimestampMixin, new_uuid


class InvoiceStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PENDING_APPROVAL = "PENDING_APPROVAL"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    PAID = "PAID"
    OVERDUE = "OVERDUE"
    VOIDED = "VOIDED"


class InvoiceType(str, enum.Enum):
    PAYABLE = "PAYABLE"
    RECEIVABLE = "RECEIVABLE"


class Invoice(Base, TimestampMixin):
    __tablename__ = "invoices"
    __table_args__ = (
        Index("ix_invoices_user_status", "user_id", "status"),
        Index("ix_invoices_user_due_date", "user_id", "due_date"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    organization_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    invoice_number: Mapped[str] = mapped_column(String(100), nullable=False)
    vendor_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)
    status: Mapped[InvoiceStatus] = mapped_column(
        SAEnum(InvoiceStatus), default=InvoiceStatus.DRAFT, nullable=False, index=True
    )
    type: Mapped[InvoiceType] = mapped_column(SAEnum(InvoiceType), nullable=False)
    issue_date: Mapped[date] = mapped_column(Date, nullable=False)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    paid_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    tax_amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), default=Decimal("0"))
    gst_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="INR", nullable=False)
    source_email_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    attachment_path: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    metadata: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    line_items: Mapped[list["InvoiceLineItem"]] = relationship(
        "InvoiceLineItem", back_populates="invoice", cascade="all, delete-orphan"
    )


class InvoiceLineItem(Base):
    __tablename__ = "invoice_line_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    invoice_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    quantity: Mapped[Decimal] = mapped_column(Numeric(10, 3), default=Decimal("1"))
    unit_price: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    tax_rate: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    line_total: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)

    invoice: Mapped["Invoice"] = relationship("Invoice", back_populates="line_items")
