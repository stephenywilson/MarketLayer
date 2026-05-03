"""Asset Lab orchestrator (formerly Ticker Workbench).

Runs the full MarketLayer decision pipeline for one ticker:

  DATA → STRATEGY → BACKTEST → SIGNALS → RISK GATE → AI BRIEF

Uses real connectors (yfinance / SEC EDGAR / Yahoo RSS) and a real
per-ticker backtest snapshot via the engine. Mock AI provider output is
overlaid with real SEC filings and live news headlines.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from app.models.console import (
    AssetSnapshot,
    BacktestSnapshotMini,
    PriceAction,
    WorkbenchResult,
)
from app.models.research import FilingHighlight
from app.providers.data import news as news_conn
from app.providers.data import price as price_conn
from app.providers.data import sec as sec_conn
from app.services import (
    backtest_engine,
    decision_brief,
    risk_gate,
    signal_engine,
    strategy_lab,
)
from app.services.research_service import generate_research_report


def _now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _price_action(ticker: str, snap) -> PriceAction:
    rs = (
        "real-time yfinance"
        if snap.source == "yfinance"
        else "fallback baseline"
    )
    range_str = (
        f"{snap.range_30d_low:.2f} – {snap.range_30d_high:.2f}"
        if snap.range_30d_low is not None and snap.range_30d_high is not None
        else "n/a"
    )
    return PriceAction(
        ticker=ticker.upper(),
        last_price=snap.last_price,
        change_pct_1d=snap.change_pct_1d,
        range_30d=range_str,
        relative_strength=rs,
        note=snap.trend_summary,
    )


def _asset_snapshot(ticker: str, snap, bars) -> AssetSnapshot:
    last_volume = float(bars[-1].volume) if bars else 0.0
    freshness = (
        "live"
        if snap.source == "yfinance"
        else "fallback"
    )
    return AssetSnapshot(
        ticker=ticker.upper(),
        last_price=snap.last_price,
        change_pct_1d=snap.change_pct_1d,
        volume=last_volume,
        data_source=snap.source,
        as_of=snap.as_of,
        freshness=freshness,
    )


def _mini_backtest(ticker: str, strategy_id: Optional[str]) -> Optional[BacktestSnapshotMini]:
    sid = strategy_id or "momentum"
    try:
        s = backtest_engine.per_ticker_snapshot(
            ticker=ticker,
            strategy_id=sid,
            period="1y",
            forward_window_days=5,
        )
    except Exception:
        return None
    return BacktestSnapshotMini(
        strategy_id=s["strategy_id"],
        period=s["period"],
        signal_count=s["signal_count"],
        hit_rate_pct=s["hit_rate_pct"],
        avg_forward_return_pct=s["avg_forward_return_pct"],
        max_drawdown_pct=s["max_drawdown_pct"],
    )


def run(
    ticker: str,
    news_text: Optional[str],
    strategy_id: Optional[str] = None,
) -> WorkbenchResult:
    ticker_u = ticker.upper()

    # 1) Real data connectors first
    snap = price_conn.fetch_price_snapshot(ticker_u)
    bars = price_conn.fetch_history(ticker_u, period="3mo")
    facts = sec_conn.fetch_company_facts(ticker_u)
    news_items = news_conn.collect_news(ticker_u, news_text, limit=6)

    # 2) Generate AI report (uses connector context)
    report = generate_research_report(ticker_u, news_text)

    # 3) Overlay real SEC filings + live news + real company name
    if facts.source == "sec_edgar":
        report.company_name = facts.name
        report.company_overview = facts.overview
        report.sec_filing_highlights = [
            FilingHighlight(
                form=f.form,
                filed_at=f.filed_at,
                summary=f.summary,
            )
            for f in facts.filings[:8]
        ]
    if news_items:
        head = news_items[0].headline
        report.news_event_summary = (
            f"Latest headline ({news_items[0].source}): {head}"
            if not (news_text and news_text.strip())
            else f"User event: {news_text.strip()[:200]}\n"
            f"Latest live headline: {head}"
        )

    # 4) Strategy/signals/gate/brief
    signals = signal_engine.signals_for_ticker(ticker_u, limit=4)
    fit = strategy_lab.fit_for_ticker(ticker_u)
    gate = risk_gate.run_for_ticker(
        ticker_u, ai_confidence=report.confidence_score
    )
    brief = decision_brief.build(report, signals, gate)

    # 5) Per-ticker backtest snapshot (uses real OHLCV)
    bt_mini = _mini_backtest(ticker_u, strategy_id)

    return WorkbenchResult(
        ticker=ticker_u,
        asset_snapshot=_asset_snapshot(ticker_u, snap, bars),
        price_action=_price_action(ticker_u, snap),
        catalysts=report.key_catalysts,
        active_signals=signals,
        strategy_fit=fit,
        backtest_snapshot=bt_mini,
        risk_gate=gate,
        ai_brief=brief,
        research_report=report,
        provider_used=report.provider_used,
    )
