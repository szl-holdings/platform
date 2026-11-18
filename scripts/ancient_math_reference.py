#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Independent, exact arithmetic for 50 Egyptian-style 2/n fractions.

The owned TypeScript implementation is in packages/reconciliation/src/unit-fractions.ts.
This verifier tests mathematical 2/n identities, NOT historical RMP table entries.
It does not read or mutate the separate A11oy Akhmim/RMP manuscript table.
No network, database, GPU, model, signer or release authority is involved.
"""
from __future__ import annotations

from decimal import Decimal, localcontext
from fractions import Fraction
from hashlib import sha256
import json
import math
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "packages/reconciliation/src/unit-fractions.ts"
ODD_TARGETS = tuple(range(3, 102, 2))
MAX_BYTES = 125_000


class InvalidMathematics(ValueError):
    """Bounded diagnostic, never raw input content."""


def greedy_unit_fractions(value: Fraction) -> tuple[int, ...]:
    """Independent Fibonacci–Sylvester recurrence with exact rationals."""
    if not Fraction(0) < value < Fraction(1):
        raise InvalidMathematics("OUT_OF_DOMAIN_FRACTION")
    terms = []
    for _ in range(64):
        numerator, denominator = value.numerator, value.denominator
        d = (denominator + numerator - 1) // numerator
        if d <= 0 or (terms and d <= terms[-1]):
            raise InvalidMathematics("NON_DISTINCT_UNIT_DENOMINATOR")
        terms.append(d)
        value -= Fraction(1, d)
        if value == 0:
            return tuple(terms)
    raise InvalidMathematics("GREEDY_ITERATION_LIMIT")


def verify_targets() -> dict[str, object]:
    counts = []
    for n in ODD_TARGETS:
        decomposition = greedy_unit_fractions(Fraction(2, n))
        if sum((Fraction(1, d) for d in decomposition), Fraction(0)) != Fraction(2, n):
            raise InvalidMathematics("EGYPTIAN_FRACTION_IDENTITY")
        if len(set(decomposition)) != len(decomposition):
            raise InvalidMathematics("EGYPTIAN_FRACTION_UNIQUE")
        counts.append(len(decomposition))
    if len(counts) != 50:
        raise InvalidMathematics("EGYPTIAN_TARGET_COUNT")
    return {
        "odd_targets_verified": len(counts),
        "greedy_max_terms": max(counts),
        "historical_rhind_entries_compared": False,
    }


def verify_other_math() -> dict[str, object]:
    with localcontext() as ctx:
        ctx.prec = 60
        vedic = Decimal(1) + Decimal(1) / 3 + Decimal(1) / 12 - Decimal(1) / 408
        error = abs(vedic - Decimal(2).sqrt())
        if not Decimal("0.000002") < error < Decimal("0.0000022"):
            raise InvalidMathematics("VEDIC_ERROR_BOUND")
        squared = Decimal(1)
        estimates = []
        for k in range(10):
            estimates.append(Decimal(6 * 2**k) * squared.sqrt() / 2)
            squared = squared / (2 + (4 - squared).sqrt())
        if not all(a < b for a, b in zip(estimates, estimates[1:])):
            raise InvalidMathematics("LIU_HUI_SAMPLE_MONOTONICITY")
        if not Decimal("3.141") < estimates[-1] < Decimal("3.142"):
            raise InvalidMathematics("LIU_HUI_SAMPLE_BOUND")
    if math.lcm(365, 260) != 18980:
        raise InvalidMathematics("MAYA_LCM")
    if Fraction(328, 41) != 8 or Fraction(32800, 36524) == 8:
        raise InvalidMathematics("INCA_UNIT_CONFLATION")
    if Fraction(248, 3) == 64:
        raise InvalidMathematics("E8_FALSE_EQUALITY")
    if Fraction(584) - Fraction(58392, 100) != Fraction(2, 25):
        raise InvalidMathematics("VENUS_DRIFT_ARITHMETIC")
    return {
        "maya_lcm": 18980,
        "inca_huacas_per_ceque": "8",
        "inca_huacas_per_solar_day": str(Fraction(32800, 36524)),
        "vedic_absolute_error": "between 2e-6 and 2.2e-6",
        "liu_hui_numeric_steps": len(estimates),
        "ideal_venus_cycle_difference_days": "2/25",
        "e8_248_over_3_equals_64": False,
    }


def audit(source: bytes) -> dict[str, object]:
    if not 0 < len(source) <= MAX_BYTES:
        raise InvalidMathematics("SOURCE_SIZE_BOUND")
    try:
        decoded = source.decode("utf-8")
    except UnicodeError:
        raise InvalidMathematics("SOURCE_ENCODING") from None
    for required in (
        "export function decomposeUnitFraction(",
        "export function reconstructFraction(",
        "newP = a * np - nq",
    ):
        if required not in decoded:
            raise InvalidMathematics("TYPESCRIPT_SOURCE_CONTRACT_DRIFT")
    return {
        "schema": "szl.ancient-math-exact-reference/v1",
        "state": "INDEPENDENT_GREEDY_IDENTITIES_VERIFIED",
        "source_path": "packages/reconciliation/src/unit-fractions.ts",
        "source_sha256": sha256(source).hexdigest(),
        "ts_functionality_verified_here": False,
        "rmp_historical_table_verified_here": False,
        "greedy_fraction_verification": verify_targets(),
        "derived_mathematics": verify_other_math(),
        "historical_attribution_verified": False,
        "lean_completeness_verified": False,
        "release_or_deployment_authorized": False,
        "provider_writes": 0,
    }


def main() -> int:
    if sys.argv[1:] != ["--check"]:
        print("ANCIENT_MATH_HOLD:INVALID_ARGUMENTS", file=sys.stderr)
        return 2
    try:
        result = audit(SOURCE.read_bytes())
    except (OSError, InvalidMathematics) as exc:
        reason = str(exc) if isinstance(exc, InvalidMathematics) else "SOURCE_UNAVAILABLE"
        print("ANCIENT_MATH_HOLD:" + reason, file=sys.stderr)
        return 2
    print(json.dumps(result, sort_keys=True, separators=(",", ":"), allow_nan=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
