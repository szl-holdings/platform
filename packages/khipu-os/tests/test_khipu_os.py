# SPDX-License-Identifier: Apache-2.0
# © 2026 Lutar, Stephen P. — SZL Holdings · ORCID 0009-0001-0110-4173
# Perplexity Computer Agent — KHIPU-OS pytest suite
"""Verifies each of the six autonomous loops independently + an integration tick test.
Run: pytest -q szl_khipu_os/tests/test_khipu_os.py"""
from __future__ import annotations

import random
import time

import pytest

from khipu_os import (
    KhipuDAG, Pruner, Checkpointer, Verifier, Linker, ConstellationPublisher,
    TamperProsecutor, KhipuDAGRunner, merkle_root, LOCKED,
)


def fresh_dag(**kw) -> KhipuDAG:
    return KhipuDAG(space="test", **kw)


# ---------------------------------------------------------------- core invariants
def test_locked_numbers_preserved():
    assert LOCKED["declarations"] == 749
    assert LOCKED["unique_axioms"] == 14
    assert LOCKED["tracked_sorries"] == 163
    assert LOCKED["yuyay_axes"] == 13
    assert LOCKED["replay_hash"].startswith("bacf5443")
    assert LOCKED["A2"] == "IsHomogeneous" and LOCKED["A4"] == "IsBounded"
    assert LOCKED["slsa"] == "L1" and LOCKED["lambda_uniqueness"] == "Conjecture 1"


def test_append_only_and_acyclic():
    dag = fresh_dag()
    a = dag.add_receipt("amaru", "ingest", {"x": 1})
    b = dag.add_receipt("sentra", "scan", {"y": 2}, parents=[a.receipt_id])
    assert a.receipt_id in dag.hot and b.receipt_id in dag.hot
    # forward edge (parent doesn't exist) is rejected (INV-DAG)
    with pytest.raises(ValueError):
        dag.add_receipt("rosie", "act", {}, parents=["does-not-exist"])
    # ids are unique / monotonic (INV-APPEND)
    assert len({r.receipt_id for r in dag.hot.values()}) == dag.hot_count()


def test_merkle_root_is_set_function_not_order():
    h = ["aa", "bb", "cc", "dd"]
    assert merkle_root(h) == merkle_root(list(reversed(h)))
    # any change to a leaf changes the root (collision-resistance, INV-MERKLE)
    assert merkle_root(h) != merkle_root(["aa", "bb", "cc", "ee"])
    assert merkle_root([]) == merkle_root([])  # well-defined empty root


# ---------------------------------------------------------------- self-prune
def test_self_prune_archives_stale_low_value_leaf():
    dag = fresh_dag(retain_last=1, stale_days=30)
    old = time.time() - 40 * 86400  # 40 days old
    stale = dag.add_receipt("amaru", "old", {}, yuyay=0.50, ts=old)
    recent = dag.add_receipt("amaru", "new", {}, yuyay=0.99)  # pins retain_last=1
    res = Pruner(dag).run(now=time.time())
    assert stale.receipt_id in res["archived_ids"]
    assert stale.receipt_id not in dag.hot
    assert stale.receipt_id in dag.archived_ids   # moved to cold, NOT deleted (INV-APPEND)
    assert recent.receipt_id in dag.hot


def test_self_prune_keeps_high_value_and_parents():
    dag = fresh_dag(retain_last=0, stale_days=30)
    old = time.time() - 40 * 86400
    parent = dag.add_receipt("amaru", "p", {}, yuyay=0.10, ts=old)        # has a child
    child = dag.add_receipt("amaru", "c", {}, parents=[parent.receipt_id], yuyay=0.99)
    highval = dag.add_receipt("amaru", "h", {}, yuyay=0.99, ts=old)       # high yuyay
    res = Pruner(dag).run(now=time.time())
    assert parent.receipt_id not in res["archived_ids"]   # has descendants → kept
    assert highval.receipt_id not in res["archived_ids"]  # yuyay ≥ floor → kept


# ---------------------------------------------------------------- self-checkpoint
def test_self_checkpoint_builds_signed_merkle_snapshot():
    dag = fresh_dag()
    for i in range(5):
        dag.add_receipt("amaru", "r", {"i": i})
    root_before = dag.current_root()
    cp = Checkpointer(dag).run(now=time.time())
    # the snapshot pins the committed set AT checkpoint time (before its own receipt)
    assert cp["root"] == root_before
    assert cp["leaf_count"] == 5
    assert len(dag.checkpoints) == 1
    # the DSSE envelope is signature-bearing
    env = Checkpointer(dag).build_envelope(time.time())
    assert env["signatures"] and env["signatures"][0]["sig"]


# ---------------------------------------------------------------- self-verify
def test_self_verify_passes_on_clean_dag():
    dag = fresh_dag()
    for i in range(20):
        dag.add_receipt("sentra", "scan", {"i": i})
    vr = Verifier(dag, rng=random.Random(0)).run(sample_n=100)
    assert vr["ok"] is True and vr["bad"] == []


