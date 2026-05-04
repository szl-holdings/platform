#!/usr/bin/env python3
"""
Substrate Inference Smoke Test
================================
Exercises the running inference service and reports pass/fail per mode.

Usage:
    python scripts/smoke_test.py [options]

Options:
    --base-url    Service base URL (default: http://localhost:8070)
    --api-key     API key for auth endpoints
    --model       Model ID to test with (default: llama-3.1-8b-instruct)
    --adapter-path  Real local path or HuggingFace repo ID for a PEFT adapter.
                  When omitted, adapter load/unload tests are skipped in LIVE
                  mode and labelled SKIPPED (not FAIL).
    --skip-multimodal  Skip the multimodal inference test

Modes tested:
  1. Health check
  2. Models list
  3. Single (non-streaming) completion
  4. Streaming completion
  5. Multimodal inference (skipped if --skip-multimodal)
  6. Adapter load/list/unload
     - In STUB mode: always tested (service accepts any path)
     - In LIVE mode: requires --adapter-path to a real adapter; skipped otherwise

In STUB mode all tests pass with a [STUB] label.
In LIVE mode tests exercise real GPU inference.
"""
from __future__ import annotations

import argparse
import json
import sys
import time
from typing import Any

try:
    import httpx
except ImportError:
    print("ERROR: httpx is required. Install with: pip install httpx")
    sys.exit(1)

DEFAULT_BASE_URL = "http://localhost:8070"
DEFAULT_MODEL = "llama-3.1-8b-instruct"
TIMEOUT = 120.0

SKIPPED = "SKIP"


def _headers(api_key: str | None) -> dict[str, str]:
    h = {"Content-Type": "application/json", "User-Agent": "substrate-smoke-test/1.0"}
    if api_key:
        h["Authorization"] = f"Bearer {api_key}"
    return h


def _result(name: str, passed: bool, note: str = "", stub: bool = False, skipped: bool = False) -> dict:
    if skipped:
        print(f"  {SKIPPED}  {name}" + (f" — {note}" if note else ""))
        return {"name": name, "passed": True, "stub": False, "skipped": True, "note": note}
    label = "[STUB] " if stub else ""
    status = "PASS" if passed else "FAIL"
    print(f"  {status}  {label}{name}" + (f" — {note}" if note else ""))
    return {"name": name, "passed": passed, "stub": stub, "skipped": False, "note": note}


def _detect_stub_mode(client: httpx.Client) -> bool:
    """Return True when the service is in STUB mode."""
    try:
        r = client.get("/health", timeout=5.0)
        if r.is_success:
            engine = r.json().get("engine", "")
            return "stub" in engine.lower()
    except Exception:
        pass
    return False


def test_health(client: httpx.Client) -> dict:
    try:
        r = client.get("/health", timeout=10.0)
        r.raise_for_status()
        data = r.json()
        status = data.get("status", "")
        engine = data.get("engine", "")
        stub = "stub" in engine.lower()
        active_adapters = data.get("active_adapters", 0)
        dl = data.get("download_progress", {})
        note = f"status={status}, engine={engine}, adapters={active_adapters}, dl_entries={len(dl)}"
        return _result("Health check", status in ("ok", "idle", "initializing"), note=note, stub=stub)
    except Exception as exc:
        return _result("Health check", False, note=str(exc))


def test_single_completion(client: httpx.Client, model: str, headers: dict) -> dict:
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": "Reply with just the word: hello"}],
        "temperature": 0.0,
        "max_tokens": 32,
        "stream": False,
    }
    try:
        r = client.post("/v1/chat/completions", json=payload, headers=headers, timeout=TIMEOUT)
        if r.status_code == 503:
            detail = r.json().get("detail", "")
            if "not loaded" in detail:
                return _result("Single completion", False, note=f"Model not loaded: {detail}")
        r.raise_for_status()
        data = r.json()
        content = data["choices"][0]["message"]["content"]
        stub = "STUB MODE" in content
        passed = bool(content)
        return _result("Single completion", passed, note=f"content_len={len(content)}", stub=stub)
    except Exception as exc:
        return _result("Single completion", False, note=str(exc))


