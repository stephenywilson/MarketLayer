import { Link } from "react-router-dom";
import { useState } from "react";
import type { StrategyCard } from "../api/client";
import { postStrategyToggle } from "../api/client";
import { StrategyStatusPill } from "./StatusPill";
import { Icon } from "./Icon";

const MARKET_LABEL: Record<string, string> = {
  us_equity: "US Equity",
  crypto: "Crypto · planned",
  etf: "ETF",
  fx: "FX",
};

export function StrategyCardView({
  card,
  onChange,
}: {
  card: StrategyCard & { market_type?: string; universe?: string; enabled?: boolean };
  onChange?: (next: StrategyCard) => void;
}) {
  const b = card.backtest;
  const isPlanned = card.id.startsWith("crypto_") || card.id === "funding_rate_divergence";
  const [enabled, setEnabled] = useState<boolean>(!!card.enabled);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (isPlanned) return;
    setBusy(true);
    try {
      const next = await postStrategyToggle(card.id, !enabled);
      setEnabled(next.enabled);
      onChange?.(next as unknown as StrategyCard);
    } catch {
      /* swallow — UI stays in previous state */
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={`ml-panel p-5 flex flex-col gap-4 hover:border-ml-border-strong ${
        isPlanned ? "opacity-80" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="ml-label-muted">{card.category}</div>
            <span className="ml-pill">
              {MARKET_LABEL[card.market_type || "us_equity"] || "US Equity"}
            </span>
          </div>
          <h3 className="mt-1 text-ml-text font-medium tracking-wide">
            {card.name}
          </h3>
        </div>
        <StrategyStatusPill status={card.status} />
      </div>

      <p className="text-[12px] text-ml-text-dim leading-relaxed">
        {card.description}
      </p>

      <div className="ml-divider h-px bg-ml-border" />

      <div className="grid grid-cols-2 gap-3 text-[12px]">
        <Metric label="Universe" value={card.universe || b.universe} />
        <Metric label="Backtest period" value={b.period} />
        <Metric
          label="Signals / week"
          value={b.signals_per_week.toFixed(1)}
        />
        <Metric label="Hit rate" value={`${b.hit_rate_pct}%`} accent />
        <Metric label="Holding window" value={b.median_holding_window} />
        <Metric label="Coverage" value={`${b.coverage_pct}%`} />
      </div>

      <div className="border-t border-ml-border pt-3 flex items-center gap-2 flex-wrap">
        <Link
          to={`/pro/backtest-lab?strategy=${card.id}`}
          className={`ml-button text-[12px] py-1.5 ${
            isPlanned ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          <Icon name="play" size={12} />
          Run Backtest
        </Link>
        <Link
          to="/pro/signal-scanner"
          className="ml-button text-[12px] py-1.5"
        >
          <Icon name="signal" size={12} />
          View Signals
        </Link>
        <button
          onClick={toggle}
          disabled={busy || isPlanned}
          className={`ml-button text-[12px] py-1.5 ${
            enabled
              ? "border-ml-accent/40 text-ml-accent hover:bg-ml-accent/10"
              : "border-ml-border text-ml-text-dim"
          }`}
        >
          <Icon name={enabled ? "check" : "play"} size={12} />
          {isPlanned ? "Planned" : enabled ? "Scanner On" : "Scanner Off"}
        </button>
      </div>

      <div className="text-[11px] text-ml-text-muted leading-relaxed">
        {b.note}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="text-[10px] uppercase tracking-[0.18em] text-ml-text-muted">
        {label}
      </div>
      <div
        className={`font-mono ${
          accent ? "text-ml-accent" : "text-ml-text-dim"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
