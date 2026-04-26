"""Firestorm Ops signals stub."""

from __future__ import annotations


def collect() -> list[dict[str, object]]:
    return [
        {
            "id": "sig_firestorm_p0_incident",
            "source": "pagerduty",
            "kind": "p0_incident",
            "summary": "P0 incident: payment processing latency spike — 4.2s p99",
            "weight": 0.95,
        },
        {
            "id": "sig_firestorm_cascade_risk",
            "source": "dependency-graph",
            "kind": "cascade_risk",
            "summary": "Auth service degradation may cascade to 6 downstream services",
            "weight": 0.80,
        },
    ]
