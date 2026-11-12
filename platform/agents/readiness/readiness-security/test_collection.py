"""Offline regressions for complete collection and scanner classification."""

from __future__ import annotations

import importlib.util
import json
import pathlib
import unittest
from datetime import datetime, timezone
from unittest.mock import patch
from urllib.parse import parse_qs, urlsplit

SPEC = importlib.util.spec_from_file_location(
    "security_collection_candidate", pathlib.Path(__file__).with_name("executor.py"))
assert SPEC and SPEC.loader
security = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(security)

REPO = "szl-holdings/example"
HEAD = "a" * 40
NOW = datetime(2026, 11, 11, tzinfo=timezone.utc)


def run(identity: int, filename: str = "hourly.yml", **changes) -> dict:
    return {"id": identity, "path": f".github/workflows/{filename}",
            "head_branch": "main", "head_sha": HEAD, "status": "completed",
            "conclusion": "success", "created_at": "2026-11-10T12:00:00Z", **changes}


class CollectionTest(unittest.TestCase):
    def setUp(self):
        clock = patch.object(security, "_utcnow", return_value=NOW)
        clock.start()
        self.addCleanup(clock.stop)

    def collect(self, pages, names=("sbom.yml",), failures=None):
        calls = []
        def read(endpoint):
            calls.append(endpoint)
            if "/contents/.github/workflows?" in endpoint:
                return 0, json.dumps([{"name": name, "type": "file"} for name in names])
            page = int(parse_qs(urlsplit(endpoint).query).get("page", ["1"])[0])
            if failures and page in failures:
                return failures[page]
            if page > len(pages):
                raise AssertionError(f"unexpected page: {endpoint}")
            return 0, json.dumps(pages[page - 1])
        with patch.object(security, "gh", side_effect=read):
            result = security.workflow_status(REPO, "main", HEAD)
        return result, calls

    def test_required_run_beyond_first_page_is_observed(self):
        first = [run(i) for i in range(1, 101)]
        result, _ = self.collect([
            {"total_count": 101, "workflow_runs": first},
            {"total_count": 101, "workflow_runs": [run(101, "sbom.yml")]},
        ])
        self.assertEqual(result["controls"]["sbom"]["status"], "SUCCESS")
        self.assertEqual(result["controls"]["sbom"]["run_id"], 101)

    def test_governed_secret_health_is_not_a_secret_scanner(self):
        # Verified source: szl-holdings/.github at 227869f48023ea2cc344458d45670e6dddc71897.
        # Run 42973587179 audits required Actions secret names, not committed secrets.
        result, _ = self.collect(
            [{"total_count": 1, "workflow_runs": [run(1, "secret-health.yml")]}],
            names=("secret-health.yml",))
        self.assertFalse(result["present"]["gitleaks"])
        self.assertIsNone(result["recent_success"]["gitleaks"])
        self.assertEqual(result["controls"]["gitleaks"]["status"], "MISSING_WORKFLOW")

    def test_exact_head_filter_and_encoded_branch_are_requested(self):
        calls = []
        def read(endpoint):
            calls.append(endpoint)
            if "/contents/" in endpoint:
                return 0, json.dumps([{"name": "sbom.yml", "type": "file"}])
            return 0, json.dumps({"total_count": 0, "workflow_runs": []})
        with patch.object(security, "gh", side_effect=read):
            security.workflow_status(REPO, "release/test&other=x", HEAD)
        query = parse_qs(urlsplit(calls[-1]).query)
        self.assertEqual(query, {"branch": ["release/test&other=x"],
                                 "head_sha": [HEAD], "per_page": ["100"]})

    def test_secret_management_names_are_not_scanner_names(self):
        for name in ("secret-health.yml", "secrets-health.yml", "secret-rotation.yml",
                     "hf-space-secret-reader-compat.yml", "secrets.yml",
                     "url-secret-leak-guard.yml", "notgitleaks.yml", "gitleakshealth.yml"):
            with self.subTest(name=name):
                result, _ = self.collect(
                    [{"total_count": 1, "workflow_runs": [run(1, name)]}], names=(name,))
                self.assertFalse(result["present"]["gitleaks"])
                self.assertIsNone(result["recent_success"]["gitleaks"])

    def test_scanner_specific_names_remain_discoverable(self):
        for name in ("gitleaks.yml", "ci-gitleaks.yaml", "secret-scan.yml",
                     "secret_scanning.yml", "secrets-scan.yml", "secrets_scanning.yaml"):
            with self.subTest(name=name):
                result, _ = self.collect(
                    [{"total_count": 1, "workflow_runs": [run(1, name)]}], names=(name,))
                self.assertTrue(result["present"]["gitleaks"])
                self.assertTrue(result["recent_success"]["gitleaks"])

    def test_newer_health_success_cannot_hide_scanner_failure(self):
        scanner = run(1, "gitleaks.yml", conclusion="failure")
        health = run(2, "secret-health.yml", created_at="2026-11-10T13:00:00Z")
        result, _ = self.collect(
            [{"total_count": 2, "workflow_runs": [health, scanner]}],
            names=("gitleaks.yml", "secret-health.yml"))
        self.assertEqual(result["controls"]["gitleaks"]["status"], "RUN_NOT_SUCCESS")
        self.assertFalse(result["recent_success"]["gitleaks"])
        self.assertEqual(result["controls"]["gitleaks"]["run_id"], 1)

    def test_later_page_failure_beats_earlier_page_success(self):
        first = [run(i) for i in range(1, 100)] + [run(100, "sbom.yml")]
        later = run(101, "sbom.yml", conclusion="failure", created_at="2026-11-10T13:00:00Z")
        result, _ = self.collect([
            {"total_count": 101, "workflow_runs": first},
            {"total_count": 101, "workflow_runs": [later]},
        ])
        self.assertFalse(result["recent_success"]["sbom"])
        self.assertEqual(result["controls"]["sbom"]["run_id"], 101)

    def test_partial_success_is_discarded_on_later_page_read_failure(self):
        first = [run(i) for i in range(1, 100)] + [run(100, "sbom.yml")]
        for error, expected in (((1, "HTTP 500"), "READ_FAILED"),
                                ((1, "RATE_LIMITED"), "RATE_LIMITED")):
            with self.subTest(expected=expected):
                result, calls = self.collect(
                    [{"total_count": 101, "workflow_runs": first}], failures={2: error})
                self.assertEqual(result["runs_status"], expected)
                self.assertIsNone(result["recent_success"]["sbom"])
                self.assertEqual(len(calls), 3)

    def test_changed_count_duplicate_and_short_pages_hold(self):
        first = [run(i) for i in range(1, 100)] + [run(100, "sbom.yml")]
        for second, expected in (
            ({"total_count": 102, "workflow_runs": [run(101)]}, "RUN_LIST_CHANGED"),
            ({"total_count": 101, "workflow_runs": [run(100)]}, "RUN_LIST_DUPLICATE"),
            ({"total_count": 101, "workflow_runs": []}, "RUN_LIST_INCOMPLETE"),
            ({"total_count": 101, "workflow_runs": [run(101), run(102)]}, "INVALID_RESPONSE"),
        ):
            with self.subTest(expected=expected):
                result, _ = self.collect([
                    {"total_count": 101, "workflow_runs": first}, second])
                self.assertEqual(result["runs_status"], expected)
                self.assertIsNone(result["recent_success"]["sbom"])

    def test_invalid_first_pages_cannot_report_success(self):
        for page in (
            None, [], {}, {"workflow_runs": []},
            {"total_count": True, "workflow_runs": []},
            {"total_count": -1, "workflow_runs": []},
            {"total_count": "0", "workflow_runs": []},
            {"total_count": 1, "workflow_runs": [None]},
            {"total_count": 1, "workflow_runs": [run(True, "sbom.yml")]},
            {"total_count": 1, "workflow_runs": [run(0, "sbom.yml")]},
            {"total_count": 1, "workflow_runs": [run(-1, "sbom.yml")]},
            {"total_count": 0, "workflow_runs": [run(1, "sbom.yml")]},
            {"total_count": 101, "workflow_runs": [run(i) for i in range(1, 102)]},
        ):
            with self.subTest(page=page):
                result, _ = self.collect([page])
                self.assertEqual(result["runs_status"], "INVALID_RESPONSE")
                self.assertIsNone(result["recent_success"]["sbom"])

    def test_short_first_page_and_duplicate_ids_hold(self):
        for page, expected in (
            ({"total_count": 2, "workflow_runs": [run(1, "sbom.yml")]}, "RUN_LIST_INCOMPLETE"),
            ({"total_count": 2, "workflow_runs": [run(1), run(1, "sbom.yml")]}, "RUN_LIST_DUPLICATE"),
        ):
            with self.subTest(expected=expected):
                result, calls = self.collect([page])
                self.assertEqual(result["runs_status"], expected)
                self.assertEqual(len(calls), 2)

    def test_api_ceiling_is_explicitly_held_not_assumed_complete(self):
        for count in (1000, 1001):
            with self.subTest(count=count):
                result, calls = self.collect([
                    {"total_count": count, "workflow_runs": [run(1, "sbom.yml")]}])
                self.assertEqual(result["runs_status"], "RUN_LIST_LIMIT_REACHED")
                self.assertIsNone(result["recent_success"]["sbom"])
                self.assertEqual(len(calls), 2)

    def test_last_page_before_ceiling_and_exact_page_boundary_complete(self):
        for count in (100, 101, 999):
            with self.subTest(count=count):
                rows = [run(i) for i in range(1, count)] + [run(count, "sbom.yml")]
                pages = [{"total_count": count, "workflow_runs": rows[i:i + 100]}
                         for i in range(0, count, 100)]
                result, calls = self.collect(pages)
                self.assertEqual(result["controls"]["sbom"]["status"], "SUCCESS")
                self.assertEqual(len(calls), 1 + len(pages))

    def test_success_at_wrong_sha_or_branch_cannot_satisfy_control(self):
        for changes in ({"head_sha": "b" * 40}, {"head_branch": "other"}):
            with self.subTest(changes=changes):
                result, _ = self.collect([
                    {"total_count": 1, "workflow_runs": [run(1, "sbom.yml", **changes)]}])
                self.assertIsNone(result["recent_success"]["sbom"])

    def test_invalid_timestamp_on_later_page_holds_control(self):
        rows = [run(i) for i in range(1, 100)] + [run(100, "sbom.yml")]
        result, _ = self.collect([
            {"total_count": 101, "workflow_runs": rows},
            {"total_count": 101, "workflow_runs": [run(101, "sbom.yml", created_at=None)]},
        ])
        self.assertEqual(result["controls"]["sbom"]["status"], "INVALID_RUN_TIMESTAMP")
        self.assertIsNone(result["recent_success"]["sbom"])

    def test_platform_scan_job_on_second_page_is_observed(self):
        jobs = [{"id": i, "name": f"Unrelated {i}"} for i in range(1, 101)]
        scan = {"id": 101, "name": security.PLATFORM_SECRET_JOB,
                "status": "completed", "conclusion": "success", "steps": [
                    {"name": security.PLATFORM_SECRET_STEP, "status": "completed",
                     "conclusion": "success"}]}
        pages = [json.dumps({"total_count": 101, "jobs": jobs}),
                 json.dumps({"total_count": 101, "jobs": [scan]})]
        with patch.object(security, "gh", side_effect=[(0, page) for page in pages]) as reader:
            status, evidence = security._platform_secret_job_status("szl-holdings/platform", 9)
        self.assertEqual(status, "SUCCESS")
        self.assertEqual(evidence["job_ids"], [101])
        self.assertEqual(reader.call_args_list[-1].args[0],
                         "repos/szl-holdings/platform/actions/runs/9/jobs?per_page=100&page=2")

    def test_partial_job_list_cannot_produce_scanner_success(self):
        scan = {"id": 1, "name": security.PLATFORM_SECRET_JOB,
                "status": "completed", "conclusion": "success", "steps": [
                    {"name": security.PLATFORM_SECRET_STEP, "status": "completed",
                     "conclusion": "success"}]}
        with patch.object(security, "gh", return_value=(0, json.dumps({
            "total_count": 2, "jobs": [scan]}))):
            self.assertEqual(security._platform_secret_job_status("szl-holdings/platform", 9),
                             ("JOB_LIST_INCOMPLETE", {}))


if __name__ == "__main__":
    unittest.main()
