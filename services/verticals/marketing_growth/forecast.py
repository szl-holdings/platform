from __future__ import annotations

from typing import Any


def compute(signals: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "horizon": "next_2_weeks",
        "method": "proof-to-pipeline-baseline-v0",
        "campaign_thesis": "Lead with verifiable customer proof on the channel that already works.",
        "expected_lift_pct": 18.0,
        "confidence": 0.55,
    }
