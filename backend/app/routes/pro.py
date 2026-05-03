"""Pro Mode endpoints and aliases."""
from __future__ import annotations

from fastapi import APIRouter

from app.models.console import (
    BacktestResultModel,
    BacktestRunRequest,
    DataLakeStatus,
    RiskGateResult,
    SignalListResponse,
    StrategyListResponse,
    WorkbenchRequest,
    WorkbenchResult,
)
from app.models.market_scan import MarketReport, MarketScanRequest
from app.routes.console import (
    data_sources_status,
    list_signals,
    list_strategies,
    run_asset_lab,
    run_backtest,
    run_risk_gate,
)
from app.services import scan_service
from app.services import strategy_pack_service

router = APIRouter()


@router.post("/pro/analyze-asset", response_model=WorkbenchResult)
def pro_analyze_asset(req: WorkbenchRequest) -> WorkbenchResult:
    return run_asset_lab(req)


@router.post("/pro/market-scan", response_model=MarketReport)
def pro_market_scan(req: MarketScanRequest) -> MarketReport:
    return scan_service.run_market_scan(req, mode="pro")


@router.get("/pro/news")
def pro_news() -> dict:
    report = scan_service.run_market_scan(MarketScanRequest(report_depth="quick"), mode="pro")
    return {"news": report.news_catalysts, "scan_id": report.scan_id}


@router.get("/pro/strategy-packs", response_model=StrategyListResponse)
def pro_strategy_packs() -> StrategyListResponse:
    return StrategyListResponse(strategies=strategy_pack_service.list_strategy_packs())


@router.post("/pro/backtest", response_model=BacktestResultModel)
def pro_backtest(req: BacktestRunRequest) -> BacktestResultModel:
    return run_backtest(req)


@router.get("/pro/signals", response_model=SignalListResponse)
def pro_signals() -> SignalListResponse:
    return list_signals()


@router.post("/pro/risk-check", response_model=RiskGateResult)
def pro_risk_check(req: WorkbenchRequest) -> RiskGateResult:
    return run_risk_gate(req)


@router.get("/pro/data-sources", response_model=DataLakeStatus)
def pro_data_sources() -> DataLakeStatus:
    return data_sources_status()
