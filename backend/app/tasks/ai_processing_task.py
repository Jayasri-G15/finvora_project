"""Process unprocessed EmailMessages through Claude AI extraction pipeline."""
import asyncio
from app.tasks.celery_app import celery_app

BATCH_SIZE = 20
CONFIDENCE_REVIEW_THRESHOLD = 0.70


@celery_app.task(bind=True, name="app.tasks.ai_processing_task.process_pending_emails", max_retries=1)
def process_pending_emails(self):
    from app.db.session import AsyncSessionLocal
    from app.models.email_sync import EmailMessage
    from app.services.ai_extraction_service import extract_financial_data, validate_extraction
    from app.integrations.google.gmail_client import get_attachment
    from app.utils.file_parser import extract_text_from_attachment
    from app.utils.security import decrypt_value
    from app.models.user import User
    from sqlalchemy import select

    async def _run():
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(EmailMessage)
                .where(EmailMessage.ai_processed == False)
                .limit(BATCH_SIZE)
            )
            messages = result.scalars().all()

            for msg in messages:
                try:
                    # Get user tokens for attachment download
                    user_result = await db.execute(select(User).where(User.id == msg.user_id))
                    user = user_result.scalar_one_or_none()

                    attachment_texts: list[str] = []
                    if msg.has_attachments and msg.attachment_paths and user:
                        access_token = decrypt_value(user.access_token)
                        refresh_token = decrypt_value(user.refresh_token)
                        for att in (msg.attachment_paths or []):
                            try:
                                data = get_attachment(
                                    access_token, refresh_token,
                                    msg.gmail_message_id, att["attachment_id"]
                                )
                                text = extract_text_from_attachment(data, att.get("mime_type", ""))
                                if text:
                                    attachment_texts.append(text[:3000])
                            except Exception:
                                pass

                    extracted = extract_financial_data(
                        subject=msg.subject,
                        sender=msg.sender,
                        received_at=str(msg.received_at),
                        body=msg.raw_body or "",
                        attachment_texts=attachment_texts,
                    )

                    extracted = validate_extraction(extracted)

                    msg.ai_extraction_result = extracted
                    msg.confidence_score = extracted.get("confidence_score", 0.0)
                    msg.financial_type = extracted.get("financial_type", "UNKNOWN")
                    msg.needs_review = msg.confidence_score < CONFIDENCE_REVIEW_THRESHOLD
                    msg.ai_processed = True

                except Exception as exc:
                    print(f"[ai_processing] Failed for message {msg.id}: {exc}")
                    msg.ai_processed = True  # mark processed to avoid infinite retry
                    msg.needs_review = True

            await db.commit()

    asyncio.run(_run())
