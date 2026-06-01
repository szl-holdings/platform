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
        "deadline_risk": forecast.get("deadline_risk"),
        "obligation_gap_count": forecast.get("obligation_gap_count"),
        "evidence_state": forecast.get("evidence_state"),
        "evidence_count": len(evidence),
        "next_action": recommendation.next_action,
    }
