# SPDX-License-Identifier: Apache-2.0
"""Append/recovery shape contract; all signing material is synthetic test data."""
import copy
import hashlib
import json
from unittest.mock import Mock

import pytest

import khipu_os
from khipu_os.dag import _persisted_receipt_blob, _restore_receipt

KEY = b"numeric-restore-test-key"  # existing offline test fixture, not authority


def _open(path=None):
    return khipu_os.KhipuDAG(
        space="shape", signer=khipu_os.KhipuSigner(key=KEY),
        persist_path=str(path) if path is not None else None, store_backend="sqlite",
    )


def _snapshot(dag):
    state = {
        "seq": dag._seq,
        "hot": {key: _persisted_receipt_blob(value) for key, value in dag.hot.items()},
        "children": copy.deepcopy(dag.children),
        "archived_ids": list(dag.archived_ids),
        "receipts": [_persisted_receipt_blob(value) for value in dag.receipts],
        "checkpoints": copy.deepcopy(dag.checkpoints),
        "root": dag.current_root(),
    }
    if dag.store is not None:
        hot = list(dag.store.keys())
        cold = list(dag.store.cold_keys())
        state["stored"] = (hot, cold, {key: dag.store.get(key) for key in hot + cold})
    return state


INVALID_INPUTS = [
    pytest.param({"parents": "duplicate"}, id="duplicate-parent"),
    pytest.param({"parents": ()}, id="empty-tuple-parents"),
    pytest.param({"parents": ("parent",)}, id="tuple-parents"),
    pytest.param({"parents": ""}, id="empty-string-parents"),
    pytest.param({"parents": "parent"}, id="string-parents"),
    pytest.param({"parents": {}}, id="empty-dict-parents"),
    pytest.param({"parents": {"parent": True}}, id="dict-parents"),
    pytest.param({"parents": 0}, id="zero-parents"),
    pytest.param({"parents": False}, id="false-parents"),
    pytest.param({"parents": [""]}, id="empty-parent-id"),
    pytest.param({"parents": [None]}, id="null-parent-id"),
    pytest.param({"parents": [1]}, id="integer-parent-id"),
    pytest.param({"parents": [False]}, id="boolean-parent-id"),
    pytest.param({"parents": [[]]}, id="list-parent-id"),
    pytest.param({"parents": [{}]}, id="dict-parent-id"),
    *[
        pytest.param({field: value}, id=f"{field}-{label}")
        for field in ("organ", "action")
        for label, value in (("empty", ""), ("null", None), ("integer", 1),
                             ("boolean", False), ("list", []), ("dict", {}))
    ],
    *[
        pytest.param({"payload": value}, id=f"payload-{label}")
        for label, value in (("list", []), ("null", None), ("string", ""),
                             ("integer", 1), ("boolean", False))
    ],
    pytest.param({"parents": ["missing"]}, id="missing-parent"),
    pytest.param({"ts": False}, id="boolean-timestamp"),
    pytest.param({"yuyay": float("inf")}, id="infinite-yuyay"),
]


@pytest.mark.parametrize("persistent", [False, True], ids=["memory", "sqlite"])
@pytest.mark.parametrize("changes", INVALID_INPUTS)
def test_invalid_input_has_no_append_side_effects(tmp_path, monkeypatch, persistent, changes):
    path = tmp_path / "shape" if persistent else None
    dag = _open(path)
    try:
        root = dag.add_receipt("test", "root", {}, ts=1_700_000_000)
        values = dict(organ="test", action="child", payload={},
                      parents=[root.receipt_id], ts=1_700_000_001, yuyay=1)
        values.update(changes)
        if changes.get("parents") == "duplicate":
            values["parents"] = [root.receipt_id, root.receipt_id]
        before = _snapshot(dag)
        allocate = Mock(wraps=dag._next_id)
        sign = Mock(wraps=dag.signer.sign)
        monkeypatch.setattr(dag, "_next_id", allocate)
        monkeypatch.setattr(dag.signer, "sign", sign)
        put = None
        if persistent:
            put = Mock(wraps=dag.store.put)
            monkeypatch.setattr(dag.store, "put", put)
        with pytest.raises(ValueError):
            dag.add_receipt(**values)
        allocate.assert_not_called()
        sign.assert_not_called()
        if put is not None:
            put.assert_not_called()
        assert _snapshot(dag) == before
    finally:
        dag.close()

    if persistent:
        reopened = _open(path)
        try:
            assert set(reopened.hot) == {root.receipt_id}
            assert reopened._seq == before["seq"]
            assert reopened.children[root.receipt_id] == []
            assert reopened.store.get(root.receipt_id) == before["stored"][2][root.receipt_id]
        finally:
            reopened.close()


