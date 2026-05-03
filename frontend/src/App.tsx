import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Layout } from "./components/Layout";
import { useMode } from "./hooks/useMode";

import ModeSelection from "./pages/ModeSelection";
import StarterHome from "./pages/StarterHome";
import ConnectAI from "./pages/ConnectAI";

import AIProviders from "./pages/AIProviders";
import ApiDocs from "./pages/ApiDocs";
import Privacy from "./pages/Privacy";

function HomeRoute() {
  const { hasSelectedMode } = useMode();
  if (!hasSelectedMode) return <ModeSelection />;
  // Render StarterHome regardless of mode so the in-app Starter/Pro switch
  // doesn't unmount/remount the whole console (which would kill animations).
  return <StarterHome />;
}

function ProConsoleRoute() {
  const { mode, setMode } = useMode();
  useEffect(() => {
    if (mode !== "pro") setMode("pro");
  }, [mode, setMode]);
  return <StarterHome />;
}

export default function App() {
  const { hasSelectedMode } = useMode();
  const location = useLocation();

  if (!hasSelectedMode || location.pathname === "/mode-selection") {
    return (
      <Routes>
        <Route path="*" element={<ModeSelection />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomeRoute />} />

        {/* Starter routes */}
        <Route path="/connect-ai" element={<Navigate to="/settings" replace />} />
        <Route path="/analyze" element={<Navigate to="/" replace />} />
        <Route path="/results" element={<Navigate to="/" replace />} />
        <Route path="/watchlist" element={<Navigate to="/" replace />} />
        <Route path="/settings" element={<ConnectAI />} />
        <Route path="/api-docs" element={<ApiDocs />} />
        <Route path="/privacy" element={<Privacy />} />

        {/* Shared provider routes */}
        <Route path="/providers" element={<AIProviders />} />

        {/* Pro Mode now reuses the same console as Starter Mode.
            Legacy multi-page Pro routes redirect to the unified command center. */}
        <Route path="/pro/command-center" element={<ProConsoleRoute />} />
        <Route path="/pro/asset-lab" element={<Navigate to="/pro/command-center" replace />} />
        <Route path="/pro/market-scanner" element={<Navigate to="/pro/command-center" replace />} />
        <Route path="/pro/news-analysis" element={<Navigate to="/pro/command-center" replace />} />
        <Route path="/pro/strategy-packs" element={<Navigate to="/pro/command-center" replace />} />
        <Route path="/pro/backtest-lab" element={<Navigate to="/pro/command-center" replace />} />
        <Route path="/pro/signal-scanner" element={<Navigate to="/pro/command-center" replace />} />
        <Route path="/pro/risk-filters" element={<Navigate to="/pro/command-center" replace />} />
        <Route path="/pro/data-sources" element={<Navigate to="/pro/command-center" replace />} />
        <Route path="/pro/ai-providers" element={<Navigate to="/pro/command-center" replace />} />
        <Route path="/pro/system-logs" element={<Navigate to="/pro/command-center" replace />} />

        {/* Legacy redirects */}
        <Route path="/docs" element={<Navigate to="/api-docs" replace />} />
        <Route path="/quick-run" element={<Navigate to="/analyze" replace />} />
        <Route path="/workbench" element={<Navigate to="/pro/asset-lab" replace />} />
        <Route path="/asset-lab" element={<Navigate to="/pro/asset-lab" replace />} />
        <Route
          path="/strategies"
          element={<Navigate to="/pro/strategy-packs" replace />}
        />
        <Route path="/strategy-lab" element={<Navigate to="/pro/strategy-packs" replace />} />
        <Route
          path="/backtest"
          element={<Navigate to="/pro/backtest-lab" replace />}
        />
        <Route path="/backtest-lab" element={<Navigate to="/pro/backtest-lab" replace />} />
        <Route
          path="/signals"
          element={<Navigate to="/pro/signal-scanner" replace />}
        />
        <Route path="/signal-scanner" element={<Navigate to="/pro/signal-scanner" replace />} />
        <Route path="/risk-gate" element={<Navigate to="/pro/risk-filters" replace />} />
        <Route
          path="/data-lake"
          element={<Navigate to="/pro/data-sources" replace />}
        />
        <Route path="/data-sources" element={<Navigate to="/pro/data-sources" replace />} />
        <Route
          path="/research"
          element={<Navigate to="/pro/asset-lab" replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
