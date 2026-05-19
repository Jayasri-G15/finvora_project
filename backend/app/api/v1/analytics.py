from fastapi import APIRouter
from app.dependencies import CurrentUser, DBSession
from app.services.analytics_service import get_dashboard_stats
from app.schemas.analytics import DashboardStats

router = APIRouter()


@router.get("/dashboard", response_model=DashboardStats)
async def dashboard(current_user: CurrentUser, db: DBSession):
    return await get_dashboard_stats(current_user.id, db)


@router.get("/cash-flow")
async def cash_flow(current_user: CurrentUser, db: DBSession, months: int = 6):
    """Monthly cash flow for the last N months."""
    from sqlalchemy import select, func, extract, and_
    from app.models.transaction import Transaction, TransactionType, TransactionStatus
    from datetime import date
    from dateutil.relativedelta import relativedelta

    results = []
    today = date.today()
    for i in range(months - 1, -1, -1):
        period_start = (today - relativedelta(months=i)).replace(day=1)
        period_end = (period_start + relativedelta(months=1)).replace(day=1)
        label = period_start.strftime("%b %Y")

        def _sum(t_type):
            return select(func.coalesce(func.sum(Transaction.amount_inr), 0)).where(
                and_(
                    Transaction.user_id == current_user.id,
                    Transaction.type == t_type,
                    Transaction.transaction_date >= period_start,
                    Transaction.transaction_date < period_end,
                )
            )

        credit_q = await db.execute(_sum(TransactionType.CREDIT))
        debit_q = await db.execute(_sum(TransactionType.DEBIT))
        inflow = float(credit_q.scalar())
        outflow = float(debit_q.scalar())
        results.append({"period": label, "inflow": inflow, "outflow": outflow, "net": inflow - outflow})

    return results


@router.get("/spend-by-category")
async def spend_by_category(current_user: CurrentUser, db: DBSession):
    from sqlalchemy import select, func, and_
    from app.models.transaction import Transaction, TransactionType
    result = await db.execute(
        select(Transaction.category, func.sum(Transaction.amount_inr))
        .where(and_(Transaction.user_id == current_user.id, Transaction.type == TransactionType.DEBIT))
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
