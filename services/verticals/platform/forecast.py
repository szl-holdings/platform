"""Platform / AgentOps forecast — deterministic baseline."""

from __future__ import annotations

from typing import Any


def compute(signals: list[dict[str, Any]]) -> dict[str, Any]:
    """Compute a deterministic platform health forecast from collected signals."""
    if not signals:
        return {
            "horizon": "7d",
            "method": "signal-weighted-baseline-v0",
            "platform_health_score": 0.0,
            "confidence": 0.50,
            "summary": "No signals available — cannot forecast.",
        }

    avg_weight = sum(float(s.get("weight", 0.5)) for s in signals) / len(signals)
    confidence = round(min(avg_weight + 0.05, 0.95), 3)

    drift_signal = next((s for s in signals if s.get("kind") == "agentops_drift"), None)
    drift_detected = drift_signal.get("metadata", {}).get("drift_detected", False) if drift_signal else False

    policy_signal = next((s for s in signals if s.get("kind") == "model_policy_health"), None)
    policy_valid = policy_signal.get("metadata", {}).get("valid", False) if policy_signal else False

    gate_signal = next((s for s in signals if s.get("kind") == "release_gate_health"), None)
    gates_ok = gate_signal.get("metadata", {}).get("has_required_scripts", False) if gate_signal else False

    risk_factors = []
    if drift_detected:
        risk_factors.append("model version drift detected")
    if not policy_valid:
        risk_factors.append("model policy invalid or missing")
    if not gates_ok:
        risk_factors.append("release gates incomplete")

    summary = (
        "Platform substrate healthy — all gates passing, no drift detected."
        if not risk_factors
        else f"Platform risk factors: {'; '.join(risk_factors)}."
    )

    return {
        "horizon": "7d",
        "method": "signal-weighted-baseline-v0",
        "platform_health_score": round(avg_weight, 3),
        "confidence": confidence,
        "risk_factors": risk_factors,
        "drift_detected": drift_detected,
        "policy_valid": policy_valid,
        "gates_ok": gates_ok,
        "summary": summary,
    }
