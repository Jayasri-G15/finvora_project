"""Gmail API v1 wrapper — list messages, fetch full content, download attachments."""
import base64
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from app.config import get_settings

settings = get_settings()


def _build_service(access_token: str, refresh_token: str):
    creds = Credentials(
        token=access_token,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=settings.google_client_id,
        client_secret=settings.google_client_secret,
    )
    return build("gmail", "v1", credentials=creds)


def list_messages(access_token: str, refresh_token: str, query: str = "", max_results: int = 100) -> list[dict]:
    service = _build_service(access_token, refresh_token)
    result = service.users().messages().list(userId="me", q=query, maxResults=max_results).execute()
    return result.get("messages", [])


def get_message(access_token: str, refresh_token: str, message_id: str) -> dict:
    service = _build_service(access_token, refresh_token)
    return service.users().messages().get(userId="me", id=message_id, format="full").execute()


def get_attachment(access_token: str, refresh_token: str, message_id: str, attachment_id: str) -> bytes:
    service = _build_service(access_token, refresh_token)
    result = service.users().messages().attachments().get(
        userId="me", messageId=message_id, id=attachment_id
    ).execute()
    data = result.get("data", "")
    return base64.urlsafe_b64decode(data)


def list_history(access_token: str, refresh_token: str, start_history_id: str) -> dict:
    service = _build_service(access_token, refresh_token)
    return service.users().history().list(
        userId="me", startHistoryId=start_history_id, historyTypes=["messageAdded"]
    ).execute()


def watch_mailbox(access_token: str, refresh_token: str) -> dict:
    service = _build_service(access_token, refresh_token)
    return service.users().watch(
        userId="me",
        body={"topicName": settings.google_pubsub_topic, "labelIds": ["INBOX"]},
    ).execute()


def extract_body_and_attachments(message: dict) -> tuple[str, list[dict]]:
    """Returns (plain_text_body, [{filename, mime_type, attachment_id}])."""
    body = ""
    attachments = []

    def _parse_parts(parts):
        nonlocal body
        for part in parts:
            mime = part.get("mimeType", "")
            if mime == "text/plain":
                data = part.get("body", {}).get("data", "")
                if data:
                    body += base64.urlsafe_b64decode(data).decode("utf-8", errors="replace")
            elif part.get("filename"):
                att_id = part.get("body", {}).get("attachmentId")
                if att_id:
                    attachments.append({
                        "filename": part["filename"],
                        "mime_type": mime,
                        "attachment_id": att_id,
                    })
            if part.get("parts"):
                _parse_parts(part["parts"])

    payload = message.get("payload", {})
    if payload.get("parts"):
        _parse_parts(payload["parts"])
    else:
        data = payload.get("body", {}).get("data", "")
        if data:
            body = base64.urlsafe_b64decode(data).decode("utf-8", errors="replace")

    return body, attachments
