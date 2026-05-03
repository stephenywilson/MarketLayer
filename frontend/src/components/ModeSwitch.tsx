import { useNavigate } from "react-router-dom";
import { useMode } from "../hooks/useMode";

export function ModeSwitch({ compact }: { compact?: boolean }) {
  const { mode, setMode } = useMode();
  const navigate = useNavigate();

  function pick(m: "starter" | "pro") {
    setMode(m);
    // Reset to a sensible page for the new mode so users don't land on
    // a route that's hidden in their current nav.
    if (m === "starter") navigate("/");
    else navigate("/pro/command-center");
  }

  return (
    <div
      className={`inline-flex items-center rounded border border-ml-border bg-ml-bg-elev p-0.5 ${
        compact ? "" : "w-full"
      }`}
      role="tablist"
      aria-label="UI mode"
    >
      <button
        role="tab"
        aria-selected={mode === "starter"}
        onClick={() => pick("starter")}
        className={[
          "flex-1 px-3 py-1 rounded-sm text-[11px] uppercase tracking-[0.18em] font-medium transition-colors",
          mode === "starter"
            ? "bg-ml-accent/15 text-ml-accent"
            : "text-ml-text-muted hover:text-ml-text",
        ].join(" ")}
      >
        Starter
      </button>
      <button
        role="tab"
        aria-selected={mode === "pro"}
        onClick={() => pick("pro")}
        className={[
          "flex-1 px-3 py-1 rounded-sm text-[11px] uppercase tracking-[0.18em] font-medium transition-colors",
          mode === "pro"
            ? "bg-ml-accent/15 text-ml-accent"
            : "text-ml-text-muted hover:text-ml-text",
        ].join(" ")}
      >
        Pro
      </button>
    </div>
  );
}
