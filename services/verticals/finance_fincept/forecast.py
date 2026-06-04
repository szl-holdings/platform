from __future__ import annotations

from typing import Any


def compute(signals: list[dict[str, Any]]) -> dict[str, Any]:
    pricing = next((s for s in signals if s["kind"] == "pricing"), None)
    return {
        "horizon": "next_quarter",
        "method": "baseline-pressure-index-v0",
        "runway_pressure": "moderate",
        "pricing_pressure": "elevated" if pricing else "low",
        "market_timing": "watch",
        "confidence": 0.58,
    }
