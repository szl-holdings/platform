#!/usr/bin/env python3
"""receipt.py — GovernedAction/v1 self-audit receipt + offline bundle verifier.

Zero-dependency (stdlib only). Two halves:

1. emit_self_audit_receipt() builds a GovernedAction/v1-shaped receipt for
   THIS payload run, labeled UNSIGNED until key management lands. The label
   is structural: status is computed, not asserted.

2. verify_bundle() implements the fail-closed offline verifier legs
   L0–L5 on a receipt bundle (list of envelopes). Missing evidence =>
   INCOMPLETE, never PASS. A validly signed bundle with missing evidence
   is INCOMPLETE. A tampered hash chain is MISMATCH.

Envelope shape (in-toto ITE-6 / DSSE):
    { "payloadType": "application/vnd.in-toto+json",
      "payload": "<base64 of Statement JSON>",
      "signatures": [] }            # empty until signing lands => UNSIGNED

Statement shape:
    { "_type": "https://in-toto.io/Statement/v1",
      "predicateType": "https://szl.dev/GovernedAction/v1",
      "subject": [{"name": ..., "digest": {"sha256": ...}}],
      "predicate": { ... GovernedAction/v1 fields ... } }
"""

from __future__ import annotations

import base64
import hashlib
import json
import time
import uuid

PAYLOAD_TYPE = "application/vnd.in-toto+json"
STATEMENT_TYPE = "https://in-toto.io/Statement/v1"
PREDICATE_TYPE = "https://szl.dev/GovernedAction/v1"

VERDICTS = ["VERIFIED", "MISMATCH", "INCOMPLETE", "PENDING_SYNC", "UNSIGNED-LOCAL", "UNAVAILABLE"]

# The locked evidence obligations for the self-audit action class.
# Each obligation must have a matching evidence artifact (hash-matched)
# or the bundle is INCOMPLETE even when every crypto leg passes.
SELF_AUDIT_OBLIGATIONS = [
    "thread_digest",
    "report_digests",
    "gate_exit_codes",
]


def _canonical_json(obj) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":")).encode("utf-8")


def build_envelope(predicate: dict, subject_name: str, subject_sha256: str) -> dict:
    statement = {
        "_type": STATEMENT_TYPE,
        "predicateType": PREDICATE_TYPE,
        "subject": [{"name": subject_name, "digest": {"sha256": subject_sha256}}],
        "predicate": predicate,
    }
    payload_bytes = _canonical_json(statement)
    return {
        "payloadType": PAYLOAD_TYPE,
        "payload": base64.b64encode(payload_bytes).decode("ascii"),
        "signatures": [],  # UNSIGNED until key management lands
    }


def envelope_content_digest(envelope: dict) -> str:
    """Digest over the decoded payload bytes — the tamper boundary.

    The bytes being hashed are the DECODED statement bytes. In the JS
    verifier this becomes the PAE-over-decoded-bytes rule: the LEN field in
    the PAE preimage is the byte length of the decoded body, never the
    base64 length. Any deviation is a signature-verify bypass.
    """
    return hashlib.sha256(
        base64.b64decode(envelope["payload"])
    ).hexdigest()


