# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings · Doctrine v11 LOCKED · Λ = Conjecture 1
"""service — verified solid-mechanics solve interface for the SZL ecosystem.

Public entrypoint:

    solve(geometry, bcs, *, sovereign=False) -> {"solution": ..., "receipt": ...}

``solution`` is a JSON-serialisable summary of the FE-NO solve.
``receipt`` is the honest UNSIGNED in-toto provenance statement (the moat).

Sovereign rule: ``sovereign=True`` asserts own-metal execution. This layer does
NOT itself schedule GPUs; it records the operator's sovereign intent into the
receipt predicate so the scheduler (apps/agentic-gpu) can enforce own-metal-only
placement. We never mark a solve sovereign on borrowed metal.
"""

from __future__ import annotations

from typing import Any

from . import core_adapter, receipt


def solve(
    geometry: dict[str, Any],
    bcs: dict[str, Any],
    *,
    sovereign: bool = False,
    with_envelope: bool = False,
) -> dict[str, Any]:
    """Solve a solid-mechanics problem and emit a provenance receipt.

    Parameters
    ----------
    geometry : dict   Geometry spec (mesh/domain description, hashed for the receipt).
    bcs : dict        Boundary conditions (Dirichlet/Neumann/loads).
    sovereign : bool  Record own-metal sovereign intent in the receipt.
    with_envelope : bool  Also return the unsigned DSSE envelope skeleton.

    Returns
    -------
    {"solution": <summary dict>, "receipt": <in-toto statement>,
     "dsse_envelope": <optional unsigned envelope>}
    """
    result = core_adapter.solve_core(geometry, bcs, sovereign=sovereign)
    statement = receipt.build_statement(result, sovereign=sovereign)

    solution = {
        "method": result["method"],
        "displacement": result.get("displacement"),
        "schwarz_iterations": result["schwarz_iterations"],
        "bounded_error_estimate": (
            None
            if result.get("bounded_error_estimate") != result.get("bounded_error_estimate")
            else result.get("bounded_error_estimate")
        ),
        "bounded_error_label": "ESTIMATE",
        "walltime_s": result["walltime_s"],
        "verified": result["verified"],
        "sovereign": bool(sovereign),
        "stub": result.get("stub", False),
        "geometry_hash": result["geometry_hash"],
    }

    out: dict[str, Any] = {"solution": solution, "receipt": statement}
    if with_envelope:
        out["dsse_envelope"] = receipt.build_dsse_envelope(statement)
    return out


def solution_summary(solve_out: dict[str, Any]) -> dict[str, Any]:
    """Compact, endpoint-friendly summary of a ``solve`` output."""
    sol = solve_out["solution"]
    return {
        "method": sol["method"],
        "schwarz_iterations": sol["schwarz_iterations"],
        "bounded_error_estimate": sol["bounded_error_estimate"],
        "bounded_error_label": "ESTIMATE",
        "walltime_s": sol["walltime_s"],
        "verified": sol["verified"],
        "sovereign": sol["sovereign"],
        "stub": sol["stub"],
        "geometry_hash": sol["geometry_hash"],
    }


__all__ = ["solve", "solution_summary"]
