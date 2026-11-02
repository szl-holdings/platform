#!/usr/bin/env python3
"""
READINESS-OBSERVABILITY executor.

For each flagship:
  - Send a sample request carrying a unique W3C `traceparent` header.
  - Poll the OTel collector `/recent` endpoint to confirm the trace landed
    (Wire D continuity — does the trace context propagate end to end?).
  - Curl /metrics and confirm the required counters are exposed.

Emits a signed trace-continuity matrix: for each flagship, whether Wire D
propagated and which required counters are present.

Honest behaviour: missing flagship URL or collector URL -> SKIPPED, never
GREEN. No fabricated trace IDs claimed as "landed".

Author: Yachay <yachay@szlholdings.dev>
"""
from __future__ import annotations

import json
import math
import os
import re
import sys
import time
import urllib.request
import uuid

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "_lib"))
import khipu  # noqa: E402

AGENT = "readiness-observability"
OTEL_COLLECTOR_URL = os.environ.get("OTEL_COLLECTOR_URL")
REQUIRED_COUNTERS = [
    "khipu_receipts_signed_total",
    "khipu_receipts_verified_total",
    "gate_decisions_total",
    "http_requests_total",
]

# Parse sample lines, not HELP/TYPE comments or arbitrary mentions. These fixed
# ASCII counter names support both ordinary and quoted Prometheus text syntax.
_QUOTED = r'"(?:[^"\\\n]|\\[\\"n])*"'
_LABEL_NAME = rf'(?:[a-zA-Z_][a-zA-Z0-9_]*|{_QUOTED})'
_LABEL = rf'{_LABEL_NAME}[ \t]*=[ \t]*{_QUOTED}'
_LABELS = rf'(?:{_LABEL}(?:[ \t]*,[ \t]*{_LABEL})*[ \t]*,?)?'
_NAMES = '|'.join(re.escape(name) for name in REQUIRED_COUNTERS)
_NUMBER = r'[+-]?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)(?:[eE][+-]?[0-9]+)?'
_SAMPLE = re.compile(
    rf'[ \t]*(?:(?P<name>{_NAMES})(?:\{{[ \t]*(?P<labels>{_LABELS})[ \t]*\}})?'
    rf'|\{{[ \t]*"(?P<quoted>{_NAMES})"(?:[ \t]*,[ \t]*(?P<quoted_labels>{_LABELS}))?[ \t]*\}})'
    rf'[ \t]+(?P<value>{_NUMBER})(?:[ \t]+(?P<timestamp>[+-]?[0-9]+))?[ \t]*'
)
_LABEL_PAIR = re.compile(rf'(?P<name>{_LABEL_NAME})[ \t]*=[ \t]*{_QUOTED}')


def observed_counters(body: str) -> dict[str, bool]:
    """Report complete, finite nonnegative samples for required exact names.

    This bounded text check does not establish metric type, freshness,
    monotonicity or collector continuity. Unsupported/malformed lines provide
    no positive evidence. A final unterminated line may be a truncated read.
    """
    found = {name: False for name in REQUIRED_COUNTERS}
    # Prometheus separates samples with LF only; splitlines() also splits
    # valid Unicode label characters and can turn embedded prose into samples.
    for line in body.split('\n')[:-1]:
        match = _SAMPLE.fullmatch(line)
        if not match:
            continue
        labels = match['labels'] or match['quoted_labels'] or ''
        label_names = [json.loads(p['name'], strict=False) if p['name'].startswith('"') else p['name']
                       for p in _LABEL_PAIR.finditer(labels)]
        if len(label_names) != len(set(label_names)) or '__name__' in label_names:
            continue
        value = float(match['value'])
        if not math.isfinite(value) or value < 0:
            continue
        timestamp = match['timestamp']
        if timestamp is not None:
            try:
                if not -(2 ** 63) <= int(timestamp) < 2 ** 63:
                    continue
            except ValueError:
                # Python may reject extremely long integer strings before
                # conversion. Untrusted exposition must not abort the probe.
                continue
        found[match['name'] or match['quoted']] = True
    return found


def _traceparent() -> tuple[str, str]:
    trace_id = uuid.uuid4().hex + uuid.uuid4().hex[:0]  # 32 hex chars
    trace_id = (trace_id + "0" * 32)[:32]
    span_id = uuid.uuid4().hex[:16]
    return trace_id, f"00-{trace_id}-{span_id}-01"


def _get(url: str, headers: dict | None = None, timeout: float = 6.0) -> tuple[int, str]:
    req = urllib.request.Request(url, headers=headers or {})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, resp.read(65536).decode("utf-8", "replace")
    except Exception as exc:
        return 0, f"{type(exc).__name__}: {exc}"


def check_flagship(base: str) -> dict:
    trace_id, tp = _traceparent()
    status, _ = _get(f"{base}/healthz", headers={"traceparent": tp})
    landed = None
    if OTEL_COLLECTOR_URL:
        landed = False
        for _ in range(10):
            time.sleep(1.0)
            st, body = _get(f"{OTEL_COLLECTOR_URL.rstrip('/')}/recent")
            if st == 200 and trace_id in body:
                landed = True
                break
    # metrics counters
    ms, mbody = _get(f"{base}/metrics")
    counters = observed_counters(mbody) if ms == 200 else \
        {c: False for c in REQUIRED_COUNTERS}
    return {
        "request_status": status,
        "traceparent": tp,
        "wire_d_propagated": landed,
        "metrics_status": ms,
        "required_counters": counters,
    }


def main() -> int:
    matrix = []
    for fl in khipu.FLAGSHIPS:
        base = khipu.flagship_url(fl)
        if not base:
            matrix.append({"flagship": fl["name"], "status": "SKIPPED",
                           "reason": f"{fl['url_env']} not set"})
            continue
        res = check_flagship(base.rstrip("/"))
        matrix.append({"flagship": fl["name"], **res})
    payload = {
        "otel_collector": OTEL_COLLECTOR_URL or "(unset)",
        "required_counters": REQUIRED_COUNTERS,
        "trace_continuity_matrix": matrix,
    }
    khipu.emit(AGENT, payload)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
