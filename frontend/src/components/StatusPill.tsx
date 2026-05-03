import type {
  GateDecision,
  RiskLevel,
  SignalStatus,
  StrategyStatus,
  WatchlistAction,
} from "../api/client";

type Tone = "ok" | "info" | "warn" | "danger" | "muted";

const TONE_CLASS: Record<Tone, string> = {
  ok: "text-ml-accent border-ml-accent/40 bg-ml-accent/10",
  info: "text-ml-accent-2 border-ml-accent-2/40 bg-ml-accent-2/10",
  warn: "text-ml-warn border-ml-warn/40 bg-ml-warn/10",
  danger: "text-ml-danger border-ml-danger/40 bg-ml-danger/10",
  muted: "text-ml-text-dim border-ml-border-strong",
};

const GATE: Record<GateDecision, { label: string; tone: Tone }> = {
  passed: { label: "passed", tone: "ok" },
  warning: { label: "warning", tone: "warn" },
  blocked: { label: "blocked", tone: "danger" },
  review_required: { label: "review", tone: "warn" },
};

const SIGNAL: Record<SignalStatus, { label: string; tone: Tone }> = {
  monitoring: { label: "monitoring", tone: "info" },
  passed: { label: "passed", tone: "ok" },
  blocked: { label: "blocked", tone: "danger" },
  review_required: { label: "review", tone: "warn" },
};

const RISK: Record<RiskLevel, { label: string; tone: Tone }> = {
  low: { label: "low risk", tone: "ok" },
  moderate: { label: "moderate", tone: "info" },
  elevated: { label: "elevated", tone: "warn" },
  high: { label: "high risk", tone: "danger" },
};

const STRATEGY: Record<StrategyStatus, { label: string; tone: Tone }> = {
  active: { label: "active", tone: "ok" },
  research: { label: "research", tone: "info" },
  paused: { label: "paused", tone: "muted" },
};

const ACTION: Record<WatchlistAction, { label: string; tone: Tone }> = {
  monitor: { label: "monitor", tone: "info" },
  deepen: { label: "deepen research", tone: "ok" },
  pause: { label: "pause", tone: "warn" },
};

function Pill({ label, tone }: { label: string; tone: Tone }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[11px] font-mono uppercase tracking-wider ${TONE_CLASS[tone]}`}
    >
      {label}
    </span>
  );
}

export function GatePill({ decision }: { decision: GateDecision }) {
  const v = GATE[decision];
  return <Pill label={v.label} tone={v.tone} />;
}

export function SignalStatusPill({ status }: { status: SignalStatus }) {
  const v = SIGNAL[status];
  return <Pill label={v.label} tone={v.tone} />;
}

export function RiskLevelPill({ level }: { level: RiskLevel }) {
  const v = RISK[level];
  return <Pill label={v.label} tone={v.tone} />;
}

export function StrategyStatusPill({ status }: { status: StrategyStatus }) {
  const v = STRATEGY[status];
  return <Pill label={v.label} tone={v.tone} />;
}

export function ActionPill({ action }: { action: WatchlistAction }) {
  const v = ACTION[action];
  return <Pill label={v.label} tone={v.tone} />;
}
