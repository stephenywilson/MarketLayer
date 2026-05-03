"""Filing metadata facade for SEC EDGAR."""
from __future__ import annotations

from app.providers.data import sec


def get_company_facts(ticker: str, enabled: bool = True):
    if not enabled:
        return sec.CompanyFacts(
            ticker=ticker.upper(),
            cik=None,
            name=ticker.upper(),
            overview="Filing lookup disabled for this scan.",
            sic_description="—",
            exchange="—",
            filings=[],
            source="disabled",
            as_of="",
        )
    return sec.fetch_company_facts(ticker)


def source_label(source: str) -> str:
    if source == "sec_edgar":
        return "SEC EDGAR"
    if source == "disabled":
        return "Disabled"
    return "demo fallback"

