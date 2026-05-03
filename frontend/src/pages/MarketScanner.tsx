import { useState } from "react";
import { postProMarketScan, type MarketReport } from "../api/client";
import { ErrorState } from "../components/ErrorState";
import { Icon } from "../components/Icon";
import { LoadingState } from "../components/LoadingState";
import { SelectControl } from "../components/SelectControl";
import { MarketReportView } from "./AnalyzeMarket";

const UNIVERSES: Record<string, string[]> = {
  default: ["AAPL", "MSFT", "NVDA", "TSLA", "AMD", "META", "GOOGL", "AMZN", "NFLX", "AVGO"],
  ai: ["NVDA", "AMD", "AVGO", "MSFT", "GOOGL", "META"],
  custom: [],
};

const UNIVERSE_OPTIONS = [
  { value: "default", label: "Default Watchlist" },
  { value: "ai", label: "AI infrastructure sample" },
  { value: "custom", label: "Custom tickers" },
];

const DEPTH_OPTIONS = [
  { value: "quick", label: "Quick" },
  { value: "detailed", label: "Detailed" },
];

export function MarketScanner() {
  const [universe, setUniverse] = useState("default");
  const [custom, setCustom] = useState("");
  const [depth, setDepth] = useState<"quick" | "detailed">("detailed");
  const [includeNews, setIncludeNews] = useState(true);
  const [includeFilings, setIncludeFilings] = useState(true);
  const [report, setReport] = useState<MarketReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    setReport(null);
    const tickers =
      universe === "custom"
        ? custom.split(",").map((t) => t.trim().toUpperCase()).filter(Boolean)
        : UNIVERSES[universe];
    try {
      const r = await postProMarketScan({
        universe: tickers,
        include_news: includeNews,
        include_filings: includeFilings,
        report_depth: depth,
      });
      setReport(r);
    } catch (e: any) {
      setError(e?.message || "Market scan failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ml-page-shell">
      <header>
        <div className="ml-label">MARKET SCANNER</div>
        <h1 className="mt-2 text-2xl font-semibold">Market Scanner</h1>
        <p className="mt-1 text-[13px] text-ml-text-dim">
          Run custom bullish/bearish market scans with visible settings.
        </p>
      </header>

      <section className="ml-panel p-5 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
        <div>
          <label className="ml-label-muted">Stock universe</label>
          <SelectControl
            value={universe}
            onChange={setUniverse}
            options={UNIVERSE_OPTIONS}
            className="mt-1.5"
          />
        </div>
        <div className="md:col-span-2">
          <label className="ml-label-muted">Custom tickers</label>
          <input value={custom} onChange={(e) => setCustom(e.target.value)} className="ml-input mt-1.5 font-mono" placeholder="NVDA,MSFT,AAPL" disabled={universe !== "custom"} />
        </div>
        <div>
          <label className="ml-label-muted">Scan depth</label>
          <SelectControl
            value={depth}
            onChange={(value) => setDepth(value as "quick" | "detailed")}
            options={DEPTH_OPTIONS}
            className="mt-1.5"
          />
        </div>
        <button type="button" onClick={run} disabled={loading} className="ml-button-primary">
          <Icon name="play" size={14} />
          {loading ? "Running..." : "Run Market Scan"}
        </button>
        <label className="flex items-center gap-2 text-[12px] text-ml-text-dim">
          <input type="checkbox" checked={includeNews} onChange={(e) => setIncludeNews(e.target.checked)} />
          News source
        </label>
        <label className="flex items-center gap-2 text-[12px] text-ml-text-dim">
          <input type="checkbox" checked={includeFilings} onChange={(e) => setIncludeFilings(e.target.checked)} />
          Filing source
        </label>
      </section>

      {loading && <LoadingState label="Running Pro market scan..." />}
      {error && <ErrorState message={error} />}
      {report && <MarketReportView report={report} />}
    </div>
  );
}

export default MarketScanner;
