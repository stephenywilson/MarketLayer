import type { SystemStatus } from "../api/client";

interface Props {
  system: SystemStatus;
}

function Pair({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "ok" | "warn" | "muted";
}) {
  const valueClass =
    tone === "ok"
      ? "text-ml-accent"
      : tone === "warn"
        ? "text-ml-warn"
        : tone === "muted"
          ? "text-ml-text-muted"
          : "text-ml-text";
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="ml-label-muted">{label}</span>
      <span className={`font-mono ${valueClass}`}>{value}</span>
    </div>
  );
}

export function SystemStatusBar({ system }: Props) {
  return (
    <div className="ml-panel px-4 py-2.5 flex flex-wrap items-center gap-x-6 gap-y-2">
      <Pair label="Market" value={system.market} tone="ok" />
      <span className="text-ml-border">|</span>
      <Pair label="Data mode" value={system.data_mode} tone="ok" />
      <span className="text-ml-border">|</span>
      <Pair
        label="AI provider"
        value={system.ai_provider.toUpperCase()}
        tone="ok"
      />
      <span className="text-ml-border">|</span>
      <Pair
        label="Research mode"
        value={system.research_mode ? "Enabled" : "Disabled"}
        tone="ok"
      />
      <span className="text-ml-border">|</span>
      <Pair
        label="Trading"
        value={system.trading_disabled ? "Disabled" : "Enabled"}
        tone="warn"
      />
      <span className="text-ml-border">|</span>
      <Pair
        label="Crypto"
        value={system.crypto_planned ? "Planned (V0.3)" : "Off"}
        tone="muted"
      />
    </div>
  );
}
