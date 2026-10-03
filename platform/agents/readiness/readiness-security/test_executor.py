"""Fail-closed contracts for the read-only security readiness collector."""

from __future__ import annotations

import base64
import importlib.util
import json
import pathlib
import subprocess
import unittest
from datetime import datetime, timezone
from unittest.mock import patch


MODULE_PATH = pathlib.Path(__file__).with_name("executor.py")
SPEC = importlib.util.spec_from_file_location("readiness_security_executor", MODULE_PATH)
assert SPEC and SPEC.loader
security = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(security)

REPO = "szl-holdings/example"
PLATFORM = "szl-holdings/platform"
HEAD = "a" * 40
OLD = "b" * 40
NOW = datetime(2026, 10, 3, 0, 0, tzinfo=timezone.utc)
PLATFORM_WORKFLOW = (MODULE_PATH.parents[4] / ".github" / "workflows" / "security.yml").read_text(
    encoding="utf-8")
WORKFLOW_FILES = [
    {"name": "sbom.yml", "type": "file"},
    {"name": "trivy.yml", "type": "file"},
    {"name": "secret-scan.yml", "type": "file"},
]


def run(file: str, sha: str = HEAD, conclusion: str = "success", run_id: int = 1) -> dict:
    return {
        "path": f".github/workflows/{file}",
        "head_branch": "main",
        "head_sha": sha,
        "status": "completed",
        "conclusion": conclusion,
        "id": run_id,
        "created_at": f"2026-10-02T{run_id:02d}:00:00Z",
    }


def github_reads(runs: list[dict], repo: str = REPO,
                 workflow_files: list[dict] = WORKFLOW_FILES) -> dict[str, tuple[int, str]]:
    return {
        f"repos/{repo}/contents/.github/workflows?ref={HEAD}": (0, json.dumps(workflow_files)),
        f"repos/{repo}/actions/runs?branch=main&per_page=100":
            (0, json.dumps({"workflow_runs": runs})),
    }


def platform_reads(workflow_content: str = PLATFORM_WORKFLOW, *,
                   workflow_conclusion: str = "success", job_conclusion: str = "success",
                   step_conclusion: str = "success") -> dict[str, tuple[int, str]]:
    files = [*WORKFLOW_FILES, {"name": "security.yml", "type": "file"}]
    runs = [run("sbom.yml", run_id=1), run("trivy.yml", run_id=2),
            run("security.yml", conclusion=workflow_conclusion, run_id=3)]
    responses = github_reads(runs, PLATFORM, files)
    responses[f"repos/{PLATFORM}/contents/.github/workflows/security.yml?ref={HEAD}"] = (
        0, json.dumps({"type": "file", "encoding": "base64", "content":
                       base64.b64encode(workflow_content.encode()).decode()}))
    responses[f"repos/{PLATFORM}/actions/runs/3/jobs?per_page=100"] = (0, json.dumps({
        "total_count": 1, "jobs": [{"id": 300, "name": security.PLATFORM_SECRET_JOB,
                                    "status": "completed", "conclusion": job_conclusion,
                                    "steps": [{"name": security.PLATFORM_SECRET_STEP,
                                               "status": "completed", "conclusion": step_conclusion}]}],
    }))
    return responses


def fake_gh(responses: dict[str, tuple[int, str]]):
    return lambda endpoint: responses.get(endpoint, (1, "gh: server error (HTTP 500)"))


