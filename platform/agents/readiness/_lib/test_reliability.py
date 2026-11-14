"""Method-aware reliability probe regressions; all network calls are mocked."""
from __future__ import annotations

import base64
import importlib.util
import json
import os
import unittest
from pathlib import Path
from unittest.mock import patch

EXECUTOR = Path(__file__).resolve().parent.parent / "readiness-reliability" / "executor.py"
SPEC = importlib.util.spec_from_file_location("readiness_reliability_under_test", EXECUTOR)
reliability = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(reliability)

ENVELOPE = {
    "payloadType": "application/vnd.szl.khipu+json",
    "payload": base64.b64encode(b"{}").decode(),
    "signatures": [{"keyid": "fixture", "sig": base64.b64encode(b"synthetic-signature").decode()}],
}


class FakeResponse:
    def __init__(self, body: object = b"", status: int = 200) -> None:
        self.body = body if isinstance(body, bytes) else json.dumps(body).encode()
        self.status = status

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    def read(self, limit: int = -1) -> bytes:
        return self.body if limit < 0 else self.body[:limit]


class RequestContractTest(unittest.TestCase):
    def test_health_and_metrics_remain_get_without_body(self) -> None:
        requests = []

        def open_request(req, timeout):
            requests.append((req, timeout))
            return FakeResponse({"ok": True})

        with patch.object(reliability._OPENER, "open", side_effect=open_request):
            for path in ("healthz", "metrics"):
                ok, _, _ = reliability._request(f"https://example.test/{path}")
                self.assertTrue(ok)
        self.assertEqual([req.get_method() for req, _ in requests], ["GET", "GET"])
        self.assertTrue(all(req.data is None for req, _ in requests))

    def test_sign_posts_exact_bounded_body_and_verify_posts_returned_envelope(self) -> None:
        requests = []

        def open_request(req, timeout):
            requests.append(req)
            if req.full_url.endswith("/khipu/sign"):
                return FakeResponse({"envelope": ENVELOPE, "dsse": ENVELOPE})
            return FakeResponse({"verified": True})

        with patch.object(reliability._OPENER, "open", side_effect=open_request):
            result = reliability._probe_sign_verify("https://example.test", "fixture-token")
        self.assertTrue(result["khipu_sign"][0])
        self.assertTrue(result["khipu_verify"][0])
        self.assertEqual([req.get_method() for req in requests], ["POST", "POST"])
        self.assertEqual(requests[0].data, reliability.PROBE_BYTES)
        self.assertEqual(json.loads(requests[1].data), ENVELOPE)
        self.assertEqual(requests[0].get_header("Authorization"), "Bearer fixture-token")
        self.assertIsNone(requests[1].get_header("Authorization"))
        self.assertLess(len(reliability.PROBE_BYTES), 1024)

    def test_direct_and_matching_wrapped_envelopes_are_accepted(self) -> None:
        for body in (ENVELOPE, {"envelope": ENVELOPE}, {"dsse": ENVELOPE},
                     {"envelope": ENVELOPE, "dsse": ENVELOPE}):
            with self.subTest(body=body):
                raw = json.dumps(body).encode()
                self.assertEqual(reliability._extract_signed_envelope(raw), ENVELOPE)

    def test_ambiguous_malformed_unsigned_or_oversized_sign_response_fails_closed(self) -> None:
        other = {**ENVELOPE, "payload": base64.b64encode(b"different").decode()}
        bad = [
            b"not json",
            json.dumps({"envelope": ENVELOPE, "dsse": other}).encode(),
            json.dumps({**ENVELOPE, "payload": "***"}).encode(),
            json.dumps({**ENVELOPE, "signatures": []}).encode(),
            json.dumps({**ENVELOPE, "signatures": [{"sig": ""}]}).encode(),
        ]
        for raw in bad:
            with self.subTest(raw=raw):
                self.assertIsNone(reliability._extract_signed_envelope(raw))

        with patch.object(reliability._OPENER, "open",
                          return_value=FakeResponse(b"x" * (reliability.MAX_RESPONSE_BYTES + 1))):
            ok, _, raw = reliability._request("https://example.test/oversized")
        self.assertFalse(ok)
        self.assertIsNone(raw)

    def test_verify_requires_literal_boolean_true(self) -> None:
        for claim in (False, "true", 1, None):
            with self.subTest(claim=claim):
                responses = [FakeResponse({"envelope": ENVELOPE}), FakeResponse({"verified": claim})]
                with patch.object(reliability._OPENER, "open", side_effect=responses):
                    result = reliability._probe_sign_verify("https://example.test")
                self.assertTrue(result["khipu_sign"][0])
                self.assertFalse(result["khipu_verify"][0])

    def test_verify_is_not_attempted_after_failed_or_invalid_sign(self) -> None:
        for response in (FakeResponse({"error": "denied"}, status=401),
                         FakeResponse({"envelope": {"signatures": []}})):
            with self.subTest(status=response.status):
                calls = []

                def open_request(req, timeout):
                    calls.append(req)
                    return response

                with patch.object(reliability._OPENER, "open", side_effect=open_request):
                    result = reliability._probe_sign_verify("https://example.test", "secret")
                self.assertEqual(len(calls), 1)
                self.assertFalse(result["khipu_sign"][0])
                self.assertEqual(result["khipu_verify"], (False, None, False))
                self.assertNotIn("secret", repr(result))

    def test_network_error_is_a_bounded_failure(self) -> None:
        with patch.object(reliability._OPENER, "open", side_effect=OSError("private detail")):
            ok, latency, raw = reliability._request("https://example.test/healthz")
        self.assertFalse(ok)
        self.assertGreaterEqual(latency, 0.0)
        self.assertIsNone(raw)

    def test_redirect_handler_rejects_every_redirect(self) -> None:
        handler = reliability._NoRedirect()
        self.assertIsNone(handler.redirect_request(None, None, 302, "moved", {}, "https://evil.test/"))


