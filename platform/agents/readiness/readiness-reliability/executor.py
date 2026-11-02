#!/usr/bin/env python3
"""READINESS-RELIABILITY executor.

Probe every configured runtime with an explicit method/path/body contract.
Passive health and metrics probes run for the sampling window. One bounded
synthetic Khipu sign/verify round trip runs per live runtime per workflow run,
proving the real POST contract without flooding the receipt ledger.

Pass criteria (Doctrine v11 readiness gate):
  - >= 99.5% success on namespaced health and Khipu sign contracts
  - p99 < 800 ms

Honest behaviour:
  - an unset runtime URL is SKIPPED, never GREEN;
  - an unimplemented endpoint is UNSUPPORTED and forces RED;
  - a 2xx HTML SPA fallback, unsigned response, or unverified envelope fails.

Author: Yachay <yachay@szlholdings.dev>
"""
from __future__ import annotations

import json
import os
import sys
import time
import urllib.request
from typing import Any

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "_lib"))
import khipu  # noqa: E402

AGENT = "readiness-reliability"
WINDOW_SECONDS = int(os.environ.get("RELIABILITY_WINDOW_SECONDS", "60"))
P99_THRESHOLD_MS = 800.0
SUCCESS_THRESHOLD = 0.995
_MAX_RESPONSE_BYTES = 64 * 1024
_HEX = frozenset("0123456789abcdef")


def _status_ok(body: dict[str, Any]) -> bool:
    if body.get("ok") is True:
        return True
    status = str(body.get("status", "")).strip().lower()
    return status in {"ok", "healthy", "live", "ready", "green"}


def _valid_json(validator: str, body: object, flagship: dict) -> bool:
    if not isinstance(body, dict):
        return False
    name = str(flagship["name"]).lower()

    if validator == "governed_health":
        identity = next(
            (
                body.get(field)
                for field in ("flagship", "service", "space", "organ")
                if isinstance(body.get(field), str)
            ),
            "",
        )
        doctrine = str(body.get("doctrine") or body.get("doctrine_lock") or "").lower()
        return _status_ok(body) and str(identity).lower() == name and doctrine == "v11"

    if validator == "production_health":
        return _status_ok(body) and body.get("production_ready") is True

    if validator == "khipu_sign":
        dsse = body.get("dsse")
        digest = body.get("digest")
        return bool(
            body.get("space") == name
            and body.get("signed") is True
            and isinstance(digest, str)
            and len(digest) == 64
            and all(char in _HEX for char in digest)
            and isinstance(dsse, dict)
            and dsse.get("signed") is True
            and isinstance(dsse.get("signatures"), list)
            and len(dsse["signatures"]) == 1
        )

    if validator == "khipu_verify":
        return bool(
            body.get("space") == name
            and body.get("verified") is True
            and body.get("verify_receipt_signed") is True
        )

    return False


def _valid_prometheus(raw: bytes, content_type: str) -> bool:
    if "text/plain" not in content_type and "openmetrics" not in content_type:
        return False
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError:
        return False
    lines = [line for line in text.splitlines() if line.strip()]
    return bool(lines and any(line.startswith(("# HELP ", "# TYPE ")) for line in lines))


def _request(
    url: str,
    *,
    method: str,
    validator: str,
    flagship: dict,
    body: dict | None = None,
    timeout: float = 5.0,
) -> tuple[bool, float, object | None]:
    started = time.perf_counter()
    data = None if body is None else json.dumps(body, sort_keys=True).encode("utf-8")
    headers = {
        "Accept": "text/plain" if validator == "prometheus" else "application/json",
        "User-Agent": "szl-readiness-reliability/1.0",
    }
    if data is not None:
        headers["Content-Type"] = "application/json"
    request = urllib.request.Request(url, data=data, headers=headers, method=method)
    decoded: object | None = None
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            raw = response.read(_MAX_RESPONSE_BYTES + 1)
            content_type = str(response.headers.get("Content-Type", "")).lower()
            status_ok = 200 <= int(response.status) < 300
        if len(raw) > _MAX_RESPONSE_BYTES or not status_ok:
            valid = False
        elif validator == "prometheus":
            valid = _valid_prometheus(raw, content_type)
        elif "json" not in content_type:
            valid = False
        else:
            decoded = json.loads(raw)
            valid = _valid_json(validator, decoded, flagship)
    except Exception:
        valid = False
    return valid, (time.perf_counter() - started) * 1000.0, decoded


def _p99(samples: list[float]) -> float:
    if not samples:
        return 0.0
    ordered = sorted(samples)
    index = max(0, int(round(0.99 * (len(ordered) - 1))))
    return ordered[index]


