"""Evidence pack — hash-chained, signed forensic bundle.

A pack is an ordered list of evidence items. Each item carries a SHA-256
content hash and a ``prev_hash`` chain pointer. The terminal ``pack_hash`` is
signed using an HMAC-SHA256 signer; callers can provide a stronger signer.

The pack hash is also published to the yawar bus on topic ``sentra.evidence``
when a sink is provided.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import time
from dataclasses import dataclass, field
from typing import Any, Iterable, Protocol


def _sha256_hex(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


@dataclass(frozen=True)
class EvidenceItem:
    id: str
    kind: str  # log_excerpt | pcap | memory_dump | screenshot | artifact | indicator | report
    description: str
    payload: bytes
    collected_at: float
    metadata: dict[str, Any] = field(default_factory=dict)

    def content_hash(self) -> str:
        h = hashlib.sha256()
        h.update(self.id.encode())
        h.update(b"\x00")
        h.update(self.kind.encode())
        h.update(b"\x00")
        h.update(self.payload)
        h.update(b"\x00")
        h.update(json.dumps(self.metadata, sort_keys=True).encode())
        return h.hexdigest()


@dataclass(frozen=True)
class ChainEntry:
    sequence: int
    item_id: str
    content_hash: str
    prev_hash: str
    chain_hash: str  # sha256(prev_hash || content_hash)


@dataclass(frozen=True)
class SignedPack:
    pack_id: str
    incident_id: str
    created_at: float
    items: tuple[EvidenceItem, ...]
    chain: tuple[ChainEntry, ...]
    pack_hash: str
    signature: str
    signer_id: str

    def verify(self, signer: "Signer") -> bool:
        # Recompute chain
        prev = "0" * 64
        for seq, item in enumerate(self.items):
            ch = item.content_hash()
            chain_hash = _sha256_hex((prev + ch).encode())
            entry = self.chain[seq]
            if entry.content_hash != ch or entry.chain_hash != chain_hash:
                return False
            prev = chain_hash
        if prev != self.pack_hash:
            return False
        return signer.verify(self.pack_hash.encode(), self.signature)

    def to_dict(self, include_payloads: bool = False) -> dict:
        return {
            "pack_id": self.pack_id,
            "incident_id": self.incident_id,
            "created_at": self.created_at,
            "items": [
                {
                    "id": i.id,
                    "kind": i.kind,
                    "description": i.description,
                    "collected_at": i.collected_at,
                    "metadata": i.metadata,
                    "content_hash": i.content_hash(),
                    "payload_b64": (
                        base64.b64encode(i.payload).decode() if include_payloads else None
                    ),
                    "size_bytes": len(i.payload),
                }
                for i in self.items
            ],
            "chain": [c.__dict__ for c in self.chain],
            "pack_hash": self.pack_hash,
            "signature": self.signature,
            "signer_id": self.signer_id,
        }


class Signer(Protocol):
    signer_id: str
    def sign(self, data: bytes) -> str: ...
    def verify(self, data: bytes, signature: str) -> bool: ...


@dataclass
class HMACSigner:
    secret: bytes
    signer_id: str = "sentra-hmac"

    @classmethod
    def from_env(
        cls,
        env_var: str = "SENTRA_EVIDENCE_SECRET",
        allow_dev_default: bool = False,
    ) -> "HMACSigner":
        """Resolve the HMAC signing secret from the environment, fail-closed.

        For forensic chain-of-custody the signing key MUST be operator-supplied.
        We raise ``RuntimeError`` when ``env_var`` is unset rather than falling
        back to a predictable secret. Tests and explicit local development
        flows may set ``allow_dev_default=True`` to opt in to a clearly-marked
        development-only key; this MUST NOT be enabled by production code
        paths.
        """
        secret = os.environ.get(env_var)
        if secret:
            return cls(secret=secret.encode())
        if allow_dev_default:
            return cls(
                secret=b"sentra-dev-only-do-not-use-in-prod",
                signer_id="sentra-hmac-dev",
            )
        raise RuntimeError(
            f"{env_var} is not set; refusing to sign evidence pack with a "
            "predictable key. Set the secret in the environment or pass "
            "signer_secret in the request payload."
        )

    def sign(self, data: bytes) -> str:
        mac = hmac.new(self.secret, data, hashlib.sha256).digest()
        return base64.b64encode(mac).decode()

    def verify(self, data: bytes, signature: str) -> bool:
        expected = self.sign(data)
        return hmac.compare_digest(expected, signature)


class YawarPublisher(Protocol):
    def publish(self, topic: str, payload: dict) -> None: ...


@dataclass
class YawarHTTPPublisher:
    base_url: str
    timeout_s: float = 2.0
    last_error: str | None = None

    def publish(self, topic: str, payload: dict) -> None:
        """POST the pack hash to ``{base_url}/events/{topic}``.

        Marks publication as failed on transport errors AND on non-2xx
        responses so callers can render a truthful "published" claim.
        """
        try:
            import httpx

            resp = httpx.post(
                f"{self.base_url.rstrip('/')}/events/{topic}",
                content=json.dumps(payload),
                headers={"content-type": "application/json"},
                timeout=self.timeout_s,
            )
            resp.raise_for_status()
        except Exception as exc:
            self.last_error = str(exc)


def build_pack(
    incident_id: str,
    items: Iterable[EvidenceItem],
    signer: Signer,
    pack_id: str | None = None,
    publisher: YawarPublisher | None = None,
    topic: str = "sentra.evidence",
    policy_gate: "Any | None" = None,
) -> SignedPack:
    """Hash-chain ``items``, sign the terminal pack hash, publish the pack hash.

    Evidence pack creation is a state-changing op: if ``policy_gate`` is
    provided, ``guard()`` is called first and a deny raises ``PolicyDeniedError``
    (fail-closed). Pack hash publication to the yawar topic is on by default
    when a ``publisher`` is supplied; callers wanting a dry-run can omit it.
    """

    if policy_gate is not None:
        policy_gate.guard(
            "sentra.evidence_pack.build",
            {"incident_id": incident_id, "signer_id": signer.signer_id},
        )

    items_t = tuple(items)
    if not items_t:
        raise ValueError("evidence pack must contain at least one item")
    pack_id = pack_id or f"pack-{int(time.time() * 1000):x}"

    chain: list[ChainEntry] = []
    prev = "0" * 64
    for seq, item in enumerate(items_t):
        ch = item.content_hash()
        chain_hash = _sha256_hex((prev + ch).encode())
        chain.append(
            ChainEntry(
                sequence=seq,
                item_id=item.id,
                content_hash=ch,
                prev_hash=prev,
                chain_hash=chain_hash,
            )
        )
        prev = chain_hash

    pack_hash = prev
    signature = signer.sign(pack_hash.encode())
    pack = SignedPack(
        pack_id=pack_id,
        incident_id=incident_id,
        created_at=time.time(),
        items=items_t,
        chain=tuple(chain),
        pack_hash=pack_hash,
        signature=signature,
        signer_id=signer.signer_id,
    )

    if publisher is not None:
        publisher.publish(
            topic,
            {
                "pack_id": pack.pack_id,
                "incident_id": pack.incident_id,
                "pack_hash": pack.pack_hash,
                "signature": pack.signature,
                "signer_id": pack.signer_id,
                "item_count": len(items_t),
                "created_at": pack.created_at,
            },
        )

    return pack
