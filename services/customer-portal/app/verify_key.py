"""verify_key.py — verify an SZL API key (hash + cosign tamper-evidence). No mock.
Author: Yachay (CTO authority) 2026-06-01. cosign trust is PLACEHOLDER (no Rekor inclusion yet)."""
from __future__ import annotations
import hashlib, base64, subprocess, tempfile, os

def key_hash(raw_key: str) -> str:
    return hashlib.sha256(raw_key.encode()).hexdigest()

def fingerprint(raw_key: str) -> str:
    return hashlib.sha256(raw_key.encode()).hexdigest()[:16]

def verify_key(raw_key: str, row: dict, pubkey_path: str = "szl-keymint.pub") -> bool:
    if key_hash(raw_key) != row["key_hash"]:
        return False
    if row["status"] != "active":
        return False
    fp = fingerprint(raw_key)
    with tempfile.NamedTemporaryFile("w", delete=False) as f:
        f.write(fp); fp_path = f.name
    sig_path = fp_path + ".sig"
    with open(sig_path, "wb") as s:
        s.write(base64.b64decode(row["cosign_sig"]))
    try:
        ok = subprocess.run(
            ["cosign", "verify-blob", "--key", pubkey_path,
             "--signature", sig_path, fp_path],
            capture_output=True).returncode == 0
    except FileNotFoundError:
        ok = False  # fail closed if cosign unavailable
    finally:
        os.unlink(fp_path); os.unlink(sig_path)
    return ok

def authorize(operation_id: str, scope: str) -> bool:
    """Map OpenAPI operationId verb class -> required scope. Least privilege."""
    need = "read"
    low = operation_id.lower()
    if low.startswith(("start", "post", "ingest", "create", "evolve", "screen", "scan", "track")):
        need = "write"
    if low.startswith("admin") or "key" in low and low.startswith(("create", "revoke", "rotate")):
        need = "admin"
    order = {"read": 0, "write": 1, "admin": 2}
    return order[scope] >= order[need]
