# Release Checklist

Pre-release checklist for MarketLayer open-source publication.

---

## Security

- [x] No secrets, API keys, or credentials in source files
- [x] No `.env` files committed (covered by `.gitignore`)
- [x] No `.env.bak` files committed (added to `.gitignore`)
- [x] No `.runtime_config.json` committed (added to `.gitignore`)
- [x] `.env.example` exists with placeholders only
- [x] API keys are never written to disk (memory-only in runtime_config.py)
- [x] No Catalayer private backend code included
- [x] No Catalayer API key generation logic
- [x] No Catalayer billing or quota logic
- [x] No hardcoded Catalayer production keys
- [x] CORS restricted to GET/POST + required headers only
- [x] SSRF protection on user-configurable base URLs
- [x] Ticker symbol input validation (regex, no injection)
- [x] No `dangerouslySetInnerHTML` in frontend

## Data Integrity

- [x] No fake/mock production output in default scan flow
- [x] No hardcoded market verdicts or candidate scores
- [x] No hardcoded fake news catalysts
- [x] If no AI provider configured → clear setup-required error (HTTP 422)
- [x] If AI call fails → clear provider error (HTTP 503), no silent fallback
- [x] Price data from Stooq (real, free, no API key) with yfinance fallback
- [x] News from Yahoo Finance RSS + Google News RSS (real public feeds)
- [x] SEC EDGAR filing data (real public API)
- [x] Mock provider (`source="mock"`) blocked in production scan flow
- [x] No mock news baseline injected when RSS fails (returns empty list)
- [x] No mock price data when yfinance fails (returns unavailable state)
- [x] No mock SEC filings (returns empty list on failure)

## AI Provider

- [x] No Demo AI in production flows
- [x] OpenAI integration works (user-provided key)
- [x] Anthropic integration works (user-provided key)
- [x] Gemini integration works (user-provided key)
- [x] Ollama/local model works (no key required)
- [x] Catalayer AI → subscription prompt + catalayer.com redirect (key-gated)
- [x] Provider errors shown clearly in UI
- [x] No API key printed in logs or error messages
- [x] Test Connection tests the selected provider only

## Catalayer Premium Boundary

- [x] Catalayer AI requires user-provided Catalayer API key
- [x] Catalayer News marked as subscription required
- [x] Catalayer AI Packs marked as subscription required
- [x] All Catalayer premium UI shows catalayer.com link
- [x] No hidden Catalayer API calls without user-provided key
- [x] No bypass for premium features

## Features

- [x] Mode selection page works on first launch
- [x] Starter Mode loads and scans correctly
- [x] Advanced Mode loads and scans correctly
- [x] Mode switch (Starter ↔ Advanced) works without page reload
- [x] Bottom bar controls all work (Market, Style, Skills, AI, Analyze Market)
- [x] Skills picker works with preset chips and individual toggles
- [x] Settings drawer opens/closes correctly
- [x] AI provider configuration in Settings works
- [x] News sources section shows built-in and user-added sources
- [x] Catalayer News flagged as premium in News Sources
- [x] Evidence & Reasoning panel shows real AI output
- [x] Candidate cards show real AI-generated reasons
- [x] Why this? / View Details buttons open correct panel
- [x] Full Report modal works in Advanced Mode
- [x] Scan results persist to localStorage for returning users
- [x] Empty state shown on true first launch (no fake data)

## Build & Quality

- [ ] `npm run build` passes in frontend
- [ ] TypeScript `tsc --noEmit` passes (0 errors)
- [ ] Backend starts without errors
- [ ] `npm audit` reviewed (no critical vulnerabilities)
- [ ] No console.log with sensitive data in frontend

## Documentation

- [x] README.md complete with setup instructions
- [x] LICENSE present
- [x] SECURITY.md present
- [x] OPEN_SOURCE_BOUNDARY.md present
- [x] SECURITY_AUDIT_REPORT.md present
- [x] backend/.env.example with placeholders only
- [x] Financial disclaimer visible in UI and README

## Pre-Publication

- [ ] Remove or anonymize any internal notes/comments
- [ ] Run `git status` to confirm no unintended files staged
- [ ] Confirm `git log` history contains no secrets
- [ ] Tag release version in git
- [ ] Publish to GitHub as public repository
