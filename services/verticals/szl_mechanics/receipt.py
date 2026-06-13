# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings · Doctrine v11 LOCKED · Λ = Conjecture 1 (advisory, NOT proven trust)
"""receipt — DSSE-style in-toto provenance statement for every FE-NO solve.

THE VERIFIED-SCIENTIFIC-COMPUTE MOAT. Each solve emits an in-toto Statement v1
whose predicate captures *how* the physics was computed and a BOUNDED-ERROR
ESTIMATE. The statement is content-addressed by the geometry hash.

Schema is the SAME one the a11oy verify-api / szl_lake DSSE path already speaks
(see apps/verify-api/server.py and selftest_crypto.py):

    statement = {
      "_type": "https://in-toto.io/Statement/v1",
      "predicateType": "https://szlholdings.com/attestations/scientific-compute/v1",
      "subject": [{"name": <geometry-id>, "digest": {"sha256": <geometry_hash>}}],
      "predicate": {method, geometry_hash, schwarz_iterations,
                    bounded_error_estimate(+label), walltime_s, verified,
                    sovereign, attribution{...}},
    }

DSSE envelope (when signed on the khipu/szl_lake path):

    {"payloadType": "application/vnd.in-toto+json",
     "payload": b64(canonical statement),
     "signatures": [{"sig": b64(Ed25519 over PAE(payloadType, payload))}]}

HONESTY (Doctrine v11): we DO NOT fabricate a signature. ``build_statement``
returns the honest UNSIGNED in-toto statement plus a ``_signing`` note telling
the operator exactly where signing happens. ``build_dsse_envelope`` produces the
unsigned envelope skeleton (signatures=[]) so the szl_lake signer can drop the
Ed25519 signature in without reshaping. At the verify-api an unsigned statement
is STRUCTURAL-ONLY — never a false green. Khipu BFT consensus is Conjecture 2;
SLSA posture is L1 (honest). joules are MEASURED-only and are NOT asserted here.
"""

from __future__ import annotations

import base64
import json
from typing import Any

from . import core_adapter

STATEMENT_TYPE = "https://in-toto.io/Statement/v1"
PREDICATE_TYPE = "https://szlholdings.com/attestations/scientific-compute/v1"
PAYLOAD_TYPE = "application/vnd.in-toto+json"

# WHERE signing happens — honest pointer, no fabricated signature.
SIGNING_NOTE = {
    "status": "UNSIGNED",
    "honesty": (
        "Doctrine v11: no signature is fabricated. This is an honest unsigned "
        "in-toto statement. At a11oy verify-api an unsigned statement is "
        "STRUCTURAL-ONLY and never reports a false 'verified/green'."
    ),
    "signed_by": "szl_lake / khipu-consensus DSSE signer (Ed25519)",
    "signing_path": (
        "canonicalise statement -> PAE(payloadType, payload) -> Ed25519 sign on "
        "the szl_lake signer -> append to DSSE envelope signatures[] -> append "
        "receipt to the khipu append-only chain (packages/formula-os khipu.py)"
    ),
    "verify_path": "POST https://a11oy.net/api/a11oy/v1/verify  (DSSE PAE + Ed25519)",
    "consensus": "Khipu BFT = Conjecture 2 (advisory); SLSA L1 (honest).",
}


def _canon_bytes(obj: Any) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), default=str).encode()


def _b64(b: bytes) -> str:
    return base64.b64encode(b).decode()


def pae(payload_type: str, payload: bytes) -> bytes:
    """DSSE Pre-Authentication Encoding (matches apps/verify-api/verify_engine)."""
    return b"DSSEv1 %d %b %d %b" % (
        len(payload_type),
        payload_type.encode(),
        len(payload),
        payload,
    )


def build_statement(solve_result: dict[str, Any], *, sovereign: bool = False) -> dict[str, Any]:
    """Build the honest in-toto provenance Statement for one solve result.

    ``solve_result`` is the normalised dict from ``core_adapter.solve_core``.
    """
    ghash = solve_result["geometry_hash"]
    err = solve_result.get("bounded_error_estimate")
    # NaN -> None so JSON is valid and the absence is explicit (no fake number).
    err_value = None if (err is None or err != err) else float(err)

    resid = solve_result.get("interface_residual")
    resid_value = None if (resid is None or resid != resid) else float(resid)

    predicate: dict[str, Any] = {
        "method": solve_result.get("method", core_adapter.METHOD),
        "geometry_hash": ghash,
        # inputs_hash links the receipt to the exact problem+solver settings.
        "inputs_hash": solve_result.get("inputs_hash"),
        "schwarz_iterations": int(solve_result.get("schwarz_iterations", 0)),
        "converged": bool(solve_result.get("converged", False)),
        # interface residual vs tolerance ε (paper Eq. 27 termination criterion).
        "interface_residual": resid_value,
        "bounded_error_estimate": err_value,
        "bounded_error_label": "ESTIMATE",  # never a proven bound
        "error_estimate_is_bound": bool(solve_result.get("error_estimate_is_bound", False)),
        "bounded_error_note": (
            "Relative-L2 NO-subdomain ESTIMATE, BOUNDED across tested horizons "
            "(NOT 'guaranteed bounded', NOT a machine-checked proof). "
            "Λ = Conjecture 1 (advisory). A-priori FE-NO Schwarz convergence is OPEN."
        ),
        "walltime_s": float(solve_result.get("walltime_s", 0.0)),
        "verified": bool(solve_result.get("verified", False)),
        "verified_note": (
            "verified = (Schwarz converged) AND (bounded-error ESTIMATE <= tol). "
            "This is a RUNTIME termination check, NOT a cryptographic attestation "
            "and NOT one of the locked-proven=8 results."
        ),
        "sovereign": bool(sovereign),
        "stub": bool(solve_result.get("stub", False)),
        "attribution": core_adapter.ATTRIBUTION,
        "doctrine": "v11 LOCKED; Λ=Conjecture 1; Khipu BFT=Conjecture 2; SLSA L1; "
        "joules MEASURED-only; sovereign own-metal-only; no free-energy.",
    }

    return {
        "_type": STATEMENT_TYPE,
        "predicateType": PREDICATE_TYPE,
        "subject": [{"name": f"szl-mechanics/solve/{ghash[:12]}", "digest": {"sha256": ghash}}],
        "predicate": predicate,
        "_signing": SIGNING_NOTE,
    }


def build_dsse_envelope(statement: dict[str, Any]) -> dict[str, Any]:
    """Unsigned DSSE envelope skeleton ready for the szl_lake Ed25519 signer.

    ``signatures`` is EMPTY by design: this layer never invents a signature.
    The signer on the khipu/szl_lake path computes Ed25519 over ``pae(...)``
    and appends ``{"keyid": ..., "sig": b64(sig)}``.
    """
    # Statement carried in the envelope must NOT include the local-only _signing
    # note (that note is operator guidance, not part of the signed payload).
    signed_stmt = {k: v for k, v in statement.items() if k != "_signing"}
    payload = _canon_bytes(signed_stmt)
    return {
        "payloadType": PAYLOAD_TYPE,
        "payload": _b64(payload),
        "signatures": [],  # filled by szl_lake signer; UNSIGNED here (honest)
        "_pae_preview_len": len(pae(PAYLOAD_TYPE, payload)),
        "_signing": SIGNING_NOTE,
    }


__all__ = [
    "STATEMENT_TYPE",
    "PREDICATE_TYPE",
    "PAYLOAD_TYPE",
    "SIGNING_NOTE",
    "pae",
    "build_statement",
    "build_dsse_envelope",
]
