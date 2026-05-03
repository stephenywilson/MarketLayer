"""Beginner-facing scan styles and v0.1 demo weights."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Literal

ScanStyleId = Literal["balanced", "aggressive", "defensive", "news_catalyst"]


@dataclass(frozen=True)
class ScanStyle:
    id: ScanStyleId
    name: str
    description: str
    momentum_weight: float
    news_weight: float
    risk_weight: float
    confidence_weight: float


SCAN_STYLES: Dict[ScanStyleId, ScanStyle] = {
    "balanced": ScanStyle(
        "balanced",
        "Balanced Mode",
        "Balanced scoring between momentum, news, and risk.",
        0.30,
        0.30,
        0.25,
        0.15,
    ),
    "aggressive": ScanStyle(
        "aggressive",
        "Aggressive Mode",
        "Higher weight on momentum and stronger catalyst signals.",
        0.45,
        0.30,
        0.10,
        0.15,
    ),
    "defensive": ScanStyle(
        "defensive",
        "Defensive Mode",
        "Higher weight on risk filters and confirmation.",
        0.20,
        0.20,
        0.45,
        0.15,
    ),
    "news_catalyst": ScanStyle(
        "news_catalyst",
        "News Catalyst Mode",
        "Higher weight on headlines, filings, and event catalysts.",
        0.20,
        0.50,
        0.15,
        0.15,
    ),
}


def get_scan_style(style_id: str = "balanced") -> ScanStyle:
    return SCAN_STYLES.get(style_id, SCAN_STYLES["balanced"])  # type: ignore[arg-type]
