interface Props {
  label: string;
  value: string | number;
  hint?: string;
  accent?: boolean;
}

export function MetricTile({ label, value, hint, accent }: Props) {
  return (
    <div className="ml-panel p-4 flex flex-col gap-1.5 min-w-[160px]">
      <div className="ml-label">{label}</div>
      <div
        className={`font-mono text-xl ${
          accent ? "text-ml-accent" : "text-ml-text"
        }`}
      >
        {value}
      </div>
      {hint && (
        <div className="text-[11px] text-ml-text-muted leading-snug">
          {hint}
        </div>
      )}
    </div>
  );
}
