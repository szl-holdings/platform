"""Platform / AgentOps brief — synthesised executive summary."""

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
    """Return an executive brief dict from the pipeline outputs."""
    mcp_signal = next((s for s in signals if s["kind"] == "mcp_registry_health"), None)
    gate_signal = next((s for s in signals if s["kind"] == "release_gate_health"), None)

    return {
        "headline": recommendation.title,
        "top_decision": recommendation.next_action,
        "platform_health_score": forecast.get("platform_health_score"),
        "confidence": forecast.get("confidence"),
        "risk_factors": forecast.get("risk_factors", []),
        "drift_detected": forecast.get("drift_detected", False),
        "mcp_status": mcp_signal.get("summary") if mcp_signal else None,
        "gate_status": gate_signal.get("summary") if gate_signal else None,
        "signal_count": len(signals),
        "evidence_count": len(evidence),
        "rollback": recommendation.rollback_path,
        "requires_human_approval": recommendation.requires_human_approval,
    }
