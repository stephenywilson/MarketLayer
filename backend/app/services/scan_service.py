"""One-click market scan service shared by Starter and Pro modes."""
from __future__ import annotations

import json
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from typing import Dict, List, Optional

# US ticker symbols: 1–5 uppercase letters, optionally followed by .A/.B etc.
_TICKER_RE = re.compile(r"^[A-Z]{1,5}(\.[A-Z]{1,2})?$")

from fastapi import HTTPException

from app.config import get_settings
from app.models.market_scan import (
    BearishCandidate,
    BullishCandidate,
    CandidateDetails,
    DataUsed,
    DEFAULT_STARTER_UNIVERSE,
    GeneratedWatchlistItem,
    MarketReport,
    MarketScanRequest,
    NeutralCandidate,
    NewsCatalyst,
    StarterResultSummary,
)
from app.services import (
    filing_service,
    market_data_service,
    news_service,
    report_service,
    risk_filter_service,
    scoring_service,
    strategy_pack_service,
)

_REPORTS: Dict[str, MarketReport] = {}
_REPORT_ORDER: List[str] = []


def _now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _scan_id(mode: str) -> str:
    return f"{mode}-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"


def _ticker_list(req: MarketScanRequest, mode: str = "starter") -> List[str]:
    raw = req.universe or DEFAULT_STARTER_UNIVERSE
    out: List[str] = []
    for t in raw:
        clean = t.strip().upper()
        if clean and clean not in out and _TICKER_RE.match(clean):
            out.append(clean)
    limit = 8 if mode == "starter" else 40
    return out[:limit]


def _fetch_ticker(ticker: str, req: MarketScanRequest) -> dict:
    """Fetch all data for one ticker — runs concurrently in a thread pool."""
    snap = market_data_service.get_price_snapshot(ticker)
    facts = filing_service.get_company_facts(ticker, req.include_filings)
    headlines = news_service.get_headlines(ticker, req.include_news)
    return {"ticker": ticker, "snap": snap, "facts": facts, "headlines": headlines}


def _safe_json(text: str) -> dict | None:
    try:
        s = text.find("{")
        e = text.rfind("}") + 1
        if s == -1 or e == 0:
            return None
        return json.loads(text[s:e])
    except Exception:
        return None


def _ai_enrich(
    provider,
    ticker_data: list[dict],
    catalysts: List[NewsCatalyst],
) -> tuple[dict[str, str], str]:
    """Send ONE AI request with all scored tickers and return per-ticker reasons + market brief.

    Raises:
        HTTPException 503 if the AI call fails or cannot be parsed.
    """
    if not hasattr(provider, "_chat"):
        raise HTTPException(
            status_code=503,
            detail=(
                "The configured AI provider does not support chat completions. "
                "Please configure Ollama, OpenAI, Claude, or Gemini in Settings."
            ),
        )

    # Build candidate summary lines.
    candidate_lines = []
    for t in ticker_data:
        candidate_lines.append(
            f"- {t['ticker']} ({t['company']}): direction={t['direction']}, "
            f"bullish_score={t['bullish_score']}, bearish_score={t['bearish_score']}, "
            f"confidence={t['confidence']}, "
            f"price_1d={t['price_change']:+.2f}%, "
            f"positive_headlines={t['positive_news']}, "
            f"negative_headlines={t['negative_news']}"
        )

    # Build news catalyst lines (top 8).
    news_lines = [
        f"- {c.ticker}: \"{c.headline}\" (impact: {c.ai_impact})"
        for c in catalysts[:8]
    ]

    system_prompt = (
        "You are MarketLayer, an open-source AI market research assistant. "
        "Explain market scan results in plain, factual English for retail investors. "
        "You are NOT a financial advisor — frame everything as research support, "
        "never as investment advice. "
        "Return ONLY valid JSON, no markdown, no extra text:\n"
        "{\n"
        '  "reasons": {\n'
        '    "<TICKER>": "<1-2 sentence factual explanation why this ticker scored bullish/bearish, '
        'referencing price movement and news where available>",\n'
        '    ...\n'
        "  },\n"
        '  "brief": "<2-3 sentence plain-English market summary across all candidates>"\n'
        "}"
    )

    user_prompt = (
        "Market scan results:\n"
        + "\n".join(candidate_lines)
        + "\n\nRecent news catalysts:\n"
        + ("\n".join(news_lines) if news_lines else "No news catalysts available.")
        + "\n\nGenerate the JSON now."
    )

    raw = provider._chat(system_prompt, user_prompt)  # type: ignore[attr-defined]

    if not raw:
        raise HTTPException(
            status_code=503,
            detail=(
                "AI provider returned no response. "
                "Check that Ollama is running and the model is loaded "
                "(run `ollama list` to verify)."
            ),
        )

    parsed = _safe_json(raw)
    if not parsed or "reasons" not in parsed:
        raise HTTPException(
            status_code=503,
            detail=(
                f"AI response could not be parsed into the expected format. "
                f"Raw response (first 300 chars): {raw[:300]}"
            ),
        )

    reasons: dict[str, str] = {k.upper(): v for k, v in parsed.get("reasons", {}).items()}
    brief: str = parsed.get("brief", "")
    return reasons, brief


