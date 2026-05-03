"""Market data facade used by Starter and Pro scan flows."""
from __future__ import annotations

from app.providers.data import price


def get_price_snapshot(ticker: str):
    return price.fetch_price_snapshot(ticker)


def get_history(ticker: str, period: str = "6mo"):
    return price.fetch_history(ticker, period=period)


def source_label(source: str) -> str:
    return "yfinance" if source == "yfinance" else "demo fallback"

