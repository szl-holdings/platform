#!/usr/bin/env python3
# ATTRIBUTION: companion test for szl_smoke_stress.py. Independent SZL
# implementation. Stdlib only. Doctrine v11 LOCKED 749/14/163.
"""Tests for the SZL Smoke + Stress Harness.

Offline-only: every assertion runs against pure functions and mock data — no
network is required, so this is safe in CI. Verifies:
  1. The module parses / imports cleanly.
  2. The smoke surface list is complete (all expected live surfaces present).
  3. URL building (API-prefixed vs absolute) is correct.
  4. Doctrine scanning: banned tokens, joules-measured-without-exporter, and
     sovereign-true-on-non-own-metal-node all fire on mock bodies, and honest
     bodies pass clean.
  5. The PASS/FAIL verdict logic behaves correctly on mock data.
  6. Stress params are clamped to the good-citizen caps (concurrency <= 50,
     total <= 200).
  7. percentile() math is correct.

Run with:  python tools/test_smoke_stress.py
Exits non-zero on any failure.
"""

from __future__ import annotations

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import szl_smoke_stress as ss  # noqa: E402

PASS = 0
FAIL = 0


def check(name: str, cond: bool):
    global PASS, FAIL
    if cond:
        PASS += 1
        print(f"  PASS  {name}")
    else:
        FAIL += 1
        print(f"  FAIL  {name}")


# --------------------------------------------------------------------------- #
# 1. module parses / imports
# --------------------------------------------------------------------------- #
def test_imports():
    print("\n[1] module parses & exposes API")
    for fn in ("run_smoke", "run_stress", "smoke_surface", "stress_surface",
               "compute_verdict", "scan_doctrine", "scan_banned_tokens",
               "percentile", "clamp_stress_params", "surface_url", "main"):
        check(f"has {fn}", hasattr(ss, fn) and callable(getattr(ss, fn)))


# --------------------------------------------------------------------------- #
# 2. surface list complete
# --------------------------------------------------------------------------- #
def test_surface_list():
    print("\n[2] smoke surface list complete")
    expected = {
        "harvest/posture", "harvest/metrics", "energy/budget", "energy/provenance",
        "engine/status", "anatomy/loop", "heart/pulse", "ayni", "formula/sovereign",
        "qbio/coherence", "formulas/index", "revenue/marketplace", "revenue/estimate",
        "revenue/thesis", "research/prereg", "research/verify", "harvest/datacenters",
        "compute-pool", "verify/healthz", "wayra/summary", "/router/health",
    }
    actual = set(ss.SMOKE_PATHS)
    missing = expected - actual
    extra = actual - expected
    check(f"no missing surfaces (missing={missing})", not missing)
    check(f"no unexpected surfaces (extra={extra})", not extra)
    check("21 surfaces total", len(ss.SMOKE_PATHS) == 21)
    check("/router/health is the only absolute path",
          [p for p in ss.SMOKE_PATHS if p.startswith("/")] == ["/router/health"])


# --------------------------------------------------------------------------- #
# 3. URL building
# --------------------------------------------------------------------------- #
def test_url_building():
    print("\n[3] URL building")
    check("api-prefixed path",
          ss.surface_url("compute-pool") == "https://a-11-oy.com/api/a11oy/v1/compute-pool")
    check("absolute path",
          ss.surface_url("/router/health") == "https://a-11-oy.com/router/health")


# --------------------------------------------------------------------------- #
# 4. doctrine scanning
# --------------------------------------------------------------------------- #
def test_doctrine_banned():
    print("\n[4a] banned overclaim tokens")
    check("flags 'world-class'", ss.scan_banned_tokens("our world-class engine") == ["world-class"])
    check("flags 'revolutionary'", "revolutionary" in ss.scan_banned_tokens("a revolutionary leap"))
    check("clean body passes", ss.scan_banned_tokens("status ok, nodes reachable") == [])
    # word-boundaried: 'premiere' substring should NOT match 'premier'
    check("word-boundaried (no substring match)",
          ss.scan_banned_tokens("the film premiered last night") == [])


