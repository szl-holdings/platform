"""
numeric_harness.py — pytest-style numeric checks for each formula's claimed
identity. Provides:
  - check_identity(spec, trials): run the identity predicate over N sampled
    inputs; returns (passed, total, failures).
  - run_all(trials): harness over all 23 formulas.

The pytest test module (tests/test_numeric_harness.py) imports these and asserts
one test per formula identity PLUS targeted edge-case tests, to realize the
"50/50 baseline" from the PURIQ Formula Suite LAKE_TEST_PLAN.

Author: Yachay (CTO), SZL Holdings. 2026-06-01.
"""
from __future__ import annotations
import random
from dataclasses import dataclass, field

from .registry import SPECS, BY_ID, FormulaSpec


@dataclass
class HarnessResult:
    formula_id: str
    passed: int
    total: int
    failures: list[str] = field(default_factory=list)

    @property
    def ok(self) -> bool:
        return self.passed == self.total


def check_identity(spec: FormulaSpec, trials: int = 100, seed: int = 12345) -> HarnessResult:
    rng = random.Random(seed + hash(spec.fid) % 10000)
    passed = 0
    failures: list[str] = []
    for _ in range(trials):
        args = spec.sampler(rng)
        try:
            if spec.identity(*args):
                passed += 1
            else:
                failures.append(f"identity False on args={repr(args)[:120]}")
        except Exception as e:
            failures.append(f"{type(e).__name__}: {e} on args={repr(args)[:120]}")
    return HarnessResult(spec.fid, passed, trials, failures[:5])


def run_all(trials: int = 100) -> list[HarnessResult]:
    return [check_identity(s, trials) for s in SPECS]