class SecurityReadinessTest(unittest.TestCase):
    def setUp(self) -> None:
        clock = patch.object(security, "_utcnow", return_value=NOW)
        clock.start()
        self.addCleanup(clock.stop)

    def test_inventory_failure_does_not_fall_back_to_static_repos(self) -> None:
        failed = subprocess.CompletedProcess(args=[], returncode=1, stdout="", stderr="denied")
        with patch.object(security.subprocess, "run", return_value=failed):
            result = security.list_repos()
        self.assertEqual(result, {"status": "READ_FAILED", "repos": []})

    def test_empty_or_malformed_inventory_is_unavailable(self) -> None:
        for raw in ("[]", "not-json", '[{"nameWithOwner":"other/repo"}]'):
            with self.subTest(raw=raw), patch.object(
                security.subprocess, "run",
                return_value=subprocess.CompletedProcess(args=[], returncode=0, stdout=raw, stderr=""),
            ):
                self.assertEqual(security.list_repos()["status"], "EMPTY_OR_INVALID")

    def test_default_branch_and_exact_head_are_observed(self) -> None:
        responses = {
            f"repos/{REPO}": (0, json.dumps({"default_branch": "main"})),
            f"repos/{REPO}/branches/main": (0, json.dumps({"commit": {"sha": HEAD}})),
        }
        with patch.object(security, "gh", side_effect=fake_gh(responses)):
            self.assertEqual(security.repo_head(REPO), {
                "status": "OBSERVED", "default_branch": "main", "head_sha": HEAD,
            })
        with patch.object(security, "gh", side_effect=fake_gh({})):
            self.assertEqual(security.repo_head(REPO)["status"], "READ_FAILED")

    def test_workflow_directory_and_run_read_failures_cannot_pass(self) -> None:
        with patch.object(security, "gh", side_effect=fake_gh({})):
            observed = security.workflow_status(REPO, "main", HEAD)
        self.assertEqual(observed["listing_status"], "READ_FAILED")
        self.assertTrue(all(value is None for value in observed["present"].values()))

        responses = github_reads([])
        responses[f"repos/{REPO}/actions/runs?branch=main&per_page=100"] = (1, "HTTP 500")
        with patch.object(security, "gh", side_effect=fake_gh(responses)):
            observed = security.workflow_status(REPO, "main", HEAD)
        self.assertEqual(observed["runs_status"], "READ_FAILED")
        self.assertTrue(all(value is None for value in observed["recent_success"].values()))

    def test_old_head_success_does_not_satisfy_current_head(self) -> None:
        responses = github_reads([run(file, OLD) for file in
                                  ("sbom.yml", "trivy.yml", "secret-scan.yml")])
        with patch.object(security, "gh", side_effect=fake_gh(responses)):
            observed = security.workflow_status(REPO, "main", HEAD)
        self.assertTrue(all(control["status"] == "WRONG_HEAD_RUN"
                            for control in observed["controls"].values()))
        self.assertTrue(all(value is None for value in observed["recent_success"].values()))

    def test_current_head_failure_beats_an_older_success(self) -> None:
        responses = github_reads([
            run("sbom.yml", HEAD, "failure", 5),
            run("sbom.yml", HEAD, "success", 2),
            run("trivy.yml", HEAD, "success", 3),
            run("secret-scan.yml", HEAD, "success", 4),
        ])
        with patch.object(security, "gh", side_effect=fake_gh(responses)):
            observed = security.workflow_status(REPO, "main", HEAD)
        self.assertEqual(observed["controls"]["sbom"]["status"], "RUN_NOT_SUCCESS")
        self.assertFalse(observed["recent_success"]["sbom"])
        self.assertTrue(observed["recent_success"]["trivy"])

    def test_exact_head_success_must_be_within_30_days(self) -> None:
        stale = run("sbom.yml")
        stale["created_at"] = "2026-09-02T00:00:00Z"
        boundary = run("trivy.yml")
        boundary["created_at"] = "2026-09-03T00:00:00Z"
        with patch.object(security, "gh", side_effect=fake_gh(github_reads([stale, boundary]))):
            observed = security.workflow_status(REPO, "main", HEAD)
        self.assertEqual(observed["controls"]["sbom"]["status"], "STALE_RUN")
        self.assertIsNone(observed["recent_success"]["sbom"])
        self.assertEqual(observed["controls"]["trivy"]["status"], "SUCCESS")
        self.assertTrue(observed["recent_success"]["trivy"])
        head = {"status": "OBSERVED"}
        policy = {"status": "OBSERVED", "has_contact": True, "mentions_stale_doctrine": False}
        verdict, reasons = security.repo_verdict(head, observed, policy,
                                                  {"status": "VERIFIED", "verified": True})
        self.assertEqual(verdict, "AMBER")
        self.assertIn("workflow:sbom:STALE_RUN", reasons)

    def test_invalid_or_future_run_timestamp_holds(self) -> None:
        for timestamp in (None, "2026-10-02T05:00:00", "2026-10-03T00:06:00Z",
                          "2026-13-02T05:00:00Z", "9999-12-31T23:59:59-23:59"):
            with self.subTest(timestamp=timestamp):
                latest = run("sbom.yml", run_id=5)
                latest["created_at"] = timestamp
                with patch.object(security, "gh", side_effect=fake_gh(github_reads([
                    latest, run("sbom.yml", run_id=2)
                ]))):
                    observed = security.workflow_status(REPO, "main", HEAD)
                self.assertEqual(observed["controls"]["sbom"]["status"],
                                 "INVALID_RUN_TIMESTAMP")
                self.assertIsNone(observed["recent_success"]["sbom"])

    def test_in_progress_exact_head_run_is_hold(self) -> None:
        pending = run("sbom.yml")
        pending["status"] = "in_progress"
        pending["conclusion"] = None
        with patch.object(security, "gh", side_effect=fake_gh(github_reads([pending]))):
            observed = security.workflow_status(REPO, "main", HEAD)
        self.assertEqual(observed["controls"]["sbom"]["status"], "RUN_IN_PROGRESS")
        self.assertIsNone(observed["recent_success"]["sbom"])

    def test_no_run_at_head_has_explicit_status(self) -> None:
        responses = github_reads([])
        with patch.object(security, "gh", side_effect=fake_gh(responses)):
            observed = security.workflow_status(REPO, "main", HEAD)
        self.assertEqual(observed["controls"]["sbom"]["status"], "NO_CURRENT_HEAD_RUN")

    def test_platform_security_workflow_binds_gitleaks_job_and_scan_step(self) -> None:
        with patch.object(security, "gh", side_effect=fake_gh(platform_reads(
            workflow_conclusion="failure"))):
            observed = security.workflow_status(PLATFORM, "main", HEAD)
        control = observed["controls"]["gitleaks"]
        self.assertTrue(observed["present"]["gitleaks"])
        self.assertEqual(control["status"], "SUCCESS")
        self.assertEqual(control["workflow_files"], ["security.yml"])
        self.assertEqual(control["run_head_sha"], HEAD)
        self.assertEqual(control["run_id"], 3)
        self.assertEqual(control["run_conclusion"], "failure")
        self.assertEqual(control["job_ids"], [300])
        self.assertEqual(control["scan_step"], security.PLATFORM_SECRET_STEP)
        self.assertTrue(observed["recent_success"]["gitleaks"])

    def test_platform_security_workflow_content_failure_cannot_use_secret_named_file(self) -> None:
        responses = platform_reads("jobs:\n  secret-scan:\n    name: Secret Scan (Gitleaks)\n")
        with patch.object(security, "gh", side_effect=fake_gh(responses)):
            observed = security.workflow_status(PLATFORM, "main", HEAD)
        self.assertEqual(observed["controls"]["gitleaks"]["status"], "MISSING_WORKFLOW")
        self.assertFalse(observed["present"]["gitleaks"])
        self.assertIsNone(observed["recent_success"]["gitleaks"])

    def test_platform_security_workflow_rejects_continue_on_error(self) -> None:
        content = PLATFORM_WORKFLOW.replace(
            "  secret-scan:\n", "  secret-scan:\n    continue-on-error: true\n", 1)
        with patch.object(security, "gh", side_effect=fake_gh(platform_reads(content))):
            observed = security.workflow_status(PLATFORM, "main", HEAD)
        self.assertEqual(observed["controls"]["gitleaks"]["status"], "MISSING_WORKFLOW")

    def test_platform_security_workflow_unreadable_content_holds(self) -> None:
        responses = platform_reads()
        responses[f"repos/{PLATFORM}/contents/.github/workflows/security.yml?ref={HEAD}"] = (1, "HTTP 500")
        with patch.object(security, "gh", side_effect=fake_gh(responses)):
            observed = security.workflow_status(PLATFORM, "main", HEAD)
        self.assertEqual(observed["controls"]["gitleaks"]["status"], "READ_FAILED")
        self.assertIsNone(observed["present"]["gitleaks"])

    def test_platform_security_workflow_requires_successful_scan_step(self) -> None:
        for job_result, step_result in (("failure", "success"), ("success", "skipped")):
            with self.subTest(job=job_result, step=step_result), patch.object(
                security, "gh", side_effect=fake_gh(platform_reads(
                    workflow_conclusion="failure", job_conclusion=job_result,
                    step_conclusion=step_result))
            ):
                observed = security.workflow_status(PLATFORM, "main", HEAD)
                self.assertEqual(observed["controls"]["gitleaks"]["status"], "JOB_NOT_SUCCESS")
                self.assertFalse(observed["recent_success"]["gitleaks"])
                verdict, reasons = security.repo_verdict(
                    {"status": "OBSERVED"}, observed,
                    {"status": "OBSERVED", "has_contact": True},
                    {"status": "UNVERIFIED", "verified": None})
                self.assertEqual(verdict, "RED")
                self.assertIn("workflow:gitleaks:JOB_NOT_SUCCESS", reasons)

    def test_platform_security_workflow_job_read_failure_holds(self) -> None:
        responses = platform_reads()
        responses[f"repos/{PLATFORM}/actions/runs/3/jobs?per_page=100"] = (1, "HTTP 500")
        with patch.object(security, "gh", side_effect=fake_gh(responses)):
            observed = security.workflow_status(PLATFORM, "main", HEAD)
        self.assertEqual(observed["controls"]["gitleaks"]["status"], "READ_FAILED")
        self.assertIsNone(observed["recent_success"]["gitleaks"])

    def test_platform_security_workflow_success_without_gitleaks_job_is_red(self) -> None:
        responses = platform_reads()
        responses[f"repos/{PLATFORM}/actions/runs/3/jobs?per_page=100"] = (0, json.dumps({
            "total_count": 1, "jobs": [{"id": 300, "name": "Dependency Vulnerability Scan",
                                        "status": "completed", "conclusion": "success", "steps": []}],
        }))
        with patch.object(security, "gh", side_effect=fake_gh(responses)):
            observed = security.workflow_status(PLATFORM, "main", HEAD)
        self.assertEqual(observed["controls"]["gitleaks"]["status"], "MISSING_JOB")
        verdict, reasons = security.repo_verdict(
            {"status": "OBSERVED"}, observed,
            {"status": "OBSERVED", "has_contact": True},
            {"status": "UNVERIFIED", "verified": None})
        self.assertEqual(verdict, "RED")
        self.assertIn("workflow:gitleaks:MISSING_JOB", reasons)

    def test_platform_security_workflow_wrong_head_cannot_use_successful_job(self) -> None:
        responses = platform_reads()
        runs_endpoint = f"repos/{PLATFORM}/actions/runs?branch=main&per_page=100"
        responses[runs_endpoint] = (0, json.dumps({"workflow_runs": [
            run("sbom.yml", run_id=1), run("trivy.yml", run_id=2),
            run("security.yml", OLD, run_id=3)]}))
        with patch.object(security, "gh", side_effect=fake_gh(responses)) as provider:
            observed = security.workflow_status(PLATFORM, "main", HEAD)
        self.assertEqual(observed["controls"]["gitleaks"]["status"], "WRONG_HEAD_RUN")
        self.assertNotIn(f"repos/{PLATFORM}/actions/runs/3/jobs?per_page=100",
                         [call.args[0] for call in provider.call_args_list])

    def test_platform_security_workflow_stale_run_cannot_use_successful_job(self) -> None:
        responses = platform_reads(workflow_conclusion="failure")
        runs_endpoint = f"repos/{PLATFORM}/actions/runs?branch=main&per_page=100"
        stale = run("security.yml", conclusion="failure", run_id=3)
        stale["created_at"] = "2026-09-02T00:00:00Z"
        responses[runs_endpoint] = (0, json.dumps({"workflow_runs": [
            run("sbom.yml", run_id=1), run("trivy.yml", run_id=2), stale]}))
        with patch.object(security, "gh", side_effect=fake_gh(responses)) as provider:
            observed = security.workflow_status(PLATFORM, "main", HEAD)
        self.assertEqual(observed["controls"]["gitleaks"]["status"], "STALE_RUN")
        self.assertNotIn(f"repos/{PLATFORM}/actions/runs/3/jobs?per_page=100",
                         [call.args[0] for call in provider.call_args_list])

    def test_security_policy_requires_readable_contact_at_head(self) -> None:
        endpoint = f"repos/{REPO}/contents/SECURITY.md?ref={HEAD}"
        def response(content: str) -> str:
            return json.dumps({"type": "file", "encoding": "base64",
                               "content": base64.b64encode(content.encode()).decode()})
        with patch.object(security, "gh", side_effect=fake_gh({endpoint: (0, response("Security policy"))})):
            self.assertFalse(security.security_md(REPO, HEAD)["has_contact"])
        with patch.object(security, "gh", side_effect=fake_gh({endpoint: (0, response("Email security@example.com"))})):
            self.assertTrue(security.security_md(REPO, HEAD)["has_contact"])
        with patch.object(security, "gh", side_effect=fake_gh({endpoint: (1, "HTTP 500")})):
            self.assertEqual(security.security_md(REPO, HEAD)["status"], "READ_FAILED")
        with patch.object(security, "gh", side_effect=fake_gh({
            endpoint: (0, json.dumps({"type": "file", "encoding": "base64", "content": None}))
        })):
            self.assertEqual(security.security_md(REPO, HEAD)["status"], "INVALID_RESPONSE")

    def test_all_stale_doctrine_markers_are_rejected(self) -> None:
        endpoint = f"repos/{REPO}/contents/SECURITY.md?ref={HEAD}"
        for marker in security.khipu.STALE_DOCTRINE_MARKERS:
            with self.subTest(marker=marker):
                content = f"Contact security@example.com; Doctrine {marker}"
                encoded = base64.b64encode(content.encode()).decode()
                response = json.dumps({"type": "file", "encoding": "base64",
                                       "content": encoded})
                with patch.object(security, "gh", side_effect=fake_gh({endpoint: (0, response)})):
                    observed = security.security_md(REPO, HEAD)
                self.assertTrue(observed["mentions_stale_doctrine"])

    def test_cosign_asset_presence_is_not_signature_verification(self) -> None:
        response = json.dumps({"tag_name": "v1", "assets": [
            {"name": "release.tar.gz"}, {"name": "release.tar.gz.sig"},
            {"name": "release.tar.gz.crt"},
        ]})
        with patch.object(security, "gh", return_value=(0, response)):
            observed = security.cosign_latest(REPO)
        self.assertEqual(observed["status"], "UNVERIFIED")
        self.assertIsNone(observed["verified"])

    def test_green_requires_every_bound_control_and_verified_release(self) -> None:
        workflows = {
            "controls": {ctrl: {"status": "SUCCESS"} for ctrl in security.REQUIRED_WORKFLOWS},
        }
        head = {"status": "OBSERVED", "default_branch": "main", "head_sha": HEAD}
        policy = {"status": "OBSERVED", "present": True, "has_contact": True,
                  "mentions_stale_doctrine": False}
        verified = {"status": "VERIFIED", "verified": True}
        self.assertEqual(security.repo_verdict(head, workflows, policy, verified), ("GREEN", []))
        verdict, reasons = security.repo_verdict(head, workflows, policy,
                                                 {"status": "UNVERIFIED", "verified": None})
        self.assertEqual(verdict, "AMBER")
        self.assertIn("cosign:UNVERIFIED", reasons)
        policy["has_contact"] = False
        verdict, reasons = security.repo_verdict(head, workflows, policy, verified)
        self.assertEqual(verdict, "RED")
        self.assertIn("SECURITY.md:NO_CONTACT", reasons)

    def test_inventory_failure_emits_a_hold_receipt(self) -> None:
        with patch.object(security, "list_repos", return_value={"status": "READ_FAILED", "repos": []}), \
                patch.object(security.khipu, "emit", return_value={"receipt": {"signed": True}}) as emit:
            self.assertEqual(security.main(), 0)
        payload = emit.call_args.args[1]
        self.assertEqual(payload["meta_verdict"], "AMBER")
        self.assertEqual(payload["overall_verdict"], "HOLD")
        self.assertEqual(payload["inventory"]["status"], "READ_FAILED")
        self.assertEqual(payload["repo_count"], 0)

    def test_rate_limit_stops_remaining_github_reads_and_marks_hold(self) -> None:
        denied = subprocess.CompletedProcess(args=[], returncode=1, stdout="",
                                            stderr="gh: API rate limit exceeded (HTTP 403)")
        with patch.object(security, "list_repos", return_value={
            "status": "OBSERVED", "repos": [REPO, "szl-holdings/second"]
        }), patch.object(security.subprocess, "run", return_value=denied) as provider, \
                patch.object(security.khipu, "emit", return_value={"receipt": {"signed": True}}) as emit:
            self.assertEqual(security.main(), 0)
        provider.assert_called_once()
        payload = emit.call_args.args[1]
        self.assertEqual(payload["overall_verdict"], "HOLD")
        self.assertEqual(payload["repos"][0]["head"]["status"], "RATE_LIMITED")
        self.assertEqual(payload["repos"][1]["head"]["status"], "NOT_ATTEMPTED_RATE_LIMIT")
        self.assertEqual(payload["repos"][1]["verdict"], "AMBER")

    def test_actions_fails_after_emitting_unsigned_receipt(self) -> None:
        with patch.dict(security.os.environ, {"GITHUB_ACTIONS": "true"}), \
                patch.object(security, "list_repos", return_value={"status": "READ_FAILED", "repos": []}), \
                patch.object(security.khipu, "emit", return_value={"receipt": {"signed": False}}) as emit:
            self.assertEqual(security.main(), 1)
        emit.assert_called_once()


if __name__ == "__main__":
    unittest.main()
