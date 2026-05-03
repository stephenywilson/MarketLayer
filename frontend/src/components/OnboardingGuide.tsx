import { useEffect, useLayoutEffect, useState } from "react";

export const ONBOARDING_KEY = "marketlayer_starter_onboarding_seen";

type StepId = "welcome" | "verdict" | "candidates" | "notes" | "bottom-bar";

interface Step {
  id: StepId;
  title: string;
  body: string;
  footer?: string;
  target?: string;
}

const STEPS: Step[] = [
  {
    id: "welcome",
    title: "Welcome to MarketLayer",
    body: "MarketLayer scans public US stock data, headlines, filings, and built-in strategy logic to generate a simple AI market report.",
    footer: "Research only. No brokerage connection. No trade execution.",
  },
  {
    id: "verdict",
    title: "Start with the market verdict",
    body: "This card gives you the main market view: bullish or bearish, confidence level, risk level, candidate count, and the latest scan time.",
    target: "verdict",
  },
  {
    id: "candidates",
    title: "Review bullish and downside candidates",
    body: "The left side shows the strongest bullish watch candidates. The downside section shows bearish candidates or the closest risk monitors when no bearish signal is confirmed.",
    target: "candidates",
  },
  {
    id: "notes",
    title: "Understand why",
    body: "The Evidence & Reasoning panel explains why the scan is bullish or bearish, surfaces the catalysts behind it, and lets you drill into a candidate, the risks, the data sources, and the scan log.",
    target: "notes",
  },
  {
    id: "bottom-bar",
    title: "Run a scan in one click",
    body: "Choose a market, scan style, and AI provider. Then click Analyze Market. Demo AI works without a key, or you can connect your own AI key in Settings.",
    target: "bottom-bar",
  },
];

