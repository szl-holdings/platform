# SPDX-License-Identifier: Apache-2.0
"""Numeric fidelity of persisted Khipu receipts (ts / yuyay) across restart."""
import json
import math
import sqlite3

import pytest

import khipu_os
from khipu_os.dag import _persisted_receipt_blob, _restore_receipt

KEY = b"numeric-restore-test-key"
MESSAGE = {"ts": "persisted receipt timestamp is malformed",
           "yuyay": "persisted receipt yuyay is malformed"}


def _open(path):
    return khipu_os.KhipuDAG(
        space="numeric", signer=khipu_os.KhipuSigner(key=KEY),
        persist_path=str(path), store_backend="sqlite",
    )


def _restart_roundtrip(tmp_path, **values):
    path = tmp_path / "khipu"
    first = _open(path)
    original = first.add_receipt("test", "numeric", {"value": 1}, **values)
    stored = first.store.get(original.receipt_id)
    first.close()
    second = _open(path)
    try:
        restored = second.hot[original.receipt_id]
        assert second.signer.verify(restored)
        return original, restored, stored
    finally:
        second.close()


def _signed_blob(**values):
    receipt = khipu_os.KhipuReceipt(
        receipt_id="khipu-dag::numeric-1", organ="test", action="numeric",
        payload={}, parents=[], **values,
    )
    khipu_os.KhipuSigner(key=KEY).sign(receipt)
    return receipt, _persisted_receipt_blob(receipt)


@pytest.mark.parametrize("field, value", [("ts", 1_700_000_000), ("yuyay", 1), ("yuyay", 0)])
def test_integer_values_survive_restart_with_type_and_value(tmp_path, field, value):
    _, restored, _ = _restart_roundtrip(tmp_path, **{field: value})
    assert getattr(restored, field) == value
    assert type(getattr(restored, field)) is int


def test_float_values_survive_restart_unchanged(tmp_path):
    _, restored, _ = _restart_roundtrip(tmp_path, ts=1_700_000_000.25, yuyay=0.5)
    assert restored.ts == 1_700_000_000.25 and type(restored.ts) is float
    assert restored.yuyay == 0.5 and type(restored.yuyay) is float


def test_negative_zero_yuyay_keeps_its_sign(tmp_path):
    _, restored, _ = _restart_roundtrip(tmp_path, yuyay=-0.0)
    assert restored.yuyay == 0.0 and math.copysign(1.0, restored.yuyay) == -1.0


def test_integer_beyond_float_precision_is_exact(tmp_path):
    value = 2 ** 53 + 1  # not representable as a float
    _, restored, _ = _restart_roundtrip(tmp_path, ts=value)
    assert restored.ts == value and type(restored.ts) is int


def test_restored_receipt_reserializes_to_identical_bytes(tmp_path):
    _, restored, stored = _restart_roundtrip(tmp_path, ts=1_700_000_000, yuyay=1)
    assert b'"ts":1700000000,' in stored
    assert _persisted_receipt_blob(restored) == stored


@pytest.mark.parametrize("field", ["ts", "yuyay"])
def test_integer_outside_float_range_is_a_controlled_error(field):
    receipt, blob = _signed_blob(**{field: 10 ** 400})
    with pytest.raises(ValueError, match=MESSAGE[field]):
        _restore_receipt(blob, receipt.receipt_id)


@pytest.mark.parametrize("field, value", [
    ("ts", True), ("yuyay", False), ("ts", float("nan")), ("yuyay", float("inf")),
    ("ts", "1700000000"),
])
def test_out_of_contract_persisted_values_are_rejected(field, value):
    receipt, blob = _signed_blob()
    envelope = json.loads(blob)
    envelope["receipt"][field] = value
    altered = json.dumps(envelope, sort_keys=True, separators=(",", ":")).encode()
    with pytest.raises(ValueError, match=MESSAGE[field]):
        _restore_receipt(altered, receipt.receipt_id)


def test_tampered_numeric_value_fails_signature_check(tmp_path):
    path = tmp_path / "khipu"
    dag = _open(path)
    receipt = dag.add_receipt("test", "numeric", {}, ts=1_700_000_000)
    dag.close()
    conn = sqlite3.connect(str(path) + ".sqlite")
    blob = bytes(conn.execute(
        "SELECT blob FROM receipts WHERE rid=?", (receipt.receipt_id,)).fetchone()[0])
    tampered = blob.replace(b'"ts":1700000000,', b'"ts":1700000001,')
    assert tampered != blob
    conn.execute("UPDATE receipts SET blob=? WHERE rid=?", (tampered, receipt.receipt_id))
    conn.commit()
    conn.close()
    with pytest.raises(ValueError, match="signature invalid"):
        _open(path)


def test_missing_parent_stops_recovery(tmp_path):
    orphan = khipu_os.KhipuReceipt(
        receipt_id="khipu-dag::numeric-2", organ="test", action="orphan", payload={},
        parents=["khipu-dag::numeric-1"], ts=1_700_000_000, yuyay=1,
    )
    khipu_os.KhipuSigner(key=KEY).sign(orphan)
    store = khipu_os.open_store(str(tmp_path / "orphan"), prefer="sqlite")
    store.put(orphan.receipt_id, _persisted_receipt_blob(orphan))
    store.close()
    with pytest.raises(ValueError, match="references missing parent"):
        _open(tmp_path / "orphan")


@pytest.mark.parametrize("values", [
    {"yuyay": True}, {"ts": False}, {"yuyay": float("nan")}, {"ts": float("inf")},
    {"ts": 10 ** 400},
])
def test_append_refuses_values_recovery_would_reject(tmp_path, values):
    path = tmp_path / "khipu"
    dag = _open(path)
    with pytest.raises(ValueError, match="is malformed"):
        dag.add_receipt("test", "numeric", {}, **values)
    assert dag.hot_count() == 0
    dag.close()
    reopened = _open(path)  # nothing unrecoverable was written
    assert reopened.hot_count() == 0
    reopened.close()


def test_failed_durable_write_leaves_no_partial_state(tmp_path, monkeypatch):
    path = tmp_path / "khipu"
    dag = _open(path)
    kept = dag.add_receipt("test", "kept", {}, ts=1_700_000_000)

    def interrupted(*args, **kwargs):
        raise OSError("simulated interrupted write")

    monkeypatch.setattr(dag.store, "put", interrupted)
    with pytest.raises(OSError):
        dag.add_receipt("test", "lost", {}, parents=[kept.receipt_id])
    assert dag.hot_count() == 1 and dag.children[kept.receipt_id] == []
    monkeypatch.undo()
    dag.close()
    reopened = _open(path)
    assert set(reopened.hot) == {kept.receipt_id}
    reopened.close()
