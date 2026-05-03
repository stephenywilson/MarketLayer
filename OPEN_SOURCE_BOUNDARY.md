# Open Source Boundary

This document defines what is and is not included in the MarketLayer by Catalayer open-source repository.

---

## What This Repository Includes (Open Source)

MarketLayer is **open-core** software. The following are fully open-source and freely usable under the Apache 2.0 license:

| Component | Included |
|-----------|----------|
| Starter Mode UI | ✅ |
| Advanced Mode UI | ✅ |
| FastAPI backend | ✅ |
| OpenAI provider integration | ✅ |
| Anthropic (Claude) provider integration | ✅ |
| Gemini provider integration | ✅ |
| Ollama / local model support | ✅ |
| OpenAI-compatible provider support | ✅ |
| Yahoo Finance RSS news source | ✅ |
| Google News RSS news source | ✅ |
| Stooq price data connector | ✅ |
| SEC EDGAR filing connector | ✅ |
| Rule-based scoring and risk logic | ✅ |
| Skill Packs (Momentum, News Catalyst, Risk Radar, Earnings Watch, Mean Reversion, Sector Rotation) | ✅ |
| Settings UI | ✅ |
| Catalayer AI placeholder integration | ✅ (UI + stub only) |
| Catalayer News placeholder | ✅ (UI + stub only) |
| Catalayer AI Packs placeholder | ✅ (UI + stub only) |
| Full documentation and security audit report | ✅ |

---

## What This Repository Does NOT Include (Catalayer Private)

The following belong to Catalayer's private backend and are **not included** in this repository:

| Component | Status |
|-----------|--------|
| Catalayer API key generation | ❌ Not included |
| Catalayer account management | ❌ Not included |
| Catalayer billing / subscription logic | ❌ Not included |
| Catalayer quota enforcement | ❌ Not included |
| Catalayer rate limiting | ❌ Not included |
| Catalayer production auth middleware | ❌ Not included |
| Catalayer production API secrets | ❌ Not included |
| Catalayer private scoring rubrics | ❌ Not included |
| Catalayer private model weights | ❌ Not included |
| Catalayer private training datasets | ❌ Not included |
| Catalayer private prompts | ❌ Not included |
| Catalayer internal news aggregation pipeline | ❌ Not included |
| Catalayer AI Packs signal logic | ❌ Not included |
| Hidden Catalayer API calls | ❌ Not included |
| Hardcoded Catalayer production keys | ❌ Not included |

---

## Running Without Catalayer

MarketLayer works fully without any Catalayer subscription. Configure your preferred AI provider in `backend/.env`:

```bash
# Ollama (free, fully local — recommended)
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=gemma4:e4b

# Or OpenAI
AI_PROVIDER=openai
OPENAI_API_KEY=your-own-key

# Or Anthropic
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=your-own-key
```

Every feature — Starter Mode, Advanced Mode, all skill packs, settings, and API docs — is fully functional with any of the above providers. No Catalayer account is required.

---

## Catalayer Premium Integration

The Catalayer AI, Catalayer News, and Catalayer AI Packs features in this repo are **integration stubs only**:

- The UI shows subscription prompts and links to [catalayer.com](https://catalayer.com)
- If a user provides a valid Catalayer-issued API key, the integration stub forwards requests to the configured Catalayer endpoint
- **No Catalayer key is generated, validated, or stored by this repo**
- All Catalayer keys are issued exclusively at [catalayer.com](https://catalayer.com)

The open-source MarketLayer product is fully functional without Catalayer using OpenAI, Anthropic, Gemini, or Ollama as the AI provider and Yahoo Finance RSS, Google News RSS, Stooq, and SEC EDGAR as public data sources.

---

## License

Apache License 2.0 covers the **source code** only. See [LICENSE](LICENSE).

Catalayer brand assets, logos, trademarks, proprietary models, and private datasets are **not** covered by the Apache 2.0 license. See [TRADEMARKS.md](TRADEMARKS.md) for brand usage guidelines.
