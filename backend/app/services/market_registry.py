"""Market registry for MarketLayer v0.1.

The registry keeps enabled and planned markets explicit without coupling the
scan service to future connector implementations.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Literal

from app.models.market_scan import DEFAULT_STARTER_UNIVERSE

MarketStatus = Literal["enabled", "planned"]
ScanStyleId = Literal["balanced", "aggressive", "defensive", "news_catalyst"]


@dataclass(frozen=True)
class MarketRegistryEntry:
    id: str
    name: str
    status: MarketStatus
    default_universe: List[str]
    available_data_sources: List[str]
    available_skill_packs: List[str]
    default_scan_styles: List[ScanStyleId]


MARKET_REGISTRY: Dict[str, MarketRegistryEntry] = {
    "us_stocks": MarketRegistryEntry(
        id="us_stocks",
        name="US Stocks",
        status="enabled",
        default_universe=DEFAULT_STARTER_UNIVERSE,
        available_data_sources=["public_prices", "public_headlines", "sec_filings"],
        available_skill_packs=[
            "momentum_pack",
            "news_catalyst_pack",
            "risk_radar_pack",
            "earnings_watch_pack",
            "mean_reversion_pack",
            "sector_rotation_pack",
        ],
        default_scan_styles=["balanced", "aggressive", "defensive", "news_catalyst"],
    ),
    "crypto": MarketRegistryEntry("crypto", "Crypto", "planned", [], [], [], []),
    "hk_stocks": MarketRegistryEntry("hk_stocks", "Hong Kong Stocks", "planned", [], [], [], []),
    "japan_stocks": MarketRegistryEntry("japan_stocks", "Japan Stocks", "planned", [], [], [], []),
    "uk_stocks": MarketRegistryEntry("uk_stocks", "UK Stocks", "planned", [], [], [], []),
    "china_a": MarketRegistryEntry("china_a", "China A-Shares", "planned", [], [], [], []),
}


def list_markets() -> List[MarketRegistryEntry]:
    return list(MARKET_REGISTRY.values())


def get_market(market_id: str = "us_stocks") -> MarketRegistryEntry:
    return MARKET_REGISTRY.get(market_id, MARKET_REGISTRY["us_stocks"])
