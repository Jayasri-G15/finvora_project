from celery.schedules import crontab
from app.tasks.celery_app import celery_app

celery_app.conf.beat_schedule = {
    # Sync all connected Gmail accounts every 15 minutes
    "sync-all-gmail-accounts": {
        "task": "app.tasks.email_sync_task.sync_all_users",
        "schedule": crontab(minute="*/15"),
    },
    # Process AI extraction queue every 5 minutes
    "process-ai-extraction-queue": {
        "task": "app.tasks.ai_processing_task.process_pending_emails",
        "schedule": crontab(minute="*/5"),
    },
    # Evaluate alert rules every 30 minutes
    "evaluate-alert-rules": {
        "task": "app.tasks.alert_evaluation_task.evaluate_all_rules",
        "schedule": crontab(minute="*/30"),
    },
    # Check for overdue invoices daily at 8 AM IST
    "check-overdue-invoices": {
        "task": "app.tasks.alert_evaluation_task.check_overdue_invoices",
        "schedule": crontab(hour=8, minute=0),
    },
}
