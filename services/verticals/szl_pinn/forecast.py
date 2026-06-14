# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings · Doctrine v11 LOCKED · Λ = Conjecture 1
# Sign-off: Stephen P. Lutar Jr. <stephenlutar2@gmail.com>
"""forecast — runs a deterministic sample PINN solve and reports its posture.

SIBLING of services/verticals/szl_mechanics/forecast.py. Binds the substrate
forecast to the *actual* service: it calls ``service.solve`` on a canonical
sample heat problem so the brief reflects real solver output (stub-labelled if
the core/numpy is unavailable). All error figures are ESTIMATEs; ``verified``
reflects the validator-gated flag honestly; ``modeled_not_measured`` is always
True (the PINN MODELS heat — no measured energy is asserted).

Epochs are kept modest here so ``verticals:validate`` / ``meridian:check`` stay
fast; this is a posture probe, not a production solve.
"""

from __future__ import annotations

from typing import Any

from . import service

# Canonical, deterministic sample problem (1D heat bar, u_t = alpha*u_xx).
SAMPLE_GEOMETRY: dict[str, Any] = {
    "problem": "heat",
    "alpha": 0.4,
    "L": 1.0,
    "T": 1.0,
    "k_mode": 1,
    "epochs": 400,  # modest: posture probe, not a production solve
    "seed": 0,
}
SAMPLE_BCS: dict[str, Any] = {
    "bc": {"type": "dirichlet", "value": 0.0},
    "ic": {"type": "sine_mode", "k": 1},
}


def compute(signals: list[dict[str, Any]]) -> dict[str, Any]:
    out = service.solve(SAMPLE_GEOMETRY, SAMPLE_BCS, sovereign=False)
    summary = service.solution_summary(out)
    return {
        "horizon": "per_solve",
        "method": summary["method"],
        "pde": summary.get("pde"),
        "alpha": summary.get("alpha"),
        "solution_error_estimate": summary["solution_error_estimate"],
        "rel_L2_estimate": summary.get("rel_L2_estimate"),
        "bounded_error_label": "ESTIMATE",
        "verified": summary["verified"],
        "modeled_not_measured": summary.get("modeled_not_measured", True),
        "stub": summary["stub"],
        "geometry_hash": summary["geometry_hash"],
        # Confidence is the substrate posture confidence, NOT a physics bound.
        "confidence": 0.7,
    }
