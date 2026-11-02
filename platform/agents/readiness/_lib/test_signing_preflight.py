"""Offline regressions for the readiness signing-authority preflight."""
from __future__ import annotations

import base64
import contextlib
import hashlib
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
SEED = bytes(range(32))
ENCODED_SEED = base64.b64encode(SEED).decode()
SENSITIVE_TEXT = "synthetic-private-signing-error"

sys.path.insert(0, str(LIB))
import signing_preflight as preflight  # noqa: E402
from test_khipu_publish import _fake_nacl  # noqa: E402


class SigningPreflightTest(unittest.TestCase):
    def setUp(self) -> None:
        nacl, signing = _fake_nacl()
        self.enterContext(patch.dict(sys.modules, {
            "nacl": nacl,
            "nacl.signing": signing,
        }))
        self.enterContext(patch.dict(os.environ, {
            preflight.SIGNER_ENV: ENCODED_SEED,
        }, clear=True))

    def _check(self) -> dict:
        result = preflight.check_signing_authority()
        self.assertIs(type(result["ready"]), bool)
        self.assertEqual(result["algorithm"], "ed25519")
        self.assertEqual(result["key_env"], preflight.SIGNER_ENV)
        self.assertLessEqual(set(result), {
            "ready", "stage", "code", "message", "algorithm", "key_env", "keyid",
        })
        rendered = json.dumps(result)
        self.assertNotIn(ENCODED_SEED, rendered)
        self.assertNotIn(SENSITIVE_TEXT, rendered)
        return result

    def test_import_requires_only_stdlib_and_never_loads_pynacl(self) -> None:
        completed = subprocess.run(
            [sys.executable, "-B", "-S", "-c",
             "import sys; sys.modules['nacl'] = None; import signing_preflight"],
            cwd=LIB, env={}, capture_output=True, text=True, timeout=30,
        )
        self.assertEqual(completed.returncode, 0, completed.stderr)
        self.assertEqual(completed.stdout, "")

    def test_missing_or_empty_key_fails_before_loading_crypto(self) -> None:
        for value in (None, "", " \t\r\n"):
            with self.subTest(value=value):
                env = {}
                if value is not None:
                    env[preflight.SIGNER_ENV] = value
                with patch.dict(os.environ, env, clear=True), patch.dict(
                    sys.modules, {"nacl": None, "nacl.signing": None},
                ):
                    result = self._check()
                self.assertEqual((result["stage"], result["code"]),
                                 ("credential", "missing_key"))
                self.assertFalse(result["ready"])

    def test_malformed_key_fails_without_loading_crypto(self) -> None:
        for value in ("not*base64", ENCODED_SEED + "\n", ENCODED_SEED + "\u200b"):
            with self.subTest(value=repr(value)), patch.dict(
                os.environ, {preflight.SIGNER_ENV: value}, clear=True,
            ), patch.dict(sys.modules, {"nacl": None, "nacl.signing": None}):
                result = self._check()
                self.assertEqual((result["stage"], result["code"]),
                                 ("credential", "malformed_key"))
                self.assertFalse(result["ready"])

    def test_decoded_seed_must_be_exactly_32_bytes(self) -> None:
        for length in (1, 31, 33, 64):
            with self.subTest(length=length), patch.dict(os.environ, {
                preflight.SIGNER_ENV: base64.b64encode(b"x" * length).decode(),
            }, clear=True):
                result = self._check()
                self.assertEqual((result["stage"], result["code"]),
                                 ("credential", "invalid_seed_length"))
                self.assertFalse(result["ready"])

    def test_missing_crypto_client_is_actionable(self) -> None:
        with patch.dict(sys.modules, {"nacl": None, "nacl.signing": None}):
            result = self._check()
        self.assertEqual((result["stage"], result["code"]),
                         ("client", "client_unavailable"))
        self.assertFalse(result["ready"])

    def test_crypto_failure_is_bounded_and_does_not_expose_exception(self) -> None:
        signing = types.ModuleType("nacl.signing")

        class BrokenSigningKey:
            def __init__(self, _seed: bytes) -> None:
                raise RuntimeError(SENSITIVE_TEXT)

        signing.SigningKey = BrokenSigningKey
        nacl = types.ModuleType("nacl")
        nacl.__path__ = []
        nacl.signing = signing
        with patch.dict(sys.modules, {"nacl": nacl, "nacl.signing": signing}):
            result = self._check()
        self.assertEqual((result["stage"], result["code"]),
                         ("signing", "signing_unavailable"))
        self.assertFalse(result["ready"])

    def test_success_signs_and_verifies_a_fixed_local_challenge(self) -> None:
        result = self._check()
        expected_public_key = hashlib.sha256(SEED).digest()
        self.assertTrue(result["ready"])
        self.assertEqual((result["stage"], result["code"]), ("complete", "ready"))
        self.assertEqual(result["keyid"], hashlib.sha256(expected_public_key).hexdigest()[:16])
        self.assertNotIn("signature", json.dumps(result).lower())

    def test_cli_emits_safe_actions_annotation_only_on_failure(self) -> None:
        with patch.dict(os.environ, {
            "GITHUB_ACTIONS": "true",
            preflight.SIGNER_ENV: "not*base64",
        }, clear=True), contextlib.redirect_stdout(io.StringIO()) as out:
            self.assertEqual(preflight.main(), 1)
        lines = out.getvalue().splitlines()
        self.assertEqual(len(lines), 2)
        self.assertEqual(json.loads(lines[0])["code"], "malformed_key")
        self.assertRegex(lines[1], r"^::error title=Readiness signing preflight failed::")
        self.assertNotIn("not*base64", out.getvalue())

        with patch.dict(os.environ, {
            "GITHUB_ACTIONS": "true",
            preflight.SIGNER_ENV: ENCODED_SEED,
        }, clear=True), contextlib.redirect_stdout(io.StringIO()) as out:
            self.assertEqual(preflight.main(), 0)
        self.assertEqual(len(out.getvalue().splitlines()), 1)
        self.assertTrue(json.loads(out.getvalue())["ready"])


