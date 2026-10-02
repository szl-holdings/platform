"""Offline readiness verifier regressions; no Hub, GitHub or runtime writes.

State-transition tests are stdlib-only, as the fleet runs discovery before
installing dependencies. When PyNaCl is available, additional tests exercise
real Ed25519 signing and verification with fresh, in-memory synthetic keys.
"""
from __future__ import annotations

import base64
import importlib.util
import json
import os
import unittest
from pathlib import Path
from unittest.mock import patch

EXECUTOR = Path(__file__).resolve().parent.parent / "readiness-audit-rift" / "executor.py"
SPEC = importlib.util.spec_from_file_location("readiness_audit_rift_under_test", EXECUTOR)
audit = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(audit)

try:
    from nacl.signing import SigningKey
except ImportError:
    SigningKey = None


def receipt(payload: dict) -> dict:
    return {"file": "offline-fixture.json", "envelope": {}, "body": {"payload": payload}}


def readme_response() -> str:
    return json.dumps({"type": "file", "name": "README.md", "encoding": "base64",
                       "content": base64.b64encode(b"# Offline README\n").decode() + "\n"})


class AuditPeerStateTest(unittest.TestCase):
    def setUp(self) -> None:
        signature = patch.object(audit, "reverify_signature", return_value=True)
        signature.start()
        self.addCleanup(signature.stop)

    def check(self, agent: str, payload: dict, response: tuple[int, str] = (0, "[]")) -> dict:
        with patch.object(audit, "latest_peer_receipt", return_value=receipt(payload)), \
                patch.object(audit, "gh", return_value=response):
            return audit.audit_peer(agent)

    def security(self, present: dict | None = None) -> dict:
        return {"repos": [{"repo": "szl-holdings/platform", "verdict": "GREEN",
                           "workflows": {"present": present or {"sbom": True}}}]}

    def test_missing_receipt_is_not_verified(self) -> None:
        with patch.object(audit, "latest_peer_receipt", return_value=None):
            self.assertEqual(audit.audit_peer("readiness-docs")["status"], "NO-RECEIPT")

    def test_fetch_failure_is_not_verified(self) -> None:
        with patch.object(audit, "latest_peer_receipt", return_value={"error": "offline fetch error"}):
            self.assertEqual(audit.audit_peer("readiness-docs")["status"], "FETCH-ERROR")

    def test_invalid_signature_blocks_rechecks(self) -> None:
        with patch.object(audit, "latest_peer_receipt", return_value=receipt(self.security())), \
                patch.object(audit, "reverify_signature", return_value=False), \
                patch.object(audit, "gh") as github:
            finding = audit.audit_peer("readiness-security")
        self.assertEqual(finding["status"], "FLAGGED")
        github.assert_not_called()

    def test_unsigned_receipt_blocks_rechecks(self) -> None:
        with patch.object(audit, "latest_peer_receipt", return_value=receipt(self.security())), \
                patch.object(audit, "reverify_signature", return_value=None), \
                patch.object(audit, "gh") as github:
            finding = audit.audit_peer("readiness-security")
        self.assertEqual(finding["status"], "UNVERIFIED")
        github.assert_not_called()

    def test_structural_only_peers_are_unverified(self) -> None:
        for agent in ("readiness-reliability", "readiness-observability",
                      "readiness-compliance", "readiness-dr"):
            with self.subTest(agent=agent):
                finding = self.check(agent, {})
                self.assertEqual(finding["status"], "UNVERIFIED")
                self.assertNotIn("over_claimed", finding)

    def test_missing_sample_is_unverified(self) -> None:
        for agent in ("readiness-security", "readiness-operability", "readiness-docs"):
            with self.subTest(agent=agent):
                self.assertEqual(self.check(agent, {})["status"], "UNVERIFIED")

    def test_security_requires_a_claimed_control(self) -> None:
        finding = self.check("readiness-security", self.security({"sbom": False}))
        self.assertEqual(finding["status"], "UNVERIFIED")

    def test_security_checks_the_control_not_just_the_directory(self) -> None:
        finding = self.check("readiness-security", self.security(),
                             (0, json.dumps([{"name": "unrelated.yml", "type": "file"}])))
        self.assertEqual(finding["status"], "FLAGGED")
        self.assertEqual(finding["sampled_control"], "sbom")

    def test_security_control_recheck_can_verify(self) -> None:
        finding = self.check("readiness-security", self.security(),
                             (0, json.dumps([{"name": "sbom.yml", "type": "file"}])))
        self.assertEqual(finding["status"], "VERIFIED")

    def test_security_does_not_verify_notes_or_workflow_directories(self) -> None:
        for entry in ({"name": "sbom-notes.md", "type": "file"},
                      {"name": "sbom.yml", "type": "dir"}):
            with self.subTest(entry=entry):
                finding = self.check("readiness-security", self.security(), (0, json.dumps([entry])))
                self.assertEqual(finding["status"], "FLAGGED")

    def test_failed_github_rechecks_are_errors(self) -> None:
        samples = {"readiness-security": self.security(),
                   "readiness-operability": {"flagships": [{"repo": "szl-holdings/platform",
                                                              "commits_last_7d": 0}]},
                   "readiness-docs": {"repos": [{"repo": "szl-holdings/platform",
                                                  "present": {"README.md": True}}]}}
        for agent, payload in samples.items():
            with self.subTest(agent=agent):
                finding = self.check(agent, payload, (1, "offline API failure"))
                self.assertEqual(finding["status"], "RESAMPLE-ERROR")

    def test_bad_json_is_a_resample_error(self) -> None:
        finding = self.check("readiness-security", self.security(), (0, "not json"))
        self.assertEqual(finding["status"], "RESAMPLE-ERROR")

    def test_exception_is_a_resample_error(self) -> None:
        with patch.object(audit, "latest_peer_receipt", return_value=receipt(self.security())), \
                patch.object(audit, "gh", side_effect=RuntimeError("offline probe failure")):
            finding = audit.audit_peer("readiness-security")
        self.assertEqual(finding["status"], "RESAMPLE-ERROR")

    def test_operability_rejects_non_list_commit_response(self) -> None:
        payload = {"flagships": [{"repo": "szl-holdings/platform", "commits_last_7d": 1}]}
        finding = self.check("readiness-operability", payload, (0, '{"message":"failure"}'))
        self.assertEqual(finding["status"], "RESAMPLE-ERROR")

    def test_operability_maintains_the_existing_count_tolerance(self) -> None:
        payload = {"flagships": [{"repo": "szl-holdings/platform", "commits_last_7d": 3}]}
        self.assertEqual(self.check("readiness-operability", payload)["status"], "FLAGGED")
        payload["flagships"][0]["commits_last_7d"] = 0
        self.assertEqual(self.check("readiness-operability", payload)["status"], "VERIFIED")

    def test_operability_does_not_verify_error_sentinels_or_invalid_counts(self) -> None:
        for count in (-1, -99, True, False, 0.0, 0.5, float("nan"), float("inf"), "0", None):
            with self.subTest(count=count):
                payload = {"flagships": [{"repo": "szl-holdings/platform",
                                            "commits_last_7d": count}]}
                self.assertEqual(self.check("readiness-operability", payload)["status"], "UNVERIFIED")

    def test_docs_can_verify_an_independent_readme_fetch(self) -> None:
        payload = {"repos": [{"repo": "szl-holdings/platform", "present": {"README.md": True}}]}
        self.assertEqual(self.check("readiness-docs", payload, (0, readme_response()))["status"], "VERIFIED")

    def test_docs_does_not_verify_directories_or_unreadable_content(self) -> None:
        payload = {"repos": [{"repo": "szl-holdings/platform", "present": {"README.md": True}}]}
        responses = ("[]", '{"type":"dir","name":"README.md"}',
                     '{"type":"file","name":"README.md","encoding":"base64","content":"!!!"}')
        for response in responses:
            with self.subTest(response=response):
                self.assertEqual(self.check("readiness-docs", payload, (0, response))["status"], "RESAMPLE-ERROR")


