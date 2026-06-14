# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings · Doctrine v11 LOCKED · Λ = Conjecture 1
"""recommendations — substrate recommendation for the SZL Mechanics vertical."""

from __future__ import annotations

from typing import Any

from services.verticals.contracts import Recommendation


def build(
    *, signals: list[dict[str, Any]], forecast: dict[str, Any], evidence: list[dict[str, Any]]
) -> Recommendation:
    stub = bool(forecast.get("stub", False))
    next_action = (
        "Vendor Dev 1's clean-room FE-NO core into szl_mechanics/_vendor/ and "
        "re-run verticals:validate to promote from STUB to verified solves."
        if stub
        else "Route verified solid-mechanics solves to the sovereign GPU fabric; "
        "persist each in-toto receipt to the khipu chain for the verified-compute premium."
    )
    return Recommendation(
        id="rec_mech_wire_verified_compute",
        vertical="szl_mechanics",
        title="Stand up receipt-verified solid-mechanics (FE-NO) as a verified-compute capability",
        owner="verified-compute@szl",
        confidence=float(forecast.get("confidence", 0.7)),
        evidence_ids=[e["id"] for e in evidence],
        next_action=next_action,
        rollback_path=(
            "Capability is additive and feature-flagged; disable the /mechanics/solve "
            "route and the registry entry to remove with zero impact on other verticals."
        ),
        input_class="mechanics_solve_request_v1",
        output_class="verified_solve_recommendation_v1",
    )
