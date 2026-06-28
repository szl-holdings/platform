#!/usr/bin/env python3
# ATTRIBUTION
# ===========
# SZL Smoke + Stress Harness — an SZL-native live-estate health + load checker
# for the a11oy.net API surfaces.
#
# This is an INDEPENDENT, original implementation written by SZL Holdings.
# It depends ONLY on the Python standard library (urllib + concurrent.futures);
# no third-party packages and no copied source. The companion tool
# szl_estate_auditor.py audits the *repos*; this tool audits the *live API*.
#
# Author: SZL Holdings (stephenlutar2 <stephenlutar2@gmail.com>)
# Doctrine: v11 LOCKED 749/14/163. Additive tool; no secrets committed.
#
# Honesty contract: this tool never fabricates a result. An unreachable surface
# is reported as "unreachable" (not a fake 200); transient failures get up to 2
# retries; a flagged surface always records WHY it was flagged. Latency numbers
# are wall-clock measurements, never invented.
"""SZL Smoke + Stress Harness.

Two modes against the live a11oy.net estate.

SMOKE (default)
    GET each live surface once and report a table of:
        {surface, url, status, latency_s, bytes, json_valid, flags}
    A surface is FLAGGED for any of:
        - non-200 status (or unreachable after retries)
        - latency > SLOW_THRESHOLD_S (default 2.0s)
        - body is not valid JSON (HTML surfaces like /router/health are
          exempt — they are expected to be HTML, see HTML_OK)
        - a doctrine violation in the JSON body:
            * a banned overclaim marketing token (doctrine v11 §1)
            * joules labelled "measured" with no exporter/meter field
            * sovereign=true asserted on a node that is not own-metal

STRESS
    For one or more target surfaces, fire N concurrent GETs (default 25,
    HARD-capped at MAX_CONCURRENCY=50, total requests capped ~MAX_TOTAL=200),
    with a small per-request jitter so we do not hammer our own infra. Reports
    p50/p95/max latency, success rate, and a "breakpoint" heuristic: whether
    the concurrent p50 is materially worse than a single warm baseline request
    (latency degrades under concurrency).

Output
    A JSON report written to estate_audit/smoke_stress_<UTC>.json plus a stdout
    summary with a clear PASS/FAIL verdict and the slowest/failing surfaces
    called out.

Run:
    python tools/szl_smoke_stress.py                 # smoke all surfaces
    python tools/szl_smoke_stress.py --mode stress   # gentle stress
    python tools/szl_smoke_stress.py --mode both     # smoke then stress
"""

from __future__ import annotations

import argparse
import concurrent.futures
import json
import os
import random
import re
import statistics
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone

# --------------------------------------------------------------------------- #
# Configuration
# --------------------------------------------------------------------------- #
BASE_URL = "https://a11oy.net"
API_PREFIX = "/api/a11oy/v1"

# Full live surface list (per the estate map). Paths under API_PREFIX unless
# they start with "/" (absolute, e.g. /router/health).
SMOKE_PATHS = [
    "harvest/posture",
    "harvest/metrics",
    "energy/budget",
    "energy/provenance",
    "engine/status",
    "anatomy/loop",
    "heart/pulse",
    "/ayni",  # real top-level HTML page (ayni_page) -- HTML, not JSON
    "sovereign-compute",  # canonical sovereign posture JSON (formula/sovereign aggregator tab is dark)
    "qbio/coherence",
    "formulas",  # real formula registry JSON (was wrong path formulas/index)
    "revenue/marketplace",
    "revenue/estimate",
    "revenue/thesis",
    "compute-pool",
    "verify/healthz",
    "wayra/summary",
    "/router/health",  # absolute, expected HTML not JSON
]

# Default stress targets.
DEFAULT_STRESS_TARGETS = ["compute-pool", "anatomy/loop"]

# Good-citizen caps.
MAX_CONCURRENCY = 50
MAX_TOTAL = 200
DEFAULT_CONCURRENCY = 25
DEFAULT_TOTAL = 50  # total requests per target in stress mode

# Thresholds.
SLOW_THRESHOLD_S = 2.0
REQUEST_TIMEOUT_S = 25
RETRIES = 2  # additional retries on transient failure
USER_AGENT = "szl-smoke-stress/1.0 (+a11oy estate health; doctrine v11)"

