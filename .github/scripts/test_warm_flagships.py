#!/usr/bin/env python3
from __future__ import annotations

import json
import http.client
import io
import os
import pathlib
import sys
import tempfile
import unittest
from unittest.mock import MagicMock, patch

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[1]
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

import warm_flagships as warm


def attempt(number: int, status: int | None, *, error: str | None = None) -> warm.Attempt:
    return warm.Attempt(number=number, observed_at="2026-09-02T00:00:00+00:00",
        http_status=status, final_url="https://example.test/healthz" if status is not None else None,
        elapsed_ms=10, body_preview="ok" if status == 200 else "", error_class=error,
        error_detail="network" if error else None)


class ClassificationTests(unittest.TestCase):
    def test_repeated_200_with_final_200_is_healthy(self) -> None:
        self.assertEqual(warm.classify_attempts([attempt(1, 200), attempt(2, 503), attempt(3, 200)]), warm.HEALTHY)

    def test_one_200_is_not_enough_to_close_an_incident(self) -> None:
        self.assertEqual(warm.classify_attempts([attempt(1, None, error="URLError"), attempt(2, 200), attempt(3, None, error="TimeoutError")]), warm.UNKNOWN)

    def test_repeated_real_non_200_without_200_is_unhealthy(self) -> None:
        self.assertEqual(warm.classify_attempts([attempt(1, 503), attempt(2, None, error="URLError"), attempt(3, 503)]), warm.UNHEALTHY)

    def test_network_only_failures_are_unknown(self) -> None:
        self.assertEqual(warm.classify_attempts([attempt(1, None, error="URLError"), attempt(2, None, error="TimeoutError"), attempt(3, None, error="OSError")]), warm.UNKNOWN)

    def test_non_200_then_recovery_without_confirmation_is_unknown(self) -> None:
        self.assertEqual(warm.classify_attempts([attempt(1, 503), attempt(2, 503), attempt(3, 200)]), warm.UNKNOWN)

    def test_confirmation_count_must_be_positive(self) -> None:
        with self.assertRaises(ValueError):
            warm.classify_attempts([attempt(1, 200)], confirmations=0)


class IssueLifecycleTests(unittest.TestCase):
    def test_create_only_for_confirmed_unhealthy_without_open_issue(self) -> None:
        self.assertEqual(warm.planned_issue_action(state=warm.UNHEALTHY, open_issue_number=None), "CREATE")
        self.assertEqual(warm.planned_issue_action(state=warm.UNHEALTHY, open_issue_number=460), "NONE")

    def test_close_only_for_confirmed_healthy_open_issue(self) -> None:
        self.assertEqual(warm.planned_issue_action(state=warm.HEALTHY, open_issue_number=460), "CLOSE")
        self.assertEqual(warm.planned_issue_action(state=warm.HEALTHY, open_issue_number=None), "NONE")

    def test_unknown_never_opens_or_closes(self) -> None:
        self.assertEqual(warm.planned_issue_action(state=warm.UNKNOWN, open_issue_number=None), "NONE")
        self.assertEqual(warm.planned_issue_action(state=warm.UNKNOWN, open_issue_number=460), "NONE")

    def test_issue_identity_remains_backward_compatible(self) -> None:
        self.assertEqual(warm.issue_title("a11oy"), "flagship a11oy unhealthy (warm-flagships)")
        self.assertEqual(warm.issue_marker("a11oy"), "<!-- szl-flagship-health:a11oy -->")


