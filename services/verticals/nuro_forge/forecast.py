"""NuroForge forecast stub."""

from __future__ import annotations

from typing import Any


def compute(signals: list[dict[str, Any]]) -> dict[str, Any]:
    weight = sum(float(s.get("weight", 0)) for s in signals)
    return {
        "horizon": "sprint",
        "method": "agent-quality-baseline-v0",
        "signal_pressure": round(weight, 3),
        "confidence": 0.70,
        "summary": "Agent quality pressure elevated. Regression review and adapter promotion recommended.",
    }
