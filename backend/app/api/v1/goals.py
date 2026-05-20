"""Financial Goals CRUD endpoints."""
from decimal import Decimal
from fastapi import APIRouter, HTTPException
from sqlalchemy import select, func

from app.dependencies import CurrentUser, CurrentOrg, DBSession
from app.models.financial_goal import FinancialGoal, GoalStatus
from app.models.transaction import Transaction, TransactionType, TransactionStatus
from app.schemas.goal import GoalCreate, GoalUpdate, GoalRead

router = APIRouter()


@router.get("/", response_model=list[GoalRead])
async def list_goals(current_org: CurrentOrg, db: DBSession):
    """List all financial goals for the organization."""
    result = await db.execute(
        select(FinancialGoal)
        .where(FinancialGoal.organization_id == current_org.id)
        .order_by(FinancialGoal.created_at.desc())
    )
    return result.scalars().all()


@router.post("/", response_model=GoalRead, status_code=201)
async def create_goal(
    body: GoalCreate,
    current_user: CurrentUser,
    current_org: CurrentOrg,
    db: DBSession,
):
    """Create a new financial goal."""
    goal = FinancialGoal(
        organization_id=current_org.id,
        created_by_id=current_user.id,
        title=body.title,
        description=body.description,
        target_amount=body.target_amount,
        currency=body.currency,
        deadline=body.deadline,
        category=body.category,
    )
    db.add(goal)
    await db.flush()
    return goal


@router.get("/{goal_id}", response_model=GoalRead)
async def get_goal(goal_id: str, current_org: CurrentOrg, db: DBSession):
    """Get a specific financial goal."""
    result = await db.execute(
        select(FinancialGoal).where(
            FinancialGoal.id == goal_id,
            FinancialGoal.organization_id == current_org.id,
        )
    )
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found.")
    return goal


@router.patch("/{goal_id}", response_model=GoalRead)
async def update_goal(
    goal_id: str, body: GoalUpdate, current_org: CurrentOrg, db: DBSession
):
    """Update a financial goal."""
    result = await db.execute(
        select(FinancialGoal).where(
            FinancialGoal.id == goal_id,
            FinancialGoal.organization_id == current_org.id,
        )
    )
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found.")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(goal, field, value)
    await db.flush()
    return goal


@router.delete("/{goal_id}", status_code=204)
async def delete_goal(goal_id: str, current_org: CurrentOrg, db: DBSession):
    """Cancel/delete a financial goal."""
    result = await db.execute(
        select(FinancialGoal).where(
            FinancialGoal.id == goal_id,
            FinancialGoal.organization_id == current_org.id,
        )
    )
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found.")
    goal.status = GoalStatus.CANCELLED
    await db.flush()


@router.post("/{goal_id}/update-progress", response_model=GoalRead)
async def recalculate_goal_progress(
    goal_id: str, current_org: CurrentOrg, db: DBSession
):
    """
    Recalculate goal's current_amount from actual cleared transactions
    in the same category. Auto-marks as ACHIEVED if target reached.
    """
    result = await db.execute(
        select(FinancialGoal).where(
            FinancialGoal.id == goal_id,
            FinancialGoal.organization_id == current_org.id,
        )
    )
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found.")

    # Sum cleared credits in matching category
    filters = [
        Transaction.organization_id == current_org.id,
        Transaction.type == TransactionType.CREDIT,
        Transaction.status.in_([TransactionStatus.CLEARED, TransactionStatus.RECONCILED]),
    ]
    if goal.category:
        filters.append(Transaction.category == goal.category)

    agg = await db.execute(
        select(func.coalesce(func.sum(Transaction.amount_inr), 0)).where(*filters)
    )
    total = Decimal(str(agg.scalar()))
    goal.current_amount = total

    if total >= goal.target_amount and goal.status == GoalStatus.ACTIVE:
        goal.status = GoalStatus.ACHIEVED

    await db.flush()
    return goal