def _result(ok: int, total: int, latencies: list[float], **extra: object) -> dict:
    result = {
        "success_rate": round(ok / total, 5) if total else 0.0,
        "p99_ms": round(_p99(latencies), 1),
        "samples": total,
    }
    result.update(extra)
    return result


def _unsupported(reason: str) -> dict:
    return _result(0, 0, [], supported=False, reason=reason)


def _url(base: str, spec: dict) -> str:
    return f"{base.rstrip('/')}{spec['path']}"


def _passive_probe(base: str, flagship: dict) -> dict[str, dict]:
    endpoints = flagship["endpoints"]
    names = ("healthz", "metrics")
    counts = {name: [0, 0, []] for name in names if name in endpoints}
    deadline = time.time() + WINDOW_SECONDS
    first = True
    while first or time.time() < deadline:
        first = False
        for name in names:
            spec = endpoints.get(name)
            if not spec:
                continue
            ok, milliseconds, _ = _request(
                _url(base, spec),
                method=spec["method"],
                validator=spec["validator"],
                flagship=flagship,
            )
            counts[name][1] += 1
            if ok:
                counts[name][0] += 1
            counts[name][2].append(milliseconds)
        if time.time() < deadline:
            time.sleep(0.5)
    return {
        name: _result(ok, total, latencies)
        for name, (ok, total, latencies) in counts.items()
    }


def _active_khipu_probe(base: str, flagship: dict) -> dict[str, dict]:
    endpoints = flagship["endpoints"]
    sign_spec = endpoints.get("khipu_sign")
    verify_spec = endpoints.get("khipu_verify")
    if not sign_spec or not verify_spec:
        reason = "standalone Khipu contract not implemented"
        return {
            "khipu_sign": _unsupported(reason),
            "khipu_verify": _unsupported(reason),
        }

    synthetic = {
        "receipt": {
            "schema": "szl.readiness.synthetic/v1",
            "agent": AGENT,
            "intent": "bounded-signature-readiness",
            "synthetic": True,
        }
    }
    sign_ok, sign_ms, sign_body = _request(
        _url(base, sign_spec),
        method=sign_spec["method"],
        validator=sign_spec["validator"],
        flagship=flagship,
        body=synthetic,
    )
    sign_result = _result(int(sign_ok), 1, [sign_ms])
    if not sign_ok or not isinstance(sign_body, dict) or not isinstance(sign_body.get("dsse"), dict):
        return {
            "khipu_sign": sign_result,
            "khipu_verify": _result(0, 0, [], reason="sign contract failed"),
        }

    verify_ok, verify_ms, _ = _request(
        _url(base, verify_spec),
        method=verify_spec["method"],
        validator=verify_spec["validator"],
        flagship=flagship,
        body={"dsse": sign_body["dsse"]},
    )
    return {
        "khipu_sign": sign_result,
        "khipu_verify": _result(int(verify_ok), 1, [verify_ms]),
    }


def probe_flagship(base: str, flagship: dict) -> dict:
    results = _passive_probe(base, flagship)
    results.update(_active_khipu_probe(base, flagship))
    for name in ("healthz", "khipu_sign", "khipu_verify", "metrics"):
        if name not in results:
            results[name] = _unsupported("endpoint contract not implemented")
    return results


def verdict(results: dict) -> str:
    health = results["healthz"]["success_rate"]
    signing = results["khipu_sign"]["success_rate"]
    p99 = max(results["healthz"]["p99_ms"], results["khipu_sign"]["p99_ms"])
    if health >= SUCCESS_THRESHOLD and signing >= SUCCESS_THRESHOLD and p99 < P99_THRESHOLD_MS:
        return "GREEN"
    if health >= 0.95 and signing >= 0.95 and p99 < 1500:
        return "AMBER"
    return "RED"


def main() -> int:
    per_flagship = []
    for flagship in khipu.FLAGSHIPS:
        base = khipu.flagship_url(flagship)
        if not base:
            per_flagship.append(
                {
                    "flagship": flagship["name"],
                    "verdict": "SKIPPED",
                    "reason": f"{flagship['url_env']} not set",
                    "lifecycle": flagship.get("lifecycle", "unknown"),
                }
            )
            continue
        results = probe_flagship(base, flagship)
        per_flagship.append(
            {
                "flagship": flagship["name"],
                "verdict": verdict(results),
                "lifecycle": flagship.get("lifecycle", "unknown"),
                "endpoints": results,
            }
        )
    payload = {
        "window_seconds": WINDOW_SECONDS,
        "pass_criteria": {
            "success_min": SUCCESS_THRESHOLD,
            "p99_max_ms": P99_THRESHOLD_MS,
        },
        "flagships": per_flagship,
    }
    khipu.emit(AGENT, payload)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
