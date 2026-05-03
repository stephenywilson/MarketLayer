import { useState } from "react";

interface Props {
  initialTicker?: string;
  initialNews?: string;
  loading?: boolean;
  onSubmit: (ticker: string, newsText?: string) => void;
}

const SUGGESTIONS = ["AAPL", "MSFT", "NVDA", "TSLA", "AMD", "META", "GOOGL"];

export function TickerInput({
  initialTicker = "NVDA",
  initialNews = "",
  loading,
  onSubmit,
}: Props) {
  const [ticker, setTicker] = useState(initialTicker);
  const [news, setNews] = useState(initialNews);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (ticker.trim()) onSubmit(ticker.trim().toUpperCase(), news.trim() || undefined);
      }}
      className="ml-panel p-5 space-y-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-[200px,1fr] gap-4">
        <div className="space-y-1.5">
          <label className="ml-label">Ticker</label>
          <input
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            placeholder="NVDA"
            className="ml-input font-mono uppercase tracking-widest"
            spellCheck={false}
            autoCapitalize="characters"
            maxLength={8}
          />
          <div className="flex flex-wrap gap-1.5 pt-1">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setTicker(s)}
                className="ml-pill hover:text-ml-accent hover:border-ml-accent/40"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="ml-label">News / event text (optional)</label>
          <textarea
            value={news}
            onChange={(e) => setNews(e.target.value)}
            placeholder="Paste a press release, headline, or filing excerpt to anchor the analysis…"
            rows={5}
            className="ml-input resize-y leading-relaxed"
          />
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-ml-border pt-4">
        <div className="text-[11px] text-ml-text-muted">
          Research only · No trading instructions
        </div>
        <button type="submit" disabled={loading} className="ml-button-primary">
          {loading ? "Generating…" : "Generate Research Report"}
        </button>
      </div>
    </form>
  );
}
