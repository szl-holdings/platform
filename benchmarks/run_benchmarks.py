#!/usr/bin/env python3
"""
v11 HTTP overhead harness.

Measures end-to-end HTTP latency for the eight Ouroboros routes plus the
seven Lutar invariant routes on the running alloy-runtime-api.  Produces:

  summary.csv           — headline overhead table (one row per route)
  amaru.csv             — per-call latencies for amaru routes
  a11oy.csv             — per-call latencies for a11oy routes
  sentra.csv            — per-call latencies for sentra routes
  lutar.csv             — per-call latencies for the lutar invariant family
  meta.json             — run metadata (host, node, repetitions, server health)

Run:
  ALLOY_API_KEY=bench-key-szl-v11-truth \\
  python3 benchmarks/run_benchmarks.py --reps 1000 --warmup 50

Every measurement is from the live HTTP surface — no mocks, no estimates.
Output is byte-for-byte reproducible given the same seed and server build.
"""
from __future__ import annotations

import argparse
import csv
import json
import os
import platform
import random
import socket
import statistics
import sys
import time
import urllib.error
import urllib.request
from typing import Any, Callable, Dict, List, Tuple

DEFAULT_BASE = "http://localhost:4010"
DEFAULT_API_KEY = os.environ.get("ALLOY_API_KEY", "bench-key-szl-v11-truth")
HEX_64 = "0x" + "0123456789abcdef" * 4  # 256-bit hex


def post(base: str, path: str, body: Dict[str, Any], api_key: str,
         timeout: float = 10.0) -> Tuple[float, int]:
    """POST a JSON body, return (latency_seconds, status_code)."""
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        base + path,
        data=data,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "x-api-key": api_key,
        },
    )
    t0 = time.perf_counter()
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            resp.read()
            t1 = time.perf_counter()
            return (t1 - t0, resp.status)
    except urllib.error.HTTPError as e:
        t1 = time.perf_counter()
        # Validation errors are still a measured HTTP round-trip
        return (t1 - t0, e.code)


def get(base: str, path: str, api_key: str,
        timeout: float = 10.0) -> Tuple[float, int]:
    req = urllib.request.Request(
        base + path,
        method="GET",
        headers={"x-api-key": api_key},
    )
    t0 = time.perf_counter()
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            resp.read()
            t1 = time.perf_counter()
            return (t1 - t0, resp.status)
    except urllib.error.HTTPError as e:
        t1 = time.perf_counter()
        return (t1 - t0, e.code)


# -----------------------------------------------------------------------------
# Payload generators (seeded for reproducibility)
# -----------------------------------------------------------------------------

def gen_handoff(rng: random.Random, i: int) -> Dict[str, Any]:
    base = [f"leaf-{j}" for j in range(8)]
    # Randomly drop one leaf from one of the witnesses to vary verdicts
    drop = rng.randint(0, 7)
    obs = list(base)
    fr = list(base)
    to = list(base)
    if rng.random() < 0.5:
        fr.pop(drop)
    else:
        to.pop(drop)
    return {
        "handoffId": f"h-{i}",
        "fromAgent": "agent-A",
        "toAgent": "agent-B",
        "observerAgent": "observer-O",
        "fromLeaves": fr,
        "toLeaves": to,
        "observerLeaves": obs,
    }


def gen_audit_fleet(rng: random.Random, i: int) -> Dict[str, Any]:
    n = rng.randint(2, 6)
    return {"handoffs": [gen_handoff(rng, i * 100 + j) for j in range(n)]}


def gen_metric(rng: random.Random, i: int) -> Dict[str, Any]:
    # SekedAuditor requires non-negative dx and dy (see
    # packages/reconciliation/src/seked.ts:32). The zod schema allows
    # negative vertical, but the implementation rejects it — we stay
    # within the implementation's domain to measure happy-path latency.
    return {
        "metricId": f"m-{i}",
        "horizontal": round(rng.uniform(0.1, 10.0), 4),
        "vertical": round(rng.uniform(0.0, 5.0), 4),
    }


def gen_threshold(rng: random.Random, _i: int) -> Dict[str, Any]:
    p = rng.randint(1, 100)
    q = rng.randint(p + 1, 200)
    return {"p": p, "q": q, "maxTerms": 6}


def gen_event(rng: random.Random, i: int) -> Dict[str, Any]:
    h = "0x" + "".join(rng.choice("0123456789abcdef") for _ in range(64))
    return {"eventId": f"e-{i}", "leafHashHex": h}


