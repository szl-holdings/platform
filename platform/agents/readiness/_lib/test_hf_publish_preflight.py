"""Offline regressions for the READINESS-SECURITY publication preflight.

The SDK is an in-memory fake. All credential values are synthetic, and no
test performs a network request, creates a repository, or uploads evidence.
"""
from __future__ import annotations

import contextlib
import io
import json
import os
import re
import subprocess
import sys
import types
import unittest
from pathlib import Path
from unittest.mock import patch

LIB = Path(__file__).resolve().parent
ROOT = LIB.parents[3]
TOKEN = "synthetic-in-memory-value"
PROVIDER_TEXT = "private-provider-body\n::error::untrusted-command"

sys.path.insert(0, str(LIB))
import hf_publish_preflight as preflight  # noqa: E402
import khipu  # noqa: E402


class _ProviderError(Exception):
    def __init__(self, status=None) -> None:
        super().__init__(f"{TOKEN}: {PROVIDER_TEXT}")
        self.response = types.SimpleNamespace(status_code=status)


class _FakeHfApi:
    calls: list[tuple[str, dict]] = []
    failure_stage: str | None = None
    failure: Exception | None = None
    identity: dict = {}

    def _record(self, stage: str, kwargs: dict) -> None:
        self.calls.append((stage, kwargs))
        if self.failure_stage == stage:
            raise self.failure

    def __init__(self, **kwargs) -> None:
        self._record("client", kwargs)

    def whoami(self, **kwargs) -> dict:
        self._record("identity", kwargs)
        return self.identity

    def repo_info(self, **kwargs):
        self._record("destination", kwargs)
        return types.SimpleNamespace(id=khipu.HF_DATASET, private=False)

    def auth_check(self, **kwargs) -> None:
        self._record("write", kwargs)

    def upload_file(self, **kwargs) -> None:
        self._record("upload", kwargs)
        raise RuntimeError("synthetic post-preflight upload rejection")


