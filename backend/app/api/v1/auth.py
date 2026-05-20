"""Auth routes — Supabase handles OAuth; we expose /me and /logout only."""
from fastapi import APIRouter
from app.dependencies import CurrentUser
from app.schemas.user import UserRead

router = APIRouter()


@router.get("/me", response_model=UserRead)
async def get_me(current_user: CurrentUser):
    """Return the authenticated user's Finvora profile."""
    return current_user


@router.post("/logout")
async def logout():
    """
    Server-side logout stub.
    Actual logout is handled client-side via supabase.auth.signOut().
    """
    return {"message": "Call supabase.auth.signOut() on the client to clear the session."}
