"""Data Lake status — exposes which real data sources are live."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import List

from app.models.console import DataLakeStatus, DataSourceStatus
from app.providers.data import news as news_conn
from app.providers.data import price as price_conn
from app.providers.data import sec as sec_conn


def _now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def status() -> DataLakeStatus:
    sec_live = sec_conn.is_live()
    sources: List[DataSourceStatus] = [
        DataSourceStatus(
            id="yfinance",
            name="Yahoo Finance (yfinance)",
            kind="price",
            live=price_conn.is_live(),
            cached_keys=len(price_conn._CACHE),  # noqa: SLF001
            note=(
                "Daily OHLCV for US equities. Cached 5 minutes per "
                "(ticker, period)."
            ),
            requires_api_key=False,
            homepage="https://github.com/ranaroussi/yfinance",
        ),
        DataSourceStatus(
            id="sec_edgar",
            name="SEC EDGAR (data.sec.gov)",
            kind="filings",
            live=sec_live,
            cached_keys=len(sec_conn._FACTS_CACHE),  # noqa: SLF001
            note=(
                "Company submissions index + recent filings (10-K, "
                "10-Q, 8-K, ...). Cached 1 hour per ticker."
            ),
            requires_api_key=False,
            homepage="https://www.sec.gov/edgar",
        ),
        DataSourceStatus(
            id="yahoo_rss",
            name="Yahoo Finance RSS",
            kind="news",
            live=news_conn.is_live(),
            cached_keys=len(news_conn._CACHE),  # noqa: SLF001
            note=(
                "Per-ticker headline feed. No API key. Cached 5 "
                "minutes per ticker."
            ),
            requires_api_key=False,
            homepage="https://finance.yahoo.com",
        ),
    ]
    return DataLakeStatus(
        sources=sources,
        cache_ttl_sec={"yfinance": 300, "sec_edgar": 3600, "yahoo_rss": 300},
        last_check=_now_iso(),
    )
