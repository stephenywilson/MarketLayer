"""Lightweight, transparent risk score helpers.

Intentionally simple: real risk-scoring rubrics belong in pluggable
provider implementations (e.g. Catalayer AI), not in this open-source
boundary layer.
"""
from __future__ import annotations

from typing import Literal

RiskLevel = Literal["low", "moderate", "elevated", "high"]


def level_from_score(score: int) -> RiskLevel:
    score = max(0, min(100, score))
    if score < 35:
        return "low"
    if score < 55:
        return "moderate"
    if score < 75:
        return "elevated"
    return "high"
