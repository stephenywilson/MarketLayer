"""Base AI provider interface."""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List

from app.config import Settings
from app.models.research import EventAnalysis, ResearchReport, RiskScore


@dataclass
class MarketEventInput:
    ticker: str
    event_text: str


@dataclass
class ResearchReportInput:
    ticker: str
    company_name: str
    company_overview: str
    price_summary: str
    news_text: str
    filings_summary: str


@dataclass
class RiskScoringInput:
    ticker: str
    catalysts: List[str]
    news_text: str


@dataclass
class ProviderMeta:
    id: str
    name: str
    description: str
    requires_api_key: bool
    configured: bool
    env_keys: List[str]
    is_local: bool = False
    is_placeholder: bool = False


class AIProvider(ABC):
    """Abstract AI provider used by MarketLayer's research pipeline."""

    id: str = "base"
    display_name: str = "Base"
    description: str = "Abstract provider"
    requires_api_key: bool = False
    is_local: bool = False
    is_placeholder: bool = False
    env_keys: List[str] = []

    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    @abstractmethod
    def analyze_market_event(self, payload: MarketEventInput) -> EventAnalysis: ...

    @abstractmethod
    def generate_research_report(
        self, payload: ResearchReportInput
    ) -> ResearchReport: ...

    @abstractmethod
    def score_risk(self, payload: RiskScoringInput) -> RiskScore: ...

    def is_configured(self) -> bool:
        if not self.requires_api_key:
            return True
        return False

    def meta(self) -> ProviderMeta:
        return ProviderMeta(
            id=self.id,
            name=self.display_name,
            description=self.description,
            requires_api_key=self.requires_api_key,
            configured=self.is_configured(),
            env_keys=self.env_keys,
            is_local=self.is_local,
            is_placeholder=self.is_placeholder,
        )
