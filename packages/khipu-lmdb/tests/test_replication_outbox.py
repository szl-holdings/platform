# SPDX-License-Identifier: Apache-2.0
"""Real local LMDB transactions and processes; no hosted/transport claim."""
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys

import pytest

from khipu_lmdb import KhipuLMDB
from khipu_lmdb import core, outbox

PEER = "fixture-peer"
BINDING = "a" * 64
TEST_MAP_SIZE = 8 * 1024 * 1024


@pytest.fixture
def store(tmp_path):
    instance = KhipuLMDB(str(tmp_path / "source"), organ="producer", ns="fixture", map_size=TEST_MAP_SIZE)
    try:
        yield instance
    finally:
        instance.close()


def contents(store):
    with store._env.begin() as txn:
        return dict(txn.cursor())


def append(store, count=3):
    return [store.append("event", {"index": i, "nested": ["Khipu \u03bb", None, True]})
            for i in range(count)]


def test_read_never_registers_or_mutates_and_empty_prepare_binds(store):
    before = contents(store)
    assert store.replication_outbound_state(PEER, BINDING) is None
    assert contents(store) == before
    assert store.prepare_replication_batch(PEER, BINDING) is None
    bound = contents(store)
    assert store.replication_outbound_state(PEER, BINDING)["next_seq"] == 0
    assert contents(store) == bound
    with pytest.raises(ValueError, match="BINDING_CONFLICT"):
        store.prepare_replication_batch(PEER, "b" * 64)
    assert contents(store) == bound


def test_pending_replays_exact_bytes_until_exact_ack_and_never_skips(store):
    receipts = append(store, 5)
    before = contents(store)
    batch = store.prepare_replication_batch(PEER, BINDING, limit=2)
    assert (batch["first_seq"], batch["next_seq"]) == (0, 2)
    assert batch["batch_id"] == hashlib.sha256(batch["body"]).hexdigest()
    assert json.loads(batch["body"])["receipts"] == receipts[:2]
    for seq in range(2):
        assert before[core._seq_key(seq)] in batch["body"]
    store.append("later", {"appended": True})
    pending = contents(store)
    assert store.prepare_replication_batch(PEER, BINDING, limit=1, max_bytes=1024) == batch
    assert contents(store) == pending
    state = store.replication_outbound_state(PEER, BINDING)
    assert state["next_seq"] == 0 and state["pending"]["next_seq"] == 2
    state["pending"]["next_seq"] = 900  # returned objects cannot mutate persisted state
    with pytest.raises(ValueError, match="ACK_MISMATCH"):
        store.acknowledge_replication_batch(PEER, BINDING, "0" * 64)
    assert contents(store) == pending
    acknowledged = store.acknowledge_replication_batch(PEER, BINDING, batch["batch_id"])
    assert acknowledged["next_seq"] == 2 and acknowledged["pending"] is None
    assert acknowledged["acknowledged_digest"] == receipts[1]["digest"]
    before_replay = contents(store)
    with pytest.raises(ValueError, match="ACK_MISMATCH"):
        store.acknowledge_replication_batch(PEER, BINDING, batch["batch_id"])
    assert contents(store) == before_replay
    next_batch = store.prepare_replication_batch(PEER, BINDING, limit=2)
    assert (next_batch["first_seq"], next_batch["next_seq"]) == (2, 4)
    assert next_batch["batch_id"] != batch["batch_id"]
    assert all(contents(store)[key] == value for key, value in before.items()
               if key.startswith((b"seq:", b"rcpt:")))


def test_peers_are_independent_and_bound_to_source_identity(store):
    append(store)
    first = store.prepare_replication_batch(PEER, BINDING)
    second = store.prepare_replication_batch("other-peer", BINDING)
    assert first["batch_id"] != second["batch_id"]
    store.acknowledge_replication_batch(PEER, BINDING, first["batch_id"])
    assert store.replication_outbound_state("other-peer", BINDING)["next_seq"] == 0
    before = contents(store)
    for method in (store.replication_outbound_state, store.prepare_replication_batch):
        with pytest.raises(ValueError, match="BINDING_CONFLICT"):
            method(PEER, "b" * 64)
    with pytest.raises(ValueError, match="BINDING_CONFLICT"):
        store.acknowledge_replication_batch("other-peer", "b" * 64, second["batch_id"])
    store.ns = "other"
    try:
        with pytest.raises(ValueError, match="BINDING_CONFLICT"):
            store.replication_outbound_state(PEER, BINDING)
    finally:
        store.ns = "fixture"
    assert contents(store) == before


