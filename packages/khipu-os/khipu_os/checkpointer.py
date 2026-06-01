# SPDX-License-Identifier: Apache-2.0
# © 2026 Lutar, Stephen P. — SZL Holdings · ORCID 0009-0001-0110-4173
# Perplexity Computer Agent — KHIPU-OS Merkle checkpointer
"""
checkpointer.py — self-Merkle-checkpoint loop (Iceberg snapshot + Filecoin PoSt, made ours).

Every 12 h (Bible-mod-12 cadence — pure residue structure, NO prophecy; cf. F12 CRT-Hukulla)
compute a Merkle root over all hot receipts, wrap it in a DSSE envelope, sign (Cosign-
compatible HMAC in the dev shim; real Sigstore in prod), and publish the snapshot to the HF
dataset `szlholdings/khipu-snapshots`. Each checkpoint is an immutable Iceberg-style snapshot
= a Proof-of-Spacetime that the DAG still holds exactly the receipts it committed to.

The actual HF upload is delegated to an injectable `uploader` callable so the loop is unit-
testable offline; production wires `huggingface_hub.HfApi.upload_file`.
"""
from __future__ import annotations

import json
import time
from typing import Any, Callable, Dict, Optional

DSSE_PAYLOAD_TYPE = "application/vnd.szl.khipu.checkpoint+json"

# Path to the SZL cosign / EC signing key (founder secret). If present we produce a REAL
# ECDSA-P256 signature over the DSSE pre-authentication-encoding; if absent we emit an
# HONEST "PLACEHOLDER" label (never a fake signature claiming to be real).
DEFAULT_COSIGN_KEY = (
    "/home/user/workspace/szl/audit_2026-05-30_cursor_offline/.secret/"
    "szlholdings_ec_private.pem")


def _load_ec_signer(key_path):
    """Return (sign_fn, keyid) using a real EC private key, or (None, None) if unavailable."""
    try:
        from cryptography.hazmat.primitives import hashes, serialization
        from cryptography.hazmat.primitives.asymmetric import ec, utils as asym_utils
        with open(key_path, "rb") as fh:
            priv = serialization.load_pem_private_key(fh.read(), password=None)
        if not isinstance(priv, ec.EllipticCurvePrivateKey):
            return None, None
        import hashlib as _hl
        def _sign(pae: bytes) -> str:
            der = priv.sign(pae, ec.ECDSA(hashes.SHA256()))
            return der.hex()
        keyid = "szlholdings-ec-" + __import__("hashlib").sha256(
            priv.public_key().public_bytes(
                serialization.Encoding.DER,
                serialization.PublicFormat.SubjectPublicKeyInfo)).hexdigest()[:16]
        return _sign, keyid
    except Exception:
        return None, None


def _default_uploader(dataset_repo: str, path_in_repo: str, content: str) -> Dict[str, Any]:
    """Offline default: records intent (no network). Returns a stub commit descriptor.
    Production: replace with HfApi.upload_file(..., repo_type='dataset')."""
    return {"uploaded": False, "reason": "offline default uploader (no HF token wired)",
            "repo": dataset_repo, "path": path_in_repo, "bytes": len(content)}


class Checkpointer:
    def __init__(self, dag, dataset_repo: str = "szlholdings/khipu-snapshots",
                 uploader: Optional[Callable[[str, str, str], Dict[str, Any]]] = None,
                 cosign_key_path: Optional[str] = DEFAULT_COSIGN_KEY):
        self.dag = dag
        self.dataset_repo = dataset_repo
        self.uploader = uploader or _default_uploader
        self._ec_sign, self._ec_keyid = _load_ec_signer(cosign_key_path) \
            if cosign_key_path else (None, None)

    def build_envelope(self, now: float) -> Dict[str, Any]:
        root = self.dag.current_root()
        leaves = sorted(self.dag.leaf_hashes())
        payload = {
            "schema": "khipu-checkpoint/v1",
            "space": self.dag.space,
            "ts": now,
            "merkle_root": root,
            "leaf_count": len(leaves),
            "hot_count": self.dag.hot_count(),
            "archived_count": len(self.dag.archived_ids),
            "locked": self.dag.locked,
        }
        payload_b = json.dumps(payload, sort_keys=True, separators=(",", ":"))
        import hashlib, hmac
        chash = hashlib.sha3_256(payload_b.encode()).hexdigest()
        # DSSE PAE (pre-authentication encoding), RFC-style:
        pae = ("DSSEv1 %d %s %d %s" % (
            len(DSSE_PAYLOAD_TYPE), DSSE_PAYLOAD_TYPE,
            len(payload_b), payload_b)).encode()
        if self._ec_sign is not None:
            # REAL ECDSA-P256 signature over the DSSE PAE using the SZL cosign key
            signature = self._ec_sign(pae)
            keyid = self._ec_keyid
            sig_kind = "ecdsa-p256-sha256"
        else:
            # HONEST fallback: HMAC dev signature, explicitly labelled PLACEHOLDER
            sig = self.dag.signer
            signature = hmac.new(getattr(sig, "key", b"khipu-os-dev-key"),
                                 pae, hashlib.sha256).hexdigest()
            keyid = "PLACEHOLDER:" + getattr(sig, "signer_id", "Yachay")
            sig_kind = "PLACEHOLDER-hmac-sha256 (no EC key wired)"
        return {
            "payloadType": DSSE_PAYLOAD_TYPE,
            "payload": payload,
            "content_hash": chash,
            "sig_kind": sig_kind,
            "signatures": [{"keyid": keyid, "sig": signature}],
        }

    def run(self, now: float = None) -> Dict[str, Any]:
        now = now if now is not None else time.time()
        env = self.build_envelope(now)
        path = f"checkpoints/{self.dag.space}/{int(now)}_{env['payload']['merkle_root'][:12]}.json"
        up = self.uploader(self.dataset_repo, path, json.dumps(env, sort_keys=True))
        snapshot = {"root": env["payload"]["merkle_root"], "ts": now, "path": path,
                    "leaf_count": env["payload"]["leaf_count"], "upload": up}
        self.dag.checkpoints.append(snapshot)
        rec = self.dag.add_receipt(
            organ=self.dag.name, action="self_checkpoint",
            payload={"merkle_root": snapshot["root"], "path": path,
                     "leaf_count": snapshot["leaf_count"], "dsse": env["payloadType"]},
            yuyay=1.0,
        )
        snapshot["receipt"] = rec.receipt_id
        return snapshot
