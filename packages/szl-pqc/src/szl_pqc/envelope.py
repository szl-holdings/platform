"""DSSE envelope structure with PQC-aware signature entries.

Follows the DSSE (Dead Simple Signing Envelope) PAE — Pre-Authentication
Encoding — so the bytes that are signed are unambiguous:

    PAE(type, body) = "DSSEv1" SP LEN(type) SP type SP LEN(body) SP body

Each signature entry records its ``keyid`` and a ``sig_type`` so a single
envelope can carry an ECDSA signature, an ML-DSA signature, or both (hybrid).
"""
from __future__ import annotations

import base64
import json
from dataclasses import dataclass, field
from typing import List


def pae(payload_type: str, payload: bytes) -> bytes:
    """DSSE Pre-Authentication Encoding."""
    t = payload_type.encode("utf-8")
    return b"DSSEv1 %d %s %d %s" % (len(t), t, len(payload), payload)


def _b64(data: bytes) -> str:
    return base64.standard_b64encode(data).decode("ascii")


def _unb64(data: str) -> bytes:
    return base64.standard_b64decode(data.encode("ascii"))


@dataclass
class Signature:
    keyid: str
    sig: bytes
    sig_type: str  # "ECDSA-P256-SHA256" | "ML-DSA-65"

    def to_json(self) -> dict:
        return {"keyid": self.keyid, "sig": _b64(self.sig), "sig_type": self.sig_type}

    @staticmethod
    def from_json(d: dict) -> "Signature":
        return Signature(keyid=d["keyid"], sig=_unb64(d["sig"]), sig_type=d["sig_type"])


@dataclass
class DSSEEnvelope:
    payload: bytes
    payload_type: str = "application/vnd.szl.khipu+json"
    signatures: List[Signature] = field(default_factory=list)

    def pae(self) -> bytes:
        return pae(self.payload_type, self.payload)

    def sig_types(self) -> List[str]:
        return [s.sig_type for s in self.signatures]

    def to_json(self) -> str:
        return json.dumps(
            {
                "payload": _b64(self.payload),
                "payloadType": self.payload_type,
                "signatures": [s.to_json() for s in self.signatures],
            },
            sort_keys=True,
        )

    @staticmethod
    def from_json(text: str) -> "DSSEEnvelope":
        d = json.loads(text)
        return DSSEEnvelope(
            payload=_unb64(d["payload"]),
            payload_type=d["payloadType"],
            signatures=[Signature.from_json(s) for s in d["signatures"]],
        )
