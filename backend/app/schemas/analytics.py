from decimal import Decimal
from pydantic import BaseModel


class DashboardStats(BaseModel):
    total_revenue: Decimal
    total_expenses: Decimal
    net_cash_flow: Decimal
    pending_invoices_count: int
    pending_invoices_amount: Decimal
    overdue_invoices_count: int
    pending_approvals_count: int
    unread_alerts_count: int
    last_sync_at: str | None


class CashFlowPoint(BaseModel):
    period: str
    inflow: Decimal
    outflow: Decimal
    net: Decimal


class SpendCategory(BaseModel):
    category: str
    amount: Decimal
    percentage: float


class VendorSpend(BaseModel):
    vendor_id: str
    vendor_name: str
    total_spend: Decimal
    invoice_count: int


class ForecastPoint(BaseModel):
    period: str
    projected_inflow: Decimal
    projected_outflow: Decimal
    confidence: float
