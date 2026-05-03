# MarketLayer — AI Quant Decision Console

**Built for people, not quants.**

> ⚠️ **Research & Education Only** — MarketLayer does not provide financial advice, trading execution, brokerage services, or buy/sell instructions. It is research and education software. Users are solely responsible for their own decisions.

---

Most quant tools require you to already understand indicators, scoring weights, backtesting, signal pipelines, and risk models.

MarketLayer starts from the opposite direction.

You pick a market. You pick a style. You click **Analyze Market**. MarketLayer fetches real public price data and headlines, runs skill-pack scoring, and asks your AI to explain what it found — in plain English.

No finance background required. No complex setup. No black-box predictions.

---

## What MarketLayer does

```
Select market → Select scan style → Select skill packs → Connect AI
    → Click Analyze Market
    → Get bullish candidates, bearish candidates, news catalysts,
      risk alerts, and an AI market brief in plain English
```

MarketLayer is not a trading bot. It does not connect to brokerages. It does not execute trades. It is a research-focused decision console that makes quant-style analysis readable for everyone.

---

## Two modes. One console.

### Starter Mode — for beginners

Starter Mode is the autopilot experience. Everything is preset. You just pick your market and AI, then click Analyze.

- **Market**: US Stocks (v0.1)
- **Scan styles**: Balanced · Aggressive · Defensive · News Catalyst
- **Skill Packs**: Momentum · News Catalyst · Risk Radar · Earnings Watch · Mean Reversion · Sector Rotation
- **Output**: Bullish candidates · Bearish candidates · AI market brief · Risk alerts

No scoring weights to configure. No prompts to write. No data pipelines to wire up.

### Advanced Mode — full control

Advanced Mode exposes the same console with every control unlocked:

- Custom ticker universe
- Skill pack selection and weighting
- Risk filter inspection
- AI provider configuration
- System log and scan trace
- Full report drawer

Pro is not a separate product. It is the same scan pipeline with the hood open.

---

## Quickstart

### Requirements