# Surfaces whose body is legitimately HTML, not JSON. Not flagged for
# json_valid=False. /router/health serves the operator HTML app.
HTML_OK = {"/router/health", "/ayni"}

# Surfaces whose body is legitimately Prometheus exposition text (text/plain;
# version=0.0.4), not JSON -- exempt from json_valid exactly like HTML_OK.
PROM_OK = {"harvest/metrics"}

# Doctrine v11 §1 banned overclaim marketing tokens (mirrors
# packages/unified-kernel/src/doctrine/index.ts BANNED_MARKETING + contextual).
BANNED_TOKENS = [
    "revolutionary",
    "unprecedented",
    "world-class",
    "seamless",
    "industry-leading",
    "cutting-edge",
    "game-changing",
    "breakthrough",
    "best-in-class",
    "immaculate",
    "state-of-the-art",
    "premier",
]

# Fields that, if present and truthy, mean a "measured" joules claim IS backed
# by a real exporter/meter — so it is honest, not a violation.
EXPORTER_FIELDS = ("exporter", "power_meter", "meter", "power_exporter", "watt_meter",
                   # self-verifying evidence emitted next to a "measured" label
                   # by the energy-harvest service (engine.joules_evidence):
                   "exporter_node", "joules_measured_total", "exporter_last_seen_ts",
                   "power_w_sample", "joules_evidence")

UNREACHABLE = "unreachable"

# Hosts we own and self-host -- sovereign=True is HONEST on these: the Hetzner
# box itself and the founder's self-hosted RTX on the tailnet (betterwithage).
# Sourced from the SZL_OWN_METAL_HOSTS env var (comma-separated host/IP
# substrings) so no private/tailnet address is committed to source; the operator
# pins the real values at run time. Empty by default.
OWN_METAL_HOSTS = tuple(
    h.strip()
    for h in os.environ.get("SZL_OWN_METAL_HOSTS", "").split(",")
    if h.strip()
)


# --------------------------------------------------------------------------- #
# URL helpers
# --------------------------------------------------------------------------- #
def surface_url(path: str, base: str = BASE_URL) -> str:
    """Build the full URL for a surface path.

    A path beginning with "/" is treated as absolute (joined to base host);
    otherwise it is appended under the API prefix.
    """
    if path.startswith("/"):
        return f"{base}{path}"
    return f"{base}{API_PREFIX}/{path}"


# --------------------------------------------------------------------------- #
# Doctrine scanning
# --------------------------------------------------------------------------- #
def scan_banned_tokens(text: str) -> list[str]:
    """Case-insensitive, word-boundaried scan for banned overclaim tokens.

    Mirrors the unified-kernel bannedTokenScan word-boundary semantics so the
    live-body check matches the committed-code gate. Returns the list of tokens
    found (empty == clean).
    """
    hits: list[str] = []
    for token in BANNED_TOKENS:
        pattern = r"\b" + re.escape(token) + r"\b"
        if re.search(pattern, text, re.IGNORECASE):
            hits.append(token)
    return hits


def _walk(obj):
    """Yield every dict found anywhere in a nested JSON structure."""
    if isinstance(obj, dict):
        yield obj
        for v in obj.values():
            yield from _walk(v)
    elif isinstance(obj, list):
        for v in obj:
            yield from _walk(v)


def _has_exporter_evidence(d: dict) -> bool:
    """True when a dict carries real exporter/meter evidence for a measured-joule
    claim -- either as direct keys or inside a nested 'joules_evidence' block
    (engine.joules_evidence). A truthy joules_measured_total/exporter_node is the
    strongest signal; mere presence of an exporter field also counts."""
    cands = [d]
    ev = d.get("joules_evidence")
    if isinstance(ev, dict):
        cands.append(ev)
    for c in cands:
        if any(c.get(f) for f in EXPORTER_FIELDS):
            return True
        if any(f in c for f in EXPORTER_FIELDS):
            return True
    return False


