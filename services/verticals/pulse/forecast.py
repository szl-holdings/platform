"""Pulse forecast stub — deterministic baseline. No external models in this pass."""

from __future__ import annotations

from typing import Any


def compute(signals: list[dict[str, Any]]) -> dict[str, Any]:
    weight = sum(float(s.get("weight", 0)) for s in signals)
    return {
        "horizon": "today",
        "method": "weighted-baseline-v0",
        "signal_pressure": round(weight, 3),
        "confidence": 0.62,
        "summary": "Founder attention is needed on the release-freeze decision before EOD.",
    }
