"""AI report generation using Claude — produces markdown financial reports."""
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from app.models.report import Report, ReportType, ReportStatus
from app.models.transaction import Transaction, TransactionType
from app.integrations.claude.client import get_claude_client
from app.integrations.claude.prompts import REPORT_SYSTEM_PROMPT
from app.config import get_settings

settings = get_settings()


async def generate_report(
    user_id: str,
    report_type: ReportType,
    period_start: date,
    period_end: date,
    db: AsyncSession,
    title: str | None = None,
) -> Report:
    report = Report(
        user_id=user_id,
        title=title or f"{report_type.value.replace('_', ' ').title()} — {period_start} to {period_end}",
        report_type=report_type,
        period_start=period_start,
        period_end=period_end,
        status=ReportStatus.GENERATING,
    )
    db.add(report)
    await db.flush()

    try:
        # Gather financial summary data for the period
        credits_q = await db.execute(
            select(func.coalesce(func.sum(Transaction.amount_inr), 0)).where(
                and_(
                    Transaction.user_id == user_id,
                    Transaction.type == TransactionType.CREDIT,
                    Transaction.transaction_date >= period_start,
                    Transaction.transaction_date <= period_end,
                )
            )
        )
        debits_q = await db.execute(
            select(func.coalesce(func.sum(Transaction.amount_inr), 0)).where(
                and_(
                    Transaction.user_id == user_id,
                    Transaction.type == TransactionType.DEBIT,
                    Transaction.transaction_date >= period_start,
                    Transaction.transaction_date <= period_end,
                )
            )
        )
        total_credits = credits_q.scalar()
        total_debits = debits_q.scalar()

        data_summary = (
            f"Period: {period_start} to {period_end}\n"
            f"Total Credits (Revenue): ₹{total_credits:,.2f}\n"
            f"Total Debits (Expenses): ₹{total_debits:,.2f}\n"
            f"Net Cash Flow: ₹{float(total_credits) - float(total_debits):,.2f}\n"
            f"Report Type: {report_type.value}\n"
        )

        client = get_claude_client()
        response = client.messages.create(
            model=settings.claude_model,
            max_tokens=settings.claude_max_tokens,
            system=[{"type": "text", "text": REPORT_SYSTEM_PROMPT, "cache_control": {"type": "ephemeral"}}],
            messages=[{"role": "user", "content": f"Generate a {report_type.value} report:\n\n{data_summary}"}],
        )

        report.ai_generated_content = response.content[0].text
        report.status = ReportStatus.COMPLETED

    except Exception as exc:
        report.status = ReportStatus.FAILED
        report.ai_generated_content = f"Report generation failed: {exc}"

    return report
