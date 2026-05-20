from datetime import datetime
from sqlalchemy import String, Boolean, Text, DateTime, Enum as SAEnum
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
import enum
from app.models.base import Base, TimestampMixin, new_uuid
from app.models.base import utcnow


class AlertRuleType(str, enum.Enum):
    BUDGET_THRESHOLD = "BUDGET_THRESHOLD"
    INVOICE_OVERDUE = "INVOICE_OVERDUE"
    LARGE_TRANSACTION = "LARGE_TRANSACTION"
    PAYMENT_DUE = "PAYMENT_DUE"
    ANOMALY = "ANOMALY"
    CASH_FLOW_RISK = "CASH_FLOW_RISK"


class AlertSeverity(str, enum.Enum):
    INFO = "INFO"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"


class AlertRule(Base, TimestampMixin):
    __tablename__ = "alert_rules"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    organization_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    rule_type: Mapped[AlertRuleType] = mapped_column(SAEnum(AlertRuleType), nullable=False)
    condition_json: Mapped[dict] = mapped_column(JSONB, nullable=False)
    notify_email: Mapped[bool] = mapped_column(Boolean, default=True)
    notify_in_app: Mapped[bool] = mapped_column(Boolean, default=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class AlertNotification(Base):
    __tablename__ = "alert_notifications"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    organization_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    rule_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    severity: Mapped[AlertSeverity] = mapped_column(SAEnum(AlertSeverity), nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    entity_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    entity_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )
