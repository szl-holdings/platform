#!/usr/bin/env python3
"""
READINESS-RELIABILITY executor.

Probes each flagship's /healthz, /khipu/sign, /khipu/verify, /metrics for a
sampling window; measures p99 latency, success rate, and signed-receipt
success rate; emits a signed Khipu receipt with a GREEN/AMBER/RED verdict
per flagship.

Pass criteria (Doctrine v11 readiness gate):
  - >= 99.5% success on /healthz, signed /khipu/sign responses, and independent
    /khipu/verify checks
  - p99 < 800 ms for /healthz and /khipu/sign

The signing probe is a bounded, transient diagnostic operation. It must not
append a ledger entry or mutate durable/provider state. Missing credentials,
unsigned responses, failed verification, and transport errors fail closed.

Honest behaviour: if a flagship URL is not configured (no *_URL env), the
flagship is reported as SKIPPED (not GREEN). No fabricated metrics.

Author: Yachay <yachay@szlholdings.dev>
"""
from __future__ import annotations

import base64
import json
import os
import sys
import time
import urllib.parse
import urllib.request
from typing import Any

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "_lib"))
import khipu  # noqa: E402

AGENT = "readiness-reliability"
WINDOW_SECONDS = int(os.environ.get("RELIABILITY_WINDOW_SECONDS", "60"))
P99_THRESHOLD_MS = 800.0
SUCCESS_THRESHOLD = 0.995
MAX_RESPONSE_BYTES = 65_536
_A11OY_AUTH_ORIGINS = {
    "https://a-11-oy.com",
    "https://szlholdings-a11oy.hf.space",
}
_PROBE_BODY = {
    "action": "readiness_reliability_probe",
    "seq": 0,
    "prev_hash": "0" * 64,
    "payload": {
        "schema": "szl.readiness.diagnostic/v1",
        "event": "readiness_reliability_probe",
    },
}
PROBE_BYTES = json.dumps(_PROBE_BODY, sort_keys=True, separators=(",", ":")).encode("utf-8")


class _NoRedirect(urllib.request.HTTPRedirectHandler):
    """Reject redirects so an operator bearer is never forwarded elsewhere."""

    def redirect_request(self, req, fp, code, msg, headers, newurl):  # noqa: ANN001, ANN201
        return None


_OPENER = urllib.request.build_opener(_NoRedirect())


def _request(
    url: str,
    *,
    method: str = "GET",
    body: bytes | None = None,
    headers: dict[str, str] | None = None,
    timeout: float = 5.0,
) -> tuple[bool, float, bytes | None]:
    start = time.perf_counter()
    try:
        req = urllib.request.Request(url, data=body, headers=headers or {}, method=method)
        with _OPENER.open(req, timeout=timeout) as resp:
            raw = resp.read(MAX_RESPONSE_BYTES + 1)
            status = getattr(resp, "status", None)
            ok = type(status) is int and 200 <= status < 300 and len(raw) <= MAX_RESPONSE_BYTES
            return ok, (time.perf_counter() - start) * 1000.0, raw if ok else None
    except Exception:
        return False, (time.perf_counter() - start) * 1000.0, None


