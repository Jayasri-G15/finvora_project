from datetime import datetime, timedelta, timezone
from typing import Any
import uuid
from jose import jwt, JWTError
from cryptography.fernet import Fernet
from app.config import get_settings

settings = get_settings()

_fernet: Fernet | None = None


def _get_fernet() -> Fernet:
    global _fernet
    if _fernet is None and settings.encryption_key:
        _fernet = Fernet(settings.encryption_key.encode())
    return _fernet


def encrypt_value(value: str) -> str:
    f = _get_fernet()
    if f is None:
        return value
    return f.encrypt(value.encode()).decode()


def decrypt_value(value: str) -> str:
    f = _get_fernet()
    if f is None:
        return value
    return f.decrypt(value.encode()).decode()


def create_access_token(subject: str, extra: dict[str, Any] | None = None) -> tuple[str, str]:
    """Returns (token, jti)."""
    jti = str(uuid.uuid4())
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_access_token_expire_minutes)
    payload = {"sub": subject, "exp": expire, "jti": jti, "type": "access"}
    if extra:
        payload.update(extra)
    token = jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    return token, jti


def decode_access_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        return payload
    except JWTError:
        return None