class ProbeTransportTests(unittest.TestCase):
    def test_protocol_and_body_read_errors_are_redacted_unknown_attempts(self):
        marker = "private-response-diagnostic"
        for failure in (http.client.BadStatusLine(marker), http.client.IncompleteRead(marker.encode())):
            for phase in ("connect", "read"):
                with self.subTest(error=type(failure).__name__, phase=phase):
                    response = MagicMock()
                    response.__enter__.return_value = response
                    response.read.side_effect = failure
                    with patch.object(warm.urllib.request, "urlopen", side_effect=failure if phase == "connect" else None,
                                      return_value=response):
                        result = warm.probe_once(warm.ROSTER["lyte"], number=2, timeout=1)
                    self.assertIsNone(result.http_status)
                    self.assertEqual(result.error_class, type(failure).__name__)
                    self.assertNotIn(marker, json.dumps(warm.asdict(result)))

    def test_partial_stream_retains_prior_observations_and_final_unknown(self):
        with tempfile.TemporaryDirectory() as directory:
            report_path = pathlib.Path(directory) / "report.json"
            responses = []
            for failure in (False, False, True):
                response = MagicMock()
                response.__enter__.return_value = response
                response.status = 200
                response.geturl.return_value = warm.ROSTER["lyte"]
                if failure:
                    response.read.side_effect = http.client.IncompleteRead(b"private-partial-body")
                else:
                    response.read.return_value = b'{"ok":true}'
                responses.append(response)
            argv = ["warm_flagships.py", "--organ", "lyte", "--interval", "0", "--report", str(report_path)]
            with patch.object(sys, "argv", argv), patch.object(warm.urllib.request, "urlopen", side_effect=responses):
                self.assertEqual(warm.main(), 0)
            report = json.loads(report_path.read_text())
            self.assertEqual([a["http_status"] for a in report["attempts"]], [200, 200, None])
            self.assertEqual(report["state"], warm.UNKNOWN)
            self.assertEqual(report["attempts"][-1]["error_class"], "IncompleteRead")
            self.assertNotIn("private-partial-body", report_path.read_text())


class IssueEnumerationTests(unittest.TestCase):
    def page(self):
        return [{"number": 1000 + i, "title": f"other incident {i}"} for i in range(100)]

    def test_match_on_later_page_is_found_before_action(self):
        match = {"number": 460, "title": warm.issue_title("lyte")}
        with patch.object(warm, "_github_request", side_effect=[self.page(), [match]]) as request:
            self.assertEqual(warm.find_open_issue("szl-holdings/platform", organ="lyte", token=""), match)
        self.assertEqual(request.call_count, 2)
        self.assertIn("page=1", request.call_args_list[0].args[1])
        self.assertIn("page=2", request.call_args_list[1].args[1])

    def test_absence_requires_final_short_page(self):
        with patch.object(warm, "_github_request", side_effect=[self.page(), []]) as request:
            self.assertIsNone(warm.find_open_issue("szl-holdings/platform", organ="lyte", token=""))
        self.assertEqual(request.call_count, 2)

    def test_duplicate_matching_incidents_are_ambiguous(self):
        first = self.page()
        first[0]["title"] = warm.issue_title("lyte")
        second = [{"number": 460, "title": warm.issue_title("lyte")}]
        with patch.object(warm, "_github_request", side_effect=[first, second]), self.assertRaises(RuntimeError):
            warm.find_open_issue("szl-holdings/platform", organ="lyte", token="")

    def test_repeated_records_across_pages_are_incomplete(self):
        first = self.page()
        with patch.object(warm, "_github_request", side_effect=[first, [first[0]]]), self.assertRaises(RuntimeError):
            warm.find_open_issue("szl-holdings/platform", organ="lyte", token="")

    def test_page_bound_does_not_establish_absence(self):
        second = [{"number": 2000 + i, "title": f"other incident {i}"} for i in range(100)]
        with patch.object(warm, "ISSUE_MAX_PAGES", 2, create=True), patch.object(
            warm, "_github_request", side_effect=[self.page(), second]
        ) as request, self.assertRaises(RuntimeError):
            warm.find_open_issue("szl-holdings/platform", organ="lyte", token="")
        self.assertEqual(request.call_count, 2)

    def test_malformed_listing_never_means_absent(self):
        malformed = [None, {}, {"message": "unexpected"}, "", [None], [{}],
                     [{"number": True, "title": "other"}], [{"number": 0, "title": "other"}],
                     [{"number": "460", "title": warm.issue_title("lyte")}],
                     [{"number": 460, "title": None}], self.page() + [{"number": 460, "title": "other"}]]
        for payload in malformed:
            with self.subTest(payload=payload), patch.object(warm, "_github_request", return_value=payload), self.assertRaises(RuntimeError):
                warm.find_open_issue("szl-holdings/platform", organ="lyte", token="")

    def test_pull_request_with_matching_title_is_not_an_incident(self):
        item = {"number": 460, "title": warm.issue_title("lyte"), "pull_request": {}}
        with patch.object(warm, "_github_request", return_value=[item]):
            self.assertIsNone(warm.find_open_issue("szl-holdings/platform", organ="lyte", token=""))