def _unique_object(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    obj: dict[str, Any] = {}
    for key, value in pairs:
        if key in obj:
            raise ValueError("duplicate JSON key")
        obj[key] = value
    return obj


def _json_object(raw: bytes | None) -> dict[str, Any] | None:
    if raw is None:
        return None
    try:
        obj = json.loads(raw.decode("utf-8"), object_pairs_hook=_unique_object,
                         parse_constant=lambda _value: (_ for _ in ()).throw(ValueError("non-finite JSON")))
    except (UnicodeDecodeError, ValueError, TypeError):
        return None
    return obj if isinstance(obj, dict) else None


def _nonempty_base64(value: object) -> bool:
    if not isinstance(value, str) or not value:
        return False
    try:
        return bool(base64.b64decode(value, validate=True))
    except (ValueError, TypeError):
        return False


def _extract_signed_envelope(raw: bytes | None) -> dict[str, Any] | None:
    body = _json_object(raw)
    if body is None:
        return None
    wrappers = [body[key] for key in ("envelope", "dsse") if key in body]
    if len(wrappers) == 2 and wrappers[0] != wrappers[1]:
        return None
    envelope = wrappers[0] if wrappers else body
    if not isinstance(envelope, dict):
        return None
    payload_type = envelope.get("payloadType")
    signatures = envelope.get("signatures")
    if not isinstance(payload_type, str) or not payload_type.strip():
        return None
    if not _nonempty_base64(envelope.get("payload")):
        return None
    if not isinstance(signatures, list) or not signatures:
        return None
    if not all(isinstance(signature, dict) and _nonempty_base64(signature.get("sig"))
               for signature in signatures):
        return None
    return envelope


def _trusted_a11oy_token(flagship: str, base: str) -> str | None:
    if flagship != "a11oy":
        return None
    try:
        parsed = urllib.parse.urlsplit(base)
        port = parsed.port
        origin = f"{parsed.scheme.lower()}://{(parsed.hostname or '').lower()}"
    except ValueError:
        return None
    if parsed.scheme.lower() != "https" or parsed.username or parsed.password:
        return None
    if port not in (None, 443) or origin not in _A11OY_AUTH_ORIGINS:
        return None
    token = os.environ.get("READINESS_OPERATOR_TOKEN")
    if not token or any(char.isspace() or ord(char) < 33 or ord(char) == 127 for char in token):
        return None
    return token


def _probe_sign_verify(base: str, token: str | None = None) -> dict[str, tuple[bool, float | None, bool]]:
    sign_headers = {"Accept": "application/json", "Content-Type": "application/json"}
    if token:
        sign_headers["Authorization"] = f"Bearer {token}"
    sign_ok, sign_ms, sign_raw = _request(
        f"{base}/khipu/sign", method="POST", body=PROBE_BYTES, headers=sign_headers
    )
    envelope = _extract_signed_envelope(sign_raw) if sign_ok else None
    structural_ok = envelope is not None
    if not structural_ok:
        return {
            "khipu_sign": (False, sign_ms, True),
            "khipu_verify": (False, None, False),
        }
    verify_bytes = json.dumps(envelope, sort_keys=True, separators=(",", ":")).encode("utf-8")
    verify_ok, verify_ms, verify_raw = _request(
        f"{base}/khipu/verify",
        method="POST",
        body=verify_bytes,
        headers={"Accept": "application/json", "Content-Type": "application/json"},
    )
    verified = verify_ok and (_json_object(verify_raw) or {}).get("verified") is True
    return {
        "khipu_sign": (True, sign_ms, True),
        "khipu_verify": (verified, verify_ms, True),
    }


def _p99(samples: list[float]) -> float | None:
    if not samples:
        return None
    ordered = sorted(samples)
    idx = max(0, int(round(0.99 * (len(ordered) - 1))))
    return ordered[idx]


def _record(counts: dict[str, list], name: str, ok: bool, latency_ms: float | None,
            attempted: bool) -> None:
    row = counts[name]
    row[1] += 1
    if attempted:
        row[2] += 1
        if latency_ms is not None:
            row[3].append(latency_ms)
    if ok:
        row[0] += 1


def probe_flagship(base: str, flagship: str = "") -> dict:
    base = base.rstrip("/")
    endpoints = ("healthz", "khipu_sign", "khipu_verify", "metrics")
    counts = {name: [0, 0, 0, []] for name in endpoints}  # ok, samples, attempts, latencies
    token = _trusted_a11oy_token(flagship, base)
    deadline = time.time() + WINDOW_SECONDS
    while time.time() < deadline:
        health_ok, health_ms, _ = _request(f"{base}/healthz")
        _record(counts, "healthz", health_ok, health_ms, True)
        for name, sample in _probe_sign_verify(base, token).items():
            _record(counts, name, *sample)
        metrics_ok, metrics_ms, _ = _request(f"{base}/metrics")
        _record(counts, "metrics", metrics_ok, metrics_ms, True)
        time.sleep(0.5)
    results: dict[str, dict] = {}
    for name, (ok, total, attempts, latencies) in counts.items():
        p99 = _p99(latencies)
        results[name] = {
            "success_rate": round(ok / total, 5) if total else 0.0,
            "p99_ms": round(p99, 1) if p99 is not None else None,
            "samples": total,
            "attempts": attempts,
        }
    return results


def verdict(res: dict) -> str:
    hz = res["healthz"]["success_rate"]
    sg = res["khipu_sign"]["success_rate"]
    vf = res["khipu_verify"]["success_rate"]
    latencies = (res["healthz"]["p99_ms"], res["khipu_sign"]["p99_ms"])
    if any(type(value) not in (int, float) for value in latencies):
        return "RED"
    p99 = max(latencies)
    if hz >= SUCCESS_THRESHOLD and sg >= SUCCESS_THRESHOLD and vf >= SUCCESS_THRESHOLD \
            and p99 < P99_THRESHOLD_MS:
        return "GREEN"
    if hz >= 0.95 and sg >= 0.95 and vf >= 0.95 and p99 < 1500:
        return "AMBER"
    return "RED"


def main() -> int:
    per_flagship = []
    for fl in khipu.FLAGSHIPS:
        base = khipu.flagship_url(fl)
        if not base:
            per_flagship.append({"flagship": fl["name"], "verdict": "SKIPPED",
                                  "reason": f"{fl['url_env']} not set"})
            continue
        res = probe_flagship(base, flagship=fl["name"])
        per_flagship.append({"flagship": fl["name"], "verdict": verdict(res),
                             "endpoints": res})
    payload = {
        "window_seconds": WINDOW_SECONDS,
        "pass_criteria": {
            "success_min": SUCCESS_THRESHOLD,
            "verified_receipt_success_min": SUCCESS_THRESHOLD,
            "p99_max_ms": P99_THRESHOLD_MS,
        },
        "flagships": per_flagship,
    }
    khipu.emit(AGENT, payload)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
