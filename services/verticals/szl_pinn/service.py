# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings · Doctrine v11 LOCKED · Λ = Conjecture 1
# Sign-off: Stephen P. Lutar Jr. <stephenlutar2@gmail.com>
"""service — receipt-verified PINN solve interface for the SZL ecosystem.

SIBLING of services/verticals/szl_mechanics/service.py. Public entrypoints:

    solve_heat(domain, alpha, bc, ic, *, sovereign=False, with_envelope=False)
        -> {"field": <summary>, "receipt": <in-toto statement>, ...}

    solve_thermal(load_map, *, sovereign=False, with_envelope=False)
        -> {"temperature_field": <summary>, "landauer_floor_MODELED": <W>,
            "receipt": <in-toto statement>, ...}

    solve(geometry, bcs, *, sovereign=False, with_envelope=False)   # substrate-generic

``field`` / ``temperature_field`` is a JSON-serialisable summary of the PINN solve.
``receipt`` is the honest UNSIGNED in-toto provenance statement (the moat).

HONESTY (Doctrine v11, load-bearing): the PINN MODELS heat/thermal fields. It does
NOT create or measure energy. The Landauer floor is a MODELED thermodynamic floor,
not a measured device power. Real joules are MEASURED only via SZL's real power
exporter. No free-energy / over-unity; harvest = WASTED/stranded heat only.

Sovereign rule: ``sovereign=True`` asserts own-metal execution. This layer does
NOT itself schedule GPUs; it records the operator's sovereign intent into the
receipt predicate so the scheduler (apps/agentic-gpu) can enforce own-metal-only
placement. We never mark a solve sovereign on borrowed metal.
"""
from __future__ import annotations

from typing import Any

from . import core_adapter, receipt


def _finish(
    geometry: dict[str, Any],
    bcs: dict[str, Any],
    *,
    sovereign: bool,
    with_envelope: bool,
    field_key: str,
) -> dict[str, Any]:
    """Run the core, build the receipt, and assemble the response envelope."""
    result = core_adapter.solve_core(geometry, bcs, sovereign=sovereign)
    statement = receipt.build_statement(result, sovereign=sovereign)

    err = result.get("solution_error_estimate")
    err_clean = None if (err is None or err != err) else float(err)

    summary: dict[str, Any] = {
        "method": result["method"],
        "pde": result.get("pde"),
        "alpha": result.get("alpha"),
        "field": result.get("field"),
        "converged": result.get("converged"),
        "physics_residual_loss": (
            None
            if result.get("physics_residual_loss") != result.get("physics_residual_loss")
            else result.get("physics_residual_loss")
        ),
        "solution_error_estimate": err_clean,
        "bounded_error_label": "ESTIMATE",
        "rel_L2_estimate": result.get("rel_L2_estimate"),
        "walltime_s": result["walltime_s"],
        "verified": result["verified"],
        "modeled_not_measured": result.get("modeled_not_measured", True),
        "sovereign": bool(sovereign),
        "stub": result.get("stub", False),
        "geometry_hash": result["geometry_hash"],
    }

    out: dict[str, Any] = {field_key: summary, "receipt": statement}

    # Thermal: surface the MODELED Landauer floor + joule accounting at top level.
    if result.get("problem") == "thermal":
        out["landauer_floor_MODELED"] = result.get("landauer_floor_MODELED")
        out["joule_accounting"] = result.get("joule_accounting")  # MODELED, labelled
        summary["rel_residual"] = result.get("rel_residual")

    if with_envelope:
        out["dsse_envelope"] = receipt.build_dsse_envelope(statement)
    return out


