import base64
import json
from typing import Any


def encode_cursor(values: dict[str, Any]) -> str:
    return base64.urlsafe_b64encode(json.dumps(values).encode()).decode()


def decode_cursor(cursor: str) -> dict[str, Any] | None:
    try:
        return json.loads(base64.urlsafe_b64decode(cursor.encode()).decode())
    except Exception:
        return None
