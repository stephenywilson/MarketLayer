import type { WatchlistItem } from "../api/client";
import { ActionPill } from "./StatusPill";

export function WatchlistTable({ items }: { items: WatchlistItem[] }) {
  return (
    <div className="ml-panel">
      <div className="grid grid-cols-[80px,90px,80px,1fr,auto] gap-3 items-center px-4 py-2 border-b border-ml-border-strong text-[10px] uppercase tracking-widest text-ml-text-muted">
        <div>Ticker</div>
        <div className="text-right">Last</div>
        <div className="text-right">1d</div>
        <div>Note</div>
        <div>Posture</div>
      </div>
      {items.map((it) => {
        const up = it.change_pct_1d >= 0;
        return (
          <div
            key={it.ticker}
            className="grid grid-cols-[80px,90px,80px,1fr,auto] gap-3 items-center px-4 py-2.5 border-b border-ml-border last:border-b-0 hover:bg-ml-panel/40"
          >
            <div className="font-mono text-sm tracking-widest text-ml-accent">
              {it.ticker}
            </div>
            <div className="text-right font-mono text-sm text-ml-text-dim">
              {it.last_price.toFixed(2)}
            </div>
            <div
              className={`text-right font-mono text-sm ${
                up ? "text-ml-accent" : "text-ml-danger"
              }`}
            >
              {up ? "+" : ""}
              {it.change_pct_1d.toFixed(2)}%
            </div>
            <div className="text-[12px] text-ml-text-dim truncate">
              {it.note}
            </div>
            <ActionPill action={it.posture} />
          </div>
        );
      })}
    </div>
  );
}
