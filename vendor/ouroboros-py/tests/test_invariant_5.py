"""Tests for the 5-axis Lutar Invariant Λ₅ (Python port)."""
from __future__ import annotations

import math

import pytest

from ouroboros.invariant import (
    InspectableWeight,
    LutarAxes5,
    LutarWeights5,
    default_weights_5,
    inspectable_weight,
    lutar_invariant_5,
    verify_lutar_bound_5,
    weights_are_exact_5,
)


def axes(c: float, h: float, r: float, f: float, g: float) -> LutarAxes5:
    return LutarAxes5(cleanliness=c, horizon=h, resonance=r, frustum=f, gauss_closure=g)


class TestDefaultWeights:
    def test_each_default_weight_is_one_fifth(self) -> None:
        w = default_weights_5()
        for piece in (w.cleanliness, w.horizon, w.resonance, w.frustum, w.gauss_closure):
            assert piece.terms == (5,)
            assert math.isclose(piece.value, 0.2, rel_tol=1e-12)

    def test_default_weights_sum_exactly_to_one(self) -> None:
        assert weights_are_exact_5(default_weights_5())


class TestInvariant5:
    def test_all_ones_gives_one(self) -> None:
        report = lutar_invariant_5(axes(1.0, 1.0, 1.0, 1.0, 1.0))
        assert math.isclose(report.invariant, 1.0, rel_tol=1e-12)

    def test_all_equal_gives_that_value(self) -> None:
        v = 0.7
        report = lutar_invariant_5(axes(v, v, v, v, v))
        assert math.isclose(report.invariant, v, rel_tol=1e-12)

    def test_zero_pinning(self) -> None:
        report = lutar_invariant_5(axes(0.9, 0.9, 0.9, 0.9, 0.0))
        assert report.invariant == 0.0

    def test_weighted_geometric_mean_of_concrete_axes(self) -> None:
        a = axes(0.88, 0.85, 0.88, 0.93, 0.90)
        report = lutar_invariant_5(a)
        # geometric mean with equal 1/5 weights
        expected = (0.88 * 0.85 * 0.88 * 0.93 * 0.90) ** 0.2
        assert math.isclose(report.invariant, expected, rel_tol=1e-12)

    def test_bound_theorem_holds(self) -> None:
        report = lutar_invariant_5(axes(0.6, 0.7, 0.8, 0.9, 0.95))
        assert verify_lutar_bound_5(report)
        assert report.proof.min_axis == 0.6
        assert report.proof.max_axis == 0.95
        assert report.invariant >= 0.6 - 1e-12
        assert report.invariant <= 0.95 + 1e-12

    def test_rejects_out_of_range_axes(self) -> None:
        with pytest.raises(ValueError):
            lutar_invariant_5(axes(1.1, 0.5, 0.5, 0.5, 0.5))
        with pytest.raises(ValueError):
            lutar_invariant_5(axes(-0.1, 0.5, 0.5, 0.5, 0.5))

    def test_formula_string_includes_all_five_axes(self) -> None:
        report = lutar_invariant_5(axes(0.9, 0.9, 0.9, 0.9, 0.9))
        f = report.proof.formula
        for sym in ("C^", "H^", "R^", "F^", "G^"):
            assert sym in f


class TestCustomWeights:
    def test_egyptian_alternative_weights_admissible(self) -> None:
        # 1/2 + 1/4 + 1/8 + 1/16 + 1/16 = 1
        w = LutarWeights5(
            cleanliness=inspectable_weight(1, 2),
            horizon=inspectable_weight(1, 4),
            resonance=inspectable_weight(1, 8),
            frustum=inspectable_weight(1, 16),
            gauss_closure=inspectable_weight(1, 16),
        )
        assert weights_are_exact_5(w)
        report = lutar_invariant_5(axes(0.9, 0.9, 0.9, 0.9, 0.9), w)
        assert math.isclose(report.invariant, 0.9, rel_tol=1e-12)

    def test_inadmissible_weights_raise(self) -> None:
        # Weights that do not sum to 1 must raise.
        bad = LutarWeights5(
            cleanliness=inspectable_weight(1, 5),
            horizon=inspectable_weight(1, 5),
            resonance=inspectable_weight(1, 5),
            frustum=inspectable_weight(1, 5),
            gauss_closure=inspectable_weight(1, 4),
        )
        with pytest.raises(ValueError):
            lutar_invariant_5(axes(0.9, 0.9, 0.9, 0.9, 0.9), bad)
