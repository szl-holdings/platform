"""Offline tests for the fail-closed reliability probe contract."""

from __future__ import annotations

import importlib.util
import json
from pathlib import Path
import sys
import unittest
from unittest import mock


_EXECUTOR = Path(__file__).resolve().parents[1] / "readiness-reliability" / "executor.py"
_SPEC = importlib.util.spec_from_file_location("readiness_reliability_executor", _EXECUTOR)
assert _SPEC and _SPEC.loader
MODULE = importlib.util.module_from_spec(_SPEC)
sys.modules[_SPEC.name] = MODULE
_SPEC.loader.exec_module(MODULE)

A11OY = {"name": "a11oy", "endpoints": {}}


class _Response:
    def __init__(self, body: bytes, content_type: str, status: int = 200) -> None:
        self._body = body
        self.headers = {"Content-Type": content_type}
        self.status = status

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    def read(self, limit: int) -> bytes:
        return self._body[:limit]


class ReliabilityContractTests(unittest.TestCase):
    def test_html_soft_fallback_cannot_satisfy_json_contract(self) -> None:
        response = _Response(b"<html>app shell</html>", "text/html")
        with mock.patch.object(MODULE.urllib.request, "urlopen", return_value=response):
            ok, _ms, body = MODULE._request(
                "https://example.test/api/a11oy/healthz",
                method="GET",
                validator="governed_health",
                flagship=A11OY,
            )
        self.assertFalse(ok)
        self.assertIsNone(body)

    def test_governed_health_requires_exact_identity_and_doctrine(self) -> None:
        self.assertTrue(MODULE._valid_json(
            "governed_health",
            {"status": "ok", "flagship": "a11oy", "doctrine": "v11"},
            A11OY,
        ))
        self.assertFalse(MODULE._valid_json(
            "governed_health",
            {"status": "ok", "service": "other", "doctrine": "v11"},
            A11OY,
        ))
        self.assertFalse(MODULE._valid_json(
            "governed_health",
            {"status": "ok", "flagship": "a11oy", "doctrine": "v10"},
            A11OY,
        ))

    def test_sign_probe_is_namespaced_post_with_synthetic_json(self) -> None:
        signed = {
            "space": "a11oy",
            "digest": "a" * 64,
            "signed": True,
            "dsse": {"signed": True, "signatures": [{"sig": "bounded-test"}]},
        }
        response = _Response(json.dumps(signed).encode(), "application/json")

        def open_request(request, timeout):
            self.assertEqual(request.get_method(), "POST")
            self.assertTrue(request.full_url.endswith("/api/a11oy/khipu/sign"))
            submitted = json.loads(request.data)
            self.assertTrue(submitted["receipt"]["synthetic"])
            self.assertEqual(timeout, 5.0)
            return response

        with mock.patch.object(MODULE.urllib.request, "urlopen", side_effect=open_request):
            ok, _ms, body = MODULE._request(
                "https://example.test/api/a11oy/khipu/sign",
                method="POST",
                validator="khipu_sign",
                flagship=A11OY,
                body={"receipt": {"synthetic": True}},
            )
        self.assertTrue(ok)
        self.assertEqual(body, signed)
        self.assertFalse(MODULE._valid_json(
            "khipu_sign", dict(signed, signed=False), A11OY,
        ))

    def test_verify_and_legacy_health_are_fail_closed(self) -> None:
        self.assertTrue(MODULE._valid_json(
            "khipu_verify",
            {"space": "a11oy", "verified": True, "verify_receipt_signed": True},
            A11OY,
        ))
        self.assertFalse(MODULE._valid_json(
            "khipu_verify",
            {"space": "a11oy", "verified": False, "verify_receipt_signed": True},
            A11OY,
        ))
        self.assertFalse(MODULE._valid_json(
            "production_health",
            {"status": "ok", "production_ready": False},
            {"name": "sentra"},
        ))

    def test_prometheus_validator_rejects_html(self) -> None:
        self.assertTrue(MODULE._valid_prometheus(
            b"# HELP szl_up readiness\n# TYPE szl_up gauge\nszl_up 1\n",
            "text/plain; version=0.0.4",
        ))
        self.assertFalse(MODULE._valid_prometheus(b"<html>shell</html>", "text/html"))


if __name__ == "__main__":
    unittest.main()
