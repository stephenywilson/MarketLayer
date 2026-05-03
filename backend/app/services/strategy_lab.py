"""Strategy Lab: research-only strategy modules with backtest snapshots.

Each module is a *research pattern* that emits signals into the Signal
Scanner. Backtest snapshots summarize signal behavior, not P&L.
Crypto-market modules are listed as planned for the next milestone.
"""
from __future__ import annotations

import threading
from datetime import datetime, timezone
from typing import Dict, List

from app.models.console import (
    BacktestSnapshot,
    StrategyCard,
    StrategyFit,
    StrategyMini,
)


def _now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


_STRATEGIES: List[StrategyCard] = [
    StrategyCard(
        id="momentum",
        name="Momentum Continuation",
        category="Trend",
        market_type="us_equity",
        description=(
            "Detects trend continuation via 20/50 EMA expansion plus a "
            "volatility-adjusted breadth filter. Emits monitoring signals "
            "for analyst review."
        ),
        universe="S&P 500 mega-cap (default)",
        status="active",
        enabled=True,
        last_run_at=_now_iso(),
        backtest=BacktestSnapshot(
            period="2024-04 → 2026-04",
            universe="S&P 500",
            signals_per_week=4.2,
            hit_rate_pct=58,
            median_holding_window="6–10 sessions",
            coverage_pct=72,
        ),
    ),
    StrategyCard(
        id="mean_reversion",
        name="Mean Reversion (Range)",
        category="Statistical",
        market_type="us_equity",
        description=(
            "Flags RSI(14) extremes reverting toward the 30-day median "
            "range with sector-beta context. Suppressed during high-vol "
            "regimes."
        ),
        universe="S&P 500",
        status="active",
        enabled=True,
        last_run_at=_now_iso(),
        backtest=BacktestSnapshot(
            period="2024-06 → 2026-04",
            universe="S&P 500",
            signals_per_week=2.1,
            hit_rate_pct=51,
            median_holding_window="2–4 sessions",
            coverage_pct=66,
        ),
    ),
    StrategyCard(
        id="earnings_reaction",
        name="Earnings Reaction Drift",
        category="Event",
        market_type="us_equity",
        description=(
            "Looks for post-earnings drift consistent with prior multi-"
            "quarter patterns. Strictly research — does not project P&L."
        ),
        universe="Nasdaq-100 + S&P 500 mega-cap",
        status="active",
        enabled=True,
        last_run_at=_now_iso(),
        backtest=BacktestSnapshot(
            period="2024-Q2 → 2026-Q1",
            universe="Nasdaq-100",
            signals_per_week=1.6,
            hit_rate_pct=63,
            median_holding_window="3–5 sessions post-print",
            coverage_pct=44,
        ),
    ),
    StrategyCard(
        id="news_catalyst",
        name="News Catalyst Re-rating",
        category="Event",
        market_type="us_equity",
        description=(
            "Classifies clustered press releases and SEC filing language "
            "to surface re-rating candidates for analyst review."
        ),
        universe="US large-cap + select mid-cap",
        status="active",
        enabled=True,
        last_run_at=_now_iso(),
        backtest=BacktestSnapshot(
            period="2025-01 → 2026-04",
            universe="US large-cap",
            signals_per_week=3.0,
            hit_rate_pct=54,
            median_holding_window="2–8 sessions",
            coverage_pct=58,
        ),
    ),
    StrategyCard(
        id="etf_rotation",
        name="ETF Rotation Divergence",
        category="Flow",
        market_type="etf",
        description=(
            "Tracks sector-ETF inflow divergence vs equity-level outflow. "
            "Used as a context signal alongside momentum and event modules."
        ),
        universe="11 GICS sector ETFs",
        status="research",
        enabled=False,
        last_run_at=_now_iso(),
        backtest=BacktestSnapshot(
            period="2024-09 → 2026-03",
            universe="11 GICS sector ETFs",
            signals_per_week=0.9,
            hit_rate_pct=49,
            median_holding_window="5–15 sessions",
            coverage_pct=100,
        ),
    ),
    # ---- Planned crypto-market modules (placeholders) ----
    StrategyCard(
        id="crypto_breakout",
        name="Crypto Breakout (planned)",
        category="Trend · Crypto",
        market_type="crypto",
        description=(
            "Range breakout on majors with on-exchange volume confirmation. "
            "Crypto market support is on the V0.3 roadmap."
        ),
        universe="BTC · ETH · top-25 by volume",
        status="research",
        enabled=False,
        last_run_at=_now_iso(),
        backtest=BacktestSnapshot(
            period="—",
            universe="planned",
            signals_per_week=0.0,
            hit_rate_pct=0,
            median_holding_window="—",
            coverage_pct=0,
            note="Placeholder · activate once crypto data connectors land.",
        ),
    ),
    StrategyCard(
        id="funding_rate_divergence",
        name="Funding Rate Divergence (planned)",
        category="Derivatives · Crypto",
        market_type="crypto",
        description=(
            "Diverging perp funding vs spot trend on majors. Roadmap V0.3."
        ),
        universe="BTC · ETH · SOL perps",
        status="research",
        enabled=False,
        last_run_at=_now_iso(),
        backtest=BacktestSnapshot(
            period="—",
            universe="planned",
            signals_per_week=0.0,
            hit_rate_pct=0,
            median_holding_window="—",
            coverage_pct=0,
            note="Placeholder · activate once derivatives feed lands.",
        ),
    ),
]


_LOCK = threading.Lock()
_STATE_BY_ID: Dict[str, StrategyCard] = {s.id: s for s in _STRATEGIES}


def all_strategies() -> List[StrategyCard]:
    with _LOCK:
        return list(_STATE_BY_ID.values())


def find(strategy_id: str) -> StrategyCard | None:
    with _LOCK:
        return _STATE_BY_ID.get(strategy_id)


def set_enabled(strategy_id: str, enabled: bool) -> StrategyCard | None:
    with _LOCK:
        s = _STATE_BY_ID.get(strategy_id)
        if not s:
            return None
        s.enabled = enabled
        return s


def strategy_minis() -> List[StrategyMini]:
    out: List[StrategyMini] = []
    for s in all_strategies():
        out.append(
            StrategyMini(
                id=s.id,
                name=s.name,
                status=s.status,
                fit_summary=f"{s.category} · {s.backtest.signals_per_week:.1f}/wk",
            )
        )
    return out


def fit_for_ticker(ticker: str) -> List[StrategyFit]:
    base = ticker.upper()
    seed = sum(ord(c) for c in base)
    out: List[StrategyFit] = []
    for i, s in enumerate(all_strategies()):
        if s.market_type == "crypto":
            continue  # don't suggest crypto modules for an equity ticker
        score = 25 + ((seed + i * 19) % 70)
        out.append(
            StrategyFit(
                strategy_id=s.id,
                strategy_name=s.name,
                fit_score=score,
                reason=(
                    f"{s.category} pattern alignment based on recent "
                    f"price/event posture for {base}."
                ),
            )
        )
    out.sort(key=lambda x: -x.fit_score)
    return out
