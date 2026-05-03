"""Deterministic signal engine.

V0.1 emits realistic synthetic signals across the watchlist. This is
intentionally a research / decision-support component. Every signal
carries a status that the risk gate must pass before the user is shown
a decision-support brief.

TODO(signals): replace seed-based generation with real connector output
once SEC/news/price connectors are live.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import List, Tuple

from app.models.console import RiskLevel, Signal, SignalStatus, SignalType

WATCHLIST: Tuple[str, ...] = (
    "NVDA",
    "AAPL",
    "MSFT",
    "TSLA",
    "AMD",
    "META",
    "GOOGL",
    "AMZN",
    "AVGO",
    "NFLX",
)

_SIGNAL_TYPES: Tuple[SignalType, ...] = (
    "momentum",
    "earnings_reaction",
    "news_catalyst",
    "mean_reversion",
    "etf_rotation",
)

_RATIONALES = {
    "momentum": "20/50 EMA expansion with positive vol-adjusted breadth",
    "earnings_reaction": "Post-earnings drift consistent with prior 3-quarter pattern",
    "news_catalyst": "Press-release tone classified as positive; clustered headlines",
    "mean_reversion": "RSI extreme reverting toward 30-day median range",
    "etf_rotation": "Sector ETF flow diverging from broad-market outflow",
}


def _seed(s: str, salt: int) -> int:
    return abs(sum(ord(c) for c in s) * 131 + salt * 17)


def _risk_band(score: int) -> RiskLevel:
    if score < 35:
        return "low"
    if score < 55:
        return "moderate"
    if score < 75:
        return "elevated"
    return "high"


def _status_for(seed: int, risk: RiskLevel) -> SignalStatus:
    if risk == "high":
        return "blocked" if seed % 3 == 0 else "review_required"
    if risk == "elevated":
        return "review_required" if seed % 2 == 0 else "monitoring"
    if risk == "low":
        return "passed" if seed % 2 == 0 else "monitoring"
    return "monitoring"


def _emitted_at(offset_min: int) -> str:
    return (
        datetime.now(timezone.utc) - timedelta(minutes=offset_min)
    ).strftime("%Y-%m-%dT%H:%M:%SZ")


def signals_for_ticker(ticker: str, limit: int = 3) -> List[Signal]:
    out: List[Signal] = []
    base = ticker.upper()
    for i in range(limit):
        stype = _SIGNAL_TYPES[(_seed(base, i) >> 3) % len(_SIGNAL_TYPES)]
        confidence = 35 + (_seed(base, i + 7) % 60)
        risk = _risk_band(_seed(base, i + 11) % 100)
        status = _status_for(_seed(base, i + 13), risk)
        out.append(
            Signal(
                id=f"sig_{base}_{i}",
                ticker=base,
                signal_type=stype,
                confidence=confidence,
                risk_level=risk,
                status=status,
                rationale=_RATIONALES[stype],
                emitted_at=_emitted_at(7 + i * 11),
            )
        )
    return out


def all_active_signals(limit_per_ticker: int = 2) -> List[Signal]:
    out: List[Signal] = []
    for t in WATCHLIST:
        out.extend(signals_for_ticker(t, limit=limit_per_ticker))
    out.sort(key=lambda s: (-s.confidence, s.ticker))
    return out


def top_signals(n: int = 6) -> List[Signal]:
    return all_active_signals(limit_per_ticker=1)[:n]