class MetaVerdictTest(unittest.TestCase):
    def run_fleet(self, status: str) -> dict:
        findings = [{"agent": agent, "status": status} for agent in audit.PEERS]
        with patch.object(audit, "audit_peer", side_effect=findings), \
                patch.object(audit.khipu, "emit") as emit:
            self.assertEqual(audit.main(), 0)
        return emit.call_args.args[1]

    def test_only_verified_peers_allow_green(self) -> None:
        for status in ("FETCH-ERROR", "RESAMPLE-ERROR", "UNVERIFIED", "NO-RECEIPT",
                       "FLAGGED", "unexpected-state"):
            with self.subTest(status=status):
                payload = self.run_fleet(status)
                self.assertEqual(payload["meta_verdict"], "AMBER")
                self.assertEqual(payload["flagged_agents"], audit.PEERS)
        payload = self.run_fleet("VERIFIED")
        self.assertEqual(payload["meta_verdict"], "GREEN")
        self.assertEqual(payload["flagged_agents"], [])

    def test_one_unverified_peer_prevents_green(self) -> None:
        findings = [{"agent": agent, "status": "VERIFIED"} for agent in audit.PEERS]
        findings[-1]["status"] = "UNVERIFIED"
        with patch.object(audit, "audit_peer", side_effect=findings), \
                patch.object(audit.khipu, "emit") as emit:
            audit.main()
        payload = emit.call_args.args[1]
        self.assertEqual(payload["meta_verdict"], "AMBER")
        self.assertEqual(payload["flagged_agents"], [audit.PEERS[-1]])


