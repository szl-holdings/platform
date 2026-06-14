# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings · Doctrine v11 LOCKED · Λ = Conjecture 1
# Sign-off: Stephen P. Lutar Jr. <stephenlutar2@gmail.com>
"""recommendations — substrate recommendation for the SZL PINN vertical."""

from __future__ import annotations

from typing import Any

from services.verticals.contracts import Recommendation


def build(
    *, signals: list[dict[str, Any]], forecast: dict[str, Any], evidence: list[dict[str, Any]]
) -> Recommendation:
    stub = bool(forecast.get("stub", False))
    next_action = (
        "Install numpy on the verified-compute path so the vendored clean-room "
        "PINN core (szl_pinn/_vendor/) activates, then re-run verticals:validate "
        "to promote from STUB to real receipt-verified heat/thermal solves."
        if stub
        else "Route receipt-verified heat/thermal PINN solves to the sovereign GPU "
        "fabric; feed the MODELED thermal field (advisory) to the wasted/stranded "
        "energy harvest scheduler; persist each in-toto receipt to the khipu chain."
    )
    return Recommendation(
        id="rec_pinn_wire_verified_compute",
        vertical="szl_pinn",
        title=(
            "Stand up the receipt-verified PINN (heat / GPU-die thermal) as a "
            "sibling verified-compute capability of the FE-NO operator solver"
        ),
        owner="verified-compute@szl",
        confidence=float(forecast.get("confidence", 0.7)),
        evidence_ids=[e["id"] for e in evidence],
        next_action=next_action,
        rollback_path=(
            "Capability is additive and feature-flagged; disable the /pinn/* routes "
            "and remove the registry entry to roll back with zero impact on other "
            "verticals (szl_mechanics and the rest are untouched)."
        ),
        input_class="pinn_solve_request_v1",
        output_class="verified_solve_recommendation_v1",
    )
