"""Risk filters used before Starter and Pro reports surface candidates."""
from __future__ import annotations

from typing import List

from app.models.market_scan import RiskAlert


def risk_level(score: int, price_change_1d: float, negative_headlines: int, data_source: str) -> str:
    risk = 0
    if abs(price_change_1d) >= 3:
        risk += 2
    elif abs(price_change_1d) >= 1.5:
        risk += 1
    if negative_headlines >= 3:
        risk += 2
    elif negative_headlines:
        risk += 1
    if data_source != "yfinance":
        risk += 1
    if score >= 80:
        risk += 1
    if risk >= 4:
        return "High"
    if risk >= 2:
        return "Medium"
    return "Low"


def status_for(direction: str, risk: str) -> str:
    if direction == "bullish":
        return "Review" if risk == "High" else "Monitor"
    if direction == "bearish":
        return "High Risk" if risk == "High" else "Review"
    return "Review"


def alerts_for(
    ticker: str,
    price_change_1d: float,
    negative_headlines: int,
    data_source: str,
) -> List[RiskAlert]:
    alerts: List[RiskAlert] = []
    if abs(price_change_1d) >= 3:
        alerts.append(
            RiskAlert(
                ticker=ticker.upper(),
                risk_type="Volatility",
                severity="High",
                reason=f"One-day move is {price_change_1d:+.2f}%, above the scan threshold.",
                what_to_watch="Watch whether the move stabilizes across the next public data refresh.",
            )
        )
    if negative_headlines >= 2:
        alerts.append(
            RiskAlert(
                ticker=ticker.upper(),
                risk_type="Negative headlines",
                severity="Medium" if negative_headlines < 4 else "High",
                reason=f"{negative_headlines} headline(s) were classified as negative.",
                what_to_watch="Watch whether headline pressure broadens or reverses.",
            )
        )
    if price_change_1d < -1.5:
        alerts.append(
            RiskAlert(
                ticker=ticker.upper(),
                risk_type="Weak momentum",
                severity="Medium",
                reason="Recent price action is weaker than the default scan baseline.",
                what_to_watch="Watch for stabilization in price and volume.",
            )
        )
    if data_source != "yfinance":
        alerts.append(
            RiskAlert(
                ticker=ticker.upper(),
                risk_type="Data uncertainty",
                severity="Medium",
                reason="Public price data was unavailable and demo fallback data was used.",
                what_to_watch="Re-run the scan when public data access is available.",
            )
        )
    return alerts

