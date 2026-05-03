import { useEffect, useMemo, useState } from "react";
import {
  listProviders,
  testProvider,
  type ProviderInfo,
  type ProviderListResponse,
} from "../api/client";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { Icon } from "../components/Icon";
import { SelectControl } from "../components/SelectControl";
import { StarterStatusTags } from "../components/StarterStatusTags";
import { useMode } from "../hooks/useMode";

const PROVIDER_COPY: Record<string, string> = {
  catalayer:
    "Best for market reasoning, news impact analysis, and bullish/bearish reports.",
  mock:
    "No key required. Uses sample AI outputs for testing the interface.",
  openai: "Use OpenAI or any compatible chat-completions endpoint.",
  anthropic: "Use Anthropic Claude for market analysis and report generation.",
  gemini: "Use Google Gemini through the public Generative Language API.",
  ollama: "Use a local Ollama model for offline analysis.",
};

export function ConnectAI() {
  const { mode, setMode } = useMode();
  const [data, setData] = useState<ProviderListResponse | null>(null);
  const [provider, setProvider] = useState("ollama");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [model, setModel] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await listProviders();
        if (cancelled) return;
        setData(r);
        setProvider(r.current === "mock" ? "ollama" : r.current);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load providers");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = useMemo<ProviderInfo | undefined>(
    () => data?.providers.find((p) => p.id === provider),
    [data, provider]
  );
  const needsBase = provider === "openai" || provider === "ollama" || provider === "custom";
  const needsModel = provider === "openai" || provider === "anthropic" || provider === "gemini" || provider === "ollama";

  async function saveProvider() {
    localStorage.setItem(
      "marketlayer:starter:provider-draft",
      JSON.stringify({ provider, baseUrl, model, hasKey: !!apiKey })
    );
    setMessage(
      "AI provider preference saved in this browser. The local backend uses server-side environment settings to activate real providers."
    );
  }

  async function runTest() {
    setMessage(null);
    const r = await testProvider({
      provider,
      api_key: apiKey || undefined,
      base_url: baseUrl || undefined,
      model: model || undefined,
    });
    setMessage(r.message);
  }

  function useMock() {
    setProvider("mock");
    setApiKey("");
    setBaseUrl("");
    setModel("");
    localStorage.setItem(
      "marketlayer:starter:provider-draft",
      JSON.stringify({ provider: "mock", hasKey: false })
    );
    setMessage("Demo Mode selected. It works without an API key.");
  }

  if (error) return <div className="p-6"><ErrorState message={error} /></div>;
  if (!data) return <div className="p-6"><LoadingState label="Loading AI providers..." /></div>;

  return (
    <div className="ml-page-shell">
      <header>
        <div>
          <div className="ml-label">SETTINGS</div>
          <div className="mt-2 flex items-center justify-between gap-4 flex-wrap">
            <h1 className="text-3xl font-semibold">Settings</h1>
            <StarterStatusTags />
          </div>
          <p className="mt-2 text-[13px] text-ml-text-dim">
            Manage AI providers, mode selection, and local market report
            settings.
          </p>
        </div>
      </header>

      <section className="ml-panel-strong p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="ml-label">Experience Mode</div>
            <p className="mt-2 text-[12px] text-ml-text-dim">
              Choose how much control you want.
            </p>
            <p className="mt-1 text-[12px] text-ml-text-dim">
              Current mode:{" "}
              <span className="font-medium text-ml-text">
                {mode === "starter" ? "Starter Mode" : "Advanced Mode"}
              </span>
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <ExperienceModeCard
            title="Starter Mode"
            active={mode === "starter"}
            body="One-click bullish/bearish reports. Best for beginners."
            onClick={() => setMode("starter")}
          />
          <ExperienceModeCard
            title="Advanced Mode"
            active={mode === "pro"}
            body="Full control over data, news, strategy packs, signals, risk, and AI providers."
            onClick={() => setMode("pro")}
          />
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-[1fr,360px] gap-5">
        <div className="ml-panel-strong p-5 space-y-4">
          <div>
            <div className="ml-label">CONNECT AI</div>
            <p className="mt-2 text-[12px] leading-relaxed text-ml-text-dim">
              Add one AI API key to generate real market reports, or use Demo
              Mode to try the app.
            </p>
          </div>

          <div>
            <label className="ml-label-muted">AI Provider</label>
            <SelectControl
              value={provider}
              onChange={setProvider}
              options={data.providers.map((p) => ({ value: p.id, label: p.name }))}
              className="mt-1.5"
            />
          </div>

          {provider !== "mock" && (
            <div>
              <label className="ml-label-muted">API key</label>
              <input
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="ml-input mt-1.5 font-mono"
                type="password"
                placeholder="Paste key for local setup"
              />
            </div>
          )}

          {needsBase && (
            <div>
              <label className="ml-label-muted">Base URL / Endpoint</label>
              <input
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                className="ml-input mt-1.5 font-mono"
                placeholder="Optional endpoint override"
              />
            </div>
          )}

          {needsModel && (
            <div>
              <label className="ml-label-muted">Model</label>
              <input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="ml-input mt-1.5 font-mono"
                placeholder="Optional model name"
              />
            </div>
          )}

          <div className="flex flex-wrap gap-2 border-t border-ml-border pt-4">
            <button type="button" onClick={saveProvider} className="ml-button-primary">
              Save AI Key
            </button>
            <button type="button" onClick={runTest} className="ml-button">
              Test Connection
            </button>
            <button type="button" onClick={useMock} className="ml-button">
              Use Demo Mode
            </button>
          </div>

          {message && (
            <div className="text-[12px] text-ml-accent bg-ml-accent/10 border border-ml-accent/30 rounded p-3">
              {message}
            </div>
          )}

          <p className="text-[11px] text-ml-text-muted">
            Security note: API keys stay local/server-side and are never
            exposed in the frontend.
          </p>
        </div>

        <aside className="space-y-4">
          <ProviderHelp id="catalayer" title="Catalayer AI" recommended />
          <div className="ml-panel p-4">
            <div className="font-medium text-ml-text">Bring your own AI key</div>
            <p className="mt-2 text-[12px] text-ml-text-dim leading-relaxed">
              Use OpenAI, Claude, Gemini, Ollama, or any OpenAI-compatible
              provider.
            </p>
            <div className="mt-3 text-[11px] text-ml-text-muted">
              Current selection:{" "}
              <span className="font-mono text-ml-accent">
                {selected?.name || provider}
              </span>
            </div>
          </div>
          <ProviderHelp id="mock" title="Demo Mode" />
        </aside>
      </section>
    </div>
  );
}

