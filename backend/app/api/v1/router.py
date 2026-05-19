from fastapi import APIRouter
from app.api.v1 import auth, emails, transactions, invoices, vendors, budgets, payments, approvals, alerts, reports, analytics

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(emails.router, prefix="/emails", tags=["emails"])
api_router.include_router(transactions.router, prefix="/transactions", tags=["transactions"])
api_router.include_router(invoices.router, prefix="/invoices", tags=["invoices"])
api_router.include_router(vendors.router, prefix="/vendors", tags=["vendors"])
api_router.include_router(budgets.router, prefix="/budgets", tags=["budgets"])
api_router.include_router(payments.router, prefix="/payments", tags=["payments"])
api_router.include_router(approvals.router, prefix="/approvals", tags=["approvals"])
api_router.include_router(alerts.router, prefix="/alerts", tags=["alerts"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
