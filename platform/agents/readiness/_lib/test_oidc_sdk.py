"""Pinned Hub OIDC integration contracts with every provider operation mocked."""
from __future__ import annotations

import base64
import importlib.metadata
import os
from pathlib import Path
import sys
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parent))
import khipu
from test_khipu_publish import _fake_nacl


class PinnedOidcSdkTest(unittest.TestCase):
    def setUp(self) -> None:
        try:
            version = importlib.metadata.version("huggingface_hub")
        except importlib.metadata.PackageNotFoundError:
            raise unittest.SkipTest("requires the pinned huggingface_hub==2.0.0 contract dependency")
        if version != "2.0.0":
            raise unittest.SkipTest("requires the pinned huggingface_hub==2.0.0 contract dependency")

    def _publish(self, exchange_result):
        import huggingface_hub as hub
        from huggingface_hub import _oidc, constants
        from huggingface_hub.utils import _auth, _headers

        env = {
            "GITHUB_ACTIONS": "true",
            "HF_OIDC_RESOURCE": "datasets/SZLHOLDINGS/readiness-runs",
            "ACTIONS_ID_TOKEN_REQUEST_URL": "https://example.invalid/oidc",
            "ACTIONS_ID_TOKEN_REQUEST_TOKEN": "synthetic-request-grant",
            "KHIPU_SIGNING_KEY_B64": base64.b64encode(os.urandom(32)).decode(),
        }
        nacl, signing = _fake_nacl()
        api_class = hub.HfApi
        selected_tokens = []

        def upload(api, **kwargs):
            # Run the real SDK header token selector with the actual client token.
            selected_tokens.append(_headers.get_token_to_send(api.token))
            self.assertEqual(kwargs["repo_id"], khipu.HF_DATASET)
            self.assertEqual(kwargs["repo_type"], "dataset")

        with patch.dict(os.environ, env, clear=True), \
                patch.dict(sys.modules, {"nacl": nacl, "nacl.signing": signing}), \
                patch("socket.socket.connect", side_effect=AssertionError("network forbidden")), \
                patch.object(constants, "HF_HUB_DISABLE_IMPLICIT_TOKEN", True), \
                patch.object(_oidc, "get_oidc_token", return_value="synthetic-subject") as mint, \
                patch.object(_oidc, "exchange_oidc_token") as exchange, \
                patch.object(_headers, "get_token", side_effect=AssertionError("generic discovery forbidden")) as discovery, \
                patch.object(_auth, "_get_token_from_environment") as environment, \
                patch.object(_auth, "_get_token_from_file_refreshed") as stored, \
                patch.object(_auth, "_get_token_from_google_colab") as colab, \
                patch.object(api_class, "upload_file", autospec=True, side_effect=upload) as uploader, \
                patch.object(hub, "HfApi", wraps=api_class) as client:
            if isinstance(exchange_result, Exception):
                exchange.side_effect = exchange_result
            else:
                exchange.return_value = exchange_result
            envelope = khipu.sign_khipu_receipt("readiness-test", {"ok": True})
            result = khipu.publish_to_hf("readiness-test", envelope)
            mint.assert_called_once_with(provider="github", audience=constants.ENDPOINT)
            exchange.assert_called_once_with(
                subject_token="synthetic-subject", resource=env["HF_OIDC_RESOURCE"],
                endpoint=constants.ENDPOINT,
            )
            discovery.assert_not_called()
            environment.assert_not_called()
            stored.assert_not_called()
            colab.assert_not_called()
        return result, client, uploader, selected_tokens

    def test_valid_exchange_uses_explicit_token_without_discovery(self) -> None:
        result, client, uploader, tokens = self._publish({"access_token": "synthetic-access-grant"})
        self.assertTrue(result["published"])
        client.assert_called_once_with(token="synthetic-access-grant")
        self.assertEqual(uploader.call_count, 1)
        self.assertEqual(tokens, ["synthetic-access-grant"])

    def test_empty_or_non_string_exchange_token_cannot_fall_back(self) -> None:
        class TokenSubclass(str):
            pass

        for token in ("", None, False, 1, [], " ", "grant\n", "grant\x00", "grant\x7f", TokenSubclass("grant")):
            with self.subTest(token_type=type(token).__name__):
                result, client, uploader, tokens = self._publish({"access_token": token})
                self.assertFalse(result["published"])
                self.assertEqual(result["reason"], "OIDC access token unavailable")
                client.assert_not_called()
                uploader.assert_not_called()
                self.assertEqual(tokens, [])

    def test_malformed_exchange_response_cannot_fall_back(self) -> None:
        class ResponseSubclass(dict):
            def get(self, key):
                raise AssertionError("response subclasses must not be interpreted")

        for response in (None, [], "synthetic-response", {}, ResponseSubclass(access_token="grant")):
            with self.subTest(response_type=type(response).__name__):
                result, client, uploader, tokens = self._publish(response)
                self.assertFalse(result["published"])
                self.assertEqual(result["reason"], "OIDC access token unavailable")
                client.assert_not_called()
                uploader.assert_not_called()
                self.assertEqual(tokens, [])

    def test_exchange_denial_is_bounded_and_cannot_fall_back(self) -> None:
        result, client, uploader, tokens = self._publish(RuntimeError("synthetic private denial\n::notice::injected"))
        self.assertFalse(result["published"])
        self.assertEqual(result["reason"], "publisher unavailable")
        client.assert_not_called()
        uploader.assert_not_called()
        self.assertEqual(tokens, [])
