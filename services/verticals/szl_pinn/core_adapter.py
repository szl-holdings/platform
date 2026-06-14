# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings · Doctrine v11 LOCKED · Λ = Conjecture 1
# Sign-off: Stephen P. Lutar Jr. <stephenlutar2@gmail.com>
"""core_adapter — single seam between the SZL service layer and the PINN core.

SIBLING of services/verticals/szl_mechanics/core_adapter.py. Maps the substrate's
generic solve calls onto the clean-room SZL PINN core (vendored verbatim under
``_vendor/``) and NORMALISES the result so the service/receipt/endpoint layer is
identical for the real and stub paths. It NEVER fabricates a solve result: when
the core (or numpy) is absent it returns a clearly-labelled STUB (verified=False,
stub=True) so the wiring (registration, receipt, endpoint) is exercisable offline.

REAL core interface (verified against the vendored szl_pinn_core / szl_pinn_thermal):

    HeatProblem(alpha, L, T, k_mode)
    solve_heat_pinn(prob, *, epochs, lr, seed, ...)
        -> PINNSolveResult{ net, history, converged, rel_l2_error,
                            receipt: ProvenanceReceipt{ method, attribution,
                                inputs_hash, pde, alpha, geometry, epochs,
                                converged, physics_residual_loss, bc_loss, ic_loss,
                                solution_error_estimate, error_estimate_is_bound,
                                error_estimate_scope, wall_time_s, verified,
                                modeled_not_measured, doctrine, signature=None } }
    ChipThermalProblem(alpha, T_edge, hotspots)
    solve_chip_thermal(prob, *, epochs, lr, seed, ...)
        -> ThermalSolveResult{ ..., rel_residual, joule_accounting (MODELED),
                               receipt: ProvenanceReceipt{...} }

ATTRIBUTION (cite-never-plagiarize — clean-room, NO paper/library code/text copied):
  * PINN method: Raissi, Perdikaris & Karniadakis (2019), "Physics-informed
    neural networks", J. Comput. Phys. 378:686-707, doi:10.1016/j.jcp.2018.10.045.
  * DeepXDE (LGPL-2.1) = METHOD-ONLY, never vendored.
  * NVIDIA Modulus / PhysicsNeMo (Apache-2.0) & neurodiffeq (MIT) = prior art,
    acknowledged, NOT copied.

HONESTY (Doctrine v11): the PINN output is a MODELED physical field. It is NOT
measured energy. Joules are MEASURED only via SZL's real power exporter. No
free-energy / over-unity. ``modeled_not_measured`` is ALWAYS True for PINN solves.
"""
from __future__ import annotations

import hashlib
import json
import time
from typing import Any

# Method + attribution constants (single source of truth for the receipt).
METHOD = "szl_pinn clean-room (physics-informed NN, PDE-residual loss)"
ATTRIBUTION = {
    "pinn_method": (
        "Raissi, Perdikaris, Karniadakis (2019), 'Physics-informed neural "
        "networks: a deep learning framework for forward and inverse problems "
        "involving nonlinear PDEs', J. Comput. Phys. 378:686-707, "
        "doi:10.1016/j.jcp.2018.10.045 (method attribution only; clean-room)"
    ),
    "prior_art_not_copied": (
        "NVIDIA Modulus/PhysicsNeMo (Apache-2.0) and neurodiffeq (MIT) are "
        "acknowledged PRIOR ART; no library source code consulted or reused. "
        "DeepXDE (LGPL-2.1) is METHOD-ONLY and is NOT vendored."
    ),
    "implementation": (
        "clean-room pure-numpy: AnalyticMLP with EXACT closed-form forward-mode "
        "derivatives (u_x, u_xx, u_t) and a hand-derived reverse-over-forward "
        "parameter gradient (gradient-checked vs complex-step). No torch/JAX."
    ),
    "license_note": "standard public science; method only, no source incorporation.",
}

CORE_AVAILABLE = False
_CORE = None
_THERMAL = None
try:  # pragma: no cover - environment-dependent (real core + numpy)
    from ._vendor import szl_pinn_core as _CORE  # type: ignore
    from ._vendor import szl_pinn_thermal as _THERMAL  # type: ignore

    CORE_AVAILABLE = True
except Exception:  # noqa: BLE001 - honest degrade to documented STUB
    CORE_AVAILABLE = False
    _CORE = None
    _THERMAL = None


def geometry_hash(geometry: dict[str, Any]) -> str:
    """Deterministic sha256 over the canonical geometry JSON."""
    canon = json.dumps(geometry, sort_keys=True, separators=(",", ":"), default=str)
    return hashlib.sha256(canon.encode()).hexdigest()


