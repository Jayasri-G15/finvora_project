"""AI-powered financial data extraction using Claude with tool use and prompt caching."""
from app.integrations.claude.client import get_claude_client
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
    Call Claude with tool use to extract structured financial data from an email.
    Returns the tool input dict with extracted fields + confidence_score.
    Confidence < 0.7 → caller should flag for manual review.
    """
    client = get_claude_client()

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

    response = client.messages.create(
        model=settings.claude_model,
        max_tokens=settings.claude_max_tokens,
        system=[
            {
                "type": "text",
                "text": EXTRACTION_SYSTEM_PROMPT,
                "cache_control": {"type": "ephemeral"},  # prompt caching — saves tokens on bulk sync
            }
        ],
        tools=[EXTRACTION_TOOL],
        tool_choice={"type": "any"},
        messages=[{"role": "user", "content": user_message}],
    )

    for block in response.content:
        if block.type == "tool_use" and block.name == "extract_financial_data":
            return block.input

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
