# SPDX-License-Identifier: Apache-2.0
"""Replay-hash honesty + FastAPI endpoint smoke (real handlers, real JSON)."""
from __future__ import annotations

import hashlib

import pytest

from puriq_os.replay_hash import (
    check_replay_hash, local_gate_hash, LOCKED_REPLAY_HASH,
)


def test_replay_blocks_when_artifact_absent():
    chk = check_replay_hash(None)
    assert chk.verified is False
    assert chk.block is True
    assert chk.reason == "artifact_not_present"
    assert chk.expected == LOCKED_REPLAY_HASH


def test_replay_blocks_on_mismatch(tmp_path):
    art = tmp_path / "fake_yuyay_v3.bin"
    art.write_bytes(b"not the real artifact")
    chk = check_replay_hash(str(art))
    assert chk.verified is False
    assert chk.block is True
    assert chk.reason == "hash_mismatch"


def test_replay_verifies_only_on_true_match(tmp_path):
    # construct an artifact whose sha256 IS the locked hash? impossible to forge;
    # instead prove the comparison logic by monkey-checking equality path.
    # We craft a file and assert that a non-matching hash never flips verified.
    art = tmp_path / "x.bin"
    art.write_bytes(b"abc")
    chk = check_replay_hash(str(art))
    assert (chk.verified is True) == (hashlib.sha256(b"abc").hexdigest() == LOCKED_REPLAY_HASH)
    assert chk.verified is False  # sanity: sha256("abc") != locked


def test_local_gate_hash_stable():
    assert local_gate_hash() == local_gate_hash()
    assert len(local_gate_hash()) == 64


def test_fastapi_endpoints():
    fastapi_testclient = pytest.importorskip("fastapi.testclient")
    from fastapi.testclient import TestClient
    from puriq_os.app import app
    client = TestClient(app)

    r = client.get("/v1/puriq/health")
    assert r.status_code == 200
    assert r.json()["status"] == "alive"
    assert len(r.json()["organs"]) == 12

    r = client.get("/v1/puriq/replay")
    assert r.status_code == 200
    assert r.json()["block"] is True  # honest: blocked until real artifact mounted

    r = client.get("/v1/puriq/Amaru/loop")
    assert r.status_code == 200
    body = r.json()
    assert body["organ"] == "Amaru"
    assert body["tick"] >= 1
    assert "receipt" in body

    r = client.get("/v1/puriq/status")
    assert r.status_code == 200
    assert len(r.json()["organs"]) == 12

    r = client.get("/agentic")
    assert r.status_code == 200
    assert "PURIQ-OS" in r.text

    r = client.get("/v1/puriq/NotAnOrgan/loop")
    assert r.status_code == 404
