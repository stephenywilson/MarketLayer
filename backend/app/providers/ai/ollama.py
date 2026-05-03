"""Ollama provider — local model served at http://localhost:11434."""
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


class OllamaProvider(AIProvider):
    id = "ollama"
    display_name = "Ollama (local)"
    description = "Local Ollama server. Fully offline — no cloud calls."
    requires_api_key = False
    is_local = True
    env_keys: List[str] = ["OLLAMA_BASE_URL", "OLLAMA_MODEL"]

    def is_configured(self) -> bool:
        return True

    def _chat(self, system: str, user: str) -> str | None:
        url = f"{self.settings.ollama_base_url.rstrip('/')}/api/chat"
        body = {
            "model": self.settings.ollama_model,
            "stream": False,
            "format": "json",
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
        }
        try:
            with httpx.Client(timeout=120.0) as client:
                resp = client.post(url, json=body)
                resp.raise_for_status()
                data = resp.json()
                return data.get("message", {}).get("content")
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

        text = self._chat(REPORT_SYSTEM_PROMPT, report_user_prompt(payload))
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
