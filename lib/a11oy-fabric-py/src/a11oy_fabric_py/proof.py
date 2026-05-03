"""Proof-Carrying Pack Run (PCPR).

Every ``run`` emits the JSON report **and** a ``.proof.json`` companion that
hash-chains (sha256) the input fingerprint, the engine version, the pack
version, and every emitted entity ID. ``verify`` re-hashes and reports drift.
This extends the existing TS ``ProofPacket`` idea up to the pack-run boundary.
"""

from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from typing import Any, Iterable

from pydantic import BaseModel, Field

from .types import ENGINE_VERSION


PCPR_VERSION = "1.0"


def _sha256_hex(data: str) -> str:
    return hashlib.sha256(data.encode("utf-8")).hexdigest()


def canonical_json(obj: Any) -> str:
    """Deterministic JSON encoding used for every hash input."""

    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def fingerprint_inputs(inputs: dict[str, Any]) -> str:
    """sha256 over a canonical JSON encoding of pack inputs."""

    return f"sha256:{_sha256_hex(canonical_json(inputs))}"


class ProofRecord(BaseModel):
    """One link in the PCPR hash chain.

    ``hash`` is sha256 over ``canonical_json({prev, payload})``. The first
    record uses ``prev = None`` so a single-record chain is well defined.
    """

    sequence: int
    label: str
    payload: dict[str, Any]
    prev: str | None
    hash: str


class ProofChain(BaseModel):
    """The ``.proof.json`` companion artifact."""

    pcprVersion: str = PCPR_VERSION
    engineVersion: str = ENGINE_VERSION
    packSlug: str
    packVersion: str
    runId: str
    inputFingerprint: str
    issuedAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    records: list[ProofRecord]
    headHash: str

    def model_dump_json_pretty(self) -> str:
        return self.model_dump_json(indent=2)


def build_proof_chain(
    *,
    pack_slug: str,
    pack_version: str,
    run_id: str,
    input_fingerprint: str,
    entity_ids: Iterable[tuple[str, str]],
    extra: dict[str, Any] | None = None,
) -> ProofChain:
    """Build a deterministic hash chain over the pack run.

    Records appended in order:
      1. ``run.preamble`` — engine/pack identity + input fingerprint.
      2. ``run.entity`` — one record per emitted (kind, id) pair, sorted
         deterministically by (kind, id) so chain reconstruction is stable.
      3. ``run.epilogue`` — optional caller-provided summary payload.
    """

    records: list[ProofRecord] = []

    def append(label: str, payload: dict[str, Any]) -> None:
        prev = records[-1].hash if records else None
        body = canonical_json({"prev": prev, "payload": payload, "label": label})
        h = f"sha256:{_sha256_hex(body)}"
        records.append(
            ProofRecord(
                sequence=len(records),
                label=label,
                payload=payload,
                prev=prev,
                hash=h,
            )
        )

    append(
        "run.preamble",
        {
            "engineVersion": ENGINE_VERSION,
            "packSlug": pack_slug,
            "packVersion": pack_version,
            "runId": run_id,
            "inputFingerprint": input_fingerprint,
        },
    )

    for kind, entity_id in sorted(entity_ids):
        append("run.entity", {"kind": kind, "id": entity_id})

    if extra:
        append("run.epilogue", extra)

    return ProofChain(
        packSlug=pack_slug,
        packVersion=pack_version,
        runId=run_id,
        inputFingerprint=input_fingerprint,
        records=records,
        headHash=records[-1].hash,
    )


class ProofVerification(BaseModel):
    ok: bool
    reason: str | None = None
    expectedHeadHash: str | None = None
    actualHeadHash: str | None = None
    brokenAtSequence: int | None = None


def verify_proof_chain(chain: ProofChain) -> ProofVerification:
    """Re-hash the records and confirm the chain is intact."""

    if not chain.records:
        return ProofVerification(ok=False, reason="empty chain")

    prev: str | None = None
    for rec in chain.records:
        if rec.prev != prev:
            return ProofVerification(
                ok=False,
                reason=f"prev mismatch at seq={rec.sequence}",
                brokenAtSequence=rec.sequence,
            )
        body = canonical_json({"prev": prev, "payload": rec.payload, "label": rec.label})
        expected = f"sha256:{_sha256_hex(body)}"
        if expected != rec.hash:
            return ProofVerification(
                ok=False,
                reason=f"hash mismatch at seq={rec.sequence}",
                brokenAtSequence=rec.sequence,
            )
        prev = rec.hash

    if prev != chain.headHash:
        return ProofVerification(
            ok=False,
            reason="headHash does not match final record",
            expectedHeadHash=prev,
            actualHeadHash=chain.headHash,
        )

    return ProofVerification(ok=True, expectedHeadHash=prev, actualHeadHash=chain.headHash)
