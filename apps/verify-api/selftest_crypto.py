"""Box-only self-test: proves the REAL crypto paths of verify_engine.

Requires `cryptography` (present on the box, absent in the Replit sandbox).
Asserts:
  1. a genuine Ed25519-signed DSSE envelope -> dsse.sig[0]:pass, verdict VERIFIED
  2. a one-byte-tampered payload (same sig) -> dsse.sig[0]:fail, verdict FAILED
  3. an unsigned in-toto statement            -> verdict STRUCTURAL-ONLY (never green)
Exit non-zero on ANY regression.
"""
import base64
import json
import sys

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives import serialization

import verify_engine as ve


def b64(b: bytes) -> str:
    return base64.b64encode(b).decode()


def _status(res, name):
    for c in res["checks"]:
        if c["name"] == name:
            return c["status"]
    return None


def main() -> int:
    failures = []

    # --- build a genuine Ed25519-signed DSSE envelope ---
    sk = Ed25519PrivateKey.generate()
    pub_pem = sk.public_key().public_bytes(
        serialization.Encoding.PEM,
        serialization.PublicFormat.SubjectPublicKeyInfo,
    ).decode()

    ptype = "application/vnd.in-toto+json"
    payload = json.dumps({
        "_type": "https://in-toto.io/Statement/v1",
        "predicateType": "https://szlholdings.com/attestations/innovation/v1",
        "subject": [{"name": "selftest", "digest": {"sha256": "0" * 64}}],
    }, sort_keys=True).encode()

    signed = ve.pae(ptype, payload)
    sig = sk.sign(signed)
    env = {"payloadType": ptype, "payload": b64(payload),
           "signatures": [{"sig": b64(sig)}]}

    # 1) genuine signature -> VERIFIED
    r1 = ve.verify(env, pubkey_pem=pub_pem)
    s1 = _status(r1, "dsse.sig[0]")
    print(f"[1] signed   -> verdict={r1['verdict']:16} dsse.sig[0]={s1}")
    if s1 != "pass":
        failures.append("genuine Ed25519 signature did not verify (expected dsse.sig[0]:pass)")
    if r1["verdict"] != "VERIFIED":
        failures.append(f"genuine signature verdict={r1['verdict']} (expected VERIFIED)")

    # 2) tampered payload (same sig) -> FAILED
    bad_payload = json.dumps({
        "_type": "https://in-toto.io/Statement/v1",
        "predicateType": "https://szlholdings.com/attestations/innovation/v1",
        "subject": [{"name": "TAMPERED", "digest": {"sha256": "1" * 64}}],
    }, sort_keys=True).encode()
    env_bad = {"payloadType": ptype, "payload": b64(bad_payload),
               "signatures": [{"sig": b64(sig)}]}
    r2 = ve.verify(env_bad, pubkey_pem=pub_pem)
    s2 = _status(r2, "dsse.sig[0]")
    print(f"[2] tampered -> verdict={r2['verdict']:16} dsse.sig[0]={s2}")
    if s2 != "fail":
        failures.append("tampered payload still verified (expected dsse.sig[0]:fail)")
    if r2["verdict"] != "FAILED":
        failures.append(f"tampered verdict={r2['verdict']} (expected FAILED)")

    # 3) unsigned in-toto statement -> STRUCTURAL-ONLY
    stmt = {
        "predicateType": "https://szlholdings.com/attestations/innovation/v1",
        "subject": [{"name": "x", "digest": {"sha256": "a" * 64}}],
    }
    r3 = ve.verify(stmt)
    print(f"[3] unsigned -> verdict={r3['verdict']}")
    if r3["verdict"] != "STRUCTURAL-ONLY":
        failures.append(f"unsigned verdict={r3['verdict']} (expected STRUCTURAL-ONLY)")

    if failures:
        print("\nFAIL:")
        for f in failures:
            print("  -", f)
        return 1
    print("\nALL CRYPTO SELF-TESTS PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
