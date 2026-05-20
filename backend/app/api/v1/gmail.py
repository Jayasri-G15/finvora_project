"""Gmail integration status and historical sync trigger endpoints."""
from fastapi import APIRouter, HTTPException
from sqlalchemy import select, func
import httpx

from app.config import get_settings
from app.dependencies import CurrentOrg, DBSession
from app.models.email_sync import EmailMessage
from app.models.organization import Organization

router = APIRouter()
settings = get_settings()


@router.get("/status")
async def gmail_status(current_org: CurrentOrg, db: DBSession):
    """
    Return Gmail connection status and email processing metrics
    for the current organization.
    """
    # Total emails processed
    total_result = await db.execute(
        select(func.count(EmailMessage.id)).where(
            EmailMessage.organization_id == current_org.id
        )
    )
    total_emails = total_result.scalar() or 0

    # Emails needing review
    review_result = await db.execute(
        select(func.count(EmailMessage.id)).where(
            EmailMessage.organization_id == current_org.id,
            EmailMessage.needs_review == True,
        )
    )
    pending_review = review_result.scalar() or 0

    # Emails processed this month
    from datetime import datetime, timezone
    from sqlalchemy import extract
    now = datetime.now(timezone.utc)
    month_result = await db.execute(
        select(func.count(EmailMessage.id)).where(
            EmailMessage.organization_id == current_org.id,
            extract("year", EmailMessage.received_at) == now.year,
            extract("month", EmailMessage.received_at) == now.month,
        )
    )
    emails_this_month = month_result.scalar() or 0

    return {
        "connected": current_org.gmail_connected,
        "last_sync_at": current_org.last_gmail_sync,
        "total_emails": total_emails,
        "pending_review": pending_review,
        "emails_this_month": emails_this_month,
    }


@router.post("/trigger-sync")
async def trigger_historical_sync(
    days_back: int = 30,
    current_org: CurrentOrg = None,
    db: DBSession = None,
):
    """
    Trigger an n8n historical sync webhook to process past Gmail emails.
    Requires N8N_TRIGGER_WEBHOOK to be configured.
    """
    if not settings.n8n_trigger_webhook:
        raise HTTPException(
            status_code=503,
            detail="Historical sync is not configured. Set N8N_TRIGGER_WEBHOOK in environment.",
        )

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                settings.n8n_trigger_webhook,
                json={
                    "days_back": days_back,
                    "organization_id": current_org.id,
                },
                headers={"X-Webhook-Secret": settings.n8n_webhook_secret},
            )
            response.raise_for_status()
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to trigger n8n sync: {str(exc)}",
        )

    return {
        "status": "triggered",
        "message": f"Historical sync triggered for last {days_back} days. Emails will appear shortly.",
    }


@router.post("/mark-connected")
async def mark_gmail_connected(current_org: CurrentOrg, db: DBSession):
    """Mark the organization's Gmail as connected (called after n8n setup)."""
    from datetime import datetime, timezone
    current_org.gmail_connected = True
    current_org.last_gmail_sync = datetime.now(timezone.utc)
    await db.flush()
    return {"status": "connected", "organization_id": current_org.id}
