from datetime import date
from decimal import Decimal
from sqlalchemy import String, Boolean, Date, Numeric, Text, Enum as SAEnum, Index
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
import enum
from app.models.base import Base, TimestampMixin, new_uuid


class TransactionType(str, enum.Enum):
    CREDIT = "CREDIT"
    DEBIT = "DEBIT"


class TransactionStatus(str, enum.Enum):
    PENDING = "PENDING"
    CLEARED = "CLEARED"
    RECONCILED = "RECONCILED"
    VOIDED = "VOIDED"


class Transaction(Base, TimestampMixin):
    __tablename__ = "transactions"
    __table_args__ = (
        Index("ix_transactions_user_created", "user_id", "created_at"),
        Index("ix_transactions_user_status", "user_id", "status"),
        Index("ix_transactions_user_date", "user_id", "transaction_date"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    user_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    type: Mapped[TransactionType] = mapped_column(SAEnum(TransactionType), nullable=False)
    # Stored as Numeric — never float
    amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="INR", nullable=False)
    # INR equivalent at time of extraction
    amount_inr: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    exchange_rate_used: Mapped[Decimal | None] = mapped_column(Numeric(12, 6), nullable=True)
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    category: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    vendor_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)
    invoice_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    email_message_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    transaction_date: Mapped[date] = mapped_column(Date, nullable=False)
    reference_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    status: Mapped[TransactionStatus] = mapped_column(
        SAEnum(TransactionStatus), default=TransactionStatus.PENDING, nullable=False, index=True
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    metadata: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    is_flagged: Mapped[bool] = mapped_column(Boolean, default=False)
