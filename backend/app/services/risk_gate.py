"""Risk Gate: 6-check decision-support filter.

Runs deterministic synthetic checks for V0.1. The gate does not block
trades — there are no trades. It blocks the *decision-support brief*
from being shown to a user when underlying data quality, vol, liquidity,
event proximity, AI confidence, or implicit portfolio exposure fail
their thresholds.

TODO(risk): replace mock checks with real connector reads.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import List

from app.models.console import (
    GateDecision,
    RiskGateCheck,
    RiskGateResult,
)


def _now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _seed(s: str, salt: int) -> int:
    return abs(sum(ord(c) for c in s) * 137 + salt * 23)


def _band(score: int) -> GateDecision:
    if score >= 75:
        return "passed"
    if score >= 55:
        return "warning"
    if score >= 35:
        return "review_required"
    return "blocked"


def _aggregate(checks: List[RiskGateCheck]) -> GateDecision:
    if any(c.status == "blocked" for c in checks):
        return "blocked"
    if any(c.status == "review_required" for c in checks):
        return "review_required"
    if any(c.status == "warning" for c in checks):
        return "warning"
    return "passed"


def run_for_ticker(ticker: str, ai_confidence: int = 60) -> RiskGateResult:
    base = ticker.upper()
    checks: List[RiskGateCheck] = []

    vol_score = 30 + (_seed(base, 1) % 65)
    checks.append(
        RiskGateCheck(
            name="volatility",
            label="Volatility regime",
            status=_band(vol_score),
            score=vol_score,
            detail=(
                "Realized 30-day vol within expected band."
                if vol_score >= 55
                else "Realized vol elevated vs 30-day median; tighten filters."
            ),
        )
    )

    liq_score = 40 + (_seed(base, 2) % 55)
    checks.append(
        RiskGateCheck(
            name="liquidity",
            label="Liquidity / spread",
            status=_band(liq_score),
            score=liq_score,
            detail=(
                "Average dollar-volume sufficient for research universe."
                if liq_score >= 55
                else "Dollar-volume thin vs sector peers — flag for analyst review."
            ),
        )
    )

    event_score = 25 + (_seed(base, 3) % 70)
    checks.append(
        RiskGateCheck(
            name="event_risk",
            label="Event proximity",
            status=_band(event_score),
            score=event_score,
            detail=(
                "No high-impact event in the next 5 sessions."
                if event_score >= 55
                else "Earnings or macro event proximity inside 5-session window."
            ),
        )
    )

    data_score = 60 + (_seed(base, 4) % 35)
    checks.append(
        RiskGateCheck(
            name="data_quality",
            label="Data quality",
            status=_band(data_score),
            score=data_score,
            detail=(
                "All required connectors reporting within freshness SLO."
                if data_score >= 55
                else "Connector lag on at least one required source."
            ),
        )
    )

    ai_score = max(0, min(100, ai_confidence))
    checks.append(
        RiskGateCheck(
            name="ai_confidence",
            label="AI confidence",
            status=_band(ai_score),
            score=ai_score,
            detail=(
                "Provider self-reported confidence above 55."
                if ai_score >= 55
                else "Provider self-reported confidence below review threshold."
            ),
        )
    )

    expo_score = 45 + (_seed(base, 6) % 50)
    checks.append(
        RiskGateCheck(
            name="portfolio_exposure",
            label="Portfolio exposure (simulated)",
            status=_band(expo_score),
            score=expo_score,
            detail=(
                "Simulated watchlist exposure within concentration band."
                if expo_score >= 55
                else "Simulated watchlist concentration above review band."
            ),
        )
    )

    decision = _aggregate(checks)
    summary = {
        "passed": (
            "All gate checks within thresholds — decision-support brief "
            "may be surfaced for analyst review."
        ),
        "warning": (
            "One or more soft thresholds breached — surface brief with "
            "warning context."
        ),
        "review_required": (
            "Manual review required — at least one check below threshold."
        ),
        "blocked": (
            "Brief withheld — at least one hard check failed. Investigate "
            "before relying on this signal."
        ),
    }[decision]

    return RiskGateResult(
        ticker=base,
        decision=decision,
        summary=summary,
        checks=checks,
        last_run_at=_now_iso(),
    )
