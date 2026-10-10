from __future__ import annotations

import sqlite3
import subprocess
import sys
import tempfile
import unittest
from concurrent.futures import ThreadPoolExecutor
from contextlib import closing
from pathlib import Path

from szl_vertical_runtime.ledger import GENESIS_HASH, LedgerError, OutcomeLedger


class LedgerTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.path = Path(self.temporary.name) / "ledger.sqlite3"
        self.ledger = OutcomeLedger(self.path)
        self.ledger.initialize()

    def test_empty_is_truthfully_distinct_from_verified_evidence(self) -> None:
        report = self.ledger.verify()
        self.assertEqual(report["status"], "EMPTY")
        self.assertEqual(report["event_count"], 0)
        self.assertEqual(report["head_hash"], GENESIS_HASH)

    def test_append_restart_and_backup(self) -> None:
        first = self.ledger.append(
            event_type="DECISION",
            vertical_id="lyte-services",
            subject_id="decision-1",
            payload={"decision": "DENY"},
            event_id="event-1",
            occurred_at="2026-08-29T12:00:00Z",
        )
        second = self.ledger.append(
            event_type="OUTCOME",
            vertical_id="lyte-services",
            subject_id="decision-1",
            payload={"result": "observed"},
            event_id="event-2",
            occurred_at="2026-08-29T12:01:00Z",
        )
        self.assertEqual(second["previous_hash"], first["event_hash"])
        restarted = OutcomeLedger(self.path)
        self.assertEqual(restarted.verify()["status"], "VERIFIED")
        backup = Path(self.temporary.name) / "backup.sqlite3"
        self.assertEqual(restarted.backup(backup)["status"], "VERIFIED")
        with self.assertRaisesRegex(Exception, "refusing to overwrite"):
            restarted.backup(backup)
        with self.assertRaisesRegex(Exception, "must differ"):
            restarted.backup(self.path)

    def test_batch_appends_one_contiguous_verified_chain(self) -> None:
        events = self.ledger.append_batch(
            [
                {
                    "event_type": "DECISION",
                    "vertical_id": "lyte-services",
                    "subject_id": "decision-1",
                    "payload": {"decision": "DENY"},
                    "event_id": "decision-1",
                },
                {
                    "event_type": "DECISION_RECEIPT",
                    "vertical_id": "lyte-services",
                    "subject_id": "decision-1",
                    "payload": {"receipt": "local"},
                    "event_id": "receipt-1",
                },
            ]
        )
        self.assertEqual([event["sequence"] for event in events], [1, 2])
        self.assertEqual(events[0]["previous_hash"], GENESIS_HASH)
        self.assertEqual(events[1]["previous_hash"], events[0]["event_hash"])
        self.assertEqual(self.ledger.events(), events)
        self.assertEqual(self.ledger.verify()["event_count"], 2)
        self.assertEqual(self.ledger.verify()["status"], "VERIFIED")

    def test_batch_second_insert_collision_rolls_back_the_entire_batch(self) -> None:
        original = self.ledger.append(
            event_type="DECISION_RECEIPT",
            vertical_id="lyte-services",
            subject_id="earlier-decision",
            payload={"receipt": "already present"},
            event_id="existing-receipt",
        )
        original_report = self.ledger.verify()
        with self.assertRaisesRegex(LedgerError, "integrity constraint"):
            self.ledger.append_batch(
                [
                    {
                        "event_type": "DECISION",
                        "vertical_id": "lyte-services",
                        "subject_id": "new-decision",
                        "payload": {"decision": "DENY"},
                        "event_id": "new-decision",
                    },
                    {
                        "event_type": "DECISION_RECEIPT",
                        "vertical_id": "lyte-services",
                        "subject_id": "new-decision",
                        "payload": {"receipt": "collision"},
                        "event_id": "existing-receipt",
                    },
                ]
            )
        self.assertIsNone(self.ledger.get("new-decision"))
        self.assertEqual(self.ledger.events(), [original])
        self.assertEqual(self.ledger.verify(), original_report)

    def test_batch_fully_prevalidates_before_initializing_or_writing(self) -> None:
        uncreated_path = Path(self.temporary.name) / "uncreated.sqlite3"
        ledger = OutcomeLedger(uncreated_path)
        first = {
            "event_type": "DECISION",
            "vertical_id": "lyte-services",
            "subject_id": "decision-1",
            "payload": {"decision": "DENY"},
            "event_id": "event-1",
        }
        malformed = [
            {**first, "event_id": "event-2", "payload": {"number": float("nan")}},
            {**first, "event_id": "event-2", "unexpected": True},
            {**first, "event_id": "event-2", "subject_id": ""},
            {**first, "event_id": "event-2", "occurred_at": 4},
            {**first, "event_id": ""},
            dict(first),
        ]
        for second in malformed:
            with self.subTest(second=second), self.assertRaises(LedgerError):
                ledger.append_batch([first, second])
            self.assertFalse(uncreated_path.exists())

    def test_readonly_uri_escapes_hash_percent_and_spaces_without_writes(self) -> None:
        for name in (
            "ledger#fragment.sqlite3",
            "ledger%23.sqlite3",
            "ledger space.sqlite3",
        ):
            with self.subTest(name=name):
                path = Path(self.temporary.name) / name
                ledger = OutcomeLedger(path)
                event = ledger.append(
                    event_type="DECISION",
                    vertical_id="lyte-services",
                    subject_id="decision-1",
                    payload={"decision": "DENY"},
                    event_id="event-1",
                )
                before_bytes = path.read_bytes()
                before_files = set(path.parent.iterdir())
                restarted = OutcomeLedger(path)
                report = restarted.verify()
                self.assertEqual(report["status"], "VERIFIED")
                self.assertEqual(report["event_count"], 1)
                self.assertEqual(restarted.get("event-1"), event)
                self.assertEqual(restarted.events(), [event])
                self.assertEqual(path.read_bytes(), before_bytes)
                self.assertEqual(set(path.parent.iterdir()), before_files)

    def test_update_and_delete_are_rejected(self) -> None:
        self.ledger.append(
            event_type="DECISION",
            vertical_id="lyte-services",
            subject_id="decision-1",
            payload={"decision": "DENY"},
        )
        with closing(sqlite3.connect(self.path)) as connection:
            with connection:
                with self.assertRaises(sqlite3.IntegrityError):
                    connection.execute("UPDATE ledger_events SET payload_json='{}'")
                with self.assertRaises(sqlite3.IntegrityError):
                    connection.execute("DELETE FROM ledger_events")

    def test_tampered_payload_and_tail_deletion_are_detected(self) -> None:
        for index in range(2):
            self.ledger.append(
                event_type="DECISION",
                vertical_id="lyte-services",
                subject_id=f"decision-{index}",
                payload={"decision": "DENY", "index": index},
            )
        with closing(sqlite3.connect(self.path)) as connection:
            with connection:
                connection.execute("DROP TRIGGER ledger_events_no_update")
                connection.execute("DROP TRIGGER ledger_events_no_delete")
                connection.execute(
                    "UPDATE ledger_events SET payload_json='{}' WHERE sequence=1"
                )
                connection.execute("DELETE FROM ledger_events WHERE sequence=2")
                connection.execute(
                    "CREATE TRIGGER ledger_events_no_update BEFORE UPDATE ON ledger_events BEGIN SELECT RAISE(ABORT, 'ledger is append-only'); END"
                )
                connection.execute(
                    "CREATE TRIGGER ledger_events_no_delete BEFORE DELETE ON ledger_events BEGIN SELECT RAISE(ABORT, 'ledger is append-only'); END"
                )
        report = self.ledger.verify()
        self.assertEqual(report["status"], "INVALID")
        self.assertTrue(any("mismatch" in finding for finding in report["findings"]))

    def test_rebased_tail_truncation_without_append_guards_is_invalid(self) -> None:
        events = []
        for index in range(2):
            events.append(
                self.ledger.append(
                    event_type="DECISION",
                    vertical_id="lyte-services",
                    subject_id=f"decision-{index}",
                    payload={"decision": "DENY", "index": index},
                )
            )
        with closing(sqlite3.connect(self.path)) as connection:
            with connection:
                connection.execute("DROP TRIGGER ledger_events_no_delete")
                connection.execute("DELETE FROM ledger_events WHERE sequence=2")
                connection.execute(
                    "UPDATE ledger_meta SET value=? WHERE key='head_hash'",
                    (events[0]["event_hash"],),
                )
                connection.execute(
                    "UPDATE ledger_meta SET value='1' WHERE key='event_count'"
                )
        report = self.ledger.verify()
        self.assertEqual(report["status"], "INVALID")
        self.assertTrue(
            any("ledger_events_no_delete" in finding for finding in report["findings"])
        )
        restarted = OutcomeLedger(self.path).verify()
        self.assertEqual(restarted["status"], "INVALID")
        self.assertTrue(
            any(
                "refusing automatic repair" in finding
                for finding in restarted["findings"]
            )
        )

    def test_same_name_noop_trigger_is_rejected(self) -> None:
        self.ledger.append(
            event_type="DECISION",
            vertical_id="lyte-services",
            subject_id="decision-1",
            payload={"decision": "DENY"},
            event_id="original",
        )
        with closing(sqlite3.connect(self.path)) as connection:
            with connection:
                connection.execute("DROP TRIGGER ledger_events_no_update")
                connection.execute(
                    "CREATE TRIGGER ledger_events_no_update BEFORE UPDATE ON ledger_events BEGIN SELECT 1; END"
                )
                connection.execute("UPDATE ledger_events SET payload_json='{}'")

        with self.assertRaisesRegex(LedgerError, "definition is invalid"):
            self.ledger.append(
                event_type="DECISION",
                vertical_id="lyte-services",
                subject_id="decision-2",
                payload={"decision": "ALLOW"},
            )
        report = OutcomeLedger(self.path).verify()
        self.assertEqual(report["status"], "INVALID")
        self.assertTrue(
            any("definition is invalid" in finding for finding in report["findings"])
        )

    def test_concurrent_appends_form_one_chain(self) -> None:
        def append(index: int) -> None:
            self.ledger.append(
                event_type="DECISION",
                vertical_id="lyte-services",
                subject_id=f"decision-{index}",
                payload={"index": index},
            )

        with ThreadPoolExecutor(max_workers=6) as executor:
            list(executor.map(append, range(12)))
        report = self.ledger.verify()
        self.assertEqual(report["status"], "VERIFIED")
        self.assertEqual(report["event_count"], 12)

    def test_many_independent_instances_share_one_cold_start(self) -> None:
        cold_path = Path(self.temporary.name) / "cold-start.sqlite3"

        def initialize(_: int) -> None:
            OutcomeLedger(cold_path).initialize()

        with ThreadPoolExecutor(max_workers=32) as executor:
            list(executor.map(initialize, range(64)))
        report = OutcomeLedger(cold_path).verify()
        self.assertEqual(report["status"], "EMPTY")
        self.assertEqual(report["event_count"], 0)

    def test_independent_processes_share_one_cold_start(self) -> None:
        cold_path = Path(self.temporary.name) / "process-cold-start.sqlite3"
        runtime_root = Path(__file__).resolve().parents[1]
        program = (
            "import sys; sys.path.insert(0, sys.argv[1]); "
            "from szl_vertical_runtime.ledger import OutcomeLedger; "
            "OutcomeLedger(sys.argv[2]).initialize()"
        )

        def initialize(_: int) -> subprocess.CompletedProcess[str]:
            return subprocess.run(
                [
                    sys.executable,
                    "-I",
                    "-B",
                    "-c",
                    program,
                    str(runtime_root),
                    str(cold_path),
                ],
                check=False,
                capture_output=True,
                text=True,
            )

        with ThreadPoolExecutor(max_workers=8) as executor:
            results = list(executor.map(initialize, range(8)))
        self.assertTrue(
            all(result.returncode == 0 for result in results),
            [result.stderr for result in results if result.returncode != 0],
        )
        self.assertEqual(OutcomeLedger(cold_path).verify()["status"], "EMPTY")


if __name__ == "__main__":
    unittest.main()
