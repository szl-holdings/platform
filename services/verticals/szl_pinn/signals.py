# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings · Doctrine v11 LOCKED
# Sign-off: Stephen P. Lutar Jr. <stephenlutar2@gmail.com>
"""signals — substrate signals for the SZL PINN (energy) vertical.

Deterministic sample signals describing the verified-scientific-compute posture:
the PINN completes the mesh-free PDE-solve / inverse half of SZL's physics-ML
stack (FE-NO operator surrogate = fast-surrogate half), the receipt-verified
thermal-field modeling capability, and the honest energy boundary. No network,
no third-party deps.
"""

from __future__ import annotations


def collect() -> list[dict[str, object]]:
    return [
        {
            "id": "sig_pinn_completes_physics_ml",
            "source": "estate-audit",
            "kind": "capability_gap",
            "summary": (
                "PINN adds the mesh-free PDE-solve/inverse half that the FE-NO "
                "operator surrogate (szl_mechanics) was already drawing toward"
            ),
            "weight": 0.9,
        },
        {
            "id": "sig_pinn_receipt_moat",
            "source": "verify-api",
            "kind": "moat",
            "summary": (
                "every heat/thermal solve emits a DSSE-style in-toto provenance "
                "receipt (bounded-error ESTIMATE) — same shape as szl_mechanics"
            ),
            "weight": 0.95,
        },
        {
            "id": "sig_pinn_thermal_scheduling",
            "source": "energy-thesis",
            "kind": "energy",
            "summary": (
                "2D GPU-die thermal field is a MODELED thermal-aware-scheduling "
                "input for the wasted/stranded-energy harvest engine (planning, "
                "not a power source)"
            ),
            "weight": 0.8,
        },
        {
            "id": "sig_pinn_modeled_not_measured",
            "source": "doctrine-v11",
            "kind": "honesty",
            "summary": (
                "PINN output is MODELED, never MEASURED; joules MEASURED only via "
                "the real exporter; no free-energy / over-unity (Λ free-energy guard)"
            ),
            "weight": 0.85,
        },
    ]
