from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import select, and_

from app.dependencies import CurrentUser, DBSession
from app.models.transaction import Transaction
from app.schemas.transaction import TransactionCreate, TransactionUpdate, TransactionRead, TransactionFilter
from app.schemas.common import PaginatedResponse
from app.utils.currency import convert_to_inr

router = APIRouter()


@router.get("/", response_model=PaginatedResponse[TransactionRead])
async def list_transactions(
    current_user: CurrentUser,
    db: DBSession,
    limit: int = Query(50, le=500),
    cursor: str | None = None,
    type: str | None = None,
    status: str | None = None,
    category: str | None = None,
):
    q = select(Transaction).where(Transaction.user_id == current_user.id)
    if type:
        q = q.where(Transaction.type == type)
    if status:
        q = q.where(Transaction.status == status)
    if category:
        q = q.where(Transaction.category == category)
    q = q.order_by(Transaction.transaction_date.desc(), Transaction.id.desc()).limit(limit + 1)

    result = await db.execute(q)
    items = result.scalars().all()

    has_more = len(items) > limit
    return PaginatedResponse(items=items[:limit], total=len(items[:limit]), has_more=has_more)


@router.post("/", response_model=TransactionRead, status_code=201)
async def create_transaction(body: TransactionCreate, current_user: CurrentUser, db: DBSession):
    amount_inr, rate = convert_to_inr(body.amount, body.currency)
    txn = Transaction(
        user_id=current_user.id,
        amount_inr=amount_inr,
        exchange_rate_used=rate,
        **body.model_dump(),
    )
    db.add(txn)
    await db.flush()
    return txn


@router.get("/{txn_id}", response_model=TransactionRead)
async def get_transaction(txn_id: str, current_user: CurrentUser, db: DBSession):
    result = await db.execute(
        select(Transaction).where(
            and_(Transaction.id == txn_id, Transaction.user_id == current_user.id)
        )
    )
    txn = result.scalar_one_or_none()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return txn


@router.patch("/{txn_id}", response_model=TransactionRead)
async def update_transaction(txn_id: str, body: TransactionUpdate, current_user: CurrentUser, db: DBSession):
    result = await db.execute(
        select(Transaction).where(
            and_(Transaction.id == txn_id, Transaction.user_id == current_user.id)
        )
    )
    txn = result.scalar_one_or_none()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(txn, k, v)
    return txn


@router.delete("/{txn_id}", status_code=204)
async def void_transaction(txn_id: str, current_user: CurrentUser, db: DBSession):
    from app.models.transaction import TransactionStatus
    result = await db.execute(
        select(Transaction).where(
            and_(Transaction.id == txn_id, Transaction.user_id == current_user.id)
        )
    )
    txn = result.scalar_one_or_none()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    txn.status = TransactionStatus.VOIDED
