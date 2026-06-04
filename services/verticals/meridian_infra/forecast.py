"""Meridian Infra forecast stub."""

from __future__ import annotations

from typing import Any


def compute(signals: list[dict[str, Any]]) -> dict[str, Any]:
    weight = sum(float(s.get("weight", 0)) for s in signals)
    return {
        "horizon": "30d",
        "method": "infra-cost-baseline-v0",
        "signal_pressure": round(weight, 3),
        "confidence": 0.74,
        "summary": "Infrastructure cost pressure elevated. Rightsizing and storage expansion recommended.",
    }