@unittest.skipUnless(SigningKey is not None, "PyNaCl is not installed before the fleet dependency step")
class Ed25519VerificationTest(unittest.TestCase):
    def setUp(self) -> None:
        self.fleet_key = SigningKey.generate()
        key_env = {"KHIPU_SIGNING_KEY_B64": base64.b64encode(bytes(self.fleet_key)).decode()}
        patcher = patch.dict(os.environ, key_env)
        patcher.start()
        self.addCleanup(patcher.stop)

    def signed_receipt(self, payload: dict, agent: str = "readiness-docs",
                       signer: SigningKey | None = None) -> dict:
        key = signer or self.fleet_key
        with patch.dict(os.environ, {"KHIPU_SIGNING_KEY_B64": base64.b64encode(bytes(key)).decode()}):
            envelope = audit.khipu.sign_khipu_receipt(agent, payload)
        body = json.loads(base64.b64decode(envelope["payload"]))
        return {"file": "synthetic-signed-receipt.json", "envelope": envelope, "body": body}

    def test_valid_ed25519_signature_is_reverified(self) -> None:
        rec = self.signed_receipt({})
        self.assertIs(audit.reverify_signature("readiness-docs", rec["envelope"]), True)

    def test_foreign_self_signed_receipt_is_not_fleet_authenticated(self) -> None:
        rec = self.signed_receipt({}, signer=SigningKey.generate())
        self.assertIs(audit.reverify_signature("readiness-docs", rec["envelope"]), False)

    def test_missing_fleet_key_is_unverified(self) -> None:
        rec = self.signed_receipt({})
        with patch.dict(os.environ, {"KHIPU_SIGNING_KEY_B64": ""}):
            self.assertIsNone(audit.reverify_signature("readiness-docs", rec["envelope"]))

    def test_wrong_agent_identity_is_not_authenticated(self) -> None:
        rec = self.signed_receipt({})
        self.assertIs(audit.reverify_signature("readiness-security", rec["envelope"]), False)

    def test_mismatched_payload_digest_is_not_authenticated(self) -> None:
        rec = self.signed_receipt({})
        rec["envelope"]["payloadSha256"] = "0" * 64
        self.assertIs(audit.reverify_signature("readiness-docs", rec["envelope"]), False)

    def test_tampered_payload_cannot_claim_a_verified_signature(self) -> None:
        rec = self.signed_receipt({})
        rec["envelope"]["payload"] = base64.b64encode(b'{"payload":{"tampered":true}}').decode()
        with patch.object(audit, "latest_peer_receipt", return_value=rec), \
                patch.object(audit, "gh") as github:
            finding = audit.audit_peer("readiness-docs")
        self.assertEqual(finding["status"], "FLAGGED")
        self.assertIs(finding["signature_reverified"], False)
        github.assert_not_called()

    def test_signed_boolean_does_not_replace_signature_verification(self) -> None:
        rec = self.signed_receipt({})
        rec["envelope"]["signatures"][0]["sig"] = base64.b64encode(bytes(64)).decode()
        self.assertIs(audit.reverify_signature("readiness-docs", rec["envelope"]), False)

    def test_malformed_base64_is_rejected(self) -> None:
        rec = self.signed_receipt({})
        rec["envelope"]["payload"] += "!"
        self.assertIs(audit.reverify_signature("readiness-docs", rec["envelope"]), False)

    def test_signed_receipt_still_requires_an_independent_claim_recheck(self) -> None:
        rec = self.signed_receipt({"repos": [{"repo": "szl-holdings/platform",
                                             "present": {"README.md": True}}]})
        with patch.object(audit, "latest_peer_receipt", return_value=rec), \
                patch.object(audit, "gh", return_value=(0, readme_response())):
            finding = audit.audit_peer("readiness-docs")
        self.assertEqual(finding["status"], "VERIFIED")
        self.assertIs(finding["signature_reverified"], True)


if __name__ == "__main__":
    unittest.main()
