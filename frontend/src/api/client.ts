// MarketLayer API client.
// Communicates with the FastAPI backend via Vite's dev proxy at /api.

export type Impact = "positive" | "negative" | "mixed" | "neutral";
export type RiskLevel = "low" | "moderate" | "elevated" | "high";
export type SignalType =
  | "momentum"
  | "earnings_reaction"
  | "news_catalyst"
  | "mean_reversion"
  | "etf_rotation";
export type SignalStatus =
  | "monitoring"
  | "passed"
  | "blocked"
  | "review_required";
export type GateDecision =
  | "passed"
  | "warning"
  | "blocked"
  | "review_required";
export type StrategyStatus = "active" | "paused" | "research";
export type WatchlistAction = "monitor" | "deepen" | "pause";
export type MarketPhase = "pre" | "regular" | "post" | "closed";

// ----- research models -----

export interface KeyCatalyst {
  title: string;
  description: string;
  impact: Impact;
}

export interface FilingHighlight {
  form: string;
  filed_at?: string | null;
  summary: string;
}

export interface ResearchReport {
  ticker: string;
  company_name: string;
  company_overview: string;
  latest_market_movement: string;
  key_catalysts: KeyCatalyst[];
  sec_filing_highlights: FilingHighlight[];
  news_event_summary: string;
  bull_case: string[];
  bear_case: string[];
  risk_factors: string[];
  market_impact_score: number;
  confidence_score: number;
  watchlist_triggers: string[];
  final_summary: string;
  provider_used: string;
  disclaimer: string;
}

export interface EventAnalysis {
  ticker: string;
  event_text: string;
  classification: string;
  impact: Impact;
  short_term_view: string;
  medium_term_view: string;
  risk_factors: string[];
  market_impact_score: number;
  confidence_score: number;
  provider_used: string;
  disclaimer: string;
}

// ----- providers -----

export interface ProviderInfo {
  id: string;
  name: string;
  description: string;
  requires_api_key: boolean;
  configured: boolean;
  env_keys: string[];
  is_local: boolean;
  is_placeholder: boolean;
}

export interface ProviderListResponse {
  current: string;
  providers: ProviderInfo[];
}

// ----- console models -----

export interface Signal {
  id: string;
  ticker: string;
  signal_type: SignalType;
  confidence: number;
  risk_level: RiskLevel;
  status: SignalStatus;
  rationale: string;
  emitted_at: string;
}

export interface BacktestSnapshot {
  period: string;
  universe: string;
  signals_per_week: number;
  hit_rate_pct: number;
  median_holding_window: string;
  coverage_pct: number;
  note: string;
}

export interface StrategyCard {
  id: string;
  name: string;
  category: string;
  market_type: "us_equity" | "crypto" | "etf" | "fx";
  description: string;
  universe: string;
  status: StrategyStatus;
  enabled: boolean;
  last_run_at: string;
  backtest: BacktestSnapshot;
}

export interface StrategyFit {
  strategy_id: string;
  strategy_name: string;
  fit_score: number;
  reason: string;
}

export type RiskCheckName =
  | "volatility"
  | "liquidity"
  | "event_risk"
  | "data_quality"
  | "ai_confidence"
  | "portfolio_exposure";

export interface RiskGateCheck {
  name: RiskCheckName;
  label: string;
  status: GateDecision;
  score: number;
  detail: string;
}

export interface RiskGateResult {
  ticker: string;
  decision: GateDecision;
  summary: string;
  checks: RiskGateCheck[];
  last_run_at: string;
  disclaimer: string;
}

export interface AIDecisionBrief {
  ticker: string;
  headline: string;
  thesis: string;
  key_factors: string[];
  signals_weight: string;
  risk_posture: RiskLevel;
  watchlist_action: WatchlistAction;
  confidence: number;
  provider_used: string;
  disclaimer: string;
}

export interface PriceAction {
  ticker: string;
  last_price: number;
  change_pct_1d: number;
  range_30d: string;
  relative_strength: string;
  note: string;
}

export interface WatchlistItem {
  ticker: string;
  last_price: number;
  change_pct_1d: number;
  note: string;
  posture: WatchlistAction;
}

export interface MarketStatus {
  phase: MarketPhase;
  as_of: string;
  breadth: string;
  regime: string;
}

export interface ProviderSnapshot {
  current: string;
  configured: number;
  total: number;
  note: string;
}

export interface GateHeadline {
  decision: GateDecision;
  last_run_at: string;
  summary: string;
}

