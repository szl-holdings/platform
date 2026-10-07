"""
Shared library for the SZL Readiness Agent fleet.

Provides:
  - Flagship + repo registry (single source of truth for the fleet).
  - Khipu receipt construction + DSSE-style signing (Ed25519 if a key is
    present, otherwise an honest UNSIGNED envelope — NEVER a fake signature).
  - HF dataset publication helper (posts only a verified signed receipt to
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

            seed = base64.b64decode(seed_b64, validate=True)
            sk = SigningKey(seed)
            sig = sk.sign(body_bytes).signature
            envelope["signatures"] = [{
                "keyid": hashlib.sha256(bytes(sk.verify_key)).hexdigest()[:16],
                "sig": base64.b64encode(sig).decode(),
                "alg": "ed25519",
            }]
            envelope["signed"] = True
            envelope["publicKeyB64"] = base64.b64encode(bytes(sk.verify_key)).decode()
        except Exception:  # pragma: no cover - defensive
            # Exception text may include credential material; receipt output is public.
            envelope["signError"] = "signing unavailable or invalid key"
    return envelope


def receipt_signature_error(agent: str, envelope: dict) -> str | None:
    """Return a bounded reason when a receipt cannot be trusted for upload.

    The envelope's signed flag is a claim, not proof. Verify the payload hash,
    signer metadata, and Ed25519 signature against the configured fleet key
    before it can leave this process. The envelope's public key is untrusted.
    """
    if envelope.get("signed") is not True:
        return "unsigned receipt"
    signatures = envelope.get("signatures")
    if not isinstance(signatures, list) or len(signatures) != 1:
        return "expected one Ed25519 signature"
    signature = signatures[0]
    if not isinstance(signature, dict) or signature.get("alg") != "ed25519":
        return "invalid signature metadata"
    seed_b64 = os.environ.get("KHIPU_SIGNING_KEY_B64")
    if not seed_b64:
        return "no KHIPU_SIGNING_KEY_B64"
    try:
        from nacl.signing import SigningKey, VerifyKey  # type: ignore

        seed = base64.b64decode(seed_b64, validate=True)
        expected_public_key = bytes(SigningKey(seed).verify_key)
        body_bytes = base64.b64decode(envelope["payload"], validate=True)
        public_key = base64.b64decode(envelope["publicKeyB64"], validate=True)
        sig_bytes = base64.b64decode(signature["sig"], validate=True)
        if public_key != expected_public_key:
            return "signer does not match configured fleet key"
        if envelope.get("payloadType") != "application/vnd.szl.khipu+json":
            return "invalid payload type"
        if envelope.get("payloadSha256") != hashlib.sha256(body_bytes).hexdigest():
            return "payload digest mismatch"
        if signature.get("keyid") != hashlib.sha256(public_key).hexdigest()[:16]:
            return "signer key id mismatch"
        body = json.loads(body_bytes)
        if not isinstance(body, dict) or body.get("schema") != "szl.readiness.receipt/v1" \
                or body.get("agent") != agent:
            return "receipt identity mismatch"
        emitted_at = body.get("emitted_at_utc")
        if not isinstance(emitted_at, str):
            return "missing receipt timestamp"
        _dt.datetime.strptime(emitted_at, "%Y-%m-%dT%H:%M:%SZ")
        VerifyKey(public_key).verify(body_bytes, sig_bytes)
    except Exception:
        return "invalid receipt signature or payload"
    return None


def publish_to_hf(agent: str, envelope: dict, dataset: str = HF_DATASET) -> dict:
    """Append the signed receipt to the runs dataset.

    Path: receipts/<agent>/<UTC-date>/<UTC-timestamp>.json
    Uses HF_TOKEN, or an exact-target GitHub Actions OIDC grant when
    HF_OIDC_RESOURCE is set. Returns a small status dict and never raises itself; the
    caller (emit -> require_published) turns a failed publish into a failed
    run, because the dashboard and readiness-audit-rift only see receipts that
    reached the dataset.
    """
    token = os.environ.get("HF_TOKEN")
    oidc_resource = os.environ.get("HF_OIDC_RESOURCE")
    if oidc_resource:
        if oidc_resource != f"datasets/{dataset}":
            return {"published": False, "reason": "OIDC dataset mismatch", "path": "(not created)"}
        if token:
            return {"published": False, "reason": "ambiguous HF_TOKEN and OIDC credentials", "path": "(not created)"}
        if os.environ.get("GITHUB_ACTIONS") != "true" or not all(
            os.environ.get(name) for name in (
                "ACTIONS_ID_TOKEN_REQUEST_URL", "ACTIONS_ID_TOKEN_REQUEST_TOKEN"
            )
        ):
            return {"published": False, "reason": "OIDC request grant unavailable", "path": "(not created)"}
    elif not token:
        return {"published": False, "reason": "no HF_TOKEN or OIDC grant", "path": "(not created)"}
    signature_error = receipt_signature_error(agent, envelope)
    if signature_error:
        return {"published": False, "reason": signature_error, "path": "(not created)"}
    date = envelope_emitted_date(envelope)
    ts = utcnow_iso().replace(":", "-")
    path = f"receipts/{agent}/{date}/{ts}.json"
    try:
        from huggingface_hub import HfApi  # type: ignore

        # token=True forces the pinned Hub client to exchange OIDC (or fail)
        # even when implicit-token use is disabled.
        api = HfApi(token=True if oidc_resource else token)
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


def require_published(results: list[dict], what: str) -> None:
    """Fail the run when a Hub write this run owed did not land.

    Anti-fake-green: a receipt (or DR dump) that never reaches
    SZLHOLDINGS/readiness-runs is invisible to dashboard.html and to
    readiness-audit-rift, so a green workflow run without it would claim
    evidence that does not exist. Inside GitHub Actions every missing write is
    a workflow error and exits 1 (after the receipt was already printed).
    Outside Actions (local runs, usually without HF_TOKEN) it only warns.
    """
    failed = [r for r in results if not (r.get("published") or r.get("uploaded"))]
    if not failed:
        return
    in_actions = os.environ.get("GITHUB_ACTIONS") == "true"
    prefix = "::error title=readiness publish failed::" if in_actions else "WARNING: "
    for result in failed:
        print(
            f"{prefix}{what} not published to {HF_DATASET} "
            f"({result.get('reason', 'unknown reason')}; path {result.get('path', '?')})"
        )
    sys.stdout.flush()
    if in_actions:
        raise SystemExit(1)


def emit(agent: str, payload: dict) -> dict:
    """Sign + verify + publish + print; fail Actions if either gate fails."""
    env = sign_khipu_receipt(agent, payload)
    pub = publish_to_hf(agent, env)
    out = {"receipt": env, "publish": pub}
    json.dump(out, sys.stdout, indent=2)
    sys.stdout.write("\n")
    require_published([pub], what=f"{agent} receipt")
    return out
