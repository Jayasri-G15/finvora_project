"""n8n → FastAPI webhook — receives Gmail extraction results from n8n."""
from datetime import datetime, timezone
from decimal import Decimal

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from sqlalchemy import select

from app.config import get_settings
from app.dependencies import DBSession
from app.models.email_sync import EmailMessage, FinancialType
from app.models.invoice import Invoice, InvoiceStatus, InvoiceType
from app.models.organization import Organization, OrganizationMember
from app.models.transaction import Transaction, TransactionType, TransactionStatus
from app.models.vendor import Vendor
from app.models.user import User

settings = get_settings()
router = APIRouter()


# ─── Request Schemas ──────────────────────────────────────────────────────────

class ExtractionData(BaseModel):
    financial_type: str = "UNKNOWN"
    vendor_name: str | None = None
    vendor_email: str | None = None
    amount: float | None = None
    currency: str = "INR"
    invoice_number: str | None = None
    issue_date: str | None = None
    due_date: str | None = None
    tax_amount: float | None = None
    gst_number: str | None = None
    confidence_score: float = 0.0


class N8nEmailPayload(BaseModel):
    user_email: str                 # Gmail address of the authenticated user
    gmail_message_id: str           # Used for idempotency
    subject: str
    sender: str
    received_at: str                # ISO 8601 timestamp
    body: str | None = None
    extraction: ExtractionData


# ─── Endpoint ─────────────────────────────────────────────────────────────────

@router.post("/n8n/email", status_code=201)
async def receive_n8n_email(
    payload: N8nEmailPayload,
    db: DBSession,
    x_webhook_secret: str | None = Header(default=None),
):
    """
    Receives the output of n8n's Gmail + OpenAI extraction workflow.
    Creates EmailMessage record + Invoice or Transaction depending on financial_type.
    Idempotent: skips if gmail_message_id already processed.
    All records are scoped to the user's organization_id.
    """
    # 1. Authenticate the n8n caller
    if settings.n8n_webhook_secret and x_webhook_secret != settings.n8n_webhook_secret:
        raise HTTPException(status_code=403, detail="Invalid webhook secret")

    # 2. Resolve user by email
    result = await db.execute(
        select(User).where(User.email == payload.user_email, User.is_active == True)
    )
    user = result.scalar_one_or_none()
    if not user:
        return {"status": "ignored", "reason": "user_not_found"}

    # 3. Resolve organization for this user
    org_result = await db.execute(
        select(Organization)
        .join(OrganizationMember, OrganizationMember.organization_id == Organization.id)
        .where(OrganizationMember.user_id == user.id, OrganizationMember.is_active == True)
    )
    org = org_result.scalar_one_or_none()
    if not org:
        # User not yet onboarded — store without org_id (will fail model NOT NULL)
        # Return gracefully so n8n doesn't retry infinitely
        return {"status": "ignored", "reason": "organization_not_found"}

    organization_id = org.id

    # 4. Update org gmail_connected status
    if not org.gmail_connected:
        org.gmail_connected = True
        org.last_gmail_sync = datetime.now(timezone.utc)

    # 5. Idempotency guard
    dup = await db.execute(
        select(EmailMessage).where(EmailMessage.gmail_message_id == payload.gmail_message_id)
    )
    if dup.scalar_one_or_none():
        return {"status": "duplicate"}

    # 6. Parse timestamp
    try:
        received_at = datetime.fromisoformat(payload.received_at.replace("Z", "+00:00"))
    except ValueError:
        received_at = datetime.now(timezone.utc)

    # 7. Resolve financial type enum
    ext = payload.extraction
    try:
        fin_type = FinancialType(ext.financial_type)
    except ValueError:
        fin_type = FinancialType.UNKNOWN

    # 8. Store EmailMessage
    email_msg = EmailMessage(
        organization_id=organization_id,
        user_id=user.id,
        gmail_message_id=payload.gmail_message_id,
        gmail_thread_id=payload.gmail_message_id,
        subject=payload.subject,
        sender=payload.sender,
        received_at=received_at,
        raw_body=payload.body,
        has_attachments=False,
        ai_processed=True,
        ai_extraction_result=ext.model_dump(),
        confidence_score=ext.confidence_score,
        financial_type=fin_type,
        needs_review=ext.confidence_score < 0.70,
    )
    db.add(email_msg)
    await db.flush()

    linked_invoice_id = None
    linked_transaction_id = None

    # 9. Create Invoice for INVOICE / VENDOR_BILL with sufficient confidence
    if (
        fin_type in (FinancialType.INVOICE, FinancialType.VENDOR_BILL)
        and ext.amount
        and ext.confidence_score >= 0.70
    ):
        vendor_id = None
        if ext.vendor_name:
            v_result = await db.execute(
                select(Vendor).where(
                    Vendor.organization_id == organization_id,
                    Vendor.name == ext.vendor_name,
                )
            )
            vendor = v_result.scalar_one_or_none()
            if not vendor:
                vendor = Vendor(
                    organization_id=organization_id,
                    user_id=user.id,
                    name=ext.vendor_name,
                    email=ext.vendor_email,
                )
                db.add(vendor)
                await db.flush()
            vendor_id = vendor.id

        invoice = Invoice(
            organization_id=organization_id,
            user_id=user.id,
            invoice_number=ext.invoice_number or f"AUTO-{payload.gmail_message_id[:8].upper()}",
            vendor_id=vendor_id,
            status=InvoiceStatus.DRAFT,
            type=InvoiceType.PAYABLE,
            issue_date=received_at.date(),
            due_date=(
                datetime.fromisoformat(ext.due_date).date()
                if ext.due_date
                else None
            ),
            subtotal=Decimal(str(ext.amount)),
            tax_amount=Decimal(str(ext.tax_amount)) if ext.tax_amount else Decimal("0"),
            total_amount=Decimal(str(ext.amount)),
            currency=ext.currency,
            source_email_id=email_msg.id,
        )
        db.add(invoice)
        await db.flush()
        linked_invoice_id = invoice.id

    # 10. Create Transaction for PAYMENT type
    elif fin_type == FinancialType.PAYMENT and ext.amount:
        txn = Transaction(
            organization_id=organization_id,
            user_id=user.id,
            type=TransactionType.DEBIT,
            amount=Decimal(str(ext.amount)),
            currency=ext.currency,
            amount_inr=Decimal(str(ext.amount)),  # FX conversion is future work
            description=payload.subject,
            transaction_date=received_at.date(),
            email_message_id=email_msg.id,
            status=TransactionStatus.PENDING,
        )
        db.add(txn)
        await db.flush()
        linked_transaction_id = txn.id

    # 11. Back-link email to created records
    email_msg.linked_invoice_id = linked_invoice_id
    email_msg.linked_transaction_id = linked_transaction_id

    # 12. Update org last_gmail_sync timestamp
    org.last_gmail_sync = datetime.now(timezone.utc)

    return {
        "status": "processed",
        "email_message_id": str(email_msg.id),
        "linked_invoice_id": str(linked_invoice_id) if linked_invoice_id else None,
        "linked_transaction_id": str(linked_transaction_id) if linked_transaction_id else None,
        "needs_review": email_msg.needs_review,
    }
