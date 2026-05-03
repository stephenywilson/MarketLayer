import { useState } from "react";
import { Link } from "react-router-dom";
import { postAssetLab, type WorkbenchResult } from "../api/client";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";
import { QuickDemoPanel } from "../components/QuickDemoPanel";
import { StarterResultCard } from "../components/StarterResultCard";
import {
  gateToStatus,
  useResults,
  useWatchlist,
} from "../hooks/useStarterStore";
import { Icon } from "../components/Icon";

export function QuickRun() {
  const { items: watch, upsert: addWatch } = useWatchlist();
  const { push: pushResult } = useResults();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WorkbenchResult | null>(null);

  async function run({
    symbol,
    preset,
    news,
  }: {
    symbol: string;
    preset: string;
    news: string;
  }) {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await postAssetLab(symbol, news || undefined, preset);
      setResult(r);
      pushResult({
        id: `${r.ticker}-${Date.now()}`,
        symbol: r.ticker,
        preset,
        status: gateToStatus(r.risk_gate.decision),
        provider: r.provider_used,
        time: new Date().toISOString(),
        brief: r.ai_brief.headline,
      });
    } catch (e: any) {
      setError(e?.message || "Run failed");
    } finally {
      setLoading(false);
    }
  }

  function addToWatchlist() {
    if (!result) return;
    addWatch({
      ticker: result.ticker,
      status: gateToStatus(result.risk_gate.decision),
      signal: result.active_signals[0]?.signal_type || "—",
      riskLevel: result.ai_brief.risk_posture,
      lastChecked: new Date().toISOString(),
    });
  }

  const watchlisted = !!(
    result && watch.some((w) => w.ticker === result.ticker)
  );

  return (
    <div className="ml-page-shell">
      <header>
        <div className="ml-label">QUICK RUN</div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ml-text">
          Run one symbol
        </h1>
        <p className="mt-1 text-[13px] text-ml-text-dim max-w-2xl">
          Run any US stock through the simplified pipeline. Optional
          news / event text anchors the analysis.
        </p>
      </header>

      <QuickDemoPanel
        loading={loading}
        onSubmit={run}
        primaryLabel="Run Analysis"
        showNewsField
      />

      {loading && <LoadingState label="Running pipeline…" />}
      {error && <ErrorState message={error} />}

      {result && (
        <>
          <StarterResultCard
            result={result}
            actions={{
              onAddToWatchlist: addToWatchlist,
              watchlisted,
            }}
          />

          <div className="ml-panel p-4 flex items-center justify-between gap-3 flex-wrap">
            <div className="text-[12px] text-ml-text-muted">
              Want the full pipeline view with strategy fit, backtest
              snapshot, and the 6-check risk gate breakdown?
            </div>
            <Link
              to={`/asset-lab?ticker=${result.ticker}`}
              className="ml-button-primary"
            >
              Open this in Pro Asset Lab
              <Icon name="arrow-right" size={12} />
            </Link>
          </div>
        </>
      )}

      {!result && !loading && !error && (
        <div className="ml-panel p-6 text-[12.5px] text-ml-text-dim">
          <div className="text-ml-text font-medium mb-1">Quick Run idle</div>
          Pick a symbol and a preset, then press{" "}
          <span className="text-ml-accent font-medium">Run Analysis</span>.
          The default <span className="font-mono">mock</span> AI provider
          works without any keys.
        </div>
      )}
    </div>
  );
}

export default QuickRun;
