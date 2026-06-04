from __future__ import annotations

from typing import Any

from services.verticals.contracts import Recommendation


def synthesise(
    *,
    signals: list[dict[str, Any]],
    forecast: dict[str, Any],
    evidence: list[dict[str, Any]],
    recommendation: Recommendation,
) -> dict[str, Any]:
    return {
        "headline": recommendation.title,
        "property_risk_index": forecast.get("property_risk_index"),
        "capex_overrun_pct": forecast.get("capex_overrun_pct"),
        "noi_forecast_placeholder": forecast.get("noi_forecast_placeholder"),
        "evidence_count": len(evidence),
        "next_action": recommendation.next_action,
    }
