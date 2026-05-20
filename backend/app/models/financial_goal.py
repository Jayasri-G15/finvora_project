"""Financial Goal model for organizational financial planning."""
import enum
from decimal import Decimal
from sqlalchemy import String, Boolean, Date, Text, Numeric
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, new_uuid


class GoalStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    ACHIEVED = "ACHIEVED"
    PAUSED = "PAUSED"
    CANCELLED = "CANCELLED"


class FinancialGoal(Base, TimestampMixin):
    __tablename__ = "financial_goals"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    organization_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    created_by_id: Mapped[str] = mapped_column(String(36), nullable=False)

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str | None] = mapped_column(
        String(100), nullable=True
    )  # e.g. "revenue", "savings", "debt_reduction", "investment"

    target_amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    current_amount: Mapped[Decimal] = mapped_column(
        Numeric(18, 2), default=Decimal("0"), nullable=False
    )
    currency: Mapped[str] = mapped_column(String(3), default="INR", nullable=False)

    deadline: Mapped[str | None] = mapped_column(Date, nullable=True)
    status: Mapped[GoalStatus] = mapped_column(
        String(20), default=GoalStatus.ACTIVE, nullable=False, index=True
    )

    # Optional metadata (e.g. linked budget category, milestone notes)
    metadata: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
