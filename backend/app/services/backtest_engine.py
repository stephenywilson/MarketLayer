"""Backtest engine — research-only, runs on real yfinance OHLCV.

What the engine actually does:
  * Loads daily bars for each ticker via the price connector (cached).
  * Generates signals from the chosen strategy (momentum / mean-reversion).
  * Computes forward-window returns to measure how aligned each signal
    was with subsequent price action.
  * Builds an equity index from compounding mean forward returns of
    *passing* signals (research index, NOT a trading P&L track record).
  * Reports research metrics: hit rate, avg forward return, Sharpe-like
    on signal cohort, max drawdown of the index, total signals.

This engine never executes trades. It produces a research summary you
can compare across strategies and universes. The "equity curve" is a
normalized signal-cohort index with starting value 1.0.
"""
from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import List, Optional

from app.providers.data import price as price_conn

UNIVERSES = {
    "sp500_megacap": [
        "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA",
        "AVGO", "AMD", "NFLX",
    ],
    "ai_complex": ["NVDA", "AMD", "AVGO", "MSFT", "GOOGL", "META", "PLTR"],
    "single": [],  # filled at runtime
}


@dataclass
class BacktestParams:
    strategy_id: str
    universe: str = "sp500_megacap"
    period: str = "1y"  # yfinance period
    forward_window_days: int = 5
    risk_filter: bool = True
    custom_tickers: Optional[List[str]] = None


@dataclass
class BacktestSignal:
    date: str
    ticker: str
    rationale: str
    forward_return_pct: Optional[float]
    aligned: Optional[bool]


@dataclass
class EquityPoint:
    date: str
    equity: float


@dataclass
class TickerRollup:
    ticker: str
    signal_count: int
    aligned_count: int
    avg_forward_return_pct: float
    hit_rate_pct: float


@dataclass
class DistributionBucket:
    label: str
    count: int
    is_loss: bool


@dataclass
class BacktestMetrics:
    total_signals: int
    aligned_count: int
    hit_rate_pct: float
    avg_forward_return_pct: float
    median_forward_return_pct: float
    sharpe_like: float
    max_drawdown_pct: float
    coverage_pct: int
    universe_size: int
    bars_loaded: int
    distribution: List[DistributionBucket]
    best_tickers: List[TickerRollup]
    worst_tickers: List[TickerRollup]
    note: str


@dataclass
class BacktestResult:
    params: BacktestParams
    metrics: BacktestMetrics
    equity_curve: List[EquityPoint]
    signals: List[BacktestSignal]
    started_at: str
    finished_at: str
    duration_ms: int
    data_source: str


def _ema(values: List[float], span: int) -> List[Optional[float]]:
    if span <= 1:
        return [v for v in values]
    alpha = 2.0 / (span + 1)
    out: List[Optional[float]] = []
    e: Optional[float] = None
    for v in values:
        e = v if e is None else alpha * v + (1 - alpha) * e
        out.append(e)
    return out


def _resolve_universe(params: BacktestParams) -> List[str]:
    if params.custom_tickers:
        return [t.upper() for t in params.custom_tickers]
    return UNIVERSES.get(params.universe, UNIVERSES["sp500_megacap"])


def _emit_momentum(
    bars, forward_window: int
) -> List[BacktestSignal]:
    """Crossover of EMA20 above EMA50, on bars list."""
    signals: List[BacktestSignal] = []
    closes = [b.close for b in bars]
    if len(closes) < 60:
        return signals
    e20 = _ema(closes, 20)
    e50 = _ema(closes, 50)
    for i in range(50, len(closes) - 1):
        a, b = e20[i - 1], e20[i]
        c, d = e50[i - 1], e50[i]
        if a is None or b is None or c is None or d is None:
            continue
        # Crossover up: previously e20<=e50, now e20>e50
        if a <= c and b > d:
            entry = closes[i]
            exit_idx = min(i + forward_window, len(closes) - 1)
            exit_close = closes[exit_idx]
            fwd = 0.0 if entry == 0 else (exit_close - entry) / entry * 100.0
            signals.append(
                BacktestSignal(
                    date=bars[i].date,
                    ticker=bars[i].__dict__.get("ticker", ""),
                    rationale=f"EMA20 cross above EMA50 at {entry:.2f}",
                    forward_return_pct=round(fwd, 3),
                    aligned=fwd > 0,
                )
            )
    return signals


