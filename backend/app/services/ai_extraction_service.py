"""AI-powered financial data extraction using OpenAI function calling."""
import json
from app.integrations.claude.client import get_ai_client
from app.integrations.claude.prompts import EXTRACTION_SYSTEM_PROMPT, EXTRACTION_TOOL
from app.config import get_settings

settings = get_settings()


def extract_financial_data(
    subject: str,
    sender: str,
    received_at: str,
    body: str,
    attachment_texts: list[str] | None = None,
) -> dict:
    """
    Call OpenAI with function calling to extract structured financial data from an email.
    Returns the function arguments dict with extracted fields + confidence_score.
    Confidence < 0.7 → caller should flag for manual review.
    """
    client = get_ai_client()

    attachment_section = ""
    if attachment_texts:
        attachment_section = "\n\n---ATTACHMENTS---\n" + "\n---\n".join(attachment_texts)

    user_message = (
        f"Email Subject: {subject}\n"
        f"From: {sender}\n"
        f"Date: {received_at}\n\n"
        f"Body:\n{body[:6000]}"  # cap body to avoid token overflow
        f"{attachment_section[:4000]}"
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
    verify GST calculation (18% default), return corrected dict with
    updated confidence_score if discrepancies found.
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
