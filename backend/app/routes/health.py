"""Health endpoint."""
from __future__ import annotations

from fastapi import APIRouter

from app import __version__

router = APIRouter()


@router.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "service": "marketlayer-backend",
        "version": __version__,
    }
