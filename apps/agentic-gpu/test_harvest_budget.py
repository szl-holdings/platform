#!/usr/bin/env python3
"""test_harvest_budget.py — Self-test for harvest_budget.py (no network required).

Proves five properties of the formula-grounded soak budget:
  (a) Bekenstein additive cap REFUSES the over-budget job
  (b) Landauer floor is NEVER undercut by a SAMPLE estimate
  (c) SoakLedger is MONOTONE
  (d) Ouroboros bound HALTS a runaway loop
  (e) Reactive preemption still wins (soak gate=False when posture=normal)

Posture is stubbed as negative-price (no network call).
Prints: ok:true checks:N

Doctrine note: joule figures stay SAMPLE/ESTIMATE throughout; the Bekenstein
cap is on INFORMATION (bits), which IS provable by the Lean theorems cited.
"""
from __future__ import annotations
import sys
import os

# Make harvest_budget importable when run from the repo root
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from harvest_budget import (
    bekenstein_info_cap,
    BekensteinAccumulator,
    landauer_floor_joules,
    assert_sample_beats_landauer_floor,
    SoakLedger,
    OuroborosBudget,
    OUROBOROS_MAX_SOAK_STEPS,
    plan_soak,
)

checks = 0


def ok(name: str) -> None:
    global checks
    checks += 1
    print(f"  check {checks:02d}: {name}")


# ============================================================
# (a) Bekenstein additive cap REFUSES the over-budget job
# ============================================================
print("\n[a] Bekenstein additive cap")

# cap = 10 bytes * 8 = 80 bits
acc = BekensteinAccumulator(window_cap_bytes=10)
assert acc.cap_bits == 80

r1 = acc.try_admit("job_A", 40)   # 40 <= 80: admit
assert r1, "job_A (40 bits) should be admitted within 80-bit cap"
ok("bekenstein: job_A (40 bits) admitted within 80-bit cap")

r2 = acc.try_admit("job_B", 30)   # 70 <= 80: admit
assert r2, "job_B (30 bits, total 70) should be admitted"
ok("bekenstein: job_B (30 bits, cumulative 70) admitted")

r3 = acc.try_admit("job_C", 20)   # 90 > 80: REFUSED
assert not r3, "job_C (20 bits, would make 90 > 80) must be REFUSED"
ok("bekenstein: job_C (20 bits, would exceed 80-bit cap) REFUSED")

assert acc.used_bits == 70, f"used_bits should be 70, got {acc.used_bits}"
ok("bekenstein: state unchanged after refusal (used_bits=70)")

# Additive property: cap(n+m) = cap(n) + cap(m)
n, m = 10, 5
assert bekenstein_info_cap(n + m) == bekenstein_info_cap(n) + bekenstein_info_cap(m)
ok("bekenstein: cap(n+m) == cap(n)+cap(m)  [bekenstein_bound_additive PR #239]")

# ============================================================
# (b) Landauer floor is NEVER undercut by a SAMPLE estimate
# ============================================================
print("\n[b] Landauer floor guard")

floor_300K = landauer_floor_joules(1000, temp_K=300.0)
assert floor_300K > 0, "Landauer floor must be positive for 1000 bits at 300 K"
ok("landauer: floor > 0 for 1000 bits at 300 K  [landauer_floor_pos PR #240]")

# Legitimate SAMPLE estimate (10x floor): passes
try:
    assert_sample_beats_landauer_floor(1000, floor_300K * 10, temp_K=300.0)
    ok("landauer: 10x-floor SAMPLE estimate accepted (not over-unity)")
except AssertionError as e:
    raise AssertionError(f"(b) legitimate estimate should NOT raise: {e}")

# Sub-floor SAMPLE estimate (forbidden over-unity claim): must raise
violation_raised = False
try:
    assert_sample_beats_landauer_floor(1000, floor_300K * 0.5, temp_K=300.0)
except AssertionError:
    violation_raised = True
assert violation_raised, "(b) sub-floor SAMPLE estimate must raise AssertionError"
ok("landauer: sub-floor SAMPLE estimate REFUSED (over-unity guard)")

# Zero estimate (unknown): always passes
assert_sample_beats_landauer_floor(1000, 0.0, temp_K=300.0)
ok("landauer: joules_est=0 (unknown) always passes (doctrine)")

# Additivity: floor(n+m) = floor(n) + floor(m) for same q
f_n = landauer_floor_joules(500, temp_K=300.0)
f_m = landauer_floor_joules(500, temp_K=300.0)
f_nm = landauer_floor_joules(1000, temp_K=300.0)
assert abs(f_n + f_m - f_nm) < 1e-40, "floor additivity"
ok("landauer: floor(n+m) == floor(n)+floor(m)  [landauer_floor_additive PR #240]")

# ============================================================
# (c) SoakLedger is MONOTONE
# ============================================================
print("\n[c] SoakLedger monotonicity")

