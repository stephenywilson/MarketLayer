import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  getSignals,
  type Signal,
  type SignalListResponse,
  type SignalStatus,
} from "../api/client";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";
import {
  RiskLevelPill,
  SignalStatusPill,
} from "../components/StatusPill";
import { MetricTile } from "../components/MetricTile";
import { Icon } from "../components/Icon";

const STATUS_FILTERS: { id: "all" | SignalStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "monitoring", label: "Monitoring" },
  { id: "passed", label: "Passed" },
  { id: "review_required", label: "Review" },
  { id: "blocked", label: "Blocked" },
];

const TYPE_LABEL: Record<Signal["signal_type"], string> = {
  momentum: "Momentum",
  earnings_reaction: "Earnings drift",
  news_catalyst: "News catalyst",
  mean_reversion: "Mean reversion",
  etf_rotation: "ETF rotation",
};

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

export function SignalScanner() {
  const [data, setData] = useState<SignalListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | SignalStatus>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await getSignals();
        if (!cancelled) setData(r);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load signals");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered: Signal[] = useMemo(() => {
    if (!data) return [];
    if (filter === "all") return data.signals;
    return data.signals.filter((s) => s.status === filter);
  }, [data, filter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    if (data)
      for (const s of data.signals) c[s.status] = (c[s.status] ?? 0) + 1;
    return c;
  }, [data]);

  if (error)
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <ErrorState message={error} />
      </div>
    );
  if (!data)
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <LoadingState label="Reading signal queue…" />
      </div>
    );

  return (
    <div className="ml-page-shell space-y-5">
      <header>
        <div className="ml-label">SIGNAL SCANNER</div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ml-text">
          Active signals
        </h1>
        <p className="mt-1 text-[12px] text-ml-text-muted max-w-2xl">
          Signals are research artifacts for decision-support review.
        </p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <MetricTile
          label="Total"
          value={data.signals.length}
          accent
        />
        <MetricTile label="Monitoring" value={counts.monitoring ?? 0} />
        <MetricTile label="Passed" value={counts.passed ?? 0} accent />
        <MetricTile label="Review" value={counts.review_required ?? 0} />
        <MetricTile label="Blocked" value={counts.blocked ?? 0} />
      </section>

      <section className="flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={[
              "ml-pill",
              filter === f.id
                ? "text-ml-accent border-ml-accent/40 bg-ml-accent/10"
                : "hover:text-ml-text",
            ].join(" ")}
          >
            {f.label}
          </button>
        ))}
        <div className="flex-1" />
        <span className="text-[11px] font-mono text-ml-text-muted">
          last run {data.last_run_at}
        </span>
      </section>

      <div className="ml-panel">
        <div className="grid grid-cols-[80px,140px,1fr,70px,90px,90px,90px,90px] gap-3 items-center px-4 py-2 border-b border-ml-border-strong text-[10px] uppercase tracking-[0.18em] text-ml-text-muted">
          <div>Ticker</div>
          <div>Strategy</div>
          <div>Rationale</div>
          <div>Conf.</div>
          <div>Risk</div>
          <div>Status</div>
          <div>Time</div>
          <div className="text-right">Action</div>
        </div>
        {filtered.length === 0 ? (
          <div className="px-5 py-6 text-[12px] text-ml-text-muted">
            No signals match this filter.
          </div>
        ) : (
          filtered.map((s) => {
            const isOpen = expanded === s.id;
            return (
              <div
                key={s.id}
                className="border-b border-ml-border last:border-b-0"
              >
                <div className="grid grid-cols-[80px,140px,1fr,70px,90px,90px,90px,90px] gap-3 items-center px-4 py-3 hover:bg-ml-panel/40">
                  <span className="font-mono text-sm tracking-widest text-ml-accent">
                    {s.ticker}
                  </span>
                  <span className="text-[12px] text-ml-text-dim">
                    {TYPE_LABEL[s.signal_type]}
                  </span>
                  <span className="text-[12px] text-ml-text-dim leading-snug truncate">
                    {s.rationale}
                  </span>
                  <span className="font-mono text-sm text-ml-text">
                    {s.confidence}
                  </span>
                  <RiskLevelPill level={s.risk_level} />
                  <SignalStatusPill status={s.status} />
                  <span className="text-[10px] font-mono text-ml-text-muted whitespace-nowrap">
                    {timeAgo(s.emitted_at)}
                  </span>
                  <button
                    onClick={() => setExpanded(isOpen ? null : s.id)}
                    className={
                      isOpen
                        ? "ml-button-primary text-[11px] py-1 justify-self-end"
                        : "ml-button text-[11px] py-1 justify-self-end"
                    }
                  >
                    {isOpen ? "Hide" : "Review"}
                  </button>
                </div>
                {isOpen && (
                  <div className="px-4 pb-3 pt-2 flex items-center gap-2 flex-wrap border-t border-ml-border bg-ml-panel/30">
                    <Link
                      to={`/pro/asset-lab?ticker=${s.ticker}`}
                      className="ml-button text-[11px] py-1"
                    >
                      <Icon name="workbench" size={11} />
                      Open Asset Lab
                    </Link>
                    <Link
                      to={`/pro/risk-filters?ticker=${s.ticker}`}
                      className="ml-button text-[11px] py-1"
                    >
                      <Icon name="shield" size={11} />
                      Run Risk Gate
                    </Link>
                    <Link
                      to={`/pro/asset-lab?ticker=${s.ticker}`}
                      className="ml-button text-[11px] py-1"
                    >
                      <Icon name="ghost" size={11} />
                      Generate AI Brief
                    </Link>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default SignalScanner;
