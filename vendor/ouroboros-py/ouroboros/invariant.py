"""The Lutar Invariant Λ — Python port.

Λ = C^α · H^β · R^γ · F^δ

with α + β + γ + δ = 1 and each weight expressible as a finite sum of
distinct unit fractions (Egyptian inspectability axiom).

Faithful reimplementation of packages/invariant/src/lutar-invariant.ts.
"""
from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Iterable

from ouroboros.reconciliation import (
    decompose_unit_fraction,
    reconstruct_fraction,
)


@dataclass(frozen=True)
class LutarAxes:
    cleanliness: float
    horizon: float
    resonance: float
    frustum: float

    def values(self) -> tuple[float, float, float, float]:
        return (self.cleanliness, self.horizon, self.resonance, self.frustum)


@dataclass(frozen=True)
class InspectableWeight:
    terms: tuple[int, ...]
    value: float


@dataclass(frozen=True)
class LutarWeights:
    cleanliness: InspectableWeight
    horizon: InspectableWeight
    resonance: InspectableWeight
    frustum: InspectableWeight

    def all_terms(self) -> tuple[int, ...]:
        return self.cleanliness.terms + self.horizon.terms + self.resonance.terms + self.frustum.terms


@dataclass(frozen=True)
class LutarProof:
    weight_sum: float
    weight_sum_exact: bool
    min_axis: float
    max_axis: float
    bound_lower: float
    bound_upper: float
    formula: str


@dataclass(frozen=True)
class LutarReport:
    invariant: float
    axes: LutarAxes
    weights: LutarWeights
    proof: LutarProof


def inspectable_weight(p: int, q: int) -> InspectableWeight:
    """Build an Egyptian-inspectable weight from a proper rational p/q."""
    if p <= 0 or q <= 0 or p >= q:
        raise ValueError(
            f"inspectable_weight: weight {p}/{q} must be a strictly proper positive fraction"
        )
    d = decompose_unit_fraction(p, q)
    if not d.exact:
        raise ValueError(f"inspectable_weight: {p}/{q} did not decompose exactly")
    return InspectableWeight(terms=d.terms, value=p / q)


def default_weights() -> LutarWeights:
    """The Egyptian inspectable default: each axis carries weight 1/4."""
    w = inspectable_weight(1, 4)
    return LutarWeights(cleanliness=w, horizon=w, resonance=w, frustum=w)


def weights_are_exact(weights: LutarWeights) -> bool:
    """Validate that the unit-fraction sum of all weight terms equals 1 exactly."""
    r = reconstruct_fraction(list(weights.all_terms()))
    return r["numerator"] == r["denominator"] and r["numerator"] > 0


def _rational_str(w: InspectableWeight) -> str:
    if len(w.terms) == 1:
        return f"(1/{w.terms[0]})"
    return "(" + "+".join(f"1/{t}" for t in w.terms) + ")"


def lutar_invariant(
    axes: LutarAxes,
    weights: LutarWeights | None = None,
) -> LutarReport:
    """Compute the Lutar Invariant Λ for a given axis tuple.

    Raises ValueError if axes are out of [0,1] or weights violate the
    Egyptian inspectability axiom.
    """
    if weights is None:
        weights = default_weights()

    for name, v in (
        ("cleanliness", axes.cleanliness),
        ("horizon", axes.horizon),
        ("resonance", axes.resonance),
        ("frustum", axes.frustum),
    ):
        if not math.isfinite(v) or v < 0 or v > 1:
            raise ValueError(f"lutar_invariant: axis {name} = {v} must be in [0,1]")

    weight_sum_exact = weights_are_exact(weights)
    weight_sum = (
        weights.cleanliness.value
        + weights.horizon.value
        + weights.resonance.value
        + weights.frustum.value
    )

    if not weight_sum_exact:
        raise ValueError(
            f"lutar_invariant: weights are not Egyptian-exact (sum = {weight_sum}); axiom A3 violated"
        )

    # Zero-pinning (axiom A2)
    if any(v == 0 for v in axes.values()):
        return _build_report(0.0, axes, weights, weight_sum, weight_sum_exact)

    log_l = (
        weights.cleanliness.value * math.log(axes.cleanliness)
        + weights.horizon.value * math.log(axes.horizon)
        + weights.resonance.value * math.log(axes.resonance)
        + weights.frustum.value * math.log(axes.frustum)
    )
    invariant = math.exp(log_l)
    return _build_report(invariant, axes, weights, weight_sum, weight_sum_exact)


def _build_report(
    invariant: float,
    axes: LutarAxes,
    weights: LutarWeights,
    weight_sum: float,
    weight_sum_exact: bool,
) -> LutarReport:
    values = axes.values()
    formula = (
        f"Λ = C^{_rational_str(weights.cleanliness)} · H^{_rational_str(weights.horizon)} · "
        f"R^{_rational_str(weights.resonance)} · F^{_rational_str(weights.frustum)}"
    )
    return LutarReport(
        invariant=invariant,
        axes=axes,
        weights=weights,
        proof=LutarProof(
            weight_sum=weight_sum,
            weight_sum_exact=weight_sum_exact,
            min_axis=min(values),
            max_axis=max(values),
            bound_lower=0.0,
            bound_upper=min(values),
            formula=formula,
        ),
    )