export interface StrategyMini {
  id: string;
  name: string;
  status: StrategyStatus;
  fit_summary: string;
}

export interface SystemLogEntry {
  ts: string;
  level: "info" | "warn" | "error";
  source: string;
  message: string;
}

export interface CommandCenterStatus {
  market: MarketStatus;
  provider: ProviderSnapshot;
  data_mode: "mock" | "live" | "hybrid";
  active_signals: Signal[];
  strategy_modules: StrategyMini[];
  risk_gate: GateHeadline;
  decision_brief_headline: string;
  decision_brief_posture: RiskLevel;
  watchlist: WatchlistItem[];
  system_logs: SystemLogEntry[];
  disclaimer: string;
}

export interface SignalListResponse {
  signals: Signal[];
  universe: string;
  last_run_at: string;
}

export interface StrategyListResponse {
  strategies: StrategyCard[];
  note: string;
}

// Backtest

export interface BacktestRunRequest {
  strategy_id: string;
  universe: string;
  period: string;
  forward_window_days: number;
  risk_filter: boolean;
  custom_tickers?: string[] | null;
}

export interface BacktestSignalRow {
  date: string;
  ticker: string;
  rationale: string;
  forward_return_pct: number | null;
  aligned: boolean | null;
}

export interface BacktestEquityPoint {
  date: string;
  equity: number;
}

export interface TickerRollup {
  ticker: string;
  signal_count: number;
  aligned_count: number;
  avg_forward_return_pct: number;
  hit_rate_pct: number;
}

export interface DistributionBucket {
  label: string;
  count: number;
  is_loss: boolean;
}

export interface BacktestMetricsModel {
  total_signals: number;
  aligned_count: number;
  hit_rate_pct: number;
  avg_forward_return_pct: number;
  median_forward_return_pct: number;
  sharpe_like: number;
  max_drawdown_pct: number;
  coverage_pct: number;
  universe_size: number;
  bars_loaded: number;
  distribution: DistributionBucket[];
  best_tickers: TickerRollup[];
  worst_tickers: TickerRollup[];
  note: string;
}

export interface BacktestResultModel {
  params: BacktestRunRequest;
  metrics: BacktestMetricsModel;
  equity_curve: BacktestEquityPoint[];
  signals: BacktestSignalRow[];
  started_at: string;
  finished_at: string;
  duration_ms: number;
  data_source: string;
  disclaimer: string;
}

// Data Lake

export interface DataSourceStatus {
  id: string;
  name: string;
  kind: "price" | "filings" | "news" | "fundamentals";
  live: boolean;
  cached_keys: number;
  note: string;
  requires_api_key: boolean;
  homepage: string;
}

export interface DataLakeStatus {
  sources: DataSourceStatus[];
  cache_ttl_sec: Record<string, number>;
  last_check: string;
  note: string;
}

export interface AssetSnapshot {
  ticker: string;
  last_price: number;
  change_pct_1d: number;
  volume: number | null;
  data_source: string;
  as_of: string;
  freshness: string;
}

export interface BacktestSnapshotMini {
  strategy_id: string;
  period: string;
  signal_count: number;
  hit_rate_pct: number;
  avg_forward_return_pct: number;
  max_drawdown_pct: number;
  note: string;
}

export interface WorkbenchResult {
  ticker: string;
  asset_snapshot: AssetSnapshot;
  price_action: PriceAction;
  catalysts: KeyCatalyst[];
  active_signals: Signal[];
  strategy_fit: StrategyFit[];
  backtest_snapshot: BacktestSnapshotMini | null;
  risk_gate: RiskGateResult;
  ai_brief: AIDecisionBrief;
  research_report: ResearchReport;
  provider_used: string;
  pipeline_label: string;
  disclaimer: string;
}

// Pipeline status

export type PipelineStageId =
  | "data"
  | "strategy"
  | "backtest"
  | "signals"
  | "risk"
  | "ai_brief";

export type PipelineTone = "ok" | "info" | "warn" | "danger" | "muted";

export interface PipelineStage {
  id: PipelineStageId;
  order: number;
  label: string;
  headline: string;
  description: string;
  cta_label: string;
  cta_path: string;
  metric: string;
  tone: PipelineTone;
}

export interface SystemStatus {
  market: string;
  data_mode: string;
  ai_provider: string;
  research_mode: boolean;
  trading_disabled: boolean;
  crypto_planned: boolean;
}

export interface PipelineResponse {
  stages: PipelineStage[];
  system: SystemStatus;
  tagline: string;
}

// Starter/Pro market scan report

