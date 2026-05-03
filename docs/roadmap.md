# Roadmap

## V0.1 (current) — local research foundation

- [x] Local ticker research console
- [x] Mock provider (no API keys required)
- [x] AI provider abstraction with 6 backends + 1 placeholder
- [x] SEC / price / news connector skeletons
- [x] Catalayer-style dark dashboard frontend
- [x] Structured research report schema
- [x] FastAPI backend (`/api/health`, `/api/providers`,
      `/api/research`, `/api/analyze-event`)

## V0.2 — real data, exports

- [ ] Real SEC connector (CIK lookup, EDGAR submissions JSON, item
      extraction)
- [ ] Better price connector (multiple sources, cached OHLCV)
- [ ] Improved provider integrations (streaming, retries)
- [ ] Export research report to Markdown / JSON
- [ ] Watchlist support (local SQLite/DuckDB)

## V0.3 — Catalayer AI ecosystem

- [ ] Catalayer AI API integration (real endpoint paths)
- [ ] Catalayer News integration
- [ ] Event timeline aggregator (earnings, product, regulatory)
- [ ] More advanced risk scoring drivers
- [ ] Sector / ETF exposure mapping

## V0.4 — local Mini 500M

- [ ] Catalayer AI Mini 500M local model support
- [ ] Local event classification head
- [ ] Local report drafting
- [ ] Local risk explanation

## Future

- [ ] Browser extension integration
- [ ] Catalayer dashboard integration
- [ ] API server mode (multi-tenant, hosted)
- [ ] Hosted commercial version

## Non-goals

MarketLayer will never:

- execute trades,
- integrate with brokerages,
- provide live trading,
- provide directional instructions,
- claim guaranteed market prediction accuracy.
