/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Page + surface system
        "ml-bg": "#05070A",
        "ml-nav": "#05070A",
        "ml-bg-elev": "#0D1319",
        "ml-panel": "#0A0F14",
        "ml-panel-2": "#0D1319",
        "ml-panel-hover": "#0D1319",

        // Borders — translucent so they float over any backdrop
        "ml-border": "rgba(126, 151, 160, 0.14)",
        "ml-border-strong": "rgba(126, 151, 160, 0.22)",

        // Text — calm cool-grays
        "ml-text": "#E8EEF2",
        "ml-text-dim": "#A5B4BD",
        "ml-text-muted": "#70818C",
        "ml-text-faint": "#4F5C61",

        // MarketLayer brand
        "ml-accent": "#19D6B0",
        "ml-accent-soft": "#30E2BF",
        "ml-accent-deep": "#19D6B0",
        "ml-accent-2": "#19D6B0",
        "ml-bullish": "#19D6B0",
        "ml-bearish": "#E26A6A",
        "ml-risk": "#D8B34B",

        // Special states
        "ml-warn": "#D8B34B",
        "ml-info": "#7dd3fc",
        "ml-danger": "#E26A6A",
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Inter",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "JetBrains Mono",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
        ],
      },
      boxShadow: {
        panel: "0 0 0 1px rgba(126,151,160,0.14)",
        glow: "0 0 22px rgba(25,214,176,0.10)",
      },
      letterSpacing: {
        widest2: "0.18em",
      },
      borderRadius: {
        sm: "3px",
        DEFAULT: "5px",
        md: "6px",
        lg: "8px",
      },
    },
  },
  plugins: [],
};
