"""kipu/cell.py — the ReceiptCell.

A ReceiptCell is the atomic knot of the KIPU substrate. It is:
  * content-addressed   — its id is the BLAKE2b hash of its canonical content (IPFS/IPLD style)
  * a signed envelope   — Ed25519 signature over the content hash (HMAC fallback if no key);
                          the audit-trail discipline of locked-blackboard agent systems
  * indexable           — organ_origin, organ_subscribers, yuyay_score, cadence_tier

Content addressing => corruption is detectable (hash mismatch) and dedup is free, exactly as in
IPLD (https://ipld.io) and Hypercore (https://github.com/holepunchto/hypercore).
"""
from __future__ import annotations

import hashlib
import hmac
import json
import time
import uuid
from dataclasses import dataclass, field, asdict
from typing import Any, Optional


def _canonical(obj: Any) -> bytes:
    """Deterministic canonical JSON encoding for content addressing."""
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), default=str).encode("utf-8")


def _blake2b(data: bytes) -> str:
    return hashlib.blake2b(data, digest_size=32).hexdigest()


# --- Ed25519 signing if cryptography is available; deterministic HMAC fallback otherwise ---
try:  # pragma: no cover - environment dependent
    from cryptography.hazmat.primitives.asymmetric.ed25519 import (
        Ed25519PrivateKey, Ed25519PublicKey,
    )
    _HAVE_ED25519 = True
except Exception:  # pragma: no cover
    _HAVE_ED25519 = False

_HMAC_KEY = b"KIPU-substrate-v15-Yachay"  # fallback signing key (deterministic, test-grade)


@dataclass
class ReceiptCell:
    """A signed, content-addressed receipt knotted into the KIPU substrate."""

    organ_origin: str
    payload: dict
    subject: str = ""                       # what the cell is *about* (for coherence checks)
    kind: str = "receipt"                   # receipt | read_receipt | t23_fired | snapshot
    organ_subscribers: list = field(default_factory=list)
    yuyay_score: Optional[float] = None
    cadence_tier: str = "5min"
    ts: float = field(default_factory=lambda: round(time.time(), 6))
    nonce: str = field(default_factory=lambda: uuid.uuid4().hex)
    cid: str = ""                           # content id (BLAKE2b of canonical content)
    signature: str = ""
    pubkey: str = ""

    # ---- content addressing ----
    def _content(self) -> dict:
        return {
            "organ_origin": self.organ_origin,
            "payload": self.payload,
            "subject": self.subject,
            "kind": self.kind,
            "organ_subscribers": sorted(self.organ_subscribers),
            "yuyay_score": self.yuyay_score,
            "cadence_tier": self.cadence_tier,
            "ts": self.ts,
            "nonce": self.nonce,
        }

    def compute_cid(self) -> str:
        return _blake2b(_canonical(self._content()))

    def verify_cid(self) -> bool:
        return self.cid == self.compute_cid()

    # ---- signed envelope ----
    def sign(self, private_key: Any = None) -> "ReceiptCell":
        self.cid = self.compute_cid()
        if _HAVE_ED25519 and private_key is not None:
            sig = private_key.sign(self.cid.encode())
            self.signature = sig.hex()
            self.pubkey = private_key.public_key().public_bytes_raw().hex()
        else:
            self.signature = hmac.new(_HMAC_KEY, self.cid.encode(), hashlib.sha256).hexdigest()
            self.pubkey = "hmac:KIPU-substrate-v15"
        return self

    def verify_signature(self, public_key: Any = None) -> bool:
        if not self.verify_cid():
            return False
        if _HAVE_ED25519 and public_key is not None and not self.pubkey.startswith("hmac:"):
            try:
                public_key.verify(bytes.fromhex(self.signature), self.cid.encode())
                return True
            except Exception:
                return False
        expected = hmac.new(_HMAC_KEY, self.cid.encode(), hashlib.sha256).hexdigest()
        return hmac.compare_digest(expected, self.signature)

    # ---- serialization ----
    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, d: dict) -> "ReceiptCell":
        return cls(**d)

    def __hash__(self):
        return hash(self.cid or self.compute_cid())


def read_receipt(organ: str, query: dict, matched_cids: list) -> ReceiptCell:
    """A Khipu receipt for a READ access (HR: every substrate read emits a receipt)."""
    return ReceiptCell(
        organ_origin=organ,
        kind="read_receipt",
        subject="read",
        payload={"query": query, "matched_cids": list(matched_cids)},
        cadence_tier="event",
    ).sign()
