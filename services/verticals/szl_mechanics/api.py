# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings · Doctrine v11 LOCKED · Λ = Conjecture 1
"""api — FastAPI endpoint sketch for the verified solid-mechanics solver.

Exposes:

    POST /mechanics/solve   body = {"geometry": {...}, "bcs": {...},
                                    "sovereign": false, "with_envelope": false}
            -> {"solution_summary": {...}, "receipt": <in-toto statement>,
                "dsse_envelope": <unsigned, only if with_envelope>}
    GET  /mechanics/healthz

HONESTY: ``bounded_error_estimate`` is returned LABELLED as an ESTIMATE; the
receipt is the honest UNSIGNED in-toto statement (signing happens on the
szl_lake/khipu DSSE path — see receipt.SIGNING_NOTE). Sovereign solves are
own-metal only (the scheduler enforces placement; this layer records intent).

This router is ADDITIVE and import-guarded: if FastAPI is not installed the
module still imports (``router`` is None) so offline substrate validation never
breaks. Mount it from the verticals service app, e.g.:

    from services.verticals.szl_mechanics.api import router as mechanics_router
    app.include_router(mechanics_router)
"""

from __future__ import annotations

from typing import Any

from . import service

try:  # FastAPI is optional for offline substrate validation.
    from fastapi import APIRouter
    from pydantic import BaseModel

    class SolveRequest(BaseModel):
        geometry: dict[str, Any]
        bcs: dict[str, Any]
        sovereign: bool = False
        with_envelope: bool = False

    router = APIRouter(prefix="/mechanics", tags=["verified-compute"])

    @router.get("/healthz")
    def healthz() -> dict[str, Any]:
        return {
            "status": "ok",
            "vertical": "szl_mechanics",
            "capability": "receipt-verified solid-mechanics (FE-NO)",
            "doctrine": "v11: bounded-error is an ESTIMATE; receipts honest/unsigned here.",
        }

    @router.post("/solve")
    def post_solve(req: SolveRequest) -> dict[str, Any]:
        out = service.solve(
            req.geometry,
            req.bcs,
            sovereign=req.sovereign,
            with_envelope=req.with_envelope,
        )
        resp: dict[str, Any] = {
            "solution_summary": service.solution_summary(out),
            "receipt": out["receipt"],  # honest unsigned in-toto statement
        }
        if req.with_envelope and "dsse_envelope" in out:
            resp["dsse_envelope"] = out["dsse_envelope"]
        return resp

except Exception:  # noqa: BLE001 - FastAPI/pydantic absent: keep import-safe
    router = None  # type: ignore


def asgi_app():  # pragma: no cover - convenience for `uvicorn ...:asgi_app`
    """Build a tiny standalone app exposing only the mechanics router."""
    from fastapi import FastAPI

    app = FastAPI(title="SZL Verified Mechanics (FE-NO)", version="0.1.0")
    if router is not None:
        app.include_router(router)
    return app


__all__ = ["router", "asgi_app"]
