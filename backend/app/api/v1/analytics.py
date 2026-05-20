"""Analytics endpoints — dashboard stats, cash flow, spend breakdown, forecast, AI insights."""
from datetime import date
from fastapi import APIRouter
from sqlalchemy import select, func, and_, extract

from app.dependencies import CurrentUser, CurrentOrg, DBSession
from app.models.transaction import Transaction, TransactionType, TransactionStatus
from app.models.invoice import Invoice, InvoiceStatus
from app.models.alert import AlertNotification
from app.models.approval import ApprovalWorkflow, WorkflowStatus
from app.models.email_sync import EmailMessage
from app.schemas.analytics import DashboardStats
from app.services.ai_cfo_service import generate_insights, generate_forecast

router = APIRouter()


@router.get("/dashboard", response_model=DashboardStats)
async def dashboard(current_org: CurrentOrg, db: DBSession):
    """Organization-scoped dashboard KPI stats."""
    org_id = current_org.id

    # Revenue: sum of cleared/reconciled credits
    rev_q = await db.execute(
        select(func.coalesce(func.sum(Transaction.amount_inr), 0)).where(
            Transaction.organization_id == org_id,
            Transaction.type == TransactionType.CREDIT,
            Transaction.status.in_([TransactionStatus.CLEARED, TransactionStatus.RECONCILED]),
        )
    )
    total_revenue = float(rev_q.scalar())

    # Expenses: sum of cleared/reconciled debits
    exp_q = await db.execute(
        select(func.coalesce(func.sum(Transaction.amount_inr), 0)).where(
            Transaction.organization_id == org_id,
            Transaction.type == TransactionType.DEBIT,
            Transaction.status.in_([TransactionStatus.CLEARED, TransactionStatus.RECONCILED]),
        )
    )
    total_expenses = float(exp_q.scalar())

    # Pending invoices
    pend_q = await db.execute(
        select(
            func.count(Invoice.id),
            func.coalesce(func.sum(Invoice.total_amount), 0),
        ).where(
            Invoice.organization_id == org_id,
            Invoice.status.in_([InvoiceStatus.DRAFT, InvoiceStatus.PENDING_APPROVAL, InvoiceStatus.APPROVED]),
        )
    )
    pending_count, pending_amount = pend_q.one()

    # Overdue invoices
    overdue_q = await db.execute(
        select(func.count(Invoice.id)).where(
            Invoice.organization_id == org_id,
            Invoice.status == InvoiceStatus.OVERDUE,
        )
    )
    overdue_count = overdue_q.scalar() or 0

    # Pending approvals
    approvals_q = await db.execute(
        select(func.count(ApprovalWorkflow.id)).where(
            ApprovalWorkflow.organization_id == org_id,
            ApprovalWorkflow.status == WorkflowStatus.PENDING,
        )
    )
    pending_approvals = approvals_q.scalar() or 0

    # Unread alerts
    alerts_q = await db.execute(
        select(func.count(AlertNotification.id)).where(
            AlertNotification.organization_id == org_id,
            AlertNotification.is_read == False,
        )
    )
    unread_alerts = alerts_q.scalar() or 0

    # Last Gmail sync
    last_sync = current_org.last_gmail_sync

    return DashboardStats(
        total_revenue=total_revenue,
        total_expenses=total_expenses,
        net_cash_flow=total_revenue - total_expenses,
        pending_invoices_count=int(pending_count or 0),
        pending_invoices_amount=float(pending_amount or 0),
        overdue_invoices_count=int(overdue_count),
        pending_approvals_count=int(pending_approvals),
        unread_alerts_count=int(unread_alerts),
        last_sync_at=last_sync,
    )


@router.get("/cash-flow")
async def cash_flow(current_org: CurrentOrg, db: DBSession, months: int = 6):
    """Monthly cash flow (inflow/outflow/net) for the last N months."""
    from datetime import datetime, timezone, timedelta

    org_id = current_org.id
    results = []
    today = date.today()

    for i in range(months - 1, -1, -1):
        # Calculate period bounds
        year = today.year
        month = today.month - i
        while month <= 0:
            month += 12
            year -= 1
        period_start = date(year, month, 1)
        if month == 12:
            period_end = date(year + 1, 1, 1)
        else:
            period_end = date(year, month + 1, 1)
        label = period_start.strftime("%b %Y")

        async def _sum(t_type: TransactionType) -> float:
            r = await db.execute(
                select(func.coalesce(func.sum(Transaction.amount_inr), 0)).where(
                    Transaction.organization_id == org_id,
                    Transaction.type == t_type,
                    Transaction.transaction_date >= period_start,
                    Transaction.transaction_date < period_end,
                    Transaction.status.in_([TransactionStatus.CLEARED, TransactionStatus.RECONCILED]),
                )
            )
            return float(r.scalar())

        inflow = await _sum(TransactionType.CREDIT)
        outflow = await _sum(TransactionType.DEBIT)
        results.append(
            {"period": label, "inflow": inflow, "outflow": outflow, "net": inflow - outflow}
        )

    return results


@router.get("/spend-by-category")
async def spend_by_category(current_org: CurrentOrg, db: DBSession):
    """Total spend breakdown by category (all time, debits only)."""
    result = await db.execute(
        select(Transaction.category, func.sum(Transaction.amount_inr))
        .where(
            Transaction.organization_id == current_org.id,
            Transaction.type == TransactionType.DEBIT,
        )
        .group_by(Transaction.category)
        .order_by(func.sum(Transaction.amount_inr).desc())
    )
    rows = result.all()
    total = sum(float(r[1]) for r in rows if r[1])
    return [
        {
            "category": r[0] or "Uncategorized",
            "amount": float(r[1] or 0),
            "percentage": round(float(r[1] or 0) / total * 100, 1) if total else 0,
        }
        for r in rows
    ]


@router.get("/spend-trends")
async def spend_trends(current_org: CurrentOrg, db: DBSession, months: int = 6):
    """Monthly spend breakdown by category for the last N months."""
    today = date.today()
    results = []

    for i in range(months - 1, -1, -1):
        year = today.year
        month = today.month - i
        while month <= 0:
            month += 12
            year -= 1
        period_start = date(year, month, 1)
        period_end = date(year, month + 1, 1) if month < 12 else date(year + 1, 1, 1)
        label = period_start.strftime("%b %Y")

        cat_result = await db.execute(
            select(Transaction.category, func.sum(Transaction.amount_inr).label("total"))
            .where(
                Transaction.organization_id == current_org.id,
                Transaction.type == TransactionType.DEBIT,
                Transaction.transaction_date >= period_start,
                Transaction.transaction_date < period_end,
            )
            .group_by(Transaction.category)
            .order_by(func.sum(Transaction.amount_inr).desc())
        )
        categories = [
            {"name": r.category or "Uncategorized", "amount": float(r.total or 0)}
            for r in cat_result.all()
        ]
        results.append({"period": label, "categories": categories})

    return results


@router.get("/forecast")
async def forecast(current_org: CurrentOrg, db: DBSession, months: int = 6):
    """AI-powered cash flow forecast for the next N months."""
    return await generate_forecast(current_org.id, months, db)


@router.get("/insights")
async def insights(current_org: CurrentOrg, db: DBSession):
    """AI CFO insights — anomaly detection, recommendations, trend analysis."""
    return await generate_insights(current_org.id, db)
