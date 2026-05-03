import { Link } from "react-router-dom";
import type { WorkbenchResult } from "../api/client";
import { Icon } from "./Icon";
import {
  gateToStatus,
  STATUS_TONE,
  type StarterStatus,
} from "../hooks/useStarterStore";

const TONE_TEXT: Record<"ok" | "info" | "warn" | "danger", string> = {
  ok: "text-ml-accent",
  info: "text-ml-info",
  warn: "text-ml-warn",
  danger: "text-ml-danger",
};

const TONE_BORDER: Record<"ok" | "info" | "warn" | "danger", string> = {
  ok: "border-ml-accent/40",
  info: "border-ml-info/40",
  warn: "border-ml-warn/40",
  danger: "border-ml-danger/40",
};

const TONE_DOT: Record<"ok" | "info" | "warn" | "danger", string> = {
  ok: "bg-ml-accent",
  info: "bg-ml-info",
  warn: "bg-ml-warn",
  danger: "bg-ml-danger",
};

export interface StarterCardActions {
  onAddToWatchlist?: () => void;
  watchlisted?: boolean;
}

export function StarterResultCard({
  result,
  actions,
}: {
  result: WorkbenchResult;
  actions?: StarterCardActions;
}) {
  const status: StarterStatus = gateToStatus(result.risk_gate.decision);
  const tone = STATUS_TONE[status];

  // 1. Why it appeared
  const why =
    result.active_signals[0]?.rationale ||
    result.research_report.final_summary ||
    "Pipeline produced a candidate based on current data and strategy.";

  // 2. Main risks — gate checks that aren't passed
  const risks = result.risk_gate.checks
    .filter((c) => c.status !== "passed")
    .slice(0, 3)
    .map((c) => `${c.label}: ${c.detail}`);
  if (risks.length === 0) {
    risks.push("All risk-gate checks within thresholds.");
  }

  return (
    <div className={`ml-panel-strong border ${TONE_BORDER[tone]} p-5 space-y-5`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="ml-label-muted">Result · {result.ticker}</div>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={`inline-block w-2 h-2 rounded-full ${TONE_DOT[tone]}`}
            />
            <span
              className={`text-[24px] font-semibold leading-tight ${TONE_TEXT[tone]}`}
            >
              {status}
            </span>
            <span className="ml-pill">
              provider {result.provider_used.toUpperCase()}
            </span>
          </div>
          <div className="mt-1 text-[12px] text-ml-text-muted">
            {result.research_report.company_name} · last{" "}
            <span className="font-mono text-ml-text-dim">
              {result.asset_snapshot.last_price.toFixed(2)}
            </span>
            {" · "}
            <span
              className={
                result.asset_snapshot.change_pct_1d >= 0
                  ? "text-ml-accent font-mono"
                  : "text-ml-danger font-mono"
              }
            >
              {result.asset_snapshot.change_pct_1d >= 0 ? "+" : ""}
              {result.asset_snapshot.change_pct_1d.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* Why */}
      <Section title="Why it appeared">
        <p className="text-[13px] text-ml-text-dim leading-relaxed">{why}</p>
      </Section>

      {/* Risks */}
      <Section title="Main risks">
        <ul className="space-y-1.5">
          {risks.map((r, i) => (
            <li
              key={i}
              className="flex gap-2 text-[12.5px] text-ml-text-dim leading-snug"
            >
              <span className="text-ml-accent/60 font-mono mt-0.5">›</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* AI Brief */}
      <Section title="AI brief">
        <p className="text-[13px] text-ml-text-dim leading-relaxed">
          {result.ai_brief.thesis}
        </p>
        <div className="mt-2 text-[11px] text-ml-text-muted">
          Confidence{" "}
          <span className="font-mono text-ml-accent">
            {result.ai_brief.confidence}
          </span>{" "}
          · posture{" "}
          <span className="uppercase">{result.ai_brief.risk_posture}</span>
        </div>
      </Section>

      {/* Next step */}
      <div className="border-t border-ml-border pt-4 flex items-center gap-2 flex-wrap">
        {actions?.onAddToWatchlist && (
          <button
            disabled={actions.watchlisted}
            onClick={actions.onAddToWatchlist}
            className="ml-button text-[12px] py-1.5"
          >
            <Icon name="bell" size={12} />
            {actions.watchlisted ? "On watchlist" : "Add to watchlist"}
          </button>
        )}
        <Link
          to={`/pro/asset-lab?ticker=${result.ticker}`}
          className="ml-button text-[12px] py-1.5"
        >
          <Icon name="workbench" size={12} />
          Open Pro view
        </Link>
        <Link to="/pro/signal-scanner" className="ml-button text-[12px] py-1.5">
          <Icon name="signal" size={12} />
          View signals
        </Link>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="ml-label-muted mb-1.5">{title}</div>
      {children}
    </div>
  );
}
