from fastapi import APIRouter, HTTPException
from sqlalchemy import select, and_

from app.dependencies import CurrentUser, DBSession
from app.models.approval import ApprovalWorkflow, ApprovalStep, WorkflowStatus, StepStatus
from datetime import datetime, timezone

router = APIRouter()


@router.get("/pending")
async def pending_approvals(current_user: CurrentUser, db: DBSession):
    result = await db.execute(
        select(ApprovalWorkflow).where(
            and_(
                ApprovalWorkflow.user_id == current_user.id,
                ApprovalWorkflow.status == WorkflowStatus.PENDING,
            )
        ).order_by(ApprovalWorkflow.created_at.desc())
    )
    return result.scalars().all()


@router.get("/{workflow_id}")
async def get_workflow(workflow_id: str, current_user: CurrentUser, db: DBSession):
    result = await db.execute(
        select(ApprovalWorkflow).where(
            and_(
                ApprovalWorkflow.id == workflow_id,
                ApprovalWorkflow.user_id == current_user.id,
            )
        )
    )
    wf = result.scalar_one_or_none()
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return wf


@router.post("/{workflow_id}/approve")
async def approve_workflow(workflow_id: str, comment: str | None, current_user: CurrentUser, db: DBSession):
    result = await db.execute(
        select(ApprovalWorkflow).where(
            and_(ApprovalWorkflow.id == workflow_id, ApprovalWorkflow.user_id == current_user.id)
        )
    )
    wf = result.scalar_one_or_none()
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
    wf.status = WorkflowStatus.APPROVED
    return {"message": "Workflow approved"}


@router.post("/{workflow_id}/reject")
async def reject_workflow(workflow_id: str, comment: str, current_user: CurrentUser, db: DBSession):
    result = await db.execute(
        select(ApprovalWorkflow).where(
            and_(ApprovalWorkflow.id == workflow_id, ApprovalWorkflow.user_id == current_user.id)
        )
    )
    wf = result.scalar_one_or_none()
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
    wf.status = WorkflowStatus.REJECTED
    return {"message": "Workflow rejected"}
