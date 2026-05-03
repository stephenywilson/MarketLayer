"""OpenAI-compatible Chat Completions provider.

Works with OpenAI, Together, Groq, DeepInfra, Fireworks, and any
endpoint exposing the `/chat/completions` shape.

V0.1: requests are wired but parsing of the model output into the
strict ResearchReport schema is intentionally minimal — we fall back to
the deterministic mock when JSON parsing fails so the demo never breaks.
"""
from __future__ import annotations

import json
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


def _safe_json_load(text: str) -> Dict[str, Any] | None:
    try:
        start = text.find("{")
        end = text.rfind("}")
        if start == -1 or end == -1:
            return None
        return json.loads(text[start : end + 1])
    except Exception:
        return None


class OpenAICompatibleProvider(AIProvider):
    id = "openai"
    display_name = "OpenAI-compatible"
    description = (
        "Any /chat/completions-compatible endpoint (OpenAI, Together, "
        "Groq, DeepInfra, Fireworks, etc.)."
    )
    requires_api_key = True
    env_keys: List[str] = ["OPENAI_API_KEY", "OPENAI_BASE_URL", "OPENAI_MODEL"]

    def is_configured(self) -> bool:
        return bool(self.settings.openai_api_key.strip())

    def _chat(self, system: str, user: str) -> str | None:
        if not self.is_configured():
            return None
        url = f"{self.settings.openai_base_url.rstrip('/')}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.settings.openai_api_key}",
            "Content-Type": "application/json",
        }
        body = {
            "model": self.settings.openai_model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.2,
        }
        try:
            with httpx.Client(timeout=60.0) as client:
                resp = client.post(url, json=body, headers=headers)
                resp.raise_for_status()
                data = resp.json()
                return data["choices"][0]["message"]["content"]
        except Exception:
            return None

    def analyze_market_event(self, payload: MarketEventInput) -> EventAnalysis:
        from app.research.prompts import EVENT_SYSTEM_PROMPT, event_user_prompt

        text = self._chat(
            EVENT_SYSTEM_PROMPT,
            event_user_prompt(payload.ticker, payload.event_text),
        )
        parsed = _safe_json_load(text or "")
        if parsed:
            parsed["ticker"] = payload.ticker.upper()
            parsed["event_text"] = payload.event_text
            parsed["provider_used"] = self.id
            try:
                return EventAnalysis(**parsed)
            except Exception:
                pass
        result = MockProvider(self.settings).analyze_market_event(payload)
        result.provider_used = self.id
        return result

    def generate_research_report(
        self, payload: ResearchReportInput
    ) -> ResearchReport:
        from app.research.prompts import REPORT_SYSTEM_PROMPT, report_user_prompt

        text = self._chat(
            REPORT_SYSTEM_PROMPT,
            report_user_prompt(payload),
        )
        parsed = _safe_json_load(text or "")
        if parsed:
            parsed["ticker"] = payload.ticker.upper()
            parsed["provider_used"] = self.id
            try:
                return ResearchReport(**parsed)
            except Exception:
                pass
        result = MockProvider(self.settings).generate_research_report(payload)
        result.provider_used = self.id
        return result

    def score_risk(self, payload: RiskScoringInput) -> RiskScore:
        result = MockProvider(self.settings).score_risk(payload)
        result.provider_used = self.id
        return result