@pytest.mark.parametrize("field, value, message", [
    ("organ", "", "identity or signature is malformed"),
    ("organ", 1, "identity or signature is malformed"),
    ("action", None, "identity or signature is malformed"),
    ("action", [], "identity or signature is malformed"),
    ("payload", [], "payload is not an object"),
    ("payload", None, "payload is not an object"),
    ("parents", ["parent", "parent"], "parents are malformed"),
    ("parents", [""], "parents are malformed"),
    ("parents", [None], "parents are malformed"),
    ("parents", [[]], "parents are malformed"),
    ("parents", {}, "parents are malformed"),
    ("parents", "", "parents are malformed"),
])
def test_recovery_still_rejects_malformed_shape(field, value, message):
    dag = _open()
    try:
        receipt = dag.add_receipt("test", "root", {}, ts=1_700_000_000)
        envelope = json.loads(_persisted_receipt_blob(receipt))
        envelope["receipt"][field] = value
        with pytest.raises(ValueError, match="persisted receipt " + message):
            _restore_receipt(json.dumps(envelope).encode(), receipt.receipt_id)
    finally:
        dag.close()


def test_recovery_preserves_signature_shape_error_precedence():
    dag = _open()
    try:
        receipt = dag.add_receipt("test", "root", {}, ts=1_700_000_000)
        envelope = json.loads(_persisted_receipt_blob(receipt))
        envelope["receipt"].update(signature="", payload=[], parents={})
        with pytest.raises(ValueError, match="identity or signature is malformed"):
            _restore_receipt(json.dumps(envelope).encode(), receipt.receipt_id)
    finally:
        dag.close()


def test_valid_roots_cold_parent_order_and_counter_survive_restart(tmp_path):
    path = tmp_path / "shape"
    dag = _open(path)
    try:
        cold = dag.add_receipt("test", "cold-root", {}, parents=None, ts=1_700_000_000)
        hot = dag.add_receipt("test", "hot-root", {}, parents=[], ts=1_700_000_001)
        dag.store.move_to_cold(cold.receipt_id)
        dag.archived_ids.append(cold.receipt_id)
        del dag.hot[cold.receipt_id]
        parents = [hot.receipt_id, cold.receipt_id]
        child = dag.add_receipt("test", "child", {}, parents=parents,
                                ts=2 ** 53 + 1, yuyay=-0.0)
        assert child.parents == parents
        parents.clear()  # receipt retains its own parent-list copy
        stored = dag.store.get(child.receipt_id)
        expected_seq = dag._seq
        expected_root = dag.current_root()
    finally:
        dag.close()
    reopened = _open(path)
    try:
        restored = reopened.hot[child.receipt_id]
        assert restored.parents == [hot.receipt_id, cold.receipt_id]
        assert _persisted_receipt_blob(restored) == stored
        assert reopened.signer.verify(restored)
        assert reopened.current_root() == expected_root
        assert reopened.archived_ids == [cold.receipt_id]
        assert reopened.children[cold.receipt_id] == [child.receipt_id]
        assert reopened.children[hot.receipt_id] == [child.receipt_id]
        assert reopened._seq == expected_seq
        appended = reopened.add_receipt("test", "after-restart", {},
                                        parents=[child.receipt_id], ts=1_700_000_003)
        assert reopened._seq == expected_seq + 1
        assert appended.receipt_id not in {cold.receipt_id, hot.receipt_id, child.receipt_id}
    finally:
        reopened.close()


def test_valid_append_preserves_pinned_baseline_signed_bytes(monkeypatch):
    dag = _open()
    try:
        monkeypatch.setattr(dag, "_next_id",
                            Mock(side_effect=["root-b", "root-a", "fixed-child"]))
        dag.add_receipt("test", "root", {}, ts=1_700_000_000)
        dag.add_receipt("test", "root", {}, ts=1_700_000_001)
        receipt = dag.add_receipt("test", "shape", {"value": 1},
                                  parents=["root-b", "root-a"], ts=2 ** 53 + 1, yuyay=-0.0)
        assert hashlib.sha256(_persisted_receipt_blob(receipt)).hexdigest() == (
            "7b30d5c4d9bc1e4fbbda5f98a274de81d8d12d452b0bf7a0263e02def95f26df"
        )
    finally:
        dag.close()
