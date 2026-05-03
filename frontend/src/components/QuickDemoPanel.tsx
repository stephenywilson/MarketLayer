import { useState } from "react";
import { Icon } from "./Icon";
import { SelectControl } from "./SelectControl";

export const PRESETS = [
  { id: "momentum", label: "Momentum check" },
  { id: "mean_reversion", label: "Mean reversion check" },
  { id: "news_catalyst", label: "News catalyst check" },
  { id: "earnings_reaction", label: "Earnings reaction check" },
];

export const TICKER_QUICK_TRY = ["NVDA", "AAPL", "MSFT", "TSLA"];

export interface QuickDemoSubmit {
  symbol: string;
  preset: string;
  news: string;
}

interface Props {
  initialSymbol?: string;
  initialPreset?: string;
  showNewsField?: boolean;
  primaryLabel?: string;
  loading?: boolean;
  onSubmit: (v: QuickDemoSubmit) => void;
  extraSecondary?: React.ReactNode;
}

export function QuickDemoPanel({
  initialSymbol = "NVDA",
  initialPreset = "momentum",
  showNewsField = false,
  primaryLabel = "Run Quick Demo",
  loading,
  onSubmit,
  extraSecondary,
}: Props) {
  const [symbol, setSymbol] = useState(initialSymbol);
  const [preset, setPreset] = useState(initialPreset);
  const [news, setNews] = useState("");

  function fire(s = symbol, p = preset, n = news) {
    if (!s.trim()) return;
    onSubmit({
      symbol: s.trim().toUpperCase(),
      preset: p,
      news: n,
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        fire();
      }}
      className="ml-panel-strong p-5 space-y-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-[180px,1fr] gap-4">
        <div>
          <label className="ml-label-muted">Symbol</label>
          <input
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            className="ml-input mt-1.5 font-mono uppercase tracking-widest"
            placeholder="NVDA"
            maxLength={8}
          />
        </div>
        <div>
          <label className="ml-label-muted">Preset</label>
          <SelectControl
            value={preset}
            onChange={setPreset}
            options={PRESETS.map((presetOption) => ({
              value: presetOption.id,
              label: presetOption.label,
            }))}
            className="mt-1.5"
          />
        </div>
      </div>

      {showNewsField && (
        <div>
          <label className="ml-label-muted">
            News / event text · optional
          </label>
          <textarea
            value={news}
            onChange={(e) => setNews(e.target.value)}
            rows={3}
            placeholder="Paste a press release or headline to anchor analysis."
            className="ml-input mt-1.5 resize-y leading-relaxed"
          />
        </div>
      )}

      <div className="flex items-center justify-between border-t border-ml-border pt-4 flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-ml-text-muted">Try:</span>
          {TICKER_QUICK_TRY.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setSymbol(t);
                fire(t, preset, news);
              }}
              className="ml-pill hover:text-ml-accent hover:border-ml-accent/40"
            >
              {t}
            </button>
          ))}
          {extraSecondary}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="ml-button-primary"
        >
          <Icon name="play" size={14} />
          {loading ? "Running…" : primaryLabel}
        </button>
      </div>
    </form>
  );
}
