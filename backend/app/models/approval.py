from datetime import datetime
from sqlalchemy import String, Integer, Text, DateTime, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum
from app.models.base import Base, TimestampMixin, new_uuid


class WorkflowStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"


class StepStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    SKIPPED = "SKIPPED"


class EntityType(str, enum.Enum):
    INVOICE = "INVOICE"
    PAYMENT = "PAYMENT"
    REPORT = "REPORT"


class ApprovalWorkflow(Base, TimestampMixin):
    __tablename__ = "approval_workflows"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    organization_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    entity_type: Mapped[EntityType] = mapped_column(SAEnum(EntityType), nullable=False)
    entity_id: Mapped[str] = mapped_column(String(36), nullable=False)
    status: Mapped[WorkflowStatus] = mapped_column(
        SAEnum(WorkflowStatus), default=WorkflowStatus.PENDING, index=True
    )
    requested_by_id: Mapped[str] = mapped_column(String(36), nullable=False)

    steps: Mapped[list["ApprovalStep"]] = relationship(
        "ApprovalStep", back_populates="workflow", cascade="all, delete-orphan", order_by="ApprovalStep.step_order"
    )


class ApprovalStep(Base):
    __tablename__ = "approval_steps"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    workflow_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    approver_id: Mapped[str] = mapped_column(String(36), nullable=False)
    step_order: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[StepStatus] = mapped_column(SAEnum(StepStatus), default=StepStatus.PENDING)
    action_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    workflow: Mapped["ApprovalWorkflow"] = relationship("ApprovalWorkflow", back_populates="steps")
