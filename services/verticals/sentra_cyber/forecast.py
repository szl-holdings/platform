"""Sentra Cyber forecast stub — deterministic baseline. No external models in this pass."""

from __future__ import annotations

from typing import Any


def compute(signals: list[dict[str, Any]]) -> dict[str, Any]:
    weight = sum(float(s.get("weight", 0)) for s in signals)
    return {
        "horizon": "72h",
        "method": "threat-weighted-baseline-v0",
        "signal_pressure": round(weight, 3),
        "confidence": 0.78,
        "summary": "Elevated cyber risk profile. CVE remediation required within SLA window.",
    }
