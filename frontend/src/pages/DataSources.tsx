import { useEffect, useState } from "react";
import { getDataLake, type DataLakeStatus } from "../api/client";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";
import { StatCard } from "../components/StatCard";
import { Icon } from "../components/Icon";
import { Collapse } from "../components/Collapse";

const KIND_ICON: Record<string, "database" | "shield" | "bell" | "search"> = {
  price: "database",
  filings: "shield",
  news: "bell",
  fundamentals: "search",
};

interface FuturePlaceholder {
  id: string;
  name: string;
  kind: string;
  market: string;
  note: string;
  homepage: string;
  requires_api_key: boolean;
}

const FUTURE_SOURCES: FuturePlaceholder[] = [
  {
    id: "polygon",
    name: "Polygon.io",
    kind: "price",
    market: "US equities · options",
    note: "Tick-level OHLCV + corporate actions. API key required.",
    homepage: "https://polygon.io",
    requires_api_key: true,
  },
  {
    id: "tiingo",
    name: "Tiingo",
    kind: "price",
    market: "US equities · IEX",
    note: "Adjusted EOD + intraday bars. API key required.",
    homepage: "https://www.tiingo.com",
    requires_api_key: true,
  },
  {
    id: "iex_cloud",
    name: "IEX Cloud",
    kind: "price",
    market: "US equities · fundamentals",
    note: "Tier-based access. API key required.",
    homepage: "https://iexcloud.io",
    requires_api_key: true,
  },
  {
    id: "binance",
    name: "Binance",
    kind: "price",
    market: "Crypto · spot + perp",
    note: "Crypto market support is on the V0.3 roadmap.",
    homepage: "https://www.binance.com",
    requires_api_key: false,
  },
  {
    id: "coinbase",
    name: "Coinbase Exchange",
    kind: "price",
    market: "Crypto · USD pairs",
    note: "Crypto market support is on the V0.3 roadmap.",
    homepage: "https://www.coinbase.com",
    requires_api_key: false,
  },
  {
    id: "catalayer_news",
    name: "Catalayer News",
    kind: "news",
    market: "US equities · curated",
    note: "Catalayer-curated US-equity news feed. Roadmap V0.3.",
    homepage: "https://api.catalayer.com",
    requires_api_key: true,
  },
];

export function DataSources() {
  const [data, setData] = useState<DataLakeStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setError(null);
    try {
      const r = await getDataLake();
      setData(r);
    } catch (e: any) {
      setError(e?.message || "Failed to load data sources");
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  if (error)
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <ErrorState message={error} />
      </div>
    );
  if (!data)
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <LoadingState label="Probing data sources…" />
      </div>
    );

  const liveCount = data.sources.filter((s) => s.live).length;

  return (
    <div className="ml-page-shell">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="ml-label">DATA SOURCES</div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ml-text">
            Market data connectors
          </h1>
          <p className="mt-1 text-[13px] text-ml-text-dim max-w-2xl">
            Free public US-equity data. No API keys required.
          </p>
        </div>
        <button onClick={refresh} className="ml-button">
          Refresh
        </button>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon="database"
          label="LIVE SOURCES"
          value={`${liveCount}/${data.sources.length}`}
          description="With no API key required"
          valueTone={liveCount === data.sources.length ? "accent" : "warn"}
        />
        <StatCard
          icon="check"
          label="API KEYS"
          value="0 needed"
          description="Out-of-the-box experience"
          valueTone="accent"
        />
        <StatCard
          icon="backtest"
          label="MARKET"
          value="US equities"
          description="Crypto planned · V0.3"
        />
        <StatCard
          icon="ghost"
          label="LAST CHECK"
          value={data.last_check.replace("T", " ").replace("Z", "")}
          description="TTL: 5min prices · 1hr filings · 5min news"
        />
      </div>

      <section>
        <div className="ml-label mb-3">ACTIVE DEFAULTS</div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {data.sources.map((s) => (
            <div
              key={s.id}
              className="ml-panel p-5 flex flex-col gap-3 hover:border-ml-border-strong"
            >
              <div className="flex items-center justify-between">
                <Icon
                  name={KIND_ICON[s.kind] || "database"}
                  size={18}
                  className="text-ml-text-dim"
                />
                <span
                  className={
                    s.live
                      ? "ml-pill text-ml-accent border-ml-accent/30"
                      : "ml-pill text-ml-warn border-ml-warn/30"
                  }
                >
                  {s.live ? "live" : "fallback"}
                </span>
              </div>
              <div>
                <div className="ml-label-muted">{s.kind.toUpperCase()}</div>
                <div className="mt-1 text-[15px] text-ml-text font-medium">
                  {s.name}
                </div>
              </div>
              <p className="text-[12px] text-ml-text-dim leading-relaxed">
                {s.note}
              </p>
              <div className="h-px bg-ml-border" />
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-3 text-ml-text-muted">
                  <span className="font-mono">id: {s.id}</span>
                  <span>·</span>
                  <span className="font-mono">cache: {s.cached_keys}</span>
                </div>
                <a
                  href={s.homepage}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-ml-accent hover:text-ml-accent-soft inline-flex items-center gap-1"
                >
                  source ↗
                </a>
              </div>
              {s.requires_api_key && (
                <div className="text-[11px] text-ml-warn">
                  Requires API key (not configured by default).
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <Collapse
        title="PLANNED CONNECTORS"
        caption={`${FUTURE_SOURCES.length} on roadmap · click to expand`}
        defaultOpen={false}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {FUTURE_SOURCES.map((s) => (
            <div
              key={s.id}
              className="ml-panel p-5 flex flex-col gap-3 opacity-80 border-dashed"
            >
              <div className="flex items-center justify-between">
                <Icon
                  name="database"
                  size={18}
                  className="text-ml-text-muted"
                />
                <span className="ml-pill text-ml-text-muted">planned</span>
              </div>
              <div>
                <div className="ml-label-muted">{s.market}</div>
                <div className="mt-1 text-[15px] text-ml-text font-medium">
                  {s.name}
                </div>
              </div>
              <p className="text-[12px] text-ml-text-dim leading-relaxed">
                {s.note}
              </p>
              <div className="h-px bg-ml-border" />
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-mono text-ml-text-muted">id: {s.id}</span>
                <a
                  href={s.homepage}
                  target="_blank"
                  rel="noreferrer"
                  className="text-ml-accent hover:text-ml-accent-soft"
                >
                  source ↗
                </a>
              </div>
              {s.requires_api_key && (
                <div className="text-[11px] text-ml-warn">
                  Will require API key when integrated.
                </div>
              )}
            </div>
          ))}
        </div>
      </Collapse>
    </div>
  );
}

export default DataSources;
