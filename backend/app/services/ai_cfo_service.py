"""
AI CFO Service — generates financial insights, anomaly detection,
and cash flow forecasting from real organizational data only.
Never fabricates numbers or hallucinated recommendations.
"""
import json
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, extract

from app.models.transaction import Transaction, TransactionType, TransactionStatus
from app.models.invoice import Invoice, InvoiceStatus
from app.models.alert import AlertNotification
from app.services.openai_service import get_openai_client
from app.config import get_settings

settings = get_settings()

INSIGHTS_SYSTEM_PROMPT = """You are Finvora AI's autonomous CFO assistant analyzing real organizational financial data.

Your role:
- Identify genuine patterns, risks, and opportunities from the data provided
- Generate actionable, specific recommendations based ONLY on the actual data
- Detect anomalies (unusually large transactions, sudden spend spikes, payment delays)
- Flag cash flow risks and overdue payment threats
- Highlight positive trends and achievements

STRICT RULES:
- Only reference actual numbers from the data provided — never invent figures
- If data is insufficient for a conclusion, say so honestly
- Each insight must cite the specific data point it is based on
- Severity: INFO (informational), WARNING (needs attention), CRITICAL (immediate action)
- Return a JSON array of insights

Output format (JSON array):
[
  {
    "type": "anomaly_detected|budget_risk|cash_flow_warning|payment_overdue|vendor_concentration|positive_trend|general",
    "title": "Concise title (max 60 chars)",
    "description": "Detailed explanation with specific numbers from the data",
    "severity": "INFO|WARNING|CRITICAL",
    "action_recommended": "Specific action the finance team should take"
  }
]"""

FORECAST_SYSTEM_PROMPT = """You are Finvora AI's financial forecasting engine.

Given historical monthly financial data, generate a 6-month cash flow forecast.
Base your forecast ONLY on the actual historical patterns provided.
Use trend analysis, seasonality if evident, and growth/decline rates from the data.

Output format (JSON array of 6 months):
[
  {
    "period": "YYYY-MM",
    "projected_inflow": <number>,
    "projected_outflow": <number>,
    "projected_net": <number>,
    "confidence": <0.0-1.0>,
    "notes": "Brief explanation of the projection basis"
  }
]

STRICT: Use only the data provided. Do not invent numbers. If historical data is insufficient, use lower confidence scores."""