def run_market_scan(req: Optional[MarketScanRequest] = None, mode: str = "starter") -> MarketReport:
    req = req or MarketScanRequest()
    settings = get_settings()

    # ── Resolve the effective AI provider (runtime_config beats .env) ──
    from app import runtime_config
    from app.providers.ai import get_provider
    from app.providers.ai.mock import MockProvider

    overrides = runtime_config.get()
    effective_provider_id = (
        req.provider
        or overrides.get("provider")
        or settings.ai_provider
        or "mock"
    ).lower()

    if effective_provider_id == "mock":
        raise HTTPException(
            status_code=422,
            detail=(
                "No AI provider is configured. "
                "Open Settings → AI Provider and select Ollama, OpenAI, Claude, "
                "Gemini, or Catalayer AI, then click Save."
            ),
        )

    provider_instance = get_provider()  # applies runtime_config overrides

    if isinstance(provider_instance, MockProvider):
        raise HTTPException(
            status_code=422,
            detail=(
                "AI provider resolved to Demo/Mock mode. "
                "Open Settings → AI Provider and select a real provider, "
                "then click Save."
            ),
        )

    generated_at = _now_iso()
    universe = _ticker_list(req, mode)

    # ── Parallel data collection (prices, news, filings fetched concurrently) ──
    ticker_data: list[dict] = []
    bullish: List[BullishCandidate] = []
    bearish: List[BearishCandidate] = []
    neutral: List[NeutralCandidate] = []
    catalysts: List[NewsCatalyst] = []
    alerts = []
    price_sources: set[str] = set()
    news_sources: set[str] = set()
    filing_sources: set[str] = set()

    # Fetch all tickers in parallel (I/O-bound: network requests run concurrently).
    fetched: dict[str, dict] = {}
    with ThreadPoolExecutor(max_workers=min(len(universe), 8)) as pool:
        futures = {pool.submit(_fetch_ticker, t, req): t for t in universe}
        for fut in as_completed(futures):
            result = fut.result()
            fetched[result["ticker"]] = result

    for ticker in universe:
        raw = fetched[ticker]
        snap = raw["snap"]
        facts = raw["facts"]
        headlines = raw["headlines"]
        impacts = [news_service.classify_headline(f"{h.headline} {h.body}") for h in headlines]
        primary_impact = impacts[0] if impacts else "neutral"
        strategy_results = strategy_pack_service.run_for_ticker(
            ticker, snap.change_pct_1d, primary_impact
        )
        score = scoring_service.score_candidate(
            ticker, snap.change_pct_1d, impacts, strategy_results
        )
        negative_count = impacts.count("negative")
        positive_count = impacts.count("positive")
        candidate_risk = risk_filter_service.risk_level(
            max(score.bullish_score, score.bearish_score),
            snap.change_pct_1d,
            negative_count,
            snap.source,
        )
        ticker_alerts = risk_filter_service.alerts_for(
            ticker, snap.change_pct_1d, negative_count, snap.source
        )
        alerts.extend(ticker_alerts)

        price_sources.add(market_data_service.source_label(snap.source))
        news_sources.update(news_service.display_source(h.source) for h in headlines)
        filing_sources.add(filing_service.source_label(facts.source))

        for h, impact in zip(headlines[:2], impacts[:2]):
            related = (
                "bullish" if impact == "positive"
                else "bearish" if impact == "negative"
                else "neutral"
            )
            catalysts.append(
                NewsCatalyst(
                    ticker=ticker,
                    headline=h.headline,
                    source=news_service.display_source(h.source),
                    timestamp=h.published_at or generated_at,
                    ai_impact=impact,  # type: ignore[arg-type]
                    related_direction=related,  # type: ignore[arg-type]
                )
            )

        # Store raw data for the AI call below.
        ticker_data.append({
            "ticker": ticker,
            "company": facts.name,
            "direction": score.direction,
            "bullish_score": score.bullish_score,
            "bearish_score": score.bearish_score,
            "confidence": score.confidence,
            "price_change": snap.change_pct_1d,
            "positive_news": positive_count,
            "negative_news": negative_count,
            "candidate_risk": candidate_risk,
            "ticker_alerts": ticker_alerts,
            "facts": facts,
            "pack_summary": "; ".join(
                f"{r.name}: {r.direction} ({r.confidence})" for r in strategy_results[:3]
            ),
            "snap": snap,
            "headlines": headlines,
            "score": score,
        })

    # ── Single AI call: generate per-ticker reasons + market brief ──
    ai_reasons, ai_brief = _ai_enrich(provider_instance, ticker_data, catalysts)

    # If Gemma didn't return a brief (common with large prompts), build one
    # from the AI-generated per-ticker reasons we already have.
    if not ai_brief and ai_reasons:
        bull_tickers = [td["ticker"] for td in ticker_data if td["score"].direction == "bullish"]
        bear_tickers = [td["ticker"] for td in ticker_data if td["score"].direction == "bearish"]
        parts: list[str] = []
        for t in bull_tickers[:2]:
            if t in ai_reasons:
                parts.append(ai_reasons[t])
                break
        for t in bear_tickers[:1]:
            if t in ai_reasons:
                parts.append(ai_reasons[t])
                break
        if parts:
            ai_brief = " ".join(parts)

    # ── Build candidate objects with AI-generated reasons ──
    for td in ticker_data:
        ticker = td["ticker"]
        score = td["score"]
        facts = td["facts"]
        snap = td["snap"]
        ticker_alerts = td["ticker_alerts"]
        candidate_risk = td["candidate_risk"]
        pack_summary = td["pack_summary"]
        headlines = td["headlines"]
        positive_count = td["positive_news"]
        negative_count = td["negative_news"]
        impacts_for_ticker = [
            "positive" if td["positive_news"] > 0 else
            "negative" if td["negative_news"] > 0 else "neutral"
        ]

        reason = ai_reasons.get(ticker, score.reason)

        details = CandidateDetails(
            price_signal=f"One-day public price movement: {snap.change_pct_1d:+.2f}%.",
            news_signal=(
                f"{positive_count} positive, {negative_count} negative headline(s) in the scan."
                if headlines
                else "No public headlines were available for this scan."
            ),
            filing_signal=(
                f"{len(facts.filings)} recent SEC filing metadata item(s) available."
                if facts.filings
                else "No recent filing metadata was used."
            ),
            strategy_result=pack_summary or "No built-in strategy pack emitted a strong view.",
            ai_reasoning=reason,
            risks=[a.reason for a in ticker_alerts] or ["No major scan risk alert."],
            what_would_change_view=(
                "A shift in price momentum, new public headlines, updated filing metadata, "
                "or conflicting strategy-pack output would change this view."
            ),
            data_used=[
                market_data_service.source_label(snap.source),
                filing_service.source_label(facts.source),
                *(news_service.display_source(h.source) for h in headlines[:2]),
            ],
        )

        if score.direction == "bullish":
            bullish.append(
                BullishCandidate(
                    ticker=ticker,
                    company_name=facts.name,
                    bullish_score=score.bullish_score,
                    confidence=score.confidence,
                    reason=reason,
                    supporting_headlines_count=positive_count,
                    risk_note=f"Risk level: {candidate_risk}. Review volatility and headline changes.",
                    status=risk_filter_service.status_for("bullish", candidate_risk),  # type: ignore[arg-type]
                    details=details,
                )
            )
        elif score.direction == "bearish":
            bearish.append(
                BearishCandidate(
                    ticker=ticker,
                    company_name=facts.name,
                    bearish_score=score.bearish_score,
                    confidence=score.confidence,
                    reason=reason,
                    negative_headlines_count=negative_count,
                    risk_note=f"Risk level: {candidate_risk}. Watch for rebound or catalyst reversal.",
                    status=risk_filter_service.status_for("bearish", candidate_risk),  # type: ignore[arg-type]
                    details=details,
                )
            )
        else:
            neutral.append(
                NeutralCandidate(
                    ticker=ticker,
                    company_name=facts.name,
                    score=max(score.bullish_score, score.bearish_score),
                    confidence=score.confidence,
                    reason=reason,
                    risk_level=candidate_risk,  # type: ignore[arg-type]
                )
            )

    bullish.sort(key=lambda c: (-c.bullish_score, -c.confidence, c.ticker))
    bearish.sort(key=lambda c: (-c.bearish_score, -c.confidence, c.ticker))
    direction = report_service.market_direction(bullish, bearish, alerts)
    scan_id = _scan_id(mode)
    report = MarketReport(
        scan_id=scan_id,
        mode=mode,  # type: ignore[arg-type]
        universe=universe,
        provider=effective_provider_id,
        generated_at=generated_at,
        market_direction=direction,
        bullish_candidates=bullish[:6],
        bearish_candidates=bearish[:6],
        neutral_candidates=neutral[:8],
        news_catalysts=catalysts[:20],
        risk_alerts=alerts[:20],
        ai_market_brief=ai_brief or report_service.ai_market_brief(bullish, bearish, alerts),
        data_used=DataUsed(
            price_source=", ".join(sorted(price_sources)) or "demo fallback",
            news_source=", ".join(sorted(news_sources)) or "not included",
            filing_source=", ".join(sorted(filing_sources)) or "not included",
            ai_provider=effective_provider_id,
            scan_time=generated_at,
            universe_scanned=universe,
        ),
    )
    _REPORTS[scan_id] = report
    _REPORT_ORDER.insert(0, scan_id)
    del _REPORT_ORDER[25:]
    return report