def test_self_verify_detects_tamper():
    dag = fresh_dag()
    r = dag.add_receipt("sentra", "scan", {"i": 0})
    for i in range(1, 10):
        dag.add_receipt("sentra", "scan", {"i": i})
    # tamper: mutate payload without re-signing
    dag.hot[r.receipt_id].payload["i"] = 999
    vr = Verifier(dag, rng=random.Random(1)).run(sample_n=100)
    assert vr["ok"] is False
    assert any(b["id"] == r.receipt_id for b in vr["bad"])


# ---------------------------------------------------------------- self-prosecute (T22)
def test_self_prosecute_fires_T22_and_notifies():
    dag = fresh_dag()
    notes = []
    dag.subscribers.append(lambda n: notes.append(n))  # Wire-B subscriber
    r = dag.add_receipt("sentra", "scan", {"i": 0})
    for i in range(1, 5):
        dag.add_receipt("sentra", "scan", {"i": i})
    dag.hot[r.receipt_id].payload["i"] = 42  # tamper
    vr = Verifier(dag, rng=random.Random(2)).run(sample_n=100)
    assert not vr["ok"]
    tp = TamperProsecutor(dag).run(vr)
    assert tp["tripwire"] == "T22" and tp["fired"]
    assert tp["subscribers_notified"] == 1
    assert notes and notes[0]["tripwire"] == "T22"
    assert any(e["tripwire"] == "T22" for e in dag.hukulla.fired)


def test_T22_does_not_renumber_locked_core():
    dag = fresh_dag()
    assert set(dag.hukulla.CORE.keys()) == {f"T{n:02d}" for n in range(1, 11)}
    assert "T22" in dag.hukulla.extensions
    with pytest.raises(ValueError):
        dag.hukulla.register("T01", "attempt to redefine locked core")


# ---------------------------------------------------------------- self-link-suggest
def test_self_link_suggest_bayesian_parents():
    dag = fresh_dag()
    base = time.time() - 100
    p1 = dag.add_receipt("amaru", "memory ingest vector store", {"topic": "alpha"}, ts=base)
    p2 = dag.add_receipt("rosie", "unrelated weather report", {"topic": "weather"}, ts=base + 1)
    # a new amaru receipt similar to p1 in content + organ
    newr = dag.add_receipt("amaru", "memory ingest vector store", {"topic": "alpha2"},
                           ts=base + 2)
    res = Linker(dag, temporal_halflife_s=3600).run(newr, top_k=2)
    sug = res["suggestions"]
    assert sug, "expected at least one parent suggestion"
    # p1 (same organ + similar content) should outrank p2
    ids = [s["parent_id"] for s in sug]
    assert p1.receipt_id in ids
    if p2.receipt_id in ids:
        rank = {s["parent_id"]: s["posterior"] for s in sug}
        assert rank[p1.receipt_id] >= rank[p2.receipt_id]


def test_link_suggest_never_proposes_forward_edges():
    dag = fresh_dag()
    future = dag.add_receipt("amaru", "future", {}, ts=time.time() + 1000)
    newr = dag.add_receipt("amaru", "now", {}, ts=time.time())
    sug = Linker(dag).suggest(newr, top_k=5)
    assert all(s["parent_id"] != future.receipt_id for s in sug)


# ---------------------------------------------------------------- self-publish
def test_self_publish_streams_deltas_only():
    dag = fresh_dag()
    buf = []
    pub = ConstellationPublisher(dag, sink=buf.append)
    a = dag.add_receipt("amaru", "r1", {})
    pub.run()
    first_added = buf[-1]["added"]
    assert a.receipt_id in first_added
    # second publish with no new receipts → empty added delta
    pub2 = ConstellationPublisher(dag, sink=buf.append)
    pub2.run()
    assert buf[-1]["added"] == []  # delta only, not full snapshot


# ---------------------------------------------------------------- integration
def test_integration_tick_runs_all_loops_and_self_signs():
    dag = fresh_dag(checkpoint_interval_s=0, verify_interval_s=0)  # force all sub-loops
    for i in range(30):
        dag.add_receipt("amaru", "seed", {"i": i})
    n0 = dag.hot_count()
    summary = dag.tick(now=time.time())
    assert "pruned" in summary
    assert "checkpoint" in summary       # forced (interval 0)
    assert "verify" in summary           # forced
    assert summary["verify"]["ok"] is True
    assert "publish" in summary
    assert summary["tick_receipt"]       # the DAG signed its own tick (recursive)
    assert dag.hot_count() >= n0         # tick adds self-receipts (append-only growth)
    assert summary["root"] == dag.current_root()


def test_runner_background_thread():
    runner = KhipuDAGRunner(space="test", tick_s=0.05)
    runner.dag.checkpoint_interval_s = 0
    runner.dag.verify_interval_s = 0
    for i in range(10):
        runner.dag.add_receipt("sentra", "seed", {"i": i})
    runner.start()
    time.sleep(0.25)
    runner.stop()
    st = runner.status()
    assert st["ticks_run"] >= 1
    assert st["running"] is False
    assert st["merkle_root"] == runner.dag.current_root()
