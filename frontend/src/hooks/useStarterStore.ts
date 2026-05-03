import { useCallback, useEffect, useState } from "react";

const WATCH_KEY = "marketlayer:starter:watchlist";
const RESULTS_KEY = "marketlayer:starter:results";

export type StarterStatus = "Monitor" | "Review" | "Warning" | "Blocked";

export interface WatchEntry {
  ticker: string;
  status: StarterStatus;
  signal: string;
  riskLevel: string;
  lastChecked: string; // ISO
}

export interface ResultEntry {
  id: string;
  symbol: string;
  preset: string;
  status: StarterStatus;
  provider: string;
  time: string; // ISO
  brief: string;
}

function readJSON<T>(key: string, fallback: T): T {
  if (typeof localStorage === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

// ----- Watchlist -----

export function useWatchlist() {
  const [items, setItems] = useState<WatchEntry[]>(() =>
    readJSON<WatchEntry[]>(WATCH_KEY, [])
  );

  useEffect(() => {
    writeJSON(WATCH_KEY, items);
  }, [items]);

  const upsert = useCallback((entry: WatchEntry) => {
    setItems((prev) => {
      const idx = prev.findIndex(
        (p) => p.ticker.toUpperCase() === entry.ticker.toUpperCase()
      );
      if (idx === -1) return [entry, ...prev];
      const next = prev.slice();
      next[idx] = entry;
      return next;
    });
  }, []);

  const remove = useCallback((ticker: string) => {
    setItems((prev) =>
      prev.filter((p) => p.ticker.toUpperCase() !== ticker.toUpperCase())
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  return { items, upsert, remove, clear };
}

// ----- Results -----

export function useResults() {
  const [items, setItems] = useState<ResultEntry[]>(() =>
    readJSON<ResultEntry[]>(RESULTS_KEY, [])
  );

  useEffect(() => {
    writeJSON(RESULTS_KEY, items);
  }, [items]);

  const push = useCallback((entry: ResultEntry) => {
    setItems((prev) => [entry, ...prev].slice(0, 50));
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  return { items, push, remove, clear };
}

// Status mapping helper used across Starter components
export function gateToStatus(decision: string): StarterStatus {
  switch (decision) {
    case "passed":
      return "Monitor";
    case "warning":
      return "Warning";
    case "review_required":
      return "Review";
    case "blocked":
      return "Blocked";
    default:
      return "Review";
  }
}

export const STATUS_TONE: Record<
  StarterStatus,
  "ok" | "info" | "warn" | "danger"
> = {
  Monitor: "ok",
  Review: "info",
  Warning: "warn",
  Blocked: "danger",
};
