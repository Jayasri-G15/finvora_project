from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, Text, Integer, Enum as SAEnum
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
import enum
from app.models.base import Base, TimestampMixin, new_uuid


class EmailSyncStatus(str, enum.Enum):
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class FinancialType(str, enum.Enum):
    INVOICE = "INVOICE"
    PAYMENT = "PAYMENT"
    GST = "GST"
    REIMBURSEMENT = "REIMBURSEMENT"
    VENDOR_BILL = "VENDOR_BILL"
    CREDIT_NOTE = "CREDIT_NOTE"
    APPROVAL = "APPROVAL"
    UNKNOWN = "UNKNOWN"


class EmailSync(Base, TimestampMixin):
    __tablename__ = "email_syncs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    organization_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    status: Mapped[EmailSyncStatus] = mapped_column(SAEnum(EmailSyncStatus), default=EmailSyncStatus.RUNNING)
    synced_count: Mapped[int] = mapped_column(Integer, default=0)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class EmailMessage(Base, TimestampMixin):
    __tablename__ = "email_messages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    organization_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    gmail_message_id: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    gmail_thread_id: Mapped[str] = mapped_column(String(255), nullable=False)
    subject: Mapped[str] = mapped_column(String(500), nullable=False)
    sender: Mapped[str] = mapped_column(String(255), nullable=False)
    received_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    raw_body: Mapped[str | None] = mapped_column(Text, nullable=True)
    has_attachments: Mapped[bool] = mapped_column(Boolean, default=False)
    attachment_paths: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    ai_processed: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    ai_extraction_result: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    confidence_score: Mapped[float | None] = mapped_column(nullable=True)
    financial_type: Mapped[FinancialType | None] = mapped_column(SAEnum(FinancialType), nullable=True)
    needs_review: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    linked_transaction_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    linked_invoice_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
