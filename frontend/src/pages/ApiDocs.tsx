import { Link } from "react-router-dom";

const STARTER_ROUTES = [
  ["POST", "/api/starter/analyze-market", "Run the one-click bullish/bearish market report."],
  ["GET", "/api/starter/results", "List recent local report summaries."],
  ["GET", "/api/starter/watchlist", "Return the generated watchlist from the latest scan."],
];

const PRO_ROUTES = [
  ["POST", "/api/pro/analyze-asset", "Analyze one ticker through the full research pipeline."],
  ["POST", "/api/pro/market-scan", "Run a custom Pro market scan."],
  ["GET", "/api/pro/news", "Inspect parsed public headline catalysts."],
  ["GET", "/api/pro/strategy-packs", "List built-in strategy packs."],
  ["POST", "/api/pro/backtest", "Run a research-only backtest snapshot."],
  ["GET", "/api/pro/signals", "Inspect generated signals."],
  ["POST", "/api/pro/risk-check", "Run risk filters for a signal."],
  ["GET", "/api/pro/data-sources", "Inspect public and optional data sources."],
];

export function ApiDocs() {
  return (
    <div className="ml-page-shell">
      <header>
        <div className="ml-label">API DOCS</div>
        <h1 className="mt-2 text-2xl font-semibold">MarketLayer API Docs</h1>
        <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-ml-text-dim">
          Local API reference for the open-source MarketLayer backend. These
          routes power both Starter Mode and Advanced Mode; they do not connect to
          brokerages or perform market actions.
        </p>
      </header>

      <section className="ml-panel-strong p-5 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="ml-label-muted">Interactive backend docs</div>
          <p className="mt-2 text-[13px] text-ml-text-dim">
            FastAPI also exposes an interactive Swagger page when the backend
            is running locally.
          </p>
        </div>
        <a
          href="http://127.0.0.1:8000/docs"
          target="_blank"
          rel="noreferrer"
          className="ml-button-primary"
        >
          Open Swagger
        </a>
      </section>

      <RouteSection title="Starter Mode Routes" rows={STARTER_ROUTES} />
      <RouteSection title="Advanced Mode Routes" rows={PRO_ROUTES} />

      <section className="ml-panel p-5">
        <div className="ml-label">Provider & Mode Routes</div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <RouteCard method="GET" path="/api/health" description="Backend health and version status." />
          <RouteCard method="GET" path="/api/providers" description="List AI providers and current status." />
          <RouteCard method="POST" path="/api/providers/test" description="Test a provider connection from local setup." />
          <RouteCard method="POST" path="/api/mode" description="Set Starter or Pro mode for the local app." />
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        <Link to="/settings" className="ml-button">
          Open Settings
        </Link>
        <Link to="/" className="ml-button">
          Back to Workplace
        </Link>
      </div>
    </div>
  );
}

function RouteSection({
  title,
  rows,
}: {
  title: string;
  rows: string[][];
}) {
  return (
    <section className="ml-panel p-5">
      <div className="ml-label">{title}</div>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        {rows.map(([method, path, description]) => (
          <RouteCard key={path} method={method} path={path} description={description} />
        ))}
      </div>
    </section>
  );
}

function RouteCard({
  method,
  path,
  description,
}: {
  method: string;
  path: string;
  description: string;
}) {
  return (
    <div className="border border-ml-border rounded-sm p-4">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="ml-pill text-ml-accent border-ml-accent/30">{method}</span>
        <span className="font-mono text-[12px] text-ml-text-dim">{path}</span>
      </div>
      <p className="mt-2 text-[12px] leading-relaxed text-ml-text-muted">
        {description}
      </p>
    </div>
  );
}

export default ApiDocs;