@pytest.mark.parametrize("peer,binding", [("", BINDING), ("x" * 129, BINDING),
    ("../peer", BINDING), (True, BINDING), ("\u03bb", BINDING), (PEER, "A" * 64),
    (PEER, "0" * 63), (PEER, None)])
def test_invalid_binding_never_writes(store, peer, binding):
    before = contents(store)
    for method in (store.replication_outbound_state, store.prepare_replication_batch):
        with pytest.raises(ValueError, match="INVALID_BINDING"):
            method(peer, binding)
    assert contents(store) == before


@pytest.mark.parametrize("kwargs", [{"limit": 0}, {"limit": True}, {"limit": 1001},
    {"max_bytes": 1023}, {"max_bytes": True}, {"max_bytes": outbox.MAX_BATCH_BYTES + 1}])
def test_invalid_limits_never_write(store, kwargs):
    before = contents(store)
    with pytest.raises(ValueError, match="INVALID_LIMIT"):
        store.prepare_replication_batch(PEER, BINDING, **kwargs)
    assert contents(store) == before


@pytest.mark.parametrize("batch_id", [None, True, "", "f" * 63, "A" * 64])
def test_invalid_ack_never_registers_or_changes_pending(store, batch_id):
    append(store, 1)
    before = contents(store)
    with pytest.raises(ValueError, match="INVALID_ACK"):
        store.acknowledge_replication_batch(PEER, BINDING, batch_id)
    assert contents(store) == before
    store.prepare_replication_batch(PEER, BINDING)
    pending = contents(store)
    with pytest.raises(ValueError, match="INVALID_ACK"):
        store.acknowledge_replication_batch(PEER, BINDING, batch_id)
    assert contents(store) == pending


def test_unknown_peer_ack_cannot_create_a_cursor(store):
    append(store)
    before = contents(store)
    with pytest.raises(ValueError, match="ACK_MISMATCH"):
        store.acknowledge_replication_batch(PEER, BINDING, "f" * 64)
    assert contents(store) == before


def test_exact_byte_boundary_includes_envelope_and_commas(store):
    for index in range(3):
        store.append("event", {"index": index, "text": "x" * 1000})
    full = store.prepare_replication_batch("reference", BINDING)
    # Equal-length peer IDs give equal-length headers without changing receipts.
    exact = store.prepare_replication_batch("candidate", BINDING, max_bytes=len(full["body"]))
    assert exact["next_seq"] == 3
    assert len(exact["body"]) == len(full["body"])
    smaller = store.prepare_replication_batch("one-short", BINDING,
                                              max_bytes=len(full["body"]) - 1)
    assert smaller["next_seq"] == 2


def test_batch_byte_limit_is_exact_and_oversized_first_record_never_skipped(store):
    for index in range(3):
        store.append("event", {"index": index, "text": "x" * 1000})
    before = contents(store)
    with pytest.raises(ValueError, match="RECORD_EXCEEDS_BATCH_LIMIT"):
        store.prepare_replication_batch(PEER, BINDING, max_bytes=1024)
    assert contents(store) == before
    batch = store.prepare_replication_batch(PEER, BINDING, max_bytes=2200)
    assert batch["next_seq"] == 1 and len(batch["body"]) <= 2200


def test_peer_count_is_bounded_and_existing_peer_can_continue(store, monkeypatch):
    monkeypatch.setattr(outbox, "MAX_PEERS", 2)
    store.prepare_replication_batch("first", BINDING)
    store.prepare_replication_batch("second", BINDING)
    before = contents(store)
    with pytest.raises(ValueError, match="PEER_LIMIT"):
        store.prepare_replication_batch("third", BINDING)
    assert contents(store) == before
    append(store, 1)
    assert store.prepare_replication_batch("first", BINDING)["next_seq"] == 1


@pytest.mark.parametrize("corruption", ["duplicate", "nonfinite", "deep", "oversize", "cursor",
    "bool-cursor", "unknown", "missing-pending", "body", "wrong-end", "wrong-id", "orphan"])