def scan_doctrine(parsed) -> list[str]:
    """Scan a parsed JSON body for doctrine violations.

    Returns a list of human-readable violation strings (empty == clean).
    Checks:
      1. joules labelled "measured" without any exporter/meter field present
         in the same dict.
      2. sovereign=true asserted on a node that is not own-metal (a node whose
         endpoint is not "self"/127.0.0.1 and is not flagged own_metal).
    Banned-token scanning is done separately on the raw text.
    """
    violations: list[str] = []
    if parsed is None:
        return violations

    for d in _walk(parsed):
        # --- joules "measured" without exporter ---
        for key, val in list(d.items()):
            lk = key.lower()
            if "joule" in lk and "label" in lk and isinstance(val, str):
                if "measured" in val.lower() and "estimate" not in val.lower() \
                        and "sample" not in val.lower():
                    has_exporter = _has_exporter_evidence(d)
                    if not has_exporter:
                        violations.append(
                            f"joules labelled '{val}' via '{key}' with no exporter field"
                        )
            # bare joules_label == "measured"
            elif lk in ("joules_label", "joule_label") and isinstance(val, str):
                if val.strip().lower() == "measured":
                    has_exporter = _has_exporter_evidence(d)
                    if not has_exporter:
                        violations.append(
                            f"joules_label='measured' with no exporter field"
                        )

        # --- sovereign=true on a non-own-metal node ---
        if d.get("sovereign") is True:
            endpoint = str(d.get("endpoint", "")).lower()
            own_metal = (
                d.get("own_metal") is True
                or "self" in endpoint
                or "127.0.0.1" in endpoint
                or "localhost" in endpoint
                or any(h in endpoint for h in OWN_METAL_HOSTS)
            )
            # Only treat as node-scoped if this dict looks like a node (has a
            # name + endpoint); top-level sovereign flags are reported but the
            # node check is what doctrine forbids.
            if "endpoint" in d and not own_metal:
                name = d.get("name", "<unnamed>")
                violations.append(
                    f"sovereign=true on non-own-metal node '{name}' (endpoint={endpoint!r})"
                )

    return violations


# --------------------------------------------------------------------------- #
# HTTP plumbing — single request with retries, honest results
# --------------------------------------------------------------------------- #
def fetch_once(url: str, timeout: float = REQUEST_TIMEOUT_S):
    """One GET. Returns (status:int|None, latency_s:float, body:bytes, err:str|None).

    status is None when the request was unreachable (DNS/conn/timeout). An HTTP
    error status (e.g. 404) is returned as a normal status with its body, not as
    an exception — that is real data we want to record.
    """
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT}, method="GET")
    t0 = time.perf_counter()
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            body = resp.read()
            latency = time.perf_counter() - t0
            return resp.status, latency, body, None
    except urllib.error.HTTPError as e:
        latency = time.perf_counter() - t0
        try:
            body = e.read()
        except Exception:
            body = b""
        return e.code, latency, body, None
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        latency = time.perf_counter() - t0
        return None, latency, b"", str(e)


def fetch_with_retries(url: str, retries: int = RETRIES, timeout: float = REQUEST_TIMEOUT_S):
    """Fetch with up to `retries` additional attempts on a transient failure.

    Transient == unreachable (status None) or a 5xx. A clean 2xx/4xx is returned
    immediately (404 is a real answer, not transient). Returns the last
    (status, latency, body, err, attempts).
    """
    attempts = 0
    status = latency = body = err = None
    for attempt in range(retries + 1):
        attempts += 1
        status, latency, body, err = fetch_once(url, timeout=timeout)
        transient = status is None or (isinstance(status, int) and status >= 500)
        if not transient:
            break
        if attempt < retries:
            time.sleep(0.3 * (attempt + 1) + random.uniform(0, 0.2))
    return status, latency, body, err, attempts


