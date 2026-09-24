#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import pathlib
import sys
import unittest
from unittest.mock import patch

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
