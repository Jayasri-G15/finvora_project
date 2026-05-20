"""Email routes — lists emails processed by n8n (no manual sync needed)."""
from fastapi import APIRouter, HTTPException
from sqlalchemy import select, and_

from app.dependencies import CurrentUser, DBSession
from app.models.email_sync import EmailMessage, EmailSync

router = APIRouter()


@router.get("/")
async def list_emails(
    current_user: CurrentUser,
    db: DBSession,
    limit: int = 50,
    needs_review: bool | None = None,
):
    """List financial emails processed by the n8n Gmail automation workflow."""
    q = select(EmailMessage).where(EmailMessage.user_id == current_user.id)
    if needs_review is not None:
        q = q.where(EmailMessage.needs_review == needs_review)
    q = q.order_by(EmailMessage.received_at.desc()).limit(limit)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/syncs/history")
async def sync_history(current_user: CurrentUser, db: DBSession, limit: int = 10):
    """Return recent sync records (populated by n8n runs)."""
    result = await db.execute(
        select(EmailSync)
        .where(EmailSync.user_id == current_user.id)
        .order_by(EmailSync.created_at.desc())
        .limit(limit)
    )
    return result.scalars().all()


@router.get("/{email_id}")
async def get_email(email_id: str, current_user: CurrentUser, db: DBSession):
    """Retrieve a single processed email by ID."""
    result = await db.execute(
        select(EmailMessage).where(
            and_(EmailMessage.id == email_id, EmailMessage.user_id == current_user.id)
        )
    )
    msg = result.scalar_one_or_none()
    if not msg:
        raise HTTPException(status_code=404, detail="Email not found")
    return msg
