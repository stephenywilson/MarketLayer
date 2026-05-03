export function LoadingState({ label = "Generating research report…" }: { label?: string }) {
  return (
    <div className="ml-panel p-6 flex items-center gap-4">
      <div className="relative w-3 h-3">
        <span className="absolute inset-0 rounded-full bg-ml-accent animate-ping opacity-50" />
        <span className="absolute inset-0 rounded-full bg-ml-accent" />
      </div>
      <div>
        <div className="text-sm text-ml-text">{label}</div>
        <div className="text-[11px] text-ml-text-muted mt-0.5">
          Routing through configured AI provider · this may take a few seconds
        </div>
      </div>
    </div>
  );
}
