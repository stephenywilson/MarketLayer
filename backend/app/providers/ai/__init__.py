"""AI provider implementations."""
from __future__ import annotations

from typing import Dict, Type

from app.config import Settings, get_settings

from .anthropic import AnthropicProvider
from .base import AIProvider, ProviderMeta
from .catalayer import CatalayerProvider
from .gemini import GeminiProvider
from .mini500m import Mini500MProvider
from .mock import MockProvider
from .ollama import OllamaProvider
from .openai_compatible import OpenAICompatibleProvider

_REGISTRY: Dict[str, Type[AIProvider]] = {
    "mock": MockProvider,
    "catalayer": CatalayerProvider,
    "openai": OpenAICompatibleProvider,
    "anthropic": AnthropicProvider,
    "gemini": GeminiProvider,
    "ollama": OllamaProvider,
    "mini500m": Mini500MProvider,
}


def all_provider_metas(settings: Settings | None = None) -> list[ProviderMeta]:
    settings = settings or get_settings()
    return [cls(settings).meta() for cls in _REGISTRY.values()]


def _apply_overrides(settings: Settings, overrides: dict) -> tuple[str, Settings]:
    """Return (provider_id, effective_settings) with runtime overrides merged in."""
    provider_id = overrides.get("provider", settings.ai_provider).lower()
    # Map provider → (api_key_field, base_url_field, model_field)
    _fields: dict[str, tuple[str | None, str | None, str | None]] = {
        "catalayer": ("catalayer_api_key", None, None),
        "openai":    ("openai_api_key", "openai_base_url", "openai_model"),
        "anthropic": ("anthropic_api_key", None, "anthropic_model"),
        "gemini":    ("gemini_api_key", None, "gemini_model"),
        "ollama":    (None, "ollama_base_url", "ollama_model"),
        "custom":    ("openai_api_key", "openai_base_url", "openai_model"),
    }
    kf, uf, mf = _fields.get(provider_id, (None, None, None))
    updates: dict[str, str] = {}
    if kf and f"{provider_id}_api_key" in overrides:
        updates[kf] = overrides[f"{provider_id}_api_key"]
    if uf and f"{provider_id}_base_url" in overrides:
        updates[uf] = overrides[f"{provider_id}_base_url"]
    if mf and f"{provider_id}_model" in overrides:
        updates[mf] = overrides[f"{provider_id}_model"]
    return provider_id, (settings.model_copy(update=updates) if updates else settings)


def get_provider(settings: Settings | None = None) -> AIProvider:
    from app import runtime_config  # local import avoids circular dependency at startup
    settings = settings or get_settings()
    provider_id, effective = _apply_overrides(settings, runtime_config.get())
    cls = _REGISTRY.get(provider_id, MockProvider)
    return cls(effective)


__all__ = [
    "AIProvider",
    "ProviderMeta",
    "MockProvider",
    "CatalayerProvider",
    "OpenAICompatibleProvider",
    "AnthropicProvider",
    "GeminiProvider",
    "OllamaProvider",
    "Mini500MProvider",
    "all_provider_metas",
    "get_provider",
]
