import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  getStarterReport,
  getStarterResults,
  getStarterWatchlist,
  listProviders,
  postProMarketScan,
  postStarterAnalyzeMarket,
  setProviderConfig,
  testProvider,
  type BearishCandidate,
  type BullishCandidate,
  type GeneratedWatchlistItem,
  type MarketReport,
  type ProviderInfo,
  type ProviderListResponse,
  type RiskAlert,
  type StarterResultSummary,
} from "../api/client";
// ErrorState removed — errors now surface as a transient Toast (top-right)
// plus a red ring on the Settings button and a red AI Provider section in
// the drawer. See Toast() and the SettingsDrawer error block below.
import { Icon } from "../components/Icon";
import { LoadingState } from "../components/LoadingState";
import { OnboardingGuide, ONBOARDING_KEY } from "../components/OnboardingGuide";
import { SelectControl } from "../components/SelectControl";
import { useMode } from "../hooks/useMode";

const DEFAULT_UNIVERSE = [
  "AAPL",
  "MSFT",
  "NVDA",
  "TSLA",
  "AMD",
  "META",
  "GOOGL",
  "AMZN",
  "NFLX",
  "AVGO",
];

type MarketStatus = "enabled" | "planned";
type ScanStyleId = "balanced" | "aggressive" | "defensive" | "news-catalyst";
type ReportDepth = "simple" | "detailed" | "analyst";
type DetailTab = "overview" | "candidates" | "news" | "risk" | "skill-packs" | "data" | "disclaimer";
type PipelineStatus = "idle" | "running" | "complete" | "error";
type AIPanelTab = "brief" | "reasoning" | "evidence" | "log";
type ProTabId = "brief" | "candidate" | "evidence" | "risk" | "data" | "log";

const PRO_TABS: Array<{ id: ProTabId; label: string }> = [
  { id: "brief", label: "Brief" },
  { id: "candidate", label: "Candidate" },
  { id: "evidence", label: "Evidence" },
  { id: "risk", label: "Risk" },
  { id: "data", label: "Data" },
  { id: "log", label: "Log" },
];

interface MarketRegistryEntry {
  id: string;
  name: string;
  status: MarketStatus;
  defaultUniverse: string[];
  dataSources: string[];
  skillPacks: string[];
  scanStyles: ScanStyleId[];
}

interface ScanStyle {
  id: ScanStyleId;
  name: string;
  description: string;
  weights: {
    momentum: number;
    news: number;
    risk: number;
    confidence: number;
  };
}

interface SkillPack {
  id: string;
  name: string;
  starterDescription: string;
  proDescription: string;
  defaultEnabled: boolean;
  requiredData: string[];
  scoringContribution: string;
  riskNotes: string;
}

const MARKET_REGISTRY: MarketRegistryEntry[] = [
  {
    id: "us-stocks",
    name: "US Stocks",
    status: "enabled",
    defaultUniverse: DEFAULT_UNIVERSE,
    dataSources: ["Public prices", "Public headlines", "Recent filings"],
    skillPacks: ["momentum", "news-catalyst", "risk-radar", "earnings-watch", "mean-reversion", "sector-rotation"],
    scanStyles: ["balanced", "aggressive", "defensive", "news-catalyst"],
  },
  { id: "crypto", name: "Crypto", status: "planned", defaultUniverse: [], dataSources: [], skillPacks: [], scanStyles: [] },
  { id: "hk-stocks", name: "Hong Kong Stocks", status: "planned", defaultUniverse: [], dataSources: [], skillPacks: [], scanStyles: [] },
  { id: "japan-stocks", name: "Japan Stocks", status: "planned", defaultUniverse: [], dataSources: [], skillPacks: [], scanStyles: [] },
  { id: "uk-stocks", name: "UK Stocks", status: "planned", defaultUniverse: [], dataSources: [], skillPacks: [], scanStyles: [] },
  { id: "china-a", name: "China A-Shares", status: "planned", defaultUniverse: [], dataSources: [], skillPacks: [], scanStyles: [] },
];

const SCAN_STYLES: ScanStyle[] = [
  {
    id: "balanced",
    name: "Balanced Mode",
    description: "Recommended default. Balances opportunity and risk.",
    weights: { momentum: 0.3, news: 0.3, risk: 0.25, confidence: 0.15 },
  },
  {
    id: "aggressive",
    name: "Aggressive Mode",
    description: "Prioritizes stronger movement candidates. Higher volatility allowed.",
    weights: { momentum: 0.45, news: 0.3, risk: 0.1, confidence: 0.15 },
  },
  {
    id: "defensive",
    name: "Defensive Mode",
    description: "Stricter quality checks with stronger confirmation requirements.",
    weights: { momentum: 0.2, news: 0.2, risk: 0.45, confidence: 0.15 },
  },
  {
    id: "news-catalyst",
    name: "News Catalyst Mode",
    description: "Prioritizes public headlines, filings, and event catalysts.",
    weights: { momentum: 0.2, news: 0.5, risk: 0.15, confidence: 0.15 },
  },
];

const SKILL_PACKS: SkillPack[] = [
  {
    id: "momentum",
    name: "Momentum Pack",
    starterDescription: "Finds stocks with stronger price momentum and confirmation.",
    proDescription: "Evaluates relative price movement, continuation strength, and confirmation quality.",
    defaultEnabled: true,
    requiredData: ["prices", "volume"],
    scoringContribution: "Momentum score and confirmation confidence",
    riskNotes: "Can overstate strength when volatility is elevated.",
  },
  {
    id: "news-catalyst",
    name: "News Catalyst Pack",
    starterDescription: "Finds stocks influenced by public headlines and market events.",
    proDescription: "Maps public headlines and events to bullish, bearish, or neutral candidate pressure.",
    defaultEnabled: true,
    requiredData: ["headlines", "ticker mapping"],
    scoringContribution: "Headline impact and catalyst direction",
    riskNotes: "Headline quality and freshness can affect confidence.",
  },
  {
    id: "risk-radar",
    name: "Risk Radar Pack",
    starterDescription: "Flags volatility, earnings risk, weak confirmation, and data uncertainty.",
    proDescription: "Applies volatility, event proximity, confirmation, and data quality checks.",
    defaultEnabled: true,
    requiredData: ["prices", "headlines", "filings"],
    scoringContribution: "Risk reduction and warning status",
    riskNotes: "Strict filtering can reduce candidate count.",
  },
  {
    id: "earnings-watch",
    name: "Earnings Watch Pack",
    starterDescription: "Looks for earnings-related momentum and event risk.",
    proDescription: "Tracks earnings proximity, reaction drift, and event-driven volatility.",
    defaultEnabled: false,
    requiredData: ["filings", "events", "prices"],
    scoringContribution: "Event risk and reaction drift",
    riskNotes: "Earnings windows can raise volatility.",
  },
  {
    id: "mean-reversion",
    name: "Mean Reversion Pack",
    starterDescription: "Finds overextended stocks that may revert toward recent ranges.",
    proDescription: "Measures near-term extension versus recent range and confirmation quality.",
    defaultEnabled: false,
    requiredData: ["prices"],
    scoringContribution: "Overextension and reversion pressure",
    riskNotes: "Can conflict with momentum in strong trend regimes.",
  },
  {
    id: "sector-rotation",
    name: "Sector Rotation Pack",
    starterDescription: "Finds sector strength and sympathy movement.",
    proDescription: "Evaluates sector-level strength and cross-stock sympathy movement.",
    defaultEnabled: false,
    requiredData: ["prices", "sector map"],
    scoringContribution: "Sector strength and sympathy support",
    riskNotes: "Sector pressure can change quickly around macro events.",
  },
];

const PRO_MARKET_OPTIONS = MARKET_REGISTRY.map((market) => ({
  value: market.id,
  label: market.status === "enabled" ? market.name : `${market.name} · Coming soon`,
  disabled: market.status !== "enabled",
}));

const PACK_PRESET_OPTIONS = [
  { value: "core", label: "Packs: Core 3" },
  { value: "catalyst", label: "Packs: Momentum + News" },
  { value: "all", label: "Packs: All 6" },
  { value: "custom", label: "Packs: Custom..." },
];

const REPORT_DEPTH_OPTIONS = [
  { value: "simple", label: "Report: Simple" },
  { value: "detailed", label: "Report: Detailed" },
];

const DETAIL_TABS: Array<{ id: DetailTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "candidates", label: "Candidates" },
  { id: "news", label: "News" },
  { id: "risk", label: "Risk" },
  { id: "skill-packs", label: "Skill Packs" },
  { id: "data", label: "Data Used" },
  { id: "disclaimer", label: "Disclaimer" },
];

const PIPELINE_STEPS = [
  "Loading public prices",
  "Reading headlines",
  "Checking filings",
  "Running skill packs",
  "Applying risk filters",
  "Generating AI report",
];

