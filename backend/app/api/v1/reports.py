from datetime import date
from fastapi import APIRouter, HTTPException
from sqlalchemy import select, and_

from app.dependencies import CurrentUser, DBSession
from app.models.report import Report, ReportType
from app.services.report_service import generate_report

router = APIRouter()


@router.get("/")
async def list_reports(current_user: CurrentUser, db: DBSession, limit: int = 20):
    result = await db.execute(
        select(Report)
        .where(Report.user_id == current_user.id)
        .order_by(Report.created_at.desc())
        .limit(limit)
    )
    return result.scalars().all()


@router.post("/generate", status_code=201)
async def create_report(
    report_type: ReportType,
    period_start: date,
    period_end: date,
    current_user: CurrentUser,
    db: DBSession,
):
    report = await generate_report(
        user_id=current_user.id,
        report_type=report_type,
        period_start=period_start,
        period_end=period_end,
        db=db,
    )
    return report


@router.get("/{report_id}")
async def get_report(report_id: str, current_user: CurrentUser, db: DBSession):
    result = await db.execute(
        select(Report).where(
            and_(Report.id == report_id, Report.user_id == current_user.id)
        )
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report