export type MarketTone = "Bullish" | "Bearish" | "Mixed" | "Risk-off";
export type MarketRiskText = "Low" | "Medium" | "High";
export type MarketDirectionText = "bullish" | "bearish" | "neutral";
export type StarterStatusText =
  | "Monitor"
  | "Review"
  | "Warning"
  | "High Risk"
  | "Blocked";

export interface MarketDirection {
  tone: MarketTone;
  risk_level: MarketRiskText;
  dominant_themes: string[];
  summary: string;
}

export interface CandidateDetails {
  price_signal: string;
  news_signal: string;
  filing_signal: string;
  strategy_result: string;
  ai_reasoning: string;
  risks: string[];
  what_would_change_view: string;
  data_used: string[];
}

export interface BullishCandidate {
  ticker: string;
  company_name: string;
  bullish_score: number;
  confidence: number;
  reason: string;
  supporting_headlines_count: number;
  risk_note: string;
  status: "Monitor" | "Review";
  details: CandidateDetails;
}

export interface BearishCandidate {
  ticker: string;
  company_name: string;
  bearish_score: number;
  confidence: number;
  reason: string;
  negative_headlines_count: number;
  risk_note: string;
  status: "Review" | "High Risk";
  details: CandidateDetails;
}

export interface NeutralCandidate {
  ticker: string;
  company_name: string;
  score: number;
  confidence: number;
  reason: string;
  risk_level: MarketRiskText;
}

export interface NewsCatalyst {
  ticker: string;
  headline: string;
  source: string;
  timestamp: string;
  ai_impact: Impact;
  related_direction: MarketDirectionText;
}

export interface RiskAlert {
  ticker: string;
  risk_type:
    | "Volatility"
    | "Earnings"
    | "Negative headlines"
    | "Weak momentum"
    | "Data uncertainty"
    | "Sector pressure";
  severity: MarketRiskText;
  reason: string;
  what_to_watch: string;
}

export interface DataUsed {
  price_source: string;
  news_source: string;
  filing_source: string;
  ai_provider: string;
  scan_time: string;
  universe_scanned: string[];
}

export interface MarketReport {
  scan_id: string;
  mode: "starter" | "pro";
  market: string;
  universe: string[];
  provider: string;
  generated_at: string;
  market_direction: MarketDirection;
  bullish_candidates: BullishCandidate[];
  bearish_candidates: BearishCandidate[];
  neutral_candidates: NeutralCandidate[];
  news_catalysts: NewsCatalyst[];
  risk_alerts: RiskAlert[];
  ai_market_brief: string;
  data_used: DataUsed;
  disclaimer: string;
}

export interface StarterResultSummary {
  scan_id: string;
  generated_at: string;
  market_tone: MarketTone;
  bullish_count: number;
  bearish_count: number;
  risk_level: MarketRiskText;
  provider: string;
}

export interface GeneratedWatchlistItem {
  ticker: string;
  direction: MarketDirectionText;
  score: number;
  confidence: number;
  risk_level: MarketRiskText;
  last_reason: string;
  last_checked: string;
  status: StarterStatusText;
}

export interface MarketScanRequest {
  universe?: string[] | null;
  include_news?: boolean;
  include_filings?: boolean;
  report_depth?: "quick" | "detailed";
  provider?: string | null;
  strategy_packs?: string[] | null;
}

// Strategy expanded shape

export interface StrategyCardModel {
  id: string;
  name: string;
  category: string;
  market_type: "us_equity" | "crypto" | "etf" | "fx";
  description: string;
  universe: string;
  status: "active" | "paused" | "research";
  enabled: boolean;
  last_run_at: string;
  backtest: BacktestSnapshot;
}

// ----- transport -----

const BASE = "/api";

