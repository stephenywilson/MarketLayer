import { useEffect, useMemo, useState } from "react";
import { getProNews, type Impact, type NewsCatalyst } from "../api/client";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { SelectControl } from "../components/SelectControl";

const IMPACT_OPTIONS = [
  { value: "all", label: "All impacts" },
  { value: "positive", label: "positive" },
  { value: "negative", label: "negative" },
  { value: "mixed", label: "mixed" },
  { value: "neutral", label: "neutral" },
];

export function NewsAnalysis() {
  const [rows, setRows] = useState<NewsCatalyst[]>([]);
  const [ticker, setTicker] = useState("");
  const [impact, setImpact] = useState<"all" | Impact>("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await getProNews();
        if (!cancelled) setRows(r.news);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load news analysis");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const tickerOk = !ticker || r.ticker.includes(ticker.toUpperCase());
      const impactOk = impact === "all" || r.ai_impact === impact;
      return tickerOk && impactOk;
    });
  }, [rows, ticker, impact]);

  if (error) return <div className="p-6"><ErrorState message={error} /></div>;
  if (!rows.length) return <div className="p-6"><LoadingState label="Parsing public headlines..." /></div>;

  return (
    <div className="ml-page-shell">
      <header>
        <div className="ml-label">NEWS ANALYSIS</div>
        <h1 className="mt-2 text-2xl font-semibold">News Analysis</h1>
        <p className="mt-1 text-[13px] text-ml-text-dim">
          Inspect which headlines influenced bullish, bearish, and neutral views.
        </p>
      </header>

      <section className="ml-panel p-4 flex flex-wrap gap-3">
        <input value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase())} className="ml-input max-w-[180px] font-mono" placeholder="Ticker" />
        <SelectControl
          value={impact}
          onChange={(value) => setImpact(value as "all" | Impact)}
          options={IMPACT_OPTIONS}
          className="w-[180px]"
        />
      </section>

      <section className="ml-panel">
        <div className="grid grid-cols-[80px,1fr,150px,130px,110px,110px] gap-3 px-4 py-2 border-b border-ml-border-strong text-[10px] uppercase tracking-[0.18em] text-ml-text-muted">
          <div>Ticker</div>
          <div>Headline</div>
          <div>Source</div>
          <div>Timestamp</div>
          <div>AI impact</div>
          <div>Direction</div>
        </div>
        {filtered.map((r, i) => (
          <div key={i} className="grid grid-cols-[80px,1fr,150px,130px,110px,110px] gap-3 px-4 py-2 border-b border-ml-border text-[12px]">
            <span className="font-mono text-ml-accent">{r.ticker}</span>
            <span className="truncate text-ml-text-dim">{r.headline}</span>
            <span className="text-ml-text-muted">{r.source}</span>
            <span className="font-mono text-[10px] text-ml-text-muted truncate">{r.timestamp}</span>
            <span>{r.ai_impact}</span>
            <span>{r.related_direction}</span>
          </div>
        ))}
      </section>
    </div>
  );
}

export default NewsAnalysis;