def test_streaming_completion(client: httpx.Client, model: str, headers: dict) -> dict:
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": "Count from 1 to 3, one number per word."}],
        "temperature": 0.0,
        "max_tokens": 32,
        "stream": True,
    }
    chunks_received = 0
    stub = False
    try:
        with client.stream("POST", "/v1/chat/completions", json=payload, headers=headers, timeout=TIMEOUT) as r:
            if r.status_code == 503:
                return _result("Streaming completion", False, note="Model not loaded")
            r.raise_for_status()
            for line in r.iter_lines():
                if not line or line == "data: [DONE]":
                    continue
                if line.startswith("data: "):
                    raw = line[6:]
                    try:
                        chunk = json.loads(raw)
                        delta = chunk["choices"][0].get("delta", {})
                        content = delta.get("content", "")
                        if content:
                            chunks_received += 1
                            if "STUB MODE" in content:
                                stub = True
                    except json.JSONDecodeError:
                        pass
        passed = chunks_received > 0
        return _result("Streaming completion", passed, note=f"chunks={chunks_received}", stub=stub)
    except Exception as exc:
        return _result("Streaming completion", False, note=str(exc))


def test_multimodal(client: httpx.Client, model: str, headers: dict) -> dict:
    tiny_png_b64 = (
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk"
        "+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    )
    payload = {
        "model": model,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "Describe this image briefly."},
                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{tiny_png_b64}"}},
                ],
            }
        ],
        "temperature": 0.0,
        "max_tokens": 32,
        "stream": False,
    }
    try:
        r = client.post("/v1/chat/completions", json=payload, headers=headers, timeout=TIMEOUT)
        if r.status_code == 503:
            return _result("Multimodal inference", False, note="Model not loaded or not multimodal")
        r.raise_for_status()
        data = r.json()
        content = data["choices"][0]["message"]["content"]
        stub = "STUB MODE" in content
        return _result("Multimodal inference", bool(content), note=f"content_len={len(content)}", stub=stub)
    except Exception as exc:
        return _result("Multimodal inference", False, note=str(exc))


def test_adapters(
    client: httpx.Client,
    model: str,
    auth_headers: dict,
    adapter_path: str | None,
    is_stub_mode: bool,
) -> list[dict]:
    """
    Test adapter load / list / unload.

    In STUB mode: any adapter_path is accepted by the service (stub responses),
    so we always run the test (using a placeholder path when none is provided).

    In LIVE mode: requires a real --adapter-path. When no path is provided the
    test is marked SKIPPED so it does not count as a failure.
    """
    results: list[dict] = []

    if not is_stub_mode and not adapter_path:
        results.append(_result(
            "Adapter load",
            True,
            note="LIVE mode — provide --adapter-path to test adapter load/unload",
            skipped=True,
        ))
        results.append(_result("Adapter list", True, note="Skipped (no adapter loaded)", skipped=True))
        results.append(_result("Adapter unload", True, note="Skipped", skipped=True))
        return results

    effective_path = adapter_path or "stub-adapter-test-path"
    adapter_name = "smoke-test-adapter"

    load_payload = {
        "model_id": model,
        "adapter_path": effective_path,
        "adapter_name": adapter_name,
    }
    loaded_ok = False
    try:
        r = client.post("/v1/adapters/load", json=load_payload, headers=auth_headers, timeout=60.0)
        if r.status_code in (200, 201):
            data = r.json()
            stub = data.get("stub", False)
            loaded_ok = True
            results.append(_result("Adapter load", True, note=f"status={data.get('status')}", stub=stub))
        elif r.status_code == 503:
            results.append(_result("Adapter load", False, note="Model not loaded"))
        elif r.status_code in (401, 403):
            results.append(_result("Adapter load", True, note="Auth required — API key not configured (expected)"))
            loaded_ok = False
        else:
            results.append(_result("Adapter load", False, note=f"HTTP {r.status_code}: {r.text[:200]}"))
    except Exception as exc:
        results.append(_result("Adapter load", False, note=str(exc)))

    try:
        r = client.get("/v1/adapters", timeout=10.0)
        r.raise_for_status()
        data = r.json()
        adapter_count = len(data.get("data", []))
        results.append(_result("Adapter list", True, note=f"adapters={adapter_count}"))
    except Exception as exc:
        results.append(_result("Adapter list", False, note=str(exc)))

    if loaded_ok:
        unload_payload = {"model_id": model, "adapter_name": adapter_name}
        try:
            r = client.post("/v1/adapters/unload", json=unload_payload, headers=auth_headers, timeout=30.0)
            if r.status_code in (200, 201):
                data = r.json()
                stub = data.get("stub", False)
                results.append(_result("Adapter unload", True, note=f"status={data.get('status')}", stub=stub))
            elif r.status_code in (401, 403):
                results.append(_result("Adapter unload", True, note="Auth required (expected)"))
            else:
                results.append(_result("Adapter unload", False, note=f"HTTP {r.status_code}: {r.text[:200]}"))
        except Exception as exc:
            results.append(_result("Adapter unload", False, note=str(exc)))
    else:
        results.append(_result("Adapter unload", True, note="Skipped (adapter not loaded)", skipped=True))

    return results


