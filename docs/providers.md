# AI Providers

MarketLayer is provider-agnostic. The active provider is selected by
the `AI_PROVIDER` environment variable.

| ID         | Provider                         | API key | Local | Status      |
|------------|----------------------------------|---------|-------|-------------|
| `mock`     | Deterministic synthetic provider | —       | yes   | default     |
| `catalayer`| Catalayer AI                     | yes     | no    | wrapper     |
| `openai`   | OpenAI-compatible chat endpoint  | yes     | no    | implemented |
| `anthropic`| Anthropic Claude                 | yes     | no    | implemented |
| `gemini`   | Google Gemini                    | yes     | no    | implemented |
| `ollama`   | Local Ollama server              | —       | yes   | implemented |
| `mini500m` | Catalayer AI Mini 500M (planned) | —       | yes   | placeholder |

## Selection

```bash
# .env
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:7b
```

Restart the backend after changing `AI_PROVIDER`.

## Interface

All providers implement the same interface (`app/providers/ai/base.py`):

```python
class AIProvider:
    def analyze_market_event(self, payload: MarketEventInput) -> EventAnalysis: ...
    def generate_research_report(self, payload: ResearchReportInput) -> ResearchReport: ...
    def score_risk(self, payload: RiskScoringInput) -> RiskScore: ...
```

If a provider isn't configured or a request fails, the cloud-backed
implementations transparently fall back to the deterministic mock so
the demo never breaks. The fallback report is tagged with the original
provider's `id` in `provider_used` so you can see which path actually
ran.

## Adding a new provider

1. Create `app/providers/ai/<your_provider>.py` extending `AIProvider`.
2. Set `id`, `display_name`, `description`, `requires_api_key`,
   `is_local`, and `env_keys`.
3. Register the class in `app/providers/ai/__init__.py` `_REGISTRY`.
4. Add any new env vars to `app/config.py` and `.env.example`.
