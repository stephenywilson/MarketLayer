"""Decision console endpoints."""
from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.models.console import (
    BacktestEquityPoint,
    BacktestMetricsModel,
    BacktestResultModel,
    BacktestRunRequest,
    BacktestSignalRow,
    CommandCenterStatus,
    DataLakeStatus,
    DistributionBucket,
    PipelineResponse,
    RiskGateResult,
    SignalListResponse,
    StrategyCard,
    StrategyListResponse,
    TickerRollup,
    WorkbenchRequest,
    WorkbenchResult,
)
from app.services import (
    backtest_engine,
    command_center,
    data_lake,
    pipeline,
    risk_gate,
    signal_engine,
    strategy_lab,
    strategy_pack_service,
    workbench,
)

router = APIRouter()


def _validate_ticker(raw: str) -> str:
    t = (raw or "").strip().upper()
    if not t or len(t) > 8 or not t.replace(".", "").replace("-", "").isalnum():
        raise HTTPException(status_code=400, detail="Invalid ticker symbol.")
    return t


@router.get("/command-center", response_model=CommandCenterStatus)
def command_center_status() -> CommandCenterStatus:
    return command_center.snapshot()


@router.get("/pipeline", response_model=PipelineResponse)
def get_pipeline() -> PipelineResponse:
    return pipeline.status()


@router.get("/signals", response_model=SignalListResponse)
def list_signals() -> SignalListResponse:
    sigs = signal_engine.all_active_signals(limit_per_ticker=2)
    return SignalListResponse(
        signals=sigs,
        universe="MarketLayer default watchlist (S&P 500 mega-caps · synthetic)",
        last_run_at=datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    )


@router.get("/strategies", response_model=StrategyListResponse)
def list_strategies() -> StrategyListResponse:
    return StrategyListResponse(strategies=strategy_pack_service.list_strategy_packs())


class StrategyToggleRequest(BaseModel):
    enabled: bool


@router.post("/strategies/{strategy_id}/toggle", response_model=StrategyCard)
def toggle_strategy(strategy_id: str, body: StrategyToggleRequest) -> StrategyCard:
    s = strategy_pack_service.set_enabled(strategy_id, body.enabled)
    if not s:
        raise HTTPException(status_code=404, detail="Strategy not found.")
    return s


@router.post("/risk-gate", response_model=RiskGateResult)
def run_risk_gate(req: WorkbenchRequest) -> RiskGateResult:
    ticker = _validate_ticker(req.ticker)
    return risk_gate.run_for_ticker(ticker)


# Asset Lab is the new public name; /api/workbench remains for backward compat.
@router.post("/asset-lab", response_model=WorkbenchResult)
def run_asset_lab(req: WorkbenchRequest) -> WorkbenchResult:
    ticker = _validate_ticker(req.ticker)
    return workbench.run(ticker, req.news_text, req.strategy_id)


@router.post("/workbench", response_model=WorkbenchResult)
def run_workbench(req: WorkbenchRequest) -> WorkbenchResult:
    ticker = _validate_ticker(req.ticker)
    return workbench.run(ticker, req.news_text, req.strategy_id)


@router.post("/backtest", response_model=BacktestResultModel)
def run_backtest(req: BacktestRunRequest) -> BacktestResultModel:
    params = backtest_engine.BacktestParams(
        strategy_id=req.strategy_id,
        universe=req.universe,
        period=req.period,
        forward_window_days=req.forward_window_days,
        risk_filter=req.risk_filter,
        custom_tickers=req.custom_tickers,
    )
    result = backtest_engine.run(params)
    metrics_dict = result.metrics.__dict__
    return BacktestResultModel(
        params=req,
        metrics=BacktestMetricsModel(
            **{
                **metrics_dict,
                "distribution": [
                    DistributionBucket(**d.__dict__) for d in result.metrics.distribution
                ],
                "best_tickers": [
                    TickerRollup(**t.__dict__) for t in result.metrics.best_tickers
                ],
                "worst_tickers": [
                    TickerRollup(**t.__dict__) for t in result.metrics.worst_tickers
                ],
            }
        ),
        equity_curve=[
            BacktestEquityPoint(date=p.date, equity=p.equity)
            for p in result.equity_curve
        ],
        signals=[
            BacktestSignalRow(
                date=s.date,
                ticker=s.ticker,
                rationale=s.rationale,
                forward_return_pct=s.forward_return_pct,
                aligned=s.aligned,
            )
            for s in result.signals
        ],
        started_at=result.started_at,
        finished_at=result.finished_at,
        duration_ms=result.duration_ms,
        data_source=result.data_source,
    )


@router.get("/data-lake", response_model=DataLakeStatus)
def data_lake_status() -> DataLakeStatus:
    return data_lake.status()


# Public alias — Data Sources is the new product name.
@router.get("/data-sources", response_model=DataLakeStatus)
def data_sources_status() -> DataLakeStatus:
    return data_lake.status()
