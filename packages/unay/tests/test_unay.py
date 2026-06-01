# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings · Yachay — Doctrine v11 LOCKED: 749 declarations / 14 unique axioms / 163 sorries.
# git trailer: Perplexity Computer Agent
"""Tests for the UNAY receipt-keyed semantic memory store."""
import unay


def test_embed_is_deterministic_and_normalised():
    v1 = unay.embed("ayni reciprocity")
    v2 = unay.embed("ayni reciprocity")
    assert v1 == v2
    norm = sum(x * x for x in v1) ** 0.5
    assert abs(norm - 1.0) < 1e-6 or norm == 0.0


def test_remember_and_recall_in_memory():
    store = unay.UnayStore(path=":memory:", enable_vss=False)
    store.remember("the cat sat on the mat", meta={"topic": "felines"})
    store.remember("reciprocity is the heart of ayni", meta={"topic": "doctrine"})
    hits = store.recall("ayni reciprocity", k=1)
    assert hits, "recall should return at least one memory"
    store.close()


def test_chain_verifies():
    store = unay.UnayStore(path=":memory:", enable_vss=False)
    store.remember("memory one")
    store.remember("memory two")
    report = store.verify_chain()
    assert report.get("ok", report.get("broken_at") in (None, -1))
    store.close()
