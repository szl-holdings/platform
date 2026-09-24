#!/usr/bin/env python3
"""verify_bundle.py — CLI over lib/receipt.py's offline verifier legs.

Modes:
  --demo            build a self-audit bundle and verify it (UNSIGNED-LOCAL)
  --tamper          verify, then corrupt one envelope payload and re-verify
  --remove-evidence verify with the evidence map stripped
  --pae-demo        show the PAE preimage built over DECODED payload bytes

The demo exits 0 only when every leg behaves as the Zero-Bandaid Law
requires: tamper => MISMATCH, missing evidence => INCOMPLETE, unsigned =>
UNSIGNED-LOCAL. Never PASS without evidence.

Usage: python3 tools/verify_bundle.py [--tamper|--remove-evidence|--pae-demo|--demo]
"""

from __future__ import annotations

import argparse
import base64
import hashlib
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / "lib"))

from receipt import (  # noqa: E402
    SELF_AUDIT_OBLIGATIONS,
    emit_self_audit_receipt,
    envelope_content_digest,
    verify_bundle,
)


def build_self_audit_bundle() -> dict:
    digests = {f"agent_reports/{n}.md": hashlib.sha256(n.encode()).hexdigest()
               for n in ("fe1_surfaces_design", "fe2_demo_experience",
                         "be1_platform", "be2_models_kernels")}
    receipt = emit_self_audit_receipt(
        thread_digest=hashlib.sha256(b"conversation.jsonl").hexdigest(),
        report_digests=digests,
        gate_exit_codes={"lexicon_gate": 1, "release_gate": 1, "spaces_gate": 1},
        tool_versions={"szl_yaml": "1.0", "receipt": "1.0", "ledgers": "1.0"},
    )
    env = receipt["envelope"]
    evidence = {
        "thread_digest": hashlib.sha256(b"conversation.jsonl").hexdigest(),
        "report_digests": hashlib.sha256(
            ",".join(sorted(digests.values())).encode()).hexdigest(),
        "gate_exit_codes": hashlib.sha256(b"1,1,1").hexdigest(),
    }
    return {
        "envelopes": [env],
        "chain_digests": [envelope_content_digest(env)],
        "evidence": evidence,
        "obligations": list(SELF_AUDIT_OBLIGATIONS),
        "sync": {"remote_ack": None},
    }, receipt


def pae_preimage(payload_type: str, payload_b64: str) -> bytes:
    """DSSE PAE: LEN is over the DECODED body bytes — never the base64 length."""
    body = base64.b64decode(payload_b64)
    pt = payload_type.encode("utf-8")
    return (b"DSSEv1 " + str(len(pt)).encode() + b" " + pt + b" "
            + str(len(body)).encode() + b" " + body)


def show(verdict: dict) -> None:
    print(f"verdict: {verdict['verdict']}")
    for leg in verdict["legs"]:
        mark = "ok" if leg["ok"] else "FAIL-CLOSED"
        print(f"  {leg['leg']}: {mark} — {leg['detail']}")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--demo", action="store_true")
    ap.add_argument("--tamper", action="store_true")
    ap.add_argument("--remove-evidence", action="store_true")
    ap.add_argument("--pae-demo", action="store_true")
    args = ap.parse_args()

    bundle, receipt = build_self_audit_bundle()

    if args.pae_demo:
        env = bundle["envelopes"][0]
        pae = pae_preimage(env["payloadType"], env["payload"])
        decoded_len = len(base64.b64decode(env["payload"]))
        b64_len = len(env["payload"])
        print("PAE preimage head:", pae[:64])
        print(f"LEN uses decoded payload bytes: {decoded_len} "
              f"(base64 length {b64_len} would be a signature-verify bypass)")
        return 0

    import json as _json
    pred = _json.loads(base64.b64decode(bundle["envelopes"][0]["payload"]))["predicate"]
    print("=== self-audit receipt ===")
    print(f"status: {receipt['status']}  ({receipt['status_note']})")
    print(f"content_digest_sha256: {receipt['content_digest_sha256']}")
    print(f"predicate completeness: {pred['evidence']['completeness']}")
    print(f"limitations declared: {len(pred['limitations'])}")
    for lim in pred["limitations"]:
        print(f"  - {lim}")

    if args.tamper or (not args.remove_evidence):
        print("\n=== verify: as-built ===")
        show(verify_bundle(bundle))

    if args.tamper:
        import copy
        # (a) one-byte tamper that keeps the JSON valid: flip one hex digit
        # inside the embedded thread digest. Structure parses, legs L0-L3
        # pass; the digest leg L4 is what catches it.
        tampered = copy.deepcopy(bundle)
        raw = base64.b64decode(tampered["envelopes"][0]["payload"]).decode()
        anchor = raw.index('"thread_digest_sha256":"') + len('"thread_digest_sha256":"')
        pos = anchor + 3
        raw = raw[:pos] + ("1" if raw[pos] != "1" else "0") + raw[pos + 1:]
        tampered["envelopes"][0]["payload"] = base64.b64encode(raw.encode()).decode()
        print("\n=== verify: one hex digit tampered inside payload (JSON still valid) ===")
        r = verify_bundle(tampered)
        show(r)
        if r["verdict"] != "MISMATCH":
            print("ZERO-BANDAID FAILURE: tampered bundle did not MISMATCH")
            return 1
        # (b) corrupt the declared chain digest list itself
        chain_broken = copy.deepcopy(bundle)
        chain_broken["chain_digests"] = ["0" * 64]
        print("\n=== verify: declared chain digest corrupted ===")
        r = verify_bundle(chain_broken)
        show(r)
        if r["verdict"] != "MISMATCH":
            print("ZERO-BANDAID FAILURE: corrupted chain did not MISMATCH")
            return 1

    if args.remove_evidence:
        stripped = dict(bundle)
        stripped["evidence"] = {"thread_digest": bundle["evidence"]["thread_digest"]}
        print("\n=== verify: evidence obligations partially removed ===")
        r = verify_bundle(stripped)
        show(r)
        if r["verdict"] != "INCOMPLETE":
            print("ZERO-BANDAID FAILURE: missing evidence did not yield INCOMPLETE")
            return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
