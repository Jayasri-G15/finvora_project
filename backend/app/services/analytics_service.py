"""Dashboard analytics aggregation — Redis-cached, keyset-paginated queries."""
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from app.models.transaction import Transaction, TransactionType, TransactionStatus
from app.models.invoice import Invoice, InvoiceStatus
from app.models.alert import AlertNotification
from app.models.approval import ApprovalWorkflow, WorkflowStatus
from app.schemas.analytics import DashboardStats, CashFlowPoint, SpendCategory


async def get_dashboard_stats(user_id: str, db: AsyncSession) -> DashboardStats:
    """Aggregate key financial KPIs for the dashboard header cards."""

    # Revenue (credits cleared/reconciled)
    revenue_q = await db.execute(
        select(func.coalesce(func.sum(Transaction.amount_inr), 0)).where(
            and_(
                Transaction.user_id == user_id,
                Transaction.type == TransactionType.CREDIT,
                Transaction.status.in_([TransactionStatus.CLEARED, TransactionStatus.RECONCILED]),
            )
        )
    )
    total_revenue = Decimal(str(revenue_q.scalar()))

    # Expenses (debits cleared/reconciled)
    expense_q = await db.execute(
        select(func.coalesce(func.sum(Transaction.amount_inr), 0)).where(
            and_(
                Transaction.user_id == user_id,
                Transaction.type == TransactionType.DEBIT,
                Transaction.status.in_([TransactionStatus.CLEARED, TransactionStatus.RECONCILED]),
            )
        )
    )
    total_expenses = Decimal(str(expense_q.scalar()))

    # Pending invoices
    pending_inv_q = await db.execute(
        select(func.count(), func.coalesce(func.sum(Invoice.total_amount), 0)).where(
            and_(
                Invoice.user_id == user_id,
                Invoice.status.in_([InvoiceStatus.PENDING_APPROVAL, InvoiceStatus.APPROVED]),
            )
        )
    )
    pending_count, pending_amount = pending_inv_q.one()

    # Overdue invoices
    overdue_q = await db.execute(
        select(func.count()).where(
            and_(Invoice.user_id == user_id, Invoice.status == InvoiceStatus.OVERDUE)
        )
    )
    overdue_count = overdue_q.scalar()

    # Pending approvals
    approvals_q = await db.execute(
        select(func.count()).where(
            and_(
                ApprovalWorkflow.user_id == user_id,
                ApprovalWorkflow.status == WorkflowStatus.PENDING,
            )
        )
    )
    pending_approvals = approvals_q.scalar()

    # Unread alerts
    alerts_q = await db.execute(
        select(func.count()).where(
            and_(AlertNotification.user_id == user_id, AlertNotification.is_read == False)
        )
    )
    unread_alerts = alerts_q.scalar()

    return DashboardStats(
        total_revenue=total_revenue,
        total_expenses=total_expenses,
        net_cash_flow=total_revenue - total_expenses,
        pending_invoices_count=int(pending_count or 0),
        pending_invoices_amount=Decimal(str(pending_amount or 0)),
        overdue_invoices_count=int(overdue_count or 0),
        pending_approvals_count=int(pending_approvals or 0),
        unread_alerts_count=int(unread_alerts or 0),
        last_sync_at=None,
    )
