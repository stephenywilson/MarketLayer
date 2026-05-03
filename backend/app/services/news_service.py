"""News facade for public RSS headlines and future enhanced providers."""
from __future__ import annotations

from typing import List

from app.providers.data import news

POSITIVE_TERMS = (
    "beat",
    "growth",
    "record",
    "raise",
    "upgrade",
    "strong",
    "surge",
    "ai",
    "cloud",
    "launch",
)
NEGATIVE_TERMS = (
    "miss",
    "cut",
    "downgrade",
    "probe",
    "lawsuit",
    "weak",
    "delay",
    "fall",
    "slump",
    "recall",
)


def get_headlines(ticker: str, enabled: bool = True) -> List[news.NewsItem]:
    if not enabled:
        return []
    return news.collect_news(ticker, None, limit=5)


def classify_headline(text: str) -> str:
    lower = text.lower()
    pos = sum(1 for term in POSITIVE_TERMS if term in lower)
    neg = sum(1 for term in NEGATIVE_TERMS if term in lower)
    if pos > neg:
        return "positive"
    if neg > pos:
        return "negative"
    if pos and neg:
        return "mixed"
    return "neutral"


def display_source(source: str) -> str:
    if source == "yahoo_rss":
        return "Yahoo Finance RSS"
    if source == "baseline":
        return "Demo data"
    if source == "user_input":
        return "User input"
    return source

