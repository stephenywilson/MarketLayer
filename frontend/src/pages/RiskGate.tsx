import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getSignals, postRiskGate, type RiskGateResult, type Signal } from "../api/client";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";
import { RiskGateView } from "../components/RiskGateView";
import { GatePill } from "../components/StatusPill";
import { MetricTile } from "../components/MetricTile";

const PRESETS = ["NVDA", "AAPL", "MSFT", "TSLA", "AMD", "META", "GOOGL"];

function timeAgo(iso: string): string {
  const t = new Date(iso).getTime();
  if (!t) return "—";
  const diff = Math.max(0, Date.now() - t);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function RiskGate() {
  const [searchParams] = useSearchParams();
  const queryTicker = (searchParams.get("ticker") || "NVDA").toUpperCase();
  const [ticker, setTicker] = useState(queryTicker);
  const [input, setInput] = useState(queryTicker);
  const [result, setResult] = useState<RiskGateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sourceSignal, setSourceSignal] = useState<Signal | null>(null);

  async function run(t: string) {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await postRiskGate(t);
      setTicker(t);
      setResult(r);
    } catch (e: any) {
      setError(e?.message || "Failed to run risk gate");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    run(queryTicker);
    // Look up a recent signal for the same ticker to show source context
    (async () => {
      try {
        const r = await getSignals();
        const match = r.signals.find(
          (s) => s.ticker.toUpperCase() === queryTicker
        );
        setSourceSignal(match || null);
      } catch {
        setSourceSignal(null);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const counts = result
    ? {
        passed: result.checks.filter((c) => c.status === "passed").length,
        warning: result.checks.filter((c) => c.status === "warning").length,
        review: result.checks.filter((c) => c.status === "review_required")
          .length,
        blocked: result.checks.filter((c) => c.status === "blocked").length,
      }
    : { passed: 0, warning: 0, review: 0, blocked: 0 };

  return (
    <div className="ml-page-shell">
      <header>
        <div className="ml-label">RISK GATE</div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ml-text">
          Decision filter
        </h1>
        <p className="mt-1 text-[13px] text-ml-text-dim max-w-2xl">
          Filters active signals before they reach the AI decision brief.
        </p>
      </header>

      {sourceSignal && (
        <div className="ml-panel-strong p-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="text-[12px] text-ml-text-dim">
            <span className="ml-label-muted mr-2">Source signal</span>
            <span className="font-mono text-ml-accent tracking-widest">
              {sourceSignal.ticker}
            </span>
            <span className="mx-2 text-ml-text-muted">·</span>
            <span>{sourceSignal.signal_type.replace(/_/g, " ")}</span>
            <span className="mx-2 text-ml-text-muted">·</span>
            <span className="text-ml-text-muted">
              emitted {timeAgo(sourceSignal.emitted_at)}
            </span>
          </div>
          <span className="ml-pill text-ml-accent border-ml-accent/30">
            confidence {sourceSignal.confidence}
          </span>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim()) run(input.trim().toUpperCase());
        }}
        className="ml-panel p-5 flex flex-wrap gap-3 items-end"
      >
        <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
          <label className="ml-label">Ticker</label>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            className="ml-input font-mono uppercase tracking-widest"
            maxLength={8}
          />
          <div className="flex flex-wrap gap-1.5 pt-1">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setInput(p);
                  run(p);
                }}
                className="ml-pill hover:text-ml-accent hover:border-ml-accent/40"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <button type="submit" disabled={loading} className="ml-button-primary">
          {loading ? "Running…" : "Run risk gate"}
        </button>
      </form>

      {loading && <LoadingState label={`Running gate for ${input}…`} />}
      {error && <ErrorState message={error} />}

      {result && (
        <>
          <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="ml-panel-strong p-4 flex flex-col gap-2">
              <div className="ml-label">Decision · {ticker}</div>
              <div className="mt-1">
                <GatePill decision={result.decision} />
              </div>
              <div className="text-[11px] text-ml-text-muted">
                {result.last_run_at}
              </div>
            </div>
            <MetricTile label="Passed" value={counts.passed} accent />
            <MetricTile label="Warning" value={counts.warning} />
            <MetricTile label="Review" value={counts.review} />
            <MetricTile label="Blocked" value={counts.blocked} />
          </section>

          <RiskGateView result={result} />
        </>
      )}

    </div>
  );
}

export default RiskGate;
