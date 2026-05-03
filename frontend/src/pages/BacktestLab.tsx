import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { postBacktest, type BacktestResultModel } from "../api/client";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";
import { EquitySparkline } from "../components/EquitySparkline";
import { StatCard } from "../components/StatCard";
import { Icon } from "../components/Icon";
import { SelectControl } from "../components/SelectControl";

const STRATEGIES = [
  { id: "momentum_continuation", label: "Momentum Continuation" },
  { id: "mean_reversion_range", label: "Mean Reversion Range" },
  { id: "news_catalyst_rerating", label: "News Catalyst Re-rating" },
  { id: "earnings_reaction_drift", label: "Earnings Reaction Drift" },
  { id: "volume_spike_watch", label: "Volume Spike Watch" },
  { id: "momentum", label: "Momentum (EMA20/50 cross)" },
  { id: "mean_reversion", label: "Mean Reversion (RSI14 < 30)" },
];
const UNIVERSES = [
  { id: "sp500_megacap", label: "S&P 500 mega-cap (10)" },
  { id: "ai_complex", label: "AI complex (7)" },
];
const PERIODS = [
  { id: "6mo", label: "6 months" },
  { id: "1y", label: "1 year" },
  { id: "2y", label: "2 years" },
  { id: "5y", label: "5 years" },
];