const CARD_WIDTH = 360;
const CARD_GUESS_HEIGHT = 220;
const TARGET_PAD = 8;
const CARD_GAP = 14;
const VIEW_PAD = 16;

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function readRect(target?: string): Rect | null {
  if (!target) return null;
  const el = document.querySelector<HTMLElement>(`[data-onboarding="${target}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

function useTargetRect(target?: string) {
  const [rect, setRect] = useState<Rect | null>(null);

  useLayoutEffect(() => {
    function update() {
      setRect(readRect(target));
    }
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [target]);

  return rect;
}

function getCardPosition(rect: Rect | null) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const clampX = (x: number) => Math.max(VIEW_PAD, Math.min(x, vw - CARD_WIDTH - VIEW_PAD));
  const clampY = (y: number) => Math.max(VIEW_PAD, Math.min(y, vh - CARD_GUESS_HEIGHT - VIEW_PAD));

  if (!rect) {
    return {
      left: Math.round(vw / 2 - CARD_WIDTH / 2),
      top: Math.round(vh / 2 - CARD_GUESS_HEIGHT / 2),
    };
  }

  const spaceRight = vw - (rect.left + rect.width);
  const spaceLeft = rect.left;
  const spaceBelow = vh - (rect.top + rect.height);
  const spaceAbove = rect.top;

  const needHoriz = CARD_WIDTH + CARD_GAP + VIEW_PAD;
  const needVert = CARD_GUESS_HEIGHT + CARD_GAP + VIEW_PAD;

  // Prefer side placement so the card never overlaps content stacked above the target.
  if (spaceRight >= needHoriz) {
    return {
      left: Math.round(rect.left + rect.width + CARD_GAP),
      top: Math.round(clampY(rect.top + rect.height / 2 - CARD_GUESS_HEIGHT / 2)),
    };
  }
  if (spaceLeft >= needHoriz) {
    return {
      left: Math.round(rect.left - CARD_GAP - CARD_WIDTH),
      top: Math.round(clampY(rect.top + rect.height / 2 - CARD_GUESS_HEIGHT / 2)),
    };
  }
  if (spaceBelow >= needVert) {
    return {
      left: Math.round(clampX(rect.left + rect.width / 2 - CARD_WIDTH / 2)),
      top: Math.round(rect.top + rect.height + CARD_GAP),
    };
  }
  if (spaceAbove >= needVert) {
    return {
      left: Math.round(clampX(rect.left + rect.width / 2 - CARD_WIDTH / 2)),
      top: Math.round(rect.top - CARD_GAP - CARD_GUESS_HEIGHT),
    };
  }

  return {
    left: Math.round(clampX(rect.left + rect.width / 2 - CARD_WIDTH / 2)),
    top: Math.round(clampY(vh - CARD_GUESS_HEIGHT - VIEW_PAD)),
  };
}

export function OnboardingGuide({
  startAt = 0,
  onClose,
}: {
  startAt?: number;
  onClose: (completed: boolean) => void;
}) {
  const [stepIndex, setStepIndex] = useState(startAt);
  const step = STEPS[stepIndex];
  const rect = useTargetRect(step.target);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose(false);
      if (e.key === "ArrowRight" && stepIndex < STEPS.length - 1) setStepIndex((s) => s + 1);
      if (e.key === "ArrowLeft" && stepIndex > 0) setStepIndex((s) => s - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stepIndex, onClose]);

  const card = getCardPosition(rect);
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[60]">
      <Spotlight rect={rect} />
      <article
        className="absolute z-[61] rounded-2xl border border-ml-border-strong bg-ml-panel-2 shadow-2xl shadow-black/40"
        style={{ left: card.left, top: card.top, width: CARD_WIDTH }}
        role="dialog"
        aria-modal="true"
        aria-label={step.title}
      >
        <div className="flex items-center justify-between gap-3 border-b border-ml-border px-4 py-2.5">
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ml-text-muted">
            <span className="text-ml-accent">Step {stepIndex + 1}</span>
            <span> / {STEPS.length}</span>
          </span>
          <button
            type="button"
            onClick={() => onClose(true)}
            className="text-[11px] text-ml-text-muted hover:text-ml-text"
          >
            Skip
          </button>
        </div>
        <div className="px-4 py-4">
          <h2 className="text-[15px] font-semibold leading-tight text-ml-text">{step.title}</h2>
          <p className="mt-2 text-[12.5px] leading-relaxed text-ml-text-dim">{step.body}</p>
          {step.footer && (
            <p className="mt-3 border-t border-ml-border pt-2.5 text-[11px] leading-relaxed text-ml-text-muted">
              {step.footer}
            </p>
          )}
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-ml-border px-4 py-2.5">
          <div className="flex items-center gap-1">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={[
                  "h-1.5 w-1.5 rounded-full",
                  i === stepIndex ? "bg-ml-accent" : "bg-ml-border-strong",
                ].join(" ")}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                type="button"
                onClick={() => setStepIndex((s) => Math.max(0, s - 1))}
                className="ml-button h-7 text-[11px]"
              >
                Back
              </button>
            )}
            {isLast ? (
              <button
                type="button"
                onClick={() => onClose(true)}
                className="ml-button-primary h-7 text-[11px]"
              >
                Finish
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStepIndex((s) => Math.min(STEPS.length - 1, s + 1))}
                className="ml-button-primary h-7 text-[11px]"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}

function Spotlight({ rect }: { rect: Rect | null }) {
  const mask = "bg-[rgba(0,0,0,0.58)] backdrop-blur-[2px]";
  if (!rect) {
    return <div className={`absolute inset-0 ${mask}`} />;
  }
  const top = Math.max(0, rect.top - TARGET_PAD);
  const left = Math.max(0, rect.left - TARGET_PAD);
  const width = rect.width + TARGET_PAD * 2;
  const height = rect.height + TARGET_PAD * 2;
  return (
    <>
      <div className={`absolute ${mask}`} style={{ top: 0, left: 0, right: 0, height: top }} />
      <div className={`absolute ${mask}`} style={{ top: top + height, left: 0, right: 0, bottom: 0 }} />
      <div className={`absolute ${mask}`} style={{ top, left: 0, width: left, height }} />
      <div className={`absolute ${mask}`} style={{ top, left: left + width, right: 0, height }} />
      <div
        className="pointer-events-none absolute rounded-[14px] border border-[rgba(21,239,190,0.65)] shadow-[0_0_0_1px_rgba(21,239,190,0.18)]"
        style={{ top, left, width, height }}
      />
    </>
  );
}
