"""Provider catalog + runtime config endpoints."""
from __future__ import annotations

import ipaddress
import re
from urllib.parse import urlparse

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

import httpx

from app import runtime_config
from app.config import get_settings
from app.models.market_scan import ProviderTestRequest, ProviderTestResponse
from app.models.providers import ProviderInfo, ProviderListResponse
from app.providers.ai import all_provider_metas
from app.services.ai_provider_service import test_provider

router = APIRouter()

# ── URL safety validation ───────────────────────────────────────────────────

_PRIVATE_RANGES = [
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("169.254.0.0/16"),   # link-local
    ipaddress.ip_network("100.64.0.0/10"),    # shared address space
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("fc00::/7"),
]

_LOCALHOST_NAMES = {"localhost", "127.0.0.1", "::1", "0.0.0.0"}


def _is_safe_remote_url(url: str) -> tuple[bool, str]:
    """Return (safe, reason). Blocks SSRF targets for remote provider endpoints."""
    try:
        parsed = urlparse(url)
    except Exception:
        return False, "URL could not be parsed."
    if parsed.scheme not in ("http", "https"):
        return False, "Only http/https URLs are allowed."
    host = parsed.hostname or ""
    if not host:
        return False, "URL has no hostname."
    if host.lower() in _LOCALHOST_NAMES:
        return False, "Localhost/loopback addresses are not allowed for remote providers."
    try:
        addr = ipaddress.ip_address(host)
        if addr.is_loopback or addr.is_link_local or addr.is_private:
            return False, "Private or reserved IP addresses are not allowed."
    except ValueError:
        pass  # hostname — DNS resolution not checked here (acceptable for this use case)
    return True, ""


def _is_safe_local_url(url: str) -> tuple[bool, str]:
    """Return (safe, reason). For Ollama: only localhost/loopback allowed."""
    try:
        parsed = urlparse(url)
    except Exception:
        return False, "URL could not be parsed."
    if parsed.scheme not in ("http", "https"):
        return False, "Only http/https URLs are allowed."
    host = (parsed.hostname or "").lower()
    if host not in _LOCALHOST_NAMES and not host.startswith("127."):
        return False, "Ollama base URL must point to localhost (local model only)."
    return True, ""


# ── catalog ────────────────────────────────────────────────────────────────

@router.get("/providers", response_model=ProviderListResponse)
def list_providers() -> ProviderListResponse:
    settings = get_settings()
    overrides = runtime_config.get()
    current = overrides.get("provider", settings.ai_provider).lower()
    metas = all_provider_metas(settings)
    return ProviderListResponse(
        current=current,
        providers=[
            ProviderInfo(
                id=m.id,
                name=m.name,
                description=m.description,
                requires_api_key=m.requires_api_key,
                configured=m.configured,
                env_keys=m.env_keys,
                is_local=m.is_local,
                is_placeholder=m.is_placeholder,
            )
            for m in metas
        ],
    )


# ── runtime config ──────────────────────────────────────────────────────────

class ProviderConfigRequest(BaseModel):
    provider: str
    api_key: str | None = None
    base_url: str | None = None
    model: str | None = None


class ProviderConfigResponse(BaseModel):
    success: bool
    active: str
    message: str


_ALLOWED_PROVIDERS = {"catalayer", "openai", "anthropic", "gemini", "ollama", "mini500m"}
_LOCAL_PROVIDERS = {"ollama", "mini500m"}


@router.post("/providers/config", response_model=ProviderConfigResponse)
def configure_provider(req: ProviderConfigRequest) -> ProviderConfigResponse:
    """Apply provider config immediately without restarting the backend."""
    provider = req.provider.lower().strip()
    if provider not in _ALLOWED_PROVIDERS:
        raise HTTPException(status_code=400, detail=f"Unknown provider: {provider!r}")

    # Validate base_url to prevent SSRF.
    if req.base_url:
        if provider in _LOCAL_PROVIDERS:
            safe, reason = _is_safe_local_url(req.base_url)
        else:
            safe, reason = _is_safe_remote_url(req.base_url)
        if not safe:
            raise HTTPException(status_code=400, detail=f"Invalid base URL: {reason}")

    runtime_config.update(
        provider=provider,
        api_key=req.api_key,
        base_url=req.base_url,
        model=req.model,
    )
    return ProviderConfigResponse(
        success=True,
        active=provider,
        message=f"Provider switched to '{provider}'. Active immediately — no restart needed.",
    )


# ── test connection ──────────────────────────────────────────────────────────

def _test_ollama(base_url: str) -> tuple[bool, str]:
    """Ping the Ollama HTTP API and report which models are loaded."""
    safe, reason = _is_safe_local_url(base_url)
    if not safe:
        return False, f"Invalid Ollama URL: {reason}"
    url = base_url.rstrip("/") + "/api/tags"
    try:
        r = httpx.get(url, timeout=5.0)
        if r.status_code == 200:
            data = r.json()
            models = [m["name"] for m in data.get("models", [])]
            if models:
                shown = ", ".join(models[:4])
                more = f" (+{len(models) - 4} more)" if len(models) > 4 else ""
                return True, f"Ollama connected. Models: {shown}{more}"
            return (
                True,
                "Ollama is running but no models are loaded. "
                "Run `ollama pull gemma4:e4b` (or any model) to get started.",
            )
        return False, f"Ollama responded with HTTP {r.status_code}."
    except httpx.ConnectError:
        return (
            False,
            f"Cannot reach Ollama at {base_url}. "
            "Make sure Ollama is installed and running. "
            "Download: https://ollama.com",
        )
    except Exception as e:
        return False, f"Ollama connection error: {type(e).__name__}"


@router.post("/providers/test", response_model=ProviderTestResponse)
def test_ai_provider(req: ProviderTestRequest) -> ProviderTestResponse:
    provider = req.provider.lower()
    if provider not in _ALLOWED_PROVIDERS:
        raise HTTPException(status_code=400, detail=f"Unknown provider: {provider!r}")

    if provider == "ollama":
        overrides = runtime_config.get()
        settings = get_settings()
        base_url = (
            req.base_url
            or overrides.get("ollama_base_url")
            or settings.ollama_base_url
        )
        connected, message = _test_ollama(base_url)
        return ProviderTestResponse(provider=provider, connected=connected, message=message)

    connected, message = test_provider(provider)
    return ProviderTestResponse(provider=provider, connected=connected, message=message)
