# Security Policy — MarketLayer by Catalayer

## Reporting Security Issues

**Do not post security vulnerabilities in public GitHub Issues.**

To report a security issue privately, contact: **security@catalayer.com**

Please include:
- A clear description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (optional)

We will respond within 5 business days.

**Do not post API keys, tokens, server configurations, or Catalayer private interface details in public issues or pull requests.**

---

## API Key Handling

- **API keys entered in the Settings UI are stored in memory only** on the local backend process. They are never written to disk, never sent to third-party services other than the configured AI provider endpoint, and never included in frontend bundles or public files.
- API keys are cleared when the backend process restarts. This is a deliberate security design.
- Never commit a real `.env` file or runtime config with real keys to version control.
- The `.gitignore` in this repository excludes `.env`, `.env.*`, `.runtime_config.json`, `*.pem`, `*.key`, and other credential files.

---

## Catalayer API Keys

Catalayer API keys (for Catalayer AI, Catalayer News, Catalayer AI Packs) are **issued only by Catalayer** via the official Catalayer platform at [catalayer.com](https://catalayer.com).

This open-source repository:
- Does **not** generate Catalayer API keys
- Does **not** validate or authenticate Catalayer keys server-side
- Does **not** distribute, sell, or share Catalayer keys
- Does **not** include Catalayer billing, quota, or account management logic
- Does **not** include any bypass mechanism for Catalayer subscription requirements

If you have a Catalayer subscription key, you enter it in MarketLayer's Settings UI. It is stored in local memory and sent only to the configured Catalayer API endpoint.

---

## Security Controls in This Repository

| Control | Status | Details |
|---|---|---|
| API keys on disk | ✅ Never | Memory-only; `_is_sensitive()` filter prevents disk writes |
| CORS | ✅ Restricted | `GET, POST` only; `Content-Type, Authorization` headers only |
| SSRF protection | ✅ Present | `_is_safe_remote_url()` and `_is_safe_local_url()` block private IPs, localhost (for remote providers), and non-http(s) schemes |
| Ticker input validation | ✅ Present | Regex `^[A-Z]{1,5}(\.[A-Z]{1,2})?$` enforced before any URL or prompt use |
| XSS / dangerouslySetInnerHTML | ✅ None | Zero instances in frontend source; React automatic escaping used throughout |
| Mock provider in production | ✅ Blocked | `scan_service.py` raises HTTP 422 if provider resolves to MockProvider |
| Fake data on source failure | ✅ None | Price, news, and filing failures return empty/unavailable state — no synthetic data injected |
| Git history | ✅ Clean | Repository published from a clean initial state with no prior leaked history |

---

## Open-Source and Catalayer Private Boundary

This repository is the **open-source MarketLayer console**. It does not include:

- Catalayer private AI models or model weights
- Catalayer private scoring rubrics or prompts
- Catalayer private training datasets
- Catalayer News production ingestion pipeline
- Catalayer AI Packs private signal logic
- Catalayer production authentication middleware
- Catalayer billing, quota, or account infrastructure

Catalayer AI, Catalayer News, and Catalayer AI Packs appear in the UI as **optional subscription integration placeholders**. They are not active without a valid user-supplied Catalayer key.

See [OPEN_SOURCE_BOUNDARY.md](OPEN_SOURCE_BOUNDARY.md) for the full open-core boundary definition.

---

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest (`main`) | ✅ Yes |
| Previous releases | ❌ No — update to latest |

---

## Disclaimer

MarketLayer is research and education software. It does not execute trades, manage accounts, or provide investment advice. Users are responsible for securing their own API keys and configurations.
