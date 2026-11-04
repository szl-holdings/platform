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


def operability_payload(count: object = 0) -> dict:
    return {"flagships": [{"repo": "szl-holdings/platform", "commits_last_7d": count,
                           "revision": "1" * 40, "observed_at_utc": "2026-10-02T12:34:56+00:00"}]}


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

    def test_peers_without_positive_claims_are_unverified(self) -> None:
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
                   "readiness-operability": operability_payload(),
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
        payload = operability_payload(1)
        finding = self.check("readiness-operability", payload, (0, '{"message":"failure"}'))
        self.assertEqual(finding["status"], "RESAMPLE-ERROR")

    def test_operability_requires_exact_count_at_identical_revision_and_time(self) -> None:
        payload = operability_payload(1)
        self.assertEqual(self.check("readiness-operability", payload)["status"], "FLAGGED")
        payload["flagships"][0]["commits_last_7d"] = 0
        self.assertEqual(self.check("readiness-operability", payload)["status"], "VERIFIED")

    def test_operability_exhausts_pages_at_the_reported_revision_and_time(self) -> None:
        commits = [{"sha": f"{i:040x}"} for i in range(153)]
        with patch.object(audit, "latest_peer_receipt", return_value=receipt(operability_payload(153))), \
                patch.object(audit, "gh", side_effect=[(0, json.dumps(commits[:100])), (0, json.dumps(commits[100:]))]) as github:
            finding = audit.audit_peer("readiness-operability")
        self.assertEqual(finding["status"], "VERIFIED")
        self.assertEqual(finding["independent_commits"], 153)
        self.assertEqual(len(github.call_args_list), 2)
        for page, call in enumerate(github.call_args_list, 1):
            self.assertEqual(call.args[0], f"repos/szl-holdings/platform/commits?sha={'1' * 40}&since=2026-09-25T12:34:56Z&until=2026-10-02T12:34:56Z&per_page=100&page={page}")

    def test_operability_legacy_or_invalid_pins_are_unverified_without_requests(self) -> None:
        for field, value in (("revision", None), ("revision", "main"), ("observed_at_utc", None),
                             ("observed_at_utc", "invalid"), ("observed_at_utc", "2026-10-02T12:34:56"),
                             ("observed_at_utc", "2026-10-02T12:34:56+01:00")):
            with self.subTest(field=field, value=value):
                payload = operability_payload()
                payload["flagships"][0][field] = value
                with patch.object(audit, "latest_peer_receipt", return_value=receipt(payload)), \
                        patch.object(audit, "gh") as github:
                    self.assertEqual(audit.audit_peer("readiness-operability")["status"], "UNVERIFIED")
                github.assert_not_called()

    def test_operability_malformed_duplicate_and_incomplete_pages_are_errors(self) -> None:
        page = [{"sha": f"{i:040x}"} for i in range(100)]
        cases = [[(0, json.dumps([{"sha": "not-a-sha"}]))],
                 [(0, json.dumps([page[0], page[0]]))],
                 [(0, json.dumps(page)), (0, json.dumps([page[0]]))],
                 [(0, json.dumps(page)), (1, "unavailable")],
                 [(0, json.dumps([{"sha": f"{i:040x}"} for i in range(n * 100, (n + 1) * 100)])) for n in range(10)]]
        for responses in cases:
            with self.subTest(pages=len(responses)):
                with patch.object(audit, "latest_peer_receipt", return_value=receipt(operability_payload(1000))), \
                        patch.object(audit, "gh", side_effect=responses):
                    finding = audit.audit_peer("readiness-operability")
                self.assertEqual(finding["status"], "RESAMPLE-ERROR")
                self.assertNotIn("independent_commits", finding)

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


