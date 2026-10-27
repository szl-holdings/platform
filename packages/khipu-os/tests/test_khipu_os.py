# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings · Yachay — Doctrine v11 LOCKED: 749 declarations / 14 unique axioms / 163 sorries.
# git trailer: Perplexity Computer Agent
"""Smoke + API tests for the khipu-os substrate package."""
import hashlib
import json
import os
import subprocess
import sys
from pathlib import Path
import khipu_os
import pytest
from khipu_os.dag import _persisted_receipt_blob

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


def test_sqlite_recovery_rebuilds_graph_and_signature_state(tmp_path):
    path = str(tmp_path / "khipu")
    signer = khipu_os.KhipuSigner(key=b"recovery-test-key")
    first = khipu_os.KhipuDAG(
        space="recovery", signer=signer, persist_path=path, store_backend="sqlite"
    )
    root = first.add_receipt("test", "root", {"value": 1})
    child = first.add_receipt("test", "child", {"value": 2}, parents=[root.receipt_id])
    expected_root = first.current_root()
    assert first.signer.verify(child)
    first.close()

    child_process = subprocess.run(
        [sys.executable, "-c", """
import json, os, sys
sys.path.insert(0, os.environ['KHIPU_PACKAGE_ROOT'])
import khipu_os
dag = khipu_os.KhipuDAG(
    space='recovery',
    signer=khipu_os.KhipuSigner(key=b'recovery-test-key'),
    persist_path=os.environ['KHIPU_STORE_PATH'],
    store_backend='sqlite',
)
print(json.dumps({
    'hot_count': dag.hot_count(),
    'root': dag.current_root(),
    'verified': all(dag.signer.verify(receipt) for receipt in dag.hot.values()),
}))
dag.close()
"""],
        check=True,
        capture_output=True,
        text=True,
        env={
            **os.environ,
            "KHIPU_PACKAGE_ROOT": str(Path(__file__).parents[1].resolve()),
            "KHIPU_STORE_PATH": path,
        },
    )
    recovered = json.loads(child_process.stdout)
    assert recovered == {"hot_count": 2, "root": expected_root, "verified": True}

    second = khipu_os.KhipuDAG(
        space="recovery", signer=signer, persist_path=path, store_backend="sqlite"
    )
    assert second.hot_count() == 2
    assert second.current_root() == expected_root
    assert second.has_descendants(root.receipt_id)
    assert second.signer.verify(second.hot[child.receipt_id])
    third = second.add_receipt("test", "after-restart", {"value": 3}, parents=[child.receipt_id])
    assert third.receipt_id not in {root.receipt_id, child.receipt_id}
    second.close()


def test_recovery_rejects_legacy_or_cyclic_records(tmp_path):
    path = str(tmp_path / "khipu")
    signer = khipu_os.KhipuSigner(key=b"recovery-test-key")
    dag = khipu_os.KhipuDAG(
        space="recovery", signer=signer, persist_path=path, store_backend="sqlite"
    )
    receipt = dag.add_receipt("test", "root", {"value": 1})
    dag.close()

    import sqlite3
    db_path = path + ".sqlite"
    conn = sqlite3.connect(db_path)
    legacy = json.dumps({
        "receipt_id": receipt.receipt_id,
        "organ": receipt.organ,
        "action": receipt.action,
        "payload": receipt.payload,
        "parents": receipt.parents,
        "ts": receipt.ts,
        "yuyay": receipt.yuyay,
    }, sort_keys=True, separators=(",", ":")).encode()
    conn.execute("UPDATE receipts SET blob=? WHERE rid=?", (legacy, receipt.receipt_id))
    conn.commit()
    conn.close()
    with pytest.raises(ValueError, match="unsupported persisted receipt schema"):
        khipu_os.KhipuDAG(
            space="recovery", signer=signer, persist_path=path, store_backend="sqlite"
        )

    cycle_path = str(tmp_path / "cycle")
    first = khipu_os.KhipuReceipt(
        receipt_id="khipu-dag::cycle-1", organ="test", action="one", payload={},
        parents=["khipu-dag::cycle-2"],
    )
    second = khipu_os.KhipuReceipt(
        receipt_id="khipu-dag::cycle-2", organ="test", action="two", payload={},
        parents=["khipu-dag::cycle-1"],
    )
    signer.sign(first)
    signer.sign(second)
    store = khipu_os.open_store(cycle_path, prefer="sqlite")
    store.put(first.receipt_id, _persisted_receipt_blob(first))
    store.put(second.receipt_id, _persisted_receipt_blob(second))
    store.close()
    with pytest.raises(ValueError, match="cycle detected"):
        khipu_os.KhipuDAG(
            space="cycle", signer=signer, persist_path=cycle_path, store_backend="sqlite"
        )
