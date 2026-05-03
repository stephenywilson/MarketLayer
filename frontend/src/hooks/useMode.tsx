import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Mode = "starter" | "pro";

// User-facing label for the advanced mode is "Advanced", but internally we keep the
// original "pro" identifier so existing routes / state names don't break.
const STORAGE_KEY = "marketlayerPreferredMode";
const LEGACY_STORAGE_KEY = "marketlayer:mode";

function externalize(mode: Mode): "starter" | "advanced" {
  return mode === "pro" ? "advanced" : "starter";
}

function internalize(stored: string | null): Mode | null {
  if (stored === "advanced" || stored === "pro") return "pro";
  if (stored === "starter") return "starter";
  return null;
}

interface Ctx {
  mode: Mode;
  hasSelectedMode: boolean;
  setMode: (m: Mode) => void;
  toggle: () => void;
}

const ModeCtx = createContext<Ctx>({
  mode: "starter",
  hasSelectedMode: false,
  setMode: () => {},
  toggle: () => {},
});

function readStoredMode(): Mode | null {
  if (typeof localStorage === "undefined") return null;
  return (
    internalize(localStorage.getItem(STORAGE_KEY)) ??
    internalize(localStorage.getItem(LEGACY_STORAGE_KEY))
  );
}

function readInitial(): Mode {
  return readStoredMode() ?? "starter";
}

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<Mode>(readInitial);
  const [hasSelectedMode, setHasSelectedMode] = useState(() => readStoredMode() !== null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, externalize(mode));
    } catch {
      /* ignore */
    }
  }, [mode]);

  const setMode = useCallback((m: Mode) => {
    setModeState(m);
    setHasSelectedMode(true);
  }, []);
  const toggle = useCallback(
    () => {
      setModeState((m) => (m === "starter" ? "pro" : "starter"));
      setHasSelectedMode(true);
    },
    []
  );

  return (
    <ModeCtx.Provider value={{ mode, hasSelectedMode, setMode, toggle }}>
      {children}
    </ModeCtx.Provider>
  );
}

export function useMode() {
  return useContext(ModeCtx);
}
