"""Pinned source observation regressions; all GitHub/Hub/signing calls mocked."""
from __future__ import annotations

import base64
import copy
import hashlib
import importlib.util
import json
import os
import subprocess
import unittest
from pathlib import Path
from unittest.mock import patch

EXECUTOR = Path(__file__).resolve().parent.parent / "readiness-operability" / "executor.py"
SPEC = importlib.util.spec_from_file_location("readiness_operability_under_test", EXECUTOR)
operability = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(operability)

REVISION = "1" * 40
TREE = "2" * 40
REPO = "example/fixture"
DOCKER = b"FROM example.invalid/base\nCMD [\"fixture\"]\n"
BLOB = hashlib.sha1(f"blob {len(DOCKER)}\0".encode() + DOCKER).hexdigest()


def file_entry(path: str, blob: str = "3" * 40) -> dict:
    return {"path": path, "sha": blob, "type": "blob", "mode": "100644"}


class OperabilityEvidenceTest(unittest.TestCase):
    def observe(self, overrides: dict | None = None) -> tuple[dict, list[str]]:
        answers = {
            f"repos/{REPO}": {"default_branch": "feature/source"},
            f"repos/{REPO}/commits/feature%2Fsource": {
                "sha": REVISION, "commit": {"tree": {"sha": TREE}},
            },
            f"repos/{REPO}/git/trees/{TREE}?recursive=1": {
                "sha": TREE, "truncated": False,
                "tree": [file_entry("RUNBOOK.md"), file_entry(".env.example"), file_entry("Dockerfile", BLOB)],
            },
            f"repos/{REPO}/contents/Dockerfile?ref={REVISION}": {
                "sha": BLOB, "encoding": "base64", "content": base64.b64encode(DOCKER).decode(),
            },
            "commits": [{"sha": "4" * 40}, {"sha": "5" * 40}],
        }
        answers.update(overrides or {})
        calls = []
        def fake(path: str) -> object:
            calls.append(path)
            value = answers["commits"] if "/commits?" in path else answers[path]
            if isinstance(value, Exception):
                raise value
            return copy.deepcopy(value)
        with patch.object(operability, "gh", side_effect=fake):
            return operability.score_flagship(REPO), calls

    def test_complete_source_is_bound_to_exact_revision_and_tree(self) -> None:
        row, calls = self.observe()
        self.assertEqual(row["revision"], REVISION)
        self.assertEqual(row["tree_sha"], TREE)
        self.assertEqual(row["score"], 4)
        self.assertEqual(row["observation_state"], "COMPLETE")
        self.assertEqual(row["readiness_qualification"], "NOT_ASSESSED")
        self.assertTrue(any(f"ref={REVISION}" in p for p in calls))
        query = next(p for p in calls if "/commits?" in p)
        self.assertIn(f"sha={REVISION}", query)
        self.assertIn("since=", query)
        self.assertIn("until=", query)
        self.assertEqual(row["commits_last_7d"], 2)
        self.assertEqual(row["commits_last_7d_lower_bound"], 2)

    def test_repository_inaccessible_is_unknown_and_not_zero(self) -> None:
        row, calls = self.observe({f"repos/{REPO}": operability.EvidenceUnavailable("request_failed")})
        self.assertEqual(len(calls), 1)
        self.assertIsNone(row["score"])
        self.assertIsNone(row["revision"])
        self.assertTrue(all(v is None for v in row["signals"].values()))
        self.assertTrue(all(v["state"] == "UNKNOWN" for v in row["signal_details"].values()))

    def test_confirmed_empty_tree_is_absence_not_unknown(self) -> None:
        row, _ = self.observe({f"repos/{REPO}/git/trees/{TREE}?recursive=1": {
            "sha": TREE, "truncated": False, "tree": [],
        }, "commits": []})
        self.assertEqual(row["score"], 0)
        self.assertEqual(row["observation_state"], "COMPLETE")
        self.assertTrue(all(v is False for v in row["signals"].values()))
        self.assertEqual(row["commits_last_7d"], 0)

    def test_tree_failure_keeps_maintenance_observation(self) -> None:
        row, _ = self.observe({f"repos/{REPO}/git/trees/{TREE}?recursive=1": operability.EvidenceUnavailable("request_failed")})
        self.assertIsNone(row["signals"]["rollback_runbook"])
        self.assertIs(row["signals"]["active_maintenance"], True)
        self.assertIsNone(row["score"])
        self.assertEqual(row["observed_score"], 1)

    def test_truncated_and_malformed_tree_never_confirm_absence(self) -> None:
        for tree in [
            {"sha": TREE, "truncated": True, "tree": []},
            {"sha": TREE, "tree": []},
            {"sha": "9" * 40, "truncated": False, "tree": []},
            {"sha": TREE, "truncated": False, "tree": {}},
            {"sha": TREE, "truncated": False, "tree": [None]},
            {"sha": TREE, "truncated": False, "tree": [file_entry("RUNBOOK.md"), file_entry("RUNBOOK.md")]},
        ]:
            with self.subTest(tree=tree):
                row, _ = self.observe({f"repos/{REPO}/git/trees/{TREE}?recursive=1": tree})
                self.assertIsNone(row["score"])
                self.assertIsNone(row["signals"]["env_var_docs"])

    def test_malformed_revision_stops_unbound_reads(self) -> None:
        for commit in [None, {}, {"sha": "main"}, {"sha": REVISION, "commit": None},
                       {"sha": REVISION, "commit": {"tree": []}}]:
            with self.subTest(commit=commit):
                row, calls = self.observe({f"repos/{REPO}/commits/feature%2Fsource": commit})
                self.assertEqual(len(calls), 2)
                self.assertIsNone(row["score"])

    def test_docker_read_failure_does_not_claim_missing_file(self) -> None:
        row, _ = self.observe({f"repos/{REPO}/contents/Dockerfile?ref={REVISION}": operability.EvidenceUnavailable("request_failed")})
        self.assertIsNone(row["signals"]["dockerfile_ok"])
        self.assertEqual(row["signal_details"]["dockerfile_ok"]["paths"], ["Dockerfile"])
        self.assertEqual(row["observed_score"], 3)
        self.assertIsNone(row["score"])

    def test_docker_content_must_match_pinned_blob(self) -> None:
        row, _ = self.observe({f"repos/{REPO}/contents/Dockerfile?ref={REVISION}": {
            "sha": BLOB, "encoding": "base64", "content": base64.b64encode(b"FROM other\nCMD nope\n").decode(),
        }})
        self.assertIsNone(row["signals"]["dockerfile_ok"])
        self.assertEqual(row["signal_details"]["dockerfile_ok"]["reason"], "dockerfile_blob_mismatch")

    def test_docker_comments_and_substrings_do_not_count(self) -> None:
        for raw in [b"# FROM example\n# CMD x\n", b"RUN echo FROM example CMD x\n", b"FROM example\n"]:
            with self.subTest(raw=raw):
                blob = hashlib.sha1(f"blob {len(raw)}\0".encode() + raw).hexdigest()
                with patch.object(operability, "gh", return_value={
                    "sha": blob, "encoding": "base64", "content": base64.b64encode(raw).decode(),
                }):
                    self.assertFalse(operability.dockerfile_structure(REPO, REVISION, file_entry("Dockerfile", blob)))

    def test_docker_malformed_encoding_is_unknown(self) -> None:
        for content in ["!!!", base64.b64encode(b"\xff").decode()]:
            row, _ = self.observe({f"repos/{REPO}/contents/Dockerfile?ref={REVISION}": {
                "sha": BLOB, "encoding": "base64", "content": content,
            }})
            self.assertIsNone(row["signals"]["dockerfile_ok"])

    def test_symlink_document_is_unknown_not_present(self) -> None:
        entry = file_entry("RUNBOOK.md")
        entry["mode"] = "120000"
        row, _ = self.observe({f"repos/{REPO}/git/trees/{TREE}?recursive=1": {
            "sha": TREE, "truncated": False, "tree": [entry],
        }})
        self.assertIsNone(row["signals"]["rollback_runbook"])

    def test_commit_read_error_and_malformed_data_are_unknown(self) -> None:
        for commits in [operability.EvidenceUnavailable("request_failed"), {}, [None],
                        [{"sha": "4" * 40}, {"sha": "4" * 40}]]:
            with self.subTest(commits=commits):
                row, _ = self.observe({"commits": commits})
                self.assertIsNone(row["signals"]["active_maintenance"])
                self.assertIsNone(row["commits_last_7d"])
                self.assertIsNone(row["score"])
                self.assertEqual(row["observed_score"], 3)

    def test_one_commit_is_known_below_threshold(self) -> None:
        row, _ = self.observe({"commits": [{"sha": "4" * 40}]})
        self.assertIs(row["signals"]["active_maintenance"], False)
        self.assertEqual(row["commits_last_7d"], 1)
        self.assertEqual(row["score"], 3)

    def test_commit_history_pages_are_exhausted_at_pinned_revision(self) -> None:
        commits = [{"sha": f"{i:040x}"} for i in range(100)]
        answers = [commits, [{"sha": "f" * 40}]]
        with patch.object(operability, "gh", side_effect=answers) as read:
            active, lower, exact = operability.maintenance(
                REPO, REVISION, operability.dt.datetime(2026, 10, 2, tzinfo=operability.dt.timezone.utc))
        self.assertEqual((active, lower, exact), (True, 101, 101))
        self.assertTrue(all(f"sha={REVISION}" in call.args[0] for call in read.call_args_list))
        self.assertIn("page=2", read.call_args_list[1].args[0])

    def test_duplicate_commit_across_pages_is_not_an_exact_count(self) -> None:
        commits = [{"sha": f"{i:040x}"} for i in range(100)]
        with patch.object(operability, "gh", side_effect=[commits, [commits[0]]]):
            with self.assertRaisesRegex(operability.EvidenceUnavailable, "duplicate_commits"):
                operability.maintenance(REPO, REVISION, operability.dt.datetime.now(operability.dt.timezone.utc))

    def test_commit_page_limit_is_incomplete_not_confirmed_count(self) -> None:
        pages = [[{"sha": f"{i:040x}"} for i in range(page * 100, (page + 1) * 100)] for page in range(10)]
        with patch.object(operability, "gh", side_effect=pages):
            with self.assertRaisesRegex(operability.EvidenceUnavailable, "incomplete_commit_history"):
                operability.maintenance(REPO, REVISION, operability.dt.datetime.now(operability.dt.timezone.utc))

    def test_cli_timeout_and_invalid_json_are_unknown(self) -> None:
        for response in [subprocess.TimeoutExpired("gh", 30), subprocess.CompletedProcess([], 0, "not-json", "")]:
            with self.subTest(response=response):
                kwargs = {"side_effect": response} if isinstance(response, Exception) else {"return_value": response}
                with patch.object(operability.subprocess, "run", **kwargs):
                    row = operability.score_flagship(REPO)
                self.assertIsNone(row["score"])
                self.assertTrue(all(v is None for v in row["signals"].values()))

    def test_docker_build_flag_never_launches_build(self) -> None:
        with patch.dict(os.environ, {"DOCKER_BUILD": "1"}), patch.object(operability.subprocess, "run") as run:
            row, _ = self.observe()
        run.assert_not_called()
        self.assertEqual(row["docker_check"], "STRUCTURE_ONLY")
        self.assertEqual(row["docker_build"], "NOT_MEASURED")

    def test_provider_diagnostics_are_not_retained(self) -> None:
        fake = subprocess.CompletedProcess([], 1, "", "sensitive-provider-diagnostic")
        with patch.object(operability.subprocess, "run", return_value=fake):
            row = operability.score_flagship(REPO)
        self.assertNotIn("sensitive-provider-diagnostic", json.dumps(row))
        self.assertIsNone(row["score"])

    def test_publication_failure_still_fails_main(self) -> None:
        with patch.object(operability.khipu, "FLAGSHIPS", []), \
                patch.object(operability.khipu, "emit", side_effect=SystemExit(1)):
            with self.assertRaises(SystemExit) as raised:
                operability.main()
        self.assertEqual(raised.exception.code, 1)

    def test_successful_publication_does_not_qualify_readiness(self) -> None:
        with patch.object(operability.khipu, "FLAGSHIPS", []), patch.object(operability.khipu, "emit") as emit:
            self.assertEqual(operability.main(), 0)
        self.assertEqual(emit.call_args.args[1]["readiness_qualification"], "NOT_ASSESSED")


if __name__ == "__main__":
    unittest.main(verbosity=2)
