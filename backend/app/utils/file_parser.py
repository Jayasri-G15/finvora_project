"""Extract text from PDF and image attachments for AI processing."""
import io
import base64


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extract all text from a PDF using pdfplumber."""
    try:
        import pdfplumber
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            pages = [page.extract_text() or "" for page in pdf.pages]
        return "\n".join(pages).strip()
    except Exception:
        return ""


def extract_text_from_attachment(data: bytes, mime_type: str) -> str:
    if "pdf" in mime_type:
        return extract_text_from_pdf(data)
    # For images, return base64 for Claude vision (handled in ai_extraction_service)
    if mime_type.startswith("image/"):
        return f"[IMAGE:{base64.b64encode(data).decode()}:{mime_type}]"
    return ""
