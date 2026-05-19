from celery import Celery
from app.config import get_settings

settings = get_settings()

celery_app = Celery(
    "finvora",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=[
        "app.tasks.email_sync_task",
        "app.tasks.ai_processing_task",
        "app.tasks.alert_evaluation_task",
        "app.tasks.report_generation_task",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Kolkata",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
)
