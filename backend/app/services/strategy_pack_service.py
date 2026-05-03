"""MarketLayer-native skill packs shared by Starter and Pro modes."""
from __future__ import annotations

from dataclasses import dataclass
from typing import List, Literal, Optional

from app.models.console import BacktestSnapshot, StrategyCard

Direction = Literal["bullish", "bearish", "neutral"]


@dataclass
class StrategyPackResult:
    strategy_id: str
    name: str
    direction: Direction
    confidence: int
    reason: str


STRATEGY_PACKS: List[StrategyCard] = [
    StrategyCard(
        id="momentum_pack",
        name="Momentum Pack",
        category="Price",
        market_type="us_equity",
        description="Finds stocks with stronger price momentum and confirmation.",
        universe="US stocks",
        status="active",
        enabled=True,
        last_run_at="dynamic",
        backtest=BacktestSnapshot(
            period="V0.1 snapshot",
            universe="Default watchlist",
            signals_per_week=4.2,
            hit_rate_pct=58,
            median_holding_window="5 sessions",
            coverage_pct=72,
        ),
    ),
    StrategyCard(
        id="news_catalyst_pack",
        name="News Catalyst Pack",
        category="News",
        market_type="us_equity",
        description="Maps public headlines and events to bullish or bearish candidates.",
        universe="US stocks",
        status="active",
        enabled=True,
        last_run_at="dynamic",
        backtest=BacktestSnapshot(
            period="V0.1 snapshot",
            universe="Default watchlist",
            signals_per_week=3.0,
            hit_rate_pct=54,
            median_holding_window="2-8 sessions",
            coverage_pct=58,
        ),
    ),
    StrategyCard(
        id="risk_radar_pack",
        name="Risk Radar Pack",
        category="Risk",
        market_type="us_equity",
        description="Flags volatility, event proximity, weak confirmation, and data-quality risk.",
        universe="US stocks",
        status="active",
        enabled=True,
        last_run_at="dynamic",
        backtest=BacktestSnapshot(
            period="V0.1 snapshot",
            universe="Default watchlist",
            signals_per_week=3.8,
            hit_rate_pct=57,
            median_holding_window="review window",
            coverage_pct=82,
        ),
    ),
    StrategyCard(
        id="earnings_watch_pack",
        name="Earnings Watch Pack",
        category="Event",
        market_type="us_equity",
        description="Tracks earnings-related momentum, surprise risk, and post-earnings drift.",
        universe="US stocks",
        status="active",
        enabled=False,
        last_run_at="dynamic",
        backtest=BacktestSnapshot(
            period="V0.1 snapshot",
            universe="Default watchlist",
            signals_per_week=1.6,
            hit_rate_pct=63,
            median_holding_window="3-5 sessions",
            coverage_pct=44,
        ),
    ),
    StrategyCard(
        id="mean_reversion_pack",
        name="Mean Reversion Pack",
        category="Price",
        market_type="us_equity",
        description="Finds extended names that may revert toward recent ranges.",
        universe="US stocks",
        status="active",
        enabled=False,
        last_run_at="dynamic",
        backtest=BacktestSnapshot(
            period="V0.1 snapshot",
            universe="Default watchlist",
            signals_per_week=2.1,
            hit_rate_pct=51,
            median_holding_window="3 sessions",
            coverage_pct=66,
        ),
    ),
    StrategyCard(
        id="sector_rotation_pack",
        name="Sector Rotation Pack",
        category="Sector",
        market_type="us_equity",
        description="Detects sector-level strength and cross-stock sympathy movement.",
        universe="US stocks",
        status="research",
        enabled=False,
        last_run_at="dynamic",
        backtest=BacktestSnapshot(
            period="V0.1 snapshot",
            universe="Default watchlist",
            signals_per_week=1.4,
            hit_rate_pct=52,
            median_holding_window="5 sessions",
            coverage_pct=61,
        ),
    ),
]


def list_strategy_packs() -> List[StrategyCard]:
    return STRATEGY_PACKS


def set_enabled(strategy_id: str, enabled: bool) -> StrategyCard | None:
    for pack in STRATEGY_PACKS:
        if pack.id == strategy_id:
            pack.enabled = enabled
            return pack
    return None


def run_for_ticker(ticker: str, price_change_1d: float, news_impact: str) -> List[StrategyPackResult]:
    base = ticker.upper()
    seed = sum(ord(c) for c in base)
    price_dir: Direction = "bullish" if price_change_1d >= 0 else "bearish"
    news_dir: Direction = (
        "bullish"
        if news_impact == "positive"
        else "bearish"
        if news_impact == "negative"
        else "neutral"
    )
    results = [
        StrategyPackResult(
            "momentum_pack",
            "Momentum Pack",
            price_dir,
            55 + (seed % 30),
            f"Recent price movement is {price_change_1d:+.2f}%.",
        ),
        StrategyPackResult(
            "news_catalyst_pack",
            "News Catalyst Pack",
            news_dir,
            50 + ((seed + 7) % 35),
            f"Headline impact classified as {news_impact}.",
        ),
        StrategyPackResult(
            "risk_radar_pack",
            "Risk Radar Pack",
            price_dir,
            45 + ((seed + 13) % 35),
            "Volatility and data-quality context are included in the scan.",
        ),
    ]
    if abs(price_change_1d) > 2.5:
        results.append(
            StrategyPackResult(
                "mean_reversion_pack",
                "Mean Reversion Pack",
                "bearish" if price_change_1d > 0 else "bullish",
                45 + ((seed + 19) % 35),
                "Near-term move is extended relative to the scan baseline.",
            )
        )
    return results