async function jsonOrThrow<T>(resp: Response): Promise<T> {
  if (!resp.ok) {
    let detail = `${resp.status} ${resp.statusText}`;
    try {
      const body = await resp.json();
      if (body?.detail) detail = String(body.detail);
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  return (await resp.json()) as T;
}

export async function getHealth() {
  return jsonOrThrow<{ status: string; service: string; version: string }>(
    await fetch(`${BASE}/health`)
  );
}

export async function listProviders(): Promise<ProviderListResponse> {
  return jsonOrThrow(await fetch(`${BASE}/providers`));
}

export async function setProviderConfig(body: {
  provider: string;
  api_key?: string;
  base_url?: string;
  model?: string;
}): Promise<{ success: boolean; active: string; message: string }> {
  return jsonOrThrow(
    await fetch(`${BASE}/providers/config`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );
}

export async function testProvider(body: {
  provider: string;
  api_key?: string;
  base_url?: string;
  model?: string;
}): Promise<{ provider: string; connected: boolean; message: string }> {
  return jsonOrThrow(
    await fetch(`${BASE}/providers/test`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );
}

export async function getMode(): Promise<{ mode: "starter" | "pro" }> {
  return jsonOrThrow(await fetch(`${BASE}/mode`));
}

export async function postMode(mode: "starter" | "pro") {
  return jsonOrThrow(
    await fetch(`${BASE}/mode`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode }),
    })
  );
}

export async function getCommandCenter(): Promise<CommandCenterStatus> {
  return jsonOrThrow(await fetch(`${BASE}/command-center`));
}

export async function getSignals(): Promise<SignalListResponse> {
  return jsonOrThrow(await fetch(`${BASE}/signals`));
}

export async function getStrategies(): Promise<StrategyListResponse> {
  return jsonOrThrow(await fetch(`${BASE}/pro/strategy-packs`));
}

export async function postRiskGate(
  ticker: string,
  news_text?: string
): Promise<RiskGateResult> {
  return jsonOrThrow(
    await fetch(`${BASE}/risk-gate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticker, news_text: news_text || null }),
    })
  );
}

export async function postBacktest(
  body: Partial<BacktestRunRequest> & { strategy_id: string }
): Promise<BacktestResultModel> {
  const payload: BacktestRunRequest = {
    strategy_id: body.strategy_id,
    universe: body.universe ?? "sp500_megacap",
    period: body.period ?? "1y",
    forward_window_days: body.forward_window_days ?? 5,
    risk_filter: body.risk_filter ?? true,
    custom_tickers: body.custom_tickers ?? null,
  };
  return jsonOrThrow(
    await fetch(`${BASE}/backtest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  );
}

export async function getDataLake(): Promise<DataLakeStatus> {
  return jsonOrThrow(await fetch(`${BASE}/data-sources`));
}

export async function getPipeline(): Promise<PipelineResponse> {
  return jsonOrThrow(await fetch(`${BASE}/pipeline`));
}

export async function postStarterAnalyzeMarket(
  body: MarketScanRequest = {}
): Promise<MarketReport> {
  return jsonOrThrow(
    await fetch(`${BASE}/starter/analyze-market`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );
}

export async function getStarterResults(): Promise<{
  reports: StarterResultSummary[];
}> {
  return jsonOrThrow(await fetch(`${BASE}/starter/results`));
}

export async function getStarterReport(scanId: string): Promise<MarketReport> {
  return jsonOrThrow(await fetch(`${BASE}/starter/results/${scanId}`));
}

export async function getStarterWatchlist(): Promise<{
  items: GeneratedWatchlistItem[];
}> {
  return jsonOrThrow(await fetch(`${BASE}/starter/watchlist`));
}

export async function postProMarketScan(
  body: MarketScanRequest
): Promise<MarketReport> {
  return jsonOrThrow(
    await fetch(`${BASE}/pro/market-scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );
}

export async function getProNews(): Promise<{
  news: NewsCatalyst[];
  scan_id: string;
}> {
  return jsonOrThrow(await fetch(`${BASE}/pro/news`));
}

export async function postStrategyToggle(
  strategyId: string,
  enabled: boolean
): Promise<StrategyCardModel> {
  return jsonOrThrow(
    await fetch(`${BASE}/strategies/${strategyId}/toggle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    })
  );
}

export async function postAssetLab(
  ticker: string,
  news_text?: string,
  strategy_id?: string
): Promise<WorkbenchResult> {
  return jsonOrThrow(
    await fetch(`${BASE}/asset-lab`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ticker,
        news_text: news_text || null,
        strategy_id: strategy_id || null,
      }),
    })
  );
}

export async function postWorkbench(
  ticker: string,
  news_text?: string
): Promise<WorkbenchResult> {
  return jsonOrThrow(
    await fetch(`${BASE}/workbench`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticker, news_text: news_text || null }),
    })
  );
}

// kept for backward reference / programmatic use:
export async function postResearch(
  ticker: string,
  news_text?: string
): Promise<ResearchReport> {
  return jsonOrThrow(
    await fetch(`${BASE}/research`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticker, news_text: news_text || null }),
    })
  );
}

export async function postAnalyzeEvent(
  ticker: string,
  event_text: string
): Promise<EventAnalysis> {
  return jsonOrThrow(
    await fetch(`${BASE}/analyze-event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticker, event_text }),
    })
  );
}
