"""Execute the staging workflow's Bash with a local curl double; no network."""

from pathlib import Path
import os
import re
import shutil
import subprocess
import tempfile
import textwrap
import unittest


ROOT = Path(__file__).resolve().parents[2]
WORKFLOW = (ROOT / ".github/workflows/deploy-staging.yml").read_text()
TOKEN = "fixture-only-token-$(exit 89)-'\""
APP_ID = "fixture-app"
BASH = shutil.which("bash")


def step(name):
    marker = f"      - name: {name}\n"
    start = WORKFLOW.index(marker)
    end = WORKFLOW.find("\n      - ", start + len(marker))
    return WORKFLOW[start:] if end == -1 else WORKFLOW[start:end]


def script(name):
    return textwrap.dedent(step(name).split("        run: |\n", 1)[1])


class StagingDeploymentTests(unittest.TestCase):
    def run_step(self, name, status="202", curl_exit=0, app=APP_ID, token=TOKEN):
        with tempfile.TemporaryDirectory(prefix="staging-contract-") as directory:
            args_path = Path(directory) / "curl-args"
            summary_path = Path(directory) / "summary"
            environment = dict(os.environ)
            environment.pop("BASH_ENV", None)
            environment.update(
                REPLIT_APP_ID=app,
                REPLIT_DEPLOY_TOKEN=token,
                MOCK_HTTP_STATUS=status,
                MOCK_CURL_EXIT=str(curl_exit),
                MOCK_ARGS=str(args_path),
                GITHUB_STEP_SUMMARY=str(summary_path),
                CONFIGURATION_OUTCOME="failure",
                REQUEST_OUTCOME="skipped",
                PATH="/no-external-commands-in-staging-tests",
            )
            # All commands used by the workflow are Bash builtins except curl.
            # An empty command search path also prevents network access if the
            # curl double is accidentally broken or removed.
            double = """curl() {
  printf 'MOCK_CURL_CALL\n' >&2
  printf '%s\n' "$@" >> "$MOCK_ARGS"
  printf '%s' "$MOCK_HTTP_STATUS"
  return "$MOCK_CURL_EXIT"
}
"""
            source = script(name)
            if name == "Deployment summary":
                source = re.sub(r"\$\{\{ github\.[a-z_]+ \}\}", "fixture-context", source)
            result = subprocess.run(
                [BASH, "--noprofile", "--norc", "-s"],
                input=double + source,
                text=True,
                capture_output=True,
                env=environment,
                timeout=5,
                check=False,
            )
            args = args_path.read_text().splitlines() if args_path.exists() else []
            summary = summary_path.read_text() if summary_path.exists() else ""
        self.assertNotIn(TOKEN, result.stdout + result.stderr + summary)
        return result, args, summary

    def assert_one_request(self, result, args):
        self.assertEqual(result.stderr.count("MOCK_CURL_CALL"), 1)
        self.assertEqual(
            args,
            [
                "-q", "--globoff", "--silent", "--connect-timeout", "10", "--max-time", "60",
                "--output", "/dev/null", "--write-out", "%{http_code}",
                "-X", "POST", "-H", f"Authorization: Bearer {TOKEN}",
                "-H", "Content-Type: application/json",
                f"https://replit.com/api/v1/repls/{APP_ID}/deployments",
            ],
        )

    def test_accepts_only_2xx_without_claiming_runtime_readiness(self):
        for status in ("200", "201", "202", "204", "299"):
            with self.subTest(status=status):
                result, args, _ = self.run_step("Trigger staging deployment", status)
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertIn("request accepted", result.stdout)
                self.assertIn("deployment readiness is unverified", result.stdout)
                self.assert_one_request(result, args)

    def test_rejections_and_redirects_fail_without_retry(self):
        for status in ("000", "199", "300", "301", "307", "400", "401", "403", "404", "429", "500", "503", "599"):
            with self.subTest(status=status):
                result, args, _ = self.run_step("Trigger staging deployment", status)
                self.assertNotEqual(result.returncode, 0)
                self.assertIn(f"::error::Replit staging API returned HTTP {status}", result.stdout)
                self.assertNotIn("request accepted", result.stdout)
                self.assertNotIn("expired", result.stdout)
                self.assert_one_request(result, args)

    def test_malformed_status_fails_without_echoing_untrusted_output(self):
        for status in ("", "20", "2000", "0200", "200 202", "200\n403", "::warning::injected", TOKEN):
            with self.subTest(status=status):
                result, args, _ = self.run_step("Trigger staging deployment", status)
                self.assertNotEqual(result.returncode, 0)
                self.assertIn("invalid HTTP status", result.stdout)
                self.assertNotIn("request accepted", result.stdout)
                self.assertNotIn("::warning::injected", result.stdout)
                self.assert_one_request(result, args)

    def test_network_tls_and_timeout_fail_even_if_status_looks_successful(self):
        for curl_exit in (6, 7, 28, 35, 60):
            for status in ("000", "200"):
                with self.subTest(curl_exit=curl_exit, status=status):
                    result, args, _ = self.run_step("Trigger staging deployment", status, curl_exit)
                    self.assertNotEqual(result.returncode, 0)
                    self.assertIn(f"curl exit={curl_exit}", result.stdout)
                    self.assertNotIn("request accepted", result.stdout)
                    self.assert_one_request(result, args)

    def test_missing_configuration_blocks_both_steps_before_any_request(self):
        for name in ("Verify staging configuration", "Trigger staging deployment"):
            for app, token in (("", TOKEN), (APP_ID, ""), ("", "")):
                with self.subTest(step=name, app_present=bool(app), token_present=bool(token)):
                    result, args, _ = self.run_step(name, app=app, token=token)
                    self.assertNotEqual(result.returncode, 0)
                    self.assertIn("BLOCKED", result.stdout)
                    self.assertEqual(args, [])
                    self.assertNotIn("MOCK_CURL_CALL", result.stderr)

    def test_configuration_presence_is_not_provider_authority(self):
        result, args, _ = self.run_step("Verify staging configuration")
        self.assertEqual(result.returncode, 0)
        self.assertIn("provider authority remains unverified", result.stdout)
        self.assertEqual(args, [])

    def test_configured_url_globs_remain_one_literal_target(self):
        result, args, _ = self.run_step("Trigger staging deployment", app="fixture-{one,two}[1-3]")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(result.stderr.count("MOCK_CURL_CALL"), 1)
        self.assertIn("--globoff", args)
        self.assertEqual(args[-1], "https://replit.com/api/v1/repls/fixture-{one,two}[1-3]/deployments")

    def test_harness_cannot_resolve_real_curl_without_the_double(self):
        result = subprocess.run(
            [BASH, "--noprofile", "--norc", "-c", "command -v curl"],
            env={"PATH": "/no-external-commands-in-staging-tests"},
            capture_output=True,
            text=True,
            timeout=5,
            check=False,
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(result.stdout, "")

    def test_summary_reports_failed_configuration_and_skipped_request(self):
        result, args, summary = self.run_step("Deployment summary")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(args, [])
        self.assertIn("Configuration check:** failure", summary)
        self.assertIn("Deployment request step:** skipped", summary)
        self.assertIn("Deployment readiness:** UNKNOWN", summary)
        self.assertIn("if: always()", step("Deployment summary"))

    def test_workflow_preserves_authority_and_secret_boundaries(self):
        self.assertRegex(WORKFLOW, r"(?m)^  push:\n    branches: \[main, master\]$")
        self.assertEqual(re.findall(r"(?m)^\s+contents: (.+)$", WORKFLOW), ["read", "read"])
        self.assertIn("    environment: staging\n", WORKFLOW)
        self.assertIn("ref: ${{ github.sha }}", WORKFLOW)
        self.assertNotIn("continue-on-error", WORKFLOW)
        for name in ("Verify staging configuration", "Trigger staging deployment"):
            self.assertNotIn("${{", script(name))
            self.assertIn("REPLIT_APP_ID: ${{ secrets.REPLIT_STAGING_APP_ID }}", step(name))
            self.assertIn("REPLIT_DEPLOY_TOKEN: ${{ secrets.REPLIT_STAGING_DEPLOY_TOKEN }}", step(name))
            self.assertNotRegex(step(name), r"(?m)^        if:")
        ci = (ROOT / ".github/workflows/ci.yml").read_text()
        self.assertIn("python -m unittest discover -s scripts/ci -p test_staging_deployment.py -v", ci)


if __name__ == "__main__":
    unittest.main()