class EvidenceRetentionTests(unittest.TestCase):
    def run_main(self, report_path, statuses, *, mutate=True):
        argv = ["warm_flagships.py", "--organ", "lyte", "--interval", "0",
                "--report", str(report_path)]
        if mutate:
            argv.append("--mutate-issues")
        responses = [attempt(i, status) for i, status in enumerate(statuses, 1)]
        with patch.object(sys, "argv", argv), patch.object(warm, "probe_once", side_effect=responses):
            return warm.main()

    def test_transport_failure_preserves_each_health_classification(self):
        for statuses, expected in [([200, 200, 200], warm.HEALTHY),
                                   ([503, 503, 503], warm.UNHEALTHY),
                                   ([None, None, None], warm.UNKNOWN)]:
            with self.subTest(state=expected), tempfile.TemporaryDirectory() as directory:
                report_path = pathlib.Path(directory) / "nested" / "lyte.json"
                with patch.dict(os.environ, {"GITHUB_REPOSITORY": "szl-holdings/platform"}), patch.object(
                    warm, "_github_request", side_effect=http.client.RemoteDisconnected("connection closed")
                ) as request:
                    self.assertEqual(self.run_main(report_path, statuses), 1)
                report = json.loads(report_path.read_text())
                self.assertEqual(report["state"], expected)
                self.assertEqual([a["http_status"] for a in report["attempts"]], statuses)
                self.assertEqual(report["issue_lifecycle"], {
                    "requested": True, "action": "UNKNOWN", "status": "UNKNOWN",
                    "error_class": "RemoteDisconnected"})
                request.assert_called_once()

    def test_expected_errors_are_bounded_and_do_not_echo_response_details(self):
        marker = "sensitive-response-fixture"
        failures = [warm.urllib.error.URLError(marker), TimeoutError(marker),
                    http.client.IncompleteRead(b"partial"), RuntimeError(marker),
                    json.JSONDecodeError(marker, "", 0)]
        for failure in failures:
            with self.subTest(error=type(failure).__name__), tempfile.TemporaryDirectory() as directory:
                report_path = pathlib.Path(directory) / "lyte.json"
                output = io.StringIO()
                with patch.dict(os.environ, {"GITHUB_REPOSITORY": "szl-holdings/platform"}), patch.object(
                    warm, "apply_issue_action", side_effect=failure
                ) as apply, patch("sys.stdout", output):
                    self.assertEqual(self.run_main(report_path, [200, 200, 200]), 1)
                apply.assert_called_once()
                rendered = report_path.read_text()
                self.assertNotIn(marker, rendered + output.getvalue())
                self.assertEqual(json.loads(rendered)["issue_lifecycle"]["error_class"], type(failure).__name__)

    def test_partial_close_failure_is_unknown_and_never_retried(self):
        with tempfile.TemporaryDirectory() as directory:
            report_path = pathlib.Path(directory) / "lyte.json"
            issue = {"number": 460, "title": warm.issue_title("lyte")}
            with patch.dict(os.environ, {"GITHUB_REPOSITORY": "szl-holdings/platform"}), patch.object(
                warm, "_github_request", side_effect=[[issue], {"id": 1}, http.client.RemoteDisconnected()]
            ) as request:
                self.assertEqual(self.run_main(report_path, [200, 200, 200]), 1)
            self.assertEqual([call.args[0] for call in request.call_args_list], ["GET", "POST", "PATCH"])
            report = json.loads(report_path.read_text())
            self.assertEqual(report["state"], warm.HEALTHY)
            self.assertEqual(report["issue_lifecycle"]["action"], "UNKNOWN")

    def test_missing_repository_retains_report_without_request(self):
        with tempfile.TemporaryDirectory() as directory:
            report_path = pathlib.Path(directory) / "lyte.json"
            with patch.dict(os.environ, {"GITHUB_REPOSITORY": ""}), patch.object(warm, "apply_issue_action") as apply:
                self.assertEqual(self.run_main(report_path, [200, 200, 200]), 1)
            apply.assert_not_called()
            self.assertEqual(json.loads(report_path.read_text())["issue_lifecycle"]["error_class"], "RuntimeError")

    def test_success_and_read_only_keep_existing_actions(self):
        for mutate in (True, False):
            with self.subTest(mutate=mutate), tempfile.TemporaryDirectory() as directory:
                report_path = pathlib.Path(directory) / "lyte.json"
                with patch.dict(os.environ, {"GITHUB_REPOSITORY": "szl-holdings/platform"}), patch.object(
                    warm, "apply_issue_action", return_value={"action": "CLOSE", "issue_number": 460}
                ) as apply:
                    self.assertEqual(self.run_main(report_path, [200, 200, 200], mutate=mutate), 0)
                report = json.loads(report_path.read_text())
                self.assertEqual(report["state"], warm.HEALTHY)
                self.assertEqual(report["issue_lifecycle"]["action"], "CLOSE" if mutate else "NONE")
                self.assertEqual(report["issue_lifecycle"]["status"], "COMPLETED" if mutate else "NOT_REQUESTED")
                self.assertEqual(apply.call_count, int(mutate))

    def test_unexpected_exception_propagates_after_preserving_evidence(self):
        with tempfile.TemporaryDirectory() as directory:
            report_path = pathlib.Path(directory) / "lyte.json"
            with patch.dict(os.environ, {"GITHUB_REPOSITORY": "szl-holdings/platform"}), patch.object(
                warm, "apply_issue_action", side_effect=AssertionError("programming defect")
            ), self.assertRaises(AssertionError):
                self.run_main(report_path, [200, 200, 200])
            report = json.loads(report_path.read_text())
            self.assertEqual(report["state"], warm.HEALTHY)
            self.assertEqual(report["issue_lifecycle"]["status"], "UNKNOWN")

    def test_report_write_failure_cannot_return_success(self):
        with tempfile.TemporaryDirectory() as directory:
            report_path = pathlib.Path(directory) / "lyte.json"
            with patch.object(pathlib.Path, "write_text", side_effect=OSError("disk full")), self.assertRaises(OSError):
                self.run_main(report_path, [200, 200, 200], mutate=False)

    def test_incomplete_issue_enumeration_never_writes_and_retains_report(self):
        first_page = IssueEnumerationTests().page()
        matching = {"number": 460, "title": warm.issue_title("lyte")}
        for pages in ([{"unexpected": "shape"}], [first_page, {"unexpected": "shape"}],
                      [first_page, http.client.IncompleteRead(b"private-response")],
                      [[matching, {**matching, "number": 461}]]):
            for statuses in ([200, 200, 200], [503, 503, 503]):
                with self.subTest(pages=len(pages), statuses=statuses), tempfile.TemporaryDirectory() as directory:
                    report_path = pathlib.Path(directory) / "report.json"
                    with patch.dict(os.environ, {"GITHUB_REPOSITORY": "szl-holdings/platform"}), patch.object(
                        warm, "_github_request", side_effect=pages
                    ) as request:
                        self.assertEqual(self.run_main(report_path, statuses), 1)
                    self.assertTrue(all(call.args[0] == "GET" for call in request.call_args_list))
                    report = json.loads(report_path.read_text())
                    self.assertEqual(report["issue_lifecycle"]["status"], "UNKNOWN")
                    self.assertEqual([a["http_status"] for a in report["attempts"]], statuses)
                    self.assertNotIn("private-response", report_path.read_text())

    def test_complete_multi_page_enumeration_preserves_lifecycle_actions(self):
        matching = {"number": 460, "title": warm.issue_title("lyte")}
        for statuses, pages, action, methods in (
            ([200, 200, 200], [[matching], {}, {}], "CLOSE", ["GET", "GET", "POST", "PATCH"]),
            ([503, 503, 503], [[matching]], "NONE", ["GET", "GET"]),
            ([503, 503, 503], [[], {"number": 461}], "CREATE", ["GET", "GET", "POST"]),
        ):
            with self.subTest(action=action), tempfile.TemporaryDirectory() as directory:
                report_path = pathlib.Path(directory) / "report.json"
                with patch.dict(os.environ, {"GITHUB_REPOSITORY": "szl-holdings/platform"}), patch.object(
                    warm, "_github_request", side_effect=[IssueEnumerationTests().page(), *pages]
                ) as request:
                    self.assertEqual(self.run_main(report_path, statuses), 0)
                self.assertEqual([call.args[0] for call in request.call_args_list], methods)
                report = json.loads(report_path.read_text())
                self.assertEqual(report["issue_lifecycle"]["status"], "COMPLETED")
                self.assertEqual(report["issue_lifecycle"]["action"], action)


