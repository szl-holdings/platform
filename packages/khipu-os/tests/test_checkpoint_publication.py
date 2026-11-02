"""Offline operation must not claim a remotely published checkpoint."""
import json

import pytest

from khipu_os import KhipuDAG, KhipuSigner
from khipu_os.checkpointer import Checkpointer


def test_offline_ticks_continue_without_checkpoint_claims(tmp_path):
    dag = KhipuDAG(
        space="offline-checkpoint", persist_path=str(tmp_path / "dag"),
        store_backend="sqlite", checkpoint_interval_s=10, verify_interval_s=1,
        signer=KhipuSigner(key=b"local-fixture-only"),
    )
    try:
        for now in (1700000000, 1700000011):
            summary = dag.tick(now=now)
            assert summary["checkpoint"]["state"] == "UNAVAILABLE"
            assert summary["checkpoint"]["uploaded"] is False
            assert summary["verify"]["ok"] is True
            assert "publish" in summary
            receipt = dag.hot[summary["tick_receipt"]]
            assert receipt.action == "dag_tick"
            assert dag.signer.verify(receipt)
            assert receipt.payload["summary"]["checkpoint"]["uploaded"] is False
        assert dag.checkpoints == []
        assert dag._last_checkpoint == 0.0
        assert not any(r.action == "self_checkpoint" for r in dag.hot.values())
        assert dag.tick_count == 2
    finally:
        dag.close()


@pytest.mark.parametrize("ack", [None, [], {}, {"uploaded": False},
                                  {"uploaded": 1}, {"uploaded": "true"}])
def test_direct_checkpoint_rejects_failed_or_malformed_ack(ack):
    dag = KhipuDAG(space="bad-ack")
    checkpointer = Checkpointer(dag, uploader=lambda *_: ack, cosign_key_path=None)
    with pytest.raises(RuntimeError, match="checkpoint publication did not succeed"):
        checkpointer.run(now=1700000000)
    assert dag.checkpoints == []
    assert dag.hot_count() == 0


def test_direct_offline_checkpointer_still_fails_closed():
    dag = KhipuDAG(space="direct-offline")
    with pytest.raises(RuntimeError, match="checkpoint publication did not succeed"):
        Checkpointer(dag, cosign_key_path=None).run(now=1700000000)
    assert dag.checkpoints == []
    assert dag.hot_count() == 0


def test_tick_uses_injected_uploader_and_success_cadence():
    calls = []

    def upload(repo, path, content):
        calls.append((repo, path, json.loads(content)))
        return {"uploaded": True, "commit": "synthetic-test-ack"}

    dag = KhipuDAG(space="configured", checkpoint_uploader=upload,
                   checkpoint_interval_s=10)
    summary = dag.tick(now=1700000000)
    assert len(calls) == 1
    repo, path, envelope = calls[0]
    assert repo == "szlholdings/khipu-snapshots"
    assert path.startswith("checkpoints/configured/")
    assert summary["checkpoint"]["upload"]["uploaded"] is True
    assert summary["checkpoint"]["root"] == envelope["payload"]["merkle_root"]
    assert dag.hot[summary["checkpoint"]["receipt"]].action == "self_checkpoint"
    assert dag._last_checkpoint == 1700000000
    assert "checkpoint" not in dag.tick(now=1700000001)
    assert len(calls) == 1
    dag.tick(now=1700000010)
    assert len(calls) == 2
    assert len(dag.checkpoints) == 2


def test_failed_configured_upload_can_recover_without_false_checkpoint():
    acks = iter([{"uploaded": False}, {"uploaded": True}])
    dag = KhipuDAG(space="retry", checkpoint_uploader=lambda *_: next(acks))
    with pytest.raises(RuntimeError, match="checkpoint publication did not succeed"):
        dag.tick(now=1700000000)
    assert dag._last_checkpoint == 0.0
    assert dag.checkpoints == []
    assert not any(r.action in {"self_checkpoint", "dag_tick"}
                   for r in dag.hot.values())
    result = dag.tick(now=1700000001)
    assert result["checkpoint"]["upload"]["uploaded"] is True
    assert dag._last_checkpoint == 1700000001
    assert len(dag.checkpoints) == 1


def test_configured_transport_exception_is_not_silenced():
    def fail(*_args):
        raise OSError("synthetic transport failure")

    dag = KhipuDAG(space="transport", checkpoint_uploader=fail)
    with pytest.raises(OSError, match="synthetic transport failure"):
        dag.tick(now=1700000000)
    assert dag._last_checkpoint == 0.0
    assert dag.checkpoints == []
    assert not any(r.action == "self_checkpoint" for r in dag.hot.values())
