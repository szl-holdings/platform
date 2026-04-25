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
        "stuck_decision_score": forecast.get("stuck_decision_score"),
        "owner_drift_count": forecast.get("owner_drift_count"),
        "evidence_count": len(evidence),
        "next_action": recommendation.next_action,
    }