class PublishPreflightTest(unittest.TestCase):
    def setUp(self) -> None:
        _FakeHfApi.calls = []
        _FakeHfApi.failure_stage = None
        _FakeHfApi.failure = None
        _FakeHfApi.identity = {"name": "synthetic-private-identity"}
        module = types.ModuleType("huggingface_hub")
        module.HfApi = _FakeHfApi
        self.enterContext(patch.dict(sys.modules, {"huggingface_hub": module}))
        self.enterContext(patch.dict(os.environ, {"HF_TOKEN": TOKEN}, clear=True))

    def _check(self) -> dict:
        result = preflight.check_publish_access()
        self.assertEqual(result["dataset"], khipu.HF_DATASET)
        self.assertEqual(result["repo_type"], "dataset")
        self.assertIs(type(result["ready"]), bool)
        self.assertLessEqual(set(result), {
            "ready", "stage", "code", "message", "dataset", "repo_type", "http_status",
        })
        rendered = json.dumps(result)
        for sensitive in (TOKEN, PROVIDER_TEXT, "synthetic-private-identity"):
            self.assertNotIn(sensitive, rendered)
        self.assertNotIn("upload", [stage for stage, _ in _FakeHfApi.calls])
        return result

    def _fail_at(self, stage: str, error: Exception) -> dict:
        _FakeHfApi.calls = []
        _FakeHfApi.failure_stage = stage
        _FakeHfApi.failure = error
        result = self._check()
        self.assertFalse(result["ready"])
        self.assertEqual(result["stage"], stage)
        stages = ["client", "identity", "destination", "write"]
        self.assertEqual(
            [name for name, _ in _FakeHfApi.calls], stages[:stages.index(stage) + 1],
        )
        return result

    def test_import_requires_only_stdlib_and_never_loads_hub(self) -> None:
        completed = subprocess.run(
            [sys.executable, "-B", "-S", "-c",
             "import sys; sys.modules['huggingface_hub'] = None; import hf_publish_preflight"],
            cwd=LIB, env={}, capture_output=True, text=True, timeout=10,
        )
        self.assertEqual(completed.returncode, 0, completed.stderr)
        self.assertEqual(completed.stdout, "")

    def test_missing_token_never_falls_back_to_other_authentication(self) -> None:
        for value in (None, "", " \t\r\n"):
            with self.subTest(value=value):
                env = {
                    "HUGGING_FACE_HUB_TOKEN": "synthetic-alternate-value",
                    "HF_TOKEN_PATH": "/synthetic-token-cache",
                    "ACTIONS_ID_TOKEN_REQUEST_TOKEN": "synthetic-oidc-value",
                }
                if value is not None:
                    env["HF_TOKEN"] = value
                with patch.dict(os.environ, env, clear=True):
                    result = self._check()
                self.assertEqual((result["stage"], result["code"]),
                                 ("credential", "missing_token"))
                self.assertFalse(result["ready"])
                self.assertEqual(_FakeHfApi.calls, [])

    def test_malformed_tokens_fail_without_sdk_calls(self) -> None:
        for char in (" ", "\t", "\n", "\r", "\x1f", "\x7f", "\x80", "\x9f", "\u200b"):
            with self.subTest(character=repr(char)), patch.dict(
                os.environ, {"HF_TOKEN": TOKEN + char},
            ):
                result = self._check()
                self.assertEqual((result["stage"], result["code"]),
                                 ("credential", "malformed_token"))
                self.assertFalse(result["ready"])
                self.assertEqual(_FakeHfApi.calls, [])

    def test_endpoint_override_cannot_check_a_different_hub(self) -> None:
        for endpoint in ("", "https://untrusted.example", "https://huggingface.co/"):
            with self.subTest(endpoint=endpoint), patch.dict(os.environ, {"HF_ENDPOINT": endpoint}):
                result = self._check()
                self.assertEqual((result["stage"], result["code"]),
                                 ("destination", "endpoint_mismatch"))
                self.assertFalse(result["ready"])
                self.assertEqual(_FakeHfApi.calls, [])

    def test_success_uses_explicit_token_and_exact_dataset_without_writes(self) -> None:
        with patch.dict(os.environ, {"HF_ENDPOINT": "https://huggingface.co"}):
            result = self._check()
        self.assertTrue(result["ready"])
        self.assertEqual((result["stage"], result["code"]), ("complete", "ready"))
        self.assertEqual(_FakeHfApi.calls, [
            ("client", {"endpoint": "https://huggingface.co", "token": TOKEN}),
            ("identity", {"token": TOKEN}),
            ("destination", {"repo_id": khipu.HF_DATASET, "repo_type": "dataset",
                             "token": TOKEN, "timeout": 15}),
            ("write", {"repo_id": khipu.HF_DATASET, "repo_type": "dataset",
                       "token": TOKEN, "write": True}),
        ])
        self.assertNotIn("published", result)
        self.assertNotIn("signed", result)

    def test_repo_authorization_does_not_require_a_specific_token_role_label(self) -> None:
        for role in ("fineGrained", "write", "read", "future-role", None):
            with self.subTest(role=role):
                _FakeHfApi.calls = []
                _FakeHfApi.identity = {"auth": {"accessToken": {"role": role}}}
                self.assertTrue(self._check()["ready"])
                self.assertEqual(_FakeHfApi.calls[-1][0], "write")

    def test_missing_sdk_and_failed_client_are_actionable(self) -> None:
        with patch.dict(sys.modules, {"huggingface_hub": None}):
            result = self._check()
        self.assertEqual((result["stage"], result["code"]), ("client", "client_unavailable"))
        self.assertFalse(result["ready"])
        self.assertEqual(_FakeHfApi.calls, [])
        self.assertEqual(self._fail_at("client", _ProviderError())["code"], "client_unavailable")

    def test_http_errors_are_classified_by_stage_and_stop_later_checks(self) -> None:
        cases = [
            ("identity", 401, "token_rejected"),
            ("identity", 403, "access_denied"),
            *(("destination", status, "destination_unavailable") for status in (401, 403, 404)),
            *(("write", status, "write_denied") for status in (401, 403, 404)),
        ]
        for stage, status, code in cases:
            with self.subTest(stage=stage, status=status):
                result = self._fail_at(stage, _ProviderError(status))
                self.assertEqual(result["code"], code)
                self.assertEqual(result["http_status"], status)

    def test_transient_and_unknown_errors_fail_closed_without_credential_diagnosis(self) -> None:
        for stage in ("identity", "destination", "write"):
            for error in (_ProviderError(429), _ProviderError(503), TimeoutError(PROVIDER_TEXT)):
                with self.subTest(stage=stage, error=type(error).__name__):
                    result = self._fail_at(stage, error)
                    self.assertEqual(result["code"], "verification_unavailable")

    def test_only_allowlisted_integer_http_statuses_are_exposed(self) -> None:
        for status in (True, "401", PROVIDER_TEXT, 99, 600, None):
            with self.subTest(status=status):
                result = self._fail_at("identity", _ProviderError(status))
                self.assertNotIn("http_status", result)
                self.assertEqual(result["code"], "verification_unavailable")

    def test_failure_cli_outputs_safe_json_and_actions_only_annotation(self) -> None:
        _FakeHfApi.failure_stage = "identity"
        _FakeHfApi.failure = _ProviderError(401)
        for in_actions in ("true", "false", ""):
            with self.subTest(in_actions=in_actions), patch.dict(
                os.environ, {"GITHUB_ACTIONS": in_actions},
            ):
                stdout, stderr = io.StringIO(), io.StringIO()
                with contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
                    code = preflight.main()
                self.assertEqual(code, 1)
                lines = stdout.getvalue().splitlines()
                self.assertEqual(len(lines), 2 if in_actions == "true" else 1)
                result = json.loads(lines[0])
                self.assertFalse(result["ready"])
                self.assertEqual(result["code"], "token_rejected")
                if in_actions == "true":
                    self.assertTrue(lines[1].startswith("::error "))
                    self.assertIn("identity/token_rejected", lines[1])
                    self.assertIn("401", lines[1])
                self.assertEqual(stderr.getvalue(), "")
                for sensitive in (TOKEN, "private-provider-body", "untrusted-command"):
                    self.assertNotIn(sensitive, stdout.getvalue())

    def test_success_cli_returns_zero_without_claiming_publication(self) -> None:
        with patch.dict(os.environ, {"GITHUB_ACTIONS": "true"}), contextlib.redirect_stdout(io.StringIO()) as out:
            self.assertEqual(preflight.main(), 0)
        self.assertEqual(len(out.getvalue().splitlines()), 1)
        self.assertTrue(json.loads(out.getvalue())["ready"])
        self.assertNotIn("::error", out.getvalue())

    def test_successful_preflight_cannot_turn_a_failed_real_publish_green(self) -> None:
        self.assertTrue(self._check()["ready"])
        with patch.dict(os.environ, {"GITHUB_ACTIONS": "true"}), contextlib.redirect_stdout(io.StringIO()) as out:
            with self.assertRaises(SystemExit) as caught:
                khipu.emit("readiness-test", {"synthetic_test": True})
        self.assertEqual(caught.exception.code, 1)
        self.assertIn('"published": false', out.getvalue())
        self.assertIn("::error title=readiness publish failed::", out.getvalue())
        self.assertEqual(_FakeHfApi.calls[-1][0], "upload")


