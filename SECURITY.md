# Security Policy

## Reporting Vulnerabilities

**Do not post security vulnerabilities in GitHub Issues.**

To report a security issue privately, email: **security@catalayer.com**

Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (optional)

We will respond within 5 business days.

## API Keys and Credentials

- **Never commit `.env` files** to version control.
- **Never commit `.runtime_config.json`** to version control.
- API keys entered in the Settings UI are stored **in memory only** and are never written to disk by the backend.
- Non-sensitive config (provider name, model tag, base URL) may be persisted to `.runtime_config.json` for convenience. This file is excluded from git via `.gitignore`.
- If you suspect an API key was exposed, rotate it immediately at your provider's dashboard.

## Provider Keys

MarketLayer supports user-owned AI provider keys:
- OpenAI: rotate at https://platform.openai.com/api-keys
- Anthropic: rotate at https://console.anthropic.com/
- Gemini: rotate at https://aistudio.google.com/
- Catalayer AI: contact support@catalayer.com

## Catalayer Premium Services

Catalayer AI, Catalayer News, and Catalayer AI Packs are optional paid services.
- Catalayer API keys are issued **only by Catalayer** — this open-source repo contains no key generation logic.
- Security issues related to Catalayer subscription abuse should be reported privately to security@catalayer.com.
- Do not post Catalayer API keys in GitHub issues.

## Scope

This security policy covers the **MarketLayer open-source repository** only.
It does not cover Catalayer's private backend infrastructure, billing systems, or production APIs.

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest  | ✅ Yes    |
| Older   | ❌ No     |

## Disclaimer

MarketLayer is research and educational software. It does not execute trades, manage funds, or provide personalized financial advice. Users are responsible for securing their own API keys and configurations.
