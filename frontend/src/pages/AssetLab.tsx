import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";
import { DecisionBriefView } from "../components/DecisionBriefView";
import { RiskGateView } from "../components/RiskGateView";
import { SignalRow, SignalRowHeader } from "../components/SignalRow";
import { Icon } from "../components/Icon";
import { ProviderBadge } from "../components/ProviderBadge";
import { SelectControl } from "../components/SelectControl";
import { postAssetLab, type WorkbenchResult } from "../api/client";

const TICKER_PRESETS = ["NVDA", "AAPL", "MSFT", "TSLA", "AMD", "META", "GOOGL"];

const STRATEGY_OPTIONS = [
  { id: "", label: "Auto · Momentum default" },
  { id: "momentum", label: "Momentum Continuation" },
  { id: "mean_reversion", label: "Mean Reversion (RSI14 < 30)" },
];

const STAGES = [
  "DATA",
  "STRATEGY",
  "BACKTEST",
  "SIGNALS",
  "RISK GATE",
  "AI BRIEF",
];

export function AssetLab() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTicker = searchParams.get("ticker") || "NVDA";

  const [ticker, setTicker] = useState(initialTicker);
  const [news, setNews] = useState("");
  const [strategy, setStrategy] = useState("");
  const [result, setResult] = useState<WorkbenchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(t = ticker, n = news, s = strategy) {
    if (!t.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setSearchParams({ ticker: t.trim().toUpperCase() });
    try {
      const r = await postAssetLab(
        t.trim().toUpperCase(),
        n.trim() || undefined,
        s || undefined
      );
      setResult(r);
    } catch (e: any) {
      setError(e?.message || "Pipeline failed");
    } finally {
      setLoading(false);
    }
  }

  // Auto-run when arriving with ?ticker=… query
  useEffect(() => {
    const t = searchParams.get("ticker");
    if (t && !result && !loading && !error) {
      run(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="ml-page-shell">
      <header>
        <div className="ml-label">ASSET LAB</div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ml-text">
          Asset Lab
        </h1>
        <p className="mt-1 text-[13px] text-ml-text-dim max-w-2xl">
          Run one asset through the full decision-support pipeline.
        </p>
      </header>

      {/* Stage strip indicator */}
      <div className="flex items-center gap-2 flex-wrap text-[10px] uppercase tracking-[0.18em] text-ml-text-muted">
        {STAGES.map((s, i) => (
          <span key={s} className="flex items-center gap-2">
            <span className={result || loading ? "text-ml-accent" : ""}>
              0{i + 1} {s}
            </span>
            {i < STAGES.length - 1 && (
              <Icon name="arrow-right" size={11} className="text-ml-border-strong" />
            )}
          </span>
        ))}
      </div>

      {/* Controls */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run();
        }}
        className="ml-panel p-5 grid grid-cols-1 md:grid-cols-[200px,1fr,200px,auto] gap-4 items-end"
      >
        <div>
          <label className="ml-label-muted">Asset symbol</label>
          <input
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            className="ml-input mt-1.5 font-mono uppercase tracking-widest"
            placeholder="NVDA"
            maxLength={8}
          />
          <div className="flex flex-wrap gap-1 pt-2">
            {TICKER_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setTicker(p);
                  run(p, news, strategy);
                }}
                className="ml-pill hover:text-ml-accent hover:border-ml-accent/40"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="ml-label-muted">News / event text · optional</label>
          <textarea
            value={news}
            onChange={(e) => setNews(e.target.value)}
            placeholder="Paste a press release, headline, or filing excerpt to anchor the pipeline."
            rows={4}
            className="ml-input mt-1.5 resize-y leading-relaxed"
          />
        </div>

        <div>
          <label className="ml-label-muted">Strategy module</label>
          <SelectControl
            value={strategy}
            onChange={setStrategy}
            options={STRATEGY_OPTIONS.map((option) => ({
              value: option.id,
              label: option.label,
            }))}
            className="mt-1.5"
          />
          <div className="text-[10px] text-ml-text-muted mt-1.5">
            Provider <span className="text-ml-accent font-mono">auto</span> — backend resolves from .env
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="ml-button-primary h-fit"
        >
          <Icon name="play" size={14} />
          {loading ? "Running pipeline…" : "Run Decision Pipeline"}
        </button>
      </form>

      {loading && (
        <LoadingState label="Loading data → emitting signals → running backtest → risk gate → brief…" />
      )}
      {error && <ErrorState message={error} />}

      {result && (
        <div className="space-y-6">
          {/* 1. Asset Snapshot */}
          <section className="ml-panel-strong p-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="ml-label">01 · ASSET SNAPSHOT</div>
                <div className="mt-2 flex items-baseline gap-3">
                  <span className="font-mono text-2xl tracking-widest text-ml-accent">
                    {result.ticker}
                  </span>
                  <span className="text-ml-text">
                    {result.research_report.company_name}
                  </span>
                </div>
                <div className="text-[12px] text-ml-text-dim mt-2 max-w-3xl leading-relaxed">
                  {result.research_report.company_overview}
                </div>
              </div>
              <ProviderBadge provider={result.provider_used} />
            </div>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3 text-[12px]">
              <SnapMetric
                label="Last price"
                value={result.asset_snapshot.last_price.toFixed(2)}
                accent
              />
              <SnapMetric
                label="1d change"
                value={`${result.asset_snapshot.change_pct_1d >= 0 ? "+" : ""}${result.asset_snapshot.change_pct_1d.toFixed(2)}%`}
                tone={
                  result.asset_snapshot.change_pct_1d >= 0
                    ? "accent"
                    : "danger"
                }
              />
              <SnapMetric
                label="Volume"
                value={
                  result.asset_snapshot.volume
                    ? `${(result.asset_snapshot.volume / 1e6).toFixed(1)}M`
                    : "—"
                }
              />
              <SnapMetric
                label="Source"
                value={result.asset_snapshot.data_source}
                mono
              />
              <SnapMetric
                label="Freshness"
                value={result.asset_snapshot.freshness}
                mono
              />
            </div>
          </section>

          {/* 2. Price Action */}
          <Section number="02" title="PRICE ACTION">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[13px]">
              <div>
                <div className="ml-label-muted">30-day range</div>
                <div className="font-mono text-ml-text mt-1">
                  {result.price_action.range_30d}
                </div>
              </div>
              <div>
                <div className="ml-label-muted">Relative strength</div>
                <div className="text-ml-text-dim mt-1">
                  {result.price_action.relative_strength}
                </div>
              </div>
              <div>
                <div className="ml-label-muted">Note</div>
                <div className="text-ml-text-dim mt-1 leading-relaxed">
                  {result.price_action.note}
                </div>
              </div>
            </div>
          </Section>

          {/* 3. Catalysts */}
          <Section number="03" title="CATALYSTS">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {result.catalysts.map((c, i) => (
                <div
                  key={i}
                  className="border border-ml-border rounded-sm p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-ml-text font-medium text-[13px]">
                      {c.title}
                    </div>
                    <span className="ml-pill">{c.impact}</span>
                  </div>
                  <div className="text-[12px] text-ml-text-dim mt-1.5 leading-snug">
                    {c.description}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* 4. Active Signals */}
          <Section
            number="04"
            title="ACTIVE SIGNALS"
            meta={`${result.active_signals.length} signal(s)`}
          >
            <div className="border border-ml-border rounded">
              <SignalRowHeader />
              {result.active_signals.map((s) => (
                <SignalRow key={s.id} signal={s} />
              ))}
            </div>
          </Section>

          {/* 5. Strategy Fit */}
          <Section number="05" title="STRATEGY FIT">
            <div className="space-y-3">
              {result.strategy_fit.map((f) => (
                <div
                  key={f.strategy_id}
                  className="border border-ml-border rounded-sm p-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-[13px] text-ml-text">
                      {f.strategy_name}
                    </div>
                    <div className="font-mono text-sm text-ml-accent">
                      {f.fit_score}
                    </div>
                  </div>
                  <div className="text-[11px] text-ml-text-muted mt-1 leading-snug">
                    {f.reason}
                  </div>
                  <div className="mt-2 h-1 w-full bg-ml-bg-elev rounded-sm overflow-hidden">
                    <div
                      className="h-full bg-ml-accent/70"
                      style={{ width: `${f.fit_score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* 6. Backtest Snapshot */}
          {result.backtest_snapshot && (
            <Section
              number="06"
              title="BACKTEST SNAPSHOT (PER-TICKER)"
              meta={result.backtest_snapshot.strategy_id}
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[13px]">
                <SnapMetric
                  label="Period"
                  value={result.backtest_snapshot.period}
                  mono
                />
                <SnapMetric
                  label="Signals"
                  value={result.backtest_snapshot.signal_count.toString()}
                  accent
                />
                <SnapMetric
                  label="Hit rate"
                  value={`${result.backtest_snapshot.hit_rate_pct.toFixed(1)}%`}
                  tone={
                    result.backtest_snapshot.hit_rate_pct >= 50
                      ? "accent"
                      : "warn"
                  }
                />
                <SnapMetric
                  label="Avg fwd"
                  value={`${result.backtest_snapshot.avg_forward_return_pct.toFixed(2)}%`}
                  tone={
                    result.backtest_snapshot.avg_forward_return_pct >= 0
                      ? "accent"
                      : "danger"
                  }
                />
              </div>
              <p className="mt-3 text-[11px] text-ml-text-muted">
                {result.backtest_snapshot.note}
              </p>
            </Section>
          )}

          {/* 7. Risk Gate Result */}
          <section>
            <div className="ml-label mb-2">07 · RISK GATE RESULT</div>
            <RiskGateView result={result.risk_gate} />
          </section>

          {/* 8. AI Decision Brief */}
          <section>
            <div className="ml-label mb-2">08 · AI DECISION BRIEF</div>
            <DecisionBriefView brief={result.ai_brief} />
          </section>

          {/* 9. Research Notes */}
          <Section number="09" title="RESEARCH NOTES">
            <p className="text-[13px] text-ml-text-dim leading-relaxed whitespace-pre-wrap">
              {result.research_report.final_summary}
            </p>
            <div className="mt-4 border-t border-ml-border pt-3 text-[11px] text-ml-text-muted leading-relaxed">
              {result.disclaimer}
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}

function Section({
  number,
  title,
  meta,
  children,
}: {
  number: string;
  title: string;
  meta?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="ml-panel p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="ml-label">
          {number} · {title}
        </div>
        {meta && (
          <span className="text-[11px] font-mono text-ml-text-muted">
            {meta}
          </span>
        )}
      </div>
      <div className="ml-divider mb-4 h-px bg-ml-border" />
      {children}
    </section>
  );
}

function SnapMetric({
  label,
  value,
  tone = "default",
  accent,
  mono,
}: {
  label: string;
  value: string;
  tone?: "default" | "accent" | "warn" | "danger";
  accent?: boolean;
  mono?: boolean;
}) {
  const cls =
    accent || tone === "accent"
      ? "text-ml-accent"
      : tone === "warn"
        ? "text-ml-warn"
        : tone === "danger"
          ? "text-ml-danger"
          : "text-ml-text";
  return (
    <div>
      <div className="ml-label-muted">{label}</div>
      <div
        className={`mt-1 ${mono ? "font-mono text-sm" : "text-[15px] font-semibold"} ${cls}`}
      >
        {value}
      </div>
    </div>
  );
}

export default AssetLab;
