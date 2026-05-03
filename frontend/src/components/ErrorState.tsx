export function ErrorState({ message }: { message: string }) {
  return (
    <div className="ml-panel border-ml-danger/40 p-5 flex items-start gap-3">
      <span className="font-mono text-ml-danger text-sm mt-0.5">!</span>
      <div className="flex-1">
        <div className="text-sm text-ml-danger font-medium">
          Request failed
        </div>
        <div className="text-[12px] text-ml-text-dim mt-1 break-words">
          {message}
        </div>
        <div className="text-[11px] text-ml-text-muted mt-2">
          Verify the backend is running on port 8000 and your provider is
          configured in <span className="font-mono">.env</span>.
        </div>
      </div>
    </div>
  );
}