- Python 3.11+
- Node.js 18+
- An AI provider: [Ollama](https://ollama.com) (free, local) · OpenAI · Anthropic · Gemini · any OpenAI-compatible endpoint

### 1. Clone

```bash
git clone https://github.com/your-org/marketlayer.git
cd marketlayer
```

### 2. Backend

```bash
cd backend
cp .env.example .env          # fill in your AI provider key if not using Ollama
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
# open http://localhost:5173
```

### 4. Connect AI

Open **Settings** in the app and select your AI provider:

| Provider | Key required | How to get |
|---|---|---|
| **Ollama** (recommended for local) | No | Install from [ollama.com](https://ollama.com), run `ollama pull gemma4:e4b` |
| OpenAI | Yes | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| Anthropic (Claude) | Yes | [console.anthropic.com](https://console.anthropic.com) |
| Gemini | Yes | [aistudio.google.com](https://aistudio.google.com) |
| Any OpenAI-compatible | Yes/Optional | Configure base URL in Settings |
| Catalayer AI | Catalayer subscription | [catalayer.com](https://catalayer.com) |

---

## Data sources (all free, no API key required)

| Source | Data | Notes |
|---|---|---|
| **Stooq** | Real-time US stock prices | Free, no key |
| **Yahoo Finance RSS** | Public news headlines | Free, public RSS |
| **Google News RSS** | Public news headlines | Free, public RSS |
| **SEC EDGAR** | Filing metadata (10-K, 10-Q, 8-K) | Free US government API |

If a data source is unavailable, MarketLayer returns an empty result for that source — it never injects synthetic or fake data.

---

## Skill Packs

Skill packs are MarketLayer-native signal modules. Each contributes scoring, confidence, risk notes, and AI context to the scan.

| Skill Pack | What it looks for |
|---|---|
| Momentum | Price momentum and trend confirmation |
| News Catalyst | Headline impact and event-driven signals |
| Risk Radar | Volatility, weak confirmation, data-quality risk |
| Earnings Watch | Earnings-related momentum and event risk |
| Mean Reversion | Extended names that may revert toward recent ranges |
| Sector Rotation | Sector-level strength and cross-stock movement |

**Catalayer AI Packs** (optional, subscription) — advanced signal packs trained on 10+ years of market data. Available at [catalayer.com](https://catalayer.com).

---

## How the scan pipeline works

```
Market selection
  → Universe loading (real public tickers)
  → Price data (Stooq — real prices)
  → News headlines (Yahoo RSS / Google News RSS — real headlines)
  → Filing metadata (SEC EDGAR — real filings)
  → Skill pack evaluation (rule-based scoring)
  → Bullish / bearish candidate ranking
  → Risk filter pass
  → AI enrichment (your AI provider generates plain-English reasons)
  → Market brief and full report
```

Every result is derived from real public data and your AI. No hardcoded outputs. No fake candidates. No synthetic market verdicts.

If no AI provider is configured, the app shows a clear setup-required message and does not generate a fake report.

---

## Open Core boundary

MarketLayer is **open-core** software.

This repository is fully open-source and works without any Catalayer services:

✅ Included in this repo:
- Complete Starter Mode and Advanced Mode UI
- FastAPI backend
- All public data connectors (Stooq, Yahoo RSS, Google News RSS, SEC EDGAR)
- All skill packs
- OpenAI, Anthropic, Gemini, and Ollama provider integrations
- OpenAI-compatible custom endpoint support
- Catalayer AI / Catalayer News / Catalayer AI Packs as **optional integration stubs** (UI + placeholder only)

❌ Not included — Catalayer private infrastructure only:
- Catalayer API key generation
- Catalayer account management
- Catalayer billing and subscription logic
- Catalayer quota and rate limiting
- Catalayer private scoring rubrics
- Catalayer private model weights
- Catalayer private training datasets
- Catalayer internal news aggregation
- Any hardcoded Catalayer production secrets

**Catalayer API keys are issued only by Catalayer and are not generated, stored, or distributed by this repository.**

You can run MarketLayer fully and independently using Ollama (free, local), OpenAI, Anthropic, or Gemini — no Catalayer account needed.

---

## AI provider notes

- API keys you enter in Settings are stored **in memory only** on the backend and are never written to disk or sent anywhere except your chosen provider's API endpoint.
- Keys are cleared when the backend restarts. This is a deliberate security design.
- Never commit your `.env` file or API keys to version control.
- See [SECURITY.md](SECURITY.md) for the full security policy.

---

## Markets

| Market | Status | Default universe |
|---|---|---|
| US Stocks | ✅ Enabled | AAPL · MSFT · NVDA · TSLA · AMD · META · GOOGL · AMZN · NFLX · AVGO |
| Crypto | 🔜 Planned | — |
| Hong Kong Stocks | 🔜 Planned | — |
| Japan Stocks | 🔜 Planned | — |
| UK Stocks | 🔜 Planned | — |
| China A-Shares | 🔜 Planned | — |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) if present, or open an issue to discuss.

Please do not post API keys, `.env` files, or credentials in GitHub issues or pull requests.

---

## Security

See [SECURITY.md](SECURITY.md) for how to report vulnerabilities.

See [SECURITY_AUDIT_REPORT.md](SECURITY_AUDIT_REPORT.md) for the pre-release security audit.

---

## Open source boundary

See [OPEN_SOURCE_BOUNDARY.md](OPEN_SOURCE_BOUNDARY.md) for the full description of what is and is not included in this repository.

---

## Disclaimer

MarketLayer is for **research and educational purposes only**.

It does not provide personalized financial advice, direct market action instructions, brokerage services, or trade execution. Scan results are AI-generated research output based on public data. They are not investment recommendations.

Users are solely responsible for their own financial decisions.

---

## License

Apache License 2.0 — see [LICENSE](LICENSE).

© 2024–2026 Catalayer AI. MarketLayer is part of the Catalayer AI open-source ecosystem.
