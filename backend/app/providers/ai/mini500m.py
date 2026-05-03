"""Catalayer AI Mini 500M — placeholder provider.

This is a forward-looking integration point for a planned local
~500M-parameter model designed for:
  * market event classification
  * report drafting
  * risk explanation
  * fully local-first research workflows

V0.1 ships with a placeholder that proxies to the deterministic mock
so the project remains fully runnable. No model weights, training data,
or proprietary internal Catalayer logic are bundled.

TODO(mini500m): wire to a local inference runtime (llama.cpp / mlx /
                transformers) once weights are public.
TODO(mini500m): expose a structured event-classification head.
TODO(mini500m): add streaming generation for report drafting.
"""
from __future__ import annotations

from typing import List

from app.models.research import EventAnalysis, ResearchReport, RiskScore

from .base import (
    AIProvider,
    MarketEventInput,
    ResearchReportInput,
    RiskScoringInput,
)
from .mock import MockProvider


class Mini500MProvider(AIProvider):
    id = "mini500m"
    display_name = "Catalayer AI Mini 500M (planned)"
    description = (
        "Planned local ~500M-parameter model for event classification, "
        "report drafting, and risk explanation. Placeholder until weights "
        "are released."
    )
    requires_api_key = False
    is_local = True
    is_placeholder = True
    env_keys: List[str] = ["MINI500M_MODEL_PATH"]

    def is_configured(self) -> bool:
        return False

    def analyze_market_event(self, payload: MarketEventInput) -> EventAnalysis:
        result = MockProvider(self.settings).analyze_market_event(payload)
        result.provider_used = self.id
        return result

    def generate_research_report(
        self, payload: ResearchReportInput
    ) -> ResearchReport:
        result = MockProvider(self.settings).generate_research_report(payload)
        result.provider_used = self.id
        return result

    def score_risk(self, payload: RiskScoringInput) -> RiskScore:
        result = MockProvider(self.settings).score_risk(payload)
        result.provider_used = self.id
        return result
