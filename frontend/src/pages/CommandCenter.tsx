import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getCommandCenter,
  getPipeline,
  type CommandCenterStatus,
  type PipelineResponse,
} from "../api/client";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";
import { Icon } from "../components/Icon";
import { PipelineSection } from "../components/PipelineSection";
import { SystemStatusBar } from "../components/SystemStatusBar";
import {
  GatePill,
  StrategyStatusPill,
} from "../components/StatusPill";
import { WatchlistTable } from "../components/WatchlistTable";

const PIPELINE_TAGLINE_SHORT =
  "Data → Strategy → Backtest → Signals → Risk → AI Brief.";

export function CommandCenter() {
  const [cc, setCc] = useState<CommandCenterStatus | null>(null);
  const [pipe, setPipe] = useState<PipelineResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [c, p] = await Promise.all([getCommandCenter(), getPipeline()]);
        if (cancelled) return;
        setCc(c);
        setPipe(p);
      } catch (e: any) {
        if (!cancelled)
          setError(e?.message || "Failed to load Command Center");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error)
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <ErrorState message={error} />
      </div>
    );
  if (!cc || !pipe)
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <LoadingState label="Loading workspace…" />
      </div>
    );

  return (
    <div className="ml-page-shell">
      <div>
        <div className="ml-label">COMMAND CENTER</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ml-text">
          MarketLayer - Catalayer
        </h1>
        <p className="mt-1 text-[13px] text-ml-text-dim max-w-2xl">
          Open-source AI quant research pipeline for US equities.
        </p>
      </div>

      <SystemStatusBar system={pipe.system} />

      {/* Start here */}
      <section>
        <div className="ml-label mb-2">START HERE</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <StartCard
            icon="play"
            title="Quick Run"
            body="Analyze one symbol through the full pipeline."
            cta="Run a symbol"
            to="/pro/asset-lab"
          />
          <StartCard
            icon="signal"
            title="Review Signals"
            body="Inspect active research signals from enabled strategies."
            cta="Open signals"
            to="/pro/signal-scanner"
          />
          <StartCard
            icon="backtest"
            title="Run Backtest"
            body="Validate a strategy over historical data."
            cta="Open backtest"
            to="/pro/backtest-lab"
          />
        </div>
      </section>

      {/* Pipeline */}
      <PipelineSection
        stages={pipe.stages}
        tagline={PIPELINE_TAGLINE_SHORT}
      />

      {/* Two-column: Recent Signals + Watchlist */}
      <section className="grid grid-cols-1 lg:grid-cols-[1.5fr,1fr] gap-5">
        <div className="ml-panel">
          <div className="px-5 py-3 border-b border-ml-border flex items-center justify-between">
            <div className="ml-label">RECENT SIGNALS</div>
            <Link
              to="/pro/signal-scanner"
              className="text-[11px] font-medium text-ml-accent hover:text-ml-accent-soft"
            >
              open scanner →
            </Link>
          </div>
          <div className="divide-y divide-ml-border">
            {cc.active_signals.slice(0, 6).map((s) => (
              <Link
                key={s.id}
                to={`/pro/asset-lab?ticker=${s.ticker}`}
                className="px-5 py-2.5 grid grid-cols-[60px,90px,1fr,40px] items-center gap-2 text-[12px] hover:bg-ml-panel/40"
              >
                <span className="font-mono text-[13px] tracking-widest text-ml-accent">
                  {s.ticker}
                </span>
                <span className="text-ml-text-dim">
                  {s.signal_type.replace(/_/g, " ")}
                </span>
                <span className="text-ml-text-dim truncate">
                  {s.rationale}
                </span>
                <span className="text-right font-mono text-ml-text">
                  {s.confidence}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="ml-panel">
          <div className="px-5 py-3 border-b border-ml-border">
            <div className="ml-label">WATCHLIST</div>
          </div>
          <WatchlistTable items={cc.watchlist} />
        </div>
      </section>

      {/* Strategy modules + Risk + AI brief */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="ml-panel">
          <div className="px-5 py-3 border-b border-ml-border flex items-center justify-between">
            <div className="ml-label">STRATEGIES</div>
            <Link
              to="/pro/strategy-packs"
              className="text-[11px] font-medium text-ml-accent hover:text-ml-accent-soft"
            >
              strategy lab →
            </Link>
          </div>
          <div className="divide-y divide-ml-border max-h-[260px] overflow-y-auto">
            {cc.strategy_modules.map((s) => (
              <div
                key={s.id}
                className="px-5 py-2.5 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="text-[13px] text-ml-text">{s.name}</div>
                  <div className="text-[11px] text-ml-text-muted">
                    {s.fit_summary}
                  </div>
                </div>
                <StrategyStatusPill status={s.status} />
              </div>
            ))}
          </div>
        </div>

        <div className="ml-panel-strong p-5">
          <div className="flex items-center justify-between">
            <div className="ml-label">RISK GATE</div>
            <GatePill decision={cc.risk_gate.decision} />
          </div>
          <p className="mt-3 text-[13px] text-ml-text-dim leading-relaxed">
            {cc.risk_gate.summary}
          </p>
          <Link
            to="/pro/risk-filters"
            className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-ml-accent hover:text-ml-accent-soft"
          >
            Inspect <Icon name="arrow-right" size={12} />
          </Link>
        </div>

        <div className="ml-panel-strong p-5">
          <div className="ml-label">AI BRIEF</div>
          <h3 className="mt-2 text-[14px] text-ml-text leading-snug">
            {cc.decision_brief_headline}
          </h3>
          <p className="mt-2 text-[12px] text-ml-text-muted leading-relaxed">
            Posture{" "}
            <span className="text-ml-text-dim uppercase">
              {cc.decision_brief_posture}
            </span>{" "}
            · Provider{" "}
            <span className="font-mono text-ml-accent">
              {cc.provider.current.toUpperCase()}
            </span>
          </p>
          <Link
            to="/pro/asset-lab"
            className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-ml-accent hover:text-ml-accent-soft"
          >
            Run pipeline <Icon name="arrow-right" size={12} />
          </Link>
        </div>
      </section>

      <section className="ml-panel">
        <div className="px-5 py-3 border-b border-ml-border">
          <div className="ml-label">SYSTEM LOGS</div>
        </div>
        <div className="divide-y divide-ml-border">
          {cc.system_logs.map((l, i) => (
            <div
              key={i}
              className="grid grid-cols-[180px,90px,150px,1fr] gap-3 px-5 py-2 items-center text-[12px]"
            >
              <span className="font-mono text-[10px] text-ml-text-muted">
                {l.ts}
              </span>
              <span
                className={[
                  "ml-pill",
                  l.level === "warn"
                    ? "text-ml-warn border-ml-warn/30"
                    : l.level === "error"
                      ? "text-ml-danger border-ml-danger/30"
                      : "text-ml-accent border-ml-accent/30",
                ].join(" ")}
              >
                {l.level}
              </span>
              <span className="font-mono text-ml-text-dim">{l.source}</span>
              <span className="text-ml-text-dim">{l.message}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function StartCard({
  icon,
  title,
  body,
  cta,
  to,
}: {
  icon: Parameters<typeof Icon>[0]["name"];
  title: string;
  body: string;
  cta: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="ml-panel p-4 flex flex-col gap-2 hover:border-ml-accent/40 transition-colors"
    >
      <div className="flex items-center gap-2">
        <Icon name={icon} size={16} className="text-ml-accent" />
        <span className="text-[14px] font-semibold text-ml-text">
          {title}
        </span>
      </div>
      <p className="text-[12px] text-ml-text-dim leading-relaxed">{body}</p>
      <div className="mt-auto flex items-center gap-1 text-[12px] font-medium text-ml-accent">
        {cta} <Icon name="arrow-right" size={11} />
      </div>
    </Link>
  );
}

export default CommandCenter;
