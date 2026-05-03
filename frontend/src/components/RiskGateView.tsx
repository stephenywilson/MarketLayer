import type { RiskGateCheck, RiskGateResult } from "../api/client";
import { GatePill } from "./StatusPill";

function CheckRow({ check }: { check: RiskGateCheck }) {
  return (
    <div className="grid grid-cols-[160px,1fr,60px,auto] gap-3 items-center px-4 py-3 border-b border-ml-border last:border-b-0">
      <div className="text-[12px] text-ml-text">{check.label}</div>
      <div className="text-[12px] text-ml-text-dim leading-snug">
        {check.detail}
      </div>
      <div className="font-mono text-sm text-ml-text-dim">{check.score}</div>
      <GatePill decision={check.status} />
    </div>
  );
}

export function RiskGateView({ result }: { result: RiskGateResult }) {
  return (
    <div className="ml-panel-strong">
      <div className="px-5 py-4 flex items-start justify-between border-b border-ml-border-strong">
        <div>
          <div className="ml-label">Risk gate · {result.ticker}</div>
          <div className="mt-1 text-[13px] text-ml-text-dim leading-relaxed max-w-xl">
            {result.summary}
          </div>
        </div>
        <GatePill decision={result.decision} />
      </div>
      <div>
        {result.checks.map((c) => (
          <CheckRow key={c.name} check={c} />
        ))}
      </div>
      <div className="px-5 py-3 text-[11px] text-ml-text-muted border-t border-ml-border">
        {result.disclaimer}
      </div>
    </div>
  );
}