async def _get_monthly_summary(org_id: str, db: AsyncSession, months: int = 12) -> list[dict]:
    """Aggregate monthly inflow/outflow from real transaction data."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=months * 31)

    result = await db.execute(
        select(
            extract("year", Transaction.transaction_date).label("year"),
            extract("month", Transaction.transaction_date).label("month"),
            Transaction.type,
            func.sum(Transaction.amount_inr).label("total"),
        )
        .where(
            Transaction.organization_id == org_id,
            Transaction.status.in_([TransactionStatus.CLEARED, TransactionStatus.RECONCILED]),
            Transaction.transaction_date >= cutoff.date(),
        )
        .group_by("year", "month", Transaction.type)
        .order_by("year", "month")
    )

    rows = result.all()
    monthly: dict[str, dict] = {}
    for row in rows:
        key = f"{int(row.year)}-{int(row.month):02d}"
        if key not in monthly:
            monthly[key] = {"period": key, "inflow": 0.0, "outflow": 0.0}
        if row.type == TransactionType.CREDIT:
            monthly[key]["inflow"] = float(row.total or 0)
        else:
            monthly[key]["outflow"] = float(row.total or 0)

    return sorted(monthly.values(), key=lambda x: x["period"])


async def generate_insights(org_id: str, db: AsyncSession) -> list[dict]:
    """
    Analyze real org data and generate AI CFO insights.
    Returns a list of insight dicts.
    """
    # Gather data
    monthly = await _get_monthly_summary(org_id, db, months=6)

    # Overdue invoices
    overdue_result = await db.execute(
        select(func.count(Invoice.id), func.sum(Invoice.total_amount))
        .where(
            Invoice.organization_id == org_id,
            Invoice.status == InvoiceStatus.OVERDUE,
        )
    )
    overdue_count, overdue_amount = overdue_result.one()

    # Pending invoices
    pending_result = await db.execute(
        select(func.count(Invoice.id), func.sum(Invoice.total_amount))
        .where(
            Invoice.organization_id == org_id,
            Invoice.status.in_([InvoiceStatus.DRAFT, InvoiceStatus.PENDING_APPROVAL]),
        )
    )
    pending_count, pending_amount = pending_result.one()

    # Top category spend (last 30 days)
    thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).date()
    cat_result = await db.execute(
        select(Transaction.category, func.sum(Transaction.amount_inr).label("total"))
        .where(
            Transaction.organization_id == org_id,
            Transaction.type == TransactionType.DEBIT,
            Transaction.transaction_date >= thirty_days_ago,
            Transaction.category != None,
        )
        .group_by(Transaction.category)
        .order_by(func.sum(Transaction.amount_inr).desc())
        .limit(5)
    )
    top_categories = [{"category": r.category, "amount": float(r.total)} for r in cat_result.all()]

    if not monthly and not overdue_count and not pending_count:
        return [
            {
                "type": "general",
                "title": "No financial data yet",
                "description": "Connect Gmail and let n8n sync your financial emails to start generating AI insights.",
                "severity": "INFO",
                "action_recommended": "Go to Settings → Gmail Integration to connect your Gmail account.",
            }
        ]

    data_summary = json.dumps(
        {
            "monthly_cash_flow_last_6_months": monthly,
            "overdue_invoices": {
                "count": int(overdue_count or 0),
                "total_amount_inr": float(overdue_amount or 0),
            },
            "pending_invoices": {
                "count": int(pending_count or 0),
                "total_amount_inr": float(pending_amount or 0),
            },
            "top_spend_categories_last_30_days": top_categories,
        },
        indent=2,
    )

    client = get_openai_client()
    response = client.chat.completions.create(
        model=settings.openai_model,
        max_tokens=1500,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": INSIGHTS_SYSTEM_PROMPT},
            {
                "role": "user",
                "content": f"Generate CFO insights for this organization's financial data:\n\n{data_summary}",
            },
        ],
    )

    try:
        raw = json.loads(response.choices[0].message.content)
        # Handle both {"insights": [...]} and direct array responses
        if isinstance(raw, list):
            return raw
        return raw.get("insights", raw.get("data", [raw]))
    except (json.JSONDecodeError, KeyError):
        return [
            {
                "type": "general",
                "title": "AI insights temporarily unavailable",
                "description": "Could not generate insights at this time. Your data is intact.",
                "severity": "INFO",
                "action_recommended": "Refresh the page to retry.",
            }
        ]


async def generate_forecast(org_id: str, months: int, db: AsyncSession) -> list[dict]:
    """
    Generate a cash flow forecast based on real historical transaction data.
    """
    monthly = await _get_monthly_summary(org_id, db, months=12)

    if len(monthly) < 2:
        # Not enough data for meaningful forecast
        now = datetime.now(timezone.utc)
        return [
            {
                "period": f"{(now.replace(month=((now.month + i - 1) % 12) + 1)).strftime('%Y-%m')}",
                "projected_inflow": 0.0,
                "projected_outflow": 0.0,
                "projected_net": 0.0,
                "confidence": 0.1,
                "notes": "Insufficient historical data for accurate forecasting. Sync more financial emails.",
            }
            for i in range(1, months + 1)
        ]

    data_summary = json.dumps(
        {
            "historical_monthly_data": monthly,
            "forecast_months_requested": months,
            "currency": "INR",
        },
        indent=2,
    )

    client = get_openai_client()
    response = client.chat.completions.create(
        model=settings.openai_model,
        max_tokens=1500,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": FORECAST_SYSTEM_PROMPT},
            {
                "role": "user",
                "content": f"Generate a {months}-month cash flow forecast:\n\n{data_summary}",
            },
        ],
    )

    try:
        raw = json.loads(response.choices[0].message.content)
        if isinstance(raw, list):
            return raw
        return raw.get("forecast", raw.get("data", []))
    except (json.JSONDecodeError, KeyError):
        return []
