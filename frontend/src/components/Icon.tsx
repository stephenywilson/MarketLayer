// Inline outline icons — matches the line-style iconography in Catalayer.
// 24x24, stroke 1.5, currentColor.

type IconName =
  | "dashboard"
  | "workbench"
  | "signal"
  | "strategy"
  | "backtest"
  | "shield"
  | "database"
  | "settings"
  | "bell"
  | "search"
  | "ghost"
  | "device"
  | "github"
  | "arrow-right"
  | "chevron-up"
  | "live"
  | "check"
  | "filter"
  | "play"
  | "catalayer"
  | "marketlayer-logo"
  | "logo";

interface Props {
  name: IconName;
  className?: string;
  size?: number;
}

export function Icon({ name, className = "", size = 18 }: Props) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
  };

  switch (name) {
    case "marketlayer-logo":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 64 64"
          fill="none"
          className={className}
          aria-hidden="true"
        >
          <path
            d="M12 18.5 32 7l20 11.5v27L32 57 12 45.5v-27Z"
            stroke="#E8F1F5"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path
            d="M20 23 32 16l12 7v16L32 46l-12-7V23Z"
            stroke="#64CE9B"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <path
            d="M12 18.5 32 30l20-11.5M12 45.5 32 34l20 11.5"
            stroke="#64CE9B"
            strokeWidth="1.6"
            strokeLinejoin="round"
            opacity="0.72"
          />
          <path
            d="M22.5 34.5 28 29l5 4 8.5-9.5"
            stroke="#64CE9B"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="22.5" cy="34.5" r="2" fill="#64CE9B" />
          <circle cx="28" cy="29" r="2" fill="#64CE9B" />
          <circle cx="33" cy="33" r="2" fill="#64CE9B" />
          <circle cx="41.5" cy="23.5" r="2" fill="#64CE9B" />
        </svg>
      );
    case "catalayer":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 48 48"
          fill="none"
          className={className}
          aria-hidden="true"
        >
          <path
            d="M10 11.6 27.6 2.7v42.6L10 36.4V11.6Z"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <path
            d="M27.6 2.7 39 8.8v30.4l-11.4 6.1V2.7Z"
            fill="currentColor"
          />
          <path
            d="M10 11.6 27.6 21M10 36.4 27.6 27"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "logo":
      return (
        <svg {...common}>
          <rect x="4" y="4" width="7" height="7" rx="1" />
          <rect x="13" y="4" width="7" height="7" rx="1" />
          <rect x="4" y="13" width="7" height="7" rx="1" />
          <rect x="13" y="13" width="7" height="7" rx="1" />
        </svg>
      );
    case "dashboard":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="8" height="9" rx="1" />
          <rect x="13" y="3" width="8" height="5" rx="1" />
          <rect x="13" y="10" width="8" height="11" rx="1" />
          <rect x="3" y="14" width="8" height="7" rx="1" />
        </svg>
      );
    case "workbench":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <line x1="12" y1="3" x2="12" y2="6" />
          <line x1="12" y1="18" x2="12" y2="21" />
          <line x1="3" y1="12" x2="6" y2="12" />
          <line x1="18" y1="12" x2="21" y2="12" />
          <circle cx="12" cy="12" r="2.5" />
        </svg>
      );
    case "signal":
      return (
        <svg {...common}>
          <path d="M3 17l5-5 4 4 6-8 3 3" />
          <path d="M3 21h18" />
        </svg>
      );
    case "strategy":
      return (
        <svg {...common}>
          <polygon points="12 3 21 8 12 13 3 8 12 3" />
          <polyline points="3 13 12 18 21 13" />
          <polyline points="3 17 12 22 21 17" />
        </svg>
      );
    case "backtest":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 14l4-3 3 2 4-5 4 3 3-2" />
        </svg>
      );
    case "shield":
      return (
        <svg {...common}>
          <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );
    case "database":
      return (
        <svg {...common}>
          <ellipse cx="12" cy="5" rx="8" ry="3" />
          <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
          <path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
        </svg>
      );
    case "settings":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
        </svg>
      );
    case "bell":
      return (
        <svg {...common}>
          <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9z" />
          <path d="M10 21a2 2 0 0 0 4 0" />
        </svg>
      );
    case "search":
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.5" y2="16.5" />
        </svg>
      );
    case "ghost":
      return (
        <svg {...common}>
          <path d="M5 11a7 7 0 0 1 14 0v9l-3-2-2 2-2-2-2 2-2-2-3 2v-9z" />
          <circle cx="9" cy="11" r="0.5" fill="currentColor" />
          <circle cx="15" cy="11" r="0.5" fill="currentColor" />
        </svg>
      );
    case "device":
      return (
        <svg {...common}>
          <rect x="6" y="2" width="12" height="20" rx="2" />
          <line x1="11" y1="18" x2="13" y2="18" />
        </svg>
      );
    case "github":
      return (
        <svg {...common}>
          <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.49v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.46-1.11-1.46-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.86v2.76c0 .27.18.59.69.49A10 10 0 0 0 12 2z" />
        </svg>
      );
    case "arrow-right":
      return (
        <svg {...common}>
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="13 6 19 12 13 18" />
        </svg>
      );
    case "chevron-up":
      return (
        <svg {...common}>
          <polyline points="6 15 12 9 18 15" />
        </svg>
      );
    case "live":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" fill="currentColor" />
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
    case "check":
      return (
        <svg {...common}>
          <polyline points="4 12 10 18 20 6" />
        </svg>
      );
    case "filter":
      return (
        <svg {...common}>
          <polygon points="3 4 21 4 14 13 14 20 10 20 10 13 3 4" />
        </svg>
      );
    case "play":
      return (
        <svg {...common}>
          <polygon points="6 4 20 12 6 20 6 4" />
        </svg>
      );
  }
}
