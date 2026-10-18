# SPDX-License-Identifier: Apache-2.0
"""Actual LMDB transaction/reopen tests; no provider or sender-recovery claim."""
import copy
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys

import pytest

from khipu_lmdb import KhipuLMDB
from khipu_lmdb import core


@pytest.fixture
def origin(tmp_path):
    store = KhipuLMDB(str(tmp_path / "producer"), organ="producer", ns="fixture")
    try:
        return store.append("fixture", {"nested": ["Khipu \u03bb", None, True, 2]})
    finally:
        store.close()


@pytest.fixture
def mirror(tmp_path):
    store = KhipuLMDB(str(tmp_path / "mirror"), organ="khipu-repl", ns="fixture")
    try:
        yield store
    finally:
        store.close()


def contents(store):
    with store._env.begin() as txn:
        return dict(txn.cursor())


def test_append_preserves_existing_canonical_receipt_bytes(mirror, monkeypatch):
    monkeypatch.setattr(core.time, "time", lambda: 123.5)
    payload = {"nested": ["\u03bb", True, 0.5]}
    canon = lambda value: json.dumps(value, sort_keys=True, separators=(",", ":")).encode()
    body = {"organ": "khipu-repl", "ns": "fixture", "seq": 0, "action": "fixture",
            "payload_digest": hashlib.sha3_256(canon(payload)).hexdigest(), "prev": "0" * 64}
    expected = {**body, "payload": payload, "ts": 123.5,
                "digest": hashlib.sha3_256(canon(body)).hexdigest(),
                "signature": "DSSE_PLACEHOLDER", "chain_verified": True}
    assert mirror.append("fixture", payload) == expected
    assert contents(mirror)[b"seq:00000000000000000000"] == canon(expected)


def test_exact_replay_returns_first_wrapper_without_new_receipt(mirror, origin):
    first = mirror.append_replicated(origin)
    before = contents(mirror)
    second = mirror.append_replicated(copy.deepcopy(origin))
    assert first["duplicate"] is False and second["duplicate"] is True
    assert first["receipt"] == second["receipt"]
    assert contents(mirror) == before
    assert mirror.stats()["entries"] == 1 and mirror.verify()["ok"] is True
    assert before[b"origin:" + origin["digest"].encode()] == b"0"
    assert before[b"meta:origin-indexed-count"] == b"1"


@pytest.mark.parametrize("payload", [
    {2: "two", 10: "ten"},
    {"nested": [{2: "two", 10: "ten"}]},
    {"nested": ({False: "false", True: "true"},)},
])
def test_non_string_payload_keys_rejected_before_any_migration(tmp_path, mirror, origin, payload):
    producer = KhipuLMDB(str(tmp_path / "non-string-producer"))
    try:
        invalid = producer.append("fixture", payload)
    finally:
        producer.close()
    mirror.append("replicated", {"origin": origin})
    before = contents(mirror)
    with pytest.raises(ValueError, match="REPLICATION_INVALID_JSON"):
        mirror.append_replicated(invalid)
    assert contents(mirror) == before
    assert b"meta:origin-indexed-count" not in before


@pytest.mark.parametrize("nested", [False, True])
def test_non_string_metadata_keys_rejected_before_any_write(mirror, origin, nested):
    if nested:
        origin["metadata"] = [{2: "two", 10: "ten"}]
    else:
        origin[2] = "metadata"
    before = contents(mirror)
    with pytest.raises(ValueError, match="REPLICATION_INVALID_JSON"):
        mirror.append_replicated(origin)
    assert contents(mirror) == before


def test_string_numeric_keys_remain_stable_after_freeze_and_replay(tmp_path, mirror):
    producer = KhipuLMDB(str(tmp_path / "string-key-producer"))
    try:
        origin = producer.append("fixture", {"nested": [{"2": "two", "10": "ten"}]})
    finally:
        producer.close()
    origin["metadata"] = {"2": "two", "10": "ten"}
    first = mirror.append_replicated(origin)
    before = contents(mirror)
    assert mirror.append_replicated(copy.deepcopy(origin)) == {
        "receipt": first["receipt"], "duplicate": True,
    }
    assert contents(mirror) == before


def test_backfill_retains_historical_duplicates_and_indexes_first(mirror, origin):
    first = mirror.append("replicated", {"origin": origin})
    mirror.append("replicated", {"origin": origin})
    original = contents(mirror)
    result = mirror.append_replicated(origin)
    assert result == {"receipt": first, "duplicate": True}
    assert mirror.stats()["entries"] == 2
    assert {key: contents(mirror)[key] for key in original} == original
    assert contents(mirror)[b"meta:origin-indexed-count"] == b"2"


def test_backfill_observes_legacy_appends_after_initial_index(mirror, origin):
    mirror.append_replicated(origin)
    mirror.append("replicated", {"origin": origin})
    assert mirror.append_replicated(origin)["receipt"]["seq"] == 0
    assert contents(mirror)[b"meta:origin-indexed-count"] == b"2"


@pytest.mark.parametrize("historical", [False, True])
def test_same_digest_with_changed_auxiliary_metadata_is_conflict(mirror, origin, historical):
    mirror.append("replicated", {"origin": origin}) if historical else mirror.append_replicated(origin)
    other = {**origin, "signature": "different-untrusted-metadata"}
    before = contents(mirror)
    with pytest.raises(ValueError, match="REPLICATION_ORIGIN_CONFLICT"):
        mirror.append_replicated(other)
    assert contents(mirror) == before


def test_conflicting_historical_duplicates_roll_back_backfill(mirror, origin):
    mirror.append("replicated", {"origin": origin})
    mirror.append("replicated", {"origin": {**origin, "ts": origin["ts"] + 1}})
    before = contents(mirror)
    with pytest.raises(ValueError, match="REPLICATION_ORIGIN_CONFLICT"):
        mirror.append_replicated(origin)
    assert contents(mirror) == before


@pytest.mark.parametrize("mutation", ["payload", "digest", "missing", "nan"])
def test_invalid_origin_history_refuses_without_writing(mirror, origin, mutation):
    bad = copy.deepcopy(origin)
    if mutation == "payload":
        bad["payload"]["nested"][0] = "substituted"
    elif mutation == "digest":
        bad["digest"] = "0" * 64
    elif mutation == "missing":
        del bad["payload"]
    else:
        bad["payload"]["nested"].append(float("nan"))
    mirror.append("replicated", {"origin": origin})
    mirror.append("replicated", {"origin": bad})
    before = contents(mirror)
    with pytest.raises(ValueError, match="REPLICATION_"):
        mirror.append_replicated(origin)
    assert contents(mirror) == before


@pytest.mark.parametrize("index", [b"999", b"-1", b"00", b"invalid"])
def test_corrupt_index_pointer_refuses_without_writing(mirror, origin, index):
    mirror.append_replicated(origin)
    with mirror._env.begin(write=True) as txn:
        txn.put(b"origin:" + origin["digest"].encode(), index)
    before = contents(mirror)
    with pytest.raises(ValueError, match="REPLICATION_INDEX_INVALID"):
        mirror.append_replicated(origin)
    assert contents(mirror) == before


def test_corrupt_history_wrapper_refuses_without_writing(mirror, origin):
    mirror.append("replicated", {"origin": origin})
    with mirror._env.begin(write=True) as txn:
        txn.put(b"seq:00000000000000000000", b'{"broken":true}')
    before = contents(mirror)
    with pytest.raises(ValueError, match="REPLICATION_"):
        mirror.append_replicated(origin)
    assert contents(mirror) == before


@pytest.mark.parametrize("cursor", [b"-1", b"2", b"01", b"invalid"])
def test_corrupt_migration_cursor_refuses_without_writing(mirror, origin, cursor):
    mirror.append_replicated(origin)
    with mirror._env.begin(write=True) as txn:
        txn.put(b"meta:origin-indexed-count", cursor)
    before = contents(mirror)
    with pytest.raises(ValueError, match="REPLICATION_INDEX_INVALID"):
        mirror.append_replicated(origin)
    assert contents(mirror) == before


@pytest.mark.parametrize("field", ["head", "previous"])
def test_inconsistent_local_chain_refuses_without_writing(mirror, origin, field):
    mirror.append("replicated", {"origin": origin})
    if field == "previous":
        with mirror._env.begin(write=True) as txn:
            txn.put(b"meta:head", b"f" * 64)
        mirror.append("replicated", {"origin": origin})
    else:
        with mirror._env.begin(write=True) as txn:
            txn.put(b"meta:head", b"f" * 64)
    before = contents(mirror)
    with pytest.raises(ValueError, match="REPLICATION_HISTORY_INVALID"):
        mirror.append_replicated(origin)
    assert contents(mirror) == before


def test_large_but_admitted_origin_can_be_replayed(tmp_path, mirror):
    producer = KhipuLMDB(str(tmp_path / "large-producer"))
    try:
        origin = producer.append("fixture", {"text": "x" * (core._MAX_ORIGIN_BYTES - 700)})
    finally:
        producer.close()
    assert mirror.append_replicated(origin)["duplicate"] is False
    assert mirror.append_replicated(origin)["duplicate"] is True


def test_oversized_origin_refuses_without_migration(mirror, origin):
    origin["extra_metadata"] = "x" * core._MAX_ORIGIN_BYTES
    before = contents(mirror)
    with pytest.raises(ValueError, match="REPLICATION_ORIGIN_TOO_LARGE"):
        mirror.append_replicated(origin)
    assert contents(mirror) == before


@pytest.mark.parametrize("bound", ["records", "bytes"])
def test_backfill_limits_refuse_atomically(mirror, origin, monkeypatch, bound):
    mirror.append("replicated", {"origin": origin})
    mirror.append("replicated", {"origin": origin})
    if bound == "records":
        monkeypatch.setattr(core, "_MAX_ORIGIN_BACKFILL", 1)
    else:
        monkeypatch.setattr(core, "_MAX_ORIGIN_BACKFILL_BYTES", 1)
    before = contents(mirror)
    with pytest.raises(ValueError, match="REPLICATION_HISTORY_RECONCILIATION_REQUIRED"):
        mirror.append_replicated(origin)
    assert contents(mirror) == before


def test_read_methods_do_not_create_origin_index(mirror, origin):
    receipt = mirror.append("replicated", {"origin": origin})
    before = contents(mirror)
    mirror.stats()
    mirror.verify()
    mirror.tail()
    mirror.get_by_seq(0)
    mirror.get_by_receipt(receipt["digest"])
    assert contents(mirror) == before
    assert b"meta:origin-indexed-count" not in before


def child_env():
    return {**os.environ, "PYTHONPATH": str(Path(__file__).resolve().parents[1])}


CHILD_APPEND = """
import json, sys
from khipu_lmdb import KhipuLMDB
store = KhipuLMDB(sys.argv[1], organ='khipu-repl', ns='fixture')
result = store.append_replicated(json.loads(sys.argv[2]))
store.close()
print(json.dumps(result))
"""


def test_concurrent_processes_commit_one_wrapper_and_reopen_replays(tmp_path, origin):
    path = str(tmp_path / "multiprocess-mirror")
    commands = [sys.executable, "-c", CHILD_APPEND, path, json.dumps(origin)]
    children = [subprocess.Popen(commands, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                 text=True, env=child_env()) for _ in range(6)]
    results = []
    try:
        for child in children:
            out, error = child.communicate(timeout=20)
            assert child.returncode == 0, error
            results.append(json.loads(out))
    finally:
        for child in children:
            if child.poll() is None:
                child.kill()
                child.communicate(timeout=5)
    assert sum(not result["duplicate"] for result in results) == 1
    assert len({result["receipt"]["digest"] for result in results}) == 1
    reopened = subprocess.run(commands, text=True, capture_output=True, env=child_env(), timeout=20)
    assert reopened.returncode == 0, reopened.stderr
    assert json.loads(reopened.stdout)["duplicate"] is True
    store = KhipuLMDB(path, organ="khipu-repl", ns="fixture")
    try:
        assert store.stats()["entries"] == 1 and store.verify()["ok"] is True
    finally:
        store.close()


def test_process_exit_before_commit_rolls_back_wrapper_index_and_migration(tmp_path, origin):
    path = str(tmp_path / "crash-mirror")
    store = KhipuLMDB(path, organ="khipu-repl", ns="fixture")
    store.append("replicated", {"origin": origin})
    before = contents(store)
    store.close()
    # Exit only after append_replicated has performed every write but before
    # the real LMDB context commits. This is a process-kill test, not a mock DB.
    script = """
import json, os, sys
from khipu_lmdb import KhipuLMDB
store = KhipuLMDB(sys.argv[1], organ='khipu-repl', ns='fixture')
real_env = store._env
class BeforeCommit:
    def __enter__(self):
        self.txn = real_env.begin(write=True)
        return self.txn
    def __exit__(self, *args):
        os._exit(23)
class Environment:
    def begin(self, **kwargs):
        assert kwargs == {'write': True}
        return BeforeCommit()
store._env = Environment()
store.append_replicated(json.loads(sys.argv[2]))
"""
    other = copy.deepcopy(origin)
    other["action"] = "new-origin"
    body = {key: other[key] for key in ("organ", "ns", "seq", "action", "payload_digest", "prev")}
    other["digest"] = hashlib.sha3_256(core._canon(body)).hexdigest()
    child = subprocess.run([sys.executable, "-c", script, path, json.dumps(other)],
                           text=True, capture_output=True, env=child_env(), timeout=20)
    assert child.returncode == 23, child.stderr
    store = KhipuLMDB(path, organ="khipu-repl", ns="fixture")
    try:
        assert contents(store) == before
        assert store.append_replicated(other)["duplicate"] is False
        assert store.append_replicated(origin)["duplicate"] is True
        assert store.stats()["entries"] == 2 and store.verify()["ok"] is True
    finally:
        store.close()
