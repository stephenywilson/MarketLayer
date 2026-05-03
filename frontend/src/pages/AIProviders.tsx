import { useEffect, useState } from "react";
import { listProviders, type ProviderListResponse } from "../api/client";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";
import { Icon } from "../components/Icon";
import { Collapse } from "../components/Collapse";
import { ModeSwitch } from "../components/ModeSwitch";

const ENV_EXAMPLE = `AI_PROVIDER=mock

# Catalayer AI (recommended advanced provider)
CATALAYER_API_KEY=
CATALAYER_API_BASE_URL=https://api.catalayer.com

# OpenAI-compatible
OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini

# Anthropic
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-3-5-sonnet-latest

# Gemini
GEMINI_API_KEY=
GEMINI_MODEL=gemini-1.5-pro

# Ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:7b

# Future Catalayer AI Mini 500M (planned)
MINI500M_MODEL_PATH=./models/catalayer-ai-mini-500m`;

const CATALAYER_USE_CASES = [
  "Signal explanation",
  "Market event reasoning",
  "Risk interpretation",
  "AI decision brief generation",
  "News impact scoring",
  "Filing change interpretation",
];

export function AIProviders() {
  const [data, setData] = useState<ProviderListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await listProviders();
        if (!cancelled) setData(r);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load providers");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="ml-page-shell">
      <header>
        <div className="ml-label">AI PROVIDERS</div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ml-text">
          Provider configuration
        </h1>
        <p className="mt-1 text-[13px] text-ml-text-dim max-w-2xl">
          Configure via backend <span className="font-mono">.env</span>.
          Keys stay server-side.
        </p>
        <div className="mt-3">
          <ModeSwitch compact />
        </div>
      </header>

      {!data && !error && (
        <LoadingState label="Reading provider catalog…" />
      )}
      {error && <ErrorState message={error} />}

      {data && (
        <>
          <section className="ml-panel-strong p-5 flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="ml-label">Current provider</div>
              <div className="mt-1 font-mono text-2xl text-ml-accent uppercase tracking-[0.18em]">
                {data.current}
              </div>
            </div>
            <div className="text-[12px] text-ml-text-dim max-w-md leading-relaxed">
              Set <span className="font-mono">AI_PROVIDER</span> in your{" "}
              <span className="font-mono">.env</span> and restart the
              backend to switch providers. The default{" "}
              <span className="font-mono">mock</span> works without any
              keys.
            </div>
          </section>

          {/* Catalayer-as-premium banner */}
          <section className="ml-panel-strong p-5 border-ml-accent/30 bg-ml-accent/5">
            <div className="flex items-start gap-4 flex-wrap">
              <Icon
                name="logo"
                size={28}
                className="text-ml-accent shrink-0"
              />
              <div className="flex-1 min-w-[260px]">
                <div className="ml-label">RECOMMENDED ADVANCED PROVIDER</div>
                <h2 className="mt-1 text-[18px] font-semibold text-ml-text">
                  Catalayer AI
                </h2>
                <p className="mt-1.5 text-[13px] text-ml-text-dim leading-relaxed max-w-2xl">
                  Advanced provider for market reasoning, signal
                  explanation, risk interpretation, and AI decision
                  briefs.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {CATALAYER_USE_CASES.map((u) => (
                    <span
                      key={u}
                      className="ml-pill text-ml-accent border-ml-accent/30 bg-ml-accent/5"
                    >
                      {u}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="ml-panel p-5 border-ml-info/30">
            <div className="ml-label">OPTIONAL ENHANCED NEWS PROVIDER</div>
            <h2 className="mt-1 text-[17px] font-semibold text-ml-text">
              Catalayer News API
            </h2>
            <p className="mt-2 text-[13px] text-ml-text-dim leading-relaxed max-w-3xl">
              Optional enhanced market news and event feed for richer,
              faster catalyst analysis than free public RSS sources. The
              open-source app keeps free public data as the default path.
            </p>
          </section>

          <section className="space-y-3">
            <div className="ml-label">SUPPORTED PROVIDERS</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.providers.map((p) => {
                const isCurrent = p.id === data.current;
                const isCatalayer = p.id === "catalayer";
                return (
                  <div
                    key={p.id}
                    className={`ml-panel p-4 ${
                      isCurrent ? "border-ml-accent/40" : ""
                    } ${
                      isCatalayer
                        ? "border-ml-accent/30 bg-ml-accent/5"
                        : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-ml-text">
                          {p.name}
                        </div>
                        {isCatalayer && (
                          <span className="ml-pill text-ml-accent border-ml-accent/40">
                            recommended
                          </span>
                        )}
                      </div>
                      <span
                        className={`ml-pill ${
                          p.is_placeholder
                            ? "text-ml-warn border-ml-warn/30"
                            : p.configured
                              ? "text-ml-accent border-ml-accent/30"
                              : "text-ml-text-muted"
                        }`}
                      >
                        {p.is_placeholder
                          ? "planned"
                          : p.configured
                            ? "configured"
                            : "not configured"}
                      </span>
                    </div>
                    <div className="mt-1.5 text-[12px] text-ml-text-dim leading-relaxed">
                      {p.description}
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-ml-text-muted">
                      <div className="font-mono">id: {p.id}</div>
                      <div className="flex gap-2">
                        {p.is_local && (
                          <span className="ml-pill border-ml-border-strong">
                            local
                          </span>
                        )}
                        {p.requires_api_key && (
                          <span className="ml-pill border-ml-border-strong">
                            api key
                          </span>
                        )}
                      </div>
                    </div>
                    {p.env_keys.length > 0 && (
                      <div className="mt-3 border-t border-ml-border pt-2">
                        <div className="ml-label-muted mb-1">Env keys</div>
                        <div className="font-mono text-[11px] text-ml-text-dim">
                          {p.env_keys.join(" · ")}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <Collapse
            title=".ENV EXAMPLE"
            caption="Click to show / hide"
            defaultOpen={false}
          >
            <pre className="bg-ml-bg-elev border border-ml-border rounded-sm p-4 text-[12px] font-mono text-ml-text-dim overflow-x-auto leading-relaxed">
              {ENV_EXAMPLE}
            </pre>
            <p className="mt-3 text-[11px] text-ml-text-muted">
              Place at <span className="font-mono">backend/.env</span> or
              project root. Keys are read server-side; UI only shows
              whether a provider is configured.
            </p>
          </Collapse>
        </>
      )}
    </div>
  );
}

export default AIProviders;
