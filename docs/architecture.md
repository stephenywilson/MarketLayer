# Architecture

MarketLayer is a small, layered, local-first application. The goal is
to keep boundaries clean enough that any layer can be replaced without
touching the others.

```
┌────────────────────────────────────────────────────────────────────┐
│                          Frontend (React)                          │
│  Vite + TypeScript + Tailwind · Catalayer-style dark dashboard     │
└────────────────────────────┬───────────────────────────────────────┘
                             │  HTTP /api/*
┌────────────────────────────▼───────────────────────────────────────┐
│                        Backend (FastAPI)                           │
│   routes/ ── services/research_service.py ── research/ ── models/  │
└────────────────────────────┬───────────────────────────────────────┘
                             │
        ┌────────────────────┼─────────────────────┐
        ▼                    ▼                     ▼
   AI providers         Data connectors       Local storage*
   (mock, catalayer,    (sec, price, news)    (sqlite/duckdb,
    openai, anthropic,                         optional)
    gemini, ollama,
    mini500m planned)
```

*V0.1 ships without persistent storage. Schemas are designed so caching
or watchlist persistence can be added in V0.2 without API changes.

## Module map

- `app/main.py` — FastAPI factory, CORS, route mounting.
- `app/config.py` — `Settings` (pydantic-settings, reads `.env`).
- `app/models/` — Pydantic request/response schemas. Single source of
  truth for the public JSON contract.
- `app/routes/` — thin HTTP layer. Validates input, delegates to
  services. No business logic.
- `app/services/research_service.py` — orchestrates data connectors and
  the AI provider into a `ResearchReport`.
- `app/research/report_builder.py` — composes connector outputs into
  the `ResearchReportInput` shape the AI provider sees.
- `app/research/prompts.py` — generic prompt templates (Apache-2.0,
  no proprietary rubrics).
- `app/providers/ai/` — pluggable AI provider implementations. New
  providers register themselves in `providers/ai/__init__.py`.
- `app/providers/data/` — pluggable data connectors. Each module is
  isolated and can be replaced freely.

## Why this shape

- **Local-first.** No cloud dependency required. The mock provider
  ensures the project works after `git clone` with zero secrets.
- **Provider-agnostic.** The `AIProvider` interface lets you swap
  Catalayer AI, OpenAI-compatible, Claude, Gemini, Ollama, and the
  planned Mini 500M model without touching routes or services.
- **Replaceable connectors.** Real SEC / price / news fetching is
  intentionally minimal in V0.1 — connectors are stubbed with clear
  TODOs so contributors can extend them in isolation.
