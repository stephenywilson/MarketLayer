"""Phase A smoke test — confirm the Ollama / Qwen real path is actually firing.

Usage (run from the backend/ directory so the .env is picked up):

    cd backend
    python -m scripts.smoke_qwen                    # defaults to AAPL
    python -m scripts.smoke_qwen AAPL MSFT NVDA     # multiple tickers

What this script proves (or fails to prove):

  1. Yahoo Finance RSS is reachable and returning real headlines for the ticker.
  2. yfinance is reachable and returning a real price snapshot.
  3. The prompt assembled and sent to Ollama contains those real artifacts.
  4. Ollama's HTTP endpoint at OLLAMA_BASE_URL is reachable and the configured
     OLLAMA_MODEL responds.
  5. The model output parses as valid JSON for the ResearchReport schema.
  6. The final ResearchReport is filled by the model — not by the deterministic
     MockProvider fallback.

Exit code:
  0  every ticker succeeded
  1  any ticker fell back to mock or errored

This script reads OLLAMA_BASE_URL / OLLAMA_MODEL from the same Settings the
backend uses, so it tests the exact same path the /api scan endpoints take.
"""
from __future__ import annotations

import json
import os
import sys
from textwrap import shorten

# Allow `python -m scripts.smoke_qwen` from backend/ — and direct `python smoke_qwen.py`.
_THIS = os.path.dirname(os.path.abspath(__file__))
_BACKEND = os.path.dirname(_THIS)
if _BACKEND not in sys.path:
    sys.path.insert(0, _BACKEND)

from app.config import get_settings  # noqa: E402
from app.providers.ai.base import ResearchReportInput  # noqa: E402
from app.providers.ai.ollama import OllamaProvider  # noqa: E402
from app.providers.data import news as news_provider  # noqa: E402
from app.providers.data import price as price_provider  # noqa: E402
from app.research.prompts import REPORT_SYSTEM_PROMPT, report_user_prompt  # noqa: E402


# ---------- helpers ----------


def banner(title: str) -> None:
    print()
    print("=" * 72)
    print(f"  {title}")
    print("=" * 72)


def short(s: str | None, n: int = 90) -> str:
    if s is None:
        return "<None>"
    return shorten(s, width=n, placeholder="…")


def is_likely_mock(text: str) -> bool:
    """The MockProvider returns a recognizable boilerplate sentence; spot it."""
    if not text:
        return True
    needles = ("MarketLayer mock provider", "deterministic mock", "demo provider")
    return any(n.lower() in text.lower() for n in needles)


# ---------- per-ticker smoke ----------


