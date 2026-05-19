"""Celery tasks for Gmail synchronization."""
import asyncio
from app.tasks.celery_app import celery_app


@celery_app.task(bind=True, name="app.tasks.email_sync_task.sync_all_users", max_retries=2)
def sync_all_users(self):
    """Sync Gmail for all users with active connections."""
    from app.db.session import AsyncSessionLocal
    from app.models.user import User
    from app.services.gmail_service import trigger_full_sync
    from sqlalchemy import select

    async def _run():
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(User).where(User.is_active == True, User.access_token != None)
            )
            users = result.scalars().all()
            for user in users:
                try:
                    await trigger_full_sync(user, db)
                except Exception as exc:
                    print(f"[email_sync] Failed for user {user.id}: {exc}")

    asyncio.run(_run())


@celery_app.task(bind=True, name="app.tasks.email_sync_task.sync_user", max_retries=3)
def sync_user(self, user_id: str):
    """Sync Gmail for a specific user (triggered by webhook or manual request)."""
    from app.db.session import AsyncSessionLocal
    from app.models.user import User
    from app.services.gmail_service import trigger_full_sync
    from sqlalchemy import select

    async def _run():
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(User).where(User.id == user_id))
            user = result.scalar_one_or_none()
            if user:
                await trigger_full_sync(user, db)

    asyncio.run(_run())
