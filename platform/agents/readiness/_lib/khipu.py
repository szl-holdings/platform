"""
Shared library for the SZL Readiness Agent fleet.

Provides:
  - Flagship + repo registry (single source of truth for the fleet).
  - Khipu receipt construction + DSSE-style signing (Ed25519 if a key is
    present, otherwise an honest UNSIGNED envelope — NEVER a fake signature).
  - HF dataset publication helper (posts the signed receipt to
    SZLHOLDINGS/readiness-runs).
  - Doctrine v11 constants (749/14/163, LOCKED).

Doctrine v11 (LOCKED): 749 declarations / 14 unique axioms / 163 tracked sorries.
Author: Yachay <yachay@szlholdings.dev>
"""
from __future__ import annotations

import base64
import datetime as _dt
import hashlib
import json
import os
import sys
from typing import Any

# --- Doctrine v11 (LOCKED) -------------------------------------------------
DOCTRINE_VERSION = "v11"
DOCTRINE_DECLARATIONS = 749
DOCTRINE_AXIOMS_UNIQUE = 14
DOCTRINE_SORRIES = 163
DOCTRINE_STRING = "749/14/163"  # verbatim, LOCKED

# Stale doctrine markers the fleet flags if it sees them in live repos.
STALE_DOCTRINE_MARKERS = ["626/189/168", "626", "189", "v7", "v9", "v10"]

# --- Registry --------------------------------------------------------------
# Flagships: the live governed-AI organs. Base URLs are read from env so the
# same code runs against staging or prod without edits.
FLAGSHIPS = [
    {"name": "a11oy", "repo": "szl-holdings/a11oy", "url_env": "A11OY_URL"},
    {"name": "amaru", "repo": "szl-holdings/amaru", "url_env": "AMARU_URL"},
    {"name": "sentra", "repo": "szl-holdings/sentra", "url_env": "SENTRA_URL"},
    {"name": "killinchu", "repo": "szl-holdings/killinchu", "url_env": "KILLINCHU_URL"},
    {"name": "rosie", "repo": "szl-holdings/rosie", "url_env": "ROSIE_URL"},
]

# Public org repos the docs/security agents walk. Kept conservative; the
# security/docs agents also enumerate live via `gh repo list` at runtime.
PUBLIC_REPOS = [
    "szl-holdings/platform", "szl-holdings/a11oy", "szl-holdings/amaru",
    "szl-holdings/sentra", "szl-holdings/rosie", "szl-holdings/vessels",
    "szl-holdings/lutar-lean", "szl-holdings/hatun-mcp", "szl-holdings/uds-mesh",
    "szl-holdings/vsp-otel", "szl-holdings/ouroboros", "szl-holdings/agi-forecast",
]

HF_DATASET = "SZLHOLDINGS/readiness-runs"


def flagship_url(fl: dict) -> str | None:
    return os.environ.get(fl["url_env"])


def utcnow_iso() -> str:
    return _dt.datetime.now(_dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _canonical(obj: Any) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":")).encode()


def sign_khipu_receipt(agent: str, payload: dict) -> dict:
    """Build a Khipu receipt and DSSE-wrap it.

    Signing key: env KHIPU_SIGNING_KEY_B64 (raw 32-byte Ed25519 seed, base64).
    If absent, the envelope is honestly marked unsigned: signed=false. We never
    emit a fabricated signature (Doctrine v11 LOCKED 749/14/163 §2 — anti-fake-green).
    """
    body = {
        "schema": "szl.readiness.receipt/v1",
        "agent": agent,
        "doctrine": {"version": DOCTRINE_VERSION, "numbers": DOCTRINE_STRING},
        "emitted_at_utc": utcnow_iso(),
        "payload": payload,
    }
    body_bytes = _canonical(body)
    digest = hashlib.sha256(body_bytes).hexdigest()

    envelope = {
        "payloadType": "application/vnd.szl.khipu+json",
        "payload": base64.b64encode(body_bytes).decode(),
        "payloadSha256": digest,
        "signatures": [],
        "signed": False,
    }

    seed_b64 = os.environ.get("KHIPU_SIGNING_KEY_B64")
    if seed_b64:
        try:
            from nacl.signing import SigningKey  # type: ignore

            seed = base64.b64decode(seed_b64)
            sk = SigningKey(seed)
            sig = sk.sign(body_bytes).signature
            envelope["signatures"] = [{
                "keyid": hashlib.sha256(bytes(sk.verify_key)).hexdigest()[:16],
                "sig": base64.b64encode(sig).decode(),
                "alg": "ed25519",
            }]
            envelope["signed"] = True
            envelope["publicKeyB64"] = base64.b64encode(bytes(sk.verify_key)).decode()
        except Exception as exc:  # pragma: no cover - defensive
            envelope["signError"] = f"{type(exc).__name__}: {exc}"
    return envelope


def publish_to_hf(agent: str, envelope: dict, dataset: str = HF_DATASET) -> dict:
    """Append the signed receipt to the runs dataset.

    Path: receipts/<agent>/<UTC-date>/<UTC-timestamp>.json
    Uses HF_TOKEN. Returns a small status dict. Never raises on auth failure;
    instead records the failure honestly so the dashboard shows the gap.
    """
    token = os.environ.get("HF_TOKEN")
    date = envelope_emitted_date(envelope)
    ts = utcnow_iso().replace(":", "-")
    path = f"receipts/{agent}/{date}/{ts}.json"
    if not token:
        return {"published": False, "reason": "no HF_TOKEN", "path": path}
    try:
        from huggingface_hub import HfApi  # type: ignore

        api = HfApi(token=token)
        api.upload_file(
            path_or_fileobj=json.dumps(envelope, indent=2).encode(),
            path_in_repo=path,
            repo_id=dataset,
            repo_type="dataset",
            commit_message=f"{agent} receipt {ts}",
        )
        return {"published": True, "path": path, "dataset": dataset}
    except Exception as exc:
        return {"published": False, "reason": f"{type(exc).__name__}: {exc}", "path": path}


def envelope_emitted_date(envelope: dict) -> str:
    raw = base64.b64decode(envelope["payload"]).decode()
    return json.loads(raw)["emitted_at_utc"][:10]


def emit(agent: str, payload: dict) -> dict:
    """Sign + publish + print. Standard tail call for every executor."""
    env = sign_khipu_receipt(agent, payload)
    pub = publish_to_hf(agent, env)
    out = {"receipt": env, "publish": pub}
    json.dump(out, sys.stdout, indent=2)
    sys.stdout.write("\n")
    return out