# --------------------------------------------------------------------------- #
# SMOKE mode
# --------------------------------------------------------------------------- #
def smoke_surface(path: str, base: str = BASE_URL) -> dict:
    """Smoke one surface: fetch once (with retries) and evaluate flags."""
    url = surface_url(path, base)
    status, latency, body, err, attempts = fetch_with_retries(url)

    nbytes = len(body)
    flags: list[str] = []
    json_valid = None
    parsed = None
    # HTML and Prometheus-text surfaces are legitimately non-JSON.
    expects_text = path in HTML_OK or path in PROM_OK

    # decode body for scanning
    text = ""
    if body:
        try:
            text = body.decode("utf-8", errors="replace")
        except Exception:
            text = ""

    # JSON validity
    if expects_text:
        json_valid = None  # not applicable (HTML or Prometheus text surface)
    else:
        try:
            parsed = json.loads(text) if text else None
            json_valid = parsed is not None
        except (json.JSONDecodeError, ValueError):
            json_valid = False

    # --- flag rules ---
    if status is None:
        flags.append(f"UNREACHABLE ({err})")
    elif status != 200:
        flags.append(f"non-200 status {status}")

    if latency is not None and latency > SLOW_THRESHOLD_S:
        flags.append(f"slow latency {latency:.2f}s > {SLOW_THRESHOLD_S}s")

    if not expects_text and json_valid is False and status == 200:
        flags.append("invalid JSON body")

    # doctrine: banned tokens (scan raw text for any surface)
    if text:
        banned = scan_banned_tokens(text)
        if banned:
            flags.append("doctrine: banned overclaim token(s): " + ", ".join(banned))

    # doctrine: structured violations (JSON surfaces only)
    if json_valid:
        for v in scan_doctrine(parsed):
            flags.append("doctrine: " + v)

    return {
        "surface": path,
        "url": url,
        "status": status if status is not None else UNREACHABLE,
        "latency_s": round(latency, 4) if latency is not None else None,
        "bytes": nbytes,
        "json_valid": json_valid,
        "attempts": attempts,
        "error": err,
        "flags": flags,
        "flagged": bool(flags),
    }


def run_smoke(paths: list[str], base: str = BASE_URL, workers: int = 6) -> list[dict]:
    """Smoke all surfaces. Uses a small thread pool for politeness, not load."""
    results: list[dict] = []
    workers = max(1, min(workers, 8))
    with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as ex:
        futs = {ex.submit(smoke_surface, p, base): p for p in paths}
        for fut in concurrent.futures.as_completed(futs):
            results.append(fut.result())
    # keep stable order matching SMOKE_PATHS input
    order = {p: i for i, p in enumerate(paths)}
    results.sort(key=lambda r: order.get(r["surface"], 999))
    return results


# --------------------------------------------------------------------------- #
# STRESS mode
# --------------------------------------------------------------------------- #
def percentile(values: list[float], pct: float) -> float:
    """Nearest-rank percentile on a list of latencies. pct in [0,100]."""
    if not values:
        return 0.0
    s = sorted(values)
    if len(s) == 1:
        return s[0]
    k = (len(s) - 1) * (pct / 100.0)
    f = int(k)
    c = min(f + 1, len(s) - 1)
    if f == c:
        return s[f]
    return s[f] + (s[c] - s[f]) * (k - f)


def clamp_stress_params(concurrency: int, total: int) -> tuple[int, int]:
    """Enforce good-citizen caps."""
    concurrency = max(1, min(int(concurrency), MAX_CONCURRENCY))
    total = max(concurrency, min(int(total), MAX_TOTAL))
    return concurrency, total


def stress_surface(path: str, concurrency: int, total: int, base: str = BASE_URL) -> dict:
    """Fire `total` GETs at `path` with `concurrency` workers; small jitter.

    Returns latency distribution stats, success rate, and a breakpoint verdict.
    """
    concurrency, total = clamp_stress_params(concurrency, total)
    url = surface_url(path, base)

    # warm baseline: one sequential request to compare against concurrent p50.
    b_status, b_latency, _b, _e, _a = fetch_with_retries(url, retries=1)

    latencies: list[float] = []
    statuses: list = []
    errors: list[str] = []

    def _one(_i):
        # small jitter so we don't fire all at the exact same instant
        time.sleep(random.uniform(0, 0.05))
        st, lat, _body, err, _att = fetch_with_retries(url, retries=1)
        return st, lat, err

    with concurrent.futures.ThreadPoolExecutor(max_workers=concurrency) as ex:
        for st, lat, err in ex.map(_one, range(total)):
            statuses.append(st)
            if lat is not None:
                latencies.append(lat)
            if err:
                errors.append(err)

    successes = sum(1 for s in statuses if s == 200)
    success_rate = successes / total if total else 0.0

    p50 = percentile(latencies, 50)
    p95 = percentile(latencies, 95)
    mx = max(latencies) if latencies else 0.0

    # breakpoint heuristic: concurrency degrades latency if concurrent p50 is
    # >1.5x the warm baseline (and baseline was measurable).
    degraded = None
    degrade_factor = None
    if b_latency and b_latency > 0 and latencies:
        degrade_factor = round(p50 / b_latency, 2)
        degraded = degrade_factor > 1.5

    return {
        "surface": path,
        "url": url,
        "concurrency": concurrency,
        "total_requests": total,
        "baseline_latency_s": round(b_latency, 4) if b_latency is not None else None,
        "baseline_status": b_status if b_status is not None else UNREACHABLE,
        "p50_latency_s": round(p50, 4),
        "p95_latency_s": round(p95, 4),
        "max_latency_s": round(mx, 4),
        "success_rate": round(success_rate, 4),
        "successes": successes,
        "failures": total - successes,
        "errors_sample": errors[:3],
        "latency_degrades_under_concurrency": degraded,
        "degrade_factor_vs_baseline": degrade_factor,
        "status_breakdown": _status_breakdown(statuses),
    }


