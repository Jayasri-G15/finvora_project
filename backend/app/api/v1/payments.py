from fastapi import APIRouter, HTTPException
from sqlalchemy import select, and_

from app.dependencies import CurrentUser, DBSession
from app.models.payment import Payment, PaymentMethod, PaymentStatus
from datetime import date
from decimal import Decimal

router = APIRouter()


@router.get("/")
async def list_payments(current_user: CurrentUser, db: DBSession, limit: int = 50):
    result = await db.execute(
        select(Payment)
        .where(Payment.user_id == current_user.id)
        .order_by(Payment.payment_date.desc())
        .limit(limit)
    )
    return result.scalars().all()


@router.post("/", status_code=201)
async def create_payment(
    invoice_id: str | None,
    vendor_id: str | None,
    amount: float,
    payment_date: date,
    payment_method: PaymentMethod,
    current_user: CurrentUser,
    db: DBSession,
):
    payment = Payment(
        user_id=current_user.id,
        invoice_id=invoice_id,
        vendor_id=vendor_id,
        amount=Decimal(str(amount)),
        payment_date=payment_date,
        payment_method=payment_method,
    )
    db.add(payment)
    await db.flush()
    return payment


@router.patch("/{payment_id}/status")
async def update_payment_status(
    payment_id: str, status: PaymentStatus, current_user: CurrentUser, db: DBSession
):
    result = await db.execute(
        select(Payment).where(
            and_(Payment.id == payment_id, Payment.user_id == current_user.id)
        )
    )
    payment = result.scalar_one_or_none()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    payment.status = status
    return payment
