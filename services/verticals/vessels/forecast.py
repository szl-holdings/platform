from __future__ import annotations

from typing import Any


def compute(signals: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "horizon": "next_voyage",
        "method": "voyage-risk-baseline-v0",
        "delay_risk": "elevated",
        "route_risk": "moderate",
        "claims_risk_placeholder": "watch",
        "confidence": 0.6,
    }