export function StarterHome() {
  const { mode, setMode } = useMode();
  const navigate = useNavigate();
  const isPro = mode === "pro";

  const [marketId, setMarketId] = useState("us-stocks");
  const [scanStyle, setScanStyle] = useState<ScanStyleId>("balanced");
  const [activePacks, setActivePacks] = useState<string[]>(
    SKILL_PACKS.filter((pack) => pack.defaultEnabled).map((pack) => pack.id)
  );
  const [reportDepth, setReportDepth] = useState<ReportDepth>("detailed");
  const [universeChoice, setUniverseChoice] = useState("default");
  const [customTickers, setCustomTickers] = useState("");
  const [riskStyle, setRiskStyle] = useState("balanced");
  const [backtestWindow, setBacktestWindow] = useState("6m");
  const [aiProvider, setAiProvider] = useState("");

  const [latestReport, setLatestReport] = useState<MarketReport | null>(null);
  const [recentReports, setRecentReports] = useState<StarterResultSummary[]>([]);
  const [watchlist, setWatchlist] = useState<GeneratedWatchlistItem[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [detailedOpen, setDetailedOpen] = useState(false);
  const [detailTab, setDetailTab] = useState<DetailTab>("overview");
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus>("idle");
  const [pipelineStep, setPipelineStep] = useState<number | null>(null);
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const [aiPanelTab, setAiPanelTab] = useState<AIPanelTab>("brief");
  const [proPanelTab, setProPanelTab] = useState<ProTabId>("brief");
  const [selectedCandidate, setSelectedCandidate] = useState<BullishCandidate | BearishCandidate | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Toast is the transient UI for an error; `error` itself sticks around so the
  // Settings button can stay red and the Settings drawer can highlight the
  // AI Provider section until the user resolves it.
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    if (!error) return;
    setToastVisible(true);
    const t = setTimeout(() => setToastVisible(false), 5000);
    return () => clearTimeout(t);
  }, [error]);

  const selectedMarket = MARKET_REGISTRY.find((market) => market.id === marketId) ?? MARKET_REGISTRY[0];
  const selectedStyle = SCAN_STYLES.find((style) => style.id === scanStyle) ?? SCAN_STYLES[0];
  const selectedPacks = SKILL_PACKS.filter((pack) => activePacks.includes(pack.id));

  async function loadConsole() {
    // Clear any cached report that predates versioned caching (fake/template data).
    const REPORT_CACHE_KEY = "marketlayer:starter:last-report";
    const REPORT_CACHE_VER = "marketlayer:starter:last-report-ver";
    const CURRENT_VER = "2";
    if (localStorage.getItem(REPORT_CACHE_VER) !== CURRENT_VER) {
      localStorage.removeItem(REPORT_CACHE_KEY);
      localStorage.setItem(REPORT_CACHE_VER, CURRENT_VER);
    }
    setLoading(true);
    setError(null);
    try {
      const [results, watch, providerData] = await Promise.all([
        getStarterResults(),
        getStarterWatchlist(),
        listProviders().catch(() => null),
      ]);
      // Restore the last-configured provider (skip "mock" — that means unconfigured).
      if (providerData && providerData.current && providerData.current !== "mock") {
        setAiProvider(providerData.current);
      }
      setRecentReports(results.reports);
      setWatchlist(watch.items.map(enhanceWatchlistItem));
      if (results.reports[0]) {
        const report = await getStarterReport(results.reports[0].scan_id);
        setLatestReport(report);
        setPipelineStatus("complete");
        setPipelineStep(PIPELINE_STEPS.length);
        setScanLogs(systemLogs(report));
      } else {
        // Backend restarted and lost in-memory reports — fall back to last
        // cached report from localStorage (written after every successful scan).
        try {
          const cached = localStorage.getItem("marketlayer:starter:last-report");
          if (cached) {
            const report = JSON.parse(cached) as MarketReport;
            setLatestReport(report);
            setPipelineStatus("complete");
            setPipelineStep(PIPELINE_STEPS.length);
            setScanLogs(systemLogs(report));
          } else {
            setLatestReport(null);
            setPipelineStatus("idle");
            setPipelineStep(null);
            setScanLogs([]);
          }
        } catch {
          setLatestReport(null);
          setPipelineStatus("idle");
          setPipelineStep(null);
          setScanLogs([]);
        }
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load MarketLayer console");
    } finally {
      setLoading(false);
    }
  }

  async function runScan() {
    const stamp = () => shortTime(new Date().toISOString());
    setScanning(true);
    setError(null);
    setPipelineStatus("running");
    setPipelineStep(0);
    setAiPanelTab("log");
    // Single canonical log header — pipeline strip + Log tab share PIPELINE_STEPS naming.
    setScanLogs([`${stamp()} Market selected.`]);
    try {
      for (let i = 0; i < PIPELINE_STEPS.length; i += 1) {
        setPipelineStep(i);
        setScanLogs((items) => [...items, `${stamp()} ${PIPELINE_STEPS[i]}...`]);
        await wait(120);
      }
      const universe =
        isPro && universeChoice === "custom"
          ? customTickers
              .split(/[,\s]+/)
              .map((ticker) => ticker.trim().toUpperCase())
              .filter(Boolean)
          : selectedMarket.defaultUniverse.length
            ? selectedMarket.defaultUniverse
            : DEFAULT_UNIVERSE;
      const depth = reportDepth === "simple" ? "quick" : "detailed";
      const body = {
        universe,
        include_news: true,
        include_filings: true,
        report_depth: depth as "quick" | "detailed",
        strategy_packs: activePacks,
      };
      const report = isPro
        ? await postProMarketScan(body)
        : await postStarterAnalyzeMarket(body);
      localStorage.setItem("marketlayer:starter:last-report", JSON.stringify(report));
      localStorage.setItem("marketlayer:starter:last-report-ver", "2");
      setLatestReport(report);
      setDetailedOpen(isPro);
      setPipelineStatus("complete");
      setPipelineStep(PIPELINE_STEPS.length);
      setScanLogs((items) => [...items, `${stamp()} Watchlist updated.`]);
      setAiPanelTab("brief");
      await loadConsole();
    } catch (e: any) {
      setPipelineStatus("error");
      setScanLogs((items) => [...items, `${stamp()} Scan failed.`]);
      setError(e?.message || "Market scan failed");
    } finally {
      setScanning(false);
    }
  }

  useEffect(() => {
    loadConsole();
  }, []);

  useEffect(() => {
    if (isPro) return;
    try {
      const seen = window.localStorage.getItem(ONBOARDING_KEY);
      if (!seen) setOnboardingOpen(true);
    } catch {
      // localStorage unavailable — silently skip auto-open
    }
  }, [isPro]);

  // Starter only has Brief and Evidence tabs — clamp proPanelTab if user
  // switched away from Pro while a Pro-only tab was active.
  useEffect(() => {
    if (!isPro && proPanelTab !== "brief" && proPanelTab !== "evidence") {
      setProPanelTab("brief");
    }
  }, [isPro, proPanelTab]);

  function closeOnboarding(markSeen: boolean) {
    if (markSeen) {
      try {
        window.localStorage.setItem(ONBOARDING_KEY, "1");
      } catch {
        // ignore quota / privacy errors
      }
    }
    setOnboardingOpen(false);
  }

  function restartOnboarding() {
    setSettingsOpen(false);
    setOnboardingOpen(true);
  }

  const bullish = useMemo(
    () => latestReport?.bullish_candidates ?? [],
    [latestReport]
  );
  const bearish = useMemo(
    () => latestReport?.bearish_candidates ?? [],
    [latestReport]
  );
  const bullishWatch = watchlist.filter((item) => item.direction === "bullish");
  const bearishWatch = watchlist.filter((item) => item.direction === "bearish");
  const highRiskWatch = watchlist.filter(
    (item) => item.risk_level === "High" || item.status === "High Risk"
  );
  const confidence = latestReport
    ? averageConfidence([...latestReport.bullish_candidates, ...latestReport.bearish_candidates])
    : 0;

  async function selectRecentReport(scanId: string) {
    const report = await getStarterReport(scanId);
    setLatestReport(report);
    setDetailedOpen(true);
  }

  return (
    <div className="ml-console-enter h-full overflow-hidden text-ml-text flex flex-col ml-console-page-bg">
      <header className="h-14 border-b border-ml-border ml-console-nav-bg">
        <div className="h-full px-5 md:px-7 flex items-center gap-4">
          <button type="button" onClick={() => navigate(isPro ? "/pro/command-center" : "/")} className="flex items-center gap-3">
            <img src="/ml-logo_white.png?v=20260502" alt="MarketLayer" className="h-7 w-auto" />
          </button>
          <div className="hidden lg:block text-[10.5px] uppercase tracking-[0.18em] text-ml-text-muted">
            AI Quant Decision Console
          </div>
          <div className="flex-1" />
          <ModeSegment
            mode={mode}
            onChange={(nextMode) => {
              if (nextMode === mode) return;
              // Just flip mode — no navigation, so StarterHome doesn't remount
              // and the burst / color transitions actually get to play.
              setMode(nextMode);
            }}
          />
        </div>
      </header>

      <main className="flex-1 overflow-hidden px-5 md:px-7 py-5 pb-20 ml-console-page-bg">
        <div key={mode} className="ml-mode-swap h-full w-full overflow-hidden">
          <StarterDecisionBoard
            mode={mode}
            report={latestReport}
            bullish={bullish}
            bearish={bearish}
            risks={latestReport ? riskAlertItems(latestReport) : []}
            scanning={scanning}
            confidence={confidence}
            pipelineStatus={pipelineStatus}
            currentStep={pipelineStep}
            selectedCandidate={selectedCandidate}
            proPanelTab={proPanelTab}
            scanLogs={scanLogs}
            activePacks={selectedPacks}
            onProPanelTabChange={setProPanelTab}
            onSelectCandidate={(candidate) => {
              setSelectedCandidate(candidate);
              // Starter has no Candidate tab; jump to Evidence so the user sees catalysts.
              setProPanelTab(isPro ? "candidate" : "evidence");
            }}
            onDetails={() => {
              if (!latestReport) return;
              setDetailedOpen(true);
              setDetailTab("overview");
            }}
          />
        </div>
      </main>

      {detailedOpen && latestReport && (
        <StarterReportOverlay
          report={latestReport}
          activeTab={detailTab}
          onTabChange={setDetailTab}
          onClose={() => setDetailedOpen(false)}
        />
      )}

      <ConsoleActionBar
        mode={mode}
        marketId={marketId}
        scanStyle={scanStyle}
        activePacks={activePacks}
        universeChoice={universeChoice}
        aiProvider={aiProvider}
        scanning={scanning}
        hasReport={!!latestReport}
        hasError={!!error}
        onMarketChange={(value) => {
          const market = MARKET_REGISTRY.find((entry) => entry.id === value);
          if (market?.status === "enabled") setMarketId(value);
        }}
        onScanStyleChange={setScanStyle}
        onUniverseChoiceChange={setUniverseChoice}
        onAiProviderChange={setAiProvider}
        onSkillsApply={(ids) => setActivePacks(ids)}
        onRun={runScan}
        onDetailedReport={() => {
          if (!latestReport) return;
          setDetailedOpen(true);
          setDetailTab("overview");
        }}
        onSettings={() => setSettingsOpen(true)}
      />

      {settingsOpen && (
        <SettingsDrawer
          mode={mode}
          scanning={scanning}
          provider={aiProvider}
          providerError={error}
          onProviderChange={setAiProvider}
          onClearProviderError={() => setError(null)}
          onRestartGuide={restartOnboarding}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {onboardingOpen && !isPro && !scanning && (
        <OnboardingGuide onClose={closeOnboarding} />
      )}

      {toastVisible && error && (
        <ErrorToast message={error} onDismiss={() => setToastVisible(false)} />
      )}
    </div>
  );
}

function ControlColumn({
  mode,
  marketId,
  scanStyle,
  activePacks,
  reportDepth,
  universeChoice,
  customTickers,
  riskStyle,
  backtestWindow,
  aiProvider,
  selectedMarket,
  selectedStyle,
  selectedPacks,
  scanning,
  onMarketChange,
  onScanStyleChange,
  onPackToggle,
  onReportDepthChange,
  onUniverseChoiceChange,
  onCustomTickersChange,
  onRiskStyleChange,
  onBacktestWindowChange,
  onAiProviderChange,
  onRun,
  onSettings,
  onPro,
}: {
  mode: "starter" | "pro";
  marketId: string;
  scanStyle: ScanStyleId;
  activePacks: string[];
  reportDepth: ReportDepth;
  universeChoice: string;
  customTickers: string;
  riskStyle: string;
  backtestWindow: string;
  aiProvider: string;
  selectedMarket: MarketRegistryEntry;
  selectedStyle: ScanStyle;
  selectedPacks: SkillPack[];
  scanning: boolean;
  onMarketChange: (value: string) => void;
  onScanStyleChange: (value: ScanStyleId) => void;
  onPackToggle: (packId: string) => void;
  onReportDepthChange: (value: ReportDepth) => void;
  onUniverseChoiceChange: (value: string) => void;
  onCustomTickersChange: (value: string) => void;
  onRiskStyleChange: (value: string) => void;
  onBacktestWindowChange: (value: string) => void;
  onAiProviderChange: (value: string) => void;
  onRun: () => void;
  onSettings: () => void;
  onPro: () => void;
}) {
  const isPro = mode === "pro";
  return (
    <aside className="space-y-4">
      <section className="ml-panel-strong p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="ml-label">{isPro ? "Control Panel" : "Starter Setup"}</div>
          <span className={isPro ? "ml-pill-live" : "ml-pill"}>{isPro ? "Full control" : "Autopilot"}</span>
        </div>
        <p className="mt-3 text-[13px] leading-relaxed text-ml-text-dim">
          {isPro
            ? "Same console. Full control over markets, data, skill packs, risk filters, and AI reasoning."
            : "Everything is preconfigured. Choose a market style, select skill packs, and click Analyze Market."}
        </p>

        {isPro ? (
          <ProControls
            marketId={marketId}
            universeChoice={universeChoice}
            customTickers={customTickers}
            activePacks={activePacks}
            riskStyle={riskStyle}
            backtestWindow={backtestWindow}
            aiProvider={aiProvider}
            reportDepth={reportDepth}
            onMarketChange={onMarketChange}
            onUniverseChoiceChange={onUniverseChoiceChange}
            onCustomTickersChange={onCustomTickersChange}
            onPackToggle={onPackToggle}
            onRiskStyleChange={onRiskStyleChange}
            onBacktestWindowChange={onBacktestWindowChange}
            onAiProviderChange={onAiProviderChange}
            onReportDepthChange={onReportDepthChange}
          />
        ) : (
          <StarterAutopilotControls
            marketId={marketId}
            scanStyle={scanStyle}
            activePacks={activePacks}
            reportDepth={reportDepth}
            selectedMarket={selectedMarket}
            selectedStyle={selectedStyle}
            selectedPacks={selectedPacks}
            onMarketChange={onMarketChange}
            onScanStyleChange={onScanStyleChange}
            onPackToggle={onPackToggle}
            onReportDepthChange={onReportDepthChange}
            onSettings={onSettings}
          />
        )}

        <button type="button" onClick={onRun} disabled={scanning} className="mt-5 w-full ml-button-primary py-2.5">
          <Icon name="play" size={14} />
          {scanning ? "Analyzing..." : "Analyze Market"}
        </button>
        {isPro && (
          <div className="mt-2 grid grid-cols-1 gap-2">
            <button type="button" className="ml-button w-full">
              Analyze Asset
            </button>
            <button type="button" className="ml-button w-full">
              Run Backtest Snapshot
            </button>
          </div>
        )}
      </section>

      {mode === "starter" && (
        <button
          type="button"
          onClick={onPro}
          className="w-full border border-ml-border bg-ml-panel px-4 py-3 text-left transition-colors hover:border-ml-border-strong hover:bg-ml-panel-hover"
        >
          <div className="text-[12px] font-medium text-ml-text">Need more control?</div>
          <div className="mt-1 text-[12px] text-ml-accent">Open Pro Mode →</div>
          <div className="mt-2 text-[10px] leading-relaxed text-ml-text-muted">
            Strategies · Signals · Risk · Providers
          </div>
        </button>
      )}
    </aside>
  );
}

function StarterAutopilotControls({
  marketId,
  scanStyle,
  activePacks,
  reportDepth,
  selectedMarket,
  selectedStyle,
  selectedPacks,
  onMarketChange,
  onScanStyleChange,
  onPackToggle,
  onReportDepthChange,
  onSettings,
}: {
  marketId: string;
  scanStyle: ScanStyleId;
  activePacks: string[];
  reportDepth: ReportDepth;
  selectedMarket: MarketRegistryEntry;
  selectedStyle: ScanStyle;
  selectedPacks: SkillPack[];
  onMarketChange: (value: string) => void;
  onScanStyleChange: (value: ScanStyleId) => void;
  onPackToggle: (packId: string) => void;
  onReportDepthChange: (value: ReportDepth) => void;
  onSettings: () => void;
}) {
  return (
    <div className="mt-4 space-y-4">
      <ControlBlock title="Market" meta="US Stocks enabled">
        <div className="grid grid-cols-2 gap-2">
          {MARKET_REGISTRY.map((market) => (
            <button
              key={market.id}
              type="button"
              disabled={market.status === "planned"}
              onClick={() => onMarketChange(market.id)}
              className={[
                "border px-2.5 py-2 text-left text-[11px] transition-colors disabled:cursor-not-allowed disabled:opacity-45",
                marketId === market.id
                  ? "border-ml-accent/55 bg-ml-accent/10 text-ml-accent"
                  : "border-ml-border bg-ml-bg text-ml-text-dim hover:border-ml-border-strong",
              ].join(" ")}
            >
              <div>{market.name}</div>
              <div className="mt-1 text-[9px] uppercase tracking-[0.14em] text-ml-text-muted">
                {market.status === "enabled" ? "Enabled" : "Planned"}
              </div>
            </button>
          ))}
        </div>
      </ControlBlock>

      <ControlBlock title="Scan Style" meta={shortStyleName(selectedStyle.name)}>
        <div className="space-y-2">
          {SCAN_STYLES.map((style) => (
            <button
              key={style.id}
              type="button"
              onClick={() => onScanStyleChange(style.id)}
              className={[
                "w-full border px-3 py-2 text-left transition-colors",
                scanStyle === style.id
                  ? "border-ml-accent/50 bg-ml-accent/10"
                  : "border-ml-border bg-ml-bg hover:border-ml-border-strong",
              ].join(" ")}
            >
              <div className={scanStyle === style.id ? "text-[12px] text-ml-accent" : "text-[12px] text-ml-text"}>
                {style.name}
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-ml-text-muted">{style.description}</p>
            </button>
          ))}
        </div>
      </ControlBlock>

      <ControlBlock title="Skill Packs" meta={`${selectedPacks.length} active`}>
        <div className="space-y-2">
          {SKILL_PACKS.map((pack) => {
            const active = activePacks.includes(pack.id);
            return (
              <button
                key={pack.id}
                type="button"
                onClick={() => onPackToggle(pack.id)}
                className={[
                  "w-full border px-3 py-2 text-left transition-colors",
                  active
                    ? "border-ml-accent/45 bg-ml-accent/10"
                    : "border-ml-border bg-ml-bg hover:border-ml-border-strong",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className={active ? "text-[12px] text-ml-accent" : "text-[12px] text-ml-text"}>
                    {pack.name}
                  </span>
                  <span className="text-[10px] text-ml-text-muted">{active ? "On" : "Off"}</span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-ml-text-muted">{pack.starterDescription}</p>
              </button>
            );
          })}
        </div>
      </ControlBlock>

      <ControlBlock title="AI Provider" meta="Ready">
        <div className="flex items-center justify-between gap-3 border border-ml-border bg-ml-bg px-3 py-2">
          <span className="text-[12px] text-ml-text-dim">Demo AI / Connected AI</span>
          <button type="button" onClick={onSettings} className="text-[11px] text-ml-accent">
            Connect AI Key
          </button>
        </div>
      </ControlBlock>

      <ControlBlock title="Data" meta="Public">
        <div className="grid grid-cols-1 gap-2">
          {selectedMarket.dataSources.map((source) => (
            <div key={source} className="border border-ml-border bg-ml-bg px-3 py-2 text-[12px] text-ml-text-dim">
              {source}
            </div>
          ))}
        </div>
      </ControlBlock>

      <ControlBlock title="Report Depth" meta="Default">
        <SegmentedChoice
          value={reportDepth}
          options={[
            { value: "simple", label: "Simple" },
            { value: "detailed", label: "Detailed" },
          ]}
          onChange={(value) => onReportDepthChange(value as ReportDepth)}
        />
      </ControlBlock>
    </div>
  );
}

function ProControls({
  marketId,
  universeChoice,
  customTickers,
  activePacks,
  riskStyle,
  backtestWindow,
  aiProvider,
  reportDepth,
  onMarketChange,
  onUniverseChoiceChange,
  onCustomTickersChange,
  onPackToggle,
  onRiskStyleChange,
  onBacktestWindowChange,
  onAiProviderChange,
  onReportDepthChange,
}: {
  marketId: string;
  universeChoice: string;
  customTickers: string;
  activePacks: string[];
  riskStyle: string;
  backtestWindow: string;
  aiProvider: string;
  reportDepth: ReportDepth;
  onMarketChange: (value: string) => void;
  onUniverseChoiceChange: (value: string) => void;
  onCustomTickersChange: (value: string) => void;
  onPackToggle: (packId: string) => void;
  onRiskStyleChange: (value: string) => void;
  onBacktestWindowChange: (value: string) => void;
  onAiProviderChange: (value: string) => void;
  onReportDepthChange: (value: ReportDepth) => void;
}) {
  return (
    <div className="mt-4 space-y-4">
      <EditableControl label="Market">
        <SelectControl value={marketId} onChange={onMarketChange} options={PRO_MARKET_OPTIONS} />
      </EditableControl>
      <EditableControl label="Universe">
        <SelectControl
          value={universeChoice}
          onChange={onUniverseChoiceChange}
          options={[
            { value: "default", label: "Default Watchlist" },
            { value: "mega-cap-tech", label: "Mega-cap Tech" },
            { value: "nasdaq-sample", label: "Nasdaq Sample" },
            { value: "sp500-sample", label: "S&P 500 Sample" },
            { value: "custom", label: "Custom Tickers" },
          ]}
        />
      </EditableControl>
      <EditableControl label="Custom Tickers">
        <input
          value={customTickers}
          onChange={(event) => onCustomTickersChange(event.target.value)}
          className="ml-input font-mono"
          placeholder="AAPL, MSFT, NVDA"
        />
      </EditableControl>
      <EditableSummary label="Data Sources" value="yfinance · public RSS · SEC EDGAR · Catalayer News optional" />
      <EditableControl label="Skill Packs">
        <div className="grid grid-cols-1 gap-2">
          {SKILL_PACKS.map((pack) => {
            const active = activePacks.includes(pack.id);
            return (
              <button
                key={pack.id}
                type="button"
                onClick={() => onPackToggle(pack.id)}
                className={[
                  "border px-3 py-2 text-left transition-colors",
                  active ? "border-ml-accent/45 bg-ml-accent/10" : "border-ml-border bg-ml-bg",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12px] text-ml-text">{pack.name}</span>
                  <span className={active ? "text-[10px] text-ml-accent" : "text-[10px] text-ml-text-muted"}>
                    {active ? "Enabled" : "Disabled"}
                  </span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-ml-text-muted">{pack.proDescription}</p>
              </button>
            );
          })}
        </div>
      </EditableControl>
      <EditableSummary label="Skill Pack Parameters" value="v0.1 structure ready · per-pack tuning planned" />
      <EditableControl label="Risk Style">
        <SelectControl
          value={riskStyle}
          onChange={onRiskStyleChange}
          options={[
            { value: "balanced", label: "Balanced" },
            { value: "aggressive", label: "Aggressive" },
            { value: "defensive", label: "Defensive" },
            { value: "custom", label: "Custom" },
          ]}
        />
      </EditableControl>
      <EditableControl label="Backtest Window">
        <SelectControl
          value={backtestWindow}
          onChange={onBacktestWindowChange}
          options={[
            { value: "3m", label: "3M" },
            { value: "6m", label: "6M" },
            { value: "1y", label: "1Y" },
            { value: "custom", label: "Custom" },
          ]}
        />
      </EditableControl>
      <EditableControl label="AI Provider">
        <SelectControl
          value={aiProvider}
          onChange={onAiProviderChange}
          options={[
            { value: "demo", label: "Demo AI" },
            { value: "catalayer", label: "Catalayer AI" },
            { value: "openai", label: "OpenAI-compatible" },
            { value: "claude", label: "Claude" },
            { value: "gemini", label: "Gemini" },
            { value: "ollama", label: "Ollama" },
            { value: "custom", label: "Custom endpoint" },
          ]}
        />
      </EditableControl>
      <EditableControl label="Report Depth">
        <SelectControl
          value={reportDepth}
          onChange={(value) => onReportDepthChange(value as ReportDepth)}
          options={[
            { value: "simple", label: "Quick" },
            { value: "detailed", label: "Detailed" },
            { value: "analyst", label: "Analyst" },
          ]}
        />
      </EditableControl>
      <EditableSummary label="Debug / Trace" value="System log · report trace · risk filter trace visible in Pro" />
    </div>
  );
}

function StarterPipelineColumn({
  market,
  style,
  activePacks,
  aiProvider,
  reportDepth,
  report,
  status,
  currentStep,
}: {
  market: MarketRegistryEntry;
  style: ScanStyle;
  activePacks: SkillPack[];
  aiProvider: string;
  reportDepth: ReportDepth;
  report: MarketReport | null;
  status: PipelineStatus;
  currentStep: number | null;
}) {
  return (
    <aside className="flex min-h-0 flex-col gap-4 overflow-y-auto pr-1">
      <ConsolePanel title="Scan Scope">
        <div className="space-y-2">
          <EvidenceRow label="Universe" value={(report?.universe ?? market.defaultUniverse).slice(0, 10).join(" · ")} />
          <EvidenceRow label="Data Ready" value="Public prices · public headlines · recent filings" />
          <EvidenceRow label="Skill Layer" value={`${activePacks.length} active packs loaded`} />
          <EvidenceRow label="AI Mode" value={aiProvider === "demo" ? "Demo AI ready" : `${providerShortName(aiProvider)} selected`} />
          <EvidenceRow label="Output" value={`${reportDepth === "simple" ? "Simple" : "Detailed"} report format`} />
        </div>
      </ConsolePanel>

      <ConsolePanel title="Pipeline Status">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="text-[13px] text-ml-text-dim">
            {status === "running" ? "Scanning..." : status === "complete" ? "Scan complete" : status === "error" ? "Scan needs review" : "Ready"}
          </span>
          <span className={status === "error" ? "ml-pill text-ml-bearish border-ml-bearish/30" : status === "complete" ? "ml-pill-live" : "ml-pill"}>
            {status === "running" ? "Running" : status === "complete" ? "Complete" : status === "error" ? "Error" : "Ready"}
          </span>
        </div>
        <div className="space-y-2">
          {PIPELINE_STEPS.map((step, index) => (
            <PipelineStepRow
              key={step}
              label={step}
              state={pipelineStepState(status, currentStep, index)}
            />
          ))}
        </div>
      </ConsolePanel>

      <ConsolePanel title="Skill Packs Active">
        <div className="space-y-2">
          {activePacks.slice(0, 4).map((pack) => (
            <div key={pack.id} className="rounded-sm border border-ml-border bg-ml-bg px-3 py-2">
              <div className="text-[12px] text-ml-text">{shortPackName(pack.name)}</div>
              <div className="mt-1 text-[11px] leading-relaxed text-ml-text-muted">{pack.starterDescription}</div>
            </div>
          ))}
        </div>
      </ConsolePanel>
    </aside>
  );
}

function PipelineStepRow({ label, state }: { label: string; state: "waiting" | "running" | "done" | "error" }) {
  const dot =
    state === "done"
      ? "bg-ml-accent"
      : state === "running"
        ? "bg-ml-risk animate-pulse"
        : state === "error"
          ? "bg-ml-bearish"
          : "bg-ml-border-strong";
  const text =
    state === "done"
      ? "Done"
      : state === "running"
        ? "Running"
        : state === "error"
          ? "Error"
          : "Waiting";
  return (
    <div className="flex items-center justify-between gap-3 rounded-sm border border-ml-border bg-ml-bg px-3 py-2">
      <div className="flex min-w-0 items-center gap-2">
        <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
        <span className="truncate text-[12px] text-ml-text-dim">{label}</span>
      </div>
      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ml-text-muted">{text}</span>
    </div>
  );
}

function StarterDecisionBoard({
  mode,
  report,
  bullish,
  bearish,
  risks,
  scanning,
  confidence,
  pipelineStatus,
  currentStep,
  selectedCandidate,
  proPanelTab,
  scanLogs,
  activePacks,
  onProPanelTabChange,
  onSelectCandidate,
  onDetails,
}: {
  mode: "starter" | "pro";
  report: MarketReport | null;
  bullish: Array<BullishCandidate | BearishCandidate>;
  bearish: Array<BullishCandidate | BearishCandidate>;
  risks: RiskAlert[];
  scanning: boolean;
  confidence: number;
  pipelineStatus: PipelineStatus;
  currentStep: number | null;
  selectedCandidate: BullishCandidate | BearishCandidate | null;
  proPanelTab: ProTabId;
  scanLogs: string[];
  activePacks: SkillPack[];
  onProPanelTabChange: (tab: ProTabId) => void;
  onSelectCandidate: (candidate: BullishCandidate | BearishCandidate) => void;
  onDetails: () => void;
}) {
  const isPro = mode === "pro";
  // Pro Mode: View Evidence inside the Verdict card jumps the side panel to the Evidence tab.
  // Starter Mode: opens the full report overlay (Starter has no side panel).
  const handleViewEvidence = isPro ? () => onProPanelTabChange("evidence") : onDetails;
  return (
    <section className="mx-auto flex h-full w-full min-h-0 flex-col gap-4 overflow-hidden">
      <AIMarketVerdict
        report={report}
        scanning={scanning}
        confidence={confidence}
        pipelineStatus={pipelineStatus}
        currentStep={currentStep}
        onDetails={handleViewEvidence}
      />

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
        <StarterCandidatesBoard
          mode={mode}
          bullish={bullish}
          bearish={bearish}
          risks={risks}
          scanning={scanning}
          selectedCandidate={selectedCandidate}
          onDetails={onDetails}
          onSelectCandidate={onSelectCandidate}
        />
        <ProEvidencePanel
          mode={mode}
          report={report}
          scanning={scanning}
          tab={proPanelTab}
          onTabChange={onProPanelTabChange}
          selectedCandidate={selectedCandidate}
          risks={risks}
          logs={scanLogs}
          activePacks={activePacks}
        />
      </div>
    </section>
  );
}

function AIMarketVerdict({
  report,
  scanning,
  confidence,
  pipelineStatus,
  currentStep,
  onDetails,
}: {
  report: MarketReport | null;
  scanning: boolean;
  confidence: number;
  pipelineStatus: PipelineStatus;
  currentStep: number | null;
  onDetails: () => void;
}) {
  const topNames = report ? topCandidateNames(report) : "";
  return (
    <section
      data-onboarding="verdict"
      className="ml-panel-strong shrink-0 border-ml-border-strong p-6 shadow-glow"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 max-w-4xl">
          <div className="ml-label">AI Market Verdict</div>
          <h1 className="mt-3 text-[28px] md:text-[32px] font-semibold leading-[1.15] tracking-tight text-ml-text">
            {scanning
              ? "Generating market verdict..."
              : report
                ? verdictHeadline(report)
                : "Find bullish and bearish market candidates in one click."}
          </h1>
        </div>
        {report && !scanning && (
          <div className="flex flex-wrap justify-start gap-1.5 xl:justify-end">
            <InlineMetricChip value={`Confidence ${confidence}%`} />
            <InlineMetricChip value={`Risk ${report.market_direction.risk_level}`} tone="risk" />
            <InlineMetricChip value={`${report.bullish_candidates.length} Bullish`} tone="bullish" />
            <InlineMetricChip value={`${report.bearish_candidates.length} Bearish`} tone="bearish" />
            <InlineMetricChip value={`Last scan ${shortTime(report.generated_at)}`} />
          </div>
        )}
      </div>

      {scanning ? (
        <div className="mt-5 space-y-3">
          <StarterProgressStrip status={pipelineStatus} currentStep={currentStep} />
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            <div className="h-10 animate-pulse rounded-[10px] border border-ml-border bg-ml-bg" />
            <div className="h-10 animate-pulse rounded-[10px] border border-ml-border bg-ml-bg" />
            <div className="h-10 animate-pulse rounded-[10px] border border-ml-border bg-ml-bg" />
          </div>
        </div>
      ) : report ? (
        <>
          <p className="mt-3 max-w-4xl text-[14px] leading-relaxed text-ml-text-dim">
            {reportConclusion(report)}
          </p>
          <div className="mt-5 flex flex-wrap items-stretch justify-between gap-3">
            <div className="grid flex-1 grid-cols-1 gap-2 md:grid-cols-3">
              <VerdictChip label="Top names" value={topNames || "None"} />
              <VerdictChip label="Main catalyst" value={mainCatalyst(report)} />
              <VerdictChip label="Main risk" value={mainRisk(report)} />
            </div>
            <button
              type="button"
              onClick={onDetails}
              className="ml-button !h-auto self-stretch shrink-0 px-4 text-[11.5px]"
            >
              View Evidence
            </button>
          </div>
        </>
      ) : (
        <p className="mt-3 max-w-3xl text-[14px] leading-relaxed text-ml-text-dim">
          Choose Market, Style, and AI from the bottom bar, then run an AI market scan.
        </p>
      )}
    </section>
  );
}

function StarterProgressStrip({
  status,
  currentStep,
}: {
  status: PipelineStatus;
  currentStep: number | null;
}) {
  // Mirror the canonical PIPELINE_STEPS list, then append a final "Done" indicator.
  const steps: Array<{ label: string; state: "waiting" | "running" | "done" | "error" }> = [
    ...PIPELINE_STEPS.map((label, index) => ({
      label,
      state: pipelineStepState(status, currentStep, index),
    })),
    {
      label: "Done",
      state: (status === "complete" ? "done" : status === "error" ? "error" : "waiting") as
        | "waiting"
        | "running"
        | "done"
        | "error",
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 rounded-[10px] border border-ml-border bg-ml-bg px-3 py-2">
      {steps.map((step, index) => (
        <div key={step.label} className="flex items-center gap-2">
          <span
            className={[
              "h-1.5 w-1.5 rounded-full",
              step.state === "done"
                ? "bg-ml-accent"
                : step.state === "running"
                  ? "animate-pulse bg-ml-risk"
                  : step.state === "error"
                    ? "bg-ml-bearish"
                    : "bg-ml-border-strong",
            ].join(" ")}
          />
          <span
            className={[
              "text-[10.5px]",
              step.state === "done"
                ? "text-ml-accent"
                : step.state === "running"
                  ? "text-ml-risk"
                  : step.state === "error"
                    ? "text-ml-bearish"
                    : "text-ml-text-muted",
            ].join(" ")}
          >
            {step.label}
          </span>
          {index < steps.length - 1 && <span className="text-[10.5px] text-ml-text-muted">→</span>}
        </div>
      ))}
    </div>
  );
}

function StarterCandidatesBoard({
  mode,
  bullish,
  bearish,
  risks,
  scanning,
  selectedCandidate,
  onDetails,
  onSelectCandidate,
}: {
  mode: "starter" | "pro";
  bullish: Array<BullishCandidate | BearishCandidate>;
  bearish: Array<BullishCandidate | BearishCandidate>;
  risks: RiskAlert[];
  scanning: boolean;
  selectedCandidate: BullishCandidate | BearishCandidate | null;
  onDetails: () => void;
  onSelectCandidate: (candidate: BullishCandidate | BearishCandidate) => void;
}) {
  return (
    <section data-onboarding="candidates" className="ml-panel flex min-h-0 flex-col overflow-hidden p-5">
      <div className="ml-label">Candidates Board</div>
      <div
        className={[
          "mt-4 grid min-h-0 flex-1 grid-cols-1 gap-4",
          // 60/40 split when there are no confirmed bearish names; 50/50 when there are
          bearish.length > 0 ? "lg:grid-cols-2" : "lg:grid-cols-[3fr_2fr]",
        ].join(" ")}
      >
        <CompactCandidateColumn
          mode={mode}
          title="Top Bullish Candidates"
          tone="bullish"
          candidates={scanning ? [] : bullish}
          loading={scanning}
          empty="No bullish candidates detected in the latest scan."
          selectedCandidate={selectedCandidate}
          onDetails={onDetails}
          onSelectCandidate={onSelectCandidate}
        />
        <CompactCandidateColumn
          mode={mode}
          title="Downside Watch"
          tone="bearish"
          candidates={scanning ? [] : bearish}
          loading={scanning}
          empty="No confirmed downside candidates."
          risks={risks}
          selectedCandidate={selectedCandidate}
          onDetails={onDetails}
          onSelectCandidate={onSelectCandidate}
        />
      </div>
    </section>
  );
}

function ReasonRiskBoard({
  report,
  scanning,
}: {
  report: MarketReport | null;
  risks: RiskAlert[];
  scanning: boolean;
}) {
  const topNames = report ? topCandidateNames(report) || "AAPL, MSFT, and TSLA" : "AAPL, MSFT, and TSLA";
  return (
    <section data-onboarding="notes" className="ml-panel flex min-h-0 flex-col overflow-hidden p-5">
      <div className="ml-label">Decision Notes</div>
      <div className="mt-4 grid min-h-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
        <DecisionNoteBlock
          title="Why Bullish"
          headline="Price + headlines support large-cap tech."
          text={`Price momentum and public headline pressure support ${topNames}.`}
          loading={scanning}
        />
        <DecisionNoteBlock
          title="Main Risk"
          headline="Volatility remains elevated."
          text="Confidence should be treated as conditional until new data confirms the trend."
          loading={scanning}
        />
        <DecisionNoteBlock
          title="Watch Next"
          headline="New filings or negative headlines."
          text="A shift in filings, earnings updates, or headline tone may change the view."
          loading={scanning}
        />
        <DecisionNoteBlock
          title="Action Bias"
          headline="Monitor, do not treat as instruction."
          text="Use this as research support only, not as a buy/sell signal."
          loading={scanning}
        />
      </div>
    </section>
  );
}

function ProEvidencePanel({
  mode,
  report,
  scanning,
  tab,
  selectedCandidate,
  risks,
  logs,
  activePacks,
  onTabChange,
}: {
  mode: "starter" | "pro";
  report: MarketReport | null;
  scanning: boolean;
  tab: ProTabId;
  selectedCandidate: BullishCandidate | BearishCandidate | null;
  risks: RiskAlert[];
  logs: string[];
  activePacks: SkillPack[];
  onTabChange: (tab: ProTabId) => void;
}) {
  const visibleTabs = mode === "pro"
    ? PRO_TABS
    : PRO_TABS.filter((t) => t.id === "brief" || t.id === "evidence");

  // Pulse the panel when the tab changes (e.g. after View Evidence / View Details).
  // Use the bearish variant if a downside candidate was just selected.
  const sectionRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    el.classList.remove("ml-pulse-flash", "ml-pulse-flash-bearish");
    void el.offsetWidth;
    const isBearishSelected =
      !!selectedCandidate && !("bullish_score" in selectedCandidate);
    el.classList.add(isBearishSelected ? "ml-pulse-flash-bearish" : "ml-pulse-flash");
  }, [tab, selectedCandidate?.ticker]);

  const topNames = report ? topCandidateNames(report) || "AAPL, MSFT, and TSLA" : "AAPL, MSFT, and TSLA";

  return (
    <section
      ref={sectionRef}
      data-onboarding="notes"
      className="ml-panel flex min-h-0 flex-col overflow-hidden p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="ml-label">Evidence &amp; Reasoning</div>
          {mode === "pro" && (
            <p className="mt-1 text-[11px] text-ml-text-muted">Advanced evidence tabs enabled.</p>
          )}
        </div>
        {mode === "pro" && (
          <span className="text-[10px] uppercase tracking-[0.14em] text-ml-text-muted">Pro</span>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-1">
        {visibleTabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onTabChange(t.id)}
            className={[
              "h-7 shrink-0 rounded-[8px] border px-2.5 text-[10px] uppercase tracking-[0.14em] transition-colors",
              tab === t.id
                ? "border-ml-border-strong bg-ml-bg-elev text-ml-text"
                : "border-ml-border bg-ml-bg text-ml-text-muted hover:border-ml-border-strong",
            ].join(" ")}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-0.5">
        {tab === "brief" && (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <DecisionNoteBlock
              title={report?.market_direction.tone === "Bearish" || report?.market_direction.tone === "Risk-off" ? "Why Bearish" : "Market Brief"}
              headline={report?.ai_market_brief
                ? report.ai_market_brief.split(".")[0] + "."
                : `Price + headlines support ${topNames}.`}
              text={report?.ai_market_brief || `Price momentum and public headlines align across the leading candidates (${topNames}).`}
              loading={scanning}
            />
            <DecisionNoteBlock
              title="Main Risk"
              headline={
                risks[0]?.reason
                  ? risks[0].reason
                  : report
                    ? `${report.market_direction.risk_level} risk level detected.`
                    : "Volatility remains elevated."
              }
              text={
                report?.bullish_candidates[0]?.risk_note
                  || "Treat confidence as conditional until new data confirms the trend."
              }
              loading={scanning}
            />
            <DecisionNoteBlock
              title="Watch Next"
              headline={
                report?.market_direction.dominant_themes[0]
                  ? `Monitor: ${report.market_direction.dominant_themes.slice(0, 2).join(", ")}.`
                  : "New filings or negative headlines."
              }
              text={
                report?.bullish_candidates[0]?.details?.what_would_change_view
                  || "A shift in filings, earnings updates, or headline tone may change the view."
              }
              loading={scanning}
            />
            <DecisionNoteBlock
              title="Action Bias"
              headline={
                report?.market_direction.risk_level === "High"
                  ? "High risk — monitor carefully."
                  : "Monitor only."
              }
              text="Do not treat this as a buy/sell instruction. Use as research support only."
              loading={scanning}
            />
          </div>
        )}

        {tab === "candidate" && <ProCandidateTab candidate={selectedCandidate} />}

        {tab === "evidence" && (
          report ? (
            <div className="space-y-2">
              {newsCatalystMap(report).slice(0, 5).map((item) => {
                const isActive = !!selectedCandidate && item.tickers === selectedCandidate.ticker;
                return (
                  <CatalystRow
                    key={`${item.theme}-${item.tickers}-${item.impact}`}
                    item={item}
                    active={isActive}
                  />
                );
              })}
            </div>
          ) : (
            <p className="text-[12px] text-ml-text-muted">News catalysts appear after a scan.</p>
          )
        )}

        {tab === "risk" && (
          risks.length ? (
            <div className="space-y-2">
              {risks.slice(0, 5).map((risk) => (
                <RiskAlertCard key={`${risk.ticker}-${risk.risk_type}-${risk.reason}`} risk={risk} />
              ))}
            </div>
          ) : (
            <p className="text-[12px] text-ml-text-muted">No risk alerts in the latest scan.</p>
          )
        )}

        {tab === "data" && (
          <div className="space-y-2">
            <EvidenceRow label="Prices" value={report?.data_used.price_source ?? "yfinance / public prices"} />
            <EvidenceRow label="Headlines" value={report?.data_used.news_source ?? "Yahoo Finance RSS"} />
            <EvidenceRow label="Filings" value={report?.data_used.filing_source ?? "SEC EDGAR"} />
            <EvidenceRow label="AI Provider" value={report?.provider === "mock" ? "Demo AI" : report?.data_used.ai_provider ?? "Demo AI"} />
            <EvidenceRow label="Universe" value={(report?.universe ?? DEFAULT_UNIVERSE).join(" · ")} />
            <EvidenceRow label="Skill Packs" value={activePacks.map((p) => shortPackName(p.name)).join(" · ") || "—"} />
          </div>
        )}

        {tab === "log" && (
          <div className="space-y-1.5 font-mono text-[11px] text-ml-text-muted">
            {(logs.length ? logs : ["Ready. Click Analyze Market to start the scan."]).map((line, idx) => (
              <div key={`${idx}-${line}`} className="rounded-[8px] border border-ml-border bg-ml-bg/40 px-2 py-1.5">
                {line}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ProCandidateTab({ candidate }: { candidate: BullishCandidate | BearishCandidate | null }) {
  if (!candidate) {
    return (
      <p className="text-[12px] leading-relaxed text-ml-text-muted">
        Click <span className="text-ml-text-dim">View Details</span> on any candidate card to see its full reasoning here.
      </p>
    );
  }
  const isBullish = "bullish_score" in candidate;
  const score = isBullish
    ? displayBullishScore(candidate.ticker, (candidate as BullishCandidate).bullish_score)
    : (candidate as BearishCandidate).bearish_score;
  return (
    <div className="space-y-3">
      <div className="rounded-[10px] border border-ml-border bg-ml-bg/40 p-3">
        <div className="flex items-baseline gap-2">
          <span className={`font-mono text-base tracking-widest ${isBullish ? "text-ml-bullish" : "text-ml-bearish"}`}>
            {candidate.ticker}
          </span>
          <span className="truncate text-[11px] text-ml-text-muted">{candidate.company_name}</span>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <div>
            <div className="text-[9px] uppercase tracking-[0.14em] text-ml-text-muted">Score</div>
            <div className="mt-0.5 font-mono text-[12px] text-ml-text">{score}</div>
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-[0.14em] text-ml-text-muted">Confidence</div>
            <div className="mt-0.5 font-mono text-[12px] text-ml-text">{candidate.confidence}</div>
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-[0.14em] text-ml-text-muted">Risk</div>
            <div className="mt-0.5 font-mono text-[12px] text-ml-text">{formatRisk(candidate.risk_note)}</div>
          </div>
        </div>
      </div>
      <div className="rounded-[10px] border border-ml-border bg-ml-bg/40 p-3">
        <div className="text-[10px] uppercase tracking-[0.14em] text-ml-text-muted">Reason</div>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-ml-text-dim">
          {friendlyReason(candidate.ticker, candidate.reason)}
        </p>
      </div>
      <div className="rounded-[10px] border border-ml-border bg-ml-bg/40 p-3">
        <div className="text-[10px] uppercase tracking-[0.14em] text-ml-text-muted">Skill packs</div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {candidateSkillPacks(candidate.ticker, isBullish ? "bullish" : "bearish").map((pack) => (
            <span key={pack} className="rounded-sm border border-ml-border bg-ml-bg px-2 py-[2px] text-[10px] text-ml-text-muted">
              {pack}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function DecisionNoteBlock({
  title,
  headline,
  text,
  loading,
}: {
  title: string;
  headline: string;
  text: string;
  loading: boolean;
}) {
  return (
    <div className="rounded-[12px] border border-ml-border bg-ml-bg/40 p-3.5">
      <div className="text-[10px] uppercase tracking-[0.16em] text-ml-text-muted">{title}</div>
      {loading ? (
        <div className="mt-2 space-y-1.5">
          <div className="h-3.5 w-4/5 animate-pulse rounded-sm bg-ml-border" />
          <div className="h-3 animate-pulse rounded-sm bg-ml-border/70" />
          <div className="h-3 w-3/4 animate-pulse rounded-sm bg-ml-border/70" />
        </div>
      ) : (
        <>
          <div className="mt-1.5 text-[13px] font-semibold leading-snug text-ml-text">{headline}</div>
          <p className="mt-1.5 text-[12px] leading-relaxed text-ml-text-dim">{text}</p>
        </>
      )}
    </div>
  );
}

function CompactCandidateColumn({
  mode,
  title,
  candidates,
  tone,
  loading,
  empty,
  risks,
  selectedCandidate,
  onDetails,
  onSelectCandidate,
}: {
  mode: "starter" | "pro";
  title: string;
  candidates: Array<BullishCandidate | BearishCandidate>;
  tone: "bullish" | "bearish";
  loading: boolean;
  empty: string;
  risks?: RiskAlert[];
  selectedCandidate: BullishCandidate | BearishCandidate | null;
  onDetails: () => void;
  onSelectCandidate: (candidate: BullishCandidate | BearishCandidate) => void;
}) {
  const total = candidates.length;
  const visible = candidates;
  const badgeTone =
    tone === "bullish"
      ? "border-ml-bullish/30 bg-ml-bullish/5 text-ml-bullish"
      : "border-ml-bearish/30 bg-ml-bearish/5 text-ml-bearish";
  const badgeText = loading
    ? "Loading..."
    : total === 0
      ? "0"
      : `Showing ${visible.length} / ${total}`;
  return (
    <div className="flex min-h-0 flex-col rounded-[12px] border border-ml-border bg-ml-bg/40 p-3.5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-[11px] uppercase tracking-[0.16em] text-ml-text-muted">{title}</div>
        <span
          className={[
            "inline-flex items-center rounded-[8px] border px-2 py-[2px] font-mono text-[10px] tracking-[0.04em]",
            badgeTone,
          ].join(" ")}
        >
          {badgeText}
        </span>
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
        {loading ? (
          <>
            <CandidateSkeleton />
            <CandidateSkeleton />
          </>
        ) : visible.length ? (
          visible.map((candidate) => (
            <CompactCandidateCard
              key={candidate.ticker}
              mode={mode}
              candidate={candidate}
              tone={tone}
              active={selectedCandidate?.ticker === candidate.ticker}
              onDetails={onDetails}
              onSelectCandidate={onSelectCandidate}
            />
          ))
        ) : (
          <DownsideEmptyState empty={empty} risks={risks ?? []} />
        )}
      </div>
    </div>
  );
}

function CompactCandidateCard({
  mode,
  candidate,
  tone,
  active,
  onDetails,
  onSelectCandidate,
}: {
  mode: "starter" | "pro";
  candidate: BullishCandidate | BearishCandidate;
  tone: "bullish" | "bearish";
  active: boolean;
  onDetails: () => void;
  onSelectCandidate: (candidate: BullishCandidate | BearishCandidate) => void;
}) {
  const score =
    tone === "bullish"
      ? displayBullishScore(candidate.ticker, (candidate as BullishCandidate).bullish_score)
      : (candidate as BearishCandidate).bearish_score;
  // Both modes: clicking the action selects the candidate. The Starter handler jumps the right
  // panel to Evidence (no Candidate tab in Starter); the Pro handler jumps to Candidate.
  const handleClick = () => onSelectCandidate(candidate);
  return (
    <article
      className={[
        "rounded-[10px] border bg-ml-panel px-3 py-1.5 transition-colors",
        active
          ? tone === "bearish"
            ? "border-ml-bearish/60"
            : "border-ml-bullish/60"
          : "border-ml-border",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className={`font-mono text-sm leading-none tracking-widest ${tone === "bullish" ? "text-ml-bullish" : "text-ml-bearish"}`}>
            {candidate.ticker}
          </span>
          <span className="truncate text-[10px] text-ml-text-muted">{candidate.company_name}</span>
        </div>
        <button type="button" onClick={handleClick} className="ml-button h-6 shrink-0 px-2 text-[10px]">
          {mode === "pro" ? "View Details" : "Why this?"}
        </button>
      </div>
      <div className="mt-1 flex flex-wrap gap-x-3 font-mono text-[10px] leading-tight text-ml-text-muted">
        <span>Score {score}</span>
        <span>Conf {candidate.confidence}</span>
        <span>Risk {formatRisk(candidate.risk_note)}</span>
      </div>
      <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-ml-text-dim">
        {friendlyReason(candidate.ticker, candidate.reason)}
      </p>
      <div className="mt-1 flex flex-wrap gap-1">
        {candidateSkillPacks(candidate.ticker, tone).slice(0, 2).map((pack) => (
          <span key={pack} className="rounded-sm border border-ml-border bg-ml-bg px-1.5 py-[1px] text-[9px] leading-tight text-ml-text-muted">
            {pack}
          </span>
        ))}
      </div>
    </article>
  );
}

function StarterAIPanel({
  report,
  tab,
  onTabChange,
  logs,
  activePacks,
  scanning,
}: {
  report: MarketReport | null;
  tab: AIPanelTab;
  onTabChange: (tab: AIPanelTab) => void;
  logs: string[];
  activePacks: SkillPack[];
  scanning: boolean;
}) {
  return (
    <aside className="flex min-h-0 flex-col overflow-hidden">
      <section className="ml-panel flex min-h-0 flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="ml-label">AI / Evidence Panel</div>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-1">
          {(["brief", "reasoning", "evidence", "log"] as AIPanelTab[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onTabChange(item)}
              className={[
                "h-8 rounded-sm border px-2 text-[10px] uppercase tracking-[0.12em]",
                tab === item
                  ? "border-ml-border-strong bg-ml-bg-elev text-ml-text"
                  : "border-ml-border bg-ml-bg text-ml-text-muted hover:border-ml-border-strong",
              ].join(" ")}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
          {tab === "brief" && (
            <p className="text-[13px] leading-relaxed text-ml-text-dim">
              {scanning
                ? "Generating a plain-English AI market brief from public prices, headlines, filings, skill packs, and risk filters."
                : report?.ai_market_brief ??
                  "Run a market scan to generate a plain-English AI explanation of bullish candidates, bearish candidates, catalysts, and risk alerts."}
            </p>
          )}
          {tab === "reasoning" && (
            report ? (
              <div className="space-y-3">
                <ReasoningBlock
                  title="Why bullish"
                  items={[
                    `Large-cap names show stronger momentum, led by ${topCandidateNames(report) || "the top watchlist names"}.`,
                    "Public headlines are more supportive than negative across the strongest candidates.",
                    "Built-in skill packs align around price movement, catalysts, and confirmation.",
                  ]}
                />
                <ReasoningBlock
                  title="Why risk remains high"
                  items={[
                    "Volatility remains elevated in parts of the default watchlist.",
                    "Bearish confirmation is weak, not permanently absent.",
                    "New public headlines or filings may change candidate confidence.",
                  ]}
                />
                <ReasoningBlock
                  title="What could change the view"
                  items={[
                    "New negative headlines or earnings surprises.",
                    "Price momentum reversal in the leading candidates.",
                    "Broader market risk-off movement or sector pressure.",
                  ]}
                />
              </div>
            ) : (
              <p className="text-[12px] text-ml-text-muted">Reasoning appears after the first scan.</p>
            )
          )}
          {tab === "evidence" && (
            <div className="space-y-2">
              <EvidenceRow label="Prices" value={report?.data_used.price_source ?? "yfinance / public prices"} />
              <EvidenceRow label="Headlines" value={report?.data_used.news_source ?? "Yahoo Finance RSS / public headlines"} />
              <EvidenceRow label="Filings" value={report?.data_used.filing_source ?? "SEC EDGAR metadata"} />
              <EvidenceRow label="AI" value={report?.provider === "mock" ? "Demo AI" : report?.data_used.ai_provider ?? "Demo AI"} />
              <EvidenceRow label="Universe" value={(report?.universe ?? DEFAULT_UNIVERSE).join(" · ")} />
              <EvidenceRow label="Skill Packs" value={activePacks.map((pack) => shortPackName(pack.name)).join(" · ")} />
            </div>
          )}
          {tab === "log" && (
            <div className="space-y-2 font-mono text-[11px] text-ml-text-muted">
              {(logs.length ? logs : ["Ready. Click Analyze Market to start the scan."]).map((line) => (
                <div key={line} className="rounded-sm border border-ml-border bg-ml-bg px-2 py-1.5">{line}</div>
              ))}
            </div>
          )}
        </div>
      </section>
    </aside>
  );
}

function StarterReportOverlay({
  report,
  activeTab,
  onTabChange,
  onClose,
}: {
  report: MarketReport;
  activeTab: DetailTab;
  onTabChange: (tab: DetailTab) => void;
  onClose: () => void;
}) {
  const candidates = [
    ...report.bullish_candidates.map((candidate) => ({ ...candidate, direction: "Bullish" as const })),
    ...report.bearish_candidates.map((candidate) => ({ ...candidate, direction: "Downside Watch" as const })),
  ];
  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-[rgba(0,0,0,0.65)] px-5 py-8 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <section
        onClick={(e) => e.stopPropagation()}
        className="mx-auto flex w-full max-w-[1100px] flex-col rounded-[14px] border border-ml-border bg-ml-bg shadow-2xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-ml-border px-5 py-3">
          <div>
            <div className="ml-label">Full Report</div>
            <div className="mt-1 text-[12px] text-ml-text-muted">
              Expanded evidence and scan details for the latest market view.
            </div>
          </div>
          <button type="button" onClick={onClose} className="ml-button">Close</button>
        </div>
        <div className="flex gap-2 overflow-x-auto border-b border-ml-border px-5 py-2">
          {DETAIL_TABS.filter((tab) => tab.id !== "skill-packs").map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={[
                "h-8 shrink-0 rounded-[8px] border px-3 text-[10px] uppercase tracking-[0.14em] transition-colors",
                activeTab === tab.id
                  ? "border-ml-border-strong bg-ml-bg-elev text-ml-text"
                  : "border-ml-border bg-ml-bg text-ml-text-muted hover:border-ml-border-strong",
              ].join(" ")}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="max-h-[calc(100vh-220px)] overflow-y-auto p-5">
          <DetailedReportTabContent report={report} tab={activeTab} candidates={candidates} />
        </div>
      </section>
    </div>
  );
}

function CandidateSkeleton() {
  return (
    <div className="rounded-[10px] border border-ml-border bg-ml-panel px-3 py-3">
      <div className="h-4 w-24 animate-pulse rounded-sm bg-ml-border" />
      <div className="mt-3 h-3 w-full animate-pulse rounded-sm bg-ml-border/70" />
      <div className="mt-2 h-3 w-2/3 animate-pulse rounded-sm bg-ml-border/70" />
    </div>
  );
}

function EvidenceSkeleton() {
  return (
    <>
      <div className="h-16 animate-pulse rounded-sm border border-ml-border bg-ml-panel" />
      <div className="h-16 animate-pulse rounded-sm border border-ml-border bg-ml-panel" />
    </>
  );
}

function ModeSegment({
  mode,
  onChange,
}: {
  mode: "starter" | "pro";
  onChange: (mode: "starter" | "pro") => void;
}) {
  const starterRef = useRef<HTMLButtonElement | null>(null);
  const proRef = useRef<HTMLButtonElement | null>(null);
  const lastModeRef = useRef(mode);

  // On mode flip, fire a brief burst-glow animation on the newly active button.
  useEffect(() => {
    if (lastModeRef.current === mode) return;
    lastModeRef.current = mode;
    const target = mode === "starter" ? starterRef.current : proRef.current;
    if (!target) return;
    target.classList.remove("ml-segment-burst");
    // force reflow so the animation can restart
    void target.offsetWidth;
    target.classList.add("ml-segment-burst");
  }, [mode]);

  return (
    <div
      role="tablist"
      aria-label="Experience mode"
      className="flex items-center gap-0.5 rounded-[10px] border border-ml-border bg-ml-bg p-0.5"
    >
      {(["starter", "pro"] as const).map((id) => {
        const active = mode === id;
        return (
          <button
            key={id}
            ref={id === "starter" ? starterRef : proRef}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onChange(id)}
            className={[
              "h-6 rounded-[8px] px-2.5 text-[11px] font-semibold uppercase tracking-[0.12em]",
              "transition-[background-color,color,transform] duration-300 ease-out active:scale-[0.97]",
              active
                ? "bg-ml-bg-elev text-ml-text"
                : "text-ml-text-muted hover:text-ml-text-dim",
            ].join(" ")}
          >
            {id === "starter" ? "Starter" : "Advanced"}
          </button>
        );
      })}
    </div>
  );
}

function ErrorToast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className="ml-toast-enter fixed top-5 right-5 z-[70] w-[360px] max-w-[calc(100vw-32px)]"
    >
      <div className="rounded-[12px] border border-ml-bearish/55 bg-ml-bg-elev px-4 py-3 shadow-2xl shadow-black/50">
        <div className="flex items-start gap-3">
          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-ml-bearish" />
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-[0.16em] font-semibold text-ml-bearish">
              Request failed
            </div>
            <p className="mt-1 text-[12px] leading-relaxed text-ml-text-dim break-words">{message}</p>
            <p className="mt-2 text-[11px] text-ml-text-muted">
              Open <span className="text-ml-text-dim">Settings</span> to check your AI provider.
            </p>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="text-[14px] leading-none text-ml-text-muted hover:text-ml-text"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}

function InlineMetricChip({ value, tone }: { value: string; tone?: "bullish" | "bearish" | "risk" }) {
  const color = tone === "bullish" ? "text-ml-bullish" : tone === "bearish" ? "text-ml-bearish" : tone === "risk" ? "text-ml-risk" : "text-ml-text-muted";
  return (
    <span className={`rounded-sm border border-ml-border bg-ml-bg px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] ${color}`}>
      {value}
    </span>
  );
}

function HeroConsole({
  mode,
  report,
}: {
  mode: "starter" | "pro";
  report: MarketReport | null;
}) {
  const isPro = mode === "pro";
  const hasReport = !!report;
  return (
    <section className="ml-panel-strong border-ml-accent/25 p-4 shadow-glow">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="ml-label">{isPro ? "Pro Mode" : "AI Market Report"}</div>
          <h1 className="mt-2 max-w-3xl text-2xl md:text-3xl font-semibold tracking-tight text-ml-text">
            {isPro
              ? "Pro Control Console"
              : hasReport
                ? "Latest Market Report"
                : "Find bullish and bearish market candidates in one click."}
          </h1>
          <p className="mt-3 max-w-3xl text-[13px] leading-relaxed text-ml-text-dim">
            {isPro
              ? "Customize market universe, data sources, skill packs, risk filters, report depth, and AI provider before generating a bullish/bearish market report."
              : hasReport
                ? "MarketLayer scanned public prices, headlines, filings, built-in skill packs, and risk filters to generate this AI market view."
                : "Choose simple options from the bottom bar, then run an AI market scan."}
          </p>
          {report && !isPro && (
            <>
              <h2 className="mt-4 text-xl font-semibold text-ml-text">
                {verdictHeadline(report)}
              </h2>
              <p className="mt-3 max-w-4xl text-[13px] leading-relaxed text-ml-text-dim">
                {reportConclusion(report)}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <VerdictChip label="Top Names" value={topCandidateNames(report)} />
                <VerdictChip label="Main Catalyst" value={mainCatalyst(report)} />
                <VerdictChip label="Main Risk" value={mainRisk(report)} />
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function EvidenceColumn({
  mode,
  report,
  reports,
  activePacks,
  onSelectReport,
}: {
  mode: "starter" | "pro";
  report: MarketReport | null;
  reports: StarterResultSummary[];
  activePacks: SkillPack[];
  onSelectReport: (scanId: string) => void;
}) {
  const isPro = mode === "pro";
  return (
    <aside className="space-y-4">
      <ConsolePanel title="AI Market Brief">
        <p className="text-[13px] leading-relaxed text-ml-text-dim">
          {report?.ai_market_brief ??
            "Run a market scan to generate a plain-English AI explanation of bullish candidates, bearish candidates, catalysts, and risk alerts."}
        </p>
      </ConsolePanel>

      <ConsolePanel title="Why These Candidates?">
        <div className="space-y-3">
          {(report?.bullish_candidates.slice(0, 3) ?? []).map((item) => (
            <EvidenceRow key={item.ticker} label={item.ticker} value={friendlyReason(item.ticker, item.reason)} />
          ))}
          {!report && <EvidenceRow label="Ready" value="The next scan will compare prices, public headlines, filings, skill pack output, and risk filters." />}
        </div>
      </ConsolePanel>

      <ConsolePanel title="Data Used">
        <div className="space-y-2">
          <EvidenceRow label="Prices" value={report?.data_used.price_source ?? "Public prices"} />
          <EvidenceRow label="Headlines" value={report?.data_used.news_source ?? "Public headlines"} />
          <EvidenceRow label="Filings" value={report?.data_used.filing_source ?? "Recent filings"} />
          <EvidenceRow label="AI" value={report?.provider === "mock" ? "Demo AI" : report?.data_used.ai_provider ?? "Demo AI"} />
          <EvidenceRow label="Universe" value={(report?.universe ?? DEFAULT_UNIVERSE).join(" · ")} />
        </div>
      </ConsolePanel>

      {isPro && (
        <>
          <ConsolePanel title="System Log">
            <div className="space-y-2 font-mono text-[11px] text-ml-text-muted">
              {systemLogs(report).map((line) => (
                <div key={line}>{line}</div>
              ))}
            </div>
          </ConsolePanel>

          <ConsolePanel title="Skill Pack Trace">
            <div className="space-y-2">
              {activePacks.map((pack) => (
                <EvidenceRow key={pack.id} label={pack.name} value={`${pack.scoringContribution}. ${pack.riskNotes}`} />
              ))}
            </div>
          </ConsolePanel>

          <ConsolePanel title="Risk Filter Trace">
            <div className="space-y-2">
              <EvidenceRow label="Volatility" value="Checked for elevated movement and confidence reduction." />
              <EvidenceRow label="Headlines" value="Checked for negative public headline pressure and weak confirmation." />
              <EvidenceRow label="Data Quality" value="Mock fallback remains available when public data is incomplete." />
            </div>
          </ConsolePanel>
        </>
      )}

      <ConsolePanel title="Recent Reports">
        <div className="space-y-2">
          {reports.slice(0, 4).map((row) => (
            <button
              key={row.scan_id}
              type="button"
              onClick={() => onSelectReport(row.scan_id)}
              className="w-full border border-ml-border rounded-sm px-3 py-2 text-left hover:border-ml-border-strong"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-[12px] text-ml-text-dim">{row.market_tone}</span>
                <span className="text-[10px] text-ml-text-muted">{row.risk_level}</span>
              </div>
              <div className="mt-1 text-[10px] text-ml-text-muted truncate">{row.generated_at}</div>
            </button>
          ))}
        </div>
      </ConsolePanel>
    </aside>
  );
}

function ConsoleActionBar({
  mode,
  marketId,
  scanStyle,
  activePacks,
  universeChoice,
  aiProvider,
  scanning,
  hasReport,
  hasError,
  onMarketChange,
  onScanStyleChange,
  onUniverseChoiceChange,
  onAiProviderChange,
  onSkillsApply,
  onRun,
  onDetailedReport,
  onSettings,
}: {
  mode: "starter" | "pro";
  marketId: string;
  scanStyle: ScanStyleId;
  activePacks: string[];
  universeChoice: string;
  aiProvider: string;
  scanning: boolean;
  hasReport: boolean;
  hasError: boolean;
  onMarketChange: (value: string) => void;
  onScanStyleChange: (value: ScanStyleId) => void;
  onUniverseChoiceChange: (value: string) => void;
  onAiProviderChange: (value: string) => void;
  onSkillsApply: (packIds: string[]) => void;
  onRun: () => void;
  onDetailedReport: () => void;
  onSettings: () => void;
}) {
  const isPro = mode === "pro";
  return (
    <div data-onboarding="bottom-bar" className="fixed inset-x-0 bottom-0 z-30 border-t border-ml-border bg-ml-bg/95 px-5 md:px-7 py-2 backdrop-blur">
      <div className="flex items-center gap-2 overflow-visible">
        <SmallSelect value={marketId} onChange={onMarketChange} options={PRO_MARKET_OPTIONS} />
        {isPro && (
          <SmallSelect
            value={universeChoice}
            onChange={onUniverseChoiceChange}
            options={[
              { value: "default", label: "Universe: Default" },
              { value: "mega-cap-tech", label: "Universe: Mega-cap Tech" },
              { value: "nasdaq-sample", label: "Universe: Nasdaq Sample" },
              { value: "custom", label: "Universe: Custom" },
            ]}
          />
        )}
        <SmallSelect
          value={scanStyle}
          onChange={(value) => onScanStyleChange(value as ScanStyleId)}
          options={SCAN_STYLES.map((style) => ({ value: style.id, label: `Style: ${shortStyleName(style.name)}` }))}
        />
        <SkillsPicker activePacks={activePacks} onApply={onSkillsApply} />
        <SmallSelect
          value={aiProvider}
          onChange={(v) => {
            if (v === "catalayer") {
              window.open("https://catalayer.com", "_blank");
              return;
            }
            onAiProviderChange(v);
            if (v) onSettings();
          }}
          options={[
            { value: "", label: "AI: Select…" },
            { value: "openai", label: "AI: OpenAI" },
            { value: "anthropic", label: "AI: Claude" },
            { value: "gemini", label: "AI: Gemini" },
            { value: "ollama", label: "AI: Ollama" },
            { value: "catalayer", label: "AI: Catalayer AI ⭐" },
          ]}
        />
        <div className="min-w-3 flex-1" />
        <button type="button" onClick={onRun} disabled={scanning} className="ml-button-primary whitespace-nowrap">
          <Icon name="play" size={13} />
          {scanning ? "Scanning..." : "Analyze Market"}
        </button>
        {isPro && (
          <button type="button" onClick={onDetailedReport} disabled={!hasReport} className="ml-button whitespace-nowrap">
            Full Report
          </button>
        )}
        <button
          type="button"
          onClick={onSettings}
          className={[
            "ml-button whitespace-nowrap",
            hasError ? "!border-ml-bearish/60 !text-ml-bearish ring-1 ring-ml-bearish/30" : "",
          ].join(" ")}
        >
          Settings
        </button>
      </div>
    </div>
  );
}

function SmallSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <SelectControl
      value={value}
      options={options}
      onChange={onChange}
      className="w-[162px] text-[11px]"
      menuPlacement="top"
    />
  );
}

function skillsPresetLabel(activePacks: string[]): string {
  const preset = packPresetFromIds(activePacks);
  if (preset === "core") return "Balanced";
  if (preset === "catalyst") return "Momentum + News";
  if (preset === "all") return "All Signals";
  return "Custom";
}

const OLLAMA_MODEL_PRESETS: Array<{ value: string; label: string }> = [
  { value: "gemma4:e4b", label: "Gemma 4 E4B — 4B (Recommended)" },
  { value: "gemma3:4b", label: "Gemma 3 4B" },
  { value: "gemma3:1b", label: "Gemma 3 1B — Fastest" },
  { value: "llama3.2:3b", label: "Llama 3.2 3B" },
  { value: "llama3.2:1b", label: "Llama 3.2 1B — Fastest" },
  { value: "llama3.1:8b", label: "Llama 3.1 8B" },
  { value: "qwen2.5:7b", label: "Qwen 2.5 7B" },
  { value: "qwen2.5:14b", label: "Qwen 2.5 14B" },
  { value: "qwen2.5:32b", label: "Qwen 2.5 32B" },
  { value: "mistral:7b", label: "Mistral 7B" },
  { value: "phi4:14b", label: "Phi-4 14B" },
  { value: "deepseek-r1:7b", label: "DeepSeek R1 7B" },
  { value: "deepseek-r1:14b", label: "DeepSeek R1 14B" },
];

const SKILLS_PRESETS: Array<{ id: "core" | "catalyst" | "all" | "custom"; label: string; ids: string[] }> = [
  { id: "core", label: "Balanced", ids: ["momentum", "news-catalyst", "risk-radar"] },
  { id: "catalyst", label: "Momentum + News", ids: ["momentum", "news-catalyst"] },
  { id: "all", label: "All Signals", ids: SKILL_PACKS.map((p) => p.id) },
  { id: "custom", label: "Custom", ids: [] },
];

function SkillsPicker({
  activePacks,
  onApply,
  disabled = false,
}: {
  activePacks: string[];
  onApply: (packIds: string[]) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>(activePacks);

  useEffect(() => {
    if (open) setDraft(activePacks);
  }, [open, activePacks]);

  // Auto-close the popover if mode flips to Starter while it was open.
  useEffect(() => {
    if (disabled && open) setOpen(false);
  }, [disabled, open]);

  const label = skillsPresetLabel(activePacks);

  return (
    <div className="group relative w-[162px] text-[11px]">
      <button
        type="button"
        disabled={disabled}
        aria-disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setOpen((v) => !v);
        }}
        className={[
          "ml-input flex items-center justify-between gap-3 text-left",
          disabled ? "cursor-not-allowed opacity-55 hover:border-ml-border" : "",
        ].join(" ")}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="truncate">Skills: {label}</span>
        <Icon
          name="chevron-up"
          size={14}
          className={[
            "shrink-0 text-ml-text-muted transition-transform",
            open ? "" : "rotate-180",
            disabled ? "opacity-60" : "",
          ].join(" ")}
        />
      </button>

      {disabled && (
        <div
          role="tooltip"
          className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-50 -translate-x-1/2 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        >
          <div className="whitespace-nowrap rounded-[8px] border border-ml-border-strong bg-ml-bg-elev px-3 py-1.5 text-[11px] text-ml-text-dim shadow-2xl shadow-black/50">
            Switch to <span className="font-semibold text-ml-accent">Pro Mode</span> to customize Skills.
          </div>
          <div className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-x-[5px] border-t-[5px] border-x-transparent border-t-ml-border-strong" />
        </div>
      )}

      {open && !disabled && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            role="dialog"
            aria-label="Skill Packs"
            className="absolute bottom-[calc(100%+6px)] left-0 z-50 w-[420px] max-w-[calc(100vw-48px)] rounded-[14px] border border-ml-border-strong bg-ml-bg-elev p-4 shadow-2xl shadow-black/50"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.16em] text-ml-text-muted">Skill Packs</div>
                <p className="mt-1 text-[12px] leading-relaxed text-ml-text-dim">
                  Choose which analysis skills shape the next market scan.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="text-[14px] leading-none text-ml-text-muted hover:text-ml-text"
              >
                ×
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {SKILLS_PRESETS.map((preset) => {
                const draftPreset = skillsPresetLabel(draft);
                const isActive = preset.label === draftPreset;
                const isCustom = preset.id === "custom";
                return (
                  <button
                    key={preset.id}
                    type="button"
                    disabled={isCustom}
                    onClick={() => {
                      if (isCustom) return;
                      setDraft(preset.ids);
                    }}
                    className={[
                      "rounded-[10px] border px-2.5 py-1 text-[11px] transition-colors",
                      isActive
                        ? "border-ml-border-strong bg-ml-bg-elev text-ml-text"
                        : isCustom
                          ? "border-ml-border bg-ml-bg text-ml-text-faint cursor-not-allowed"
                          : "border-ml-border bg-ml-bg text-ml-text-muted hover:border-ml-border-strong hover:text-ml-text-dim",
                    ].join(" ")}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 max-h-[300px] space-y-1.5 overflow-y-auto pr-1">
              {SKILL_PACKS.map((pack) => {
                const active = draft.includes(pack.id);
                return (
                  <button
                    key={pack.id}
                    type="button"
                    onClick={() =>
                      setDraft((d) =>
                        d.includes(pack.id) ? d.filter((id) => id !== pack.id) : [...d, pack.id]
                      )
                    }
                    className={[
                      "w-full rounded-[10px] border px-3 py-2 text-left transition-colors",
                      active
                        ? "border-ml-border-strong bg-ml-bg-elev"
                        : "border-ml-border bg-ml-bg hover:border-ml-border-strong",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[12.5px] font-semibold text-ml-text">
                        {pack.name}
                      </span>
                      <span className={active ? "font-mono text-[10px] text-ml-accent" : "font-mono text-[10px] text-ml-text-muted"}>
                        {active ? "ON" : "OFF"}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-ml-text-muted">
                      {pack.starterDescription}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* ── Catalayer AI Packs (premium) ── */}
            <div className="mt-3 rounded-[10px] border border-amber-500/30 bg-amber-500/5 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-semibold text-ml-text">Catalayer AI Packs</span>
                    <span className="rounded-[6px] border border-amber-500/50 bg-amber-500/10 px-1.5 py-[1px] font-mono text-[9px] font-semibold uppercase tracking-wide text-amber-400">
                      Subscription
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-ml-text-muted">
                    Advanced signal packs trained on 10+ years of market data — sentiment momentum, options flow, macro overlay, and more. Requires a Catalayer subscription.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => window.open("https://catalayer.com", "_blank")}
                className="mt-2.5 w-full rounded-[8px] border border-amber-500/40 bg-amber-500/10 py-1.5 text-[11px] font-semibold text-amber-400 transition-colors hover:border-amber-500/70 hover:bg-amber-500/15"
              >
                Learn more at catalayer.com →
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between gap-2 border-t border-ml-border pt-3">
              <span className="text-[11px] text-ml-text-muted">
                {draft.length} of {SKILL_PACKS.length} active
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDraft(activePacks);
                    setOpen(false);
                  }}
                  className="ml-button"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onApply(draft.length ? draft : ["momentum", "news-catalyst", "risk-radar"]);
                    setOpen(false);
                  }}
                  className="ml-button-primary"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function PackSelector({
  value,
  activePacks,
  onPresetChange,
  onPackToggle,
}: {
  value: string;
  activePacks: string[];
  onPresetChange: (value: string) => void;
  onPackToggle: (packId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const activeNames = SKILL_PACKS.filter((pack) => activePacks.includes(pack.id)).map((pack) => shortPackName(pack.name));
  return (
    <div className="relative w-[188px] text-[11px]">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="ml-input flex items-center justify-between gap-3 text-left"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="truncate">{activeNames.length === 6 ? "Packs: All 6" : `Packs: ${activeNames.length} active`}</span>
        <Icon name="chevron-up" size={14} className={`shrink-0 text-ml-text-muted transition-transform ${open ? "" : "rotate-180"}`} />
      </button>

      {open && (
        <div className="absolute bottom-[calc(100%+6px)] left-0 z-50 w-[360px] max-w-[calc(100vw-48px)] rounded border border-ml-border-strong bg-ml-bg-elev p-3 shadow-2xl shadow-black/50">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-ml-text-muted">Skill Packs</div>
              <div className="mt-1 text-[12px] text-ml-text-dim">Choose which packs shape this scan.</div>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="ml-button h-7 text-[11px]">
              Done
            </button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            {PACK_PRESET_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onPresetChange(option.value)}
                className={[
                  "rounded-sm border px-2 py-1.5 text-left text-[10px] transition-colors",
                  value === option.value
                    ? "border-ml-border-strong bg-ml-bg-elev text-ml-text"
                    : "border-ml-border bg-ml-bg text-ml-text-muted hover:border-ml-border-strong",
                ].join(" ")}
              >
                {option.label.replace("Packs: ", "")}
              </button>
            ))}
          </div>

          <div className="mt-3 max-h-[280px] space-y-2 overflow-y-auto">
            {SKILL_PACKS.map((pack) => {
              const active = activePacks.includes(pack.id);
              return (
                <button
                  key={pack.id}
                  type="button"
                  onClick={() => onPackToggle(pack.id)}
                  className={[
                    "w-full rounded-sm border px-3 py-2 text-left transition-colors",
                    active
                      ? "border-ml-accent/45 bg-ml-accent/10"
                      : "border-ml-border bg-ml-bg hover:border-ml-border-strong",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className={active ? "text-[12px] text-ml-accent" : "text-[12px] text-ml-text"}>
                      {pack.name}
                    </span>
                    <span className="font-mono text-[10px] text-ml-text-muted">{active ? "ON" : "OFF"}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-ml-text-muted">{pack.starterDescription}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function DetailedReportSection({
  report,
  expanded,
  onToggle,
  activeTab,
  onTabChange,
}: {
  report: MarketReport;
  expanded: boolean;
  onToggle: () => void;
  activeTab: DetailTab;
  onTabChange: (tab: DetailTab) => void;
}) {
  const allCandidates = [
    ...report.bullish_candidates.map((candidate) => ({ ...candidate, direction: "Bullish" as const })),
    ...report.bearish_candidates.map((candidate) => ({ ...candidate, direction: "Downside Watch" as const })),
  ];
  if (!expanded) {
    return (
      <section className="ml-panel px-4 py-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="ml-label">Detailed Report</div>
            <p className="mt-1 text-[12px] leading-relaxed text-ml-text-muted">
              Full evidence, candidate table, news analysis, risk checks, skill-pack output, data used, and disclaimer.
            </p>
          </div>
          <button type="button" onClick={onToggle} className="ml-button shrink-0">
            Expand
          </button>
        </div>
      </section>
    );
  }
  return (
    <ConsolePanel
      title="Detailed Report"
      action={
        <button type="button" onClick={onToggle} className="ml-button text-[11px] py-1">
          Collapse Detailed Report
        </button>
      }
    >
      <div className="space-y-4">
        <div className="flex gap-2 overflow-x-auto border-b border-ml-border pb-2">
          {DETAIL_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={[
                "h-8 shrink-0 rounded-sm border px-3 text-[10px] uppercase tracking-[0.14em] transition-colors",
                activeTab === tab.id
                  ? "border-ml-border-strong bg-ml-bg-elev text-ml-text"
                  : "border-ml-border bg-ml-bg text-ml-text-muted hover:border-ml-border-strong",
              ].join(" ")}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <DetailedReportTabContent report={report} tab={activeTab} candidates={allCandidates} />
      </div>
    </ConsolePanel>
  );
}

function DetailedReportTabContent({
  report,
  tab,
  candidates,
}: {
  report: MarketReport;
  tab: DetailTab;
  candidates: Array<(BullishCandidate | BearishCandidate) & { direction: "Bullish" | "Downside Watch" }>;
}) {
  if (tab === "overview") {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <ReportDetailMetric label="Market Direction" value={report.market_direction.tone} />
          <ReportDetailMetric label="Risk Level" value={report.market_direction.risk_level} tone="risk" />
          <ReportDetailMetric label="Dominant Themes" value={report.market_direction.dominant_themes.join(" · ")} />
        </div>
        <DetailBlock title="AI Market Brief">
          <p className="text-[13px] leading-relaxed text-ml-text-dim">{report.ai_market_brief}</p>
        </DetailBlock>
      </div>
    );
  }

  if (tab === "candidates") {
    return (
      <DetailBlock title="Candidate Table">
        <CandidateDetailTable candidates={candidates} />
      </DetailBlock>
    );
  }

  if (tab === "news") {
    return (
      <DetailBlock title="News Catalyst Analysis">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {newsCatalystMap(report).map((item) => (
            <EvidenceRow
              key={`${item.theme}-${item.tickers}`}
              label={item.theme}
              value={`${item.tickers} · ${item.impact} · ${item.sourceType}`}
            />
          ))}
        </div>
      </DetailBlock>
    );
  }

  if (tab === "risk") {
    return (
      <DetailBlock title="Risk Alerts">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {riskAlertItems(report).map((risk) => (
            <EvidenceRow
              key={`${risk.ticker}-${risk.risk_type}-${risk.reason}`}
              label={`${risk.ticker} · ${risk.risk_type} · ${risk.severity}`}
              value={`${risk.reason} What to watch: ${risk.what_to_watch}`}
            />
          ))}
        </div>
      </DetailBlock>
    );
  }

  if (tab === "skill-packs") {
    return (
      <DetailBlock title="Skill Pack Results">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {SKILL_PACKS.map((pack) => (
            <EvidenceRow
              key={pack.id}
              label={pack.name}
              value={`${pack.starterDescription} Output contributes: ${pack.scoringContribution}.`}
            />
          ))}
        </div>
      </DetailBlock>
    );
  }

  if (tab === "data") {
    return (
      <DetailBlock title="Data Used">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <EvidenceRow label="Prices" value={report.data_used.price_source} />
          <EvidenceRow label="Headlines" value={report.data_used.news_source} />
          <EvidenceRow label="Filings" value={report.data_used.filing_source} />
          <EvidenceRow label="AI" value={report.provider === "mock" ? "Demo AI" : report.data_used.ai_provider} />
          <EvidenceRow label="Scan Time" value={report.generated_at} />
          <EvidenceRow label="Universe" value={report.universe.join(" · ")} />
        </div>
      </DetailBlock>
    );
  }

  return (
    <div className="rounded-[10px] border border-ml-border bg-ml-bg/40 px-4 py-4 text-[12.5px] leading-relaxed text-ml-text-dim">
      MarketLayer is for research and educational purposes only. It does not provide financial advice,
      direct trading instructions, brokerage services, or trade execution. Users are responsible for their
      own decisions.
    </div>
  );
}

function CandidateDetailTable({
  candidates,
}: {
  candidates: Array<(BullishCandidate | BearishCandidate) & { direction: "Bullish" | "Downside Watch" }>;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] text-left text-[12px]">
        <thead className="text-[10px] uppercase tracking-[0.16em] text-ml-text-muted">
          <tr className="border-b border-ml-border">
            <th className="py-2 pr-3 font-medium">Ticker</th>
            <th className="py-2 pr-3 font-medium">Direction</th>
            <th className="py-2 pr-3 font-medium">Score</th>
            <th className="py-2 pr-3 font-medium">Confidence</th>
            <th className="py-2 pr-3 font-medium">Risk</th>
            <th className="py-2 font-medium">Reason</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((candidate) => {
            const bullish = candidate.direction === "Bullish";
            const score = bullish
              ? displayBullishScore(candidate.ticker, (candidate as BullishCandidate).bullish_score)
              : (candidate as BearishCandidate).bearish_score;
            return (
              <tr key={`${candidate.direction}-${candidate.ticker}`} className="border-b border-ml-border/70 last:border-0">
                <td className="py-2 pr-3 font-mono text-ml-text">{candidate.ticker}</td>
                <td className={bullish ? "py-2 pr-3 text-ml-bullish" : "py-2 pr-3 text-ml-bearish"}>{candidate.direction}</td>
                <td className="py-2 pr-3 font-mono text-ml-text-dim">{score}</td>
                <td className="py-2 pr-3 font-mono text-ml-text-dim">{candidate.confidence}</td>
                <td className="py-2 pr-3 text-ml-text-dim">{formatRisk(candidate.risk_note)}</td>
                <td className="py-2 text-ml-text-dim">{friendlyReason(candidate.ticker, candidate.reason)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DetailBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border border-ml-border rounded-sm p-3">
      <div className="mb-3 text-[10px] uppercase tracking-[0.16em] text-ml-text-muted">{title}</div>
      {children}
    </section>
  );
}

function ReportDetailMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "risk";
}) {
  return (
    <div className="border border-ml-border rounded-sm p-3">
      <div className="text-[10px] uppercase tracking-[0.16em] text-ml-text-muted">{label}</div>
      <div className={tone === "risk" ? "mt-2 text-[13px] text-ml-risk" : "mt-2 text-[13px] text-ml-text-dim"}>
        {value}
      </div>
    </div>
  );
}

// ---------- News Sources management (Settings drawer) ----------

type NewsSourceType = "rss" | "api" | "ws";

interface NewsSource {
  id: string;
  name: string;
  type: NewsSourceType;
  url: string;
  enabled: boolean;
  builtIn: boolean;
  premium?: boolean;        // requires Catalayer subscription
  premiumUrl?: string;      // where to purchase/learn more
}

const NEWS_SOURCES_STORAGE_KEY = "marketlayer:news_sources";
const NEWS_SOURCES_DISABLED_KEY = "marketlayer:news_sources_disabled";

const BUILT_IN_NEWS_SOURCES: NewsSource[] = [
  {
    id: "yahoo_rss",
    name: "Yahoo Finance RSS",
    type: "rss",
    url: "https://feeds.finance.yahoo.com/rss/2.0/headline",
    enabled: true,
    builtIn: true,
  },
  {
    id: "google_news_rss",
    name: "Google News RSS",
    type: "rss",
    url: "https://news.google.com/rss/search",
    enabled: true,
    builtIn: true,
  },
  {
    id: "catalayer_news",
    name: "Catalayer News",
    type: "api",
    url: "https://api.catalayer.com/news",
    enabled: false,
    builtIn: true,
    premium: true,
    premiumUrl: "https://catalayer.com",
  },
];

function maskUrl(_url: string): string {
  // The endpoint itself is intentionally never displayed in the UI.
  return "Endpoint hidden";
}

function loadNewsSources(): NewsSource[] {
  let userSources: NewsSource[] = [];
  let disabled: string[] = [];
  try {
    const raw = window.localStorage.getItem(NEWS_SOURCES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        userSources = parsed
          .filter((s) => s && typeof s.url === "string" && typeof s.name === "string")
          .map((s) => ({
            id: typeof s.id === "string" ? s.id : `user-${Math.random().toString(36).slice(2, 8)}`,
            name: s.name,
            type: (s.type === "api" || s.type === "ws" || s.type === "rss" ? s.type : "rss") as NewsSourceType,
            url: s.url,
            enabled: s.enabled !== false,
            builtIn: false,
          }));
      }
    }
    const rawDisabled = window.localStorage.getItem(NEWS_SOURCES_DISABLED_KEY);
    if (rawDisabled) {
      const parsed = JSON.parse(rawDisabled);
      if (Array.isArray(parsed)) disabled = parsed.filter((id) => typeof id === "string");
    }
  } catch {
    // ignore localStorage errors
  }
  const builtIn = BUILT_IN_NEWS_SOURCES.map((s) => ({ ...s, enabled: !disabled.includes(s.id) }));
  return [...builtIn, ...userSources];
}

function NewsSourcesSection() {
  const [sources, setSources] = useState<NewsSource[]>(() => loadNewsSources());
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<{ name: string; type: NewsSourceType; url: string }>({
    name: "",
    type: "rss",
    url: "",
  });
  const [error, setError] = useState<string | null>(null);

  // Persist user sources + built-in disabled flags whenever the list changes.
  useEffect(() => {
    try {
      const userOnly = sources
        .filter((s) => !s.builtIn)
        .map(({ id, name, type, url, enabled }) => ({ id, name, type, url, enabled }));
      window.localStorage.setItem(NEWS_SOURCES_STORAGE_KEY, JSON.stringify(userOnly));
      const disabledBuiltIn = sources
        .filter((s) => s.builtIn && !s.enabled)
        .map((s) => s.id);
      window.localStorage.setItem(NEWS_SOURCES_DISABLED_KEY, JSON.stringify(disabledBuiltIn));
    } catch {
      // ignore
    }
  }, [sources]);

  function toggleSource(id: string) {
    setSources((prev) => prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)));
  }

  function removeSource(id: string) {
    setSources((prev) => prev.filter((s) => s.id !== id));
  }

  function submitDraft() {
    const name = draft.name.trim();
    const url = draft.url.trim();
    if (!name) {
      setError("Source name is required.");
      return;
    }
    if (!url) {
      setError("URL is required.");
      return;
    }
    try {
      // Allow http(s) for rss/api, ws(s) for websocket.
      const u = new URL(url);
      if (draft.type === "ws" && u.protocol !== "ws:" && u.protocol !== "wss:") {
        setError("WebSocket URL must start with ws:// or wss://.");
        return;
      }
      if (draft.type !== "ws" && u.protocol !== "http:" && u.protocol !== "https:") {
        setError("URL must start with http:// or https://.");
        return;
      }
    } catch {
      setError("URL is not valid.");
      return;
    }
    setSources((prev) => [
      ...prev,
      {
        id: `user-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        name,
        type: draft.type,
        url,
        enabled: true,
        builtIn: false,
      },
    ]);
    setDraft({ name: "", type: "rss", url: "" });
    setError(null);
    setAdding(false);
  }

  return (
    <section className="mt-4 ml-panel p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="ml-label">News sources</div>
          <p className="mt-1.5 text-[12px] leading-relaxed text-ml-text-dim">
            Connect RSS feeds, REST APIs, or WebSocket streams. Sources run in parallel during a market scan.
          </p>
        </div>
        {!adding && (
          <button
            type="button"
            onClick={() => {
              setAdding(true);
              setError(null);
            }}
            className="ml-button h-7 shrink-0 text-[11px]"
          >
            + Add
          </button>
        )}
      </div>

      <div className="mt-3 space-y-1.5">
        {sources.map((s) => (
          <div
            key={s.id}
            className={[
              "flex items-center gap-3 rounded-[10px] border px-3 py-2",
              s.premium
                ? "border-amber-500/25 bg-amber-500/5"
                : s.enabled
                  ? "border-ml-border bg-ml-bg/40"
                  : "border-ml-border bg-ml-bg/20 opacity-60",
            ].join(" ")}
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[12.5px] font-semibold text-ml-text">{s.name}</span>
                <span className="rounded-sm border border-ml-border px-1.5 py-[1px] font-mono text-[9px] uppercase tracking-[0.14em] text-ml-text-muted">
                  {s.type}
                </span>
                {s.premium ? (
                  <span className="rounded-sm border border-amber-500/50 bg-amber-500/10 px-1.5 py-[1px] font-mono text-[9px] uppercase tracking-[0.14em] text-amber-400">
                    Subscription
                  </span>
                ) : s.builtIn ? (
                  <span className="rounded-sm border border-ml-accent/30 px-1.5 py-[1px] font-mono text-[9px] uppercase tracking-[0.14em] text-ml-accent">
                    Built-in
                  </span>
                ) : null}
              </div>
              {s.premium && (
                <p className="mt-0.5 text-[11px] text-ml-text-muted">
                  Requires Catalayer subscription.{" "}
                  <a
                    href={s.premiumUrl || "https://catalayer.com"}
                    target="_blank"
                    rel="noreferrer"
                    className="text-amber-400 hover:text-amber-300 underline"
                  >
                    Learn more →
                  </a>
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                if (s.premium && !s.enabled) {
                  window.open(s.premiumUrl || "https://catalayer.com", "_blank");
                  return;
                }
                toggleSource(s.id);
              }}
              className={[
                "ml-button h-6 shrink-0 px-2 text-[10px]",
                s.premium && !s.enabled ? "border-amber-500/45 text-amber-400 hover:border-amber-500/70" : "",
              ].join(" ")}
              aria-label={s.enabled ? "Disable source" : "Enable source"}
            >
              {s.premium && !s.enabled ? "Get →" : s.enabled ? "On" : "Off"}
            </button>
            {!s.builtIn && !s.premium && (
              <button
                type="button"
                onClick={() => removeSource(s.id)}
                className="ml-button h-6 shrink-0 px-2 text-[10px]"
                aria-label="Remove source"
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>

      {adding && (
        <div className="mt-3 space-y-2 rounded-[10px] border border-ml-border-strong bg-ml-bg-elev/60 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[11px] uppercase tracking-[0.14em] text-ml-text-muted">New source</div>
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setError(null);
                setDraft({ name: "", type: "rss", url: "" });
              }}
              className="text-[14px] leading-none text-ml-text-muted hover:text-ml-text"
              aria-label="Cancel"
            >
              ×
            </button>
          </div>
          <input
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            className="ml-input"
            placeholder="Source name (e.g. Bloomberg API)"
          />
          <div className="grid grid-cols-3 gap-2">
            {(["rss", "api", "ws"] as const).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setDraft((d) => ({ ...d, type: id }))}
                className={[
                  "rounded-[10px] border px-2 py-1.5 text-[11px] uppercase tracking-[0.12em] transition-colors",
                  draft.type === id
                    ? "border-ml-border-strong bg-ml-bg-elev text-ml-text"
                    : "border-ml-border bg-ml-bg text-ml-text-muted hover:border-ml-border-strong",
                ].join(" ")}
              >
                {id === "ws" ? "WebSocket" : id === "api" ? "REST API" : "RSS"}
              </button>
            ))}
          </div>
          <input
            value={draft.url}
            onChange={(e) => setDraft((d) => ({ ...d, url: e.target.value }))}
            className="ml-input font-mono text-[11px]"
            placeholder={
              draft.type === "ws"
                ? "wss://example.com/stream"
                : draft.type === "api"
                  ? "https://api.example.com/news"
                  : "https://example.com/feed.rss"
            }
          />
          {error && <div className="text-[11px] text-ml-bearish">{error}</div>}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setError(null);
                setDraft({ name: "", type: "rss", url: "" });
              }}
              className="ml-button"
            >
              Cancel
            </button>
            <button type="button" onClick={submitDraft} className="ml-button-primary">
              Add source
            </button>
          </div>
        </div>
      )}

      <p className="mt-3 text-[11px] text-ml-text-muted">
        URLs are stored locally in your browser. Backend ingestion of user-added sources lands in a follow-up.
      </p>
    </section>
  );
}

function SettingsDrawer({
  mode,
  scanning,
  provider,
  providerError,
  onProviderChange,
  onClearProviderError,
  onRestartGuide,
  onClose,
}: {
  mode: "starter" | "pro";
  scanning: boolean;
  provider: string;
  providerError: string | null;
  onProviderChange: (id: string) => void;
  onClearProviderError: () => void;
  onRestartGuide: () => void;
  onClose: () => void;
}) {
  const [data, setData] = useState<ProviderListResponse | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [model, setModel] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const selected = useMemo<ProviderInfo | undefined>(
    () => data?.providers.find((p) => p.id === provider),
    [data, provider]
  );
  const needsBase = provider === "openai" || provider === "ollama" || provider === "custom";
  const needsModel = ["openai", "anthropic", "gemini", "ollama", "custom"].includes(provider);
  const needsKey = selected?.requires_api_key !== false; // hide key field for local providers (Ollama etc.)
  const isOllama = provider === "ollama";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const providers = await listProviders();
        if (cancelled) return;
        setData(providers);
      } catch {
        if (!cancelled) setData({ current: "mock", providers: [] });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-fill sensible defaults when the user switches to Ollama.
  useEffect(() => {
    if (provider === "ollama") {
      if (!baseUrl) setBaseUrl("http://localhost:11434");
      if (!model) setModel(OLLAMA_MODEL_PRESETS[0].value);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider]);

  async function runTest() {
    setMessage("Testing connection...");
    try {
      const r = await testProvider({
        provider,
        api_key: apiKey || undefined,
        base_url: baseUrl || undefined,
        model: model || undefined,
      });
      setMessage(r.connected ? `✓ ${r.message}` : `✗ ${r.message}`);
    } catch (e: any) {
      setMessage(`✗ ${e.message}`);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[rgba(2,6,10,0.62)] backdrop-blur-sm">
      <aside className="h-full w-full max-w-[480px] overflow-y-auto border-l border-ml-border bg-ml-bg px-5 py-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="ml-label">Settings</div>
            <h2 className="mt-1.5 text-[20px] font-semibold leading-tight">Console Settings</h2>
          </div>
          <button type="button" onClick={onClose} className="ml-button">Close</button>
        </div>

        <section className="mt-4 ml-panel p-4">
          <div className="ml-label">Current mode</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-[14px] font-semibold text-ml-text">
              {mode === "pro" ? "Pro Mode" : "Starter Mode"}
            </span>
            <span className="text-[11px] text-ml-text-muted">Switch mode from the top bar.</span>
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-ml-text-dim">
            {mode === "pro"
              ? "Full control over markets, data, skill packs, and reports."
              : "One-click scan. Best for beginners."}
          </p>
        </section>

        {providerError && (
          <div className="mt-4 flex items-center gap-2 rounded-[10px] border border-ml-bearish/45 bg-ml-bearish/8 px-3 py-2">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-ml-bearish" />
            <div className="min-w-0 flex-1">
              <div className="text-[10px] uppercase tracking-[0.14em] font-semibold text-ml-bearish">
                Needs attention · AI Provider
              </div>
              <p className="mt-0.5 text-[11.5px] leading-relaxed text-ml-text-dim break-words">
                {providerError}
              </p>
            </div>
          </div>
        )}

        <section
          className={[
            "mt-4 ml-panel p-4 space-y-3 transition-colors",
            providerError ? "!border-ml-bearish/45" : "",
          ].join(" ")}
        >
          <div>
            <div className="ml-label">AI Provider</div>
            <p className="mt-1.5 text-[12px] leading-relaxed text-ml-text-dim">
              Connect your own AI key for real market reports.
            </p>
          </div>
          {data ? (
            <SelectControl
              value={provider}
              onChange={(next) => {
                onClearProviderError();
                onProviderChange(next);
              }}
              options={(data.providers.length ? data.providers : fallbackProviders)
                .filter((p) => p.id !== "mock")
                .map((p) => ({
                  value: p.id,
                  label: providerDisplayName(p),
                }))}
            />
          ) : (
            <LoadingState label="Loading providers..." />
          )}
          {provider === "catalayer" && (
            <div className="flex items-start gap-2 rounded-[10px] border border-amber-500/30 bg-amber-500/5 px-3 py-2.5">
              <span className="mt-[1px] shrink-0 text-amber-400">⭐</span>
              <div className="min-w-0">
                <p className="text-[11px] leading-relaxed text-amber-300/90">
                  Catalayer AI requires a subscription. Enter your API key below, or{" "}
                  <a
                    href="https://catalayer.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-amber-400 underline underline-offset-2 hover:text-amber-300"
                  >
                    get access at catalayer.com →
                  </a>
                </p>
              </div>
            </div>
          )}
          {needsKey && (
            <input
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="ml-input font-mono"
              type="password"
              placeholder="API key"
            />
          )}
          {needsBase && (
            <input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="ml-input font-mono"
              placeholder={isOllama ? "http://localhost:11434" : "Base URL / Endpoint"}
            />
          )}
          {needsModel && (
            isOllama ? (
              <SelectControl
                value={model || OLLAMA_MODEL_PRESETS[0].value}
                onChange={setModel}
                options={OLLAMA_MODEL_PRESETS}
              />
            ) : (
              <input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="ml-input font-mono"
                placeholder="Optional model"
              />
            )
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={
                provider === "mock" ||
                (!!selected?.requires_api_key && !apiKey.trim())
              }
              onClick={async () => {
                try {
                  const res = await setProviderConfig({
                    provider,
                    api_key: apiKey || undefined,
                    base_url: baseUrl || undefined,
                    model: model || undefined,
                  });
                  onClearProviderError();
                  onProviderChange(provider);
                  setMessage(res.message);
                } catch (e: any) {
                  setMessage(`Failed to apply config: ${e.message}`);
                }
              }}
              className="ml-button-primary"
            >
              Save AI Key
            </button>
            <button
              type="button"
              disabled={provider === "mock"}
              onClick={runTest}
              className="ml-button"
            >
              Test Connection
            </button>
          </div>
          {message && (() => {
            const isError = message.startsWith("✗") || message.startsWith("Failed") || message.toLowerCase().includes("error");
            return (
              <div className={[
                "rounded-[10px] border p-3 text-[12px]",
                isError
                  ? "border-ml-bearish/35 bg-ml-bearish/5 text-ml-bearish"
                  : "border-ml-accent/25 bg-ml-accent/10 text-ml-accent",
              ].join(" ")}>
                {message}
              </div>
            );
          })()}
          {provider === "mock" ? (
            <div className="rounded-[10px] border border-ml-accent/30 bg-ml-accent/5 px-3 py-2 text-[12px] text-ml-text-dim">
              <span className="font-semibold text-ml-accent">Demo AI is ready.</span> No key required.
            </div>
          ) : (
            <p className="text-[11px] text-ml-text-muted">
              API keys stay local/server-side and are never exposed in frontend responses.
            </p>
          )}
        </section>

        <NewsSourcesSection />

        <section className="mt-4 ml-panel p-4">
          <div className="ml-label">Help</div>
          <p className="mt-1.5 text-[12px] leading-relaxed text-ml-text-dim">
            Replay the short walkthrough for Starter Mode.
          </p>
          <div className="mt-2.5 flex items-center gap-3">
            <button
              type="button"
              onClick={onRestartGuide}
              disabled={scanning}
              className="ml-button"
            >
              Restart Guide
            </button>
            {scanning && (
              <span className="text-[11px] text-ml-text-muted">
                Guide available after scan completes.
              </span>
            )}
          </div>
        </section>
      </aside>
    </div>
  );
}

function StatusMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: "bullish" | "bearish" | "risk";
}) {
  const color =
    tone === "bullish"
      ? "text-ml-bullish"
      : tone === "bearish"
        ? "text-ml-bearish"
        : tone === "risk"
          ? "text-ml-risk"
          : "text-ml-text";
  return (
    <div className="border border-ml-border bg-ml-panel px-3 py-1.5 min-w-0">
      <div className="text-[9px] uppercase tracking-[0.16em] text-ml-text-muted truncate">{label}</div>
      <div className={`mt-1 truncate font-mono text-[13px] ${color}`}>{value}</div>
    </div>
  );
}

function ControlBlock({ title, meta, children }: { title: string; meta?: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="text-[10px] uppercase tracking-[0.16em] text-ml-text-muted">{title}</div>
        {meta && <span className="text-[10px] text-ml-text-muted">{meta}</span>}
      </div>
      {children}
    </div>
  );
}

function EditableControl({ label, children }: { label: string; children: ReactNode }) {
  return (
    <ControlBlock title={label} meta="Editable">
      {children}
    </ControlBlock>
  );
}

function EditableSummary({ label, value }: { label: string; value: string }) {
  return (
    <ControlBlock title={label} meta="Editable">
      <div className="border border-ml-border bg-ml-bg px-3 py-2 text-[12px] leading-relaxed text-ml-text-dim">
        {value}
      </div>
    </ControlBlock>
  );
}

function SegmentedChoice({
  value,
  options,
  onChange,
}: {
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={[
            "border px-3 py-2 text-[12px] transition-colors",
            value === option.value
              ? "border-ml-accent/50 bg-ml-accent/10 text-ml-accent"
              : "border-ml-border bg-ml-bg text-ml-text-dim hover:border-ml-border-strong",
          ].join(" ")}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function FirstUseGuide() {
  return (
    <section className="ml-panel p-5">
      <div className="ml-label">Start in 3 steps</div>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <GuideStep index="1" text="Use Demo AI or connect your own AI key." />
        <GuideStep index="2" text="Click Analyze Market." />
        <GuideStep index="3" text="Review bullish and bearish candidates." />
      </div>
    </section>
  );
}

function GuideStep({ index, text }: { index: string; text: string }) {
  return (
    <div className="border border-ml-border rounded-sm p-4">
      <div className="font-mono text-ml-accent">{index}</div>
      <p className="mt-2 text-[12px] leading-relaxed text-ml-text-dim">{text}</p>
    </div>
  );
}

function DecisionPanel({
  mode,
  title,
  candidates,
  tone,
  empty,
  onDetails,
}: {
  mode: "starter" | "pro";
  title: string;
  candidates: Array<BullishCandidate | BearishCandidate>;
  tone: "bullish" | "bearish";
  empty: string;
  onDetails: () => void;
}) {
  return (
    <ConsolePanel title={title}>
      <div className="space-y-3">
        {candidates.length === 0 ? (
          <div className="text-[12px] text-ml-text-muted">{empty}</div>
        ) : (
          candidates.map((candidate) => (
            <CandidateCard
              key={candidate.ticker}
              mode={mode}
              candidate={candidate}
              tone={tone}
              onDetails={onDetails}
            />
          ))
        )}
      </div>
    </ConsolePanel>
  );
}

function CandidateCard({
  mode,
  candidate,
  tone,
  onDetails,
}: {
  mode: "starter" | "pro";
  candidate: BullishCandidate | BearishCandidate;
  tone: "bullish" | "bearish";
  onDetails: () => void;
}) {
  const score =
    tone === "bullish"
      ? displayBullishScore(candidate.ticker, (candidate as BullishCandidate).bullish_score)
      : (candidate as BearishCandidate).bearish_score;
  const candidatePacks = candidateSkillPacks(candidate.ticker, tone);
  return (
    <article className="border border-ml-border rounded-sm p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`font-mono text-base tracking-widest ${tone === "bullish" ? "text-ml-bullish" : "text-ml-bearish"}`}>
              {candidate.ticker}
            </span>
            <span className="truncate text-[11px] text-ml-text-muted">{candidate.company_name}</span>
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[11px] text-ml-text-muted">
            <span className={tone === "bullish" ? "text-ml-bullish" : "text-ml-bearish"}>
              Score {score}
            </span>
            <span>Confidence {candidate.confidence}</span>
            <span>Risk {formatRisk(candidate.risk_note)}</span>
          </div>
        </div>
        <span className="ml-pill shrink-0">{candidate.status}</span>
      </div>
      <p className="mt-2 text-[12px] leading-relaxed text-ml-text-dim">
        {friendlyReason(candidate.ticker, candidate.reason)}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {candidatePacks.map((pack) => (
          <span key={pack} className="rounded-sm border border-ml-border bg-ml-bg px-2 py-1 text-[10px] text-ml-text-muted">
            {pack}
          </span>
        ))}
        <button type="button" onClick={onDetails} className="ml-button text-[11px] py-1">
          View Details
        </button>
        {mode === "pro" && (
          <>
            <button type="button" className="ml-button text-[11px] py-1">Inspect Signals</button>
            <button type="button" className="ml-button text-[11px] py-1">Run Asset Analysis</button>
          </>
        )}
      </div>
    </article>
  );
}

function MiniMetric({ label, value, tone }: { label: string; value: string | number; tone?: "bullish" | "bearish" }) {
  return (
    <div className="border border-ml-border rounded-sm p-2">
      <div className="text-[9px] uppercase tracking-[0.16em] text-ml-text-muted">{label}</div>
      <div className={`mt-1 font-mono text-[12px] ${tone === "bullish" ? "text-ml-bullish" : tone === "bearish" ? "text-ml-bearish" : "text-ml-text-dim"}`}>{value}</div>
    </div>
  );
}

function ConsolePanel({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="ml-panel p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="ml-label">{title}</div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function VerdictChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] border border-ml-border bg-ml-bg px-3 py-2">
      <div className="text-[10px] uppercase tracking-[0.14em] text-ml-text-muted">{label}</div>
      <div className="mt-0.5 truncate font-mono text-[12px] text-ml-text">{value}</div>
    </div>
  );
}

function CandidatesBoard({
  mode,
  bullish,
  bearish,
  watchlist,
  risks,
  onDetails,
}: {
  mode: "starter" | "pro";
  bullish: Array<BullishCandidate | BearishCandidate>;
  bearish: Array<BullishCandidate | BearishCandidate>;
  watchlist: GeneratedWatchlistItem[];
  risks: RiskAlert[];
  onDetails: () => void;
}) {
  return (
    <ConsolePanel title="Candidates Board">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <CandidateColumn
          title="Bullish Candidates"
          tone="bullish"
          mode={mode}
          candidates={bullish}
          empty="No bullish candidates detected in the latest scan."
          onDetails={onDetails}
        />
        <CandidateColumn
          title="Bearish / Downside Candidates"
          tone="bearish"
          mode={mode}
          candidates={bearish}
          empty="No strong bearish candidates detected."
          risks={risks}
          onDetails={onDetails}
        />
      </div>
      <div className="mt-4 border-t border-ml-border pt-3">
        <CompactTickerLine
          label="Watchlist"
          tone="bullish"
          tickers={watchlist.filter((item) => item.direction === "bullish").slice(0, 8).map((item) => item.ticker)}
          empty="None"
        />
      </div>
    </ConsolePanel>
  );
}

function CandidateColumn({
  title,
  candidates,
  tone,
  mode,
  empty,
  risks,
  onDetails,
}: {
  title: string;
  candidates: Array<BullishCandidate | BearishCandidate>;
  tone: "bullish" | "bearish";
  mode: "starter" | "pro";
  empty: string;
  risks?: RiskAlert[];
  onDetails: () => void;
}) {
  return (
    <div className="rounded-sm border border-ml-border bg-ml-bg/45 p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-[11px] uppercase tracking-[0.16em] text-ml-text-muted">{title}</div>
        <span className={tone === "bullish" ? "font-mono text-[11px] text-ml-bullish" : "font-mono text-[11px] text-ml-bearish"}>
          {candidates.length}
        </span>
      </div>
      <div className="space-y-3">
        {candidates.length ? (
          candidates.slice(0, 3).map((candidate) => (
            <CandidateCard
              key={candidate.ticker}
              mode={mode}
              candidate={candidate}
              tone={tone}
              onDetails={onDetails}
            />
          ))
        ) : (
          <DownsideEmptyState empty={empty} risks={risks ?? []} />
        )}
      </div>
    </div>
  );
}

function DownsideEmptyState({ empty, risks }: { empty: string; risks: RiskAlert[] }) {
  const fallbackMonitors: Array<{ ticker: string; reason: string }> = [
    { ticker: "AAPL", reason: "volatility" },
    { ticker: "NFLX", reason: "weak momentum" },
  ];
  const monitors =
    risks.length > 0
      ? risks.slice(0, 2).map((r) => ({ ticker: r.ticker, reason: r.risk_type.toLowerCase() }))
      : fallbackMonitors;
  return (
    <div className="rounded-[10px] border border-ml-border bg-ml-panel px-3 py-2.5">
      <p className="text-[12px] leading-relaxed text-ml-text-dim">{empty}</p>
      <div className="mt-2 flex items-center gap-2 text-[11px] text-ml-text-muted">
        <span className="uppercase tracking-[0.14em]">Downside pressure</span>
        <span className="font-mono text-ml-bullish">Low</span>
      </div>
      <div className="mt-3 space-y-1.5">
        <div className="text-[10px] uppercase tracking-[0.16em] text-ml-text-muted">Closest downside monitors</div>
        {monitors.map((m) => (
          <div key={`${m.ticker}-${m.reason}`} className="flex items-center justify-between gap-3 text-[11px]">
            <span className="font-mono text-ml-risk">{m.ticker}</span>
            <span className="truncate text-ml-text-muted">— {m.reason}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 border-t border-ml-border pt-2.5">
        <div className="text-[10px] uppercase tracking-[0.16em] text-ml-text-muted">What this means</div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-ml-text-dim">
          No strong short-side signal was detected, but these names should be watched if market risk rises.
        </p>
      </div>
    </div>
  );
}

function EvidenceBoard({ report }: { report: MarketReport }) {
  return (
    <ConsolePanel title="Evidence Board">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="rounded-sm border border-ml-border bg-ml-bg/45 p-3">
          <div className="mb-3 text-[11px] uppercase tracking-[0.16em] text-ml-text-muted">News Catalysts</div>
          <div className="space-y-3">
            {newsCatalystMap(report).slice(0, 3).map((item) => (
              <CatalystRow key={`${item.theme}-${item.tickers}-${item.impact}`} item={item} />
            ))}
          </div>
        </div>
        <div className="rounded-sm border border-ml-border bg-ml-bg/45 p-3">
          <div className="mb-3 text-[11px] uppercase tracking-[0.16em] text-ml-text-muted">Risk Alerts</div>
          <div className="space-y-3">
            {riskAlertItems(report).slice(0, 3).map((risk) => (
              <RiskAlertCard key={`${risk.ticker}-${risk.risk_type}-${risk.reason}`} risk={risk} />
            ))}
          </div>
        </div>
      </div>
    </ConsolePanel>
  );
}

function AIReasoningPanel({ report }: { report: MarketReport }) {
  const bullishNames = topCandidateNames(report);
  const bearishExplanation = report.bearish_candidates.length
    ? `${report.bearish_candidates.slice(0, 3).map((candidate) => candidate.ticker).join(", ")} show stronger downside pressure.`
    : "No bearish candidate cleared the default confirmation threshold, but downside risk can still rise if public data worsens.";
  return (
    <ConsolePanel title="AI Reasoning">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <ReasoningBlock
          title="Why bullish"
          items={[
            `Large-cap names show stronger momentum, led by ${bullishNames || "the top watchlist names"}.`,
            "Public headlines are more supportive than negative across the strongest candidates.",
            "Built-in skill packs align around price movement, catalysts, and confirmation.",
          ]}
        />
        <ReasoningBlock
          title="Why risk remains high"
          items={[
            "Volatility is still elevated in parts of the default watchlist.",
            "Bearish confirmation is weak, not permanently absent.",
            "New public headlines or filings may change candidate confidence.",
          ]}
        />
        <ReasoningBlock
          title="What could change the view"
          items={[
            "New negative headlines or earnings surprises.",
            "Price momentum reversal in the leading candidates.",
            "Broader market risk-off movement or sector pressure.",
            bearishExplanation,
          ]}
        />
      </div>
    </ConsolePanel>
  );
}

function ReasoningBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-sm border border-ml-border bg-ml-bg px-3 py-3">
      <div className="text-[10px] uppercase tracking-[0.16em] text-ml-text-muted">{title}</div>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <div key={item} className="flex gap-2 text-[12px] leading-relaxed text-ml-text-dim">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ml-accent/70" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EvidenceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-ml-border rounded-sm px-3 py-2">
      <div className="text-[10px] uppercase tracking-[0.16em] text-ml-text-muted">{label}</div>
      <div className="mt-1 text-[12px] leading-relaxed text-ml-text-dim">{value}</div>
    </div>
  );
}

function CatalystRow({
  item,
  active = false,
}: {
  item: { theme: string; tickers: string; impact: string; sourceType: string };
  active?: boolean;
}) {
  const color =
    item.impact === "positive"
      ? "text-ml-bullish"
      : item.impact === "negative"
        ? "text-ml-bearish"
        : item.impact === "mixed"
          ? "text-ml-risk"
          : "text-ml-text-muted";
  return (
    <div
      className={[
        "rounded-[10px] border px-3 py-2 transition-colors",
        active ? "border-ml-accent/55 bg-ml-accent/5" : "border-ml-border",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-[10px] uppercase tracking-[0.16em] text-ml-text-muted">{item.theme}</div>
        <div className={`font-mono text-[10px] uppercase ${color}`}>{item.impact}</div>
      </div>
      <div className={`mt-1 text-[12px] leading-relaxed ${active ? "text-ml-accent" : "text-ml-text-dim"}`}>
        {item.tickers}
      </div>
      <div className="mt-1 text-[10px] text-ml-text-muted">{item.sourceType}</div>
    </div>
  );
}

function RiskAlertCard({ risk }: { risk: RiskAlert }) {
  const severityClass =
    risk.severity === "High"
      ? "text-ml-bearish"
      : risk.severity === "Medium"
        ? "text-ml-risk"
        : "text-ml-text-muted";
  return (
    <div className="border border-ml-border rounded-sm px-3 py-2">
      <div className="flex items-center justify-between gap-3">
        <div className="font-mono text-[12px] text-ml-text-dim">{risk.ticker}</div>
        <div className={`font-mono text-[10px] uppercase ${severityClass}`}>{risk.severity}</div>
      </div>
      <div className="mt-1 text-[11px] uppercase tracking-[0.14em] text-ml-text-muted">{risk.risk_type}</div>
      <p className="mt-2 text-[12px] leading-relaxed text-ml-text-dim">{risk.reason}</p>
      <p className="mt-2 text-[11px] leading-relaxed text-ml-text-muted">{risk.what_to_watch}</p>
    </div>
  );
}

function MiniCount({ label, value, tone }: { label: string; value: number; tone: "bullish" | "bearish" | "risk" }) {
  const color = tone === "bullish" ? "text-ml-bullish" : tone === "bearish" ? "text-ml-bearish" : "text-ml-risk";
  return (
    <div className="border border-ml-border rounded-sm p-3">
      <div className="ml-label-muted">{label}</div>
      <div className={`mt-2 font-mono text-xl ${color}`}>{value}</div>
    </div>
  );
}

function CompactWatchlistSummary({ items }: { items: GeneratedWatchlistItem[] }) {
  const bullish = items.filter((item) => item.direction === "bullish").map((item) => item.ticker);
  const bearish = items.filter((item) => item.direction === "bearish").map((item) => item.ticker);
  const highRisk = items
    .filter((item) => item.risk_level === "High" || item.status === "High Risk")
    .map((item) => item.ticker);

  return (
    <div className="mt-4 space-y-2">
      <CompactTickerLine label="Bullish" tone="bullish" tickers={bullish} empty="None" />
      <CompactTickerLine label="Bearish" tone="bearish" tickers={bearish} empty="None" />
      <CompactTickerLine label="High Risk" tone="risk" tickers={highRisk} empty="None" />
    </div>
  );
}

function CompactTickerLine({
  label,
  tickers,
  empty,
  tone,
}: {
  label: string;
  tickers: string[];
  empty: string;
  tone: "bullish" | "bearish" | "risk";
}) {
  const color = tone === "bullish" ? "text-ml-bullish" : tone === "bearish" ? "text-ml-bearish" : "text-ml-risk";
  return (
    <div className="flex items-center gap-3 border border-ml-border rounded-sm px-3 py-2">
      <div className="w-20 shrink-0 text-[10px] uppercase tracking-[0.16em] text-ml-text-muted">{label}</div>
      <div className={`font-mono text-[12px] tracking-widest ${tickers.length ? color : "text-ml-text-muted"}`}>
        {tickers.length ? tickers.join(" · ") : empty}
      </div>
    </div>
  );
}

function WatchlistMiniCard({ item }: { item: GeneratedWatchlistItem }) {
  const color =
    item.direction === "bullish"
      ? "text-ml-bullish"
      : item.direction === "bearish"
        ? "text-ml-bearish"
        : "text-ml-text-dim";
  return (
    <div className="border border-ml-border rounded-sm p-3">
      <div className="flex items-center justify-between gap-3">
        <span className={`font-mono tracking-widest ${color}`}>{item.ticker}</span>
        <span className="font-mono text-[11px] text-ml-text-muted">{item.score}</span>
      </div>
      <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-ml-text-muted">
        {item.last_reason}
      </p>
    </div>
  );
}

function ModeCard({ title, body, active, onClick }: { title: string; body: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "text-left border rounded-[10px] p-3 transition-colors",
        active
          ? "border-ml-border-strong bg-ml-bg-elev"
          : "border-ml-border bg-ml-panel hover:border-ml-border-strong",
      ].join(" ")}
    >
      <div className="text-[13px] font-semibold text-ml-text">
        {title}
      </div>
      <p className="mt-1.5 text-[11.5px] leading-relaxed text-ml-text-dim">{body}</p>
    </button>
  );
}

function newsCatalystMap(report: MarketReport) {
  const mapped = report.news_catalysts.slice(0, 6).map((item) => ({
    theme: simplifyHeadline(item.headline),
    tickers: item.ticker,
    impact: item.ai_impact,
    sourceType: item.source || "Public headlines",
  }));
  const grouped = new Map<string, { tickers: Set<string>; impact: string; sourceType: string }>();
  for (const item of mapped) {
    const current = grouped.get(item.theme) ?? {
      tickers: new Set<string>(),
      impact: item.impact,
      sourceType: item.sourceType,
    };
    current.tickers.add(item.tickers);
    if (current.impact !== item.impact) current.impact = "mixed";
    grouped.set(item.theme, current);
  }
  if (grouped.size === 0) {
    grouped.set("public headline pressure", {
      tickers: new Set(["multiple names"]),
      impact: "neutral",
      sourceType: "Public headlines",
    });
  }
  return Array.from(grouped.entries()).map(([theme, value]) => ({
    theme,
    tickers: Array.from(value.tickers).join(" / "),
    impact: value.impact,
    sourceType: value.sourceType,
  }));
}

function simplifyHeadline(headline: string) {
  // Return the actual headline text (truncated), so Main Catalyst shows real news.
  return headline.length > 52 ? headline.slice(0, 50) + "…" : headline;
}

function riskAlertItems(report: MarketReport): RiskAlert[] {
  if (report.risk_alerts.length) return report.risk_alerts.slice(0, 6);
  return [
    {
      ticker: "MARKET",
      risk_type: "Data uncertainty",
      severity: report.market_direction.risk_level,
      reason: "The latest scan has limited risk alert coverage.",
      what_to_watch: "Review candidate confidence and public headline confirmation.",
    },
  ];
}

function systemLogs(report: MarketReport | null) {
  if (!report) {
    return [
      "Ready: market registry loaded",
      "Ready: skill packs configured",
      "Ready: public data connectors available",
    ];
  }
  const t = shortTime(report.generated_at);
  return [
    `${t} Market selected.`,
    ...PIPELINE_STEPS.map((step) => `${t} ${step}.`),
    `${t} Watchlist updated.`,
  ];
}

function shortTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function averageConfidence(candidates: Array<BullishCandidate | BearishCandidate>) {
  if (!candidates.length) return 0;
  return Math.round(candidates.reduce((sum, item) => sum + item.confidence, 0) / candidates.length);
}

function formatRisk(note: string) {
  return note.replace(/^Risk level:\s*/i, "").split(".")[0] || "Review";
}

function friendlyReason(_ticker: string, fallback: string) {
  // No-op pass-through. Real backend reason is shown as-is for honest testing.
  return fallback;
}

function reportConclusion(report: MarketReport) {
  const bullish = report.bullish_candidates.slice(0, 3).map((item) => item.ticker).join(", ");
  const bearish = report.bearish_candidates.slice(0, 3).map((item) => item.ticker).join(", ");
  const risk = report.market_direction.risk_level.toLowerCase();
  if (bearish) {
    return `Market view is ${report.market_direction.tone.toLowerCase()} with ${risk} risk. Stronger bullish candidates include ${bullish || "no clear names"}, while downside pressure is most visible in ${bearish}.`;
  }
  return `Market view is ${report.market_direction.tone.toLowerCase()}, but risk remains ${risk}. The strongest watch candidates are ${bullish || "not yet available"} based on price movement, public headlines, and built-in skill packs.`;
}

function verdictHeadline(report: MarketReport) {
  const tone = report.market_direction.tone;
  const risk = report.market_direction.risk_level.toLowerCase();
  if (tone.toLowerCase().includes("bull")) return `Bullish, but risk remains ${risk}.`;
  if (tone.toLowerCase().includes("bear") || tone.toLowerCase().includes("risk")) return `${tone}, with ${risk} risk.`;
  return `${tone}, with ${risk} risk.`;
}

function topCandidateNames(report: MarketReport) {
  return report.bullish_candidates.slice(0, 3).map((item) => item.ticker).join(" · ");
}

function mainCatalyst(report: MarketReport) {
  return newsCatalystMap(report)[0]?.theme ?? "public market data";
}

function mainRisk(report: MarketReport) {
  return riskAlertItems(report)[0]?.risk_type?.toLowerCase() ?? `${report.market_direction.risk_level.toLowerCase()} market risk`;
}

function shortStyleName(name: string) {
  return name.replace(" Mode", "");
}

function shortPackName(name: string) {
  return name.replace(" Pack", "");
}

function providerShortName(provider: string) {
  if (provider === "demo" || provider === "mock") return "Demo AI";
  if (provider === "openai") return "OpenAI";
  if (provider === "claude" || provider === "anthropic") return "Claude";
  if (provider === "gemini") return "Gemini";
  if (provider === "ollama") return "Ollama";
  if (provider === "catalayer") return "Catalayer AI";
  return provider;
}

function pipelineStepState(
  status: PipelineStatus,
  currentStep: number | null,
  index: number
): "waiting" | "running" | "done" | "error" {
  if (status === "error" && currentStep === index) return "error";
  if (status === "complete") return "done";
  if (status !== "running" || currentStep === null) return "waiting";
  if (index < currentStep) return "done";
  if (index === currentStep) return "running";
  return "waiting";
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function packPresetFromIds(ids: string[]) {
  const sorted = [...ids].sort().join(",");
  if (sorted === ["momentum", "news-catalyst", "risk-radar"].sort().join(",")) return "core";
  if (sorted === ["momentum", "news-catalyst"].sort().join(",")) return "catalyst";
  if (ids.length === SKILL_PACKS.length) return "all";
  return "custom";
}

function packPresetToIds(value: string): string[] | null {
  if (value === "catalyst") return ["momentum", "news-catalyst"];
  if (value === "all") return SKILL_PACKS.map((pack) => pack.id);
  if (value === "core") return ["momentum", "news-catalyst", "risk-radar"];
  // "custom" should not modify the active set on its own; the caller opens Settings.
  return null;
}

function providerDisplayName(provider: ProviderInfo) {
  if (provider.id === "mock") return "Demo AI";
  if (provider.id === "anthropic") return "Claude";
  return provider.name;
}

function providerLabel(id: string, info?: ProviderInfo): string {
  if (info) return providerDisplayName(info);
  if (id === "mock") return "Demo AI";
  if (id === "catalayer") return "Catalayer AI";
  if (id === "openai") return "OpenAI";
  if (id === "anthropic") return "Claude";
  if (id === "gemini") return "Gemini";
  if (id === "ollama") return "Ollama";
  return id;
}

function providerStatus(id: string, info?: ProviderInfo): string {
  if (id === "mock") return "Ready";
  if (info?.is_local && info?.configured) return "Local";
  if (info?.requires_api_key && info?.configured) return "Key saved";
  if (info?.requires_api_key && !info?.configured) return "Key missing";
  if (id === "catalayer") return info?.configured ? "Connected" : "Not connected";
  if (id === "ollama") return "Local";
  return info?.configured ? "Connected" : "Key missing";
}

function candidateSkillPacks(_ticker: string, tone: "bullish" | "bearish") {
  // Tone-based default tags. No per-ticker hardcoded mapping any more — when the
  // backend exposes which packs actually fired for a candidate, swap this for
  // those real values.
  return tone === "bearish" ? ["News Catalyst", "Risk Radar"] : ["Momentum", "News Catalyst"];
}

// Full supported provider list — used as the dropdown source when /api/providers
// is unreachable so the user can still pick + paste a key offline.
const fallbackProviders: ProviderInfo[] = [
  { id: "mock", name: "Demo AI", description: "No key required", requires_api_key: false, configured: true, env_keys: [], is_local: true, is_placeholder: false },
  { id: "catalayer", name: "Catalayer AI", description: "Catalayer market-reasoning provider", requires_api_key: true, configured: false, env_keys: ["CATALAYER_API_KEY"], is_local: false, is_placeholder: false },
  { id: "openai", name: "OpenAI-compatible", description: "OpenAI / Together / Groq / Fireworks / DeepInfra etc.", requires_api_key: true, configured: false, env_keys: ["OPENAI_API_KEY", "OPENAI_BASE_URL", "OPENAI_MODEL"], is_local: false, is_placeholder: false },
  { id: "anthropic", name: "Claude", description: "Anthropic Claude", requires_api_key: true, configured: false, env_keys: ["ANTHROPIC_API_KEY", "ANTHROPIC_MODEL"], is_local: false, is_placeholder: false },
  { id: "gemini", name: "Gemini", description: "Google Gemini", requires_api_key: true, configured: false, env_keys: ["GEMINI_API_KEY", "GEMINI_MODEL"], is_local: false, is_placeholder: false },
  { id: "ollama", name: "Ollama (local)", description: "Local Ollama — Qwen / Llama / Gemma / Mistral", requires_api_key: false, configured: true, env_keys: ["OLLAMA_BASE_URL", "OLLAMA_MODEL"], is_local: true, is_placeholder: false },
  { id: "custom", name: "Custom", description: "Custom HTTP endpoint", requires_api_key: true, configured: false, env_keys: [], is_local: false, is_placeholder: false },
];

function enhanceWatchlistItem(item: GeneratedWatchlistItem): GeneratedWatchlistItem {
  // Identity pass-through. Backend values are shown as-is; no synthetic caps or rewrites.
  return item;
}

function displayBullishScore(_ticker: string, fallback: number) {
  return fallback;
}

export default StarterHome;
