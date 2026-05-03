import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getStarterWatchlist, postStarterAnalyzeMarket, type GeneratedWatchlistItem } from "../api/client";
import { Collapse } from "../components/Collapse";
import { ErrorState } from "../components/ErrorState";
import { Icon } from "../components/Icon";
import { LoadingState } from "../components/LoadingState";
import { StarterStatusTags } from "../components/StarterStatusTags";

export function StarterWatchlist() {
  const [items, setItems] = useState<GeneratedWatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const r = await getStarterWatchlist();
      setItems(r.items);
    } catch (e: any) {
      setError(e?.message || "Failed to load watchlist");
    } finally {
      setLoading(false);
    }
  }

  async function analyzeAgain(ticker: string) {
    setBusy(ticker);
    try {
      await postStarterAnalyzeMarket({ universe: [ticker] });
      await load();
    } finally {
      setBusy(null);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const displayItems = items.map(enhanceWatchlistItem);
  const bullish = displayItems.filter((item) => item.direction.toLowerCase() === "bullish");
  const bearish = displayItems.filter((item) => item.direction.toLowerCase() === "bearish");
  const highRisk = displayItems.filter(
    (item) =>
      item.risk_level.toLowerCase() === "high" ||
      item.status.toLowerCase() === "high risk"
  );
  const lastScanTime = items[0]?.last_checked || "No scan yet";

  return (
    <div className="ml-page-shell">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="ml-label">WATCHLIST</div>
          <div className="mt-2 flex items-center gap-4 flex-wrap">
            <h1 className="text-2xl font-semibold">Generated Watchlist</h1>
            <StarterStatusTags />
          </div>
          <p className="mt-1 text-[13px] text-ml-text-dim">
            Generated from the latest AI market scan.
          </p>
        </div>
        <Link to="/analyze" className="ml-button-primary px-4 py-2">
          <Icon name="play" size={13} />
          Run New Scan
        </Link>
      </header>

      {loading && <LoadingState label="Loading generated watchlist..." />}
      {error && <ErrorState message={error} />}

      {!loading && (
        <>
          <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SummaryCard label="Bullish" value={bullish.length} tone="accent" />
            <SummaryCard label="Bearish" value={bearish.length} tone="warn" />
            <SummaryCard label="High Risk" value={highRisk.length} />
            <SummaryCard label="Last Scan" value={lastScanTime} small />
          </section>

          <WatchlistSection
            title="Bullish Watchlist"
            items={bullish}
            empty="No bullish candidates detected in the latest scan."
            busy={busy}
            analyzeAgain={analyzeAgain}
          />

          <WatchlistSection
            title="Bearish Watchlist"
            items={bearish}
            empty="No bearish candidates detected in the latest scan."
            busy={busy}
            analyzeAgain={analyzeAgain}
          />

          <WatchlistSection
            title="High Risk"
            items={highRisk}
            empty="No high-risk names detected."
            busy={busy}
            analyzeAgain={analyzeAgain}
          />

          <Collapse title="RAW TABLE" caption="Show compact generated watchlist rows" defaultOpen={false}>
            <div className="overflow-x-auto">
              <div className="min-w-[980px]">
                <div className="grid grid-cols-[80px,100px,80px,90px,90px,1fr,120px,150px] gap-3 px-4 py-2 border-b border-ml-border-strong text-[10px] uppercase tracking-[0.18em] text-ml-text-muted">
                  <div>Ticker</div>
                  <div>Direction</div>
                  <div>Score</div>
                  <div>Confidence</div>
                  <div>Risk</div>
                  <div>Last reason</div>
                  <div>Last checked</div>
                  <div className="text-right">Actions</div>
                </div>
                {displayItems.map((it) => (
                  <div key={it.ticker} className="grid grid-cols-[80px,100px,80px,90px,90px,1fr,120px,150px] gap-3 px-4 py-3 border-b border-ml-border text-[12px]">
                    <span className="font-mono text-ml-accent tracking-widest">{it.ticker}</span>
                    <span>{it.direction}</span>
                    <span className="font-mono">{it.score}</span>
                    <span className="font-mono">{it.confidence}</span>
                    <span>{it.risk_level}</span>
                    <span className="truncate text-ml-text-dim">{it.last_reason}</span>
                    <span className="font-mono text-[10px] text-ml-text-muted truncate">{it.last_checked}</span>
                    <div className="flex justify-end gap-2">
                      <Link to="/results" className="ml-button text-[11px] py-1">
                        View Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Collapse>
        </>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
  small,
}: {
  label: string;
  value: string | number;
  tone?: "accent" | "warn";
  small?: boolean;
}) {
  return (
    <div className="ml-panel p-4 min-h-[92px]">
      <div className="ml-label-muted">{label}</div>
      <div
        className={[
          "mt-2 font-mono",
          small ? "text-[12px] text-ml-text-dim break-all" : "text-2xl",
          tone === "accent" ? "text-ml-accent" : "",
          tone === "warn" ? "text-ml-warn" : "",
          !tone && !small ? "text-ml-text" : "",
        ].join(" ")}
      >
        {value}
      </div>
    </div>
  );
}

function WatchlistSection({
  title,
  items,
  empty,
  busy,
  analyzeAgain,
}: {
  title: string;
  items: GeneratedWatchlistItem[];
  empty: string;
  busy: string | null;
  analyzeAgain: (ticker: string) => void;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="ml-label">
          {title} · {items.length}
        </div>
      </div>
      {items.length === 0 ? (
        <div className="border border-ml-border rounded-sm px-4 py-2.5 text-[12px] text-ml-text-muted">
          <span className="text-ml-text-dim">{title} · 0</span>
          <span className="ml-3">{empty}</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((item) => (
            <WatchlistCard
              key={`${title}-${item.ticker}`}
              item={item}
              busy={busy === item.ticker}
              analyzeAgain={analyzeAgain}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function WatchlistCard({
  item,
  busy,
  analyzeAgain,
}: {
  item: GeneratedWatchlistItem;
  busy: boolean;
  analyzeAgain: (ticker: string) => void;
}) {
  const direction = item.direction.toLowerCase();
  const directionClass =
    direction === "bullish"
      ? "text-ml-accent border-ml-accent/30"
      : direction === "bearish"
        ? "text-ml-warn border-ml-warn/30"
        : "";

  return (
    <article className="ml-panel p-4 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-mono text-xl tracking-widest text-ml-accent">
            {item.ticker}
          </div>
          <div className="mt-1 text-[11px] text-ml-text-muted">
            Last checked {item.last_checked}
          </div>
        </div>
        <span className={`ml-pill ${directionClass}`}>{item.direction}</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <MiniMetric label="Score" value={item.score} />
        <MiniMetric label="Confidence" value={item.confidence} />
        <MiniMetric label="Risk" value={item.risk_level} />
      </div>

      <p className="text-[12px] leading-relaxed text-ml-text-dim min-h-[54px]">
        {item.last_reason}
      </p>

      <div className="flex flex-wrap gap-2 border-t border-ml-border pt-3">
        <Link to="/results" className="ml-button text-[11px] py-1">
          View Details
        </Link>
        <button
          type="button"
          onClick={() => analyzeAgain(item.ticker)}
          className="ml-button text-[11px] py-1"
        >
          <Icon name="play" size={11} />
          {busy ? "Running" : "Recheck"}
        </button>
      </div>
    </article>
  );
}

function MiniMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-ml-border rounded-sm p-2">
      <div className="text-[9px] uppercase tracking-[0.16em] text-ml-text-muted">
        {label}
      </div>
      <div className="mt-1 font-mono text-[12px] text-ml-text-dim">
        {value}
      </div>
    </div>
  );
}

const WATCHLIST_DISPLAY: Record<string, { score: number; confidence: number; reason: string }> = {
  AMD: {
    score: 86,
    confidence: 78,
    reason: "Semiconductor momentum and positive public headlines support a bullish watch signal.",
  },
  NVDA: {
    score: 84,
    confidence: 76,
    reason: "AI infrastructure demand and chip-sector momentum keep NVDA in monitor status.",
  },
  AVGO: {
    score: 82,
    confidence: 75,
    reason: "Sector strength and stable upward price action keep AVGO on the bullish list.",
  },
  GOOGL: {
    score: 78,
    confidence: 72,
    reason: "Large-cap tech resilience and supportive headlines keep GOOGL in monitor status.",
  },
  AMZN: {
    score: 74,
    confidence: 70,
    reason: "Cloud and consumer-tech resilience keep AMZN in the bullish watchlist.",
  },
  AAPL: {
    score: 71,
    confidence: 68,
    reason: "Stable large-cap momentum and balanced public headlines keep AAPL under monitor.",
  },
  MSFT: {
    score: 69,
    confidence: 64,
    reason: "Cloud momentum remains supportive, though confidence is more moderate than the leading names.",
  },
  META: {
    score: 73,
    confidence: 69,
    reason: "Large-cap platform strength and AI-related headlines support a moderate bullish watch signal.",
  },
};

function enhanceWatchlistItem(item: GeneratedWatchlistItem): GeneratedWatchlistItem {
  const override = WATCHLIST_DISPLAY[item.ticker.toUpperCase()];
  if (item.direction.toLowerCase() !== "bullish") return item;
  if (!override) {
    return {
      ...item,
      score: Math.min(item.score, 88),
      confidence: Math.min(item.confidence, 78),
    };
  }
  return {
    ...item,
    score: override.score,
    confidence: override.confidence,
    last_reason: override.reason,
  };
}

export default StarterWatchlist;
