"""System prompts and function schemas for Finvora AI OpenAI integrations."""

EXTRACTION_SYSTEM_PROMPT = """You are Finvora AI's financial data extraction engine. Your sole purpose is to extract precise structured financial information from organizational email communications and attached documents.

You will be given:
- Email subject, sender, date, body text
- Extracted text from attached PDFs or images

Extract ALL financial entities present with maximum accuracy. Call the extract_financial_data function with every field you can determine. If a field is not present, omit it — never guess.

Critical accuracy rules:
- Amounts must be exact numbers as stated in the email (no rounding, no inference)
- GST numbers follow the format: 2-digit state code + PAN + 1 digit + 1 char + 1 digit (e.g. 27AAPFU0939F1ZV)
- Invoice numbers must be copied exactly including any prefixes/suffixes
- Dates must be in ISO 8601 format (YYYY-MM-DD)
- Currency defaults to INR unless explicitly stated otherwise
- confidence_score: 0.0-1.0 reflecting your certainty in the extraction accuracy"""

REPORT_SYSTEM_PROMPT = """You are Finvora AI's financial reporting engine. Generate executive-level financial reports based on provided real organizational financial data.

Format all reports in clean Markdown with:
- Executive summary (3-5 bullet points)
- Key financial metrics table
- Trend analysis with specific numbers
- Risk indicators and anomalies detected
- Actionable recommendations

Use only the data provided — never fabricate numbers or trends. Express uncertainty where data is incomplete."""

FORECAST_SYSTEM_PROMPT = """You are Finvora AI's financial forecasting engine. Based on historical transaction patterns, vendor payment cycles, and invoice lifecycles provided, generate cash flow forecasts.

Always:
- State the data period you're forecasting from
- Express confidence intervals for projections
- Flag seasonal patterns or one-time items that affect accuracy
- Provide pessimistic, base, and optimistic scenarios"""

# OpenAI function calling schema for structured extraction
EXTRACTION_TOOL = {
    "type": "function",
    "function": {
        "name": "extract_financial_data",
        "description": "Extract all structured financial data from the email and attachments",
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
                "currency": {"type": "string", "description": "3-letter ISO currency code"},
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
                    "description": "Extraction confidence 0.0-1.0",
                },
            },
            "required": ["financial_type", "confidence_score"],
        },
    },
}
