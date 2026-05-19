"""Anthropic SDK client singleton with prompt caching enabled."""
import anthropic
from functools import lru_cache
from app.config import get_settings

settings = get_settings()


@lru_cache
def get_claude_client() -> anthropic.Anthropic:
    return anthropic.Anthropic(api_key=settings.anthropic_api_key)
