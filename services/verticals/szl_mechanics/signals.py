# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings · Doctrine v11 LOCKED
"""signals — substrate signals for the SZL Mechanics (FE-NO) vertical.

Deterministic sample signals describing the verified-scientific-compute posture:
DeepONet-gap coverage, finite-element/neural-operator adjacency, and the
receipt-verified solve capability. No network, no third-party deps.
"""

from __future__ import annotations


def collect() -> list[dict[str, object]]:
    return [
        {
            "id": "sig_mech_deeponet_gap",
            "source": "estate-audit",
            "kind": "capability_gap",
            "summary": "DeepONet adjacency = 0 hits in estate; FE-NO fills the gap",
            "weight": 0.9,
        },
        {
            "id": "sig_mech_fe_no_adjacency",
            "source": "estate-audit",
            "kind": "adjacency",
            "summary": "finite-element (148 hits) + neural-operator (31 hits) adjacency present",
            "weight": 0.8,
        },
        {
            "id": "sig_mech_receipt_moat",
            "source": "verify-api",
            "kind": "moat",
            "summary": "every solve emits a DSSE-style in-toto provenance receipt (bounded-error ESTIMATE)",
            "weight": 0.95,
        },
        {
            "id": "sig_mech_sovereign_fabric",
            "source": "agentic-gpu",
            "kind": "infra",
            "summary": "sovereign GPU fabric available for own-metal verified-compute solves",
            "weight": 0.7,
        },
    ]
