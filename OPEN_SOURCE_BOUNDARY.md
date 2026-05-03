# Open Source Boundary

This document defines what is included in the MarketLayer by Catalayer open-source repository and what belongs to Catalayer's private infrastructure.

---

## What is Open Source (This Repo)

MarketLayer is an **open-core** AI research console for US equities.

The following are fully open-source and freely usable under the project license:

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
| Skill Packs (Momentum, News Catalyst, etc.) | ✅ |
| Settings UI | ✅ |
| Catalayer AI placeholder integration | ✅ (UI + stub only) |
| Catalayer News placeholder | ✅ (UI + stub only) |
| Catalayer AI Packs placeholder | ✅ (UI + stub only) |

---

## What is NOT in This Repo (Catalayer Private)

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
| Catalayer internal news aggregation | ❌ Not included |
| Hidden Catalayer API calls | ❌ Not included |
| Hardcoded Catalayer production keys | ❌ Not included |

---

## Catalayer Premium Integration

The Catalayer AI, Catalayer News, and Catalayer AI Packs features in this repo are **integration stubs only**:

- The UI shows subscription prompts and links to `catalayer.com`
- If a user provides a valid Catalayer-issued API key, the integration stub forwards requests to the configured Catalayer endpoint
- **No Catalayer key is generated, validated, or stored by this repo**
- The open-source MarketLayer product is fully functional without Catalayer using:
  - OpenAI, Claude, Gemini, or Ollama as AI provider
  - Yahoo Finance RSS or Google News RSS as news sources
  - Stooq and SEC EDGAR as public data sources

---

## Running Without Catalayer

MarketLayer works fully without any Catalayer subscription:

```bash
# Use Ollama (free, local)
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

---

## License

This open-source repository is licensed under the terms in [LICENSE](LICENSE).

Catalayer brand assets, logos, API infrastructure, proprietary models, and private datasets are **not** covered by the open-source license and remain the property of Catalayer.