def test_corrupt_state_refuses_all_operations_without_writing(store, corruption):
    append(store)
    batch = store.prepare_replication_batch(PEER, BINDING)
    state_key, pending_key = outbox._identity(store, PEER, BINDING)
    with store._env.begin(write=True) as txn:
        state = json.loads(txn.get(state_key))
        if corruption == "duplicate":
            txn.put(state_key, b'{"schema":1,"schema":1}')
        elif corruption == "nonfinite":
            txn.put(state_key, b'{"schema":1e999}')
        elif corruption == "deep":
            txn.put(state_key, b"[" * 1500 + b"]" * 1500)
        elif corruption == "oversize":
            txn.put(state_key, b"x" * (outbox.MAX_STATE_BYTES + 1))
        elif corruption == "missing-pending":
            txn.delete(pending_key)
        elif corruption == "body":
            txn.put(pending_key, batch["body"].replace(b'"event"', b'"other"'))
        elif corruption == "orphan":
            txn.delete(state_key)
        else:
            if corruption == "cursor":
                state["next_seq"] = 4
            elif corruption == "bool-cursor":
                state["next_seq"] = False
            elif corruption == "unknown":
                state["extra"] = "unknown"
            elif corruption == "wrong-end":
                state["pending"]["next_seq"] = 2
            else:
                state["pending"]["batch_id"] = "f" * 64
            txn.put(state_key, core._finite_canon(state))
    before = contents(store)
    for method in (store.replication_outbound_state, store.prepare_replication_batch):
        with pytest.raises(ValueError, match="OUTBOUND_"):
            method(PEER, BINDING)
    with pytest.raises(ValueError, match="OUTBOUND_"):
        store.acknowledge_replication_batch(PEER, BINDING, batch["batch_id"])
    assert contents(store) == before


@pytest.mark.parametrize("corruption", ["missing", "auxiliary", "payload", "count", "head", "prev", "large", "nan"])
def test_corrupt_source_refuses_without_outbound_mutation(store, corruption):
    append(store)
    batch = store.prepare_replication_batch(PEER, BINDING, limit=2)
    with store._env.begin(write=True) as txn:
        key = core._seq_key(1)
        receipt = json.loads(txn.get(key))
        if corruption == "missing":
            txn.delete(key)
        elif corruption == "count":
            txn.put(b"meta:count", b"03")
        elif corruption == "head":
            txn.put(b"meta:head", b"f" * 64)
        else:
            if corruption == "auxiliary":
                receipt["ts"] += 1
            elif corruption == "payload":
                receipt["payload"] = {"changed": True}
            elif corruption == "prev":
                receipt["prev"] = "f" * 64
            elif corruption == "large":
                receipt["oversize"] = "x" * core._MAX_ORIGIN_BYTES
            else:
                receipt["ts"] = float("nan")
            txn.put(key, core._canon(receipt))
    before = contents(store)
    with pytest.raises(ValueError, match="OUTBOUND_"):
        store.prepare_replication_batch(PEER, BINDING)
    with pytest.raises(ValueError, match="OUTBOUND_"):
        store.acknowledge_replication_batch(PEER, BINDING, batch["batch_id"])
    assert contents(store) == before


def test_valid_receipt_hash_with_broken_predecessor_is_rejected(store):
    append(store)
    with store._env.begin(write=True) as txn:
        receipt = json.loads(txn.get(core._seq_key(1)))
        receipt["prev"] = "f" * 64
        fields = ("organ", "ns", "seq", "action", "payload_digest", "prev")
        receipt["digest"] = core._digest({key: receipt[key] for key in fields})
        txn.put(core._seq_key(1), core._finite_canon(receipt))
    before = contents(store)
    with pytest.raises(ValueError, match="SOURCE_INVALID"):
        store.prepare_replication_batch(PEER, BINDING)
    assert contents(store) == before


def test_rehashed_pending_body_cannot_replace_stored_receipt_bytes(store):
    append(store)
    batch = store.prepare_replication_batch(PEER, BINDING)
    state_key, pending_key = outbox._identity(store, PEER, BINDING)
    with store._env.begin(write=True) as txn:
        state = json.loads(txn.get(state_key))
        body = json.loads(batch["body"])
        body["receipts"][0]["ts"] += 1  # Auxiliary timestamp is not receipt-digest-bound.
        raw = core._finite_canon(body)
        state["pending"]["batch_id"] = hashlib.sha256(raw).hexdigest()
        state["pending"]["bytes"] = len(raw)
        txn.put(state_key, core._finite_canon(state))
        txn.put(pending_key, raw)
    before = contents(store)
    with pytest.raises(ValueError, match="CORRUPT_STATE"):
        store.prepare_replication_batch(PEER, BINDING)
    with pytest.raises(ValueError, match="CORRUPT_STATE"):
        store.acknowledge_replication_batch(PEER, BINDING, state["pending"]["batch_id"])
    assert contents(store) == before


def test_receiver_index_and_receipts_unchanged_by_outbox(store, tmp_path):
    source = KhipuLMDB(str(tmp_path / "foreign"), organ="foreign", ns="fixture", map_size=TEST_MAP_SIZE)
    try:
        origin = source.append("foreign", {"nested": True})
    finally:
        source.close()
    store.append_replicated(origin)
    before = contents(store)
    batch = store.prepare_replication_batch(PEER, BINDING)
    store.acknowledge_replication_batch(PEER, BINDING, batch["batch_id"])
    assert all(contents(store)[key] == value for key, value in before.items())
    assert store.append_replicated(origin)["duplicate"] is True


