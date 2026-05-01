"""Tests for the Egyptian reconciliation primitives."""
from __future__ import annotations

import math

import pytest

from ouroboros import (
    GREAT_PYRAMID_SEKED,
    PALMS_PER_CUBIT,
    SHIFT_ADD_PRIME,
    WitnessView,
    compute_seked,
    decompose_unit_fraction,
    egyptian_multiply,
    frustum_formula,
    reconcile_frustum,
    reconstruct_fraction,
    seked_to_degrees,
    shift_add_accumulate,
    threshold_inspectable,
    verify_doubling_trace,
)


# --- frustum reconciliation -----------------------------------------------

def _v(id_: str, leaves):
    return WitnessView(id=id_, leaves=tuple(leaves))


class TestFrustum:
    def test_reconciled_when_three_witnesses_agree(self):
        leaves = ["a", "b", "c"]
        report = reconcile_frustum([_v("w1", leaves), _v("w2", leaves), _v("w3", leaves)])
        assert report.verdict == "RECONCILED"
        assert report.union_volume == 3
        assert report.intersection_volume == 3
        assert report.max_symmetric_difference == 0

    def test_divergent_when_one_witness_diverges(self):
        report = reconcile_frustum(
            [
                _v("w1", ["a", "b", "c"]),
                _v("w2", ["a", "b", "c"]),
                _v("w3", ["a", "b", "x"]),
            ]
        )
        assert report.verdict == "DIVERGENT"
        assert report.intersection_volume == 2
        assert report.union_volume == 4
        assert report.max_symmetric_difference > 0

    def test_insufficient_with_two_witnesses(self):
        report = reconcile_frustum([_v("w1", ["a"]), _v("w2", ["a"])])
        assert report.verdict == "INSUFFICIENT"

    def test_per_witness_volume_uses_distinct_leaves(self):
        report = reconcile_frustum(
            [_v("w1", ["a", "a", "b"]), _v("w2", ["a", "b"]), _v("w3", ["a", "b"])]
        )
        assert report.per_witness_volume == (2, 2, 2)
        assert report.verdict == "RECONCILED"

    def test_frustum_formula_matches_mmp_14_form(self):
        report = reconcile_frustum([_v("w1", ["a", "b"]), _v("w2", ["a", "b"]), _v("w3", ["a", "b"])])
        s = frustum_formula(report)
        assert "V_T" in s
        assert "1/3" in s


# --- seked --------------------------------------------------------------

class TestSeked:
    def test_great_pyramid_seked_constant(self):
        assert GREAT_PYRAMID_SEKED == pytest.approx(5.5)
        assert PALMS_PER_CUBIT == 7

    def test_compute_seked_for_great_pyramid(self):
        # base/height = 11/14 → seked = 7 · (11/14) = 5.5
        r = compute_seked(11, 14)
        assert r.seked == pytest.approx(5.5)
        assert r.verdict == "RISING"

    def test_seked_stable_band(self):
        r = compute_seked(7, 7)
        assert r.seked == pytest.approx(7)
        assert r.verdict == "STABLE"

    def test_seked_saturating_band(self):
        r = compute_seked(1, 14)
        assert r.seked == pytest.approx(0.5)
        assert r.verdict == "SATURATING"

    def test_seked_vertical_when_dy_zero(self):
        r = compute_seked(1, 0)
        assert math.isinf(r.seked)
        assert r.verdict == "VERTICAL"

    def test_seked_rejects_negative(self):
        with pytest.raises(ValueError):
            compute_seked(-1, 1)

    def test_seked_to_degrees_great_pyramid(self):
        # historical Great Pyramid slope ≈ 51.84°
        deg = seked_to_degrees(5.5)
        assert deg == pytest.approx(51.842, abs=0.01)


# --- unit-fraction decomposition ---------------------------------------

class TestUnitFraction:
    def test_one_quarter_is_a_single_term(self):
        d = decompose_unit_fraction(1, 4)
        assert d.exact
        assert d.terms == (4,)

    def test_decompose_two_thirds(self):
        d = decompose_unit_fraction(2, 3)
        assert d.exact
        # 2/3 = 1/2 + 1/6 (greedy)
        assert d.terms == (2, 6)
        recon = reconstruct_fraction(list(d.terms))
        assert recon == {"numerator": 2, "denominator": 3}

    def test_decompose_three_fifths(self):
        d = decompose_unit_fraction(3, 5)
        assert d.exact
        recon = reconstruct_fraction(list(d.terms))
        assert recon == {"numerator": 3, "denominator": 5}

    def test_decompose_rejects_improper(self):
        with pytest.raises(ValueError):
            decompose_unit_fraction(5, 4)

    def test_decompose_rejects_negative(self):
        with pytest.raises(ValueError):
            decompose_unit_fraction(-1, 4)

    def test_threshold_inspectable_passes_simple(self):
        r = threshold_inspectable(1, 4, max_terms=2)
        assert r["inspectable"]

    def test_threshold_inspectable_fails_when_too_many_terms(self):
        # 4/13 decomposes into more than 2 terms
        r = threshold_inspectable(4, 13, max_terms=2)
        assert not r["inspectable"]

    def test_reconstruct_empty_terms(self):
        assert reconstruct_fraction([]) == {"numerator": 0, "denominator": 1}


# --- egyptian doubling -----------------------------------------------------

class TestDoubling:
    def test_egyptian_multiply_matches_native(self):
        for a, b in [(7, 13), (255, 1), (17, 256), (0, 99), (99, 0)]:
            t = egyptian_multiply(a, b)
            assert t.product == a * b
            assert verify_doubling_trace(t)

    def test_egyptian_multiply_rejects_negative(self):
        with pytest.raises(ValueError):
            egyptian_multiply(-1, 5)

    def test_doubling_trace_records_each_bit(self):
        t = egyptian_multiply(11, 13)  # 13 = 1+4+8 → 3 selected steps
        selected = [s for s in t.steps if s.selected]
        assert len(selected) == 3

    def test_shift_add_accumulate_is_additive(self):
        a = shift_add_accumulate([1, 2, 3])
        b = shift_add_accumulate([3, 2, 1])
        assert a == b

    def test_shift_add_modulus_is_secp256k1_field(self):
        assert SHIFT_ADD_PRIME == (1 << 256) - (1 << 32) - 977

    def test_shift_add_handles_large_values(self):
        big = [SHIFT_ADD_PRIME - 1, SHIFT_ADD_PRIME - 2, 5]
        out = shift_add_accumulate(big)
        assert 0 <= out < SHIFT_ADD_PRIME
