import type { AIDecisionBrief } from "../api/client";
import { ActionPill, RiskLevelPill } from "./StatusPill";
import { ProviderBadge } from "./ProviderBadge";

export function DecisionBriefView({ brief }: { brief: AIDecisionBrief }) {
  return (
    <div className="ml-panel-strong p-5 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="ml-label">AI decision brief · research only</div>
          <h3 className="mt-1 text-ml-text font-medium tracking-wide max-w-2xl">
            {brief.headline}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <RiskLevelPill level={brief.risk_posture} />
          <ActionPill action={brief.watchlist_action} />
          <ProviderBadge provider={brief.provider_used} />
        </div>
      </div>

      <p className="text-[13px] text-ml-text-dim leading-relaxed">
        {brief.thesis}
      </p>

      <div className="ml-divider" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5">
        {brief.key_factors.map((f, i) => (
          <div key={i} className="flex gap-2 text-[12px] text-ml-text-dim">
            <span className="text-ml-accent/60 font-mono mt-0.5">›</span>
            <span>{f}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-ml-border pt-3">
        <div className="text-[11px] text-ml-text-muted">
          {brief.disclaimer}
        </div>
        <div className="text-[11px] font-mono text-ml-text-dim">
          confidence{" "}
          <span className="text-ml-accent">{brief.confidence}</span>
        </div>
      </div>
    </div>
  );
}
