from datetime import date
from fastapi import APIRouter, HTTPException
from sqlalchemy import select, and_

from app.dependencies import CurrentUser, DBSession
from app.models.invoice import Invoice, InvoiceLineItem, InvoiceStatus
from app.schemas.invoice import InvoiceCreate, InvoiceUpdate, InvoiceRead

router = APIRouter()


@router.get("/")
async def list_invoices(
    current_user: CurrentUser,
    db: DBSession,
    status: str | None = None,
    limit: int = 50,
):
    q = select(Invoice).where(Invoice.user_id == current_user.id)
    if status:
        q = q.where(Invoice.status == status)
    q = q.order_by(Invoice.created_at.desc()).limit(limit)
    result = await db.execute(q)
    return result.scalars().all()


@router.post("/", response_model=InvoiceRead, status_code=201)
async def create_invoice(body: InvoiceCreate, current_user: CurrentUser, db: DBSession):
    line_items_data = body.line_items
    invoice_data = body.model_dump(exclude={"line_items"})
    invoice = Invoice(user_id=current_user.id, **invoice_data)
    db.add(invoice)
    await db.flush()

    for li in line_items_data:
        item = InvoiceLineItem(invoice_id=invoice.id, **li.model_dump())
        db.add(item)

    await db.flush()
    return invoice


@router.get("/{invoice_id}", response_model=InvoiceRead)
async def get_invoice(invoice_id: str, current_user: CurrentUser, db: DBSession):
    result = await db.execute(
        select(Invoice).where(
            and_(Invoice.id == invoice_id, Invoice.user_id == current_user.id)
        )
    )
    inv = result.scalar_one_or_none()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return inv


@router.patch("/{invoice_id}", response_model=InvoiceRead)
async def update_invoice(invoice_id: str, body: InvoiceUpdate, current_user: CurrentUser, db: DBSession):
    result = await db.execute(
        select(Invoice).where(
            and_(Invoice.id == invoice_id, Invoice.user_id == current_user.id)
        )
    )
    inv = result.scalar_one_or_none()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(inv, k, v)
    return inv


@router.post("/{invoice_id}/approve")
async def approve_invoice(invoice_id: str, current_user: CurrentUser, db: DBSession):
    result = await db.execute(
        select(Invoice).where(
            and_(Invoice.id == invoice_id, Invoice.user_id == current_user.id)
        )
    )
    inv = result.scalar_one_or_none()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if inv.status not in [InvoiceStatus.DRAFT, InvoiceStatus.PENDING_APPROVAL]:
        raise HTTPException(status_code=400, detail=f"Cannot approve invoice in status {inv.status}")
    inv.status = InvoiceStatus.APPROVED
    return {"message": "Invoice approved", "invoice_id": invoice_id}


@router.post("/{invoice_id}/reject")
async def reject_invoice(invoice_id: str, reason: str, current_user: CurrentUser, db: DBSession):
    result = await db.execute(
        select(Invoice).where(
            and_(Invoice.id == invoice_id, Invoice.user_id == current_user.id)
        )
    )
    inv = result.scalar_one_or_none()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    inv.status = InvoiceStatus.REJECTED
    inv.rejection_reason = reason
    return {"message": "Invoice rejected"}


@router.post("/{invoice_id}/mark-paid")
async def mark_paid(invoice_id: str, current_user: CurrentUser, db: DBSession):
    result = await db.execute(
        select(Invoice).where(
            and_(Invoice.id == invoice_id, Invoice.user_id == current_user.id)
        )
    )
    inv = result.scalar_one_or_none()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    inv.status = InvoiceStatus.PAID
    inv.paid_date = date.today()
    return {"message": "Invoice marked as paid"}


@router.post("/{invoice_id}/void")
async def void_invoice(invoice_id: str, current_user: CurrentUser, db: DBSession):
    result = await db.execute(
        select(Invoice).where(
            and_(Invoice.id == invoice_id, Invoice.user_id == current_user.id)
        )
    )
    inv = result.scalar_one_or_none()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    inv.status = InvoiceStatus.VOIDED
    return {"message": "Invoice voided"}
