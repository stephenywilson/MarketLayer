import { NavLink, Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { getHealth, listProviders } from "../api/client";
import { Icon } from "./Icon";
import { useMode } from "../hooks/useMode";

type IconName = Parameters<typeof Icon>[0]["name"];

interface NavLeaf {
  to: string;
  label: string;
  icon: IconName;
  end?: boolean;
}

const PRO_TOP: NavLeaf[] = [
  { to: "/pro/command-center", label: "Command Center", icon: "dashboard" },
  { to: "/pro/market-scanner", label: "Market Scan", icon: "search" },
  { to: "/pro/asset-lab", label: "Asset Analysis", icon: "workbench" },
  { to: "/pro/strategy-packs", label: "Strategy Lab", icon: "strategy" },
  { to: "/pro/data-sources", label: "Data & News", icon: "database" },
  { to: "/pro/ai-providers", label: "AI Providers", icon: "settings" },
  { to: "/pro/system-logs", label: "System Logs", icon: "device" },
];

function NavRow({ item }: { item: NavLeaf }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        isActive ? "ml-nav-item-active" : "ml-nav-item"
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            name={item.icon}
            size={16}
            className={isActive ? "text-ml-accent" : "text-ml-text-faint"}
          />
          <span>{item.label}</span>
        </>
      )}
    </NavLink>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { mode } = useMode();
  const location = useLocation();
  const [providerName, setProviderName] = useState<string>("None");
  const [aiStatus, setAiStatus] = useState<"Demo Mode" | "Connected" | "Not Connected">("Not Connected");
  const [healthy, setHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [h, p] = await Promise.all([getHealth(), listProviders()]);
        if (cancelled) return;
        setHealthy(h.status === "ok");
        const current = p.providers.find((x) => x.id === p.current);
        if (p.current === "mock" || current?.id === "mock") {
          setAiStatus("Demo Mode");
          setProviderName("Mock");
        } else if (current?.configured) {
          setAiStatus("Connected");
          setProviderName(current.name);
        } else {
          setAiStatus("Not Connected");
          setProviderName("None");
        }
      } catch {
        if (!cancelled) setHealthy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Both / and /pro/command-center render the same console shell.
  // Decoupling from `mode` lets the in-app Starter/Pro switch flip mode without forcing
  // a route change (and the remount that comes with it).
  const isMainConsole =
    location.pathname === "/" || location.pathname === "/pro/command-center";

  if (isMainConsole) {
    return (
      <div className="h-screen overflow-hidden text-ml-text ml-console-page-bg">
        <main className="h-full overflow-hidden ml-console-page-bg">{children}</main>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden flex bg-ml-bg text-ml-text">
      {/* Sidebar */}
      <aside className="w-[196px] shrink-0 border-r border-ml-border bg-[#0A0F11] flex flex-col">
        <div className="h-[104px] border-b border-ml-border flex items-center justify-center px-3">
          <Link to="/" className="flex items-center justify-center">
            <img
              src="/marketlayer-logo-white.png"
              alt="MarketLayer"
              className="h-auto w-[168px] object-contain"
            />
          </Link>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          <ProNav />
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 bg-ml-bg">
        {mode === "pro" && (
        <header className="h-12 border-b border-ml-border bg-ml-nav">
          <div className="ml-frame-shell h-full flex items-center gap-3">
            <span className="ml-pill text-ml-accent border-ml-accent/30">Mode: Pro</span>
            <div className="flex-1" />
            {mode === "pro" && (
              <div className="ml-pill">
                <span
                  className={[
                    "inline-block h-1.5 w-1.5 rounded-full",
                    healthy === null
                      ? "bg-ml-text-muted"
                      : healthy
                        ? "bg-ml-accent"
                        : "bg-ml-danger",
                  ].join(" ")}
                />
                <span>Backend: {healthy === null ? "..." : healthy ? "Online" : "Offline"}</span>
              </div>
            )}
            <span
              className={aiStatus === "Connected" || aiStatus === "Demo Mode" ? "ml-pill text-ml-accent border-ml-accent/30" : "ml-pill text-ml-warn border-ml-warn/30"}
              title={providerName !== "None" ? `Provider: ${providerName}` : undefined}
            >
              {aiStatus === "Demo Mode" ? "No Provider" : aiStatus === "Connected" ? "AI Connected" : "AI Not Connected"}
            </span>
            <span className="ml-pill">Public Data</span>
            {mode === "pro" && (
              <span className="ml-pill">
                <span className="text-ml-text-muted">Provider:</span>
                <span className="text-ml-accent">
                  {providerName}
                </span>
              </span>
            )}
            <span className="ml-pill text-ml-warn border-ml-warn/30">
              Trading Off
            </span>
          </div>
        </header>
        )}

        <main className="flex-1 overflow-y-auto bg-ml-bg">{children}</main>

        <footer className="border-t border-ml-border bg-ml-bg text-[11px] text-ml-text-muted">
          <div className="ml-frame-shell h-10 flex items-center justify-end">
              <div className="flex items-center border-l border-r border-ml-border">
              <a
                href="https://github.com/stephenywilson/marketlayer"
                className="px-4 h-10 inline-flex items-center border-r border-ml-border hover:text-ml-text-dim"
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </a>
              <Link
                to="/api-docs"
                className="px-4 h-10 inline-flex items-center border-r border-ml-border hover:text-ml-text-dim"
              >
                API docs
              </Link>
              <Link
                to="/privacy"
                className="px-4 h-10 inline-flex items-center border-r border-ml-border hover:text-ml-text-dim"
              >
                Privacy
              </Link>
              <span className="px-4 h-10 inline-flex items-center whitespace-nowrap">
                © 2024–2026 Catalayer AI
              </span>
              </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

function ProNav() {
  return (
    <>
      {PRO_TOP.map((it) => (
        <NavRow key={it.to} item={it} />
      ))}

      <div className="ml-nav-section">Reference</div>
      <a
        href="https://github.com/stephenywilson/marketlayer"
        target="_blank"
        rel="noreferrer"
        className="ml-nav-item"
      >
        <Icon name="github" size={16} className="text-ml-text-faint" />
        <span>GitHub</span>
      </a>
      <Link to="/api-docs" className="ml-nav-item">
        <Icon name="arrow-right" size={16} className="text-ml-text-faint" />
        <span>API docs</span>
      </Link>
    </>
  );
}
