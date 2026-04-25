from __future__ import annotations

from typing import Any


def compute(signals: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "horizon": "next_12_months",
        "method": "noi-baseline-v0",
        "noi_forecast_placeholder": "stable_with_downside_skew",
        "property_risk_index": 0.74,
        "capex_overrun_pct": 12.0,
        "confidence": 0.55,
    }
