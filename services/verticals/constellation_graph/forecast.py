"""Constellation Graph forecast stub."""

from __future__ import annotations

from typing import Any


def compute(signals: list[dict[str, Any]]) -> dict[str, Any]:
    weight = sum(float(s.get("weight", 0)) for s in signals)
    return {
        "horizon": "14d",
        "method": "graph-pattern-baseline-v0",
        "signal_pressure": round(weight, 3),
        "confidence": 0.65,
        "summary": "Cross-domain risk patterns emerging. Entity correlation review recommended.",
    }
