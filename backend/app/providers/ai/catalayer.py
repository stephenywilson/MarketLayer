"""Catalayer AI provider — generic HTTP wrapper.

This is a clean public wrapper. It intentionally contains no proprietary
Catalayer prompts, rubrics, datasets, or scoring logic. It posts the
research/event payload to a Catalayer-compatible endpoint and falls back
to mock output when not configured or on error, so the project stays
runnable without a Catalayer account.
"""
from __future__ import annotations

from typing import Any, Dict, List

import httpx

from app.models.research import EventAnalysis, ResearchReport, RiskScore

from .base import (
    AIProvider,
    MarketEventInput,
    ResearchReportInput,
    RiskScoringInput,
)
from .mock import MockProvider


class CatalayerProvider(AIProvider):
    id = "catalayer"
    display_name = "Catalayer AI"
    description = (
        "Catalayer AI cloud provider. One of several supported providers — "
        "MarketLayer is provider-agnostic and never requires Catalayer."
    )
    requires_api_key = True
    env_keys: List[str] = ["CATALAYER_API_KEY", "CATALAYER_API_BASE_URL"]

    def is_configured(self) -> bool:
        return bool(self.settings.catalayer_api_key.strip())

    def _post(self, path: str, body: Dict[str, Any]) -> Dict[str, Any] | None:
        if not self.is_configured():
            return None
        url = f"{self.settings.catalayer_api_base_url.rstrip('/')}{path}"
        headers = {
            "Authorization": f"Bearer {self.settings.catalayer_api_key}",
            "Content-Type": "application/json",
        }
        try:
            with httpx.Client(timeout=30.0) as client:
                resp = client.post(url, json=body, headers=headers)
                resp.raise_for_status()
                return resp.json()
        except Exception:
            return None

    def analyze_market_event(self, payload: MarketEventInput) -> EventAnalysis:
        data = self._post(
            "/v1/marketlayer/events",
            {"ticker": payload.ticker, "event_text": payload.event_text},
        )
        if data:
            data.setdefault("provider_used", self.id)
            return EventAnalysis(**data)
        result = MockProvider(self.settings).analyze_market_event(payload)
        result.provider_used = self.id
        return result

    def generate_research_report(
        self, payload: ResearchReportInput
    ) -> ResearchReport:
        data = self._post(
            "/v1/marketlayer/reports",
            {
                "ticker": payload.ticker,
                "company_name": payload.company_name,
                "company_overview": payload.company_overview,
                "price_summary": payload.price_summary,
                "news_text": payload.news_text,
                "filings_summary": payload.filings_summary,
            },
        )
        if data:
            data.setdefault("provider_used", self.id)
            return ResearchReport(**data)
        result = MockProvider(self.settings).generate_research_report(payload)
        result.provider_used = self.id
        return result

    def score_risk(self, payload: RiskScoringInput) -> RiskScore:
        data = self._post(
            "/v1/marketlayer/risk",
            {
                "ticker": payload.ticker,
                "catalysts": payload.catalysts,
                "news_text": payload.news_text,
            },
        )
        if data:
            data.setdefault("provider_used", self.id)
            return RiskScore(**data)
        result = MockProvider(self.settings).score_risk(payload)
        result.provider_used = self.id
        return result
