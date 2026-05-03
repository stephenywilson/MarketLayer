"""MarketLayer by Catalayer FastAPI application entrypoint."""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.config import get_settings
from app.routes import console, health, mode, pro, providers, research, starter


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="MarketLayer",
        description=(
            "Open-source AI decision console for US equities — "
            "signals, strategy simulation, risk gate, and research-only "
            "decision-support briefs."
        ),
        version=__version__,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=False,
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type", "Authorization"],
    )

    app.include_router(health.router, prefix="/api", tags=["health"])
    app.include_router(mode.router, prefix="/api", tags=["mode"])
    app.include_router(providers.router, prefix="/api", tags=["providers"])
    app.include_router(research.router, prefix="/api", tags=["research"])
    app.include_router(console.router, prefix="/api", tags=["console"])
    app.include_router(starter.router, prefix="/api", tags=["starter"])
    app.include_router(pro.router, prefix="/api", tags=["pro"])

    @app.get("/")
    def root() -> dict:
        return {
            "name": "MarketLayer",
            "version": __version__,
            "description": (
                "Open-source AI decision console for US equities — "
                "signals, strategy simulation, risk gate, and research-"
                "only decision-support briefs."
            ),
            "tagline": "Decision support · Research only · Provider-agnostic.",
            "docs": "/docs",
            "health": "/api/health",
            "disclaimer": (
                "MarketLayer is for research and educational purposes only. "
                "It does not provide personalized financial guidance, direct "
                "market action instructions, brokerage services, or trade "
                "execution. Users are responsible for their own decisions."
            ),
        }

    return app


app = create_app()
