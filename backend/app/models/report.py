from datetime import date
from sqlalchemy import String, Date, Text, Enum as SAEnum
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
import enum
from app.models.base import Base, TimestampMixin, new_uuid


class ReportType(str, enum.Enum):
    MONTHLY_SUMMARY = "MONTHLY_SUMMARY"
    CASH_FLOW = "CASH_FLOW"
    VENDOR_SPEND = "VENDOR_SPEND"
    GST_SUMMARY = "GST_SUMMARY"
    FORECAST = "FORECAST"
    CUSTOM = "CUSTOM"


class ReportStatus(str, enum.Enum):
    GENERATING = "GENERATING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class Report(Base, TimestampMixin):
    __tablename__ = "reports"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    user_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    report_type: Mapped[ReportType] = mapped_column(SAEnum(ReportType), nullable=False)
    period_start: Mapped[date] = mapped_column(Date, nullable=False)
    period_end: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[ReportStatus] = mapped_column(SAEnum(ReportStatus), default=ReportStatus.GENERATING)
    ai_generated_content: Mapped[str | None] = mapped_column(Text, nullable=True)
    file_path: Mapped[str | None] = mapped_column(Text, nullable=True)
    parameters_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
