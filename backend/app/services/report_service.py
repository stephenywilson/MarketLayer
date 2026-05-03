"""Build plain-English market reports from scored scan artifacts."""
from __future__ import annotations

from typing import List

from app.models.market_scan import BearishCandidate, BullishCandidate, MarketDirection, RiskAlert


def market_direction(
    bullish: List[BullishCandidate],
    bearish: List[BearishCandidate],
    alerts: List[RiskAlert],
) -> MarketDirection:
    high_alerts = sum(1 for a in alerts if a.severity == "High")
    if high_alerts >= 3:
        tone = "Risk-off"
    elif len(bullish) > len(bearish) + 1:
        tone = "Bullish"
    elif len(bearish) > len(bullish) + 1:
        tone = "Bearish"
    else:
        tone = "Mixed"

    risk = "High" if high_alerts else ("Medium" if alerts else "Low")
    themes = []
    if bullish:
        themes.append(f"{bullish[0].ticker} bullish momentum")
    if bearish:
        themes.append(f"{bearish[0].ticker} downside pressure")
    if high_alerts:
        themes.append("elevated risk alerts")
    if not themes:
        themes = ["no strong directional signals"]
    summary = (
        f"Today\u2019s scan is {tone.lower()} across the default US stock "
        f"watchlist. {len(bullish)} bullish candidate(s), {len(bearish)} "
        f"bearish candidate(s), and {len(alerts)} risk alert(s) were detected."
    )
    return MarketDirection(
        tone=tone,  # type: ignore[arg-type]
        risk_level=risk,  # type: ignore[arg-type]
        dominant_themes=themes,
        summary=summary,
    )


def ai_market_brief(
    bullish: List[BullishCandidate],
    bearish: List[BearishCandidate],
    alerts: List[RiskAlert],
) -> str:
    bull_text = (
        ", ".join(c.ticker for c in bullish[:3]) if bullish else "no clear bullish candidates"
    )
    bear_text = (
        ", ".join(c.ticker for c in bearish[:3]) if bearish else "no clear bearish candidates"
    )
    alert_text = (
        f"{len(alerts)} risk alert(s) should be reviewed"
        if alerts
        else "risk alerts are limited in this scan"
    )
    return (
        "The scan compares public price movement, public headlines, recent "
        "filing metadata, and built-in strategy-pack output across the default "
        "US stock universe. Bullish strength is most visible in "
        f"{bull_text}, where price and catalyst signals are more aligned. "
        f"Downside risk is more visible in {bear_text}, where weak momentum, "
        "headline pressure, or volatility reduce confidence. The overall view "
        f"should remain decision-support only: {alert_text}, and any candidate "
        "can change as new public data, filings, and headlines arrive."
    )

