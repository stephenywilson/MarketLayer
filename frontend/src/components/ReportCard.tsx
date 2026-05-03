import type { ResearchReport, Impact } from "../api/client";
import { ScoreBadge } from "./ScoreBadge";
import { ProviderBadge } from "./ProviderBadge";

const impactColor: Record<Impact, string> = {
  positive: "text-ml-accent border-ml-accent/40",
  negative: "text-ml-danger border-ml-danger/40",
  mixed: "text-ml-warn border-ml-warn/40",
  neutral: "text-ml-text-dim border-ml-border-strong",
};

function Section({
  title,
  meta,
  children,
}: {
  title: string;
  meta?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="ml-panel p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium tracking-wide text-ml-text">
          {title}
        </h3>
        {meta && (
          <span className="text-[11px] font-mono text-ml-text-muted">
            {meta}
          </span>
        )}
      </div>
      <div className="ml-divider mb-4" />
      <div className="text-sm text-ml-text-dim leading-relaxed">{children}</div>
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  if (!items.length) {
    return <div className="text-ml-text-muted text-[13px]">— none</div>;
  }
  return (
    <ul className="space-y-1.5">
      {items.map((s, i) => (
        <li key={i} className="flex gap-2">
          <span className="text-ml-accent/60 font-mono text-xs mt-1">›</span>
          <span>{s}</span>
        </li>
      ))}
    </ul>
  );
}

export function ReportCard({ report }: { report: ResearchReport }) {
  return (
    <div className="space-y-5">
      <div className="ml-panel-strong p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-baseline gap-3">
              <div className="font-mono text-2xl tracking-widest text-ml-accent">
                {report.ticker}
              </div>
              <div className="text-ml-text">{report.company_name}</div>
            </div>
            <div className="text-[12px] text-ml-text-dim mt-2 max-w-2xl leading-relaxed">
              {report.company_overview}
            </div>
          </div>
          <ProviderBadge provider={report.provider_used} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ScoreBadge
          label="Market impact"
          value={report.market_impact_score}
          hint="Estimated magnitude of market-relevant signal in this report."
        />
        <ScoreBadge
          label="Confidence"
          value={report.confidence_score}
          hint="Confidence the model assigns to its own analysis."
        />
      </div>

      <Section title="Latest market movement">
        <p className="whitespace-pre-wrap">{report.latest_market_movement}</p>
      </Section>

      <Section
        title="Key catalysts"
        meta={`${report.key_catalysts.length} item(s)`}
      >
        <div className="space-y-3">
          {report.key_catalysts.map((c, i) => (
            <div key={i} className="border border-ml-border rounded-sm p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-ml-text font-medium">{c.title}</div>
                <span
                  className={`ml-pill ${impactColor[c.impact] ?? ""}`}
                >
                  {c.impact}
                </span>
              </div>
              <div className="text-[13px] mt-1.5">{c.description}</div>
            </div>
          ))}
        </div>
      </Section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Section title="Bull case">
          <BulletList items={report.bull_case} />
        </Section>
        <Section title="Bear case">
          <BulletList items={report.bear_case} />
        </Section>
      </div>

      <Section title="SEC filing highlights">
        {report.sec_filing_highlights.length === 0 ? (
          <div className="text-ml-text-muted text-[13px]">— none</div>
        ) : (
          <div className="space-y-2">
            {report.sec_filing_highlights.map((f, i) => (
              <div
                key={i}
                className="flex items-start gap-3 border border-ml-border rounded-sm p-3"
              >
                <span className="font-mono text-[11px] text-ml-accent shrink-0 w-12">
                  {f.form}
                </span>
                <div className="flex-1">
                  <div className="text-[11px] text-ml-text-muted">
                    {f.filed_at ?? "—"}
                  </div>
                  <div className="text-[13px] mt-1">{f.summary}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="News / event summary">
        <p className="whitespace-pre-wrap">{report.news_event_summary}</p>
      </Section>

      <Section title="Risk factors">
        <BulletList items={report.risk_factors} />
      </Section>

      <Section title="Watchlist triggers">
        <BulletList items={report.watchlist_triggers} />
      </Section>

      <Section title="Final summary">
        <p className="whitespace-pre-wrap">{report.final_summary}</p>
      </Section>

      <div className="ml-panel border-ml-border-strong/60 p-4 text-[11px] text-ml-text-muted leading-relaxed">
        {report.disclaimer}
      </div>
    </div>
  );
}