ledger = SoakLedger()
assert ledger.total_info_bits == 0
ok("ledger: starts at 0 bits")

prev = 0
for i, bits in enumerate([100, 200, 50, 0, 300]):
    ledger.append(f"job_{i}", bits, joules_sample=bits * 2.9e-21)
    assert ledger.total_info_bits >= prev, f"monotonicity violated at step {i}"
    prev = ledger.total_info_bits
ok("ledger: monotone-nondecreasing through 5 appends (incl. zero)  [energy_ledger_monotone PR #239]")

# All entries have joules_label='sample' (doctrine)
for entry in ledger.entries:
    assert entry.joules_label == "sample", f"joules_label must be 'sample', got {entry.joules_label}"
ok("ledger: all entries carry joules_label='sample' (doctrine)")

prov = ledger.provenance()
assert prov["ledger_monotone"] is True
ok("ledger: provenance block has ledger_monotone=True")

# ============================================================
# (d) Ouroboros bound HALTS a runaway loop
# ============================================================
print("\n[d] Ouroboros bounded-recursion halt")

budget = OuroborosBudget(max_steps=4)
iterations = 0
while budget.step():
    iterations += 1
assert iterations == 4, f"loop should run exactly 4 times, got {iterations}"
ok("ouroboros: runaway loop halted at max_steps=4  [loop-kernel.ts maxSteps]")

assert budget.is_exhausted, "budget.is_exhausted must be True after cap"
ok("ouroboros: is_exhausted=True after cap")

assert budget.exit_reason == "budgetExhausted"
ok("ouroboros: exit_reason='budgetExhausted'  [loop-kernel.ts pattern]")

# Further step() calls return False — loop cannot resume
assert not budget.step()
assert not budget.step()
ok("ouroboros: exhausted budget returns False on all subsequent step() calls")

# Default cap is OUROBOROS_MAX_SOAK_STEPS (32)
big_budget = OuroborosBudget()
count = 0
while big_budget.step():
    count += 1
assert count == OUROBOROS_MAX_SOAK_STEPS, f"default cap should be {OUROBOROS_MAX_SOAK_STEPS}"
ok(f"ouroboros: default max_steps={OUROBOROS_MAX_SOAK_STEPS} enforced")

# ============================================================
# (e) Reactive preemption still wins
# ============================================================
print("\n[e] Reactive preemption")

normal_window = {
    "posture": "normal",
    "wasted_energy_available": False,
    "soak_hard": False,
    "joules_label": "sample",
}
reactive_job = [{"id": "reactive", "info_bits": 100, "joules_est": 0.0}]
plan_e = plan_soak(normal_window, reactive_job, window_cap_bytes=200)

assert len(plan_e.admitted) == 0, "(e) no jobs admitted in normal posture"
ok("reactive: soak admits 0 jobs when posture=normal (reactive preempts)")

assert len(plan_e.refused) == 1
ok("reactive: reactive job placed in refused (not processed by sponge)")

assert plan_e.ouroboros_exit_reason == "posture_gate"
ok("reactive: exit_reason='posture_gate' confirms reactive preemption")

# Verify end-to-end plan_soak with negative-price stub
neg_price_window = {
    "posture": "negative-price",
    "wasted_energy_available": True,
    "soak_hard": True,
    "joules_label": "sample",
    "source": "stub (no network)",
}
jobs_full = [
    {"id": "batch_A", "info_bits": 40, "joules_est": 1.5e-17},   # admitted
    {"id": "batch_B", "info_bits": 30, "joules_est": 1.2e-17},   # admitted
    {"id": "batch_C", "info_bits": 20, "joules_est": 8.0e-18},   # refused (cap)
]
plan_full = plan_soak(neg_price_window, jobs_full, window_cap_bytes=10)
assert len(plan_full.admitted) == 2
ok("e2e: 2 jobs admitted in negative-price window within 80-bit Bekenstein cap")
assert len(plan_full.refused) == 1
assert plan_full.refused[0]["refused_reason"] == "bekenstein_cap_exceeded"
ok("e2e: 3rd job refused with reason='bekenstein_cap_exceeded'")
assert plan_full.bekenstein_used_bits <= plan_full.bekenstein_cap_bits
ok("e2e: bekenstein_used_bits <= bekenstein_cap_bits (invariant holds)")
assert plan_full.ledger.total_info_bits == 70
ok("e2e: SoakLedger total_info_bits=70 (40+30, monotone, admitted only)")
assert plan_full.joules_label == "sample"
ok("e2e: joules_label='sample' in plan output (doctrine)")
assert len(plan_full.proven_bounds_respected) >= 4
ok(f"e2e: {len(plan_full.proven_bounds_respected)} proven bound citations in plan")

# ============================================================
# Summary
# ============================================================
print(f"\nok:true checks:{checks}")
sys.exit(0)
