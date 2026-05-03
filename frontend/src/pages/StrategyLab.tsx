import { useEffect, useState } from "react";
import {
  getStrategies,
  type StrategyListResponse,
  type StrategyCard,
} from "../api/client";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";
import { StrategyCardView } from "../components/StrategyCardView";
import { MetricTile } from "../components/MetricTile";
import { Icon } from "../components/Icon";

export function StrategyLab() {
  const [data, setData] = useState<StrategyListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      const r = await getStrategies();
      setData(r);
    } catch (e: any) {
      setError(e?.message || "Failed to load strategies");
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  if (error)
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <ErrorState message={error} />
      </div>
    );
  if (!data)
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <LoadingState label="Loading strategy packs..." />
      </div>
    );

  const us = data.strategies.filter((s) => s.market_type !== "crypto");
  const crypto = data.strategies.filter((s) => s.market_type === "crypto");

  const enabled = us.filter((s) => s.enabled).length;
  const research = us.filter((s) => s.status === "research").length;
  const paused = us.filter((s) => s.status === "paused").length;

  function update(next: StrategyCard) {
    if (!data) return;
    setData({
      ...data,
      strategies: data.strategies.map((s) =>
        s.id === next.id ? { ...s, ...next } : s
      ),
    });
  }

  return (
    <div className="ml-page-shell">
      <header>
        <div className="ml-label">STRATEGY PACKS</div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ml-text">
          Strategy packs
        </h1>
        <p className="mt-1 text-[13px] text-ml-text-dim max-w-2xl">
          Built-in strategy packs used automatically in Starter Mode and inspectable in Pro Mode.
        </p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricTile
          label="US-stock packs"
          value={us.length}
          accent
        />
        <MetricTile label="Enabled" value={enabled} accent />
        <MetricTile label="Research" value={research} />
        <MetricTile label="Paused" value={paused} />
      </section>

      <section>
        <div className="ml-label mb-3">US STOCK PACKS</div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {us.map((s) => (
            <StrategyCardView
              key={s.id}
              card={s as any}
              onChange={(n) => update(n)}
            />
          ))}
        </div>
      </section>

      <section>
        <div className="ml-label mb-3">
          FUTURE MARKET PACKS · ROADMAP
          <span className="ml-2 ml-pill">planned</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {crypto.map((s) => (
            <StrategyCardView
              key={s.id}
              card={s as any}
              onChange={(n) => update(n)}
            />
          ))}
          <div className="ml-panel p-5 flex flex-col items-center justify-center text-center gap-2 border-dashed">
            <Icon
              name="strategy"
              size={20}
              className="text-ml-text-muted"
            />
            <div className="ml-label-muted">More planned</div>
            <div className="text-[11.5px] text-ml-text-dim">
              On-chain Momentum · Volatility Compression · Funding Rate
              Divergence will activate once crypto data connectors land
              (V0.3).
            </div>
          </div>
        </div>
      </section>

      <p className="text-[11px] text-ml-text-muted leading-relaxed max-w-3xl">
        {data.note}
      </p>
    </div>
  );
}

export default StrategyLab;
