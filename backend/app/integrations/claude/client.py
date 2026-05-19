"""OpenAI SDK client singleton."""
from openai import OpenAI
from functools import lru_cache
from app.config import get_settings

settings = get_settings()


@lru_cache
def get_ai_client() -> OpenAI:
    return OpenAI(api_key=settings.openai_api_key)
