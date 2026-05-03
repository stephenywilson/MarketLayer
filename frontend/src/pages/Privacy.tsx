import { Link } from "react-router-dom";

const PRIVACY_ITEMS = [
  {
    title: "Local-first setup",
    body: "MarketLayer runs as a local open-source app. Starter reports, generated watchlists, and provider preferences are kept in your local app/backend session unless you choose to export or modify the project.",
  },
  {
    title: "AI keys stay server-side",
    body: "API keys should be configured in the local backend environment. The frontend only displays provider status and does not expose provider secrets.",
  },
  {
    title: "Public research data",
    body: "Default data connectors use public market data, public headlines, and public filing metadata, with demo fallbacks when live data is unavailable.",
  },
  {
    title: "Research-only output",
    body: "MarketLayer produces market direction, bullish candidates, bearish candidates, news catalysts, risk alerts, and AI reasoning for research and education.",
  },
];

export function Privacy() {
  return (
    <div className="ml-page-shell">
      <header>
        <div className="ml-label">PRIVACY</div>
        <h1 className="mt-2 text-2xl font-semibold">Privacy & Research Disclaimer</h1>
        <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-ml-text-dim">
          MarketLayer - Catalayer is designed as a local, open-source AI market
          research tool. It is not a brokerage product and does not perform
          automated market actions.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PRIVACY_ITEMS.map((item) => (
          <div key={item.title} className="ml-panel p-5">
            <div className="ml-label-muted">{item.title}</div>
            <p className="mt-3 text-[13px] leading-relaxed text-ml-text-dim">
              {item.body}
            </p>
          </div>
        ))}
      </section>

      <section className="ml-panel-strong p-5 border-ml-accent/30">
        <div className="ml-label">Disclaimer</div>
        <p className="mt-3 max-w-4xl text-[13px] leading-relaxed text-ml-text-dim">
          MarketLayer is for research and educational purposes only. It does
          not provide personalized recommendations, directional instructions,
          brokerage services, or automated market actions. Users are
          responsible for their own decisions.
        </p>
      </section>

      <div className="flex flex-wrap gap-2">
        <Link to="/settings" className="ml-button">
          Open Settings
        </Link>
        <Link to="/api-docs" className="ml-button">
          API Docs
        </Link>
      </div>
    </div>
  );
}

export default Privacy;
