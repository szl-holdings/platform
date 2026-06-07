"""Pulse brief stub — synthesises signals + forecast + recommendation into a daily brief."""

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
        "blocked_owner": next(
            (s["summary"] for s in signals if s["kind"] == "owner_blocked"), None
        ),
        "risk": next((s["summary"] for s in signals if s["kind"] == "incident"), None),
        "forecast_summary": forecast.get("summary"),
        "evidence_count": len(evidence),
    }