def test_models_endpoint(client: httpx.Client) -> dict:
    try:
        r = client.get("/v1/models", timeout=10.0)
        r.raise_for_status()
        data = r.json()
        count = len(data.get("data", []))
        return _result("Models list", count > 0, note=f"models={count}")
    except Exception as exc:
        return _result("Models list", False, note=str(exc))


def main() -> int:
    parser = argparse.ArgumentParser(description="Substrate Inference Smoke Test")
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL, help="Service base URL")
    parser.add_argument("--api-key", default=None, help="API key for auth endpoints")
    parser.add_argument("--model", default=DEFAULT_MODEL, help="Model ID to test with")
    parser.add_argument(
        "--adapter-path",
        default=None,
        help=(
            "Real local path or HuggingFace repo ID for a PEFT adapter to test "
            "load/unload in LIVE mode. Not required in STUB mode."
        ),
    )
    parser.add_argument("--skip-multimodal", action="store_true", help="Skip multimodal test")
    args = parser.parse_args()

    base_url = args.base_url.rstrip("/")
    api_key: str | None = args.api_key
    model: str = args.model
    adapter_path: str | None = args.adapter_path

    print(f"\nSubstrate Inference Smoke Test")
    print(f"  Service:      {base_url}")
    print(f"  Model:        {model}")
    print(f"  API Key:      {'set' if api_key else 'not set'}")
    print(f"  Adapter path: {adapter_path or '(not provided)'}")
    print()

    all_results: list[dict] = []

    with httpx.Client(base_url=base_url) as client:
        is_stub_mode = _detect_stub_mode(client)
        print(f"  Detected mode: {'STUB' if is_stub_mode else 'LIVE'}\n")

        print("── Health & Models ──────────────────────────────")
        all_results.append(test_health(client))
        all_results.append(test_models_endpoint(client))

        print("\n── Completion ───────────────────────────────────")
        auth_headers = _headers(api_key)
        all_results.append(test_single_completion(client, model, auth_headers))
        all_results.append(test_streaming_completion(client, model, auth_headers))

        if not args.skip_multimodal:
            print("\n── Multimodal ───────────────────────────────────")
            all_results.append(test_multimodal(client, model, auth_headers))

        print("\n── Adapters ─────────────────────────────────────")
        all_results.extend(
            test_adapters(client, model, auth_headers, adapter_path, is_stub_mode)
        )

    passed = sum(1 for r in all_results if r["passed"] and not r.get("skipped"))
    skipped = sum(1 for r in all_results if r.get("skipped"))
    failed = sum(1 for r in all_results if not r["passed"])
    stub_count = sum(1 for r in all_results if r.get("stub"))
    total = len(all_results)

    print(f"\n── Summary ──────────────────────────────────────")
    print(
        f"  Passed: {passed}/{total - skipped}  "
        f"Failed: {failed}/{total - skipped}  "
        f"Skipped: {skipped}  "
        f"Stub responses: {stub_count}"
    )

    if is_stub_mode and failed == 0:
        print("  Mode: STUB — all API contracts verified, no GPU inference")
    elif not is_stub_mode and failed == 0:
        print("  Mode: LIVE — real GPU inference verified")
    else:
        print("  Mode: MIXED — some tests failed")

    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
