# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings · Doctrine v11 LOCKED · Λ = Conjecture 1
# Sign-off: Stephen P. Lutar Jr. <stephenlutar2@gmail.com>
"""brief — synthesise the substrate brief for the SZL PINN vertical."""

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
        "pde": forecast.get("pde"),
        "alpha": forecast.get("alpha"),
        "solution_error_estimate": forecast.get("solution_error_estimate"),
        "rel_L2_estimate": forecast.get("rel_L2_estimate"),
        "bounded_error_label": "ESTIMATE",
        "verified": forecast.get("verified"),
        "modeled_not_measured": forecast.get("modeled_not_measured", True),
        "stub": forecast.get("stub"),
        "moat": (
            "every heat/thermal solve emits a DSSE-style in-toto provenance receipt "
            "(signed on szl_lake/khipu path); same shape as szl_mechanics"
        ),
        "energy_honesty": (
            "PINN MODELS heat; it does NOT create or measure energy. Landauer floor "
            "is MODELED. Joules MEASURED-only via the real exporter. No free-energy."
        ),
        "evidence_count": len(evidence),
        "next_action": recommendation.next_action,
    }