function ProviderHelp({
  id,
  title,
  recommended,
}: {
  id: string;
  title: string;
  recommended?: boolean;
}) {
  return (
    <div className={`ml-panel p-4 ${recommended ? "border-ml-accent/40" : ""}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="font-medium text-ml-text">{title}</div>
        {recommended && (
          <span className="ml-pill text-ml-accent border-ml-accent/40">
            Recommended
          </span>
        )}
      </div>
      <p className="mt-2 text-[12px] text-ml-text-dim leading-relaxed">
        {PROVIDER_COPY[id] || "Configure this provider from the backend environment."}
      </p>
      <div className="mt-3 flex items-center gap-2 text-[11px] text-ml-text-muted">
        <Icon name={id === "mock" ? "play" : "shield"} size={12} />
        {id === "mock" ? "No API key required." : "Keys stay local to your setup."}
      </div>
    </div>
  );
}

function ExperienceModeCard({
  title,
  body,
  active,
  onClick,
}: {
  title: string;
  body: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "text-left border rounded-sm p-4 transition-colors",
        active
          ? "border-ml-accent/50 bg-ml-accent/10"
          : "border-ml-border bg-ml-panel hover:border-ml-border-strong",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="font-medium text-ml-text">{title}</div>
        {active && (
          <span className="ml-pill text-ml-accent border-ml-accent/30">
            Current
          </span>
        )}
      </div>
      <p className="mt-2 text-[12px] leading-relaxed text-ml-text-dim">
        {body}
      </p>
    </button>
  );
}

export default ConnectAI;
