"""Deterministic mock provider — works without any API keys.

Returns realistic but clearly synthetic output so MarketLayer can be
demoed and developed against immediately after `git clone`.
"""
from __future__ import annotations

from typing import List

from app.models.research import (
    EventAnalysis,
    FilingHighlight,
    KeyCatalyst,
    ResearchReport,
    RiskScore,
)

from .base import (
    AIProvider,
    MarketEventInput,
    ResearchReportInput,
    RiskScoringInput,
)

_COMPANY_TABLE = {
    "AAPL": ("Apple Inc.", "Consumer electronics, services, and silicon."),
    "MSFT": ("Microsoft Corporation", "Cloud, productivity software, and AI infrastructure."),
    "NVDA": ("NVIDIA Corporation", "Accelerated computing platforms and AI GPUs."),
    "TSLA": ("Tesla, Inc.", "Electric vehicles, energy storage, and autonomy."),
    "AMD": ("Advanced Micro Devices, Inc.", "x86 CPUs, GPUs, and adaptive computing."),
    "META": ("Meta Platforms, Inc.", "Social platforms, advertising, and AI research."),
    "GOOGL": ("Alphabet Inc.", "Search, advertising, cloud, and AI."),
    "AMZN": ("Amazon.com, Inc.", "E-commerce, AWS cloud, and logistics."),
}


def _seed_score(ticker: str, salt: int) -> int:
    base = sum(ord(c) for c in ticker.upper()) + salt
    return 35 + (base % 55)


def _impact_for(ticker: str) -> str:
    bucket = sum(ord(c) for c in ticker.upper()) % 4
    return ["positive", "mixed", "neutral", "negative"][bucket]


def _company_for(ticker: str) -> tuple[str, str]:
    return _COMPANY_TABLE.get(
        ticker.upper(),
        (
            f"{ticker.upper()} (sample profile)",
            "Synthetic mock company profile generated for demo purposes.",
        ),
    )


class MockProvider(AIProvider):
    id = "mock"
    display_name = "Mock"
    description = (
        "Deterministic synthetic provider. No API keys required — ideal "
        "for local development, CI, and screenshots."
    )
    requires_api_key = False
    is_local = True
    env_keys: List[str] = []

    def is_configured(self) -> bool:
        return True

    def analyze_market_event(self, payload: MarketEventInput) -> EventAnalysis:
        impact = _impact_for(payload.ticker)
        return EventAnalysis(
            ticker=payload.ticker.upper(),
            event_text=payload.event_text,
            classification="product_announcement",
            impact=impact,  # type: ignore[arg-type]
            short_term_view=(
                "Mock near-term view: market participants are likely to "
                "reprice expectations based on the disclosed event."
            ),
            medium_term_view=(
                "Mock medium-term view: durable impact depends on execution, "
                "competitive response, and macro liquidity conditions."
            ),
            risk_factors=[
                "Execution risk on stated guidance",
                "Competitive response from peers",
                "Sector multiple compression risk",
            ],
            market_impact_score=_seed_score(payload.ticker, 11),
            confidence_score=_seed_score(payload.ticker, 23),
            provider_used=self.id,
        )

    def generate_research_report(
        self, payload: ResearchReportInput
    ) -> ResearchReport:
        ticker = payload.ticker.upper()
        company_name, overview = _company_for(ticker)
        impact = _impact_for(ticker)

        catalysts = [
            KeyCatalyst(
                title="Quarterly earnings cadence",
                description=(
                    "Upcoming earnings will refresh the market's view on "
                    "revenue mix and operating leverage."
                ),
                impact=impact,  # type: ignore[arg-type]
            ),
            KeyCatalyst(
                title="Sector rotation flow",
                description=(
                    "Recent flows show rotation into AI-adjacent equities, "
                    "which historically correlates with multiple expansion."
                ),
                impact="mixed",
            ),
            KeyCatalyst(
                title="Macro liquidity backdrop",
                description=(
                    "Front-end rates and dollar liquidity remain the dominant "
                    "drivers of risk-asset multiples."
                ),
                impact="neutral",
            ),
        ]

        filings = [
            FilingHighlight(
                form="10-Q",
                filed_at="2025-Q3",
                summary=(
                    "Mock 10-Q highlight: management reiterated full-year "
                    "guidance and flagged FX headwinds in international "
                    "segments."
                ),
            ),
            FilingHighlight(
                form="8-K",
                filed_at="2025-09",
                summary=(
                    "Mock 8-K highlight: routine governance disclosure with "
                    "no material change to strategy."
                ),
            ),
        ]

        news_text = (payload.news_text or "").strip()
        news_summary = (
            f"User-provided event summary: {news_text[:300]}"
            if news_text
            else "No user-provided news; using synthetic baseline narrative."
        )

        return ResearchReport(
            ticker=ticker,
            company_name=company_name,
            company_overview=overview,
            latest_market_movement=payload.price_summary
            or "Mock price summary: shares trading within recent range.",
            key_catalysts=catalysts,
            sec_filing_highlights=filings,
            news_event_summary=news_summary,
            bull_case=[
                "Durable franchise with structural demand tailwinds",
                "Operating leverage as scale compounds",
                "Optionality from emerging product lines",
            ],
            bear_case=[
                "Multiple compression if rates stay restrictive",
                "Competitive intensity in core segments",
                "Concentration risk in top customers",
            ],
            risk_factors=[
                "Macro / rates regime change",
                "Regulatory or geopolitical shock",
                "Execution slippage on guidance",
            ],
            market_impact_score=_seed_score(ticker, 7),
            confidence_score=_seed_score(ticker, 19),
            watchlist_triggers=[
                "Daily volume > 1.5x 30-day average",
                "Price break of 50-day moving average with confirmation",
                "Sector ETF flow reversal",
            ],
            final_summary=(
                f"Mock research summary for {ticker}: balanced setup with "
                "asymmetric upside conditional on continued execution."
            ),
            provider_used=self.id,
        )

    def score_risk(self, payload: RiskScoringInput) -> RiskScore:
        score = _seed_score(payload.ticker, 41)
        if score < 35:
            level = "low"
        elif score < 55:
            level = "moderate"
        elif score < 75:
            level = "elevated"
        else:
            level = "high"
        return RiskScore(
            ticker=payload.ticker.upper(),
            score=score,
            level=level,  # type: ignore[arg-type]
            drivers=[
                "Synthetic mock driver: macro regime",
                "Synthetic mock driver: positioning",
                "Synthetic mock driver: catalyst density",
            ],
            provider_used=self.id,
        )
