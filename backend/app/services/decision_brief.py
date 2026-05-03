"""AI Decision Brief — compact decision-support framing.

Distinct from a full research report: the brief is a 5-line decision-
support headline derived from the report, signals, and risk gate.

It keeps action vocabulary constrained to: monitor, deepen, pause.
"""
from __future__ import annotations

from typing import List

from app.models.console import (
    AIDecisionBrief,
    RiskGateResult,
    Signal,
    WatchlistAction,
)
from app.models.research import ResearchReport


def _posture_from_report(report: ResearchReport):
    score = report.market_impact_score
    if score >= 75:
        return "elevated"
    if score >= 55:
        return "moderate"
    if score >= 35:
        return "moderate"
    return "low"


def _action_from(
    gate: RiskGateResult, signals: List[Signal], confidence: int
) -> WatchlistAction:
    if gate.decision == "blocked":
        return "pause"
    if confidence >= 70 and gate.decision in ("passed", "warning"):
        return "deepen"
    return "monitor"


def build(
    report: ResearchReport,
    signals: List[Signal],
    gate: RiskGateResult,
) -> AIDecisionBrief:
    confidence = report.confidence_score
    posture = _posture_from_report(report)
    action = _action_from(gate, signals, confidence)

    sig_summary_parts = []
    by_status: dict[str, int] = {}
    for s in signals:
        by_status[s.status] = by_status.get(s.status, 0) + 1
    for k in ("passed", "monitoring", "review_required", "blocked"):
        if k in by_status:
            sig_summary_parts.append(f"{by_status[k]} {k.replace('_', ' ')}")
    sig_weight = ", ".join(sig_summary_parts) or "no active signals"

    headline_map = {
        "deepen": (
            f"{report.ticker}: signals support deeper research; gate "
            f"{gate.decision}."
        ),
        "monitor": (
            f"{report.ticker}: balanced posture, continue to monitor "
            f"under risk gate {gate.decision}."
        ),
        "pause": (
            f"{report.ticker}: brief paused — risk gate decision "
            f"{gate.decision}, await re-check."
        ),
    }

    key_factors = [
        f"Provider: {report.provider_used} · confidence {confidence}",
        f"Risk gate: {gate.decision} · {gate.summary}",
        f"Catalysts: {len(report.key_catalysts)} on file",
        f"Signals: {sig_weight}",
        f"Watchlist action: {action} (research only)",
    ]

    return AIDecisionBrief(
        ticker=report.ticker,
        headline=headline_map[action],
        thesis=report.final_summary,
        key_factors=key_factors,
        signals_weight=sig_weight,
        risk_posture=posture,  # type: ignore[arg-type]
        watchlist_action=action,
        confidence=confidence,
        provider_used=report.provider_used,
    )