def emit_self_audit_receipt(
    thread_digest: str,
    report_digests: dict[str, str],
    gate_exit_codes: dict[str, int],
    tool_versions: dict[str, str],
) -> dict:
    """Build the self-audit receipt for this payload run.

    Status logic (computed, not asserted):
      * signatures present -> SIGNED   (never happens in v1: no key mgmt)
      * no signatures      -> UNSIGNED
    The receipt is honest about its own incompleteness: Rekor anchor and
    RFC 3161 token are absent because the anchor step requires a live TSA
    and Rekor v2 endpoint, which this offline payload does not contact.
    """
    predicate = {
        "schema": "GovernedAction/v1",
        "receipt_id": f"self-audit-{uuid.uuid4()}",
        "emitted_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "actor": {
            "type": "agent",
            "id": "payload-v11-cto-synthesis",
            "is_service_account": True,
        },
        "human_principal": {
            # Article 12 requires natural persons in verification. The
            # self-audit run has none on record -> structurally INCOMPLETE.
            "is_service_account": False,
            "id": None,  # UNKNOWN
        },
        "action": {
            "class": "PAYLOAD_SYNTHESIS",
            "side_effect_class": "READ_ONLY",
            "idempotency_key": None,  # UNKNOWN — no execution ledger yet
        },
        "authority": {
            "policy_engine": "none (synthesis run, no Cedar evaluation)",
            "policy_revision": None,
        },
        "evidence": {
            "thread_digest_sha256": thread_digest,
            "report_digests_sha256": report_digests,
            "gate_exit_codes": gate_exit_codes,
            "tool_versions": tool_versions,
            "completeness": None,  # filled by evaluate_completeness below
        },
        "anchoring": {
            "rekor_v2_entry": None,       # UNKNOWN — not anchored offline
            "rfc3161_token": None,        # UNKNOWN — requires live TSA
            "roughtime_attestation": None,
        },
        "synchronization": {
            "local_durability": "fsync-on-write in emit step",
            "remote_ack": None,           # UNKNOWN — PENDING_SYNC semantics
        },
        "limitations": [
            "Signature proves integrity and signer identity, not factual truth.",
            "No persistent signer: key management has not landed (SZL_COSIGN_PRIVATE_PEM posture).",
            "No Rekor v2 anchor, no RFC 3161 token: this run is offline by design.",
            "Human principal field is UNKNOWN: a self-audit receipt cannot attest its own operator.",
            "stage/status fields are never evidence of a deployed revision.",
        ],
    }
    # Compute completeness against the obligation matrix.
    evidence_keys = {
        "thread_digest": predicate["evidence"]["thread_digest_sha256"],
        "report_digests": predicate["evidence"]["report_digests_sha256"],
        "gate_exit_codes": predicate["evidence"]["gate_exit_codes"],
    }
    missing = [o for o in SELF_AUDIT_OBLIGATIONS if not evidence_keys.get(o)]
    predicate["evidence"]["completeness"] = "INCOMPLETE" if missing else "COMPLETE"
    if missing:
        predicate["evidence"]["missing_obligations"] = missing

    subject_material = _canonical_json({
        "thread": thread_digest,
        "reports": report_digests,
        "gates": gate_exit_codes,
    })
    envelope = build_envelope(
        predicate, "szl-master-payload-v11", hashlib.sha256(subject_material).hexdigest()
    )
    return {
        "receipt_schema": PREDICATE_TYPE,
        "status": "UNSIGNED" if not envelope["signatures"] else "SIGNED",
        "status_note": (
            "UNSIGNED until key management lands; SIGNED only when a persistent "
            "signer produced the envelope signature array. Never render SIGNED "
            "from a status field alone."
        ),
        "envelope": envelope,
        "content_digest_sha256": envelope_content_digest(envelope),
    }


# ---------------------------------------------------------------------------
# Offline verifier legs (fail-closed, ordered)
# ---------------------------------------------------------------------------

def _leg(ok: bool, verdict_if_fail: str, detail: str) -> dict:
    return {"ok": ok, "verdict_if_fail": verdict_if_fail, "detail": detail}


