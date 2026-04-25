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
        "delay_risk": forecast.get("delay_risk"),
        "route_risk": forecast.get("route_risk"),
        "claims_risk_placeholder": forecast.get("claims_risk_placeholder"),
        "evidence_count": len(evidence),
        "next_action": recommendation.next_action,
    }