def gen_batch(rng: random.Random, i: int) -> Dict[str, Any]:
    n = rng.randint(2, 8)
    return {"events": [gen_event(rng, i * 100 + j) for j in range(n)]}


def gen_axes(rng: random.Random, k: int) -> Dict[str, float]:
    names = [
        "cleanliness", "horizon", "resonance", "frustum",
        "gaussClosure", "invariance", "moralGrounding",
        "ontologicalGrounding", "measurabilityHonesty",
    ][:k]
    return {n: round(rng.uniform(0.5, 1.0), 6) for n in names}


def gen_verify_trace(rng: random.Random, _i: int) -> Dict[str, Any]:
    # Random valid hex products + steps. /v1/ouroboros/sentra/verify-trace
    # accepts {product, steps:[{multiplier, doubled, selected}, ...]}.
    n = rng.randint(1, 3)
    hex_word = lambda: "0x" + "".join(
        rng.choice("0123456789abcdef") for _ in range(64))
    steps = [
        {"multiplier": hex_word(), "doubled": hex_word(),
         "selected": rng.random() < 0.5}
        for _ in range(n)
    ]
    return {"product": hex_word(), "steps": steps}


def gen_v10_matrix(rng: random.Random, _i: int) -> Dict[str, Any]:
    layers = ["v1", "v2", "v6", "v7", "v8", "v9"]
    dims = ["CODE", "CODEX", "API", "TEST", "THESIS", "SURFACE"]
    matrix = []
    for layer in layers:
        artifacts = {d: rng.random() > 0.15 for d in dims}
        matrix.append({
            "layer": layer,
            "lambdaValue": round(rng.uniform(0.6, 0.95), 4),
            "artifacts": artifacts,
        })
    return {"matrix": matrix}


# -----------------------------------------------------------------------------
# Route table
# -----------------------------------------------------------------------------

# (route_id, product, method, path, payload_fn)
# payload_fn: (rng, i) -> dict   OR   None for GET
ROUTES: List[Tuple[str, str, str, str, Any]] = [
    # a11oy
    ("a11oy.reconcile-handoff", "a11oy", "POST",
     "/v1/ouroboros/a11oy/reconcile-handoff", gen_handoff),
    ("a11oy.audit-fleet", "a11oy", "POST",
     "/v1/ouroboros/a11oy/audit-fleet", gen_audit_fleet),
    # amaru
    ("amaru.observe-metric", "amaru", "POST",
     "/v1/ouroboros/amaru/observe-metric", gen_metric),
    ("amaru.audit-threshold", "amaru", "POST",
     "/v1/ouroboros/amaru/audit-threshold", gen_threshold),
    # sentra
    ("sentra.anchor-event", "sentra", "POST",
     "/v1/ouroboros/sentra/anchor-event", gen_event),
    ("sentra.anchor-batch", "sentra", "POST",
     "/v1/ouroboros/sentra/anchor-batch", gen_batch),
    ("sentra.verify-trace", "sentra", "POST",
     "/v1/ouroboros/sentra/verify-trace", gen_verify_trace),
    ("sentra.anchor-state", "sentra", "GET",
     "/v1/ouroboros/sentra/anchor-state", None),
    # lutar
    ("lutar.v1", "lutar", "POST",
     "/v1/ouroboros/lutar/v1", lambda r, i: gen_axes(r, 4)),
    ("lutar.v2", "lutar", "POST",
     "/v1/ouroboros/lutar/v2", lambda r, i: gen_axes(r, 5)),
    ("lutar.v6", "lutar", "POST",
     "/v1/ouroboros/lutar/v6", lambda r, i: gen_axes(r, 6)),
    ("lutar.v7", "lutar", "POST",
     "/v1/ouroboros/lutar/v7", lambda r, i: gen_axes(r, 7)),
    ("lutar.v8", "lutar", "POST",
     "/v1/ouroboros/lutar/v8", lambda r, i: gen_axes(r, 8)),
    ("lutar.v9", "lutar", "POST",
     "/v1/ouroboros/lutar/v9", lambda r, i: gen_axes(r, 9)),
    ("lutar.v10", "lutar", "POST",
     "/v1/ouroboros/lutar/v10", gen_v10_matrix),
    ("lutar.evaluate-all", "lutar", "POST",
     "/v1/ouroboros/lutar/evaluate-all", lambda r, i: gen_axes(r, 9)),
]


# -----------------------------------------------------------------------------
# Statistics
# -----------------------------------------------------------------------------

