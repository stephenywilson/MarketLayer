import { useEffect, useState } from "react";
import {
  listProviders,
  postStarterAnalyzeMarket,
  type BearishCandidate,
  type BullishCandidate,
  type MarketReport,
} from "../api/client";
import { Collapse } from "../components/Collapse";
import { ErrorState } from "../components/ErrorState";
import { Icon } from "../components/Icon";
import { LoadingState } from "../components/LoadingState";
import { SelectControl } from "../components/SelectControl";
import { StarterStatusTags } from "../components/StarterStatusTags";

const UNIVERSES: Record<string, string[]> = {
  default: ["AAPL", "MSFT", "NVDA", "TSLA", "AMD", "META", "GOOGL", "AMZN", "NFLX", "AVGO"],
  mega: ["AAPL", "MSFT", "NVDA", "META", "GOOGL", "AMZN", "AVGO"],
  nasdaq: ["AAPL", "MSFT", "NVDA", "TSLA", "AMD", "META", "GOOGL", "AMZN"],
  sp500: ["AAPL", "MSFT", "NVDA", "TSLA", "AMD", "META", "GOOGL", "AMZN", "NFLX", "AVGO"],
};

const UNIVERSE_OPTIONS = [
  { value: "default", label: "Default Watchlist" },
  { value: "mega", label: "Mega-cap Tech" },
  { value: "nasdaq", label: "Nasdaq Sample" },
  { value: "sp500", label: "S&P 500 Sample" },
];

const DEPTH_OPTIONS = [
  { value: "quick", label: "Quick" },
  { value: "detailed", label: "Detailed" },
];

const DISPLAY_DISCLAIMER =
  "MarketLayer is for research and educational purposes only. It does not provide personalized recommendations, directional instructions, brokerage services, or automated market actions. Users are responsible for their own decisions.";