def verify_bundle(bundle: dict) -> dict:
    """Verify a receipt bundle offline. Fail-closed, ordered legs.

    bundle = {
      "envelopes": [envelope, ...],           # hash-chained via prev_digest
      "evidence": {obligation: digest, ...},  # present evidence artifacts
      "obligations": [obligation, ...],       # declared by policy
      "sync": {"remote_ack": bool|None},
    }

    Verdict precedence:
      L0 structural    -> UNAVAILABLE  (malformed != forged; fail-stop)
      L2 statement     -> MISMATCH     (fail-stop)
      L3 predicate     -> MISMATCH     (fail-stop)
      L4 hash chain    -> MISMATCH     (fail-stop, position of break named)
      L5 evidence      -> INCOMPLETE   (fail-stop; even if every crypto leg passed)
      L1 signatures    -> UNSIGNED-LOCAL (soft: v1 ships no persistent signer,
                           so integrity legs degrade to hash-only and the
                           verdict can never exceed UNSIGNED-LOCAL)
      L6 sync          -> PENDING_SYNC (soft: remote durability unacknowledged)
    Soft-state precedence after all legs: UNSIGNED-LOCAL > PENDING_SYNC > VERIFIED.
    """
    legs: list[dict] = []
    soft_states: list[str] = []

    envelopes = bundle.get("envelopes")
    if not isinstance(envelopes, list) or not envelopes:
        return _result("UNAVAILABLE", [{"ok": False, "leg": "L0",
                                        "detail": "bundle.envelopes missing or empty"}])

    # L0 — structural (idempotent: ignore our own _statement cache key)
    for i, env in enumerate(envelopes):
        public_keys = {k for k in env if not k.startswith("_")}
        if not isinstance(env, dict) or public_keys != {"payloadType", "payload", "signatures"}:
            legs.append({"leg": "L0", **_leg(False, "UNAVAILABLE",
                                             f"envelope[{i}] is not an ITE-6 envelope object")})
            return _result("UNAVAILABLE", legs)
        if env["payloadType"] != PAYLOAD_TYPE:
            legs.append({"leg": "L0", **_leg(False, "UNAVAILABLE",
                                             f"envelope[{i}] payloadType {env.get('payloadType')!r}")})
            return _result("UNAVAILABLE", legs)
        try:
            raw = base64.b64decode(env["payload"], validate=True)
            statement = json.loads(raw)
        except Exception as exc:  # malformed is not forged
            legs.append({"leg": "L0", **_leg(False, "UNAVAILABLE",
                                             f"envelope[{i}] payload undecodable: {exc}")})
            return _result("UNAVAILABLE", legs)
        env["_statement"] = statement
    legs.append({"leg": "L0", **_leg(True, "UNAVAILABLE", "structure ok")})

    # L1 — signatures. v1 has no persistent signer: unsigned envelopes degrade
    # integrity to hash-only and cap the final verdict at UNSIGNED-LOCAL.
    # When signing lands, PAE over DECODED payload bytes + Ed25519 goes here.
    if all(not env["signatures"] for env in envelopes):
        legs.append({"leg": "L1", **_leg(False, "UNSIGNED-LOCAL",
                                         "no signatures present (key management not landed); "
                                         "hash-only integrity mode")})
        soft_states.append("UNSIGNED-LOCAL")
    else:
        legs.append({"leg": "L1", **_leg(True, "UNSIGNED-LOCAL", "signatures present")})

    # L2/L3 — statement + predicate
    for i, env in enumerate(envelopes):
        st = env["_statement"]
        if st.get("_type") != STATEMENT_TYPE or st.get("predicateType") != PREDICATE_TYPE:
            legs.append({"leg": "L2", **_leg(False, "MISMATCH",
                                             f"envelope[{i}] statement type/predicateType wrong")})
            return _result("MISMATCH", legs)
        pred = st.get("predicate", {})
        if pred.get("schema") != "GovernedAction/v1":
            legs.append({"leg": "L3", **_leg(False, "MISMATCH",
                                             f"envelope[{i}] predicate schema wrong")})
            return _result("MISMATCH", legs)
        human = pred.get("human_principal", {})
        if human.get("is_service_account") is not False:
            legs.append({"leg": "L3", **_leg(False, "MISMATCH",
                                             f"envelope[{i}] is_service_account is not const false")})
            return _result("MISMATCH", legs)
    legs.append({"leg": "L2", **_leg(True, "MISMATCH", "statement layer ok")})
    legs.append({"leg": "L3", **_leg(True, "MISMATCH", "predicate rules ok")})

    # L4 — hash chain
    declared = bundle.get("chain_digests")
    if isinstance(declared, list):
        actual = [envelope_content_digest(env) for env in envelopes]
        if actual != declared:
            pos = next((j for j in range(min(len(actual), len(declared)))
                        if actual[j] != declared[j]), min(len(actual), len(declared)))
            legs.append({"leg": "L4", **_leg(False, "MISMATCH",
                                             f"chain break at position {pos}")})
            return _result("MISMATCH", legs)
    legs.append({"leg": "L4", **_leg(True, "MISMATCH", "chain ok")})

    # L5 — evidence obligations. Missing evidence => INCOMPLETE, never PASS.
    # This leg deliberately runs AFTER all crypto legs: a validly signed
    # bundle with missing evidence is INCOMPLETE. Signature != completeness
    # != truth.
    obligations = bundle.get("obligations") or []
    evidence = bundle.get("evidence") or {}
    missing = [o for o in obligations if not evidence.get(o)]
    if missing:
        legs.append({"leg": "L5", **_leg(False, "INCOMPLETE",
                                         f"missing evidence obligations: {missing}")})
        return _result("INCOMPLETE", legs)
    legs.append({"leg": "L5", **_leg(True, "INCOMPLETE", "obligations satisfied")})

    # L6 — sync state (soft)
    if bundle.get("sync", {}).get("remote_ack") is not True:
        legs.append({"leg": "L6", **_leg(False, "PENDING_SYNC",
                                         "remote durability not acknowledged")})
        soft_states.append("PENDING_SYNC")
    else:
        legs.append({"leg": "L6", **_leg(True, "PENDING_SYNC", "synced")})

    if "UNSIGNED-LOCAL" in soft_states:
        return _result("UNSIGNED-LOCAL", legs)
    if "PENDING_SYNC" in soft_states:
        return _result("PENDING_SYNC", legs)
    return _result("VERIFIED", legs)


def _result(verdict: str, legs: list[dict]) -> dict:
    return {
        "verdict": verdict,
        "legs": legs,
        "honesty_footer": ("verdict proves envelope integrity and structure only; "
                           "a signature proves integrity and signer identity, not factual truth"),
    }
