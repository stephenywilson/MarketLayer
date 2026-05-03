"""Local app mode state endpoint."""
from __future__ import annotations

from fastapi import APIRouter

from app.models.market_scan import ModeState

router = APIRouter()

_STATE = ModeState(mode="starter")


@router.get("/mode", response_model=ModeState)
def get_mode() -> ModeState:
    return _STATE


@router.post("/mode", response_model=ModeState)
def set_mode(state: ModeState) -> ModeState:
    _STATE.mode = state.mode
    return _STATE

