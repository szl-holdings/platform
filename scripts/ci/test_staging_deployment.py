"""Validate the provider-neutral staging workflow contract."""

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
BASH = shutil.which("bash")


def step(name):
    marker = f"      - name: {name}\n"
    start = WORKFLOW.index(marker)
    end = WORKFLOW.find("\n      - ", start + len(marker))
    return WORKFLOW[start:] if end == -1 else WORKFLOW[start:end]


def script(name):
    return textwrap.dedent(step(name).split("        run: |\n", 1)[1])


class StagingValidationTests(unittest.TestCase):
    def run_step(self, name):
        with tempfile.TemporaryDirectory(prefix="staging-contract-") as directory:
            summary_path = Path(directory) / "summary"
            environment = dict(os.environ)
            environment.pop("BASH_ENV", None)
            environment.update(
                GITHUB_SHA="fixture-sha",
                GITHUB_STEP_SUMMARY=str(summary_path),
                VALIDATION_OUTCOME="success",
                PATH="/no-external-commands-in-staging-tests",
            )
            source = script(name)
            if name == "Deployment summary":
                source = re.sub(r"\$\{\{[^}]+\}\}", "fixture-context", source)
            result = subprocess.run(
                [BASH, "--noprofile", "--norc", "-s"],
                input=source,
                text=True,
                capture_output=True,
                env=environment,
                cwd=ROOT,
                timeout=5,
                check=False,
            )
            summary = summary_path.read_text() if summary_path.exists() else ""
        return result, summary

    def test_validation_passes_without_external_request(self):
        result, summary = self.run_step("Validate staging source")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("External deployment provider is disabled", result.stdout)
        self.assertEqual(summary, "")

    def test_summary_reports_disabled_deployment(self):
        result, summary = self.run_step("Deployment summary")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("Source validation:** fixture-context", summary)
        self.assertIn("Deployment provider:** disabled", summary)
        self.assertIn("Deployment request:** skipped", summary)
        self.assertIn("Runtime readiness:** unverified", summary)
        self.assertIn("if: always()", step("Deployment summary"))

    def test_workflow_has_no_replit_dependency(self):
        lowered = WORKFLOW.lower()
        self.assertNotIn("replit", lowered)
        self.assertNotIn("curl", lowered)
        self.assertNotIn("deploy_token", lowered)
        self.assertNotIn("app_id", lowered)

    def test_workflow_preserves_boundaries(self):
        self.assertRegex(WORKFLOW, r"(?m)^  push:\n    branches: \[main, master\]$")
        self.assertEqual(re.findall(r"(?m)^\s+contents: (.+)$", WORKFLOW), ["read", "read"])
        self.assertIn("    environment: staging\n", WORKFLOW)
        self.assertIn("ref: ${{ github.sha }}", WORKFLOW)
        self.assertNotIn("continue-on-error", WORKFLOW)
        self.assertIn("      - name: Validate staging source\n", WORKFLOW)
        self.assertIn("      - name: Deployment summary\n", WORKFLOW)

    def test_validation_has_no_network_commands(self):
        source = script("Validate staging source").lower()
        for command in ("curl", "wget", "invoke-webrequest", "invoke-restmethod"):
            self.assertNotIn(command, source)


if __name__ == "__main__":
    unittest.main()