class ReliabilityPreflightWorkflowTest(unittest.TestCase):
    def test_authority_checks_block_collection_and_use_the_executor_credentials(self) -> None:
        text = (ROOT / ".github/workflows/readiness-reliability.yml").read_text(encoding="utf-8")
        steps = re.split(r"(?m)^      - name: ", text)[1:]
        commands = [
            '-m unittest discover -s platform/agents/readiness/_lib',
            'pip install --no-cache-dir huggingface_hub==2.0.0 pynacl',
            'python platform/agents/readiness/_lib/signing_preflight.py',
            'python platform/agents/readiness/_lib/hf_publish_preflight.py',
            'python platform/agents/readiness/readiness-reliability/executor.py',
        ]
        selected = []
        indices = []
        for command in commands:
            matching = [(index, step) for index, step in enumerate(steps) if command in step]
            self.assertEqual(len(matching), 1, command)
            index, step = matching[0]
            indices.append(index)
            selected.append(step)
        self.assertEqual(indices, sorted(indices))
        self.assertEqual(len(set(indices)), len(commands))

        signing_step, publisher_step, executor_step = selected[2:]
        self.assertRegex(signing_step, r"(?m)^        timeout-minutes: 1$")
        self.assertRegex(publisher_step, r"(?m)^        timeout-minutes: 2$")
        self.assertRegex(signing_step,
                         r"(?m)^          KHIPU_SIGNING_KEY_B64: \$\{\{ secrets\.KHIPU_SIGNING_KEY_B64 \}\}$")
        self.assertRegex(publisher_step,
                         r"(?m)^          HF_TOKEN: \$\{\{ secrets\.HF_TOKEN \}\}$")
        for env_line in (
            "KHIPU_SIGNING_KEY_B64: ${{ secrets.KHIPU_SIGNING_KEY_B64 }}",
            "HF_TOKEN: ${{ secrets.HF_TOKEN }}",
        ):
            self.assertIn(env_line, executor_step)
        self.assertNotRegex(text, r"(?m)^\s*continue-on-error:")
        self.assertEqual(re.findall(r"(?m)^\s*if:.*$", text), ["        if: always()"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