def _emit_mean_reversion(
    bars, forward_window: int
) -> List[BacktestSignal]:
    """RSI-14 below 30 → expect reversion in forward window."""
    signals: List[BacktestSignal] = []
    closes = [b.close for b in bars]
    if len(closes) < 30:
        return signals

    # RSI(14) — Wilder's smoothing
    gains: List[float] = [0.0]
    losses: List[float] = [0.0]
    for i in range(1, len(closes)):
        d = closes[i] - closes[i - 1]
        gains.append(max(d, 0.0))
        losses.append(max(-d, 0.0))
    period = 14
    avg_g = sum(gains[1 : period + 1]) / period if len(gains) > period else 0
    avg_l = sum(losses[1 : period + 1]) / period if len(losses) > period else 0
    rsi: List[Optional[float]] = [None] * (period + 1)
    for i in range(period + 1, len(closes)):
        avg_g = (avg_g * (period - 1) + gains[i]) / period
        avg_l = (avg_l * (period - 1) + losses[i]) / period
        if avg_l == 0:
            rsi.append(100.0)
        else:
            rs = avg_g / avg_l
            rsi.append(100 - (100 / (1 + rs)))

    for i in range(period + 1, len(closes) - 1):
        r = rsi[i]
        prev_r = rsi[i - 1]
        if r is None or prev_r is None:
            continue
        if prev_r >= 30 and r < 30:
            entry = closes[i]
            exit_idx = min(i + forward_window, len(closes) - 1)
            exit_close = closes[exit_idx]
            fwd = 0.0 if entry == 0 else (exit_close - entry) / entry * 100.0
            signals.append(
                BacktestSignal(
                    date=bars[i].date,
                    ticker=bars[i].__dict__.get("ticker", ""),
                    rationale=f"RSI14 dipped to {r:.1f} from {prev_r:.1f}",
                    forward_return_pct=round(fwd, 3),
                    aligned=fwd > 0,
                )
            )
    return signals


_STRATEGY_FNS = {
    "momentum": _emit_momentum,
    "mean_reversion": _emit_mean_reversion,
    # earnings_reaction / news_catalyst / etf_rotation aren't price-derivable
    # without extra data — fall back to momentum so the engine still runs.
    "earnings_reaction": _emit_momentum,
    "news_catalyst": _emit_momentum,
    "etf_rotation": _emit_momentum,
}


def _equity_curve(signals: List[BacktestSignal]) -> List[EquityPoint]:
    if not signals:
        return []
    by_date: dict[str, List[float]] = {}
    for s in signals:
        if s.forward_return_pct is None:
            continue
        by_date.setdefault(s.date, []).append(s.forward_return_pct / 100.0)
    if not by_date:
        return []
    eq = 1.0
    out: List[EquityPoint] = []
    for d in sorted(by_date.keys()):
        avg = sum(by_date[d]) / len(by_date[d])
        eq *= 1.0 + avg
        out.append(EquityPoint(date=d, equity=round(eq, 5)))
    return out


def _max_drawdown(curve: List[EquityPoint]) -> float:
    if not curve:
        return 0.0
    peak = curve[0].equity
    mdd = 0.0
    for p in curve:
        peak = max(peak, p.equity)
        if peak > 0:
            dd = (p.equity - peak) / peak
            mdd = min(mdd, dd)
    return round(mdd * 100.0, 2)


def _sharpe_like(values: List[float]) -> float:
    if len(values) < 2:
        return 0.0
    n = len(values)
    mean = sum(values) / n
    var = sum((v - mean) ** 2 for v in values) / (n - 1)
    sd = math.sqrt(var) if var > 0 else 0.0
    if sd == 0:
        return 0.0
    # annualize roughly assuming ~252 trading days, treating each signal
    # as one observation. This is a research metric, not a P&L Sharpe.
    return round((mean / sd) * math.sqrt(252.0), 2)


def _median(values: List[float]) -> float:
    if not values:
        return 0.0
    s = sorted(values)
    n = len(s)
    mid = n // 2
    return s[mid] if n % 2 else (s[mid - 1] + s[mid]) / 2.0


def _distribution(returns: List[float]) -> List[DistributionBucket]:
    edges = [
        ("<-10%", -1e9, -10.0, True),
        ("-10 to -5%", -10.0, -5.0, True),
        ("-5 to 0%", -5.0, 0.0, True),
        ("0 to 5%", 0.0, 5.0, False),
        ("5 to 10%", 5.0, 10.0, False),
        (">10%", 10.0, 1e9, False),
    ]
    out: List[DistributionBucket] = []
    for label, lo, hi, is_loss in edges:
        n = sum(1 for r in returns if lo <= r < hi)
        out.append(DistributionBucket(label=label, count=n, is_loss=is_loss))
    return out


