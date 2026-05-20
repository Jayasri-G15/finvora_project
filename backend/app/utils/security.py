"""Supabase JWT verification — all token creation/encryption removed."""
from jose import jwt, JWTError
from fastapi import HTTPException, status
from app.config import get_settings

settings = get_settings()


def verify_supabase_token(token: str) -> dict:
    """
    Decode and validate a Supabase-issued JWT.
    Returns the payload dict (contains 'sub', 'email', 'role', 'user_metadata').
    Raises HTTP 401 if token is invalid or expired.
    """
    try:
        return jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
