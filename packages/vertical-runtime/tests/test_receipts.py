from __future__ import annotations

import tempfile
import unittest
from copy import deepcopy
from pathlib import Path

from fixtures import cell, request
from szl_vertical_runtime.canonical import digest_value
from szl_vertical_runtime.ledger import OutcomeLedger
from szl_vertical_runtime.policy import DecisionEngine
from szl_vertical_runtime.receipts import (
    ReceiptConflict,
    ReceiptError,
    get_receipt,
    initial_receipt_id,
    persist_human_disposition,
    persist_initial_receipt,
    validate_receipt,
)


class ReceiptTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.path = Path(self.temporary.name) / "ledger.sqlite3"
        self.cell = cell()
        self.digest = digest_value(self.cell)
        self.ledger = OutcomeLedger(self.path)
        self.engine = DecisionEngine(
            {self.cell["vertical_id"]: self.cell}, ledger=self.ledger
        )

    def _initial(self) -> tuple[dict[str, object], dict[str, object]]:
        request_value = request()
        decision = self.engine.evaluate(self.cell["vertical_id"], request_value)
        receipt, created = persist_initial_receipt(
            self.ledger,
            decision=decision,
            request=request_value,
            source_manifest_sha256=self.digest,
        )
        self.assertFalse(created)
        return decision, receipt

    def test_initial_receipt_is_schema_conformant_and_idempotent(self) -> None:
        request_value = request()
        decision = self.engine.evaluate(self.cell["vertical_id"], request_value)
        first, created = persist_initial_receipt(
            self.ledger,
            decision=decision,
            request=request_value,
            source_manifest_sha256=self.digest,
        )
        second, replay_created = persist_initial_receipt(
            self.ledger,
            decision=decision,
            request=request_value,
            source_manifest_sha256=self.digest,
        )
        self.assertFalse(created)
        self.assertFalse(replay_created)
        self.assertEqual(first, second)
        self.assertEqual(first["decision"], "RECOMMEND")
        self.assertEqual(first["authority_state"], "APPROVAL_REQUIRED")
        self.assertFalse(first["execution_permitted"])
        self.assertEqual(first["external_side_effects"], [])
        self.assertEqual(first["formula_receipts"], [])
        self.assertIn("EVIDENCE_BYTES_NOT_VERIFIED", first["limitations"])
        validate_receipt(first, source_manifest_sha256=self.digest)

    def test_human_disposition_is_append_only_idempotent_and_conflict_safe(
        self,
    ) -> None:
        decision, initial = self._initial()
        first, created = persist_human_disposition(
            self.ledger,
            authority_state="APPROVED",
            decision_id=decision["decision_id"],
            human_actor_id="operator-1",
            source_manifest_sha256=self.digest,
            vertical_id=self.cell["vertical_id"],
        )
        second, replay_created = persist_human_disposition(
            self.ledger,
            authority_state="APPROVED",
            decision_id=decision["decision_id"],
            human_actor_id="operator-1",
            source_manifest_sha256=self.digest,
            vertical_id=self.cell["vertical_id"],
        )
        self.assertTrue(created)
        self.assertFalse(replay_created)
        self.assertEqual(first, second)
        self.assertEqual(first["receipt_kind"], "HUMAN_DISPOSITION")
        self.assertEqual(first["authority_state"], "APPROVED")
        self.assertFalse(first["execution_permitted"])
        self.assertNotEqual(first["receipt_id"], initial["receipt_id"])
        with self.assertRaises(ReceiptConflict):
            persist_human_disposition(
                self.ledger,
                authority_state="DENIED",
                decision_id=decision["decision_id"],
                human_actor_id="operator-2",
                source_manifest_sha256=self.digest,
                vertical_id=self.cell["vertical_id"],
            )

    def test_receipts_survive_restart_and_are_vertical_scoped(self) -> None:
        _, initial = self._initial()
        restarted = OutcomeLedger(self.path)
        stored = get_receipt(
            restarted,
            receipt_id=initial["receipt_id"],
            source_manifest_sha256=self.digest,
            vertical_id=self.cell["vertical_id"],
        )
        self.assertEqual(stored, initial)
        self.assertIsNone(
            get_receipt(
                restarted,
                receipt_id=initial["receipt_id"],
                source_manifest_sha256=self.digest,
                vertical_id="aegis-assurance",
            )
        )

    def test_denied_decision_cannot_be_locally_approved(self) -> None:
        request_value = request(action="execute a payment")
        decision = self.engine.evaluate(self.cell["vertical_id"], request_value)
        receipt, _ = persist_initial_receipt(
            self.ledger,
            decision=decision,
            request=request_value,
            source_manifest_sha256=self.digest,
        )
        self.assertEqual(receipt["authority_state"], "DENIED")
        with self.assertRaisesRegex(ReceiptError, "not awaiting"):
            persist_human_disposition(
                self.ledger,
                authority_state="APPROVED",
                decision_id=decision["decision_id"],
                human_actor_id="operator-1",
                source_manifest_sha256=self.digest,
                vertical_id=self.cell["vertical_id"],
            )

    def test_initial_receipt_requires_the_exact_recorded_decision(self) -> None:
        request_value = request()
        recorded = self.engine.evaluate(self.cell["vertical_id"], request_value)
        divergent = dict(recorded)
        divergent["reasons"] = ["FORGED_REASON"]
        with self.assertRaisesRegex(ReceiptError, "payload digest"):
            persist_initial_receipt(
                self.ledger,
                decision=divergent,
                request=request_value,
                source_manifest_sha256=self.digest,
            )

        orphan_ledger = OutcomeLedger(Path(self.temporary.name) / "orphan.sqlite3")
        with self.assertRaisesRegex(ReceiptError, "not recorded"):
            persist_initial_receipt(
                orphan_ledger,
                decision=recorded,
                request=request_value,
                source_manifest_sha256=self.digest,
            )

    def test_log_only_decision_cannot_produce_a_receipt(self) -> None:
        request_value = request()
        decision = self.engine.evaluate(
            self.cell["vertical_id"], request_value, mode="LOG_ONLY"
        )
        with self.assertRaisesRegex(ReceiptError, "ENFORCE"):
            persist_initial_receipt(
                self.ledger,
                decision=decision,
                request=request_value,
                source_manifest_sha256=self.digest,
            )

    def test_request_substitution_is_rejected_without_writes(self) -> None:
        original = request()
        decision = self.engine.evaluate(self.cell["vertical_id"], original)
        variants = []
        changed = deepcopy(original)
        changed["request_id"] = "unrelated"
        variants.append(changed)
        changed = deepcopy(original)
        changed["evidence"][0]["digest"] = "sha256:" + "b" * 64
        variants.append(changed)
        changed = deepcopy(original)
        changed["evidence"][0]["limitations"] = ["SUBSTITUTED"]
        variants.append(changed)
        changed = deepcopy(original)
        changed["action"] += " "
        variants.append(changed)
        changed = deepcopy(original)
        changed["extra"] = "not admitted"
        variants.append(changed)
        before = self.path.read_bytes()
        count = self.ledger.verify()["event_count"]
        for variant in variants:
            with self.subTest(request=variant):
                with self.assertRaisesRegex(ReceiptError, "request digest"):
                    persist_initial_receipt(
                        self.ledger,
                        decision=decision,
                        request=variant,
                        source_manifest_sha256=self.digest,
                    )
                self.assertEqual(self.path.read_bytes(), before)
                self.assertEqual(self.ledger.verify()["event_count"], count)

    def _append_receipt(self, ledger: OutcomeLedger, receipt: dict) -> None:
        ledger.append(
            event_type="DECISION_RECEIPT"
            if receipt["receipt_kind"] == "INITIAL"
            else "HUMAN_DISPOSITION_RECEIPT",
            vertical_id=receipt["vertical_id"],
            subject_id=receipt["decision_id"],
            payload=receipt,
            event_id=receipt["receipt_id"],
            occurred_at=receipt["recorded_at"],
        )

    def _copy_decision(self, ledger: OutcomeLedger, decision: dict) -> None:
        event = self.ledger.get(decision["decision_id"])
        ledger.append(
            event_type=event["event_type"],
            vertical_id=event["vertical_id"],
            subject_id=event["subject_id"],
            payload=event["payload"],
            event_id=event["event_id"],
            occurred_at=event["occurred_at"],
        )

    def test_get_rejects_orphan_initial_receipt_without_writes(self) -> None:
        _, initial = self._initial()
        orphan = dict(initial, decision_id="decision:" + "f" * 64)
        ledger = OutcomeLedger(Path(self.temporary.name) / "orphan-get.sqlite3")
        self._append_receipt(ledger, orphan)
        before = ledger.path.read_bytes()
        with self.assertRaisesRegex(ReceiptError, "not recorded"):
            get_receipt(
                ledger,
                receipt_id=orphan["receipt_id"],
                source_manifest_sha256=self.digest,
                vertical_id=self.cell["vertical_id"],
            )
        self.assertEqual(ledger.path.read_bytes(), before)
        self.assertEqual(ledger.verify()["event_count"], 1)

    def test_get_rejects_receipt_bound_to_other_replay_digest(self) -> None:
        _, initial = self._initial()
        divergent = dict(initial, replay_digest="f" * 64)
        divergent["receipt_id"] = initial_receipt_id(
            decision_digest=divergent["replay_digest"],
            source_manifest_sha256=self.digest,
            vertical_id=self.cell["vertical_id"],
        )
        validate_receipt(divergent, source_manifest_sha256=self.digest)
        self._append_receipt(self.ledger, divergent)
        with self.assertRaisesRegex(ReceiptError, "parent decision"):
            get_receipt(
                self.ledger,
                receipt_id=divergent["receipt_id"],
                source_manifest_sha256=self.digest,
                vertical_id=self.cell["vertical_id"],
            )

    def test_get_rejects_human_receipt_without_initial_parent(self) -> None:
        decision, _ = self._initial()
        human, _ = persist_human_disposition(
            self.ledger,
            authority_state="APPROVED",
            decision_id=decision["decision_id"],
            human_actor_id="operator-1",
            source_manifest_sha256=self.digest,
            vertical_id=self.cell["vertical_id"],
        )
        ledger = OutcomeLedger(Path(self.temporary.name) / "orphan-human.sqlite3")
        self._copy_decision(ledger, decision)
        self._append_receipt(ledger, human)
        with self.assertRaisesRegex(ReceiptError, "initial receipt is missing"):
            get_receipt(
                ledger,
                receipt_id=human["receipt_id"],
                source_manifest_sha256=self.digest,
                vertical_id=self.cell["vertical_id"],
            )

    def test_get_rejects_human_receipt_with_substituted_evidence(self) -> None:
        decision, initial = self._initial()
        human, _ = persist_human_disposition(
            self.ledger,
            authority_state="APPROVED",
            decision_id=decision["decision_id"],
            human_actor_id="operator-1",
            source_manifest_sha256=self.digest,
            vertical_id=self.cell["vertical_id"],
        )
        ledger = OutcomeLedger(Path(self.temporary.name) / "altered-human.sqlite3")
        self._copy_decision(ledger, decision)
        self._append_receipt(ledger, initial)
        altered = dict(human, evidence_digests=["b" * 64])
        validate_receipt(altered, source_manifest_sha256=self.digest)
        self._append_receipt(ledger, altered)
        with self.assertRaisesRegex(ReceiptError, "diverges from its initial"):
            get_receipt(
                ledger,
                receipt_id=altered["receipt_id"],
                source_manifest_sha256=self.digest,
                vertical_id=self.cell["vertical_id"],
            )


if __name__ == "__main__":
    unittest.main()
