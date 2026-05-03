import { useEffect, useState } from "react";
import { getCommandCenter, type SystemLogEntry } from "../api/client";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";

export function SystemLogs() {
  const [logs, setLogs] = useState<SystemLogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await getCommandCenter();
        if (!cancelled) setLogs(r.system_logs);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load logs");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <div className="p-6"><ErrorState message={error} /></div>;
  if (!logs.length) return <div className="p-6"><LoadingState label="Loading system logs..." /></div>;

  return (
    <div className="ml-page-shell">
      <header>
        <div className="ml-label">SYSTEM LOGS</div>
        <h1 className="mt-2 text-2xl font-semibold">System Logs</h1>
        <p className="mt-1 text-[13px] text-ml-text-dim">
          Local diagnostics for providers, signals, risk filters, and reports.
        </p>
      </header>
      <section className="ml-panel">
        {logs.map((l, i) => (
          <div key={i} className="grid grid-cols-[180px,80px,150px,1fr] gap-3 px-4 py-2 border-b border-ml-border text-[12px]">
            <span className="font-mono text-[10px] text-ml-text-muted">{l.ts}</span>
            <span className="ml-pill">{l.level}</span>
            <span className="font-mono text-ml-text-dim">{l.source}</span>
            <span className="text-ml-text-dim">{l.message}</span>
          </div>
        ))}
      </section>
    </div>
  );
}

export default SystemLogs;
