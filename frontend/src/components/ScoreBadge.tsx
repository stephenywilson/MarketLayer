interface Props {
  label: string;
  value: number;
  hint?: string;
}

function bandColor(v: number): string {
  if (v >= 75) return "text-ml-accent";
  if (v >= 50) return "text-ml-accent-2";
  if (v >= 30) return "text-ml-warn";
  return "text-ml-danger";
}

export function ScoreBadge({ label, value, hint }: Props) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="ml-panel-strong p-4 flex flex-col gap-2 min-w-[180px]">
      <div className="flex items-baseline justify-between gap-2">
        <div className="ml-label">{label}</div>
        <div className={`font-mono text-2xl ${bandColor(v)}`}>{v}</div>
      </div>
      <div className="h-1 w-full bg-ml-bg-2 rounded-sm overflow-hidden">
        <div
          className={`h-full ${
            v >= 75
              ? "bg-ml-accent"
              : v >= 50
                ? "bg-ml-accent-2"
                : v >= 30
                  ? "bg-ml-warn"
                  : "bg-ml-danger"
          }`}
          style={{ width: `${v}%` }}
        />
      </div>
      {hint && (
        <div className="text-[11px] text-ml-text-muted leading-snug">
          {hint}
        </div>
      )}
    </div>
  );
}