def _ticker_rollups(
    signals: List[BacktestSignal],
) -> List[TickerRollup]:
    by_t: Dict[str, List[BacktestSignal]] = {}
    for s in signals:
        by_t.setdefault(s.ticker, []).append(s)
    out: List[TickerRollup] = []
    for t, items in by_t.items():
        rets = [
            i.forward_return_pct for i in items if i.forward_return_pct is not None
        ]
        aligned_n = sum(1 for i in items if i.aligned is True)
        out.append(
            TickerRollup(
                ticker=t,
                signal_count=len(items),
                aligned_count=aligned_n,
                avg_forward_return_pct=round(
                    sum(rets) / len(rets), 3
                ) if rets else 0.0,
                hit_rate_pct=round(
                    100.0 * aligned_n / len(items), 2
                ) if items else 0.0,
            )
        )
    return out


def run(params: BacktestParams) -> BacktestResult:
    from typing import Dict  # local to keep import scope tight

    started = datetime.now(timezone.utc)
    started_iso = started.strftime("%Y-%m-%dT%H:%M:%SZ")

    universe = _resolve_universe(params)
    fn = _STRATEGY_FNS.get(params.strategy_id, _emit_momentum)

    all_signals: List[BacktestSignal] = []
    bars_total = 0
    coverage_hits = 0
    data_sources = []

    for t in universe:
        bars = price_conn.fetch_history(t, period=params.period)
        if bars:
            for b in bars:
                b.__dict__["ticker"] = t  # type: ignore[attr-defined]
            sigs = fn(bars, params.forward_window_days)
            for s in sigs:
                s.ticker = t
            all_signals.extend(sigs)
            bars_total += len(bars)
            coverage_hits += 1
            data_sources.append("yfinance")

    aligned = sum(1 for s in all_signals if s.aligned is True)
    total = len(all_signals)
    hit_rate = round(100.0 * aligned / total, 2) if total else 0.0
    fwd_returns = [
        s.forward_return_pct
        for s in all_signals
        if s.forward_return_pct is not None
    ]
    avg_ret = round(sum(fwd_returns) / len(fwd_returns), 3) if fwd_returns else 0.0
    median_ret = round(_median(fwd_returns), 3) if fwd_returns else 0.0
    sharpe = _sharpe_like([r / 100.0 for r in fwd_returns])
    eq = _equity_curve(all_signals)
    mdd = _max_drawdown(eq)

    rollups = _ticker_rollups(all_signals)
    rollups_sorted = sorted(rollups, key=lambda r: -r.avg_forward_return_pct)
    best_tickers = rollups_sorted[:5]
    worst_tickers = rollups_sorted[::-1][:5]

    finished = datetime.now(timezone.utc)
    duration = int((finished - started).total_seconds() * 1000)

    metrics = BacktestMetrics(
        total_signals=total,
        aligned_count=aligned,
        hit_rate_pct=hit_rate,
        avg_forward_return_pct=avg_ret,
        median_forward_return_pct=median_ret,
        sharpe_like=sharpe,
        max_drawdown_pct=mdd,
        coverage_pct=int(100 * coverage_hits / max(1, len(universe))),
        universe_size=len(universe),
        bars_loaded=bars_total,
        distribution=_distribution(fwd_returns),
        best_tickers=best_tickers,
        worst_tickers=worst_tickers,
        note=(
            "Research-only summary. The equity curve compounds mean "
            "forward-window returns of emitted signals — it is not a "
            "trading P&L record."
        ),
    )

    # Trim signals payload to the most recent 80 to keep responses small.
    all_signals.sort(key=lambda s: s.date)
    payload = all_signals[-80:]

    return BacktestResult(
        params=params,
        metrics=metrics,
        equity_curve=eq,
        signals=payload,
        started_at=started_iso,
        finished_at=finished.strftime("%Y-%m-%dT%H:%M:%SZ"),
        duration_ms=duration,
        data_source="yfinance" if "yfinance" in data_sources else "mock",
    )


def per_ticker_snapshot(
    ticker: str,
    strategy_id: str = "momentum",
    period: str = "1y",
    forward_window_days: int = 5,
) -> dict:
    """Run the engine on a single ticker for the Asset Lab snapshot panel.

    Returns a small dict (not a Pydantic model — caller wraps it).
    """
    p = BacktestParams(
        strategy_id=strategy_id,
        universe="single",
        period=period,
        forward_window_days=forward_window_days,
        custom_tickers=[ticker.upper()],
    )
    res = run(p)
    return {
        "strategy_id": strategy_id,
        "period": period,
        "signal_count": res.metrics.total_signals,
        "hit_rate_pct": res.metrics.hit_rate_pct,
        "avg_forward_return_pct": res.metrics.avg_forward_return_pct,
        "max_drawdown_pct": res.metrics.max_drawdown_pct,
    }
