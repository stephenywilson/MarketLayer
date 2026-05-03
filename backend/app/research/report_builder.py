"""Compose data-connector outputs into the prompt input the AI provider expects."""
from __future__ import annotations

from typing import Optional

from app.providers.ai.base import ResearchReportInput
from app.providers.data import news as news_conn
from app.providers.data import price as price_conn
from app.providers.data import sec as sec_conn


def build_report_input(ticker: str, news_text: Optional[str]) -> ResearchReportInput:
    facts = sec_conn.fetch_company_facts(ticker)
    snap = price_conn.fetch_price_snapshot(ticker)
    items = news_conn.collect_news(ticker, news_text)

    return ResearchReportInput(
        ticker=ticker.upper(),
        company_name=facts.name,
        company_overview=facts.overview,
        price_summary=price_conn.price_summary(snap),
        news_text=news_conn.summarize(items),
        filings_summary=sec_conn.filings_summary(facts),
    )
