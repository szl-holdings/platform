#!/usr/bin/env python3
"""test_vllm_backend_config.py — endpoint configuration for vllm_backend.py (no network).

Proves the serving endpoints are configured, not hard-coded, and fail closed:
  (a) no hard-coded tailnet address remains in vllm_backend.py
  (b) unset endpoints mean "not configured": no probe runs, router fallback
  (c) https endpoints and loopback http endpoints are accepted
  (d) plaintext http to a private/tailnet address needs SZL_ALLOW_INSECURE_LAN=1
  (e) plaintext http to a public address or hostname is refused even with the opt-in
  (f) credentials in the URL and unsupported schemes are refused
  (g) a configured endpoint is what select_backend hands to the daemon

Prints: ok:true checks:N
"""
from __future__ import annotations
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import vllm_backend as vb  # noqa: E402

checks = 0


def ok(name: str) -> None:
    global checks
    checks += 1
    print(f"  ok  {name}")


def refused(url: str, environ: dict) -> bool:
    try:
        vb.endpoint_from_env(vb.VLLM_ENDPOINT_ENV, environ={vb.VLLM_ENDPOINT_ENV: url, **environ})
    except ValueError:
        return True
    return False


def test_no_hard_coded_tailnet_address():
    with open(vb.__file__, encoding="utf-8") as fh:
        assert "100.125.77.31" not in fh.read()
    ok("no hard-coded 100.125.77.31 in vllm_backend.py")


def test_unset_endpoints_are_not_configured_and_never_probed():
    assert vb.endpoint_from_env(vb.VLLM_ENDPOINT_ENV, environ={}) is None
    calls = []
    choice = vb.select_backend(environ={},
                               vllm_probe=lambda: calls.append("vllm") or True,
                               ollama_probe=lambda: calls.append("ollama") or True)
    assert calls == []
    assert choice.backend == "router-fallback"
    assert choice.endpoint is None and choice.sovereign is False
    assert vb.probe_vllm_health(None) is False and vb.probe_ollama(None) is False
    ok("unset endpoints: no probe, router fallback, not sovereign")


def test_https_and_loopback_are_accepted():
    for url in ("https://gpu.example.internal/v1", "http://127.0.0.1:8000/v1",
                "http://localhost:11434/v1", "http://[::1]:8000/v1/"):
        got = vb.endpoint_from_env(vb.VLLM_ENDPOINT_ENV, environ={vb.VLLM_ENDPOINT_ENV: url})
        assert got == url.rstrip("/"), (url, got)
    ok("https and loopback http endpoints accepted")


def test_private_plaintext_needs_the_explicit_opt_in():
    url = "http://100.70.130.45:8000/v1"
    assert refused(url, {})
    assert not refused(url, {vb.INSECURE_LAN_ENV: "1"})
    assert not refused("http://192.168.1.20:11434/v1", {vb.INSECURE_LAN_ENV: "1"})
    assert refused(url, {vb.INSECURE_LAN_ENV: "true"})
    ok("plaintext tailnet/LAN http requires SZL_ALLOW_INSECURE_LAN=1")


def test_public_plaintext_is_refused_even_with_the_opt_in():
    lan = {vb.INSECURE_LAN_ENV: "1"}
    for url in ("http://8.8.8.8/v1", "http://example.com/v1", "http://gpu.ts.net/v1"):
        assert refused(url, lan), url
    ok("plaintext http to public addresses or hostnames refused")


def test_credentials_and_unsupported_schemes_are_refused():
    for url in ("https://user:pass@gpu.example.internal/v1", "ftp://127.0.0.1/v1",
                "127.0.0.1:8000/v1", "https:///v1"):
        assert refused(url, {}), url
    ok("credentials in URL and unsupported schemes refused")


def test_configured_endpoint_is_handed_to_the_daemon():
    env = {vb.VLLM_ENDPOINT_ENV: "http://127.0.0.1:8000/v1",
           vb.OLLAMA_ENDPOINT_ENV: "http://127.0.0.1:11434/v1"}
    choice = vb.select_backend(environ=env, vllm_probe=lambda: True, ollama_probe=lambda: True)
    assert choice.backend == "vllm" and choice.endpoint == "http://127.0.0.1:8000/v1"
    fallback = vb.select_backend(environ=env, vllm_probe=lambda: False, ollama_probe=lambda: True)
    assert fallback.backend == "ollama" and fallback.endpoint == "http://127.0.0.1:11434/v1"
    try:
        vb.select_backend(environ={vb.VLLM_ENDPOINT_ENV: "http://8.8.8.8/v1"},
                          vllm_probe=lambda: True, ollama_probe=lambda: True)
    except ValueError:
        pass
    else:
        raise AssertionError("an invalid configured endpoint must fail closed")
    ok("configured endpoints reach the daemon; invalid configuration raises")


if __name__ == "__main__":
    for name, fn in sorted(globals().items()):
        if name.startswith("test_") and callable(fn):
            fn()
    print(f"\nok:true checks:{checks}")
    sys.exit(0)
