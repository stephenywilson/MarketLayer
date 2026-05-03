# Catalayer AI integration

MarketLayer is part of the Catalayer AI ecosystem, but it does not
require Catalayer AI to run. Catalayer AI is exposed through the same
provider interface as every other backend (OpenAI-compatible, Claude,
Gemini, Ollama, …).

## Boundaries

This open-source repository contains only:

- a generic HTTP wrapper that posts request payloads to a Catalayer
  API endpoint and parses the structured response,
- a clear set of environment variables to point that wrapper at any
  Catalayer-compatible deployment,
- a transparent fallback to the deterministic mock provider whenever
  the wrapper is not configured or a request fails.

This open-source repository **does not** contain:

- proprietary Catalayer AI prompts, rubrics, or scoring rules,
- private datasets, evaluation sets, or training corpora,
- private model weights of any size,
- internal Catalayer service code.

## Configuration

```env
AI_PROVIDER=catalayer
CATALAYER_API_KEY=your-key
CATALAYER_API_BASE_URL=https://api.catalayer.com
```

The wrapper posts to:

- `POST {base}/v1/marketlayer/events`  → `EventAnalysis`
- `POST {base}/v1/marketlayer/reports` → `ResearchReport`
- `POST {base}/v1/marketlayer/risk`    → `RiskScore`

All response shapes match the open-source schemas in
`backend/app/models/research.py`.

## Why a separate repo?

MarketLayer is positioned as an open, friendly entry point to the
Catalayer AI ecosystem. Anyone should be able to clone it, run it
locally, and use it with the AI provider they already trust — with
Catalayer AI as one option among several, not a hard dependency.
