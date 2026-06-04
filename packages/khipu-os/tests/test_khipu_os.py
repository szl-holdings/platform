# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings · Yachay — Doctrine v11 LOCKED: 749 declarations / 14 unique axioms / 163 sorries.
# git trailer: Perplexity Computer Agent
"""Smoke + API tests for the khipu-os substrate package."""
import hashlib
import khipu_os

def _h(x):
    return hashlib.sha256(x).hexdigest()

def test_merkle_root_deterministic():
    leaves = [_h(b"a"), _h(b"b"), _h(b"c")]
    assert khipu_os.merkle_root(leaves) == khipu_os.merkle_root(leaves)

def test_merkle_proof_verifies():
    leaves = [_h(b"a"), _h(b"b"), _h(b"c"), _h(b"d")]
    root = khipu_os.merkle_root(leaves)
    target = leaves[1]
    proof = khipu_os.merkle_proof(leaves, target)
    assert proof is not None
    assert khipu_os.verify_merkle_proof(target, proof, root)

def test_dag_and_erasure_present():
    assert khipu_os.KhipuDAG is not None
    assert khipu_os.ReedSolomonErasure is not None