class ClaimRecheckTest(unittest.TestCase):
    """Independent rechecks of one positive claim per peer; all network and Hub I/O mocked."""

    A11OY = "https://a11oy.example.invalid"
    RUN = {"sbom": {"status": "SUCCESS", "run_id": 41686367296, "run_head_sha": "5" * 40}}
    METRICS = (b"# HELP http_requests_total Requests served\n# TYPE http_requests_total counter\n"
               b'http_requests_total{route="/healthz"} 7\n')
    DUMP = b'{"key":"a","value":1}\n{"key":"b","value":{"x":[1,2]}}\n'
    DUMP_PATH = "dr-dumps/a11oy/2026-11-03T12-58-48Z.ndjson"

    def setUp(self) -> None:
        signature = patch.object(audit, "reverify_signature", return_value=True)
        signature.start()
        self.addCleanup(signature.stop)
        urls = patch.dict(os.environ, {"A11OY_URL": self.A11OY})
        urls.start()
        self.addCleanup(urls.stop)

    def run_audit(self, agent: str, payload: dict, github=None, web=None, dataset=None):
        with patch.object(audit, "latest_peer_receipt", return_value=receipt(payload)), \
                patch.object(audit, "gh", side_effect=github) as gh_mock, \
                patch.object(audit, "http_get", side_effect=web) as http_mock, \
                patch.object(audit, "fetch_dataset_file", side_effect=dataset) as hub_mock:
            finding = audit.audit_peer(agent)
        return finding, gh_mock, http_mock, hub_mock

    @staticmethod
    def listing(*names: str) -> tuple[int, str]:
        return 0, json.dumps([{"name": name, "type": "file"} for name in names])

    @staticmethod
    def red_security(controls: dict | None = None, present: dict | None = None) -> dict:
        return {"repos": [{"repo": "szl-holdings/platform", "verdict": "RED",
                           "workflows": {"present": present or {"sbom": True},
                                         "controls": controls or {}}}]}

    @staticmethod
    def reliability(rate: object = 1.0, flagship: str = "a11oy") -> dict:
        return {"pass_criteria": {"success_min": 0.995, "p99_max_ms": 800.0},
                "flagships": [{"flagship": flagship, "verdict": "RED", "endpoints": {
                    "healthz": {"success_rate": rate, "p99_ms": 94.5, "samples": 92},
                    "khipu_sign": {"success_rate": 0.0, "p99_ms": 89.9, "samples": 92}}}]}

    @staticmethod
    def observability(counters: dict | None = None, status: object = 200) -> dict:
        if counters is None:
            counters = {"gate_decisions_total": False, "http_requests_total": True}
        return {"required_counters": sorted(counters),
                "trace_continuity_matrix": [{"flagship": "a11oy", "metrics_status": status,
                                             "required_counters": counters}]}

    @staticmethod
    def compliance(has: object = True) -> dict:
        return {"doctrine_consistency": [{"repo": "szl-holdings/a11oy", "has_v11_numbers": has,
                                          "stale_markers": []}]}

    @staticmethod
    def readme(text: str) -> tuple[int, str]:
        return 0, json.dumps({"type": "file", "name": "README.md", "encoding": "base64",
                              "content": base64.b64encode(text.encode()).decode() + "\n"})

    def dr(self, rows: object = 2, path: object = None, verdict: str = "GREEN",
           uploaded: object = True) -> dict:
        return {"flagships": [{"flagship": "a11oy", "verdict": verdict, "readable": True,
                               "restore_proof": {"restored": True, "rows": rows},
                               "upload": {"uploaded": uploaded,
                                          "path": self.DUMP_PATH if path is None else path}}]}

    def test_security_samples_a_present_control_when_no_repo_is_green(self) -> None:
        finding, github, _, _ = self.run_audit("readiness-security", self.red_security(),
                                               github=[self.listing("sbom.yml")])
        self.assertEqual(finding["status"], "VERIFIED")
        self.assertEqual(finding["resampled_repo"], "szl-holdings/platform")
        self.assertEqual(finding["sampled_control"], "sbom")
        self.assertEqual(github.call_count, 1)

    def test_security_prefers_green_then_amber_repositories(self) -> None:
        payload = {"repos": [
            {"repo": "szl-holdings/red", "verdict": "RED", "workflows": {"present": {"sbom": True}}},
            {"repo": "szl-holdings/amber", "verdict": "AMBER", "workflows": {"present": {"trivy": True}}}]}
        finding, github, _, _ = self.run_audit("readiness-security", payload,
                                               github=[self.listing("trivy.yml")])
        self.assertEqual(finding["status"], "VERIFIED")
        self.assertEqual(github.call_args.args[0], "repos/szl-holdings/amber/contents/.github/workflows")

    def test_security_rechecks_the_cited_successful_run(self) -> None:
        good = {"id": 41686367296, "conclusion": "success", "head_sha": "5" * 40}
        cases = ((good, "VERIFIED"), ({**good, "conclusion": "failure"}, "FLAGGED"),
                 ({**good, "conclusion": None}, "FLAGGED"), ({**good, "head_sha": "6" * 40}, "FLAGGED"))
        for run, status in cases:
            with self.subTest(run=run):
                finding, github, _, _ = self.run_audit(
                    "readiness-security", self.red_security(self.RUN),
                    github=[self.listing("sbom.yml"), (0, json.dumps(run))])
                self.assertEqual(finding["status"], status)
                self.assertEqual(github.call_args_list[1].args[0],
                                 "repos/szl-holdings/platform/actions/runs/41686367296")

    def test_security_listing_mismatch_is_flagged_before_the_run_is_fetched(self) -> None:
        finding, github, _, _ = self.run_audit("readiness-security", self.red_security(self.RUN),
                                               github=[self.listing("unrelated.yml")])
        self.assertEqual(finding["status"], "FLAGGED")
        self.assertEqual(github.call_count, 1)

    def test_security_run_recheck_failures_are_resample_errors(self) -> None:
        other = {"id": 7, "conclusion": "success", "head_sha": "5" * 40}
        for response in ((1, "unavailable"), (0, "not json"), (0, json.dumps(other)), (0, "[]")):
            with self.subTest(response=response):
                finding, _, _, _ = self.run_audit("readiness-security", self.red_security(self.RUN),
                                                  github=[self.listing("sbom.yml"), response])
                self.assertEqual(finding["status"], "RESAMPLE-ERROR")

    def test_security_invalid_run_claims_are_unverified_without_requests(self) -> None:
        sha = "5" * 40
        for detail in ({"status": "SUCCESS"},
                       {"status": "SUCCESS", "run_id": "41686367296", "run_head_sha": sha},
                       {"status": "SUCCESS", "run_id": True, "run_head_sha": sha},
                       {"status": "SUCCESS", "run_id": 0, "run_head_sha": sha},
                       {"status": "SUCCESS", "run_id": 41686367296, "run_head_sha": "main"}):
            with self.subTest(detail=detail):
                finding, github, _, _ = self.run_audit("readiness-security",
                                                       self.red_security({"sbom": detail}))
                self.assertEqual(finding["status"], "UNVERIFIED")
                github.assert_not_called()

    def test_reliability_reprobes_the_claimed_healthz(self) -> None:
        finding, _, web, _ = self.run_audit("readiness-reliability", self.reliability(),
                                            web=[(200, b"ok")])
        self.assertEqual(finding["status"], "VERIFIED")
        self.assertEqual(finding["resampled_flagship"], "a11oy")
        web.assert_called_once_with(f"{self.A11OY}/healthz")

    def test_reliability_retries_transient_failures(self) -> None:
        finding, _, web, _ = self.run_audit("readiness-reliability", self.reliability(),
                                            web=[(None, b""), (503, b""), (204, b"")])
        self.assertEqual(finding["status"], "VERIFIED")
        self.assertEqual(finding["resampled_statuses"], [None, 503, 204])
        self.assertEqual(web.call_count, 3)

    def test_reliability_http_errors_contradict_the_claim(self) -> None:
        finding, _, web, _ = self.run_audit("readiness-reliability", self.reliability(),
                                            web=[(503, b""), (None, b""), (500, b"")])
        self.assertEqual(finding["status"], "FLAGGED")
        self.assertEqual(web.call_count, 3)

    def test_reliability_unreachable_flagship_is_a_resample_error(self) -> None:
        finding, _, _, _ = self.run_audit("readiness-reliability", self.reliability(),
                                          web=[(None, b"")] * 3)
        self.assertEqual(finding["status"], "RESAMPLE-ERROR")

    def test_reliability_without_a_healthy_claim_is_unverified_without_requests(self) -> None:
        for rate in (0.99, 0.0, True, "1.0", None, float("nan"), 1.5):
            with self.subTest(rate=rate):
                finding, _, web, _ = self.run_audit("readiness-reliability", self.reliability(rate))
                self.assertEqual(finding["status"], "UNVERIFIED")
                web.assert_not_called()

    def test_live_rechecks_need_a_configured_http_url(self) -> None:
        cases = {"readiness-reliability": self.reliability(),
                 "readiness-observability": self.observability()}
        for url in ("", "file:///etc/passwd", "ftp://a11oy.example.invalid"):
            for agent, payload in cases.items():
                with self.subTest(agent=agent, url=url), patch.dict(os.environ, {"A11OY_URL": url}):
                    finding, _, web, _ = self.run_audit(agent, payload)
                    self.assertEqual(finding["status"], "UNVERIFIED")
                    web.assert_not_called()
        finding, _, web, _ = self.run_audit("readiness-reliability", self.reliability(flagship="unknown"))
        self.assertEqual(finding["status"], "UNVERIFIED")
        web.assert_not_called()

    def test_observability_requires_a_real_sample_line(self) -> None:
        finding, _, web, _ = self.run_audit("readiness-observability", self.observability(),
                                            web=[(200, self.METRICS)])
        self.assertEqual(finding["status"], "VERIFIED")
        self.assertEqual(finding["sampled_counter"], "http_requests_total")
        web.assert_called_once_with(f"{self.A11OY}/metrics")
        for body in (b"http_requests_total 0\n", b'http_requests_total{a="b"} 1 1700000000\n'):
            with self.subTest(body=body):
                finding, _, _, _ = self.run_audit("readiness-observability", self.observability(),
                                                  web=[(200, body)])
                self.assertEqual(finding["status"], "VERIFIED")

    def test_observability_comments_prefixes_and_lookalikes_are_flagged(self) -> None:
        for body in (b"# HELP http_requests_total Requests\n# TYPE http_requests_total counter\n",
                     b"http_requests_total_created 1\n", b"xhttp_requests_total 1\n",
                     b"http_requests_total\n", b""):
            with self.subTest(body=body):
                finding, _, _, _ = self.run_audit("readiness-observability", self.observability(),
                                                  web=[(200, body)])
                self.assertEqual(finding["status"], "FLAGGED")

    def test_observability_non_2xx_is_flagged_and_unreachable_is_an_error(self) -> None:
        finding, _, _, _ = self.run_audit("readiness-observability", self.observability(),
                                          web=[(404, b"")] * 3)
        self.assertEqual(finding["status"], "FLAGGED")
        finding, _, _, _ = self.run_audit("readiness-observability", self.observability(),
                                          web=[(None, b"")] * 3)
        self.assertEqual(finding["status"], "RESAMPLE-ERROR")

    def test_observability_without_a_present_counter_is_unverified_without_requests(self) -> None:
        for payload in (self.observability({"http_requests_total": False}),
                        self.observability(status=500), self.observability(status=None),
                        self.observability({"bad name": True}),
                        self.observability({"http_requests_total": 1})):
            with self.subTest(payload=payload):
                finding, _, web, _ = self.run_audit("readiness-observability", payload)
                self.assertEqual(finding["status"], "UNVERIFIED")
                web.assert_not_called()

    def test_compliance_refetches_the_readme_for_the_claimed_doctrine(self) -> None:
        finding, github, _, _ = self.run_audit(
            "readiness-compliance", self.compliance(),
            github=[self.readme(f"Doctrine {audit.khipu.DOCTRINE_STRING}\n")])
        self.assertEqual(finding["status"], "VERIFIED")
        github.assert_called_once_with("repos/szl-holdings/a11oy/contents/README.md")

    def test_compliance_missing_doctrine_is_flagged(self) -> None:
        finding, _, _, _ = self.run_audit("readiness-compliance", self.compliance(),
                                          github=[self.readme("Doctrine 626/189/168\n")])
        self.assertEqual(finding["status"], "FLAGGED")

    def test_compliance_unreadable_readme_is_a_resample_error(self) -> None:
        for response in ((1, "unavailable"), (0, '{"type":"dir","name":"README.md"}'),
                         (0, '{"type":"file","name":"README.md","encoding":"base64","content":"!!!"}')):
            with self.subTest(response=response):
                finding, _, _, _ = self.run_audit("readiness-compliance", self.compliance(),
                                                  github=[response])
                self.assertEqual(finding["status"], "RESAMPLE-ERROR")

    def test_compliance_without_a_positive_claim_is_unverified_without_requests(self) -> None:
        for has in (False, None, "true", 1):
            with self.subTest(has=has):
                finding, github, _, _ = self.run_audit("readiness-compliance", self.compliance(has))
                self.assertEqual(finding["status"], "UNVERIFIED")
                github.assert_not_called()

    def test_dr_restores_the_uploaded_dump_independently(self) -> None:
        finding, _, _, hub = self.run_audit("readiness-dr", self.dr(), dataset=[self.DUMP])
        self.assertEqual(finding["status"], "VERIFIED")
        self.assertEqual(finding["independent_rows"], 2)
        hub.assert_called_once_with(self.DUMP_PATH)

    def test_dr_row_mismatch_or_unrestorable_dump_is_flagged(self) -> None:
        finding, _, _, _ = self.run_audit("readiness-dr", self.dr(rows=3), dataset=[self.DUMP])
        self.assertEqual(finding["status"], "FLAGGED")
        for dump in (b"", b"\n\n", b"not json\n", b"\xff\n",
                     b'{"key":"a","value":1}\n{"key":"a","value":2}\n', b'{"key":"a","value":NaN}\n',
                     b'{"key":"a","key":"b","value":1}\n', b'{"key":"","value":1}\n',
                     b'{"key":"a"}\n', b'["a",1]\n'):
            with self.subTest(dump=dump):
                finding, _, _, _ = self.run_audit("readiness-dr", self.dr(rows=1), dataset=[dump])
                self.assertEqual(finding["status"], "FLAGGED")
                self.assertIsNone(finding["independent_rows"])

    def test_dr_dataset_read_failure_is_a_resample_error(self) -> None:
        finding, _, _, _ = self.run_audit("readiness-dr", self.dr(), dataset=OSError("offline"))
        self.assertEqual(finding["status"], "RESAMPLE-ERROR")

    def test_dr_without_an_uploaded_restore_claim_is_unverified_without_reads(self) -> None:
        skipped = {"flagships": [{"flagship": "a11oy", "verdict": "SKIPPED",
                                  "reason": "no /unay/dump endpoint (not an Unay-backed flagship)"}]}
        for payload in (skipped, self.dr(verdict="RED"), self.dr(uploaded=False), self.dr(rows=0),
                        self.dr(rows=True), self.dr(path="../secrets.ndjson"),
                        self.dr(path="dr-dumps/a11oy/latest.ndjson")):
            with self.subTest(payload=payload):
                finding, _, _, hub = self.run_audit("readiness-dr", payload)
                self.assertEqual(finding["status"], "UNVERIFIED")
                hub.assert_not_called()


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
        # Pin this synthetic fleet key, as fleet_signer.json pins the real one.
        pin = patch.object(audit.khipu, "_pinned_fleet_public_key",
                           return_value=bytes(self.fleet_key.verify_key))
        pin.start()
        self.addCleanup(pin.stop)

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

    def test_fleet_signed_receipt_from_an_unpinned_key_is_not_authenticated(self) -> None:
        rec = self.signed_receipt({})
        other = bytes(SigningKey.generate().verify_key)
        with patch.object(audit.khipu, "_pinned_fleet_public_key", return_value=other):
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
