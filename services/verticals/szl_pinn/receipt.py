# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings · Doctrine v11 LOCKED · Λ = Conjecture 1 (advisory, NOT proven trust)
# Sign-off: Stephen P. Lutar Jr. <stephenlutar2@gmail.com>
"""receipt — DSSE-style in-toto provenance statement for every PINN solve.

SIBLING of services/verticals/szl_mechanics/receipt.py. Identical schema, signing
posture, and helper functions (``pae``, ``build_statement``, ``build_dsse_envelope``)
so the SZL PINN capability shares the FE-NO operator solver's
VERIFIED-SCIENTIFIC-COMPUTE MOAT contract. Each solve emits an in-toto Statement
v1 whose predicate captures *how* the physics was computed and a BOUNDED-ERROR
ESTIMATE. The statement is content-addressed by the inputs hash.

    statement = {
      "_type": "https://in-toto.io/Statement/v1",
      "predicateType": "https://szlholdings.com/attestations/scientific-compute/v1",
      "subject": [{"name": <solve-id>, "digest": {"sha256": <inputs_hash>}}],
      "predicate": {method, pde, alpha, epochs, converged, physics_residual_loss,
                    bc_loss, ic_loss, solution_error_estimate(+label),
                    rel_L2_estimate, walltime_s, verified, modeled_not_measured,
                    landauer_floor_MODELED (thermal), joule_accounting (thermal),
                    sovereign, attribution{...}, doctrine},
    }

DSSE envelope (when signed on the khipu/szl_lake path):

    {"payloadType": "application/vnd.in-toto+json",
     "payload": b64(canonical statement),
     "signatures": [{"sig": b64(Ed25519 over PAE(payloadType, payload))}]}

HONESTY (Doctrine v11): we DO NOT fabricate a signature. ``build_statement``
returns the honest UNSIGNED in-toto statement plus a ``_signing`` note telling the
operator exactly where signing happens. ``build_dsse_envelope`` produces the
unsigned envelope skeleton (signatures=[]) so the szl_lake signer can drop the
Ed25519 signature in without reshaping. At the verify-api an unsigned statement is
STRUCTURAL-ONLY — never a false green. Khipu BFT consensus is Conjecture 2; SLSA
posture is L1 (honest). The PINN temperature/joule field is MODELED — joules are
MEASURED-only via the real exporter and are NEVER asserted here.
"""
from __future__ import annotations

import base64
import json
from typing import Any

from . import core_adapter

STATEMENT_TYPE = "https://in-toto.io/Statement/v1"
PREDICATE_TYPE = "https://szlholdings.com/attestations/scientific-compute/v1"
PAYLOAD_TYPE = "application/vnd.in-toto+json"

# WHERE signing happens — honest pointer, no fabricated signature. Mirrors the
# szl_mechanics SIGNING_NOTE verbatim so the verify path is identical.
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


def _nan_to_none(x: Any) -> Any:
    """NaN -> None so JSON is valid and absence is explicit (no fake number)."""
    if x is None:
        return None
    try:
        return None if x != x else float(x)
    except TypeError:
        return x


def build_statement(solve_result: dict[str, Any], *, sovereign: bool = False) -> dict[str, Any]:
    """Build the honest in-toto provenance Statement for one PINN solve result.

    ``solve_result`` is the normalised dict from ``core_adapter.solve_core``.
    """
    ihash = solve_result.get("inputs_hash") or "sha256:UNKNOWN"
    # strip the "sha256:" prefix for the digest field if present
    digest = ihash.split(":", 1)[1] if ":" in ihash else ihash

    is_thermal = solve_result.get("problem") == "thermal"

    predicate: dict[str, Any] = {
        "method": solve_result.get("method", core_adapter.METHOD),
        "pde": solve_result.get("pde"),
        "alpha": solve_result.get("alpha"),
        "inputs_hash": ihash,
        "geometry_hash": solve_result.get("geometry_hash"),
        "epochs": int(solve_result.get("epochs", 0)),
        "converged": bool(solve_result.get("converged", False)),
        "physics_residual_loss": _nan_to_none(solve_result.get("physics_residual_loss")),
        "bc_loss": _nan_to_none(solve_result.get("bc_loss")),
        "ic_loss": _nan_to_none(solve_result.get("ic_loss")),
        "solution_error_estimate": _nan_to_none(solve_result.get("solution_error_estimate")),
        # heat solves carry an analytic rel-L2 estimate; surface it explicitly.
        "rel_L2_estimate": _nan_to_none(solve_result.get("rel_L2_estimate")),
        "bounded_error_label": "ESTIMATE",  # never a proven bound
        "error_estimate_is_bound": bool(solve_result.get("error_estimate_is_bound", False)),
        "error_estimate_scope": solve_result.get("error_estimate_scope"),
        "bounded_error_note": (
            "Relative-L2 (heat, vs closed-form) or relative-residual (thermal, "
            "no closed form) solution ESTIMATE, BOUNDED across tested inputs "
            "(NOT 'guaranteed bounded', NOT a machine-checked proof). "
            "Λ = Conjecture 1 (advisory). A-priori PINN convergence is OPEN."
        ),
        "walltime_s": float(solve_result.get("walltime_s", 0.0)),
        "verified": bool(solve_result.get("verified", False)),
        "verified_note": (
            "verified = (training converged) AND (bounded-error ESTIMATE <= tol). "
            "This is a RUNTIME termination check, NOT a cryptographic attestation "
            "and NOT one of the locked-proven=8 results."
        ),
        # ALWAYS True for PINN output — this is the load-bearing honesty boundary.
        "modeled_not_measured": bool(solve_result.get("modeled_not_measured", True)),
        "modeled_note": (
            "The PINN output is a MODELED physical field. It is NOT measured "
            "energy. Joules are MEASURED only via SZL's real power exporter; this "
            "receipt never asserts a measured joule. No free-energy / over-unity / "
            "perpetual motion; energy harvest = WASTED/stranded heat only."
        ),
        "sovereign": bool(sovereign),
        "stub": bool(solve_result.get("stub", False)),
        "attribution": solve_result.get("attribution", core_adapter.ATTRIBUTION),
        "doctrine": solve_result.get("doctrine")
        or (
            "v11 LOCKED; Λ=Conjecture 1; locked-proven=8; Khipu BFT=Conjecture 2; "
            "SLSA L1; joules MEASURED-only (PINN output is MODELED); sovereign "
            "own-metal; no free-energy."
        ),
    }

    # Thermal solves additionally carry the MODELED Landauer joule accounting.
    if is_thermal:
        predicate["landauer_floor_MODELED"] = _nan_to_none(
            solve_result.get("landauer_floor_MODELED")
        )
        predicate["joule_accounting"] = solve_result.get("joule_accounting")
        predicate["joule_accounting_label"] = "MODELED — NOT MEASURED"
        predicate["rel_residual"] = _nan_to_none(solve_result.get("rel_residual"))

    return {
        "_type": STATEMENT_TYPE,
        "predicateType": PREDICATE_TYPE,
        "subject": [{"name": f"szl-pinn/solve/{digest[:12]}", "digest": {"sha256": digest}}],
        "predicate": predicate,
        "_signing": SIGNING_NOTE,
    }


def build_dsse_envelope(statement: dict[str, Any]) -> dict[str, Any]:
    """Unsigned DSSE envelope skeleton ready for the szl_lake Ed25519 signer.

    ``signatures`` is EMPTY by design: this layer never invents a signature.
    The signer on the khipu/szl_lake path computes Ed25519 over ``pae(...)`` and
    appends ``{"keyid": ..., "sig": b64(sig)}``.
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
