"""Bullish/bearish scoring rules for open-source market scans."""
from __future__ import annotations

from dataclasses import dataclass
from typing import List

from app.services.strategy_pack_service import StrategyPackResult


@dataclass
class DirectionScore:
    bullish_score: int
    bearish_score: int
    confidence: int
    direction: str
    reason: str


def _clamp(v: float) -> int:
    return max(0, min(100, int(round(v))))


def score_candidate(
    ticker: str,
    price_change_1d: float,
    news_impacts: List[str],
    strategy_results: List[StrategyPackResult],
) -> DirectionScore:
    bullish = 45.0
    bearish = 45.0

    bullish += max(0.0, price_change_1d) * 5.0
    bearish += max(0.0, -price_change_1d) * 5.0

    bullish += news_impacts.count("positive") * 8.0
    bearish += news_impacts.count("negative") * 8.0
    bullish += news_impacts.count("mixed") * 2.0
    bearish += news_impacts.count("mixed") * 2.0

    for r in strategy_results:
        weight = r.confidence / 20.0
        if r.direction == "bullish":
            bullish += weight
        elif r.direction == "bearish":
            bearish += weight

    bullish_i = _clamp(bullish)
    bearish_i = _clamp(bearish)
    confidence = _clamp(50 + abs(bullish_i - bearish_i) * 0.7)
    direction = (
        "bullish"
        if bullish_i >= bearish_i + 6
        else "bearish"
        if bearish_i >= bullish_i + 6
        else "neutral"
    )

    if direction == "bullish":
        reason = (
            f"{ticker.upper()} shows stronger upside watch signals from "
            "price movement, public headlines, and built-in strategy packs."
        )
    elif direction == "bearish":
        reason = (
            f"{ticker.upper()} shows elevated downside risk from price "
            "movement, public headlines, or strategy-pack pressure."
        )
    else:
        reason = (
            f"{ticker.upper()} is balanced in this scan, with no clear "
            "bullish or bearish edge."
        )

    return DirectionScore(
        bullish_score=bullish_i,
        bearish_score=bearish_i,
        confidence=confidence,
        direction=direction,
        reason=reason,
    )

