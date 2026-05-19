from fastapi import APIRouter, HTTPException
from sqlalchemy import select, and_

from app.dependencies import CurrentUser, DBSession
from app.models.budget import BudgetCategory, BudgetAllocation
from app.schemas.vendor import VendorRead  # placeholder, budget schemas follow same pattern

router = APIRouter()


@router.get("/categories")
async def list_categories(current_user: CurrentUser, db: DBSession):
    result = await db.execute(
        select(BudgetCategory).where(
            and_(BudgetCategory.user_id == current_user.id, BudgetCategory.is_active == True)
        )
    )
    return result.scalars().all()


@router.post("/categories", status_code=201)
async def create_category(name: str, color_hex: str | None = None, current_user: CurrentUser = None, db: DBSession = None):
    cat = BudgetCategory(user_id=current_user.id, name=name, color_hex=color_hex)
    db.add(cat)
    await db.flush()
    return cat


@router.get("/allocations")
async def list_allocations(current_user: CurrentUser, db: DBSession, fiscal_year: int | None = None):
    q = select(BudgetAllocation).where(BudgetAllocation.user_id == current_user.id)
    if fiscal_year:
        q = q.where(BudgetAllocation.fiscal_year == fiscal_year)
    result = await db.execute(q)
    return result.scalars().all()


@router.post("/allocations", status_code=201)
async def create_allocation(
    category_id: str,
    fiscal_year: int,
    fiscal_month: int,
    allocated_amount: float,
    current_user: CurrentUser,
    db: DBSession,
):
    from decimal import Decimal
    allocation = BudgetAllocation(
        category_id=category_id,
        user_id=current_user.id,
        fiscal_year=fiscal_year,
        fiscal_month=fiscal_month,
        allocated_amount=Decimal(str(allocated_amount)),
    )
    db.add(allocation)
    await db.flush()
    return allocation