def verify_lutar_bound(report: LutarReport) -> bool:
    """Witness the bound theorem: 0 ≤ Λ ≤ max_axis ≤ 1, and Λ ≥ min_axis."""
    eps = 1e-12
    return (
        report.invariant >= 0
        and report.invariant <= report.proof.max_axis + eps
        and report.invariant >= report.proof.min_axis - eps
        and report.proof.min_axis <= report.proof.max_axis
        and report.proof.max_axis <= 1 + eps
    )


# ---------------------------------------------------------------------------
# Lutar Invariant v2 — 5-axis form with the Gauß closure axis G.
#
#     Λ₅ = C^α · H^β · R^γ · F^δ · G^ε,   α + β + γ + δ + ε = 1.
#
# The four-axis form above is unchanged and remains the runtime default.
# v2 adds an optional fifth axis G — the Gauß closure axis derived from
# least-squares network adjustment of an over-determined witness set.
# Each weight is Egyptian-exact; default each = 1/5.
# Bound theorem extends: 0 ≤ Λ₅ ≤ min(axes) ≤ max(axes) ≤ 1.
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class LutarAxes5:
    cleanliness: float
    horizon: float
    resonance: float
    frustum: float
    gauss_closure: float

    def values(self) -> tuple[float, float, float, float, float]:
        return (
            self.cleanliness,
            self.horizon,
            self.resonance,
            self.frustum,
            self.gauss_closure,
        )


@dataclass(frozen=True)
class LutarWeights5:
    cleanliness: InspectableWeight
    horizon: InspectableWeight
    resonance: InspectableWeight
    frustum: InspectableWeight
    gauss_closure: InspectableWeight

    def all_terms(self) -> tuple[int, ...]:
        return (
            self.cleanliness.terms
            + self.horizon.terms
            + self.resonance.terms
            + self.frustum.terms
            + self.gauss_closure.terms
        )


@dataclass(frozen=True)
class LutarReport5:
    invariant: float
    axes: LutarAxes5
    weights: LutarWeights5
    proof: LutarProof


def default_weights_5() -> LutarWeights5:
    """Egyptian-inspectable default for the 5-axis form: each weight = 1/5."""
    w = inspectable_weight(1, 5)
    return LutarWeights5(
        cleanliness=w,
        horizon=w,
        resonance=w,
        frustum=w,
        gauss_closure=w,
    )


def weights_are_exact_5(weights: LutarWeights5) -> bool:
    r = reconstruct_fraction(list(weights.all_terms()))
    return r["numerator"] == r["denominator"] and r["numerator"] > 0


def lutar_invariant_5(
    axes: LutarAxes5,
    weights: LutarWeights5 | None = None,
) -> LutarReport5:
    """Compute the 5-axis Lutar Invariant Λ₅.

    Raises ValueError if axes are out of [0,1] or weights violate axiom A3.
    """
    if weights is None:
        weights = default_weights_5()

    named = (
        ("cleanliness", axes.cleanliness),
        ("horizon", axes.horizon),
        ("resonance", axes.resonance),
        ("frustum", axes.frustum),
        ("gauss_closure", axes.gauss_closure),
    )
    for name, v in named:
        if not math.isfinite(v) or v < 0 or v > 1:
            raise ValueError(f"lutar_invariant_5: axis {name} = {v} must be in [0,1]")

    weight_sum_exact = weights_are_exact_5(weights)
    weight_sum = (
        weights.cleanliness.value
        + weights.horizon.value
        + weights.resonance.value
        + weights.frustum.value
        + weights.gauss_closure.value
    )
    if not weight_sum_exact:
        raise ValueError(
            f"lutar_invariant_5: weights are not Egyptian-exact (sum = {weight_sum}); axiom A3 violated"
        )

    values = axes.values()
    min_axis = min(values)
    max_axis = max(values)

    if any(v == 0 for v in values):
        invariant = 0.0
    else:
        log_l = (
            weights.cleanliness.value * math.log(axes.cleanliness)
            + weights.horizon.value * math.log(axes.horizon)
            + weights.resonance.value * math.log(axes.resonance)
            + weights.frustum.value * math.log(axes.frustum)
            + weights.gauss_closure.value * math.log(axes.gauss_closure)
        )
        invariant = math.exp(log_l)

    formula = (
        f"Λ₅ = C^{_rational_str(weights.cleanliness)} · H^{_rational_str(weights.horizon)} · "
        f"R^{_rational_str(weights.resonance)} · F^{_rational_str(weights.frustum)} · "
        f"G^{_rational_str(weights.gauss_closure)}"
    )
    return LutarReport5(
        invariant=invariant,
        axes=axes,
        weights=weights,
        proof=LutarProof(
            weight_sum=weight_sum,
            weight_sum_exact=weight_sum_exact,
            min_axis=min_axis,
            max_axis=max_axis,
            bound_lower=0.0,
            bound_upper=min_axis,
            formula=formula,
        ),
    )


def verify_lutar_bound_5(report: LutarReport5) -> bool:
    """Witness the bound theorem for Λ₅: 0 ≤ Λ₅ ≤ max_axis ≤ 1, Λ₅ ≥ min_axis."""
    eps = 1e-12
    return (
        report.invariant >= 0
        and report.invariant <= report.proof.max_axis + eps
        and report.invariant >= report.proof.min_axis - eps
        and report.proof.min_axis <= report.proof.max_axis
        and report.proof.max_axis <= 1 + eps
    )
