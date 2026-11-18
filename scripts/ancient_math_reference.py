#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Independent exact-arithmetic cross-check of SZL's ancient-math data table.

No network, GPU, model, database, signer, payment or runtime admission.
Source: web/packages/a11oy-core/src/thresholds/akhmim-table.ts
The historical attribution remains distinct from arithmetical correctness.
"""
from __future__ import annotations

from decimal import Decimal, localcontext
from fractions import Fraction
from hashlib import sha256
import json
import math
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
TABLE_PATH = ROOT / "web/packages/a11oy-core/src/thresholds/akhmim-table.ts"
TABLE_HEAD = re.compile(
    r"export const RMP_TWO_OVER_N:[\s\S]*?= new Map\(\[([\s\S]*?)\]\);"
)
TABLE_ENTRY = re.compile(r"\[\s*(\d+)\s*,\s*\[([0-9,\s]+)\]\s*\]")
EXPECTED_DENOMINATORS = set(range(3, 102, 2))
MAX_BYTES = 125_000


class InvalidMathematics(ValueError):
    """Constant error codes without leaking arbitrary source text."""


def parse_table(source: str) -> dict[int, tuple[int, ...]]:
    match = TABLE_HEAD.search(source)
    if not match:
        raise InvalidMathematics("RMP_TABLE_NOT_FOUND")
    fragment = match.group(1)
    rows = TABLE_ENTRY.findall(fragment)
    # All non-entry content must consist only of expected separators/whitespace.
    residual = TABLE_ENTRY.sub("", fragment)
    if re.sub(r"[\s,]", "", residual):
        raise InvalidMathematics("RMP_TABLE_UNRECOGNIZED_SYNTAX")
    if len(rows) != 50:
        raise InvalidMathematics("RMP_TABLE_CARDINALITY")
    table: dict[int, tuple[int, ...]] = {}
    for numerator, parts_csv in rows:
        n = int(numerator)
        parts = tuple(int(x.strip()) for x in parts_csv.split(",") if x.strip())
        if n in table or n not in EXPECTED_DENOMINATORS:
            raise InvalidMathematics("RMP_TABLE_DENOMINATOR")
        if not parts or any(p <= 0 for p in parts) or len(parts) != len(set(parts)):
            raise InvalidMathematics("RMP_INVALID_UNIT_DENOMINATOR")
        table[n] = parts
    if set(table) != EXPECTED_DENOMINATORS:
        raise InvalidMathematics("RMP_TABLE_COVERAGE")
    return table


def verify_table(table: dict[int, tuple[int, ...]]) -> int:
    if len(table) != 50 or set(table) != EXPECTED_DENOMINATORS:
        raise InvalidMathematics("RMP_TABLE_COVERAGE")
    for n, parts in table.items():
        if not parts or any(p <= 0 for p in parts) or len(set(parts)) != len(parts):
            raise InvalidMathematics("RMP_INVALID_UNIT_DENOMINATOR")
        if sum((Fraction(1, p) for p in parts), Fraction(0)) != Fraction(2, n):
            raise InvalidMathematics("RMP_FRACTION_IDENTITY_FAILED")
    return len(table)


def check_derived_mathematics() -> dict[str, str | int]:
    with localcontext() as ctx:
        ctx.prec = 60
        vedic = Decimal(1) + Decimal(1) / 3 + Decimal(1) / 12 - Decimal(1) / 408
        error = abs(vedic - Decimal(2).sqrt())
        if not Decimal("0.000002") < error < Decimal("0.0000022"):
            raise InvalidMathematics("VEDIC_ERROR_BOUND_INVALID")
        side_squared = Decimal(1)
        estimates = []
        for k in range(10):
            estimate = Decimal(6 * (2**k)) * side_squared.sqrt() / 2
            estimates.append(estimate)
            side_squared = side_squared / (2 + (4 - side_squared).sqrt())
        if not all(a < b for a, b in zip(estimates, estimates[1:])):
            raise InvalidMathematics("LIU_HUI_SAMPLE_MONOTONICITY")
        if not Decimal("3.141") < estimates[-1] < Decimal("3.142"):
            raise InvalidMathematics("LIU_HUI_SAMPLE_BOUNDS")
    if math.lcm(365, 260) != 18980:
        raise InvalidMathematics("MAYA_LCM_INVALID")
    if Fraction(328, 41) != 8 or Fraction(328, 36524) * 100 == 8:
        raise InvalidMathematics("INCA_DIMENSIONAL_CONFLATION")
    if Fraction(248, 3) == 64:
        raise InvalidMathematics("E8_INCORRECT_EQUALITY")
    if Fraction(584) - Fraction(58392, 100) != Fraction(2, 25):
        raise InvalidMathematics("VENUS_IDEALIZED_DRIFT_INVALID")
    return {
        "maya_lcm_days": 18980,
        "inca_huacas_per_ceque": "8",
        "inca_modeled_huacas_per_solar_day": str(Fraction(32800, 36524)),
        "vedic_error_bound": "between 2e-6 and 2.2e-6",
        "liu_hui_sample_steps": len(estimates),
        "dresden_ideal_minus_reference_days_per_cycle": "2/25",
        "e8_248_over_3_equals_64": "FALSE",
    }


def audit(source: bytes) -> dict[str, object]:
    if not source or len(source) > MAX_BYTES:
        raise InvalidMathematics("SOURCE_SIZE_BOUND")
    try:
        text = source.decode("utf-8")
    except UnicodeError:
        raise InvalidMathematics("SOURCE_UTF8_REQUIRED") from None
    entries = verify_table(parse_table(text))
    return {
        "schema": "szl.ancient-math-exact-reference/v1",
        "state": "EXACT_TABLE_IDENTITIES_AND_SAMPLED_MATH_VERIFIED",
        "source_sha256": sha256(source).hexdigest(),
        "source_scope": "TRACKED_LOCAL_TYPESCRIPT_TABLE_NOT_LIVE_RUNTIME",
        "verified_egyptian_unit_fraction_entries": entries,
        "derived_mathematics": check_derived_mathematics(),
        "historical_attribution_verified": False,
        "lean_completeness_verified": False,
        "release_or_deployment_authorized": False,
        "no_external_writes": True,
    }


def main() -> int:
    if len(sys.argv) != 2 or sys.argv[1] != "--check":
        print("ANCIENT_MATH_HOLD:INVALID_ARGUMENTS", file=sys.stderr)
        return 2
    try:
        result = audit(TABLE_PATH.read_bytes())
    except (OSError, InvalidMathematics) as exc:
        code = str(exc) if isinstance(exc, InvalidMathematics) else "SOURCE_UNAVAILABLE"
        print("ANCIENT_MATH_HOLD:" + code, file=sys.stderr)
        return 2
    print(json.dumps(result, sort_keys=True, separators=(",", ":"), allow_nan=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
