import { useNavigate } from "react-router-dom";
import { Icon } from "../components/Icon";
import { useMode } from "../hooks/useMode";

export function ModeSelection() {
  const { setMode } = useMode();
  const navigate = useNavigate();

  function choose(mode: "starter" | "pro") {
    setMode(mode);
    navigate(mode === "starter" ? "/" : "/pro/command-center", { replace: true });
  }

  return (
    <div className="min-h-screen bg-ml-bg text-ml-text flex items-center justify-center px-6">
      <div className="absolute inset-0 opacity-[0.08] bg-[linear-gradient(rgba(100,206,155,.28)_1px,transparent_1px),linear-gradient(90deg,rgba(100,206,155,.28)_1px,transparent_1px)] bg-[size:48px_48px]" />
      <main className="relative w-full max-w-5xl space-y-8">
        <header className="ml-card-enter text-center" style={{ animationDelay: "0.05s" }}>
          <div className="flex items-center justify-center">
            <img
              src="/marketlayer-logo-white.png"
              alt="MarketLayer by Catalayer"
              className="h-12 w-auto"
            />
          </div>
          <h1 className="mt-6 text-4xl md:text-5xl font-semibold tracking-tight">
            Choose how you want to start.
          </h1>
          <p className="mt-3 text-[15px] text-ml-text-dim">
            AI-powered quant decision console for US stocks. Switch between modes anytime.
          </p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <button
            onClick={() => choose("starter")}
            style={{ animationDelay: "0.18s" }}
            className="ml-card-enter ml-panel-strong p-6 text-left border-ml-accent/40 hover:bg-ml-accent/5 hover:border-ml-accent/60 transition-[background-color,border-color,transform] duration-300 hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between gap-4">
              <Icon name="play" size={24} className="text-ml-accent" />
              <span className="ml-pill text-ml-accent border-ml-accent/40">
                Recommended
              </span>
            </div>
            <h2 className="mt-5 text-2xl font-semibold">Starter Mode</h2>
            <p className="mt-2 text-[14px] text-ml-text-dim leading-relaxed">
              One-click AI market verdict for beginners. Pick a market and style,
              then click Analyze Market for a clear bullish / downside view.
            </p>
            <div className="mt-6 ml-button-primary w-fit">
              Start with Starter <Icon name="arrow-right" size={12} />
            </div>
          </button>

          <button
            onClick={() => choose("pro")}
            style={{ animationDelay: "0.30s" }}
            className="ml-card-enter group ml-panel p-6 text-left border-ml-border-strong hover:bg-ml-bg-elev/60 hover:border-ml-accent/45 hover:shadow-[0_8px_28px_-14px_rgba(25,214,176,0.35)] transition-all duration-300 hover:-translate-y-0.5"
          >
            <Icon
              name="dashboard"
              size={24}
              className="text-ml-text-dim group-hover:text-ml-accent transition-colors"
            />
            <h2 className="mt-5 text-2xl font-semibold text-ml-text">Pro Mode</h2>
            <p className="mt-2 text-[14px] text-ml-text-dim leading-relaxed">
              Same console with deeper control: universe, full skill packs,
              advanced evidence tabs, and the full report.
            </p>
            <div className="mt-6 inline-flex h-8 items-center justify-center gap-1.5 rounded-[10px] border border-ml-border-strong bg-ml-panel-2 px-3.5 text-sm leading-none text-ml-text-dim transition-colors group-hover:border-ml-accent/55 group-hover:text-ml-text w-fit">
              Open Pro Mode <Icon name="arrow-right" size={12} />
            </div>
          </button>
        </section>

        <p
          className="ml-card-enter text-center text-[11px] text-ml-text-muted"
          style={{ animationDelay: "0.42s" }}
        >
          Research and education only. No brokerage connection. No trade execution.
        </p>
      </main>
    </div>
  );
}

export default ModeSelection;
