"""Command Center aggregator: top-level decision-console snapshot."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import List

from app.config import get_settings
from app.models.console import (
    CommandCenterStatus,
    GateHeadline,
    MarketStatus,
    ProviderSnapshot,
    SystemLogEntry,
    WatchlistItem,
)
from app.providers.ai import all_provider_metas
from app.services.risk_gate import run_for_ticker
from app.services.signal_engine import WATCHLIST, top_signals
from app.services.strategy_lab import strategy_minis


def _now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _market_phase() -> str:
    now = datetime.now(timezone.utc)
    minutes = now.hour * 60 + now.minute
    pre = 9 * 60 + 30
    open_ = 13 * 60 + 30
    close = 20 * 60
    post_close = 24 * 60
    if open_ <= minutes < close:
        return "regular"
    if pre <= minutes < open_:
        return "pre"
    if close <= minutes < post_close:
        return "post"
    return "closed"


def _watchlist() -> List[WatchlistItem]:
    out: List[WatchlistItem] = []
    for t in WATCHLIST[:8]:
        seed = sum(ord(c) for c in t)
        last = round(80.0 + (seed % 240), 2)
        change = round(((seed % 17) - 8) / 2.0, 2)
        out.append(
            WatchlistItem(
                ticker=t,
                last_price=last,
                change_pct_1d=change,
                note=(
                    "Within range"
                    if abs(change) < 1.5
                    else "Above 30-day vol band"
                ),
                posture="monitor",
            )
        )
    return out


def _system_logs() -> List[SystemLogEntry]:
    ts = _now_iso()
    return [
        SystemLogEntry(
            ts=ts,
            level="info",
            source="signal_engine",
            message="Emitted active signals across watchlist (synthetic universe).",
        ),
        SystemLogEntry(
            ts=ts,
            level="info",
            source="strategy_lab",
            message="5 strategy modules loaded · 3 active · 1 research · 1 paused.",
        ),
        SystemLogEntry(
            ts=ts,
            level="warn",
            source="risk_gate",
            message="At least one ticker flagged event-risk warning — review required.",
        ),
        SystemLogEntry(
            ts=ts,
            level="info",
            source="decision_brief",
            message="Brief surfaces gated by risk-gate decision. Research only.",
        ),
        SystemLogEntry(
            ts=ts,
            level="info",
            source="provider",
            message="AI provider routing healthy. Mock fallback always available.",
        ),
    ]


def snapshot() -> CommandCenterStatus:
    settings = get_settings()
    provider_metas = all_provider_metas(settings)
    configured = sum(1 for m in provider_metas if m.configured)

    market = MarketStatus(
        phase=_market_phase(),  # type: ignore[arg-type]
        as_of=_now_iso(),
        breadth="Mixed · synthetic baseline",
        regime="Range-bound · low-vol regime (mock)",
    )

    provider = ProviderSnapshot(
        current=settings.ai_provider.lower(),
        configured=configured,
        total=len(provider_metas),
        note="API keys read server-side only.",
    )

    signals = top_signals(n=6)
    gate = run_for_ticker(signals[0].ticker if signals else "NVDA")
    gate_head = GateHeadline(
        decision=gate.decision,
        last_run_at=gate.last_run_at,
        summary=gate.summary,
    )

    return CommandCenterStatus(
        market=market,
        provider=provider,
        data_mode="mock",
        active_signals=signals,
        strategy_modules=strategy_minis(),
        risk_gate=gate_head,
        decision_brief_headline=(
            "Posture stable · gate "
            f"{gate.decision} · {len(signals)} signals queued for review."
        ),
        decision_brief_posture="moderate",
        watchlist=_watchlist(),
        system_logs=_system_logs(),
    )
