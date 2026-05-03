"""Orchestration layer: data connectors + AI provider -> structured report."""
from __future__ import annotations

from typing import Optional

from app.config import get_settings
from app.models.research import EventAnalysis, ResearchReport
from app.providers.ai import get_provider
from app.providers.ai.base import MarketEventInput
from app.research.report_builder import build_report_input


def generate_research_report(
    ticker: str, news_text: Optional[str]
) -> ResearchReport:
    payload = build_report_input(ticker, news_text)
    provider = get_provider(get_settings())
    return provider.generate_research_report(payload)


def analyze_event(ticker: str, event_text: str) -> EventAnalysis:
    provider = get_provider(get_settings())
    return provider.analyze_market_event(
        MarketEventInput(ticker=ticker.upper(), event_text=event_text)
    )
