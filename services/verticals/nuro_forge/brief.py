"""NuroForge brief stub."""

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
        "top_decision": recommendation.next_action,
        "confidence": forecast.get("confidence"),
        "signal_count": len(signals),
        "rollback": recommendation.rollback_path,
    }
