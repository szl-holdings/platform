import pytest

from sentra_core.policy_gate import (
    PolicyDeniedError,
    PolicyGate,
)


class FakeResp:
    def __init__(self, payload, status=200):
        self._payload = payload
        self.status_code = status
        self.content = b"x"

    def raise_for_status(self):
        if self.status_code >= 400:
            raise RuntimeError(f"http {self.status_code}")

    def json(self):
        return self._payload


def _patch_httpx(monkeypatch, response=None, raise_exc=None):
    import sentra_core.policy_gate as pg
    import types

    fake = types.SimpleNamespace()

    def post(url, **kw):
        if raise_exc:
            raise raise_exc
        return response

    fake.post = post
    monkeypatch.setattr(pg, "httpx", fake, raising=False)
    # Ensure import inside evaluate resolves the patched module
    import sys
    sys.modules["httpx"] = fake


def test_allow_decision(monkeypatch):
    _patch_httpx(monkeypatch, response=FakeResp({"decision": "allow", "reason": "ok"}))
    gate = PolicyGate(runtime_url="http://x/api")
    d = gate.evaluate("sentra.evidence.publish", {"pack_id": "p"})
    assert d.allow
    assert d.reason == "ok"


def test_deny_raises_in_guard(monkeypatch):
    _patch_httpx(monkeypatch, response=FakeResp({"decision": "deny", "reason": "no"}))
    gate = PolicyGate(runtime_url="http://x/api")
    with pytest.raises(PolicyDeniedError) as ei:
        gate.guard("sentra.incident.escalate", {})
    assert ei.value.decision.allow is False
    assert ei.value.decision.reason == "no"


def test_transport_error_fail_closed(monkeypatch):
    _patch_httpx(monkeypatch, raise_exc=RuntimeError("boom"))
    gate = PolicyGate(runtime_url="http://x/api", fail_mode="closed")
    d = gate.evaluate("a", {})
    assert d.allow is False
    assert d.reason and d.reason.startswith("transport_error")


def test_transport_error_fail_open(monkeypatch):
    _patch_httpx(monkeypatch, raise_exc=RuntimeError("boom"))
    gate = PolicyGate(runtime_url="http://x/api", fail_mode="open")
    d = gate.evaluate("a", {})
    assert d.allow is True


def test_bearer_token_header(monkeypatch):
    captured = {}

    class Resp(FakeResp):
        pass

    def post(url, **kw):
        captured["headers"] = kw.get("headers")
        return Resp({"decision": "allow"})

    import types, sys
    fake = types.SimpleNamespace(post=post)
    import sentra_core.policy_gate as pg
    monkeypatch.setattr(pg, "httpx", fake, raising=False)
    sys.modules["httpx"] = fake

    gate = PolicyGate(runtime_url="http://x/api", api_token="t0k")
    gate.evaluate("a", {})
    assert captured["headers"]["authorization"] == "Bearer t0k"


def test_legacy_allow_bool(monkeypatch):
    _patch_httpx(monkeypatch, response=FakeResp({"allow": True}))
    gate = PolicyGate(runtime_url="http://x/api")
    assert gate.evaluate("a", {}).allow is True
