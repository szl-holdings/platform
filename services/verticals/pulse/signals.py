"""Deterministic Pulse signals stub. Real ingestion lives behind feature flags."""

from __future__ import annotations


def collect() -> list[dict[str, object]]:
    return [
        {
            "id": "sig_pulse_release_freeze",
            "source": "github",
            "kind": "release_freeze",
            "summary": "main branch frozen pending Phase 7 sign-off",
            "weight": 0.8,
        },
        {
            "id": "sig_pulse_blocked_owner",
            "source": "linear",
            "kind": "owner_blocked",
            "summary": "T-3147 awaiting design review > 36h",
            "weight": 0.65,
        },
        {
            "id": "sig_pulse_open_incident",
            "source": "sentry",
            "kind": "incident",
            "summary": "elevated 5xx on /api/onboarding (low severity)",
            "weight": 0.4,
        },
    ]