def solve_core(
    geometry: dict[str, Any],
    bcs: dict[str, Any],
    *,
    sovereign: bool = False,
) -> dict[str, Any]:
    """Run the real PINN core if vendored+importable, else return an HONEST stub.

    ``geometry["problem"]`` selects ``"heat"`` (1D transient u_t=alpha*u_xx) or
    ``"thermal"`` (2D steady GPU-die field + MODELED Landauer floor). The return
    shape is normalised to a stable dict so the service/receipt layer is identical
    for the real and stub paths (mirrors szl_mechanics.solve_core).
    """
    ghash = geometry_hash(geometry)
    kind = geometry.get("problem", "heat")

    if CORE_AVAILABLE and _CORE is not None:  # pragma: no cover - needs core+numpy
        if kind == "thermal":
            default_hotspots = _THERMAL.ChipThermalProblem().hotspots
            prob = _THERMAL.ChipThermalProblem(
                alpha=float(geometry.get("alpha", 1.0)),
                T_edge=float(bcs.get("T_edge", 0.0)),
                hotspots=tuple(
                    tuple(h) for h in geometry.get("hotspots", default_hotspots)
                ),
            )
            res = _THERMAL.solve_chip_thermal(
                prob,
                epochs=int(geometry.get("epochs", 4000)),
                lr=float(geometry.get("lr", 4e-3)),
                seed=int(geometry.get("seed", 0)),
            )
            return _normalise(
                res.receipt,
                ghash,
                extra={
                    "problem": "thermal",
                    "rel_residual": float(res.rel_residual),
                    "joule_accounting": res.joule_accounting,  # MODELED, labelled
                    "landauer_floor_MODELED": res.joule_accounting.get(
                        "modeled_landauer_floor_W"
                    ),
                },
            )

        prob = _CORE.HeatProblem(
            alpha=float(geometry.get("alpha", 0.4)),
            L=float(geometry.get("L", 1.0)),
            T=float(geometry.get("T", 1.0)),
            k_mode=int(geometry.get("k_mode", 1)),
        )
        res = _CORE.solve_heat_pinn(
            prob,
            epochs=int(geometry.get("epochs", 2000)),
            lr=float(geometry.get("lr", 5e-3)),
            seed=int(geometry.get("seed", 0)),
        )
        return _normalise(
            res.receipt,
            ghash,
            extra={"problem": "heat", "rel_L2_estimate": float(res.rel_l2_error)},
        )

    # ---- HONEST STUB (real core not importable; e.g. numpy absent) -------- #
    # Deterministic, clearly-labelled placeholder. verified=False ALWAYS.
    t0 = time.time()
    return {
        "method": METHOD,
        "problem": kind,
        "pde": ("u_t = alpha*u_xx" if kind == "heat" else "alpha*(T_xx+T_yy)+s(x,y)=0"),
        "alpha": float(geometry.get("alpha", 0.4 if kind == "heat" else 1.0)),
        "field": {"summary": "STUB — real core not importable; no physics computed"},
        "epochs": 0,
        "converged": False,
        "physics_residual_loss": float("nan"),  # NaN = no estimate (never faked)
        "bc_loss": None,
        "ic_loss": None,
        "solution_error_estimate": float("nan"),
        "error_estimate_is_bound": False,
        "error_estimate_scope": None,
        "walltime_s": float(time.time() - t0),
        "verified": False,
        "modeled_not_measured": True,
        "geometry_hash": ghash,
        "inputs_hash": "sha256:STUB",
        "attribution": ATTRIBUTION,
        "doctrine": (
            "v11 LOCKED; Lambda=Conjecture 1; locked-proven=8; Khipu BFT=Conjecture 2; "
            "SLSA L1; joules MEASURED-only (PINN=MODELED); sovereign own-metal; no free-energy."
        ),
        "stub": True,
    }


def _normalise(receipt: Any, ghash: str, extra: dict[str, Any] | None = None) -> dict[str, Any]:
    """Normalise a core ProvenanceReceipt into the stable service dict shape.

    Passes through EVERY field the receipt builder reads so no information is
    silently dropped (epochs, bc/ic loss, error_estimate_scope, doctrine, ...).
    """
    rc = receipt
    out: dict[str, Any] = {
        "method": rc.method,
        "pde": rc.pde,
        "alpha": rc.alpha,
        "epochs": int(getattr(rc, "epochs", 0)),
        "converged": bool(rc.converged),
        "physics_residual_loss": float(rc.physics_residual_loss),
        "bc_loss": (None if getattr(rc, "bc_loss", None) is None else float(rc.bc_loss)),
        "ic_loss": (None if getattr(rc, "ic_loss", None) is None else float(rc.ic_loss)),
        "solution_error_estimate": float(rc.solution_error_estimate),
        "error_estimate_is_bound": bool(rc.error_estimate_is_bound),
        "error_estimate_scope": getattr(rc, "error_estimate_scope", None),
        "walltime_s": float(rc.wall_time_s),
        "verified": bool(rc.verified),
        "modeled_not_measured": bool(rc.modeled_not_measured),
        "geometry_hash": ghash,
        "inputs_hash": rc.inputs_hash,
        "core_geometry": rc.geometry,
        "core_attribution": rc.attribution,
        "attribution": rc.attribution,
        "doctrine": getattr(rc, "doctrine", None),
        "stub": False,
    }
    if extra:
        out.update(extra)
    return out


__all__ = ["METHOD", "ATTRIBUTION", "CORE_AVAILABLE", "geometry_hash", "solve_core"]
