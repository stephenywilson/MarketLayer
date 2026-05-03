import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { listProviders } from "../api/client";
import { useMode } from "../hooks/useMode";

type AIStatus = "No Provider" | "AI Connected" | "AI Not Connected";

export function StarterStatusTags() {
  const { mode } = useMode();
  const [aiStatus, setAiStatus] = useState<AIStatus>("No Provider");
  const [providerName, setProviderName] = useState("Mock");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const providers = await listProviders();
        if (cancelled) return;
        const current = providers.providers.find((p) => p.id === providers.current);
        if (providers.current === "mock" || current?.id === "mock") {
          setAiStatus("No Provider");
          setProviderName("Mock");
        } else if (current?.configured) {
          setAiStatus("AI Connected");
          setProviderName(current.name);
        } else {
          setAiStatus("AI Not Connected");
          setProviderName("None");
        }
      } catch {
        if (!cancelled) {
          setAiStatus("No Provider");
          setProviderName("Mock");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <StatusTag>{mode === "pro" ? "Pro" : "Starter"}</StatusTag>
      <StatusTag title={providerName !== "None" ? `Provider: ${providerName}` : undefined}>
        {aiStatus}
      </StatusTag>
      <StatusTag>Public Data</StatusTag>
      <StatusTag tone="warn">Trading Off</StatusTag>
    </div>
  );
}

function StatusTag({
  children,
  title,
  tone,
}: {
  children: ReactNode;
  title?: string;
  tone?: "warn";
}) {
  return (
    <span
      title={title}
      className={[
        "inline-flex h-8 items-center rounded-sm border px-3 py-0 text-[10px] uppercase tracking-[0.16em]",
        tone === "warn"
          ? "border-ml-warn/25 text-ml-warn"
          : "border-ml-border-strong text-ml-text-muted",
      ].join(" ")}
    >
      {children}
    </span>
  );
}
