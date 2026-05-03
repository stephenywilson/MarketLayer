"""Google Gemini provider — generativelanguage.googleapis.com REST."""
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


class GeminiProvider(AIProvider):
    id = "gemini"
    display_name = "Google Gemini"
    description = "Google Gemini via the public Generative Language REST API."
    requires_api_key = True
    env_keys: List[str] = ["GEMINI_API_KEY", "GEMINI_MODEL"]

    def is_configured(self) -> bool:
        return bool(self.settings.gemini_api_key.strip())

    def _generate(self, system: str, user: str) -> str | None:
        if not self.is_configured():
            return None
        model = self.settings.gemini_model
        url = (
            "https://generativelanguage.googleapis.com/v1beta/"
            f"models/{model}:generateContent?key={self.settings.gemini_api_key}"
        )
        body = {
            "system_instruction": {"parts": [{"text": system}]},
            "contents": [{"role": "user", "parts": [{"text": user}]}],
            "generationConfig": {"response_mime_type": "application/json"},
        }
        try:
            with httpx.Client(timeout=60.0) as client:
                resp = client.post(url, json=body)
                resp.raise_for_status()
                data = resp.json()
                cands = data.get("candidates", [])
                if not cands:
                    return None
                parts = cands[0].get("content", {}).get("parts", [])
                for p in parts:
                    if "text" in p:
                        return p["text"]
        except Exception:
            return None
        return None

    def analyze_market_event(self, payload: MarketEventInput) -> EventAnalysis:
        from app.research.prompts import EVENT_SYSTEM_PROMPT, event_user_prompt

        text = self._generate(
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

        text = self._generate(REPORT_SYSTEM_PROMPT, report_user_prompt(payload))
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
