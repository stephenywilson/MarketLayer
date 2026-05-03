"""Starter Mode endpoints."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.models.market_scan import (
    MarketReport,
    MarketScanRequest,
    StarterResultsResponse,
    StarterWatchlistResponse,
)
from app.services import scan_service

router = APIRouter()


@router.post("/starter/analyze-market", response_model=MarketReport)
def analyze_market(req: MarketScanRequest | None = None) -> MarketReport:
    return scan_service.run_market_scan(req or MarketScanRequest(), mode="starter")


@router.get("/starter/results", response_model=StarterResultsResponse)
def starter_results() -> StarterResultsResponse:
    return StarterResultsResponse(reports=scan_service.recent_results())


@router.get("/starter/results/{scan_id}", response_model=MarketReport)
def starter_report(scan_id: str) -> MarketReport:
    report = scan_service.get_report(scan_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")
    return report


@router.get("/starter/watchlist", response_model=StarterWatchlistResponse)
def starter_watchlist() -> StarterWatchlistResponse:
    return StarterWatchlistResponse(items=scan_service.generated_watchlist())

