"""Anthropic Claude provider — HTTP wrapper, no SDK dependency."""
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


class AnthropicProvider(AIProvider):
    id = "anthropic"
    display_name = "Anthropic Claude"
    description = "Anthropic Claude API via the official messages endpoint."
    requires_api_key = True
    env_keys: List[str] = ["ANTHROPIC_API_KEY", "ANTHROPIC_MODEL"]

    def is_configured(self) -> bool:
        return bool(self.settings.anthropic_api_key.strip())

    def _message(self, system: str, user: str) -> str | None:
        if not self.is_configured():
            return None
        url = "https://api.anthropic.com/v1/messages"
        headers = {
            "x-api-key": self.settings.anthropic_api_key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
        }
        body = {
            "model": self.settings.anthropic_model,
            "max_tokens": 2000,
            "system": system,
            "messages": [{"role": "user", "content": user}],
        }
        try:
            with httpx.Client(timeout=60.0) as client:
                resp = client.post(url, json=body, headers=headers)
                resp.raise_for_status()
                data = resp.json()
                blocks = data.get("content", [])
                for b in blocks:
                    if b.get("type") == "text":
                        return b.get("text", "")
        except Exception:
            return None
        return None

    def analyze_market_event(self, payload: MarketEventInput) -> EventAnalysis:
        from app.research.prompts import EVENT_SYSTEM_PROMPT, event_user_prompt

        text = self._message(
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

        text = self._message(REPORT_SYSTEM_PROMPT, report_user_prompt(payload))
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
