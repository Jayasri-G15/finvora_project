"""Evaluate alert rules and create AlertNotification records."""
import asyncio
from app.tasks.celery_app import celery_app


@celery_app.task(name="app.tasks.alert_evaluation_task.evaluate_all_rules")
def evaluate_all_rules():
    """Evaluate all active alert rules for all users."""
    asyncio.run(_evaluate_rules())


@celery_app.task(name="app.tasks.alert_evaluation_task.check_overdue_invoices")
def check_overdue_invoices():
    """Mark invoices past due_date as OVERDUE and create alerts."""
    from datetime import date
    asyncio.run(_check_overdue(date.today()))


async def _evaluate_rules():
    from app.db.session import AsyncSessionLocal
    from app.models.alert import AlertRule
    from sqlalchemy import select

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(AlertRule).where(AlertRule.is_active == True))
        rules = result.scalars().all()
        for rule in rules:
            pass  # TODO: implement per-rule evaluation logic


async def _check_overdue(today):
    from app.db.session import AsyncSessionLocal
    from app.models.invoice import Invoice, InvoiceStatus
    from sqlalchemy import select, and_, update

    async with AsyncSessionLocal() as db:
        await db.execute(
            update(Invoice)
            .where(
                and_(
                    Invoice.due_date < today,
                    Invoice.status == InvoiceStatus.APPROVED,
                )
            )
            .values(status=InvoiceStatus.OVERDUE)
        )
        await db.commit()
