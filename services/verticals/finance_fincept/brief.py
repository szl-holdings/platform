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
        "runway_pressure": forecast.get("runway_pressure"),
        "pricing_pressure": forecast.get("pricing_pressure"),
        "market_timing": forecast.get("market_timing"),
        "evidence_count": len(evidence),
        "next_action": recommendation.next_action,
    }