class ReportBoundaryTests(unittest.TestCase):
    def test_roster_is_exact_canonical_nine_and_uses_health_routes(self) -> None:
        expected = {"a11oy", "killinchu", "terra", "sentra", "counsel", "finance", "vessels", "lyte", "david-leads"}
        self.assertEqual(set(warm.ROSTER), expected)
        for retired in {"anatomy", "immune", "szl-real-estate", "szl-atelier", "yarqa", "hatun-mcp"}:
            self.assertNotIn(retired, warm.ROSTER)
        for organ, url in warm.ROSTER.items():
            if organ == "vessels":
                self.assertEqual(
                    url,
                    "https://szlholdings-killinchu.hf.space/api/vessels/healthz",
                )
            else:
                self.assertEqual(url, f"https://szlholdings-{organ}.hf.space/healthz")
        self.assertNotIn("szlholdings-vessels.hf.space", "\n".join(warm.ROSTER.values()))

    def test_report_never_serializes_configured_credentials(self) -> None:
        secret = "do-not-record-this-value"
        responses = [attempt(1, 200), attempt(2, 200), attempt(3, 200)]
        with patch.object(warm, "probe_once", side_effect=responses), patch.object(warm.time, "sleep"), patch.dict(
            os.environ, {"GITHUB_TOKEN": secret, "HF_TOKEN": "also-not-recorded", "GITHUB_SHA": "a" * 40,
                         "GITHUB_REPOSITORY": "szl-holdings/platform"}, clear=False):
            report = warm.run_probe("a11oy", url=warm.ROSTER["a11oy"], attempts_count=3,
                                    confirmations=2, timeout=1, interval=0)
        rendered = json.dumps(report, sort_keys=True)
        self.assertNotIn(secret, rendered)
        self.assertNotIn("also-not-recorded", rendered)
        self.assertEqual(report["state"], warm.HEALTHY)
        self.assertEqual(report["schema"], warm.REPORT_SCHEMA)

    def test_issue_body_embeds_machine_readable_evidence(self) -> None:
        report = {"schema": warm.REPORT_SCHEMA, "organ": "a11oy", "state": warm.UNHEALTHY,
                  "probe_url": warm.ROSTER["a11oy"], "generated_at": "2026-09-02T00:00:00+00:00",
                  "generation": "a" * 40, "run_url": "https://github.com/example/actions/runs/1",
                  "attempts": [{"http_status": 503}, {"http_status": 503}, {"http_status": None}]}
        body = warm.issue_body(report)
        self.assertIn(warm.issue_marker("a11oy"), body)
        self.assertIn("503, 503, NO_HTTP_RESPONSE", body)
        start = body.index("```json") + len("```json")
        end = body.index("```", start)
        parsed = json.loads(body[start:end].strip())
        self.assertEqual(parsed["schema"], warm.REPORT_SCHEMA)
        self.assertEqual(parsed["state"], warm.UNHEALTHY)

    def test_workflow_separates_pr_read_only_from_issue_mutation(self) -> None:
        workflow = (ROOT / ".github/workflows/warm-flagships.yml").read_text(encoding="utf-8")
        self.assertIn("pull_request:", workflow)
        self.assertIn("github.event_name == 'pull_request'", workflow)
        self.assertIn("github.event_name != 'pull_request'", workflow)
        self.assertIn("issues: write", workflow)
        self.assertIn("--mutate-issues", workflow)
        self.assertIn("test_warm_flagships.py", workflow)
        self.assertIn("actions/upload-artifact@", workflow)
        for organ in warm.ROSTER:
            expected = (
                "szlholdings-killinchu.hf.space/api/vessels/healthz"
                if organ == "vessels"
                else f"szlholdings-{organ}.hf.space/healthz"
            )
            self.assertIn(expected, workflow)
        self.assertNotIn("szlholdings-vessels.hf.space", workflow)
        for retired in ("anatomy", "immune", "szl-real-estate", "szl-atelier", "yarqa", "hatun-mcp"):
            self.assertNotIn(f"szlholdings-{retired}.hf.space", workflow)


if __name__ == "__main__":
    unittest.main(verbosity=2)
