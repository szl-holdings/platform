"""Offline regressions for trustworthy source/CI observations."""
import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import szl_estate_auditor as aud

HEAD = "a" * 40
OTHER = "b" * 40


def run(identifier=1, workflow=1, event="push", status="completed", conclusion="success", revision=HEAD):
    return {"id": identifier, "workflow_id": workflow, "event": event,
            "status": status, "conclusion": conclusion, "head_sha": revision,
            "head_branch": "main", "name": "fixture", "html_url": None,
            "created_at": f"2026-09-12T00:00:{identifier:02d}Z"}


def good():
    return {"source_revision": HEAD, "final_source_revision": HEAD,
            "collection_complete": True, "latest_push_CI_conclusion": "success",
            "latest_schedule_CI_conclusion": "success", "last_commit_age_days": 1,
            "has_LICENSE": True, "has_README": True,
            "ci_lanes": [{**run(), "source_revision": HEAD}], "ci_available": True,
            "name": "fixture", "owner": "fixture", "default_branch": "main",
            "open_PR_count": 0, "top_language": "Python"}


class ScoringTests(unittest.TestCase):
    def test_observed_success_is_scoped(self):
        self.assertEqual(aud.score_repo(good())[1], "GREEN")
        self.assertIn("readiness not assessed", aud.score_repo(good())[2][0])

    def test_missing_evidence_never_passes(self):
        for field in ("source_revision", "latest_push_CI_conclusion", "has_LICENSE", "has_README", "last_commit_age_days"):
            for value in (None, aud.UNAVAILABLE):
                with self.subTest(field=field, value=value):
                    row = good()
                    row[field] = value
                    self.assertNotEqual(aud.score_repo(row)[1], "GREEN")

    def test_all_unknown_is_gray(self):
        self.assertEqual(aud.score_repo({})[:2], (None, "GRAY"))

    def test_every_failure_event_is_red(self):
        for field in ("latest_push_CI_conclusion", "latest_schedule_CI_conclusion"):
            for value in aud.FAILED:
                row = good()
                row[field] = value
                self.assertEqual(aud.score_repo(row)[1], "RED")

    def test_partial_pending_neutral_and_skipped_do_not_pass(self):
        for change in ({"collection_complete": False}, {"latest_push_CI_conclusion": "pending"},
                       {"latest_schedule_CI_conclusion": "skipped"}, {"latest_push_CI_conclusion": "neutral"},
                       {"last_commit_age_days": True}):
            self.assertNotEqual(aud.score_repo({**good(), **change})[1], "GREEN")

    def test_lane_failure_overrides_aggregate_success(self):
        row = {**good(), "ci_lanes": [run(conclusion="failure")]}
        self.assertEqual(aud.score_repo(row)[1], "RED")

    def test_archived_is_not_operational(self):
        self.assertEqual(aud.score_repo({**good(), "archived": True})[1], "GRAY")

    def test_replay_consistency_is_rechecked(self):
        for change in ({"final_source_revision": OTHER}, {"final_source_revision": None},
                       {"ci_available": False}, {"ci_lanes": []},
                       {"ci_lanes": [{**run(), "source_revision": OTHER}]}, {"ci_lanes": [None]}):
            self.assertNotEqual(aud.score_repo({**good(), **change})[1], "GREEN")


