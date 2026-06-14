# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings · Doctrine v11 LOCKED · Λ = Conjecture 1
"""brief — synthesise the substrate brief for the SZL Mechanics vertical."""

from __future__ import annotations

from typing import Any

from services.verticals.contracts import Recommendation


def synthesise(
    *,
    signals: list[dict[str, Any]],
    forecast: dict[str, Any],
    evidence: list[dict[str, Any]],
    recommendation: Recommendation,
) -> dict[str, Any]:
    return {
        "headline": recommendation.title,
        "method": forecast.get("method"),
        "schwarz_iterations": forecast.get("schwarz_iterations"),
        "bounded_error_estimate": forecast.get("bounded_error_estimate"),
        "bounded_error_label": "ESTIMATE",
        "verified": forecast.get("verified"),
        "stub": forecast.get("stub"),
        "moat": "every solve emits a DSSE-style in-toto provenance receipt (signed on szl_lake/khipu path)",
        "evidence_count": len(evidence),
        "next_action": recommendation.next_action,
    }
