#!/usr/bin/env python3
"""
READINESS-RELIABILITY executor.

Probes each flagship's /healthz, /khipu/sign, /khipu/verify, /metrics for a
sampling window; measures p99 latency, success rate, and signed-receipt
success rate; emits a signed Khipu receipt with a GREEN/AMBER/RED verdict
per flagship.

Pass criteria (Doctrine v11 readiness gate):
  - >= 99.5% success on /healthz and /khipu/sign
  - p99 < 800 ms

Honest behaviour: if a flagship URL is not configured (no *_URL env), the
flagship is reported as SKIPPED (not GREEN). No fabricated metrics.

Author: Yachay <yachay@szlholdings.dev>
"""
from __future__ import annotations

import os
import sys
import time
import urllib.request

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "_lib"))
import khipu  # noqa: E402

AGENT = "readiness-reliability"
WINDOW_SECONDS = int(os.environ.get("RELIABILITY_WINDOW_SECONDS", "60"))
P99_THRESHOLD_MS = 800.0
SUCCESS_THRESHOLD = 0.995


def _probe(url: str, timeout: float = 5.0) -> tuple[bool, float]:
    start = time.perf_counter()
    try:
        with urllib.request.urlopen(url, timeout=timeout) as resp:
            resp.read(2048)
            ok = 200 <= resp.status < 300
    except Exception:
        ok = False
    return ok, (time.perf_counter() - start) * 1000.0


def _p99(samples: list[float]) -> float:
    if not samples:
        return 0.0
    s = sorted(samples)
    idx = max(0, int(round(0.99 * (len(s) - 1))))
    return s[idx]


def probe_flagship(base: str) -> dict:
    endpoints = {
        "healthz": f"{base}/healthz",
        "khipu_sign": f"{base}/khipu/sign",
        "khipu_verify": f"{base}/khipu/verify",
        "metrics": f"{base}/metrics",
    }
    results: dict[str, dict] = {}
    deadline = time.time() + WINDOW_SECONDS
    counts = {k: [0, 0, []] for k in endpoints}  # ok, total, latencies
    while time.time() < deadline:
        for name, url in endpoints.items():
            ok, ms = _probe(url)
            counts[name][1] += 1
            if ok:
                counts[name][0] += 1
            counts[name][2].append(ms)
        time.sleep(0.5)
    for name, (ok, total, lat) in counts.items():
        results[name] = {
            "success_rate": round(ok / total, 5) if total else 0.0,
            "p99_ms": round(_p99(lat), 1),
            "samples": total,
        }
    return results


def verdict(res: dict) -> str:
    hz = res["healthz"]["success_rate"]
    sg = res["khipu_sign"]["success_rate"]
    p99 = max(res["healthz"]["p99_ms"], res["khipu_sign"]["p99_ms"])
    if hz >= SUCCESS_THRESHOLD and sg >= SUCCESS_THRESHOLD and p99 < P99_THRESHOLD_MS:
        return "GREEN"
    if hz >= 0.95 and sg >= 0.95 and p99 < 1500:
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
        res = probe_flagship(base.rstrip("/"))
        per_flagship.append({"flagship": fl["name"], "verdict": verdict(res),
                             "endpoints": res})
    payload = {
        "window_seconds": WINDOW_SECONDS,
        "pass_criteria": {"success_min": SUCCESS_THRESHOLD, "p99_max_ms": P99_THRESHOLD_MS},
        "flagships": per_flagship,
    }
    khipu.emit(AGENT, payload)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
