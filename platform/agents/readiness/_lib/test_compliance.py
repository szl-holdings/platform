"""Offline evidence-label regressions; no live signing, GitHub, or Hub calls."""
from __future__ import annotations

import base64
import importlib.util
import json
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

EXECUTOR = Path(__file__).resolve().parent.parent / "readiness-compliance" / "executor.py"
SPEC = importlib.util.spec_from_file_location("readiness_compliance_under_test", EXECUTOR)
compliance = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(compliance)

DEMO = {"name": "offline-demo", "repo": "example/local", "url_env": "OFFLINE_DEMO_URL"}


def envelope() -> dict:
    return {
        "payloadType": "application/vnd.szl.khipu+json",
        "payload": base64.b64encode(b'{"fixture":"offline"}').decode(),
        "signatures": [{"sig": base64.b64encode(b"unverified-fixture").decode()}],
    }


class ComplianceEvidenceTest(unittest.TestCase):
    def payload(self, rows: list[dict], doctrine: list[dict] | None = None) -> dict:
        with patch.object(compliance, "doctrine_consistency", return_value=doctrine or []), \
                patch.object(compliance, "wire_d_dsse", return_value=rows), \
                patch.object(compliance, "legal_and_privacy", return_value={
                    "legal_boundaries_killinchu": True,
                    "privacy_policy_present": True,
                    "dpa_template_present": True,
                }), patch.object(compliance.khipu, "emit") as emit:
            self.assertEqual(compliance.main(), 0)
        return emit.call_args.args[1]

    def assert_no_compliance_claim(self, payload: dict) -> None:
        for section in payload["compliance_matrix"].values():
            self.assertTrue(section)
            self.assertTrue(all(value is False for value in section.values()))
        self.assertEqual(payload["compliance_assessment"]["state"], "NOT_ASSESSED")

    def observed_wire(self, value: object) -> dict:
        response = MagicMock()
        response.__enter__.return_value.read.return_value = json.dumps(value).encode()
        with patch.object(compliance.khipu, "FLAGSHIPS", [DEMO]), \
                patch.object(compliance.khipu, "flagship_url", return_value="https://example.invalid"), \
                patch.object(compliance.urllib.request, "urlopen", return_value=response):
            return compliance.wire_d_dsse()[0]

    def test_empty_registry_never_claims_compliance(self) -> None:
        self.assert_no_compliance_claim(self.payload([]))

    def test_unset_urls_never_claim_logging_or_traceability(self) -> None:
        self.assert_no_compliance_claim(self.payload([
            {"flagship": "offline-demo", "verifiable": None, "reason": "url unset"},
        ]))

    def test_partial_observation_is_incomplete(self) -> None:
        payload = self.payload([
            {"envelope_structure_present": True}, {"verifiable": None},
        ])
        self.assert_no_compliance_claim(payload)
        self.assertIs(payload["technical_observations"]["signed_envelope_structure_present"], False)

    def test_claimed_verification_cannot_imply_logging_or_framework_compliance(self) -> None:
        self.assert_no_compliance_claim(self.payload([
            {"verifiable": True, "has_payloadType": True, "envelope_structure_present": True},
        ], [{"has_v11_numbers": True, "stale_markers": []}]))

    def test_structural_envelope_is_not_signature_verification(self) -> None:
        row = self.observed_wire(envelope())
        self.assertIs(row["envelope_structure_present"], True)
        self.assertIsNone(row["verifiable"])
        self.assertEqual(row["verification_state"], "NOT_MEASURED")
        self.assert_no_compliance_claim(self.payload([row]))

    def test_payload_type_is_required_and_nonempty(self) -> None:
        for value in (None, "", " ", [], False):
            with self.subTest(value=value):
                env = envelope()
                env["payloadType"] = value
                self.assertIs(self.observed_wire(env)["envelope_structure_present"], False)

    def test_payload_requires_nonempty_base64_bytes(self) -> None:
        for value in (None, "", "!invalid!", [], False):
            with self.subTest(value=value):
                env = envelope()
                env["payload"] = value
                self.assertIs(self.observed_wire(env)["envelope_structure_present"], False)

    def test_signature_records_require_nonempty_base64_bytes(self) -> None:
        for value in ([], None, {}, [None], ["signature"], [{}], [{"sig": ""}], [{"sig": "!"}]):
            with self.subTest(value=value):
                env = envelope()
                env["signatures"] = value
                self.assertIs(self.observed_wire(env)["envelope_structure_present"], False)

    def test_nonobject_response_is_invalid_evidence(self) -> None:
        for value in ([], None, "fallback", True):
            with self.subTest(value=value):
                self.assertIs(self.observed_wire(value)["envelope_structure_present"], False)

    def test_unset_url_is_unavailable_without_network_call(self) -> None:
        with patch.object(compliance.khipu, "FLAGSHIPS", [DEMO]), \
                patch.object(compliance.khipu, "flagship_url", return_value=None), \
                patch.object(compliance.urllib.request, "urlopen") as network:
            row = compliance.wire_d_dsse()[0]
        network.assert_not_called()
        self.assertEqual(row["verification_state"], "UNAVAILABLE")
        self.assertIsNone(row["verifiable"])

    def test_fetch_error_is_visible_and_cannot_claim_compliance(self) -> None:
        with patch.object(compliance.khipu, "FLAGSHIPS", [DEMO]), \
                patch.object(compliance.khipu, "flagship_url", return_value="https://example.invalid"), \
                patch.object(compliance.urllib.request, "urlopen", side_effect=OSError("offline")):
            row = compliance.wire_d_dsse()[0]
        self.assertEqual(row["verification_state"], "FETCH_ERROR")
        self.assertIs(row["verifiable"], False)
        self.assert_no_compliance_claim(self.payload([row]))

    def test_doctrine_observation_requires_nonempty_samples(self) -> None:
        payload = self.payload([])
        self.assertIs(payload["technical_observations"]["doctrine_numbers_consistent"], False)

    def test_stale_doctrine_blocks_consistency_observation(self) -> None:
        payload = self.payload([], [{"has_v11_numbers": True, "stale_markers": ["v9"]}])
        self.assertIs(payload["technical_observations"]["doctrine_numbers_consistent"], False)

    def test_observed_doctrine_is_separate_from_framework_assessment(self) -> None:
        payload = self.payload([], [{"has_v11_numbers": True, "stale_markers": []}])
        self.assertIs(payload["technical_observations"]["doctrine_numbers_consistent"], True)
        self.assert_no_compliance_claim(payload)


if __name__ == "__main__":
    unittest.main(verbosity=2)