def solve_heat(
    domain: dict[str, Any] | None = None,
    alpha: float = 0.4,
    bc: dict[str, Any] | None = None,
    ic: dict[str, Any] | None = None,
    *,
    sovereign: bool = False,
    with_envelope: bool = False,
) -> dict[str, Any]:
    """Solve the 1D heat equation ``u_t = alpha*u_xx`` and emit a receipt.

    Parameters
    ----------
    domain : dict  {"L": float, "T": float, "k_mode": int, "epochs": int, ...}
    alpha  : float thermal diffusivity (the PDE coefficient).
    bc     : dict  boundary conditions (Dirichlet-zero reference; recorded).
    ic     : dict  initial condition selector (sine-mode reference; recorded).
    sovereign : bool   record own-metal sovereign intent in the receipt.
    with_envelope : bool  also return the unsigned DSSE envelope skeleton.

    Returns ``{"field": <summary>, "receipt": <in-toto statement>, ...}``.
    """
    domain = dict(domain or {})
    geometry: dict[str, Any] = {"problem": "heat", "alpha": float(alpha), **domain}
    bcs: dict[str, Any] = {"bc": bc or {}, "ic": ic or {}}
    return _finish(
        geometry, bcs, sovereign=sovereign, with_envelope=with_envelope, field_key="field"
    )


def solve_thermal(
    load_map: dict[str, Any] | None = None,
    *,
    sovereign: bool = False,
    with_envelope: bool = False,
) -> dict[str, Any]:
    """Solve the 2D steady GPU-die thermal field and emit a receipt.

    ``load_map`` describes the MODELED compute-load source:
        {"alpha": float, "T_edge": float,
         "hotspots": [[cx, cy, power, radius], ...], "epochs": int, ...}

    Returns ``{"temperature_field": <summary>, "landauer_floor_MODELED": <W>,
    "joule_accounting": <MODELED>, "receipt": <in-toto statement>, ...}``.

    HONEST: the temperature field and the Landauer floor are MODELED, never
    MEASURED. No free-energy / over-unity. Joules are MEASURED only via the real
    exporter (this layer never asserts a measured joule).
    """
    load_map = dict(load_map or {})
    t_edge = float(load_map.pop("T_edge", 0.0))
    geometry: dict[str, Any] = {"problem": "thermal", **load_map}
    bcs: dict[str, Any] = {"T_edge": t_edge}
    return _finish(
        geometry,
        bcs,
        sovereign=sovereign,
        with_envelope=with_envelope,
        field_key="temperature_field",
    )


def solve(
    geometry: dict[str, Any],
    bcs: dict[str, Any],
    *,
    sovereign: bool = False,
    with_envelope: bool = False,
) -> dict[str, Any]:
    """Substrate-generic solve (mirrors szl_mechanics.service.solve).

    Routes to the heat or thermal core via ``geometry["problem"]`` and returns
    ``{"solution": <summary>, "receipt": <in-toto statement>, ...}`` so the
    substrate forecast/brief layer is identical to szl_mechanics.
    """
    out = _finish(
        geometry, bcs, sovereign=sovereign, with_envelope=with_envelope, field_key="solution"
    )
    return out


def solution_summary(solve_out: dict[str, Any]) -> dict[str, Any]:
    """Compact, endpoint-friendly summary of a solve output."""
    # accept any of the field keys this service emits
    sol = (
        solve_out.get("solution")
        or solve_out.get("field")
        or solve_out.get("temperature_field")
        or {}
    )
    summary = {
        "method": sol.get("method"),
        "pde": sol.get("pde"),
        "alpha": sol.get("alpha"),
        "converged": sol.get("converged"),
        "solution_error_estimate": sol.get("solution_error_estimate"),
        "bounded_error_label": "ESTIMATE",
        "rel_L2_estimate": sol.get("rel_L2_estimate"),
        "walltime_s": sol.get("walltime_s"),
        "verified": sol.get("verified"),
        "modeled_not_measured": sol.get("modeled_not_measured", True),
        "sovereign": sol.get("sovereign"),
        "stub": sol.get("stub"),
        "geometry_hash": sol.get("geometry_hash"),
    }
    if "landauer_floor_MODELED" in solve_out:
        summary["landauer_floor_MODELED"] = solve_out["landauer_floor_MODELED"]
    return summary


__all__ = ["solve_heat", "solve_thermal", "solve", "solution_summary"]
