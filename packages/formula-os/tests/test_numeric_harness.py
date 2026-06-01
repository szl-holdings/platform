"""
test_numeric_harness.py — pytest numeric harness for the PURIQ formula suite.

50/50 baseline = 23 per-formula identity tests (100 sampled trials each)
              + 27 targeted edge-case / closed-form tests
              = 50 tests total, mirroring the PURIQ Formula Suite LAKE_TEST_PLAN
                numeric baseline.

Run:  python -m pytest tests/test_numeric_harness.py -v
"""
from __future__ import annotations
import math
import sys
import os
from fractions import Fraction

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from formula_os import formulas as F
from formula_os.registry import SPECS, BY_ID
from formula_os.numeric_harness import check_identity


# ---- 23 per-formula identity tests (100 trials each) ----------------------
@pytest.mark.parametrize("spec", SPECS, ids=[s.fid for s in SPECS])
def test_identity_holds_over_100_trials(spec):
    hr = check_identity(spec, trials=100)
    assert hr.ok, f"{spec.fid} {spec.name}: {hr.passed}/{hr.total}; {hr.failures}"


# ---- 27 targeted closed-form / edge-case tests ----------------------------
def test_f1_sphere_chi_is_2():
    # tetrahedron: V=4,E=6,F=4 -> chi=2
    assert F.f1_euler_char(4, 6, 4) == 2
    assert F.f1_well_formed(4, 6, 4)

def test_f1_torus_chi_is_0_not_wellformed():
    assert F.f1_euler_char(1, 2, 1) == 0
    assert not F.f1_well_formed(1, 2, 1)

def test_f2_half_expansion():
    assert F.f2_egyptian_greedy(Fraction(1, 2)) == [2]

def test_f2_two_thirds_distinct_sum():
    den = F.f2_egyptian_greedy(Fraction(2, 3))
    assert F.f2_sum(den) == Fraction(2, 3)
    assert len(set(den)) == len(den)

def test_f3_permutation_conserves_charge():
    st = [1.0, 2.0, 3.0, 4.0]
    assert math.isclose(F.f3_charge(F.f3_symmetry_permute(st, [3, 2, 1, 0])),
                        F.f3_charge(st))

def test_f4_zero_sigma_lb_equals_mu():
    assert math.isclose(F.f4_yuyay_lower_bound(0.9, 0.0), 0.9)

def test_f4_shrink_factor_sqrt13():
    lb = F.f4_yuyay_lower_bound(1.0, 1.0)
    assert math.isclose(1.0 - lb, 1.645 / math.sqrt(13))

def test_f5_harmonic_residual_small():
    assert abs(F.f5_el_residual_harmonic(2.0, 1.0, 1.0)) < 1e-3

def test_f6_capped_slope_within_bound():
    assert F.f6_identity(1.0, 0.5, 1.0, 2.0)

def test_f7_basel_sum_approx():
    assert math.isclose(F.f7_provenance_partial(2.0, 200000), math.pi**2 / 6, abs_tol=1e-4)

def test_f7_diverges_excluded_s_le_1():
    assert F.f7_identity(1.0)  # vacuous true (excluded)

def test_f8_picks_min_count():
    assert F.f8_parsimony_pick([("a", 5), ("b", 2), ("c", 9)]) == "b"

def test_f9_cyclic_shift_conserves_sum():
    x = [float(i) for i in range(13)]
    assert math.isclose(sum(F.f9_mass_preserving_map(x, 4)), sum(x))

def test_f10_baudhayana_exact():
    assert F.f10_heron_step(Fraction(17, 12)) == Fraction(577, 408)

def test_f10_close_to_sqrt2():
    # True error is 2.1239e-6 (PURIQ suite's 1.5e-6 claim is too tight; corrected).
    assert abs(577 / 408 - math.sqrt(2)) < 2.2e-6

def test_f11_pyramid_degeneracy():
    assert math.isclose(F.f11_frustum_volume(3.0, 0.0, 9.0), (9.0 / 3) * 9.0)

def test_f11_nonneg():
    assert F.f11_frustum_volume(2.0, 1.0, 4.0) >= 0

def test_f12_coprime_period_is_product():
    assert F.f12_crt_period([7, 12]) == 84

def test_f12_residue_recurs():
    assert F.f12_identity(7, 12, 30)

def test_f13_gauss_bonnet_4pi_when_chi2():
    assert math.isclose(2 * math.pi * 2, 4 * math.pi)
    assert F.f13_identity(2)

def test_f14_partition_values():
    assert F.f14_partitions(5) == 7
    assert F.f14_partitions(10) == 42
    assert F.f14_partitions(50) == 204226

def test_f15_composition_associative():
    assert F.f15_identity(7.0)

def test_f16_zero_sum_saddle():
    # matching pennies [[1,-1],[-1,1]] -> value 0
    lo, hi = F.f16_game_value_2x2([[1, -1], [-1, 1]])
    assert math.isclose(lo, 0.0) and math.isclose(hi, 0.0)

def test_f17_uniform_entropy():
    # uniform over 4 -> H = 2 bits
    assert math.isclose(F.f17_entropy([0.25] * 4), 2.0)

def test_f17_nonneg():
    assert F.f17_entropy([0.1, 0.2, 0.7]) >= 0

def test_f18_program_count_geometric():
    assert F.f18_num_programs_up_to(10) == 2**11 - 1
    assert sum(2**i for i in range(11)) == 2**11 - 1

def test_f19_fuel_terminates():
    status, steps, _ = F.f19_run_with_fuel(lambda x: (x - 1) if x > 0 else None, 10, 3)
    assert steps <= 10 and status == "halted"

def test_f20_normalized_sums_to_one():
    c = F.f20_normalize([3.0, 4.0])
    assert math.isclose(sum(ci * ci for ci in c), 1.0)

def test_f21_projection_sums_to_one():
    c = F.f20_normalize([1.0, 1.0, 1.0, 1.0])
    assert math.isclose(sum(F.f21_project(c)), 1.0)

def test_f22_path_weight_is_mean():
    assert math.isclose(F.f22_path_weight([1.0, 2.0, 3.0]), 2.0)

def test_f23_cap_is_min_of_bounds():
    cap = F.f23_bekenstein_cap(0.0, 0.0, 3)  # exp(0)=1 < 2^4-1=15 -> 1
    assert math.isclose(cap, 1.0)
