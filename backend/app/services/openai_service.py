"""OpenAI GPT-4o service — financial extraction + report generation."""
import json
from functools import lru_cache
from openai import OpenAI
from app.config import get_settings

settings = get_settings()


@lru_cache
def get_openai_client() -> OpenAI:
    return OpenAI(api_key=settings.openai_api_key)


# ─── System Prompts ───────────────────────────────────────────────────────────

EXTRACTION_SYSTEM_PROMPT = """You are Finvora AI's financial data extraction engine. Your sole purpose is to extract precise structured financial information from organizational email communications and attached documents.

You will be given:
- Email subject, sender, date, body text

Extract ALL financial entities present with maximum accuracy. Call the extract_financial_data function with every field you can determine. If a field is not present, omit it — never guess.

Critical accuracy rules:
- Amounts must be exact numbers as stated in the email (no rounding, no inference)
- GST numbers follow the format: 2-digit state code + PAN + 1 digit + 1 char + 1 digit (e.g. 27AAPFU0939F1ZV)
- Invoice numbers must be copied exactly including any prefixes/suffixes
- Dates must be in ISO 8601 format (YYYY-MM-DD)
- Currency defaults to INR unless explicitly stated otherwise
- confidence_score: 0.0–1.0 reflecting your certainty in the extraction accuracy"""

REPORT_SYSTEM_PROMPT = """You are Finvora AI's financial reporting engine. Generate executive-level financial reports based on provided real organizational financial data.

Format all reports in clean Markdown with:
- Executive summary (3–5 bullet points)
- Key financial metrics table
- Trend analysis with specific numbers
- Risk indicators and anomalies detected
- Actionable recommendations

Use only the data provided — never fabricate numbers or trends. Express uncertainty where data is incomplete."""

FORECAST_SYSTEM_PROMPT = """You are Finvora AI's financial forecasting engine. Based on historical transaction patterns and invoice lifecycles provided, generate cash flow forecasts.

Always:
- State the data period you're forecasting from
- Express confidence intervals for projections
- Flag seasonal patterns or one-time items that affect accuracy
- Provide pessimistic, base, and optimistic scenarios"""

# ─── OpenAI Function Calling Schema ──────────────────────────────────────────

EXTRACTION_TOOL = {
    "type": "function",
    "function": {
        "name": "extract_financial_data",
        "description": "Extract all structured financial data from the email",
        "parameters": {
            "type": "object",
            "properties": {
                "financial_type": {
                    "type": "string",
                    "enum": ["INVOICE", "PAYMENT", "GST", "REIMBURSEMENT", "VENDOR_BILL", "CREDIT_NOTE", "APPROVAL", "UNKNOWN"],
                    "description": "Primary financial category of this email",
                },
                "vendor_name": {"type": "string", "description": "Vendor or sender company name"},
                "vendor_email": {"type": "string", "description": "Vendor email address"},
                "invoice_number": {"type": "string", "description": "Invoice or reference number"},
                "amount": {"type": "number", "description": "Primary financial amount"},
                "currency": {"type": "string", "description": "3-letter ISO currency code, default INR"},
                "tax_amount": {"type": "number", "description": "GST or tax amount"},
                "gst_number": {"type": "string", "description": "GST registration number"},
                "issue_date": {"type": "string", "description": "Invoice/document date (YYYY-MM-DD)"},
                "due_date": {"type": "string", "description": "Payment due date (YYYY-MM-DD)"},
                "payment_status": {
                    "type": "string",
                    "enum": ["UNPAID", "PAID", "PARTIAL", "OVERDUE", "UNKNOWN"],
                },
                "line_items": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "description": {"type": "string"},
                            "quantity": {"type": "number"},
                            "unit_price": {"type": "number"},
                            "line_total": {"type": "number"},
                        },
                    },
                },
                "confidence_score": {
                    "type": "number",
                    "description": "Extraction confidence 0.0–1.0",
                },
            },
            "required": ["financial_type", "confidence_score"],
        },
    },
}


# ─── Extraction Functions ─────────────────────────────────────────────────────

def extract_financial_data(
    subject: str,
    sender: str,
    received_at: str,
    body: str,
) -> dict:
    """
    Call OpenAI GPT-4o with function calling to extract structured financial
    data from an email. Returns a dict with all extracted fields + confidence_score.
    Confidence < 0.70 → caller should flag for manual review.
    """
    client = get_openai_client()
    user_message = (
        f"Email Subject: {subject}\n"
        f"From: {sender}\n"
        f"Date: {received_at}\n\n"
        f"Body:\n{body[:6000]}"
    )
    response = client.chat.completions.create(
        model=settings.openai_model,
        max_tokens=settings.openai_max_tokens,
        messages=[
            {"role": "system", "content": EXTRACTION_SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        tools=[EXTRACTION_TOOL],
        tool_choice={"type": "function", "function": {"name": "extract_financial_data"}},
    )
    message = response.choices[0].message
    if message.tool_calls:
        call = message.tool_calls[0]
        if call.function.name == "extract_financial_data":
            return json.loads(call.function.arguments)
    return {"financial_type": "UNKNOWN", "confidence_score": 0.0}


def validate_extraction(extracted: dict) -> dict:
    """
    Second-pass validation: cross-check line item totals vs total amount,
    verify GST number format. Reduces confidence_score if discrepancies found.
    """
    import re
    from decimal import Decimal, InvalidOperation

    issues = []

    # Validate line item sum matches total
    line_items = extracted.get("line_items", [])
    if line_items and extracted.get("amount"):
        try:
            item_sum = sum(Decimal(str(li.get("line_total", 0))) for li in line_items)
            total = Decimal(str(extracted["amount"]))
            if abs(item_sum - total) > Decimal("1"):  # allow ₹1 rounding tolerance
                issues.append("line_item_sum_mismatch")
        except (InvalidOperation, TypeError):
            pass

    # Basic GST number format check
    gst = extracted.get("gst_number", "")
    if gst and not re.match(r"^\d{2}[A-Z]{5}\d{4}[A-Z]\d[Z][A-Z\d]$", gst):
        issues.append("invalid_gst_format")

    if issues:
        original_confidence = float(extracted.get("confidence_score", 1.0))
        extracted["confidence_score"] = max(0.3, original_confidence - 0.2 * len(issues))
        extracted["validation_issues"] = issues

    return extracted


def generate_ai_report(report_type: str, data_summary: str) -> str:
    """Generate a markdown financial report using OpenAI."""
    client = get_openai_client()
    response = client.chat.completions.create(
        model=settings.openai_model,
        max_tokens=settings.openai_max_tokens,
        messages=[
            {"role": "system", "content": REPORT_SYSTEM_PROMPT},
            {"role": "user", "content": f"Generate a {report_type} report:\n\n{data_summary}"},
        ],
    )
    return response.choices[0].message.content or ""
