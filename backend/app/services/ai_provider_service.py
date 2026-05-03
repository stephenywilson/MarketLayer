"""Thin provider service facade for routes."""
from __future__ import annotations

from app.config import get_settings
from app.providers.ai import all_provider_metas, get_provider


def current_provider_id() -> str:
    return get_settings().ai_provider.lower()


def provider_catalog():
    return all_provider_metas(get_settings())


def test_provider(provider: str) -> tuple[bool, str]:
    settings = get_settings()
    selected = provider.lower().strip()
    if selected == "mock":
        return True, "Mock demo provider is available without an API key."
    if selected == settings.ai_provider.lower():
        configured = get_provider(settings).is_configured()
        return (
            configured,
            "Provider is configured in the backend environment."
            if configured
            else "Provider is not configured in the backend environment.",
        )
    for meta in all_provider_metas(settings):
        if meta.id == selected:
            return (
                meta.configured,
                "Provider is configured in the backend environment."
                if meta.configured
                else "Provider exists but is not configured in the backend environment.",
            )
    return False, "Unknown provider."

