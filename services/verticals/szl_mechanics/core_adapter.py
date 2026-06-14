# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings · Doctrine v11 LOCKED · Λ = Conjecture 1
"""core_adapter — single seam between the SZL service layer and Dev 1's core.

Dev 1 builds the clean-room FE-NO core in /home/user/workspace/feno_szl/ and,
once done, the files are vendored verbatim under ``_vendor/``:

    szl_feno_core.py        # non-overlapping Schwarz FE-NO solver
    szl_point_deeponet.py   # Point-DeepONet operator surrogate
    szl_feno_validate.py    # validation / bounded-error ESTIMATE

REAL core interface (verified against Dev 1's szl_feno_core.py):

    BarProblem(L, E, A, f, P, split)
    NeuralOperatorSubdomain(prob, m_sensors, p, seed).train(...)
    solve_feno(prob, no_sub, fe_n_elem, max_outer, tol, relax, error_tol)
        -> SchwarzResult{ iterations, converged, interface_residual,
                          no_error_estimate, g_interface, traction_interface,
                          receipt: ProvenanceReceipt{ method, attribution,
                              inputs_hash, geometry, schwarz_iterations,
                              converged, interface_residual, no_error_estimate,
                              error_estimate_is_bound, wall_time_s, verified,
                              doctrine, signature=None } }

This adapter maps the substrate's generic ``solve(geometry, bcs)`` onto that
core and NORMALISES the result so the service/receipt/endpoint layer is
identical for the real and stub paths. It NEVER fabricates a solve result: when
the real core is absent it returns a clearly-labelled STUB (verified=False,
stub=True) so the wiring (registration, receipt, endpoint) is exercisable
offline.

TODO(dev1-core): once /home/user/workspace/feno_szl/dev1_feno_core.md reports
done, copy szl_feno_core.py / szl_point_deeponet.py / szl_feno_validate.py into
``_vendor/`` (clean-room, verbatim). The CORE_AVAILABLE branch below already
matches Dev 1's real interface; vendoring activates it automatically.
"""

from __future__ import annotations

import hashlib
import json
import time
from typing import Any

# Method + attribution constants (single source of truth for the receipt).
# Clean-room: method attribution only — no paper code/text copied.
METHOD = "FE-NO clean-room (non-overlapping Schwarz, Neumann-Dirichlet)"
ATTRIBUTION = {
    "feno_method": (
        "arXiv:2606.08796 — Wang, Gupta, Ruan, Goswami, 'A Non-Overlapping "
        "Schwarz Hybrid Finite Element-Neural Operator Framework for Solid "
        "Mechanics on Irregular Domains' (2026), CC BY 4.0 "
        "(method attribution only; clean-room, no code/text copied)"
    ),
    "deeponet": (
        "Lu, Jin, Pang, Zhang, Karniadakis (2021), 'Learning nonlinear operators "
        "via DeepONet', Nature Machine Intelligence 3:218-229, "
        "doi:10.1038/s42256-021-00302-5"
    ),
}

CORE_AVAILABLE = False
_CORE = None
try:  # pragma: no cover - import is environment-dependent (real core + numpy)
    from ._vendor import szl_feno_core as _CORE  # type: ignore

    CORE_AVAILABLE = True
except Exception:  # noqa: BLE001 - honest degrade to documented STUB
    CORE_AVAILABLE = False
    _CORE = None


def geometry_hash(geometry: dict[str, Any]) -> str:
    """Deterministic sha256 over the canonical geometry JSON."""
    canon = json.dumps(geometry, sort_keys=True, separators=(",", ":"), default=str)
    return hashlib.sha256(canon.encode()).hexdigest()


def _geometry_to_barproblem(geometry: dict[str, Any], bcs: dict[str, Any]):  # pragma: no cover
    """Map a generic geometry/bcs dict onto Dev 1's BarProblem.

    Falls back to BarProblem defaults for any field the caller omits. This is the
    1-D bar reference problem Dev 1 implemented; richer geometries are future
    work tracked against the core.
    """
    BarProblem = _CORE.BarProblem
    return BarProblem(
        L=float(geometry.get("L", 1.0)),
        E=float(geometry.get("material", {}).get("E", geometry.get("E", 1.0))),
        A=float(geometry.get("A", 1.0)),
        f=float(bcs.get("body_force", bcs.get("f", 1.0))),
        P=float(bcs.get("tip_traction", bcs.get("P", 0.5))),
        split=float(geometry.get("split", 0.5)),
    )


def solve_core(
    geometry: dict[str, Any],
    bcs: dict[str, Any],
    *,
    sovereign: bool = False,
) -> dict[str, Any]:
    """Run the real core if vendored, else return an HONEST stub.

    The return shape is normalised to a stable dict so the service/receipt layer
    is identical for stub and real paths.
    """
    ghash = geometry_hash(geometry)

    if CORE_AVAILABLE and _CORE is not None:  # pragma: no cover - needs vendored core
        prob = _geometry_to_barproblem(geometry, bcs)
        no_sub = _CORE.NeuralOperatorSubdomain(
            prob,
            m_sensors=int(geometry.get("no_sensors", 8)),
            p=int(geometry.get("no_p", 40)),
            seed=int(geometry.get("seed", 3)),
        )
        no_sub.train(
            epochs=int(geometry.get("train_epochs", 3000)),
            lr=float(geometry.get("train_lr", 2e-3)),
        )
        res = _CORE.solve_feno(
            prob,
            no_sub,
            fe_n_elem=int(geometry.get("fe_n_elem", 20)),
            max_outer=int(geometry.get("max_outer", 50)),
            tol=float(geometry.get("tol", 1e-8)),
            relax=float(geometry.get("relax", 1.0)),
            error_tol=float(geometry.get("error_tol", 5e-2)),
        )
        rcpt = res.receipt
        return {
            "method": rcpt.method,
            "displacement": {
                "g_interface": res.g_interface,
                "traction_interface": res.traction_interface,
                "fe_nodes": list(map(float, res.fe_nodes)),
                "u_fe_nodes": list(map(float, res.u_fe_nodes)),
            },
            "schwarz_iterations": int(rcpt.schwarz_iterations),
            "bounded_error_estimate": float(rcpt.no_error_estimate),
            "error_estimate_is_bound": bool(rcpt.error_estimate_is_bound),
            "interface_residual": float(rcpt.interface_residual),
            "converged": bool(rcpt.converged),
            "walltime_s": float(rcpt.wall_time_s),
            "verified": bool(rcpt.verified),
            "geometry_hash": ghash,
            "inputs_hash": rcpt.inputs_hash,
            "core_geometry": rcpt.geometry,
            "core_attribution": rcpt.attribution,
            "stub": False,
        }

    # ---- HONEST STUB (real core not yet vendored) -------------------------
    # Deterministic, clearly-labelled placeholder. verified=False ALWAYS.
    t0 = time.time()
    n_dofs = int(geometry.get("n_dofs", len(json.dumps(geometry))))
    return {
        "method": METHOD,
        "displacement": {
            "summary": "STUB — real core not vendored; no physics computed",
            "n_dofs": n_dofs,
        },
        "schwarz_iterations": 0,            # stub does not iterate
        "bounded_error_estimate": float("nan"),  # NaN = no estimate (never faked)
        "error_estimate_is_bound": False,
        "interface_residual": float("nan"),
        "converged": False,
        "walltime_s": float(time.time() - t0),
        "verified": False,
        "geometry_hash": ghash,
        "stub": True,
    }


__all__ = [
    "METHOD",
    "ATTRIBUTION",
    "CORE_AVAILABLE",
    "geometry_hash",
    "solve_core",
]