export function BacktestLab() {
  const [searchParams] = useSearchParams();
  const initialStrategy = searchParams.get("strategy") || "momentum";

  const [strategy, setStrategy] = useState(initialStrategy);
  const [universe, setUniverse] = useState("sp500_megacap");
  const [period, setPeriod] = useState("1y");
  const [forward, setForward] = useState(5);
  const [result, setResult] = useState<BacktestResultModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await postBacktest({
        strategy_id: strategy,
        universe,
        period,
        forward_window_days: forward,
        risk_filter: true,
      });
      setResult(r);
    } catch (e: any) {
      setError(e?.message || "Backtest failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialStrategy && initialStrategy !== "momentum") {
      run();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="ml-page-shell">
      <header>
        <div className="ml-label">BACKTEST LAB</div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ml-text">
          Backtest engine
        </h1>
        <p className="mt-1 text-[13px] text-ml-text-dim max-w-2xl">
          Validate strategy behavior on real yfinance OHLCV.
        </p>
      </header>

      <div className="ml-panel p-5 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
        <div className="md:col-span-2">
          <label className="ml-label-muted">Strategy</label>
          <SelectControl
            value={strategy}
            onChange={setStrategy}
            options={STRATEGIES.map((s) => ({ value: s.id, label: s.label }))}
            className="mt-1.5"
          />
        </div>
        <div>
          <label className="ml-label-muted">Universe</label>
          <SelectControl
            value={universe}
            onChange={setUniverse}
            options={UNIVERSES.map((u) => ({ value: u.id, label: u.label }))}
            className="mt-1.5"
          />
        </div>
        <div>
          <label className="ml-label-muted">Period</label>
          <SelectControl
            value={period}
            onChange={setPeriod}
            options={PERIODS.map((p) => ({ value: p.id, label: p.label }))}
            className="mt-1.5"
          />
        </div>
        <div>
          <label className="ml-label-muted">Fwd days</label>
          <input
            type="number"
            min={1}
            max={30}
            value={forward}
            onChange={(e) => setForward(parseInt(e.target.value, 10) || 5)}
            className="ml-input mt-1.5 font-mono"
          />
        </div>
        <div className="md:col-span-5 flex items-center justify-between border-t border-ml-border pt-4">
          <div className="text-[11px] text-ml-text-muted">
            Engine fetches real bars via yfinance; first run for a new
            ticker may take a few seconds.
          </div>
          <button
            disabled={loading}
            onClick={run}
            className="ml-button-primary"
          >
            <Icon name="play" size={14} />
            {loading ? "Running…" : "Run Backtest"}
          </button>
        </div>
      </div>

      {!result && !loading && !error && (
        <div className="ml-panel p-6 text-[13px] text-ml-text-dim">
          <div className="text-ml-text font-medium mb-1">
            Backtest Lab idle
          </div>
          Pick a strategy and press{" "}
          <span className="text-ml-accent font-medium">Run Backtest</span>{" "}
          to validate signal behavior on real US-equity bars.
        </div>
      )}

      {loading && (
        <LoadingState label="Loading bars + emitting signals + computing rollups…" />
      )}
      {error && <ErrorState message={error} />}

      {result && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatCard
              icon="signal"
              label="TOTAL SIGNALS"
              value={result.metrics.total_signals}
              description={`Aligned ${result.metrics.aligned_count}`}
              valueTone="accent"
            />
            <StatCard
              icon="check"
              label="HIT RATE"
              value={`${result.metrics.hit_rate_pct.toFixed(1)}%`}
              description="Forward-window > 0"
              valueTone={
                result.metrics.hit_rate_pct >= 55 ? "accent" : "white"
              }
            />
            <StatCard
              icon="backtest"
              label="AVG FWD RET"
              value={`${result.metrics.avg_forward_return_pct.toFixed(2)}%`}
              description={`Median ${result.metrics.median_forward_return_pct.toFixed(2)}%`}
            />
            <StatCard
              icon="strategy"
              label="SHARPE-LIKE"
              value={result.metrics.sharpe_like.toFixed(2)}
              description="Research metric"
            />
            <StatCard
              icon="shield"
              label="MAX DRAWDOWN"
              value={`${result.metrics.max_drawdown_pct.toFixed(2)}%`}
              description="Of signal cohort index"
              valueTone={
                result.metrics.max_drawdown_pct < -15 ? "danger" : "white"
              }
            />
            <StatCard
              icon="database"
              label="BARS LOADED"
              value={result.metrics.bars_loaded.toLocaleString()}
              description={`${result.metrics.universe_size} tickers · ${result.data_source}`}
            />
          </div>

          <EquitySparkline points={result.equity_curve} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="ml-panel p-5">
              <div className="ml-label">FORWARD RETURN DISTRIBUTION</div>
              <div className="text-[11px] text-ml-text-muted mt-0.5 mb-3">
                Bucketed forward-window return per signal
              </div>
              <DistributionBars buckets={result.metrics.distribution} />
            </div>

            <div className="ml-panel p-5">
              <div className="ml-label">BEST TICKERS</div>
              <div className="text-[11px] text-ml-text-muted mt-0.5 mb-3">
                Top by avg forward return
              </div>
              <TickerList rows={result.metrics.best_tickers} positive />
            </div>

            <div className="ml-panel p-5">
              <div className="ml-label">WORST TICKERS</div>
              <div className="text-[11px] text-ml-text-muted mt-0.5 mb-3">
                Bottom by avg forward return
              </div>
              <TickerList rows={result.metrics.worst_tickers} positive={false} />
            </div>
          </div>

          <div className="ml-panel">
            <div className="px-5 py-3 border-b border-ml-border flex items-center justify-between">
              <div>
                <div className="ml-label">
                  RECENT TRIGGERED · last {result.signals.length}
                </div>
                <div className="text-[11px] text-ml-text-muted mt-0.5">
                  Run finished in {result.duration_ms}ms · started{" "}
                  {result.started_at}
                </div>
              </div>
              <span className="ml-pill">{result.params.strategy_id}</span>
            </div>
            <div className="grid grid-cols-[110px,80px,1fr,90px,auto] gap-3 items-center px-5 py-2 border-b border-ml-border-strong text-[10px] uppercase tracking-[0.18em] text-ml-text-muted">
              <div>Date</div>
              <div>Ticker</div>
              <div>Rationale</div>
              <div className="text-right">Fwd %</div>
              <div>Aligned</div>
            </div>
            <div className="max-h-[420px] overflow-y-auto">
              {result.signals
                .slice()
                .reverse()
                .map((s, i) => {
                  const aligned = s.aligned === true;
                  return (
                    <div
                      key={i}
                      className="grid grid-cols-[110px,80px,1fr,90px,auto] gap-3 items-center px-5 py-2 border-b border-ml-border last:border-b-0 text-[12px]"
                    >
                      <span className="font-mono text-[11px] text-ml-text-muted">
                        {s.date}
                      </span>
                      <span className="font-mono text-ml-accent tracking-widest">
                        {s.ticker}
                      </span>
                      <span className="text-ml-text-dim truncate">
                        {s.rationale}
                      </span>
                      <span
                        className={`text-right font-mono ${
                          (s.forward_return_pct ?? 0) >= 0
                            ? "text-ml-accent"
                            : "text-ml-danger"
                        }`}
                      >
                        {s.forward_return_pct == null
                          ? "—"
                          : `${s.forward_return_pct >= 0 ? "+" : ""}${s.forward_return_pct.toFixed(2)}`}
                      </span>
                      <span
                        className={
                          aligned
                            ? "ml-pill text-ml-accent border-ml-accent/30"
                            : "ml-pill text-ml-danger border-ml-danger/30"
                        }
                      >
                        {aligned ? "yes" : "no"}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>

          <p className="text-[11px] text-ml-text-muted leading-relaxed max-w-3xl">
            {result.metrics.note} {result.disclaimer}
          </p>
        </div>
      )}
    </div>
  );
}

function DistributionBars({
  buckets,
}: {
  buckets: { label: string; count: number; is_loss: boolean }[];
}) {
  const max = Math.max(1, ...buckets.map((b) => b.count));
  return (
    <div className="space-y-2">
      {buckets.map((b) => (
        <div
          key={b.label}
          className="grid grid-cols-[80px,1fr,30px] gap-2 items-center text-[11px]"
        >
          <span className="font-mono text-ml-text-muted">{b.label}</span>
          <div className="h-2 bg-ml-bg-elev rounded-sm overflow-hidden">
            <div
              className={
                b.is_loss
                  ? "h-full bg-ml-danger/60"
                  : "h-full bg-ml-accent/60"
              }
              style={{ width: `${(b.count / max) * 100}%` }}
            />
          </div>
          <span className="text-right font-mono text-ml-text">
            {b.count}
          </span>
        </div>
      ))}
    </div>
  );
}

function TickerList({
  rows,
  positive,
}: {
  rows: {
    ticker: string;
    signal_count: number;
    avg_forward_return_pct: number;
    hit_rate_pct: number;
  }[];
  positive: boolean;
}) {
  if (rows.length === 0)
    return (
      <div className="text-[12px] text-ml-text-muted">
        No tickers — run a backtest first.
      </div>
    );
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div
          key={r.ticker}
          className="grid grid-cols-[60px,1fr,80px] gap-2 items-center text-[12px]"
        >
          <span className="font-mono text-ml-accent tracking-widest text-[13px]">
            {r.ticker}
          </span>
          <div className="text-[11px] text-ml-text-muted">
            {r.signal_count} signal{r.signal_count !== 1 ? "s" : ""} · hit{" "}
            {r.hit_rate_pct.toFixed(0)}%
          </div>
          <span
            className={`text-right font-mono ${
              positive ? "text-ml-accent" : "text-ml-danger"
            }`}
          >
            {r.avg_forward_return_pct >= 0 ? "+" : ""}
            {r.avg_forward_return_pct.toFixed(2)}%
          </span>
        </div>
      ))}
    </div>
  );
}

export default BacktestLab;
