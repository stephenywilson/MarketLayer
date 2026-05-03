import { Link } from "react-router-dom";
import type { PipelineStage, PipelineTone } from "../api/client";
import { Icon } from "./Icon";

type IconName = Parameters<typeof Icon>[0]["name"];

const STAGE_ICONS: Record<string, IconName> = {
  data: "database",
  strategy: "strategy",
  backtest: "backtest",
  signals: "signal",
  risk: "shield",
  ai_brief: "ghost",
};

const TONE_DOT: Record<PipelineTone, string> = {
  ok: "bg-ml-accent",
  info: "bg-ml-info",
  warn: "bg-ml-warn",
  danger: "bg-ml-danger",
  muted: "bg-ml-text-muted",
};

const TONE_BORDER: Record<PipelineTone, string> = {
  ok: "border-ml-accent/40",
  info: "border-ml-info/40",
  warn: "border-ml-warn/40",
  danger: "border-ml-danger/40",
  muted: "border-ml-border",
};

const TONE_TEXT: Record<PipelineTone, string> = {
  ok: "text-ml-accent",
  info: "text-ml-info",
  warn: "text-ml-warn",
  danger: "text-ml-danger",
  muted: "text-ml-text-dim",
};

export function PipelineSection({
  stages,
  tagline,
}: {
  stages: PipelineStage[];
  tagline: string;
}) {
  return (
    <section>
      <div className="ml-label mb-2">PIPELINE · DATA → STRATEGY → BACKTEST → SIGNALS → RISK GATE → AI BRIEF</div>
      <p className="text-[12.5px] text-ml-text-dim leading-relaxed max-w-4xl mb-4">
        {tagline}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
        {stages.map((s, idx) => {
          const icon = STAGE_ICONS[s.id] || "database";
          return (
            <div
              key={s.id}
              className={`ml-panel-strong border ${TONE_BORDER[s.tone]} p-4 flex flex-col gap-2.5 relative`}
            >
              {/* connector arrow on the right edge (visual only, hidden on small screens) */}
              {idx < stages.length - 1 && (
                <div className="hidden xl:flex absolute top-1/2 -right-2.5 -translate-y-1/2 items-center justify-center w-5 h-5 z-10">
                  <Icon
                    name="arrow-right"
                    size={14}
                    className="text-ml-text-muted"
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <Icon name={icon} size={18} className="text-ml-text-dim" />
                <span className="font-mono text-[10px] text-ml-text-muted">
                  0{s.order}
                </span>
              </div>
              <div>
                <div className="ml-label-muted">{s.label}</div>
                <div
                  className={`mt-1 text-[15px] font-semibold leading-tight ${TONE_TEXT[s.tone]}`}
                >
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 -translate-y-0.5 ${TONE_DOT[s.tone]}`}
                  />
                  {s.headline}
                </div>
              </div>
              <p className="text-[11.5px] text-ml-text-dim leading-snug min-h-[2.5em]">
                {s.description}
              </p>
              <div className="text-[10.5px] font-mono text-ml-text-muted truncate">
                {s.metric}
              </div>
              <Link
                to={s.cta_path}
                className="mt-1 inline-flex items-center gap-1 text-[11.5px] font-medium text-ml-accent hover:text-ml-accent-soft"
              >
                {s.cta_label} <Icon name="arrow-right" size={11} />
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