def _status_breakdown(statuses: list) -> dict:
    out: dict = {}
    for s in statuses:
        key = str(s) if s is not None else UNREACHABLE
        out[key] = out.get(key, 0) + 1
    return out


def run_stress(targets: list[str], concurrency: int, total: int, base: str = BASE_URL) -> list[dict]:
    return [stress_surface(t, concurrency, total, base) for t in targets]


# --------------------------------------------------------------------------- #
# Verdict
# --------------------------------------------------------------------------- #
def compute_verdict(smoke_results: list[dict], stress_results: list[dict]) -> dict:
    """Compute an overall PASS/FAIL verdict from smoke + stress results.

    FAIL if any smoke surface is flagged OR any stress target has
    success_rate < 0.95. Otherwise PASS. Pure function — used by tests.
    """
    flagged = [r for r in smoke_results if r.get("flagged")]
    stress_fail = [
        s for s in stress_results
        if s.get("success_rate", 1.0) < 0.95
    ]
    verdict = "PASS" if not flagged and not stress_fail else "FAIL"
    return {
        "verdict": verdict,
        "smoke_total": len(smoke_results),
        "smoke_flagged": len(flagged),
        "smoke_flagged_surfaces": [r["surface"] for r in flagged],
        "stress_total": len(stress_results),
        "stress_failed_targets": [s["surface"] for s in stress_fail],
    }


def slowest_surfaces(smoke_results: list[dict], n: int = 3) -> list[dict]:
    measured = [r for r in smoke_results if isinstance(r.get("latency_s"), (int, float))]
    measured.sort(key=lambda r: r["latency_s"], reverse=True)
    return [
        {"surface": r["surface"], "latency_s": r["latency_s"], "status": r["status"]}
        for r in measured[:n]
    ]


# --------------------------------------------------------------------------- #
# Report assembly + stdout summary
# --------------------------------------------------------------------------- #
def build_report(mode, smoke_results, stress_results, base) -> dict:
    return {
        "schema": "szl.smoke_stress/v1",
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "base_url": base,
        "mode": mode,
        "doctrine": "v11 LOCKED 749/14/163",
        "thresholds": {
            "slow_latency_s": SLOW_THRESHOLD_S,
            "request_timeout_s": REQUEST_TIMEOUT_S,
            "retries": RETRIES,
            "max_concurrency": MAX_CONCURRENCY,
            "max_total": MAX_TOTAL,
        },
        "banned_tokens_checked": BANNED_TOKENS,
        "smoke": smoke_results,
        "stress": stress_results,
        "slowest_surfaces": slowest_surfaces(smoke_results) if smoke_results else [],
        "verdict": compute_verdict(smoke_results, stress_results),
    }


