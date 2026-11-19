"""Box-only self-test: proves the REAL crypto paths of verify_engine.

Requires `cryptography` (present on the box, absent in the Replit sandbox).
Asserts:
  1. a genuine Ed25519-signed DSSE envelope -> dsse.sig[0]:pass, verdict VERIFIED
  2. a one-byte-tampered payload (same sig) -> dsse.sig[0]:fail, verdict FAILED
  3. an unsigned in-toto statement            -> verdict STRUCTURAL-ONLY (never green)
  4. a self-signed cert, matching SAN + GitHub issuer -> SIGNED-UNANCHORED, never VERIFIED
  5. a self-signed cert with a foreign OIDC issuer    -> FAILED (sigstore.issuer:fail)
  6. a forged cert + an unrelated caller pubkey_pem   -> FAILED (pinned key wins)
Exit non-zero on ANY regression.
"""
import base64
import datetime
import json
import sys

from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.x509.oid import NameOID

import verify_engine as ve


def b64(b: bytes) -> str:
    return base64.b64encode(b).decode()


def _status(res, name):
    for c in res["checks"]:
        if c["name"] == name:
            return c["status"]
    return None


_SAN = "https://github.com/szl-holdings/a11oy/.github/workflows/release.yml@refs/heads/main"


def _self_signed_env(issuer: str):
    """An attacker-built envelope: own EC key, self-signed cert claiming a real SAN."""
    k = ec.generate_private_key(ec.SECP256R1())
    n = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, "attacker")])
    now = datetime.datetime.now(datetime.timezone.utc)
    cert = (x509.CertificateBuilder().subject_name(n).issuer_name(n).public_key(k.public_key())
            .serial_number(1).not_valid_before(now).not_valid_after(now + datetime.timedelta(days=1))
            .add_extension(x509.SubjectAlternativeName([x509.UniformResourceIdentifier(_SAN)]), False)
            .add_extension(x509.UnrecognizedExtension(
                x509.ObjectIdentifier("1.3.6.1.4.1.57264.1.1"), issuer.encode()), False)
            .sign(k, hashes.SHA256()))
    pt = "application/vnd.in-toto+json"
    payload = json.dumps({"_type": "https://in-toto.io/Statement/v1", "predicateType": "x",
                          "subject": [{"name": "forged", "digest": {"sha256": "0" * 64}}]}).encode()
    sig = k.sign(ve.pae(pt, payload), ec.ECDSA(hashes.SHA256()))
    return {"payloadType": pt, "payload": b64(payload),
            "signatures": [{"sig": b64(sig),
                            "cert": cert.public_bytes(serialization.Encoding.PEM).decode()}]}


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

    # 4) self-signed cert, matching SAN, GitHub issuer -> SIGNED-UNANCHORED, ok False
    env4 = _self_signed_env("https://token.actions.githubusercontent.com")
    r4 = ve.verify(env4, identity=_SAN, rekor=False, lean=False)
    s4 = _status(r4, "dsse.sig[0]")
    print(f"[4] selfcert -> verdict={r4['verdict']:16} dsse.sig[0]={s4} ok={r4['ok']}")
    if r4["verdict"] != "SIGNED-UNANCHORED" or r4["ok"] is not False:
        failures.append(f"self-signed cert verdict={r4['verdict']} ok={r4['ok']} "
                        "(expected SIGNED-UNANCHORED, ok False)")
    if s4 != "unanchored":
        failures.append(f"self-signed cert dsse.sig[0]={s4} (expected unanchored)")

    # 5) self-signed cert with a foreign OIDC issuer -> FAILED
    env5 = _self_signed_env("https://evil.example")
    r5 = ve.verify(env5, identity=_SAN, rekor=False, lean=False)
    s5 = _status(r5, "sigstore.issuer")
    print(f"[5] evil-iss -> verdict={r5['verdict']:16} sigstore.issuer={s5}")
    if r5["verdict"] != "FAILED" or s5 != "fail":
        failures.append(f"foreign issuer verdict={r5['verdict']} sigstore.issuer={s5} "
                        "(expected FAILED, fail)")

    # 6) forged cert + unrelated caller-pinned key -> FAILED (pinned key is never replaced)
    other = ec.generate_private_key(ec.SECP256R1()).public_key().public_bytes(
        serialization.Encoding.PEM, serialization.PublicFormat.SubjectPublicKeyInfo).decode()
    r6 = ve.verify(env4, pubkey_pem=other, rekor=False, lean=False)
    s6 = _status(r6, "dsse.sig[0]")
    print(f"[6] pinned   -> verdict={r6['verdict']:16} dsse.sig[0]={s6}")
    if r6["verdict"] != "FAILED" or s6 != "fail":
        failures.append(f"forged cert overrode pinned key: verdict={r6['verdict']} "
                        f"dsse.sig[0]={s6} (expected FAILED, fail)")

    if failures:
        print("\nFAIL:")
        for f in failures:
            print("  -", f)
        return 1
    print("\nALL CRYPTO SELF-TESTS PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