def test_doctrine_joules():
    print("\n[4b] joules measured-without-exporter")
    # violation: measured label, no exporter
    bad = {"joules_label": "measured", "sovereign": False}
    check("flags joules measured w/o exporter", any("exporter" in v for v in ss.scan_doctrine(bad)))
    # honest: estimate/sample label
    ok1 = {"total_joules_est_label": "SAMPLE/ESTIMATE (no real power meter wired)"}
    check("estimate label is clean", ss.scan_doctrine(ok1) == [])
    # honest: measured WITH an exporter field
    ok2 = {"joules_label": "measured", "exporter": "prometheus-node-exporter"}
    check("measured WITH exporter is clean",
          not any("exporter" in v for v in ss.scan_doctrine(ok2)))


def test_doctrine_sovereign():
    print("\n[4c] sovereign-true on non-own-metal node")
    bad = {"nodes": [{"name": "rented-gpu", "endpoint": "10.2.3.4:8000", "sovereign": True}]}
    check("flags sovereign node on remote endpoint",
          any("non-own-metal" in v for v in ss.scan_doctrine(bad)))
    ok = {"nodes": [{"name": "hetzner-box", "endpoint": "127.0.0.1 (self)", "sovereign": True}]}
    check("sovereign on self/own-metal is clean",
          not any("non-own-metal" in v for v in ss.scan_doctrine(ok)))


# --------------------------------------------------------------------------- #
# 5. verdict logic
# --------------------------------------------------------------------------- #
def test_verdict():
    print("\n[5] PASS/FAIL verdict logic")
    clean_smoke = [{"surface": "a", "flagged": False}, {"surface": "b", "flagged": False}]
    clean_stress = [{"surface": "compute-pool", "success_rate": 1.0}]
    v = ss.compute_verdict(clean_smoke, clean_stress)
    check("all clean -> PASS", v["verdict"] == "PASS")

    flagged_smoke = [{"surface": "a", "flagged": True}, {"surface": "b", "flagged": False}]
    v2 = ss.compute_verdict(flagged_smoke, clean_stress)
    check("any smoke flag -> FAIL", v2["verdict"] == "FAIL")
    check("flagged surface listed", "a" in v2["smoke_flagged_surfaces"])

    bad_stress = [{"surface": "compute-pool", "success_rate": 0.80}]
    v3 = ss.compute_verdict(clean_smoke, bad_stress)
    check("low success rate -> FAIL", v3["verdict"] == "FAIL")
    check("failed target listed", "compute-pool" in v3["stress_failed_targets"])


# --------------------------------------------------------------------------- #
# 6. concurrency / total caps
# --------------------------------------------------------------------------- #
def test_caps():
    print("\n[6] good-citizen caps")
    c, t = ss.clamp_stress_params(1000, 99999)
    check("concurrency capped at 50", c == ss.MAX_CONCURRENCY == 50)
    check("total capped at 200", t == ss.MAX_TOTAL == 200)
    c2, t2 = ss.clamp_stress_params(25, 50)
    check("normal params unchanged", (c2, t2) == (25, 50))
    c3, t3 = ss.clamp_stress_params(0, 0)
    check("concurrency floored at 1", c3 == 1)
    check("total >= concurrency", t3 >= c3)


# --------------------------------------------------------------------------- #
# 7. percentile math
# --------------------------------------------------------------------------- #
def test_percentile():
    print("\n[7] percentile math")
    data = [1.0, 2.0, 3.0, 4.0, 5.0]
    check("p50 of 1..5 == 3.0", abs(ss.percentile(data, 50) - 3.0) < 1e-9)
    check("p100 == max", ss.percentile(data, 100) == 5.0)
    check("empty -> 0.0", ss.percentile([], 95) == 0.0)
    check("single value", ss.percentile([2.5], 95) == 2.5)


def main():
    test_imports()
    test_surface_list()
    test_url_building()
    test_doctrine_banned()
    test_doctrine_joules()
    test_doctrine_sovereign()
    test_verdict()
    test_caps()
    test_percentile()
    print(f"\n{'='*50}\nRESULT: {PASS} passed, {FAIL} failed\n{'='*50}")
    return 1 if FAIL else 0


if __name__ == "__main__":
    raise SystemExit(main())