class CredentialScopeTest(unittest.TestCase):
    def test_bearer_is_available_only_for_trusted_a11oy_origins(self) -> None:
        with patch.dict(os.environ, {"READINESS_OPERATOR_TOKEN": "fixture-token"}, clear=True):
            for base in ("https://a-11-oy.com", "https://szlholdings-a11oy.hf.space/path"):
                self.assertEqual(reliability._trusted_a11oy_token("a11oy", base), "fixture-token")
            for name, base in (
                ("sentra", "https://szlholdings-a11oy.hf.space"),
                ("a11oy", "https://evil.test"),
                ("a11oy", "http://a-11-oy.com"),
                ("a11oy", "https://user@a-11-oy.com"),
                ("a11oy", "https://a-11-oy.com:444"),
            ):
                with self.subTest(name=name, base=base):
                    self.assertIsNone(reliability._trusted_a11oy_token(name, base))

    def test_malformed_token_is_not_used(self) -> None:
        for token in ("", "with space", "line\nbreak", "\x7f"):
            with self.subTest(token=token), \
                    patch.dict(os.environ, {"READINESS_OPERATOR_TOKEN": token}, clear=True):
                self.assertIsNone(reliability._trusted_a11oy_token("a11oy", "https://a-11-oy.com"))


class SamplingTest(unittest.TestCase):
    def test_one_iteration_preserves_four_result_rows_and_fail_closed_verdict(self) -> None:
        get_samples = [(True, 10.0, b"ok"), (True, 20.0, b"metrics")]
        signed = {
            "khipu_sign": (True, 30.0, True),
            "khipu_verify": (False, 40.0, True),
        }
        with patch.object(reliability, "WINDOW_SECONDS", 1), \
                patch.object(reliability.time, "time", side_effect=[0.0, 0.0, 2.0]), \
                patch.object(reliability.time, "sleep"), \
                patch.object(reliability, "_request", side_effect=get_samples), \
                patch.object(reliability, "_probe_sign_verify", return_value=signed):
            result = reliability.probe_flagship("https://example.test", flagship="sentra")
        self.assertEqual(set(result), {"healthz", "khipu_sign", "khipu_verify", "metrics"})
        self.assertTrue(all(row["samples"] == 1 for row in result.values()))
        self.assertEqual(result["khipu_verify"]["success_rate"], 0.0)
        self.assertEqual(reliability.verdict(result), "RED")

    def test_unattempted_verify_has_null_latency_and_zero_success(self) -> None:
        get_samples = [(True, 10.0, b"ok"), (True, 20.0, b"metrics")]
        unsigned = {
            "khipu_sign": (False, 30.0, True),
            "khipu_verify": (False, None, False),
        }
        with patch.object(reliability, "WINDOW_SECONDS", 1), \
                patch.object(reliability.time, "time", side_effect=[0.0, 0.0, 2.0]), \
                patch.object(reliability.time, "sleep"), \
                patch.object(reliability, "_request", side_effect=get_samples), \
                patch.object(reliability, "_probe_sign_verify", return_value=unsigned):
            result = reliability.probe_flagship("https://example.test")
        self.assertEqual(result["khipu_verify"]["attempts"], 0)
        self.assertIsNone(result["khipu_verify"]["p99_ms"])
        self.assertEqual(result["khipu_verify"]["success_rate"], 0.0)


if __name__ == "__main__":
    unittest.main(verbosity=2)
