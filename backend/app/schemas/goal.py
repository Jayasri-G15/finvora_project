"""Schemas for FinancialGoal."""
from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel, computed_field


class GoalCreate(BaseModel):
    title: str
    description: str | None = None
    target_amount: Decimal
    currency: str = "INR"
    deadline: date | None = None
    category: str | None = None


class GoalUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    target_amount: Decimal | None = None
    current_amount: Decimal | None = None
    deadline: date | None = None
    status: str | None = None
    category: str | None = None


class GoalRead(BaseModel):
    id: str
    organization_id: str
    created_by_id: str
    title: str
    description: str | None
    category: str | None
    target_amount: Decimal
    current_amount: Decimal
    currency: str
    deadline: date | None
    status: str
    created_at: datetime

    @computed_field
    @property
    def progress_pct(self) -> float:
        if self.target_amount <= 0:
            return 0.0
        pct = float(self.current_amount / self.target_amount * 100)
        return round(min(pct, 100.0), 1)

    model_config = {"from_attributes": True}
