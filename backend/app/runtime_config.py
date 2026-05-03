"""Runtime provider configuration — overrides .env without a restart.

SECURITY NOTE: API keys are kept in memory only and are NEVER written to disk.
Only non-sensitive values (provider name, base URL, model tag) are persisted
to .runtime_config.json. Users must re-enter API keys after a backend restart.
"""
from __future__ import annotations

import json
import threading
from pathlib import Path
from typing import Any

_FILE = Path(__file__).parent.parent / ".runtime_config.json"
_lock = threading.Lock()
_overrides: dict[str, Any] = {}

# Fields that contain credentials — never written to disk.
_SENSITIVE_KEYS = {"api_key", "secret", "token", "password", "bearer"}


def _is_sensitive(key: str) -> bool:
    return any(s in key.lower() for s in _SENSITIVE_KEYS)


def _load() -> None:
    global _overrides
    if _FILE.exists():
        try:
            with _FILE.open() as f:
                data = json.load(f)
            # Strip any sensitive values that may have been persisted by an
            # older version of this module before this security fix was applied.
            _overrides = {k: v for k, v in data.items() if not _is_sensitive(k)}
        except Exception:
            _overrides = {}


def _save() -> None:
    """Persist only non-sensitive runtime overrides to disk."""
    try:
        safe = {k: v for k, v in _overrides.items() if not _is_sensitive(k)}
        with _FILE.open("w") as f:
            json.dump(safe, f, indent=2)
    except Exception:
        pass


def get() -> dict[str, Any]:
    """Return a snapshot of current runtime overrides (includes in-memory keys)."""
    with _lock:
        return dict(_overrides)


def update(
    provider: str,
    api_key: str | None = None,
    base_url: str | None = None,
    model: str | None = None,
) -> None:
    """Apply overrides. API keys are kept in memory only, never written to disk."""
    with _lock:
        _overrides["provider"] = provider.lower()
        if api_key is not None:
            # Store in memory only — deliberately excluded from _save().
            _overrides[f"{provider}_api_key"] = api_key
        if base_url is not None:
            _overrides[f"{provider}_base_url"] = base_url
        if model is not None:
            _overrides[f"{provider}_model"] = model
        _save()  # only writes non-sensitive fields


def clear() -> None:
    with _lock:
        _overrides.clear()
        _save()


# Load persisted (non-sensitive) values on first import.
_load()
