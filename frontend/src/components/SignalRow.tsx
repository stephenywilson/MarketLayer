import type { Signal } from "../api/client";
import { RiskLevelPill, SignalStatusPill } from "./StatusPill";

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

export function SignalRow({ signal }: { signal: Signal }) {
  return (
    <div className="grid grid-cols-[80px,140px,1fr,80px,auto,auto,auto] gap-3 items-center px-4 py-3 border-b border-ml-border last:border-b-0 hover:bg-ml-panel/40 transition-colors">
      <div className="font-mono text-sm tracking-widest text-ml-accent">
        {signal.ticker}
      </div>
      <div className="text-[12px] text-ml-text-dim">
        {TYPE_LABEL[signal.signal_type]}
      </div>
      <div className="text-[12px] text-ml-text-dim leading-snug truncate">
        {signal.rationale}
      </div>
      <div className="font-mono text-sm text-ml-text">
        {signal.confidence}
      </div>
      <RiskLevelPill level={signal.risk_level} />
      <SignalStatusPill status={signal.status} />
      <div className="text-[10px] font-mono text-ml-text-muted whitespace-nowrap">
        {timeAgo(signal.emitted_at)}
      </div>
    </div>
  );
}

export function SignalRowHeader() {
  return (
    <div className="grid grid-cols-[80px,140px,1fr,80px,auto,auto,auto] gap-3 items-center px-4 py-2 border-b border-ml-border-strong text-[10px] uppercase tracking-widest text-ml-text-muted">
      <div>Ticker</div>
      <div>Type</div>
      <div>Rationale</div>
      <div>Conf.</div>
      <div>Risk</div>
      <div>Status</div>
      <div className="text-right">Emitted</div>
    </div>
  );
}
