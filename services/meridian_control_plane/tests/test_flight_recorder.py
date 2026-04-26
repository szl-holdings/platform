"""Unit tests for the Business Flight Recorder."""

from __future__ import annotations

import json
import tempfile
import time
import unittest
from pathlib import Path

from services.meridian_control_plane.flight_recorder import FlightRecorder, _content_hash


class TestFlightRecorderAppend(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = Path(tempfile.mkdtemp())
        self.recorder = FlightRecorder(recorder_dir=self.tmp)

    def test_append_creates_shard(self) -> None:
        self.recorder.append({"id": "test_001", "event_type": "test"})
        shards = list(self.tmp.glob("*.jsonl"))
        self.assertEqual(len(shards), 1)

    def test_append_is_line_delimited(self) -> None:
        self.recorder.append({"id": "a", "event_type": "test"})
        self.recorder.append({"id": "b", "event_type": "test"})
        shard = list(self.tmp.glob("*.jsonl"))[0]
        lines = [l.strip() for l in shard.read_text(encoding="utf-8").splitlines() if l.strip()]
        self.assertEqual(len(lines), 2)

    def test_content_hash_is_added(self) -> None:
        self.recorder.append({"id": "test_hash", "event_type": "test"})
        entries = self.recorder.replay()
        self.assertIn("content_hash", entries[0])
        self.assertIsInstance(entries[0]["content_hash"], str)

    def test_append_only_never_overwrites(self) -> None:
        for i in range(5):
            self.recorder.append({"id": f"e{i}", "event_type": "test"})
        all_entries = self.recorder.replay()
        self.assertEqual(len(all_entries), 5)

    def test_record_model_call_fields(self) -> None:
        eid = self.recorder.record_model_call(
            vertical="pulse",
            input_class="operator_signals_v1",
            output_class="operator_recommendation_v1",
            model="gpt-5.5-2026-04-23",
            confidence=0.85,
            recommendation_id="rec_001",
        )
        entries = self.recorder.replay()
        self.assertEqual(len(entries), 1)
        e = entries[0]
        self.assertEqual(e["event_type"], "model_call")
        self.assertEqual(e["vertical"], "pulse")
        self.assertEqual(e["model"], "gpt-5.5-2026-04-23")
        self.assertEqual(e["confidence"], 0.85)
        self.assertEqual(e["id"], eid)

    def test_record_recommendation_fields(self) -> None:
        self.recorder.record_recommendation(
            vertical="platform",
            recommendation_id="rec_platform_001",
            title="Test recommendation",
            owner="cto@szl",
            requires_human_approval=True,
            confidence=0.80,
            model="gpt-5.5-2026-04-23",
            input_class="production_deploy",
            output_class="operator_recommendation_v1",
            evidence_ids=["ev_001", "ev_002"],
        )
        entries = self.recorder.replay()
        e = entries[0]
        self.assertEqual(e["event_type"], "recommendation")
        self.assertEqual(e["approval_state"], "awaiting_approval")
        self.assertEqual(e["evidence_ids"], ["ev_001", "ev_002"])


class TestFlightRecorderApprovalGate(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = Path(tempfile.mkdtemp())
        self.recorder = FlightRecorder(recorder_dir=self.tmp)

    def test_has_no_approval_initially(self) -> None:
        self.assertFalse(self.recorder.has_approval("rec_001"))

    def test_has_approval_after_approval_record(self) -> None:
        self.recorder.record_approval(
            recommendation_id="rec_001",
            approved_by="cto@szl",
            approved=True,
        )
        self.assertTrue(self.recorder.has_approval("rec_001"))

    def test_rejected_approval_does_not_count(self) -> None:
        self.recorder.record_approval(
            recommendation_id="rec_002",
            approved_by="cto@szl",
            approved=False,
        )
        self.assertFalse(self.recorder.has_approval("rec_002"))

    def test_approval_gate_blocks_without_record(self) -> None:
        self.recorder.record_recommendation(
            vertical="platform",
            recommendation_id="rec_needs_approval",
            title="Needs approval",
            owner="cto@szl",
            requires_human_approval=True,
            confidence=0.80,
            model="gpt-5.5-2026-04-23",
            input_class="production_deploy",
            output_class="operator_recommendation_v1",
            evidence_ids=[],
        )
        self.assertFalse(self.recorder.has_approval("rec_needs_approval"))

    def test_approval_gate_passes_after_approval(self) -> None:
        self.recorder.record_approval(
            recommendation_id="rec_needs_approval",
            approved_by="board@szl",
            approved=True,
        )
        self.assertTrue(self.recorder.has_approval("rec_needs_approval"))


class TestFlightRecorderIntegrity(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = Path(tempfile.mkdtemp())
        self.recorder = FlightRecorder(recorder_dir=self.tmp)

    def test_verify_integrity_passes_on_clean_ledger(self) -> None:
        for i in range(3):
            self.recorder.append({"id": f"e{i}", "event_type": "test"})
        violations = self.recorder.verify_integrity()
        self.assertEqual(violations, [])

    def test_tampered_entry_detected(self) -> None:
        self.recorder.append({"id": "tamper_target", "event_type": "test"})
        shard = list(self.tmp.glob("*.jsonl"))[0]
        text = shard.read_text(encoding="utf-8")
        lines = text.splitlines()
        entry = json.loads(lines[0])
        entry["confidence"] = 99.9
        shard.write_text(json.dumps(entry) + "\n", encoding="utf-8")
        violations = self.recorder.verify_integrity()
        self.assertGreater(len(violations), 0)

    def test_content_hash_is_deterministic(self) -> None:
        payload = {"id": "x", "event_type": "test", "value": 42}
        h1 = _content_hash(payload)
        h2 = _content_hash(payload)
        self.assertEqual(h1, h2)


class TestFlightRecorderReplay(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = Path(tempfile.mkdtemp())
        self.recorder = FlightRecorder(recorder_dir=self.tmp)

    def test_replay_returns_all_entries_in_order(self) -> None:
        ids = [f"e{i:03d}" for i in range(10)]
        for eid in ids:
            self.recorder.append({"id": eid, "event_type": "test"})
        replayed = self.recorder.replay()
        self.assertEqual(len(replayed), 10)

    def test_replay_empty_recorder_returns_empty(self) -> None:
        self.assertEqual(self.recorder.replay(), [])


if __name__ == "__main__":
    unittest.main()
