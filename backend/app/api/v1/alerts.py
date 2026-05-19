from fastapi import APIRouter, HTTPException
from sqlalchemy import select, and_, update

from app.dependencies import CurrentUser, DBSession
from app.models.alert import AlertRule, AlertNotification, AlertRuleType

router = APIRouter()


@router.get("/rules")
async def list_rules(current_user: CurrentUser, db: DBSession):
    result = await db.execute(
        select(AlertRule).where(AlertRule.user_id == current_user.id)
    )
    return result.scalars().all()


@router.post("/rules", status_code=201)
async def create_rule(
    name: str,
    rule_type: AlertRuleType,
    condition_json: dict,
    current_user: CurrentUser,
    db: DBSession,
):
    rule = AlertRule(
        user_id=current_user.id,
        name=name,
        rule_type=rule_type,
        condition_json=condition_json,
    )
    db.add(rule)
    await db.flush()
    return rule


@router.patch("/rules/{rule_id}")
async def toggle_rule(rule_id: str, is_active: bool, current_user: CurrentUser, db: DBSession):
    result = await db.execute(
        select(AlertRule).where(
            and_(AlertRule.id == rule_id, AlertRule.user_id == current_user.id)
        )
    )
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    rule.is_active = is_active
    return rule


@router.delete("/rules/{rule_id}", status_code=204)
async def delete_rule(rule_id: str, current_user: CurrentUser, db: DBSession):
    result = await db.execute(
        select(AlertRule).where(
            and_(AlertRule.id == rule_id, AlertRule.user_id == current_user.id)
        )
    )
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    await db.delete(rule)


@router.get("/notifications")
async def list_notifications(current_user: CurrentUser, db: DBSession, unread_only: bool = False, limit: int = 50):
    q = select(AlertNotification).where(AlertNotification.user_id == current_user.id)
    if unread_only:
        q = q.where(AlertNotification.is_read == False)
    q = q.order_by(AlertNotification.created_at.desc()).limit(limit)
    result = await db.execute(q)
    return result.scalars().all()


@router.patch("/notifications/{notification_id}/read")
async def mark_read(notification_id: str, current_user: CurrentUser, db: DBSession):
    result = await db.execute(
        select(AlertNotification).where(
            and_(
                AlertNotification.id == notification_id,
                AlertNotification.user_id == current_user.id,
            )
        )
    )
    notif = result.scalar_one_or_none()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    return {"message": "Marked as read"}