class SecurityPreflightWorkflowTest(unittest.TestCase):
    def test_preflight_blocks_collection_with_the_publisher_credential(self) -> None:
        text = (ROOT / ".github/workflows/readiness-security.yml").read_text(encoding="utf-8")
        steps = re.split(r"(?m)^      - name: ", text)[1:]
        paths = [
            "-m unittest discover -s platform/agents/readiness/_lib",
            "pip install --no-cache-dir huggingface_hub==2.0.0",
            "python platform/agents/readiness/_lib/hf_publish_preflight.py",
            "python platform/agents/readiness/readiness-security/executor.py",
        ]
        indices = []
        selected = []
        for path in paths:
            matching = [(index, step) for index, step in enumerate(steps) if path in step]
            self.assertEqual(len(matching), 1, path)
            index, step = matching[0]
            indices.append(index)
            selected.append(step)
        self.assertEqual(indices, sorted(indices))
        self.assertEqual(len(set(indices)), 4)
        preflight_step, executor_step = selected[2:]
        self.assertRegex(preflight_step, r"(?m)^        timeout-minutes: 2$")
        self.assertRegex(preflight_step, rf"(?m)^        run: {re.escape(paths[2])}$")
        for step in (preflight_step, executor_step):
            self.assertRegex(step, r"(?m)^          HF_TOKEN: \$\{\{ secrets\.HF_TOKEN \}\}$")
        self.assertNotRegex(text, r"(?m)^\s*(?:if|continue-on-error):")


if __name__ == "__main__":
    unittest.main(verbosity=2)
