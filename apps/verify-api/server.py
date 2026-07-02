# SPDX-License-Identifier: Apache-2.0
# © 2026 Lutar, Stephen P. — SZL Holdings · ORCID 0009-0001-0110-4173
# Doctrine v11 LOCKED 749/14/163 · Λ = Conjecture 1 (NOT a theorem)
"""server — public offline-receipt VERIFY API for a11oy.

Served at https://a-11-oy.com/api/a11oy/v1/verify (standalone systemd unit on
127.0.0.1:8083, fronted by nginx; ADDITIVE — no serve.py edit). CORS is open so
the public site (and anyone) can call it from a browser.

  GET  /api/a11oy/v1/verify            — usage + a LIVE sample verification
  POST /api/a11oy/v1/verify            — verify a receipt you POST (raw JSON, or
                                         {"target":{...},"options":{...}})
  GET  /api/a11oy/v1/verify?url=…       — fetch a public receipt URL and verify it
  GET  /api/a11oy/v1/verify/healthz     — liveness

No trust in this server is required — every check can be re-run yourself with
cosign / rekor-cli / `lake build` (docs/developers/VERIFY.md).
"""
from __future__ import annotations

from typing import Any

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

import verify_engine as ve

app = FastAPI(title="a11oy verify API", version=ve.ENGINE_VERSION)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
    max_age=86400,
)

# A real, public in-toto attestation receipt (governance-receipts branch) used
# only to demonstrate a live verification on the GET landing — NOT a test stub.
_SAMPLE = {
    "doctrine": "v11",
    "kernel_commit": "c7c0ba17",
    "innovation": "HomflyReceipt",
    "predicate_type": "https://szlholdings.com/attestations/innovation/v1",
    "subject": [{"name": "szl-lake/homflyreceipt_gate",
                 "digest": {"sha256": "0a2d153d81c00688b576e5a012ae6117465639807456d1bb72eb590cac3b1e9d"}}],
    "predicate": {"round": 2, "bridge": "knot_theory x audit_chain_integrity",
                  "invariant": "HOMFLY_polynomial",
                  "lean_pr": "https://github.com/szl-holdings/lutar-lean/pull/161"},
}

_USAGE = {
    "service": "a11oy-verify",
    "what": "Public, honest, offline-first verification of a11oy receipts, DSSE "
            "envelopes (incl. Sigstore-keyless), and in-toto attestations.",
    "checks": ["DSSE PAE + signature (Ed25519 / ECDSA / RSA via `cryptography`)",
               "Sigstore certificate SAN + OIDC issuer identity binding",
               "Rekor public transparency-log inclusion lookup",
               "in-toto predicateType + subject digest well-formedness",
               "Lean citation existence in public lutar-lean@main"],
    "honesty": "Unsigned input => STRUCTURAL-ONLY (never 'verified'). Any failed "
               "check => FAILED (loud). Online sources degrade to 'unreachable', "
               "never to a false green. No server trust required.",
    "usage": {
        "POST /api/a11oy/v1/verify": "body = the receipt JSON, or "
            "{'target': <receipt>, 'options': {'identity': <expected SAN>, "
            "'pubkey_pem': <PEM>, 'rekor': true, 'lean': true}}",
        "GET  /api/a11oy/v1/verify?url=<https://…/receipt.json>": "fetch + verify a public receipt",
    },
    "verify_yourself": "https://github.com/szl-holdings/a11oy/blob/main/docs/developers/VERIFY.md",
    "doctrine": ve.DOCTRINE,
}


def _bool(v: Any, default: bool) -> bool:
    if v is None:
        return default
    return str(v).lower() in ("1", "true", "yes", "on")


@app.get("/healthz")
@app.get("/verify/healthz")
def healthz() -> dict:
    return {"status": "ok", "service": "a11oy-verify", "engine_version": ve.ENGINE_VERSION,
            "doctrine": ve.DOCTRINE}


@app.get("/")
@app.get("/verify")
def landing(request: Request) -> JSONResponse:
    url = request.query_params.get("url")
    if url:
        opts = {"identity": request.query_params.get("identity"),
                "rekor": _bool(request.query_params.get("rekor"), True),
                "lean": _bool(request.query_params.get("lean"), True)}
        return JSONResponse(ve.fetch_and_verify(url, **opts))
    return JSONResponse({**_USAGE, "sample_verification": ve.verify(_SAMPLE)})


@app.post("/")
@app.post("/verify")
async def do_verify(request: Request) -> JSONResponse:
    try:
        body = await request.json()
    except Exception:  # noqa: BLE001
        return JSONResponse({"ok": False, "verdict": "ERROR",
                             "detail": "request body is not valid JSON", "checks": []},
                            status_code=400)
    if isinstance(body, dict) and "target" in body and isinstance(body["target"], dict):
        target = body["target"]
        opts = body.get("options") or {}
    else:
        target = body
        opts = {}
    q = request.query_params
    out = ve.verify(
        target,
        pubkey_pem=opts.get("pubkey_pem") or q.get("pubkey_pem"),
        identity=opts.get("identity") or q.get("identity"),
        rekor=_bool(opts.get("rekor", q.get("rekor")), True),
        lean=_bool(opts.get("lean", q.get("lean")), True),
    )
    return JSONResponse(out)