def child_env():
    return {**os.environ, "PYTHONPATH": str(Path(__file__).resolve().parents[1])}


CHILD = '''
import json, os, sys
from khipu_lmdb import KhipuLMDB
store = KhipuLMDB(sys.argv[1], organ="producer", ns="fixture", map_size=8 * 1024 * 1024)
operation, crash_at, batch_id = sys.argv[2], sys.argv[3], sys.argv[4]
real_env = store._env
class Transaction:
    def __enter__(self):
        self.txn = real_env.begin(write=True)
        self.writes = 0
        return self
    def __getattr__(self, name):
        return getattr(self.txn, name)
    def write(self, operation, *args, **kwargs):
        result = getattr(self.txn, operation)(*args, **kwargs)
        self.writes += 1
        if crash_at == str(self.writes):
            os._exit(73)
        return result
    def put(self, *args, **kwargs):
        return self.write("put", *args, **kwargs)
    def delete(self, *args, **kwargs):
        return self.write("delete", *args, **kwargs)
    def __exit__(self, kind, value, tb):
        if kind is None:
            if crash_at == "before-commit":
                os._exit(73)
            self.txn.commit()
            if crash_at == "after-commit":
                os._exit(73)
        else:
            self.txn.abort()
class Environment:
    def begin(self, **kwargs):
        return Transaction() if kwargs.get("write") else real_env.begin(**kwargs)
store._env = Environment()
if operation == "prepare":
    result = store.prepare_replication_batch("fixture-peer", "a" * 64, limit=2)
    result["body"] = result["body"].decode()
else:
    result = store.acknowledge_replication_batch("fixture-peer", "a" * 64, batch_id)
print(json.dumps(result))
'''


@pytest.mark.parametrize("operation", ["prepare", "ack"])
@pytest.mark.parametrize("crash_at", ["1", "2", "before-commit", "after-commit"])
def test_real_process_exit_is_atomic_and_reopen_recovers(tmp_path, operation, crash_at):
    path = str(tmp_path / "crash")
    original = KhipuLMDB(path, organ="producer", ns="fixture", map_size=TEST_MAP_SIZE)
    append(original)
    batch = original.prepare_replication_batch(PEER, BINDING, limit=2) if operation == "ack" else None
    before = contents(original)
    original.close()
    child = subprocess.run([sys.executable, "-c", CHILD, path, operation, crash_at,
                            batch["batch_id"] if batch else ""], env=child_env(),
                           text=True, capture_output=True, timeout=20)
    assert child.returncode == 73, child.stderr
    reopened = KhipuLMDB(path, organ="producer", ns="fixture", map_size=TEST_MAP_SIZE)
    try:
        if crash_at != "after-commit":
            assert contents(reopened) == before
        state = reopened.replication_outbound_state(PEER, BINDING)
        if operation == "ack":
            assert state["next_seq"] == (2 if crash_at == "after-commit" else 0)
            if crash_at != "after-commit":
                assert reopened.prepare_replication_batch(PEER, BINDING) == batch
        else:
            prepared = reopened.prepare_replication_batch(PEER, BINDING, limit=2)
            assert prepared["next_seq"] == 2
            assert reopened.prepare_replication_batch(PEER, BINDING) == prepared
        assert reopened.verify()["ok"] is True
    finally:
        reopened.close()


def test_concurrent_preparers_and_lost_ack_replay_same_persisted_bytes(tmp_path):
    path = str(tmp_path / "concurrent")
    source = KhipuLMDB(path, organ="producer", ns="fixture", map_size=TEST_MAP_SIZE)
    append(source)
    source.close()
    command = [sys.executable, "-c", CHILD, path, "prepare", "none", ""]
    children = [subprocess.Popen(command, env=child_env(), text=True,
                                stdout=subprocess.PIPE, stderr=subprocess.PIPE) for _ in range(4)]
    results = []
    try:
        for child in children:
            output, error = child.communicate(timeout=20)
            assert child.returncode == 0, error
            results.append(json.loads(output))
    finally:
        for child in children:
            if child.poll() is None:
                child.kill()
                child.communicate(timeout=5)
    assert all(result == results[0] for result in results)
    # Receiver accepted bytes, but no acknowledgment reached the sender.
    replay = subprocess.run(command, env=child_env(), text=True, capture_output=True, timeout=20)
    assert replay.returncode == 0, replay.stderr
    assert json.loads(replay.stdout) == results[0]
