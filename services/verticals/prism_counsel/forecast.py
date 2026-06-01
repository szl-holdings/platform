from __future__ import annotations

from typing import Any


def compute(signals: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "horizon": "next_7_days",
        "method": "matter-risk-baseline-v0",
        "deadline_risk": "high",
        "obligation_gap_count": 1,
        "evidence_state": "incomplete",
        "confidence": 0.65,
    }
