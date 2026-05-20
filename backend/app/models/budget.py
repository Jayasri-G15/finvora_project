from decimal import Decimal
from sqlalchemy import String, Boolean, Integer, Numeric, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base, TimestampMixin, new_uuid


class BudgetCategory(Base, TimestampMixin):
    __tablename__ = "budget_categories"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    organization_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)
    color_hex: Mapped[str | None] = mapped_column(String(7), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class BudgetAllocation(Base, TimestampMixin):
    __tablename__ = "budget_allocations"
    __table_args__ = (
        UniqueConstraint("category_id", "fiscal_year", "fiscal_month", name="uq_budget_category_period"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    organization_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    category_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    fiscal_year: Mapped[int] = mapped_column(Integer, nullable=False)
    fiscal_month: Mapped[int] = mapped_column(Integer, nullable=False)
    allocated_amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="INR")
