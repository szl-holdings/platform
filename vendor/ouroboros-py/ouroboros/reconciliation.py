"""Egyptian-mathematics primitives — Python port.

Faithful reimplementation of packages/reconciliation/src/*.ts. The numerical
behaviour matches the TypeScript runtime bit-exact for integer operations
and within IEEE-754 tolerance for floating-point operations.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field
from fractions import Fraction
from typing import Literal

# --- Frustum reconciliation (MMP-14, Liu Hui) -----------------------------

@dataclass(frozen=True)
class WitnessView:
    """A single witness's view of a closed-loop release."""
    id: str
    leaves: tuple[str, ...]
    source: str | None = None


Verdict = Literal["RECONCILED", "DIVERGENT", "INSUFFICIENT"]


@dataclass(frozen=True)
class ReconciliationReport:
    verdict: Verdict
    union_volume: int
    intersection_volume: int
    per_witness_volume: tuple[int, ...]
    mean_volume: float
    max_symmetric_difference: int
    gaps: tuple[dict, ...]


def reconcile_frustum(views: list[WitnessView]) -> ReconciliationReport:
    """The MMP-14 / Liu Hui reconciliation. Requires exactly three views.

    A runtime release is reconciled iff all three witnesses observe the
    same set of distinct released-bit hashes.
    """
    if len(views) != 3:
        return ReconciliationReport(
            verdict="INSUFFICIENT",
            union_volume=0,
            intersection_volume=0,
            per_witness_volume=tuple(len(set(v.leaves)) for v in views),
            mean_volume=0.0,
            max_symmetric_difference=0,
            gaps=(),
        )

    sets = [set(v.leaves) for v in views]
    per_witness_volume = tuple(len(s) for s in sets)
    mean_volume = sum(per_witness_volume) / 3

    union: set[str] = set().union(*sets)
    intersection: set[str] = sets[0] & sets[1] & sets[2]

    max_sym = 0
    for i in range(3):
        for j in range(i + 1, 3):
            sd = len(sets[i] ^ sets[j])
            if sd > max_sym:
                max_sym = sd

    gaps = tuple(
        {"witnessId": views[i].id, "missing": len(union) - len(sets[i])}
        for i in range(3)
    )

    verdict: Verdict = (
        "RECONCILED" if len(union) == len(intersection) and max_sym == 0 else "DIVERGENT"
    )

    return ReconciliationReport(
        verdict=verdict,
        union_volume=len(union),
        intersection_volume=len(intersection),
        per_witness_volume=per_witness_volume,
        mean_volume=mean_volume,
        max_symmetric_difference=max_sym,
        gaps=gaps,
    )


def frustum_formula(report: ReconciliationReport) -> str:
    """Render the MMP-14 closed form V_T = (h/3)(a² + ab + b²) for the audit log."""
    pwv = report.per_witness_volume
    a = pwv[0] if len(pwv) > 0 else 0
    b = pwv[2] if len(pwv) > 2 else 0
    v = (1 / 3) * (a * a + a * b + b * b)
    return f"V_T = (1/3)({a}² + {a}·{b} + {b}²) = {v:.2f}"


# --- Seked slope audit (RMP 56–60) ----------------------------------------

PALMS_PER_CUBIT = 7
GREAT_PYRAMID_SEKED = 5.5

SekedVerdict = Literal["STABLE", "RISING", "SATURATING", "VERTICAL"]


@dataclass(frozen=True)
class SekedReading:
    seked: float
    palms: float
    cubits: float
    verdict: SekedVerdict


def compute_seked(dx: float, dy: float) -> SekedReading:
    """Egyptian inverse-slope: 7 · Δx / Δy. Bounded near saturation."""
    if dy < 0 or dx < 0:
        raise ValueError("seked: dx and dy must both be non-negative")
    if dy == 0:
        return SekedReading(
            seked=math.inf, palms=PALMS_PER_CUBIT, cubits=0, verdict="VERTICAL"
        )
    seked = (PALMS_PER_CUBIT * dx) / dy
    verdict: SekedVerdict
    if seked >= 7:
        verdict = "STABLE"
    elif seked >= 5:
        verdict = "RISING"
    elif seked > 0:
        verdict = "SATURATING"
    else:
        verdict = "VERTICAL"
    return SekedReading(seked=seked, palms=seked, cubits=1, verdict=verdict)