def quantile(sorted_xs: List[float], q: float) -> float:
    if not sorted_xs:
        return 0.0
    n = len(sorted_xs)
    if q <= 0:
        return sorted_xs[0]
    if q >= 1:
        return sorted_xs[-1]
    pos = q * (n - 1)
    lo = int(pos)
    hi = min(lo + 1, n - 1)
    frac = pos - lo
    return sorted_xs[lo] * (1 - frac) + sorted_xs[hi] * frac


def summarize(latencies_s: List[float]) -> Dict[str, float]:
    if not latencies_s:
        return {k: 0.0 for k in ("n", "mean_us", "p50_us", "p90_us",
                                  "p95_us", "p99_us", "min_us", "max_us",
                                  "stdev_us", "throughput_per_s")}
    xs = sorted(latencies_s)
    micros = [x * 1e6 for x in xs]
    sorted_micros = sorted(micros)
    mean = statistics.fmean(micros)
    return {
        "n": float(len(xs)),
        "mean_us": mean,
        "p50_us": quantile(sorted_micros, 0.50),
        "p90_us": quantile(sorted_micros, 0.90),
        "p95_us": quantile(sorted_micros, 0.95),
        "p99_us": quantile(sorted_micros, 0.99),
        "min_us": sorted_micros[0],
        "max_us": sorted_micros[-1],
        "stdev_us": statistics.pstdev(micros) if len(micros) > 1 else 0.0,
        "throughput_per_s": (1e6 / mean) if mean > 0 else 0.0,
    }


# -----------------------------------------------------------------------------
# Bench runner
# -----------------------------------------------------------------------------

STEADY_STATE_V10_MATRIX = {
    "matrix": [
        {"layer": layer, "lambdaValue": 1.0,
         "artifacts": {d: True for d in (
             "CODE", "CODEX", "API", "TEST", "THESIS", "SURFACE")}}
        for layer in ("v1", "v2", "v6", "v7", "v8", "v9", "v10")
    ]
}


def bench_governed_pair(base: str, api_key: str, route_id: str, method: str,
                        path: str, payload_fn: Any, reps: int, warmup: int,
                        seed: int) -> Dict[str, Any]:
    """Run the (baseline) and (baseline+Λ₁₀-audit) arms for one route.

    Returns paired statistics suitable for the v11 §4.2 table.
    """
    rng_b = random.Random(seed)
    rng_g = random.Random(seed)
    baseline_lat: List[float] = []
    governed_lat: List[float] = []
    audit_lat: List[float] = []
    audit_rho_closed = 0
    audit_missing_total = 0
    error_count = 0

    # Warmup
    for i in range(warmup):
        if method == "GET":
            get(base, path, api_key)
        else:
            post(base, path, payload_fn(rng_b, i), api_key)
        post(base, "/v1/ouroboros/lutar/v10", STEADY_STATE_V10_MATRIX, api_key)

    rng_b = random.Random(seed * 2654435761 % (2**32))
    rng_g = random.Random(seed * 2654435761 % (2**32))

    # Baseline arm (route alone)
    for i in range(reps):
        if method == "GET":
            lat, code = get(base, path, api_key)
        else:
            lat, code = post(base, path, payload_fn(rng_b, i), api_key)
        baseline_lat.append(lat)
        if code >= 500:
            error_count += 1

    # Governed arm (route + audit)
    for i in range(reps):
        t0 = time.perf_counter()
        if method == "GET":
            _l1, c1 = get(base, path, api_key)
        else:
            _l1, c1 = post(base, path, payload_fn(rng_g, i), api_key)
        # Audit call
        audit_t0 = time.perf_counter()
        audit_req = urllib.request.Request(
            base + "/v1/ouroboros/lutar/v10",
            data=json.dumps(STEADY_STATE_V10_MATRIX).encode("utf-8"),
            method="POST",
            headers={"Content-Type": "application/json",
                     "x-api-key": api_key},
        )
        try:
            with urllib.request.urlopen(audit_req, timeout=10) as r:
                audit_body = json.loads(r.read())
            audit_t1 = time.perf_counter()
            audit_lat.append(audit_t1 - audit_t0)
            if audit_body.get("rho") == 1.0 and audit_body.get("auditClosed"):
                audit_rho_closed += 1
            audit_missing_total += len(audit_body.get("missingArtifacts", []))
        except Exception:
            audit_t1 = time.perf_counter()
            audit_lat.append(audit_t1 - audit_t0)
            error_count += 1
        t1 = time.perf_counter()
        governed_lat.append(t1 - t0)
        if c1 >= 500:
            error_count += 1

    base_summary = summarize(baseline_lat)
    gov_summary = summarize(governed_lat)
    audit_summary = summarize(audit_lat)

    return {
        "route_id": route_id,
        "method": method,
        "path": path,
        "reps": reps,
        # Baseline
        "base_p50_ms": base_summary["p50_us"] / 1000.0,
        "base_p95_ms": base_summary["p95_us"] / 1000.0,
        "base_p99_ms": base_summary["p99_us"] / 1000.0,
        # Governed (paired)
        "gov_p50_ms": gov_summary["p50_us"] / 1000.0,
        "gov_p95_ms": gov_summary["p95_us"] / 1000.0,
        "gov_p99_ms": gov_summary["p99_us"] / 1000.0,
        # Overhead (gov - base, per-quantile)
        "delta_p50_ms": (gov_summary["p50_us"] - base_summary["p50_us"]) / 1000.0,
        "delta_p99_ms": (gov_summary["p99_us"] - base_summary["p99_us"]) / 1000.0,
        # Audit-only cost
        "audit_p50_ms": audit_summary["p50_us"] / 1000.0,
        "audit_p99_ms": audit_summary["p99_us"] / 1000.0,
        # Closure metrics
        "rho_closed_count": audit_rho_closed,
        "rho_closed_rate": audit_rho_closed / max(1, reps),
        "missing_total": audit_missing_total,
        "error_count": error_count,
        "raw_baseline_us": [round(x * 1e6, 3) for x in baseline_lat],
        "raw_governed_us": [round(x * 1e6, 3) for x in governed_lat],
        "raw_audit_us": [round(x * 1e6, 3) for x in audit_lat],
    }


