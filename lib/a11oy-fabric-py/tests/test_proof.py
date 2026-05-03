"""PCPR hash-chain tests."""

from __future__ import annotations

import pytest

from a11oy_fabric_py.proof import (
    ProofChain,
    ProofRecord,
    build_proof_chain,
    fingerprint_inputs,
    verify_proof_chain,
)


def _build() -> ProofChain:
    return build_proof_chain(
        pack_slug="test-pack",
        pack_version="1.0.0",
        run_id="run-001",
        input_fingerprint=fingerprint_inputs({"a": 1}),
        entity_ids=[("signal", "sig-1"), ("action", "act-1")],
        extra={"signalCount": 1},
    )


def test_chain_builds_and_verifies() -> None:
    chain = _build()
    assert verify_proof_chain(chain).ok
    assert chain.headHash == chain.records[-1].hash


def test_chain_is_deterministic_for_same_inputs() -> None:
    a = _build()
    b = _build()
    # Same inputs MUST produce identical hashes record-for-record.
    assert a.headHash == b.headHash
    assert [r.hash for r in a.records] == [r.hash for r in b.records]


def test_tampering_with_payload_breaks_chain() -> None:
    chain = _build()
    chain.records[1].payload["id"] = "sig-2"  # mutate
    res = verify_proof_chain(chain)
    assert not res.ok
    assert res.brokenAtSequence == 1


def test_tampering_with_head_hash_breaks_chain() -> None:
    chain = _build()
    chain.headHash = "sha256:0" * 1
    res = verify_proof_chain(chain)
    assert not res.ok


def test_empty_chain_fails() -> None:
    chain = ProofChain(
        packSlug="x",
        packVersion="1",
        runId="r",
        inputFingerprint="sha256:0",
        records=[],
        headHash="sha256:0",
    )
    res = verify_proof_chain(chain)
    assert not res.ok
    assert res.reason == "empty chain"


def test_inserted_record_breaks_prev_link() -> None:
    chain = _build()
    chain.records.insert(
        1,
        ProofRecord(
            sequence=99,
            label="run.entity",
            payload={"kind": "signal", "id": "sig-evil"},
            prev=chain.records[0].hash,
            hash="sha256:" + "f" * 64,
        ),
    )
    res = verify_proof_chain(chain)
    assert not res.ok


@pytest.mark.parametrize(
    "inputs_a,inputs_b,should_match",
    [
        ({"a": 1, "b": 2}, {"b": 2, "a": 1}, True),  # key order ignored
        ({"a": 1}, {"a": 2}, False),
    ],
)
def test_input_fingerprint_canonicalisation(inputs_a, inputs_b, should_match) -> None:
    fa = fingerprint_inputs(inputs_a)
    fb = fingerprint_inputs(inputs_b)
    assert (fa == fb) is should_match
