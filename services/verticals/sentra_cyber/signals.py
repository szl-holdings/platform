"""Sentra Cyber signals stub. Real ingestion wires to SIEM feeds and threat intel APIs."""

from __future__ import annotations


def collect() -> list[dict[str, object]]:
    return [
        {
            "id": "sig_sentra_threat_surface",
            "source": "sentra-posture",
            "kind": "threat_surface_expansion",
            "summary": "Attack surface increased by 12 new internet-facing endpoints",
            "weight": 0.85,
        },
        {
            "id": "sig_sentra_cve_critical",
            "source": "nvd-feed",
            "kind": "critical_cve",
            "summary": "CVE-2026-0142 (CVSS 9.8) affects 3 production dependencies",
            "weight": 0.95,
        },
        {
            "id": "sig_sentra_anomaly",
            "source": "siem",
            "kind": "behavioral_anomaly",
            "summary": "Unusual lateral movement pattern detected in prod VPC",
            "weight": 0.72,
        },
    ]
