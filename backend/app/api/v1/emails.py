from fastapi import APIRouter, BackgroundTasks, HTTPException
from sqlalchemy import select, and_

from app.dependencies import CurrentUser, DBSession
from app.models.email_sync import EmailMessage, EmailSync
from app.services.gmail_service import trigger_full_sync
from app.tasks.email_sync_task import sync_user

router = APIRouter()


@router.post("/sync")
async def trigger_sync(
    current_user: CurrentUser,
    db: DBSession,
    background_tasks: BackgroundTasks,
):
    if not current_user.access_token:
        raise HTTPException(status_code=400, detail="Gmail not connected. Please connect your Gmail account first.")
    background_tasks.add_task(sync_user.delay, current_user.id)
    return {"message": "Gmail sync triggered. Processing in background."}


@router.get("/")
async def list_emails(
    current_user: CurrentUser,
    db: DBSession,
    limit: int = 50,
    needs_review: bool | None = None,
):
    q = select(EmailMessage).where(EmailMessage.user_id == current_user.id)
    if needs_review is not None:
        q = q.where(EmailMessage.needs_review == needs_review)
    q = q.order_by(EmailMessage.received_at.desc()).limit(limit)
    result = await db.execute(q)
    messages = result.scalars().all()
    return messages


@router.get("/{email_id}")
async def get_email(email_id: str, current_user: CurrentUser, db: DBSession):
    result = await db.execute(
        select(EmailMessage).where(
            and_(EmailMessage.id == email_id, EmailMessage.user_id == current_user.id)
        )
    )
    msg = result.scalar_one_or_none()
    if not msg:
        raise HTTPException(status_code=404, detail="Email not found")
    return msg


@router.get("/syncs/history")
async def sync_history(current_user: CurrentUser, db: DBSession, limit: int = 10):
    result = await db.execute(
        select(EmailSync)
        .where(EmailSync.user_id == current_user.id)
        .order_by(EmailSync.created_at.desc())
        .limit(limit)
    )
    return result.scalars().all()


@router.post("/webhook")
async def gmail_webhook(payload: dict, background_tasks: BackgroundTasks):
    """Google Pub/Sub push notification — triggers incremental sync."""
    data = payload.get("message", {}).get("data", "")
    # Decode and route to appropriate user sync
    background_tasks.add_task(_handle_push, data)
    return {"status": "ok"}


async def _handle_push(data: str):
    import base64, json
    try:
        decoded = json.loads(base64.b64decode(data).decode())
        email_address = decoded.get("emailAddress")
        if email_address:
            from app.db.session import AsyncSessionLocal
            from app.models.user import User
            from sqlalchemy import select
            async with AsyncSessionLocal() as db:
                result = await db.execute(select(User).where(User.email == email_address))
                user = result.scalar_one_or_none()
                if user:
                    sync_user.delay(user.id)
    except Exception:
        pass
