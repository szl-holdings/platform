# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings · Doctrine v11 LOCKED · Λ = Conjecture 1
"""forecast — runs a deterministic sample FE-NO solve and reports its posture.

This binds the substrate forecast to the *actual* service: it calls
``service.solve`` on a canonical sample geometry so the brief reflects real
solver output (stub-labelled until Dev 1's core is vendored). All error figures
are ESTIMATEs; ``verified`` reflects the validator-gated flag honestly.
"""

from __future__ import annotations

from typing import Any

from . import service

# Canonical, deterministic sample problem (cantilever-style block under load).
SAMPLE_GEOMETRY: dict[str, Any] = {
    "kind": "block",
    "dims_m": [1.0, 0.1, 0.1],
    "n_dofs": 1200,
    "material": {"model": "linear_elastic", "E_GPa": 210.0, "nu": 0.3},
}
SAMPLE_BCS: dict[str, Any] = {
    "dirichlet": [{"face": "x_min", "fix": ["ux", "uy", "uz"]}],
    "neumann": [{"face": "x_max", "traction_N": [0.0, -1000.0, 0.0]}],
}


def compute(signals: list[dict[str, Any]]) -> dict[str, Any]:
    out = service.solve(SAMPLE_GEOMETRY, SAMPLE_BCS, sovereign=False)
    summary = service.solution_summary(out)
    return {
        "horizon": "per_solve",
        "method": summary["method"],
        "schwarz_iterations": summary["schwarz_iterations"],
        "bounded_error_estimate": summary["bounded_error_estimate"],
        "bounded_error_label": "ESTIMATE",
        "verified": summary["verified"],
        "stub": summary["stub"],
        "geometry_hash": summary["geometry_hash"],
        # Confidence is the substrate posture confidence, NOT a physics bound.
        "confidence": 0.7,
    }