def seked_to_degrees(seked: float) -> float:
    """Convert seked to slope angle in degrees."""
    if not math.isfinite(seked) or seked <= 0:
        return 90.0
    return math.degrees(math.atan(PALMS_PER_CUBIT / seked))


# --- Unit-fraction decomposition (RMP 2/n table) --------------------------

@dataclass(frozen=True)
class UnitFractionDecomposition:
    numerator: int
    denominator: int
    terms: tuple[int, ...]
    exact: bool


def decompose_unit_fraction(p: int, q: int) -> UnitFractionDecomposition:
    """Greedy (Fibonacci-Sylvester) unit-fraction decomposition of p/q."""
    if not (isinstance(p, int) and isinstance(q, int)):
        raise TypeError("decompose_unit_fraction: p and q must be integers")
    if p <= 0 or q <= 0:
        raise ValueError("decompose_unit_fraction: p and q must be positive")
    if p >= q:
        raise ValueError("decompose_unit_fraction: requires p < q")

    terms: list[int] = []
    np_, nq_ = p, q
    for _ in range(64):
        if np_ == 0:
            break
        a = -(-nq_ // np_)  # ceil(nq / np)
        terms.append(a)
        new_p = a * np_ - nq_
        new_q = a * nq_
        if new_p == 0:
            return UnitFractionDecomposition(p, q, tuple(terms), True)
        g = math.gcd(new_p, new_q)
        np_, nq_ = new_p // g, new_q // g
    return UnitFractionDecomposition(p, q, tuple(terms), np_ == 0)


def threshold_inspectable(p: int, q: int, max_terms: int = 4) -> dict:
    d = decompose_unit_fraction(p, q)
    return {
        "inspectable": d.exact and len(d.terms) <= max_terms,
        "decomposition": d,
    }


def reconstruct_fraction(terms: list[int]) -> dict:
    """Rebuild p/q from a unit-fraction term list. Returns {numerator, denominator}."""
    if not terms:
        return {"numerator": 0, "denominator": 1}
    p, q = 0, 1
    for a in terms:
        new_p = p * a + q
        new_q = q * a
        g = math.gcd(new_p, new_q) or 1
        p, q = new_p // g, new_q // g
    return {"numerator": p, "denominator": q}


# --- Egyptian doubling multiplication (RMP method) ------------------------

SHIFT_ADD_PRIME = (1 << 256) - (1 << 32) - 977  # secp256k1 field prime


@dataclass(frozen=True)
class DoublingStep:
    multiplier: int
    doubled: int
    selected: bool


@dataclass(frozen=True)
class DoublingTrace:
    product: int
    steps: tuple[DoublingStep, ...]


def egyptian_multiply(a: int, b: int) -> DoublingTrace:
    """Compute a · b using only doubling and addition. Returns trace."""
    if a < 0 or b < 0:
        raise ValueError("egyptian_multiply: requires non-negative operands")
    if b == 0:
        return DoublingTrace(product=0, steps=())
    steps: list[DoublingStep] = []
    product = 0
    multiplier = 1
    doubled = a
    remaining = b
    while multiplier <= remaining:
        selected = (remaining & multiplier) != 0
        steps.append(DoublingStep(multiplier=multiplier, doubled=doubled, selected=selected))
        if selected:
            product += doubled
        multiplier <<= 1
        doubled <<= 1
    return DoublingTrace(product=product, steps=tuple(steps))


def verify_doubling_trace(trace: DoublingTrace) -> bool:
    acc = 0
    for s in trace.steps:
        if s.selected:
            acc += s.doubled
    return acc == trace.product


def shift_add_accumulate(values: list[int], prime: int = SHIFT_ADD_PRIME) -> int:
    """Shift-add hash accumulator over a prime field, HSM-friendly."""
    acc = 0
    for v in values:
        t = egyptian_multiply(v % prime, 2).product
        acc = (acc + t) % prime
    return acc
