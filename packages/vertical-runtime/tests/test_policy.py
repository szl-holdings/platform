from __future__ import annotations

import tempfile
import unittest
from concurrent.futures import ThreadPoolExecutor
from copy import deepcopy
from pathlib import Path
from unittest.mock import patch

from fixtures import cell, request
from szl_vertical_runtime.ledger import OutcomeLedger
from szl_vertical_runtime.policy import DecisionEngine, PolicyError, scenario_forge
from szl_vertical_runtime.receipts import build_initial_receipt, get_receipt


class PolicyTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.ledger = OutcomeLedger(Path(self.temporary.name) / "ledger.sqlite3")
        self.cell = cell()
        self.engine = DecisionEngine({"lyte-services": self.cell}, ledger=self.ledger)

    def test_allowed_action_requires_approval_and_never_executes(self) -> None:
        result = self.engine.evaluate("lyte-services", request())
        self.assertEqual(result["decision"], "REQUIRE_APPROVAL")
        self.assertFalse(result["execution_permitted"])
        self.assertEqual(result["external_side_effects"], [])
        self.assertTrue(
            all(
                item["authority"] == "ADVISORY_ONLY"
                for item in result["formula_bindings"]
            )
        )
        self.assertEqual(self.ledger.verify()["status"], "VERIFIED")
        self.assertEqual(self.ledger.verify()["event_count"], 2)
        receipt = build_initial_receipt(
            decision=result,
            request=request(),
            source_manifest_sha256=result["manifest_digest"],
        )
        self.assertEqual(
            get_receipt(
                self.ledger,
                receipt_id=receipt["receipt_id"],
                source_manifest_sha256=result["manifest_digest"],
                vertical_id="lyte-services",
            ),
            receipt,
        )

    def test_prohibited_unknown_and_missing_evidence_fail_closed(self) -> None:
        prohibited = self.engine.evaluate(
            "lyte-services", {**request("execute a payment"), "request_id": "request-2"}
        )
        self.assertEqual(prohibited["decision"], "DENY")
        unknown = self.engine.evaluate(
            "lyte-services", {**request("change pricing"), "request_id": "request-3"}
        )
        self.assertEqual(unknown["decision"], "ESCALATE")
        missing = request()
        missing["request_id"] = "request-4"
        missing["evidence"] = []
        self.assertEqual(
            self.engine.evaluate("lyte-services", missing)["decision"], "DENY"
        )

    def test_request_contract_rejects_malformed_shapes_before_persistence(
        self,
    ) -> None:
        candidates: list[tuple[str, dict[str, object]]] = []

        extra_request = request()
        extra_request["unexpected"] = True
        candidates.append(("request extra", extra_request))

        missing_workflow = request()
        del missing_workflow["workflow"]
        candidates.append(("request missing", missing_workflow))

        bad_workflow = request(workflow="unregistered workflow")
        candidates.append(("workflow", bad_workflow))

        principal_extra = request()
        principal_extra["principal"]["role"] = "operator"  # type: ignore[index]
        candidates.append(("principal extra", principal_extra))

        duplicate_claim = request()
        duplicate_claim["principal"]["authority_claims"] = [  # type: ignore[index]
            "reviewer",
            "Reviewer",
        ]
        candidates.append(("duplicate claim", duplicate_claim))

        evidence_missing = request()
        del evidence_missing["evidence"][0]["freshness"]  # type: ignore[index]
        candidates.append(("evidence missing", evidence_missing))

        evidence_extra = request()
        evidence_extra["evidence"][0]["source"] = "inline"  # type: ignore[index]
        candidates.append(("evidence extra", evidence_extra))

        duplicate_evidence = request()
        duplicate_evidence["evidence"].append(  # type: ignore[union-attr]
            deepcopy(duplicate_evidence["evidence"][0])  # type: ignore[index]
        )
        candidates.append(("duplicate evidence", duplicate_evidence))

        duplicate_digest = request()
        repeated_digest = deepcopy(duplicate_digest["evidence"][0])  # type: ignore[index]
        repeated_digest["id"] = "distinct-evidence-id"
        duplicate_digest["evidence"].append(repeated_digest)  # type: ignore[union-attr]
        candidates.append(("duplicate digest with distinct IDs", duplicate_digest))

        duplicate_limitation = request()
        duplicate_limitation["evidence"][0]["limitations"] = [  # type: ignore[index]
            "local only",
            "LOCAL ONLY",
        ]
        candidates.append(("duplicate limitation", duplicate_limitation))

        bad_digest = request()
        bad_digest["evidence"][0]["digest"] = "sha256:not-a-digest"  # type: ignore[index]
        candidates.append(("digest", bad_digest))

        bad_class = request(evidence_class="VERIFIED")
        candidates.append(("evidence class", bad_class))

        bad_freshness = request(freshness="FRESH")
        candidates.append(("freshness", bad_freshness))

        for label, candidate in candidates:
            with self.subTest(label=label), self.assertRaises(PolicyError):
                self.engine.evaluate("lyte-services", candidate)

        self.assertEqual(self.ledger.verify()["status"], "EMPTY")

    def test_evidence_state_ordering_is_fail_closed(self) -> None:
        cases = (
            (
                "prohibited outranks unknown",
                request(
                    "execute a payment",
                    freshness="UNKNOWN",
                ),
                "DENY",
                "PROHIBITED_ACTION",
            ),
            (
                "stale",
                request(freshness="STALE"),
                "DENY",
                "EVIDENCE_STALE_OR_UNAVAILABLE",
            ),
            (
                "unavailable",
                request(evidence_class="UNAVAILABLE"),
                "DENY",
                "EVIDENCE_STALE_OR_UNAVAILABLE",
            ),
            (
                "unknown",
                request(freshness="UNKNOWN"),
                "ESCALATE",
                "EVIDENCE_UNKNOWN_OR_UNVERIFIED",
            ),
            (
                "unverified",
                request(evidence_class="UNVERIFIED"),
                "ESCALATE",
                "EVIDENCE_UNKNOWN_OR_UNVERIFIED",
            ),
            (
                "current modeled",
                request(evidence_class="MODELED"),
                "REQUIRE_APPROVAL",
                "HUMAN_AUTHORITY_REQUIRED",
            ),
        )
        for label, candidate, expected_decision, expected_reason in cases:
            with self.subTest(label=label):
                result = self.engine.evaluate("lyte-services", candidate, record=False)
                self.assertEqual(result["decision"], expected_decision)
                self.assertIn(expected_reason, result["reasons"])
                self.assertFalse(result["execution_permitted"])

    def test_allowed_actions_are_exact_and_prohibitions_use_token_boundaries(
        self,
    ) -> None:
        normalized_exact = self.engine.evaluate(
            "lyte-services",
            request("Recommend: a reconciled service option!"),
            record=False,
        )
        self.assertEqual(normalized_exact["decision"], "REQUIRE_APPROVAL")

        compound_allowed = self.engine.evaluate(
            "lyte-services",
            request("recommend a reconciled service option plus extras"),
            record=False,
        )
        self.assertEqual(compound_allowed["decision"], "ESCALATE")

        phrase_prohibited = self.engine.evaluate(
            "lyte-services",
            request("please execute a payment now"),
            record=False,
        )
        self.assertEqual(phrase_prohibited["decision"], "DENY")

        boundary_cell = cell()
        boundary_cell["allowed_actions"] = ["spread"]
        boundary_cell["prohibited_actions"] = ["read"]
        boundary_engine = DecisionEngine({"lyte-services": boundary_cell})
        boundary = boundary_engine.evaluate(
            "lyte-services", request("spread"), record=False
        )
        self.assertEqual(boundary["decision"], "REQUIRE_APPROVAL")

    def test_unknown_vertical_and_mode_raise(self) -> None:
        with self.assertRaises(PolicyError):
            self.engine.evaluate("missing", request())
        with self.assertRaises(PolicyError):
            self.engine.evaluate("lyte-services", request(), mode="AUTONOMOUS")

    def test_killinchu_physical_effector_is_always_denied(self) -> None:
        killinchu = cell("killinchu")
        killinchu["space_visibility"] = "public"
        killinchu["allowed_actions"] = ["recommend a target engagement option"]
        engine = DecisionEngine({"killinchu": killinchu})
        result = engine.evaluate("killinchu", request("target engagement"))
        self.assertEqual(result["decision"], "DENY")
        self.assertIn("PHYSICAL_EFFECTOR_FORBIDDEN", result["reasons"])

        compound = engine.evaluate(
            "killinchu",
            {**request("simulate then fire missile"), "request_id": "request-compound"},
        )
        self.assertEqual(compound["decision"], "DENY")
        self.assertIn("PHYSICAL_EFFECTOR_FORBIDDEN", compound["reasons"])
        unknown_compound = engine.evaluate(
            "killinchu",
            {
                **request("simulate then conduct kinetic strike"),
                "request_id": "request-unknown-compound",
            },
        )
        self.assertEqual(unknown_compound["decision"], "DENY")
        self.assertIn("HIGH_STAKES_ACTION_NOT_ADMITTED", unknown_compound["reasons"])

    def test_outcome_and_shadow_are_recorded_without_effectors(self) -> None:
        decision = self.engine.evaluate("lyte-services", request())
        outcome = self.engine.record_outcome(
            vertical_id="lyte-services",
            decision_id=decision["decision_id"],
            outcome={"metric": "operator-reviewed", "value": True},
        )
        self.assertEqual(outcome["event_type"], "OUTCOME")
        candidate = cell()
        candidate["allowed_actions"] = []
        comparison = self.engine.shadow_compare(
            vertical_id="lyte-services",
            candidate_cell=candidate,
            scenarios=[request()],
        )
        self.assertEqual(comparison["mode"], "LOG_ONLY")
        self.assertEqual(comparison["side_effects"], [])
        self.assertEqual(comparison["changed_decisions"], 1)

    def test_request_id_is_idempotent_and_divergent_replay_is_blocked(self) -> None:
        first = self.engine.evaluate("lyte-services", request())
        replay = self.engine.evaluate("lyte-services", request())
        self.assertEqual(first, replay)
        self.assertEqual(self.ledger.verify()["event_count"], 2)
        divergent = request("execute a payment")
        with self.assertRaisesRegex(PolicyError, "DIVERGENT_REPLAY"):
            self.engine.evaluate("lyte-services", divergent)

    def test_replay_is_bound_to_the_current_manifest_digest(self) -> None:
        self.engine.evaluate("lyte-services", request())
        changed = cell()
        changed["allowed_actions"] = []
        changed["prohibited_actions"] = ["recommend a reconciled service option"]
        restarted = DecisionEngine({"lyte-services": changed}, ledger=self.ledger)
        with self.assertRaisesRegex(PolicyError, "DIVERGENT_REPLAY"):
            restarted.evaluate("lyte-services", request())

    def test_concurrent_replay_is_deterministic_and_divergence_is_normalized(
        self,
    ) -> None:
        same = request()
        with ThreadPoolExecutor(max_workers=32) as executor:
            results = list(
                executor.map(
                    lambda _: self.engine.evaluate("lyte-services", same), range(64)
                )
            )
        self.assertTrue(all(result == results[0] for result in results))
        self.assertEqual(self.ledger.verify()["event_count"], 2)

        other_ledger = OutcomeLedger(Path(self.temporary.name) / "mixed.sqlite3")
        other_engine = DecisionEngine({"lyte-services": self.cell}, ledger=other_ledger)
        requests = [
            request("recommend a reconciled service option")
            if index % 2 == 0
            else request("execute a payment")
            for index in range(64)
        ]

        def evaluate(candidate: dict[str, object]) -> tuple[str, object]:
            try:
                return ("ok", other_engine.evaluate("lyte-services", candidate))
            except PolicyError as error:
                return ("error", str(error))

        with ThreadPoolExecutor(max_workers=32) as executor:
            mixed = list(executor.map(evaluate, requests))
        successes = [value for status, value in mixed if status == "ok"]
        errors = [value for status, value in mixed if status == "error"]
        self.assertEqual(len(successes), 32)
        self.assertTrue(all(value == successes[0] for value in successes))
        self.assertEqual(len(errors), 32)
        self.assertTrue(all("DIVERGENT_REPLAY" in str(value) for value in errors))
        self.assertEqual(other_ledger.verify()["event_count"], 2)

    def test_independent_engines_replay_one_atomic_decision_receipt_pair(self) -> None:
        def evaluate(_: int) -> dict[str, object]:
            engine = DecisionEngine(
                {"lyte-services": self.cell},
                ledger=OutcomeLedger(self.ledger.path),
            )
            return engine.evaluate("lyte-services", request())

        with ThreadPoolExecutor(max_workers=16) as executor:
            results = list(executor.map(evaluate, range(32)))
        self.assertTrue(all(result == results[0] for result in results))
        self.assertEqual(self.ledger.verify()["event_count"], 2)
        self.assertEqual(
            [event["event_type"] for event in self.ledger.events()],
            ["DECISION", "DECISION_RECEIPT"],
        )

    def test_initial_receipt_collision_cannot_leave_a_decision_write(self) -> None:
        timestamp = "2026-10-03T12:00:00Z"
        with patch("szl_vertical_runtime.policy.utc_now", return_value=timestamp):
            modeled = self.engine.evaluate("lyte-services", request(), record=False)
            receipt = build_initial_receipt(
                decision=modeled,
                request=request(),
                source_manifest_sha256=modeled["manifest_digest"],
            )
            original = self.ledger.append(
                event_type="DECISION_RECEIPT",
                vertical_id="lyte-services",
                subject_id=modeled["decision_id"],
                payload=receipt,
                event_id=receipt["receipt_id"],
                occurred_at=receipt["recorded_at"],
            )
            with self.assertRaisesRegex(PolicyError, "persistence failed closed"):
                self.engine.evaluate("lyte-services", request())
        self.assertIsNone(self.ledger.get(modeled["decision_id"]))
        self.assertEqual(self.ledger.events(), [original])
        self.assertEqual(self.ledger.verify()["event_count"], 1)

    def test_enforce_replay_without_initial_receipt_is_rejected(self) -> None:
        modeled = self.engine.evaluate("lyte-services", request(), record=False)
        self.ledger.append(
            event_type="DECISION",
            vertical_id="lyte-services",
            subject_id=modeled["decision_id"],
            payload=modeled,
            event_id=modeled["decision_id"],
            occurred_at=modeled["evaluated_at"],
        )
        with self.assertRaisesRegex(PolicyError, "initial receipt integrity"):
            self.engine.evaluate("lyte-services", request())
        self.assertEqual(self.ledger.verify()["event_count"], 1)

    def test_log_only_persists_no_actionable_receipt(self) -> None:
        first = self.engine.evaluate("lyte-services", request(), mode="LOG_ONLY")
        replay = self.engine.evaluate("lyte-services", request(), mode="LOG_ONLY")
        self.assertEqual(first, replay)
        self.assertFalse(first["execution_permitted"])
        self.assertEqual(self.ledger.verify()["event_count"], 1)
        self.assertEqual(self.ledger.events()[0]["event_type"], "DECISION")

    def test_tampered_ledger_cannot_serve_an_idempotent_replay(self) -> None:
        import sqlite3
        from contextlib import closing

        self.engine.evaluate("lyte-services", request())
        with closing(sqlite3.connect(self.ledger.path)) as connection:
            with connection:
                connection.execute("DROP TRIGGER ledger_events_no_update")
                connection.execute("UPDATE ledger_events SET payload_json='{}'")
        with self.assertRaisesRegex(PolicyError, "ledger integrity"):
            self.engine.evaluate("lyte-services", request())

    def test_orphan_outcome_is_rejected(self) -> None:
        with self.assertRaisesRegex(PolicyError, "recorded decision"):
            self.engine.record_outcome(
                vertical_id="lyte-services",
                decision_id="decision:missing",
                outcome={"metric": "none"},
            )

    def test_scenario_forge_is_deterministic_and_synthetic(self) -> None:
        scenarios = scenario_forge(self.cell)
        self.assertEqual(scenarios, scenario_forge(self.cell))
        self.assertTrue(
            all(
                set(item)
                == {"request_id", "action", "workflow", "principal", "evidence"}
                for item in scenarios
            )
        )
        self.assertTrue(
            all(item["request_id"].startswith("lyte-services-") for item in scenarios)
        )
        for scenario in scenarios:
            self.engine.evaluate("lyte-services", scenario, record=False)


if __name__ == "__main__":
    unittest.main()
