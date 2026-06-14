# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings · Doctrine v11 LOCKED · Λ = Conjecture 1
# Sign-off: Stephen P. Lutar Jr. <stephenlutar2@gmail.com>
"""api — FastAPI endpoint sketch for the receipt-verified SZL PINN solver.

SIBLING of services/verticals/szl_mechanics/api.py. Exposes:

    POST /pinn/solve-heat  body = {"domain": {...}, "alpha": 0.4, "bc": {...},
                                   "ic": {...}, "sovereign": false,
                                   "with_envelope": false}
            -> {"field": {...}, "receipt": <in-toto statement>,
                "dsse_envelope": <unsigned, only if with_envelope>}

    POST /pinn/thermal     body = {"load_map": {...}, "sovereign": false,
                                   "with_envelope": false}
            -> {"temperature_field": {...}, "landauer_floor_MODELED": <W, MODELED>,
                "joule_accounting": <MODELED>, "receipt": <in-toto statement>, ...}

    GET  /pinn/healthz

HONESTY (Doctrine v11): ``solution_error_estimate`` is returned LABELLED as an
ESTIMATE; the receipt is the honest UNSIGNED in-toto statement (signing happens on
the szl_lake/khipu DSSE path — see receipt.SIGNING_NOTE). The PINN MODELS heat —
it does NOT create or measure energy. The Landauer floor is MODELED, not measured.
No free-energy / over-unity. Sovereign solves are own-metal only (the scheduler
enforces placement; this layer records intent).

This router is ADDITIVE and import-guarded: if FastAPI is not installed the module
still imports (``router`` is None) so offline substrate validation never breaks.
Mount it from the verticals service app, e.g.:

    from services.verticals.szl_pinn.api import router as pinn_router
    app.include_router(pinn_router)
"""
from __future__ import annotations

from typing import Any

from . import service

try:  # FastAPI is optional for offline substrate validation.
    from fastapi import APIRouter
    from pydantic import BaseModel

    class SolveHeatRequest(BaseModel):
        domain: dict[str, Any] = {}
        alpha: float = 0.4
        bc: dict[str, Any] = {}
        ic: dict[str, Any] = {}
        sovereign: bool = False
        with_envelope: bool = False

    class ThermalRequest(BaseModel):
        load_map: dict[str, Any] = {}
        sovereign: bool = False
        with_envelope: bool = False

    router = APIRouter(prefix="/pinn", tags=["verified-compute"])

    @router.get("/healthz")
    def healthz() -> dict[str, Any]:
        return {
            "status": "ok",
            "vertical": "szl_pinn",
            "capability": "receipt-verified physics-informed NN (heat / GPU-die thermal)",
            "core_available": service.core_adapter.CORE_AVAILABLE,
            "honesty": (
                "PINN MODELS heat — does NOT create/measure energy. Landauer floor "
                "is MODELED. Joules MEASURED-only via real exporter. No free-energy."
            ),
            "doctrine": "v11: bounded-error is an ESTIMATE; receipts honest/unsigned here.",
        }

    @router.post("/solve-heat")
    def post_solve_heat(req: SolveHeatRequest) -> dict[str, Any]:
        out = service.solve_heat(
            req.domain,
            req.alpha,
            req.bc,
            req.ic,
            sovereign=req.sovereign,
            with_envelope=req.with_envelope,
        )
        resp: dict[str, Any] = {
            "field": service.solution_summary(out),
            "receipt": out["receipt"],  # honest unsigned in-toto statement
        }
        if req.with_envelope and "dsse_envelope" in out:
            resp["dsse_envelope"] = out["dsse_envelope"]
        return resp

    @router.post("/thermal")
    def post_thermal(req: ThermalRequest) -> dict[str, Any]:
        out = service.solve_thermal(
            req.load_map,
            sovereign=req.sovereign,
            with_envelope=req.with_envelope,
        )
        resp: dict[str, Any] = {
            "temperature_field": service.solution_summary(out),
            # MODELED — NOT MEASURED (labelled at every layer).
            "landauer_floor_MODELED": out.get("landauer_floor_MODELED"),
            "joule_accounting": out.get("joule_accounting"),
            "receipt": out["receipt"],
        }
        if req.with_envelope and "dsse_envelope" in out:
            resp["dsse_envelope"] = out["dsse_envelope"]
        return resp

except Exception:  # noqa: BLE001 - FastAPI/pydantic absent: keep import-safe
    router = None  # type: ignore


def asgi_app():  # pragma: no cover - convenience for `uvicorn ...:asgi_app`
    """Build a tiny standalone app exposing only the PINN router."""
    from fastapi import FastAPI

    app = FastAPI(title="SZL Verified PINN (heat / thermal)", version="0.1.0")
    if router is not None:
        app.include_router(router)
    return app


__all__ = ["router", "asgi_app"]
