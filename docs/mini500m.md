# Catalayer AI Mini 500M (roadmap)

Catalayer AI Mini 500M is a planned local lightweight model (~500M
parameters) designed for the kind of work MarketLayer does:

- market event classification
- research report drafting
- risk explanation
- fully local-first research workflows

## Status

`mini500m` ships as a **placeholder provider** today
(`backend/app/providers/ai/mini500m.py`). It satisfies the AI provider
interface and proxies all calls to the deterministic mock, so the
project remains fully runnable.

This open-source repository **does not** include:

- model weights,
- training data,
- proprietary internal Catalayer logic.

## Planned environment

```env
AI_PROVIDER=mini500m
MINI500M_MODEL_PATH=./models/catalayer-ai-mini-500m
```

## Planned integration

When weights are released, the placeholder provider will be replaced
with a real local inference path. Candidate runtimes include:

- `llama.cpp` for CPU / Metal,
- `mlx` for Apple Silicon,
- `transformers` for portability.

The provider interface in `backend/app/providers/ai/base.py` will not
need to change — only `mini500m.py` will be filled in.

## Why ship a placeholder now?

So that the open-source surface is honest about what's planned, the
config story is stable, and contributors can begin wiring the
research pipeline against `AI_PROVIDER=mini500m` immediately.
