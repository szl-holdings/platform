from __future__ import annotations

from typing import Any


def compute(signals: list[dict[str, Any]]) -> dict[str, Any]:
    score = round(sum(float(s.get("weight", 0)) for s in signals) / max(len(signals), 1), 3)
    return {
        "horizon": "this_week",
        "method": "stuck-decision-index-v0",
        "stuck_decision_score": score,
        "owner_drift_count": 2,
        "confidence": 0.6,
    }