def recent_results() -> List[StarterResultSummary]:
    out: List[StarterResultSummary] = []
    for scan_id in _REPORT_ORDER:
        r = _REPORTS[scan_id]
        out.append(
            StarterResultSummary(
                scan_id=r.scan_id,
                generated_at=r.generated_at,
                market_tone=r.market_direction.tone,
                bullish_count=len(r.bullish_candidates),
                bearish_count=len(r.bearish_candidates),
                risk_level=r.market_direction.risk_level,
                provider=r.provider,
            )
        )
    return out


def get_report(scan_id: str) -> Optional[MarketReport]:
    return _REPORTS.get(scan_id)


def generated_watchlist() -> List[GeneratedWatchlistItem]:
    if not _REPORT_ORDER:
        return []          # No auto-scan — the user must run one explicitly.
    latest = _REPORTS[_REPORT_ORDER[0]]
    items: List[GeneratedWatchlistItem] = []
    for c in latest.bullish_candidates:
        items.append(
            GeneratedWatchlistItem(
                ticker=c.ticker,
                direction="bullish",
                score=c.bullish_score,
                confidence=c.confidence,
                risk_level="Medium" if c.status == "Review" else "Low",
                last_reason=c.reason,
                last_checked=latest.generated_at,
                status=c.status,
            )
        )
    for c in latest.bearish_candidates:
        items.append(
            GeneratedWatchlistItem(
                ticker=c.ticker,
                direction="bearish",
                score=c.bearish_score,
                confidence=c.confidence,
                risk_level="High" if c.status == "High Risk" else "Medium",
                last_reason=c.reason,
                last_checked=latest.generated_at,
                status=c.status,
            )
        )
    return items