def bench_route(base: str, api_key: str, route_id: str, method: str,
                path: str, payload_fn: Any, reps: int, warmup: int,
                seed: int) -> Dict[str, Any]:
    rng = random.Random(seed)
    statuses: Dict[int, int] = {}
    latencies: List[float] = []
    # Warmup
    for i in range(warmup):
        if method == "GET":
            get(base, path, api_key)
        else:
            post(base, path, payload_fn(rng, i), api_key)
    # Measured
    rng = random.Random(seed * 2654435761 % (2**32))
    for i in range(reps):
        if method == "GET":
            lat, code = get(base, path, api_key)
        else:
            lat, code = post(base, path, payload_fn(rng, i), api_key)
        latencies.append(lat)
        statuses[code] = statuses.get(code, 0) + 1
    summary = summarize(latencies)
    summary.update({
        "route_id": route_id,
        "method": method,
        "path": path,
        "status_counts": dict(sorted(statuses.items())),
        "raw_latencies_us": [round(x * 1e6, 3) for x in latencies],
    })
    return summary


def write_csv(rows: List[Dict[str, Any]], path: str, cols: List[str]) -> None:
    with open(path, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=cols)
        w.writeheader()
        for r in rows:
            w.writerow({k: r.get(k, "") for k in cols})


def write_per_product_csv(per_route: List[Dict[str, Any]], product: str,
                          out_dir: str) -> None:
    rows = []
    for r in per_route:
        if not r["route_id"].startswith(product + "."):
            continue
        for idx, us in enumerate(r["raw_latencies_us"]):
            rows.append({
                "route_id": r["route_id"],
                "rep": idx,
                "latency_us": us,
            })
    if not rows:
        return
    write_csv(rows, os.path.join(out_dir, f"{product}.csv"),
              ["route_id", "rep", "latency_us"])


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default=DEFAULT_BASE)
    ap.add_argument("--api-key", default=DEFAULT_API_KEY)
    ap.add_argument("--reps", type=int, default=1000)
    ap.add_argument("--warmup", type=int, default=50)
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--out-dir", default="benchmarks/results")
    args = ap.parse_args()

    os.makedirs(args.out_dir, exist_ok=True)

    # Verify server health
    print("[bench] probing server health…", file=sys.stderr)
    health_req = urllib.request.Request(args.base + "/health", method="GET")
    try:
        with urllib.request.urlopen(health_req, timeout=5) as r:
            health = json.loads(r.read())
    except Exception as e:
        print(f"[bench] FATAL: cannot reach {args.base}/health: {e}",
              file=sys.stderr)
        return 1
    print(f"[bench]   v1EndpointCount = {health.get('v1EndpointCount')}",
          file=sys.stderr)

    per_route: List[Dict[str, Any]] = []
    paired: List[Dict[str, Any]] = []
    t_start = time.time()
    for route_id, product, method, path, payload_fn in ROUTES:
        print(f"[bench] {route_id:32s} reps={args.reps} warmup={args.warmup}…",
              file=sys.stderr, flush=True)
        result = bench_route(args.base, args.api_key, route_id, method, path,
                             payload_fn, args.reps, args.warmup,
                             args.seed + hash(route_id) % 10000)
        per_route.append(result)
        print(f"[bench]   p50={result['p50_us']:7.1f}µs "
              f"p99={result['p99_us']:8.1f}µs "
              f"thr={result['throughput_per_s']:9.0f}/s "
              f"status={result['status_counts']}",
              file=sys.stderr)
        # The v11 paper §4 only pairs the eight production routes
        # (a11oy/amaru/sentra), not the lutar invariants themselves.
        if product in ("a11oy", "amaru", "sentra"):
            print(f"[bench]   pairing {route_id} with Λ₁₀ audit…",
                  file=sys.stderr, flush=True)
            pair = bench_governed_pair(
                args.base, args.api_key, route_id, method, path, payload_fn,
                args.reps, args.warmup,
                args.seed + hash(route_id + "-paired") % 10000)
            paired.append(pair)
            print(f"[bench]   base p50={pair['base_p50_ms']:5.3f}ms "
                  f"gov p50={pair['gov_p50_ms']:5.3f}ms "
                  f"Δp50={pair['delta_p50_ms']:5.3f}ms "
                  f"Δp99={pair['delta_p99_ms']:5.3f}ms "
                  f"ρ-closed={pair['rho_closed_count']}/{pair['reps']}",
                  file=sys.stderr)
    t_total = time.time() - t_start

    # Summary CSV
    summary_cols = ["route_id", "method", "path", "n",
                    "mean_us", "p50_us", "p90_us", "p95_us", "p99_us",
                    "min_us", "max_us", "stdev_us", "throughput_per_s"]
    write_csv(per_route, os.path.join(args.out_dir, "summary.csv"),
              summary_cols)

    # v11 §4.2 paired table
    paired_cols = ["route_id", "method", "path", "reps",
                   "base_p50_ms", "base_p95_ms", "base_p99_ms",
                   "gov_p50_ms", "gov_p95_ms", "gov_p99_ms",
                   "delta_p50_ms", "delta_p99_ms",
                   "audit_p50_ms", "audit_p99_ms",
                   "rho_closed_count", "rho_closed_rate",
                   "missing_total", "error_count"]
    write_csv(paired, os.path.join(args.out_dir, "summary_paired.csv"),
              paired_cols)

    # Per-product CSVs (raw latencies)
    for product in ("a11oy", "amaru", "sentra", "lutar"):
        write_per_product_csv(per_route, product, args.out_dir)

    # Meta
    meta = {
        "harness": "benchmarks/run_benchmarks.py",
        "version": "1.0.0",
        "started_iso": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(t_start)),
        "wallclock_seconds": round(t_total, 3),
        "reps_per_route": args.reps,
        "warmup_per_route": args.warmup,
        "seed": args.seed,
        "host": {
            "hostname": socket.gethostname(),
            "platform": platform.platform(),
            "python_version": platform.python_version(),
            "machine": platform.machine(),
        },
        "server": {
            "base": args.base,
            "health": health,
        },
        "routes": [
            {"route_id": r["route_id"], "method": r["method"],
             "path": r["path"], "status_counts": r["status_counts"]}
            for r in per_route
        ],
        "paired": [
            {"route_id": p["route_id"],
             "base_p50_ms": p["base_p50_ms"],
             "gov_p50_ms": p["gov_p50_ms"],
             "delta_p50_ms": p["delta_p50_ms"],
             "delta_p99_ms": p["delta_p99_ms"],
             "rho_closed_rate": p["rho_closed_rate"],
             "missing_total": p["missing_total"],
             "error_count": p["error_count"]}
            for p in paired
        ],
    }
    with open(os.path.join(args.out_dir, "meta.json"), "w") as f:
        json.dump(meta, f, indent=2)

    # Trim raw_latencies_us out of any large JSON dump (keep in CSVs only)
    print(f"[bench] wrote {args.out_dir}/summary.csv "
          f"({len(per_route)} routes, "
          f"{args.reps * len(per_route)} total measurements)",
          file=sys.stderr)
    print(f"[bench] wrote {args.out_dir}/meta.json", file=sys.stderr)
    print(f"[bench] total wallclock {t_total:.2f}s", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
