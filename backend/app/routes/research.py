"""Research and event analysis endpoints."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.models.research import (
    EventAnalysis,
    EventAnalysisRequest,
    ResearchReport,
    ResearchRequest,
)
from app.services.research_service import analyze_event, generate_research_report

router = APIRouter()


def _validate_ticker(raw: str) -> str:
    t = (raw or "").strip().upper()
    if not t or len(t) > 8 or not t.replace(".", "").replace("-", "").isalnum():
        raise HTTPException(status_code=400, detail="Invalid ticker symbol.")
    return t


@router.post("/research", response_model=ResearchReport)
def research(req: ResearchRequest) -> ResearchReport:
    ticker = _validate_ticker(req.ticker)
    return generate_research_report(ticker, req.news_text)


@router.post("/analyze-event", response_model=EventAnalysis)
def analyze(req: EventAnalysisRequest) -> EventAnalysis:
    ticker = _validate_ticker(req.ticker)
    if not req.event_text or not req.event_text.strip():
        raise HTTPException(status_code=400, detail="event_text is required.")
    return analyze_event(ticker, req.event_text.strip())
