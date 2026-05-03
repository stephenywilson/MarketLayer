export function ProviderBadge({ provider }: { provider: string }) {
  const label = provider.toUpperCase();
  return (
    <span className="inline-flex items-center gap-2 rounded-sm border border-ml-border bg-ml-panel px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider text-ml-text-dim">
      <span className="text-ml-text-muted">provider</span>
      <span className="text-ml-accent">{label}</span>
    </span>
  );
}
