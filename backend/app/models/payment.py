from datetime import date
from decimal import Decimal
from sqlalchemy import String, Date, Numeric, Text, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column
import enum
from app.models.base import Base, TimestampMixin, new_uuid


class PaymentMethod(str, enum.Enum):
    BANK_TRANSFER = "BANK_TRANSFER"
    UPI = "UPI"
    CHEQUE = "CHEQUE"
    CARD = "CARD"
    CASH = "CASH"
    OTHER = "OTHER"


class PaymentStatus(str, enum.Enum):
    SCHEDULED = "SCHEDULED"
    INITIATED = "INITIATED"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class Payment(Base, TimestampMixin):
    __tablename__ = "payments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    user_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    invoice_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    vendor_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="INR")
    payment_date: Mapped[date] = mapped_column(Date, nullable=False)
    payment_method: Mapped[PaymentMethod] = mapped_column(SAEnum(PaymentMethod), nullable=False)
    reference_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    status: Mapped[PaymentStatus] = mapped_column(
        SAEnum(PaymentStatus), default=PaymentStatus.SCHEDULED, nullable=False, index=True
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