def smoke_one(ticker: str) -> dict:
    settings = get_settings()
    ticker = ticker.upper()

    print(f"\n[smoke] ticker            = {ticker}")
    print(f"[smoke] OLLAMA_BASE_URL  = {settings.ollama_base_url}")
    print(f"[smoke] OLLAMA_MODEL     = {settings.ollama_model}")
    print(f"[smoke] AI_PROVIDER (env)= {settings.ai_provider}  (this script bypasses the env switch and calls Ollama directly)")

    # 1. Real news
    banner(f"STEP 1 / {ticker} — Yahoo Finance RSS")
    items = news_provider.collect_news(ticker, None, limit=6)
    sources = {n.source for n in items}
    print(f"[smoke] {len(items)} headline(s) pulled. sources={sorted(sources)}")
    for n in items[:5]:
        print(f"  - ({n.source}) {short(n.headline, 100)}")
    rss_live = bool(sources - {"baseline"})
    if not rss_live:
        print("[smoke] WARNING: only baseline fallback news — Yahoo + Google RSS both unreachable.")

    # 2. Real price
    banner(f"STEP 2 / {ticker} — yfinance price snapshot")
    snap = price_provider.fetch_price_snapshot(ticker)
    snap_dict = {
        "last_price": snap.last_price,
        "change_pct_1d": snap.change_pct_1d,
        "as_of": snap.as_of,
        "source": snap.source,
    }
    print(f"[smoke] {snap_dict}")
    yf_live = snap.source != "mock"
    if not yf_live:
        print("[smoke] WARNING: yfinance returned a mock snapshot — check yfinance install / network.")

    # 3. Build payload + render the exact prompt the provider will send
    banner(f"STEP 3 / {ticker} — prompt that will be sent to Ollama")
    payload = ResearchReportInput(
        ticker=ticker,
        company_name=ticker,
        company_overview=f"{ticker} — public US equity (smoke test).",
        price_summary=(
            f"last={snap.last_price} change_1d={snap.change_pct_1d}% "
            f"as_of={snap.as_of} source={snap.source}"
        ),
        news_text=news_provider.summarize(items),
        filings_summary="",
    )
    user_prompt = report_user_prompt(payload)
    print("\n--- SYSTEM PROMPT ---")
    print(REPORT_SYSTEM_PROMPT)
    print("\n--- USER PROMPT ---")
    print(user_prompt)

    # 4. Call Ollama and capture the raw text response
    banner(f"STEP 4 / {ticker} — Ollama call + raw response")
    provider = OllamaProvider(settings)
    raw_holder: dict[str, str | None] = {"text": None}

    original_chat = provider._chat

    def instrumented_chat(system: str, user: str) -> str | None:
        out = original_chat(system, user)
        raw_holder["text"] = out
        return out

    provider._chat = instrumented_chat  # type: ignore[method-assign]

    try:
        report = provider.generate_research_report(payload)
        report_err: str | None = None
    except Exception as e:
        report = None  # type: ignore[assignment]
        report_err = repr(e)

    raw = raw_holder["text"]
    print("\n--- RAW MODEL RESPONSE ---")
    if raw is None:
        print("<None — Ollama HTTP request failed; check OLLAMA_BASE_URL and that ollama is running>")
    else:
        print(raw)

    # 5. Verdict
    banner(f"STEP 5 / {ticker} — verdict")

    parsed_ok = False
    parse_err: str | None = None
    if raw is not None:
        try:
            start = raw.find("{")
            end = raw.rfind("}")
            if start == -1 or end == -1:
                parse_err = "no JSON object delimiters found"
            else:
                json.loads(raw[start : end + 1])
                parsed_ok = True
        except Exception as e:
            parse_err = repr(e)

    fallback_used = (raw is None) or (not parsed_ok) or (report is not None and is_likely_mock(report.final_summary))

    if report_err:
        verdict = f"ERROR_PROVIDER_RAISED: {report_err}"
    elif raw is None:
        verdict = "FALLBACK_TO_MOCK (Ollama unreachable / non-200)"
    elif not parsed_ok:
        verdict = f"FALLBACK_TO_MOCK (model output not parseable: {parse_err})"
    elif report is not None and is_likely_mock(report.final_summary):
        verdict = "FALLBACK_TO_MOCK (parser succeeded but final report still has mock fingerprints)"
    else:
        verdict = "REAL_INFERENCE_OK"

    print(f"[smoke] verdict           : {verdict}")
    if report is not None:
        print(f"[smoke] provider_used     : {report.provider_used}")
        print(f"[smoke] final_summary     : {short(report.final_summary, 200)}")
        print(f"[smoke] bull_case[0..2]   : {report.bull_case[:2]}")
        print(f"[smoke] bear_case[0..2]   : {report.bear_case[:2]}")
        print(f"[smoke] confidence_score  : {report.confidence_score}")

    return {
        "ticker": ticker,
        "verdict": verdict,
        "fallback_used": fallback_used,
        "rss_live": rss_live,
        "yf_live": yf_live,
        "raw_chars": len(raw or ""),
    }


# ---------- main ----------


def main() -> int:
    tickers = [t.upper() for t in sys.argv[1:]] or ["AAPL"]

    print("=" * 72)
    print("  MarketLayer Phase A — Ollama / Qwen smoke test")
    print("=" * 72)

    results: list[dict] = []
    for t in tickers:
        try:
            results.append(smoke_one(t))
        except Exception as e:
            print(f"\n[smoke] EXCEPTION while smoking {t}: {e!r}")
            results.append({"ticker": t, "verdict": f"EXCEPTION: {e!r}", "fallback_used": True})

    banner("SUMMARY")
    for r in results:
        marker = "✓" if not r.get("fallback_used", True) else "✗"
        flags = []
        if r.get("rss_live") is False:
            flags.append("rss=baseline")
        if r.get("yf_live") is False:
            flags.append("yf=mock")
        flag_str = f"  [{', '.join(flags)}]" if flags else ""
        print(f"  {marker} {r['ticker']:6}  {r['verdict']}{flag_str}")

    failed = sum(1 for r in results if r.get("fallback_used", True))
    if failed:
        print(
            f"\n[smoke] {failed}/{len(results)} ticker(s) did NOT reach real Qwen inference. "
            "Diagnose the topmost STEP that failed above before connecting cloud providers."
        )
        return 1

    print(f"\n[smoke] all {len(results)} ticker(s) reached real Qwen inference end-to-end.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
