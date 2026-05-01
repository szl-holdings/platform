"""Tests for the Lutar Invariant Λ."""
from __future__ import annotations

import math

import pytest

from ouroboros import (
    InspectableWeight,
    LutarAxes,
    LutarWeights,
    default_weights,
    inspectable_weight,
    lutar_invariant,
    verify_lutar_bound,
    weights_are_exact,
)


def _axes(c, h, r, f):
    return LutarAxes(cleanliness=c, horizon=h, resonance=r, frustum=f)


class TestDefaultWeights:
    def test_default_weights_sum_to_one_exactly(self):
        w = default_weights()
        assert weights_are_exact(w)
        assert w.cleanliness.value == pytest.approx(0.25)

    def test_default_weights_are_each_one_quarter(self):
        w = default_weights()
        for ww in (w.cleanliness, w.horizon, w.resonance, w.frustum):
            assert ww.terms == (4,)
            assert ww.value == pytest.approx(0.25)

    def test_inspectable_weight_rejects_improper(self):
        with pytest.raises(ValueError):
            inspectable_weight(5, 4)

    def test_inspectable_weight_two_thirds_is_two_terms(self):
        w = inspectable_weight(2, 3)
        assert w.terms == (2, 6)
        assert w.value == pytest.approx(2 / 3)


class TestInvariant:
    def test_zero_pinning_axiom_a2(self):
        # If any axis is zero Λ must be zero
        for which in range(4):
            vals = [0.9, 0.9, 0.9, 0.9]
            vals[which] = 0.0
            r = lutar_invariant(_axes(*vals))
            assert r.invariant == 0.0

    def test_unity_axes_give_unity_invariant(self):
        r = lutar_invariant(_axes(1, 1, 1, 1))
        assert r.invariant == pytest.approx(1.0)

    def test_default_weights_recover_geometric_mean(self):
        # With α=β=γ=δ=1/4 the invariant is the geometric mean of axes
        axes = _axes(0.5, 0.5, 0.5, 0.5)
        r = lutar_invariant(axes)
        assert r.invariant == pytest.approx(0.5)

    def test_realistic_axes_match_thesis(self):
        # The thesis quotes C=0.88, H=0.85, R=0.88, F=0.93 → Λ ≈ 0.885
        r = lutar_invariant(_axes(0.88, 0.85, 0.88, 0.93))
        assert r.invariant == pytest.approx(0.884, abs=0.005)

    def test_axis_out_of_range_raises(self):
        with pytest.raises(ValueError):
            lutar_invariant(_axes(1.1, 0.9, 0.9, 0.9))
        with pytest.raises(ValueError):
            lutar_invariant(_axes(-0.1, 0.9, 0.9, 0.9))
        with pytest.raises(ValueError):
            lutar_invariant(_axes(float("nan"), 0.9, 0.9, 0.9))

    def test_monotonicity_axiom_a1(self):
        # Increasing any axis must not decrease Λ
        base = lutar_invariant(_axes(0.7, 0.7, 0.7, 0.7)).invariant
        better = lutar_invariant(_axes(0.95, 0.7, 0.7, 0.7)).invariant
        assert better > base

    def test_bound_theorem_min_le_lambda_le_max(self):
        for axes in [
            _axes(0.5, 0.6, 0.7, 0.8),
            _axes(0.1, 0.99, 0.99, 0.99),
            _axes(0.4, 0.4, 0.4, 0.4),
        ]:
            r = lutar_invariant(axes)
            assert r.proof.min_axis - 1e-9 <= r.invariant <= r.proof.max_axis + 1e-9
            assert verify_lutar_bound(r)

    def test_proof_includes_formula_string(self):
        r = lutar_invariant(_axes(0.5, 0.5, 0.5, 0.5))
        assert r.proof.formula.startswith("Λ = C")
        assert "(1/4)" in r.proof.formula

    def test_non_default_weights_two_thirds_one_third_split(self):
        # Custom weights: C=2/3, H=1/6, R=1/12, F=1/12 (sums to 1 exactly)
        from fractions import Fraction
        # Build via inspectable_weight — must be Egyptian-exact
        w = LutarWeights(
            cleanliness=inspectable_weight(2, 3),
            horizon=inspectable_weight(1, 6),
            resonance=inspectable_weight(1, 12),
            frustum=inspectable_weight(1, 12),
        )
        assert weights_are_exact(w)
        r = lutar_invariant(_axes(0.9, 0.9, 0.9, 0.9), weights=w)
        assert r.invariant == pytest.approx(0.9)

    def test_weights_that_dont_sum_to_one_are_rejected(self):
        # Force-construct a weight set that violates A3
        bad = LutarWeights(
            cleanliness=InspectableWeight(terms=(4,), value=0.25),
            horizon=InspectableWeight(terms=(4,), value=0.25),
            resonance=InspectableWeight(terms=(4,), value=0.25),
            frustum=InspectableWeight(terms=(8,), value=0.125),
        )
        with pytest.raises(ValueError):
            lutar_invariant(_axes(0.9, 0.9, 0.9, 0.9), weights=bad)


class TestNumericalParity:
    """Cross-check the Python port against the published TS reference values."""

    def test_quarter_weights_geometric_mean_matches_ts(self):
        # TS reference output for axes [0.9, 0.85, 0.92, 0.95]:
        # Λ = exp(0.25·(ln 0.9 + ln 0.85 + ln 0.92 + ln 0.95))
        axes = _axes(0.9, 0.85, 0.92, 0.95)
        r = lutar_invariant(axes)
        expected = math.exp(0.25 * (math.log(0.9) + math.log(0.85) + math.log(0.92) + math.log(0.95)))
        assert r.invariant == pytest.approx(expected, rel=1e-12)

    def test_thesis_default_axes_match_ts_runtime(self):
        # Reference: TS runtime emits ~0.8847 for these axes
        r = lutar_invariant(_axes(0.88, 0.85, 0.88, 0.93))
        assert abs(r.invariant - 0.8847) < 0.001