class CollectorTests(unittest.TestCase):
    def test_gh_json_requires_text_and_uses_utf8_on_windows(self):
        import subprocess
        completed = subprocess.CompletedProcess([], 0, '{"name":"caf\u00e9"}', "")
        with patch.object(aud.subprocess, "run", return_value=completed) as command:
            self.assertEqual(aud.gh_json(["api", "fixture"]), (True, {"name": "caf\u00e9"}))
            self.assertEqual(command.call_args.kwargs["encoding"], "utf-8")
        with patch.object(aud, "run_gh", return_value=(True, None)):
            self.assertEqual(aud.gh_json([]), (False, None))

    def collect(self, rows, available=True):
        with patch.object(aud, "paginated", return_value=(available, rows)):
            return aud.get_latest_ci("fixture", "example", "main", HEAD)

    def test_distinct_failure_cannot_be_hidden_by_new_success(self):
        result = self.collect([run(2, 2), run(1, 1, conclusion="failure")])
        self.assertEqual(len(result["lanes"]), 2)
        self.assertEqual(result["push"]["conclusion"], "failure")

    def test_latest_pending_supersedes_previous_pass(self):
        result = self.collect([run(2, status="queued", conclusion=None), run(1)])
        self.assertEqual(result["push"]["conclusion"], "pending")
        self.assertEqual(len(result["lanes"]), 1)

    def test_old_revision_cannot_establish_current_success(self):
        self.assertIsNone(self.collect([run(revision=OTHER)])["push"])

    def test_events_are_separate_lanes(self):
        result = self.collect([run(1), run(2, event="schedule", conclusion="failure")])
        self.assertEqual(result["push"]["conclusion"], "success")
        self.assertEqual(result["schedule"]["conclusion"], "failure")

    def test_partial_failure_is_preserved(self):
        result = self.collect([run(conclusion="failure")], available=False)
        self.assertFalse(result["available"])
        self.assertEqual(result["lanes"][0]["conclusion"], "failure")

    def test_malformed_workflow_rows_preserve_valid_evidence_as_partial(self):
        for change in ({"created_at": None}, {"event": []}, {"conclusion": {}},
                       {"id": True}, {"workflow_id": None}, {"status": []}):
            result = self.collect([run(1, conclusion="failure"), {**run(2), **change}])
            self.assertFalse(result["available"])
            self.assertEqual(result["lanes"][0]["conclusion"], "failure")

    def test_missing_revision_never_falls_back_to_main(self):
        with patch.object(aud, "gh_json") as request:
            self.assertEqual(aud.path_exists("a", "b", aud.UNAVAILABLE, ["README.md"]), aud.UNAVAILABLE)
            self.assertFalse(aud.get_latest_ci("a", "b", "main")["available"])
            request.assert_not_called()

    def test_second_page_failure_is_incomplete(self):
        with patch.object(aud, "gh_json", side_effect=[(True, [{"id": n} for n in range(100)]), (False, None)]):
            ok, rows = aud.paginated("repos/fixture/example/pulls?state=open")
        self.assertFalse(ok)
        self.assertEqual(len(rows), 100)

    def test_truncated_total_count_is_incomplete(self):
        with patch.object(aud, "gh_json", return_value=(True, {"total_count": 5, "workflow_runs": [run()]})):
            self.assertFalse(aud.paginated("fixture", "workflow_runs")[0])

    def test_total_count_must_be_stable_nonnegative_integer(self):
        first = {"total_count": 101, "workflow_runs": [{"id": n} for n in range(100)]}
        for total in (1, 102, "101", -1, True):
            with patch.object(aud, "gh_json", side_effect=[(True, first), (True, {"total_count": total, "workflow_runs": [{"id": 100}]})]):
                self.assertFalse(aud.paginated("fixture", "workflow_runs")[0])

    def test_all_repository_pages_are_read(self):
        first = [{"name": f"fixture-{n}"} for n in range(100)]
        with patch.object(aud, "gh_json", side_effect=[(True, first), (True, [{"name": "last"}])]) as request:
            ok, names = aud.list_repos("fixture")
        self.assertTrue(ok)
        self.assertEqual(len(names), 101)
        self.assertIn("page=2", request.call_args.args[0][1])

    def test_duplicate_repository_pages_are_not_complete(self):
        with patch.object(aud, "paginated", return_value=(True, [{"name": "x"}, {"name": "x"}])):
            self.assertFalse(aud.list_repos("fixture")[0])

    def test_duplicate_ids_across_pages_are_incomplete(self):
        with patch.object(aud, "gh_json", side_effect=[(True, [{"id": n} for n in range(100)]), (True, [{"id": 0}])]):
            self.assertFalse(aud.paginated("fixture")[0])

    def test_head_drift_is_incomplete(self):
        meta = {"default_branch": "main", "top_language": "Python", "pushed_at": "2026-09-12T00:00:00Z",
                "license_spdx": "MIT", "archived": False, "private": False}
        with patch.object(aud, "get_repo_meta", return_value=meta), \
             patch.object(aud, "get_head", side_effect=[HEAD, OTHER]), \
             patch.object(aud, "path_exists", return_value=True), \
             patch.object(aud, "get_open_pr_count", return_value=0), \
             patch.object(aud, "get_latest_ci", return_value={"available": True, "lanes": [], "push": {"conclusion": "success", "url": None}}):
            record = aud.audit_repo("fixture", "example")
        self.assertFalse(record["collection_complete"])
        self.assertNotEqual(record["flag"], "GREEN")
        self.assertEqual(record["runtime_state"], "NOT_PROBED")


class CliTests(unittest.TestCase):
    def test_malformed_replay_is_rejected_before_writing(self):
        report = {"schema_version": "szl-estate-source-ci/v2", "repo_count": 1,
                  "generated_at_utc": "2026-09-12T00:00:00Z", "repos": [good()]}
        mutations = [lambda r: r["repos"][0].pop("default_branch"),
                     lambda r: r["repos"][0].update(ci_lanes=[None]),
                     lambda r: r["repos"][0].update(latest_push_CI_conclusion=[])]
        for mutate in mutations:
            with tempfile.TemporaryDirectory() as root:
                value = json.loads(json.dumps(report))
                mutate(value)
                source, target = Path(root) / "source.json", Path(root) / "result.json"
                source.write_text(json.dumps(value), encoding="utf-8")
                with self.assertRaises(SystemExit), contextlib.redirect_stderr(io.StringIO()):
                    aud.main(["--replay", str(source), "--json-out", str(target)])
                self.assertFalse(target.exists())

    def test_incomplete_census_cannot_write_empty_success(self):
        with tempfile.TemporaryDirectory() as root, patch.object(aud, "list_repos", return_value=(False, [])):
            target = str(Path(root) / "audit.json")
            self.assertEqual(aud.main(["--all", "--json-out", target]), 2)
            self.assertFalse(Path(target).exists())

    def test_replay_never_uses_network_and_keeps_observation_time(self):
        report = {"schema_version": "szl-estate-source-ci/v2", "repo_count": 1,
                  "generated_at_utc": "2026-09-12T00:00:00Z", "repos": [{**good(), "name": "fixture"}]}
        with tempfile.TemporaryDirectory() as root:
            source, target = Path(root) / "source.json", Path(root) / "result.json"
            source.write_text(json.dumps(report), encoding="utf-8")
            with patch.object(aud, "run_gh", side_effect=AssertionError("network")), contextlib.redirect_stdout(io.StringIO()):
                self.assertEqual(aud.main(["--replay", str(source), "--json-out", str(target), "--no-table"]), 0)
            replayed = json.loads(target.read_text())
            self.assertEqual(replayed["generated_at_utc"], report["generated_at_utc"])
            self.assertTrue(Path(str(target) + ".sha256").exists())


if __name__ == "__main__":
    unittest.main()