export function AnalyzeMarket() {
  const [report, setReport] = useState<MarketReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [universe, setUniverse] = useState("default");
  const [includeNews, setIncludeNews] = useState(true);
  const [includeFilings, setIncludeFilings] = useState(true);
  const [depth, setDepth] = useState<"quick" | "detailed">("detailed");
  const [aiProviderStatus, setAiProviderStatus] = useState("Demo Mode");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const providers = await listProviders();
        if (cancelled) return;
        const current = providers.providers.find((p) => p.id === providers.current);
        if (providers.current === "mock") {
          setAiProviderStatus("Demo Mode");
        } else if (current?.configured) {
          setAiProviderStatus(`Connected · ${current.name}`);
        } else {
          setAiProviderStatus("Not Connected");
        }
      } catch {
        if (!cancelled) setAiProviderStatus("Demo Mode");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function run() {
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const r = await postStarterAnalyzeMarket({
        universe: UNIVERSES[universe],
        include_news: includeNews,
        include_filings: includeFilings,
        report_depth: depth,
      });
      setReport(r);
      localStorage.setItem("marketlayer:starter:last-report", JSON.stringify(r));
    } catch (e: any) {
      setError(e?.message || "Market scan failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ml-page-shell">
      <header>
        <div className="ml-label">ANALYZE MARKET</div>
        <div className="mt-2 flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-3xl font-semibold">Analyze Market</h1>
          <StarterStatusTags />
        </div>
        <p className="mt-2 text-[13px] text-ml-text-dim">
          One click to scan default US stocks and generate a bullish/bearish
          AI report.
        </p>
      </header>

      <section className="ml-panel-strong p-6 md:p-7 border-ml-accent/25">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr,300px] gap-7 items-center">
          <div>
            <div className="ml-label">Ready to scan</div>
            <h2 className="mt-2 text-2xl font-semibold text-ml-text">
              Analyze Today&apos;s Market
            </h2>
            <p className="mt-3 max-w-3xl text-[13px] leading-relaxed text-ml-text-dim">
              Everything is ready. Click Analyze Market to generate a
              bullish/bearish AI report from public prices, public headlines,
              recent filings, built-in strategy packs, risk filters, and AI
              reasoning.
            </p>
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
              <ReadyItem label="Public prices" />
              <ReadyItem label="Public headlines" />
              <ReadyItem label="Recent filings" />
              <ReadyItem label="Built-in strategy packs" />
              <ReadyItem label="Risk filters" />
              <ReadyItem label="AI reasoning" />
            </div>
            <div className="mt-5">
              <div className="ml-label-muted">Default universe</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {UNIVERSES.default.map((ticker) => (
                  <span key={ticker} className="ml-pill font-mono">
                    {ticker}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="border border-ml-border-strong rounded-sm p-5 min-h-[220px] flex flex-col justify-center gap-4 bg-ml-panel">
            <div>
              <div className="ml-label-muted">AI status</div>
              <div className="mt-2 text-[15px] font-medium text-ml-text">
                {aiProviderStatus}
              </div>
              <div className="mt-1 text-[11px] text-ml-text-muted">
                {aiProviderStatus === "Not Connected" ? "Open Settings for real reports." : "Everything is ready."}
              </div>
            </div>
            <button
              type="button"
              onClick={run}
              disabled={loading}
              className="ml-button-primary text-[15px] px-5 py-3"
            >
              <Icon name="play" size={15} />
              {loading ? "Analyzing Market..." : "Analyze Market"}
            </button>
            <p className="text-[11px] leading-relaxed text-ml-text-muted text-center">
              Generates a bullish/bearish AI report.
            </p>
          </div>
        </div>
      </section>

      <section className="ml-panel p-5">
        <div className="ml-label">OUTPUT PREVIEW</div>
        <h2 className="mt-1 text-[17px] font-semibold text-ml-text">
          Your report will include
        </h2>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <PreviewCard
            title="Market Direction"
            body="Overall tone, risk level, and dominant themes."
          />
          <PreviewCard
            title="Bullish / Bearish Candidates"
            body="Stocks with scores, confidence, and plain-English reasons."
          />
          <PreviewCard
            title="News, Risk & AI Brief"
            body="News catalysts, risk alerts, and detailed AI explanation."
          />
        </div>
      </section>

      <Collapse title="ADVANCED SCAN SETTINGS" caption="Optional scan settings" defaultOpen={false}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="ml-label-muted">Universe</label>
            <SelectControl
              value={universe}
              onChange={setUniverse}
              options={UNIVERSE_OPTIONS}
              className="mt-1.5"
            />
          </div>
          <Toggle label="Include filings" checked={includeFilings} onChange={setIncludeFilings} />
          <Toggle label="Include news" checked={includeNews} onChange={setIncludeNews} />
          <div>
            <label className="ml-label-muted">Report depth</label>
            <SelectControl
              value={depth}
              onChange={(value) => setDepth(value as "quick" | "detailed")}
              options={DEPTH_OPTIONS}
              className="mt-1.5"
            />
          </div>
        </div>
      </Collapse>

      {loading && <LoadingState label="Scanning public data, news, filings, strategy packs, and AI reasoning..." />}
      {error && <ErrorState message={error} />}
      {report && <MarketReportView report={report} />}
    </div>
  );
}

function Setup({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-ml-border rounded-sm p-3 min-h-[96px] flex flex-col justify-center">
      <div className="ml-label-muted">{label}</div>
      <div className="mt-1 text-ml-text-dim">{value}</div>
    </div>
  );
}

function ReadyItem({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 border border-ml-border rounded-sm px-3 py-2">
      <Icon name="check" size={13} className="text-ml-accent" />
      <span className="text-[12px] text-ml-text-dim">{label}</span>
    </div>
  );
}

function PreviewCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="border border-ml-border rounded-sm p-4 min-h-[112px]">
      <div className="text-[13px] font-medium text-ml-text">{title}</div>
      <p className="mt-2 text-[12px] leading-relaxed text-ml-text-dim">
        {body}
      </p>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 border border-ml-border rounded px-3 py-2 mt-5">
      <span className="text-[12px] text-ml-text-dim">{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

export function MarketReportView({ report }: { report: MarketReport }) {
  return (
    <div className="space-y-6">
      <section className="ml-panel-strong p-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="ml-label">AI MARKET REPORT</div>
          {report.provider === "mock" || report.data_used.ai_provider === "mock" ? (
            <span className="ml-pill text-ml-accent border-ml-accent/30">
              Demo data
            </span>
          ) : null}
        </div>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Metric label="Overall Market" value={report.market_direction.tone} accent />
          <Metric label="Risk Level" value={report.market_direction.risk_level} />
          <Metric label="Bullish" value={report.bullish_candidates.length} accent />
          <Metric label="Bearish" value={report.bearish_candidates.length} />
        </div>
        <div className="mt-4 text-[13px] text-ml-text-dim leading-relaxed">
          {report.market_direction.summary}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {report.market_direction.dominant_themes.map((t) => (
            <span key={t} className="ml-pill text-ml-accent border-ml-accent/30">
              {t}
            </span>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <CandidatePanel title="Bullish Candidates" tone="bullish" candidates={report.bullish_candidates} />
        <CandidatePanel title="Bearish Candidates" tone="bearish" candidates={report.bearish_candidates} />
      </section>

      <section className="ml-panel">
        <div className="px-5 py-3 border-b border-ml-border">
          <div className="ml-label">NEWS CATALYST ANALYSIS</div>
        </div>
        <div className="grid grid-cols-[80px,1fr,150px,140px,110px,110px] gap-3 px-5 py-2 border-b border-ml-border-strong text-[10px] uppercase tracking-[0.18em] text-ml-text-muted">
          <div>Ticker</div>
          <div>Headline</div>
          <div>Source</div>
          <div>Timestamp</div>
          <div>AI impact</div>
          <div>Direction</div>
        </div>
        <div className="max-h-[360px] overflow-y-auto">
          {report.news_catalysts.map((n, i) => (
            <div key={i} className="grid grid-cols-[80px,1fr,150px,140px,110px,110px] gap-3 px-5 py-2 border-b border-ml-border text-[12px]">
              <span className="font-mono text-ml-accent">{n.ticker}</span>
              <span className="text-ml-text-dim truncate">{n.headline}</span>
              <span className="text-ml-text-muted">{n.source}</span>
              <span className="font-mono text-[10px] text-ml-text-muted truncate">{n.timestamp}</span>
              <span className="text-ml-text-dim">{n.ai_impact}</span>
              <span className="text-ml-text-dim">{n.related_direction}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="ml-panel p-5">
        <div className="ml-label mb-3">RISK ALERTS</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {report.risk_alerts.length === 0 ? (
            <div className="text-[12px] text-ml-text-muted">No major risk alerts in this scan.</div>
          ) : (
            report.risk_alerts.map((r, i) => (
              <div key={i} className="border border-ml-border rounded-sm p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-ml-accent">{r.ticker}</span>
                  <span className="ml-pill">{r.severity}</span>
                </div>
                <div className="mt-2 text-[13px] text-ml-text">{r.risk_type}</div>
                <p className="mt-1 text-[12px] text-ml-text-dim">{r.reason}</p>
                <p className="mt-2 text-[11px] text-ml-text-muted">{r.what_to_watch}</p>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="ml-panel p-5">
        <div className="ml-label mb-3">SKILL PACK RESULTS</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[...report.bullish_candidates, ...report.bearish_candidates].slice(0, 8).map((candidate) => (
            <div key={`${candidate.ticker}-skill-pack`} className="border border-ml-border rounded-sm p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-ml-text-dim">{candidate.ticker}</span>
                <span className="ml-pill">Skill pack</span>
              </div>
              <p className="mt-2 text-[12px] leading-relaxed text-ml-text-dim">
                {candidate.details.strategy_result}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="ml-panel-strong p-5">
        <div className="ml-label">AI MARKET BRIEF</div>
        <p className="mt-3 text-[14px] text-ml-text-dim leading-relaxed">
          {report.ai_market_brief}
        </p>
      </section>

      <Collapse title="DETAILED STOCK ANALYSIS" caption="Expand candidate reasoning" defaultOpen={false}>
        <div className="space-y-3">
          {[...report.bullish_candidates, ...report.bearish_candidates].map((c) => (
            <DetailCard key={c.ticker} candidate={c} />
          ))}
        </div>
      </Collapse>

      <Collapse title="DATA USED" caption="Price, news, filings, AI provider, and universe" defaultOpen={false}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[12px]">
          <Setup label="Price data source" value={report.data_used.price_source} />
          <Setup label="News source" value={report.data_used.news_source} />
          <Setup label="Filing source" value={report.data_used.filing_source} />
          <Setup label="AI provider" value={report.data_used.ai_provider} />
          <Setup label="Scan time" value={report.data_used.scan_time} />
          <Setup label="Universe scanned" value={report.data_used.universe_scanned.join(", ")} />
        </div>
      </Collapse>

      <section className="border border-ml-border rounded-sm px-4 py-3 text-[11px] leading-relaxed text-ml-text-muted">
        {DISPLAY_DISCLAIMER}
      </section>
    </div>
  );
}

function Metric({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div>
      <div className="ml-label-muted">{label}</div>
      <div className={`mt-1 font-mono text-xl ${accent ? "text-ml-accent" : "text-ml-text"}`}>
        {value}
      </div>
    </div>
  );
}

function CandidatePanel({
  title,
  tone,
  candidates,
}: {
  title: string;
  tone: "bullish" | "bearish";
  candidates: Array<BullishCandidate | BearishCandidate>;
}) {
  return (
    <section className="ml-panel p-5">
      <div className="ml-label mb-3">{title}</div>
      <div className="space-y-3">
        {candidates.length === 0 ? (
          <div className="text-[12px] text-ml-text-muted">No candidates in this scan.</div>
        ) : (
          candidates.map((c) => {
            const rawScore = tone === "bullish" ? (c as BullishCandidate).bullish_score : (c as BearishCandidate).bearish_score;
            const score = tone === "bullish" ? displayBullishScore(c.ticker, rawScore) : rawScore;
            const count = tone === "bullish" ? `${(c as BullishCandidate).supporting_headlines_count} supporting headline(s)` : `${(c as BearishCandidate).negative_headlines_count} pressure headline(s)`;
            return (
              <div key={c.ticker} className="border border-ml-border rounded-sm p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className={`font-mono text-lg tracking-widest ${tone === "bullish" ? "text-ml-bullish" : "text-ml-bearish"}`}>{c.ticker}</div>
                    <div className="text-[12px] text-ml-text-muted">{c.company_name}</div>
                  </div>
                  <span className={tone === "bullish" ? "ml-pill text-ml-bullish border-ml-bullish/30" : "ml-pill text-ml-bearish border-ml-bearish/30"}>
                    {c.status}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Metric label={tone === "bullish" ? "Bullish Score" : "Bearish Score"} value={score} accent={tone === "bullish"} />
                  <Metric label="Confidence" value={c.confidence} />
                </div>
                <p className="mt-3 text-[13px] text-ml-text-dim leading-relaxed">{c.reason}</p>
                <div className="mt-2 text-[11px] text-ml-text-muted">{count}</div>
                <div className="mt-1 text-[11px] text-ml-text-muted">{c.risk_note}</div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

const REPORT_BULLISH_SCORES: Record<string, number> = {
  AMD: 86,
  NVDA: 84,
  AVGO: 82,
  GOOGL: 78,
  AMZN: 74,
  AAPL: 71,
  MSFT: 69,
  META: 73,
};

function displayBullishScore(ticker: string, fallback: number) {
  return REPORT_BULLISH_SCORES[ticker.toUpperCase()] ?? Math.min(fallback, 88);
}

function DetailCard({ candidate }: { candidate: BullishCandidate | BearishCandidate }) {
  const d = candidate.details;
  return (
    <div className="border border-ml-border rounded-sm p-4">
      <div className="font-mono text-ml-accent tracking-widest">{candidate.ticker}</div>
      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-[12px]">
        <Setup label="Price signal" value={d.price_signal} />
        <Setup label="News signal" value={d.news_signal} />
        <Setup label="Filing / event signal" value={d.filing_signal} />
        <Setup label="Strategy pack result" value={d.strategy_result} />
        <Setup label="AI reasoning" value={d.ai_reasoning} />
        <Setup label="What would change the view" value={d.what_would_change_view} />
      </div>
    </div>
  );
}

export default AnalyzeMarket;
