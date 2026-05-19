"""Gmail sync service — orchestrates fetching and storing email messages."""
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.email_sync import EmailSync, EmailMessage, EmailSyncStatus
from app.models.user import User
from app.integrations.google import gmail_client
from app.utils.security import decrypt_value


async def trigger_full_sync(user: User, db: AsyncSession) -> EmailSync:
    """Fetch all financial-looking emails for a user and store as EmailMessage rows."""
    sync = EmailSync(
        user_id=user.id,
        status=EmailSyncStatus.RUNNING,
        started_at=datetime.now(timezone.utc),
    )
    db.add(sync)
    await db.flush()

    try:
        access_token = decrypt_value(user.access_token)
        refresh_token = decrypt_value(user.refresh_token)

        financial_queries = [
            "invoice OR payment OR reimbursement",
            "GST OR bill OR receipt",
            "payable OR receivable",
        ]

        seen_ids: set[str] = set()
        count = 0

        for q in financial_queries:
            messages = gmail_client.list_messages(access_token, refresh_token, query=q, max_results=200)
            for msg_ref in messages:
                mid = msg_ref["id"]
                if mid in seen_ids:
                    continue
                seen_ids.add(mid)

                # Skip already-stored messages (idempotent)
                existing = await db.execute(
                    select(EmailMessage).where(EmailMessage.gmail_message_id == mid)
                )
                if existing.scalar_one_or_none():
                    continue

                full_msg = gmail_client.get_message(access_token, refresh_token, mid)
                body, attachments = gmail_client.extract_body_and_attachments(full_msg)

                headers = {h["name"]: h["value"] for h in full_msg.get("payload", {}).get("headers", [])}
                subject = headers.get("Subject", "(no subject)")
                sender = headers.get("From", "")
                date_str = headers.get("Date", "")

                email_msg = EmailMessage(
                    user_id=user.id,
                    gmail_message_id=mid,
                    gmail_thread_id=full_msg.get("threadId", ""),
                    subject=subject,
                    sender=sender,
                    received_at=datetime.now(timezone.utc),
                    raw_body=body,
                    has_attachments=bool(attachments),
                    attachment_paths=attachments or None,
                    ai_processed=False,
                )
                db.add(email_msg)
                count += 1

        await db.flush()
        sync.status = EmailSyncStatus.COMPLETED
        sync.synced_count = count
        sync.completed_at = datetime.now(timezone.utc)

    except Exception as exc:
        sync.status = EmailSyncStatus.FAILED
        sync.error_message = str(exc)
        sync.completed_at = datetime.now(timezone.utc)

    return sync