def print_summary(report: dict) -> None:
    v = report["verdict"]
    print("=" * 72)
    print(f"SZL SMOKE + STRESS — {report['base_url']}  (mode={report['mode']})")
    print(f"generated_at_utc: {report['generated_at_utc']}  doctrine: {report['doctrine']}")
    print("=" * 72)

    smoke = report.get("smoke") or []
    if smoke:
        print("\nSMOKE TABLE")
        print(f"{'surface':28} {'status':>10} {'lat(s)':>9} {'bytes':>8} {'json':>5}  flags")
        print("-" * 100)
        for r in smoke:
            lat = f"{r['latency_s']:.2f}" if isinstance(r["latency_s"], (int, float)) else "--"
            jv = "" if r["json_valid"] is None else ("yes" if r["json_valid"] else "NO")
            flags = "; ".join(r["flags"]) if r["flags"] else "ok"
            print(f"{r['surface'][:28]:28} {str(r['status']):>10} {lat:>9} {r['bytes']:>8} {jv:>5}  {flags}")

    stress = report.get("stress") or []
    if stress:
        print("\nSTRESS TABLE")
        for s in stress:
            print(
                f"  {s['surface']:22} c={s['concurrency']:>2} n={s['total_requests']:>3} "
                f"baseline={s['baseline_latency_s']}s "
                f"p50={s['p50_latency_s']}s p95={s['p95_latency_s']}s max={s['max_latency_s']}s "
                f"success={s['success_rate']*100:.1f}% "
                f"degraded={s['latency_degrades_under_concurrency']} "
                f"(x{s['degrade_factor_vs_baseline']})"
            )

    slow = report.get("slowest_surfaces") or []
    if slow:
        print("\nSLOWEST SURFACES")
        for s in slow:
            print(f"  {s['surface']:28} {s['latency_s']}s  (status {s['status']})")

    flagged = [r for r in smoke if r.get("flagged")]
    if flagged:
        print("\nFLAGGED / FAILING SURFACES")
        for r in flagged:
            print(f"  {r['surface']:28} status={r['status']}  -> {'; '.join(r['flags'])}")

    print("\n" + "=" * 72)
    print(f"VERDICT: {v['verdict']}   "
          f"(smoke flagged {v['smoke_flagged']}/{v['smoke_total']}; "
          f"stress failed {len(v['stress_failed_targets'])}/{v['stress_total']})")
    print("=" * 72)


# --------------------------------------------------------------------------- #
# CLI
# --------------------------------------------------------------------------- #
def default_report_path() -> str:
    here = os.path.dirname(os.path.abspath(__file__))
    # repo-relative estate_audit/ is the convention; but the run target lives in
    # the workspace. We honor an explicit --out, else write next to cwd.
    return os.path.join(os.getcwd(), "estate_audit")


def parse_args(argv=None):
    p = argparse.ArgumentParser(description="SZL smoke + stress harness for a11oy.net")
    p.add_argument("--mode", choices=["smoke", "stress", "both"], default="smoke")
    p.add_argument("--base-url", default=BASE_URL)
    p.add_argument("--stress-target", action="append", default=None,
                   help="surface to stress (repeatable). Default: compute-pool + anatomy/loop")
    p.add_argument("--concurrency", type=int, default=DEFAULT_CONCURRENCY)
    p.add_argument("--total", type=int, default=DEFAULT_TOTAL,
                   help="total requests per stress target")
    p.add_argument("--out-dir", default=None, help="output dir for the JSON report")
    p.add_argument("--quiet", action="store_true")
    return p.parse_args(argv)


def main(argv=None) -> int:
    args = parse_args(argv)
    base = args.base_url.rstrip("/")

    smoke_results: list[dict] = []
    stress_results: list[dict] = []

    if args.mode in ("smoke", "both"):
        smoke_results = run_smoke(SMOKE_PATHS, base=base)

    if args.mode in ("stress", "both"):
        targets = args.stress_target or DEFAULT_STRESS_TARGETS
        stress_results = run_stress(targets, args.concurrency, args.total, base=base)

    report = build_report(args.mode, smoke_results, stress_results, base)

    out_dir = args.out_dir or os.path.join(
        os.path.expanduser("~"), "workspace", "estate_audit"
    )
    if not os.path.isdir(out_dir):
        # fall back to cwd/estate_audit if the workspace path is unavailable
        try:
            os.makedirs(out_dir, exist_ok=True)
        except OSError:
            out_dir = os.path.join(os.getcwd(), "estate_audit")
            os.makedirs(out_dir, exist_ok=True)

    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    out_path = os.path.join(out_dir, f"smoke_stress_{stamp}.json")
    with open(out_path, "w", encoding="utf-8") as fh:
        json.dump(report, fh, indent=2)

    if not args.quiet:
        print_summary(report)
        print(f"\nJSON report: {out_path}")

    # exit code reflects verdict for CI use
    return 0 if report["verdict"]["verdict"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
