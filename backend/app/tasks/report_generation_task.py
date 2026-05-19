"""Background report generation task."""
import asyncio
from app.tasks.celery_app import celery_app


@celery_app.task(name="app.tasks.report_generation_task.generate_report_async")
def generate_report_async(report_id: str):
    asyncio.run(_generate(report_id))


async def _generate(report_id: str):
    from app.db.session import AsyncSessionLocal
    from app.models.report import Report
    from app.services.report_service import generate_report
    from sqlalchemy import select

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Report).where(Report.id == report_id))
        report = result.scalar_one_or_none()
        if not report:
            return
        await generate_report(
            user_id=report.user_id,
            report_type=report.report_type,
            period_start=report.period_start,
            period_end=report.period_end,
            db=db,
        )
        await db.commit()
