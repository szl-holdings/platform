"""Tests for the Gauß primitives Python port."""
from __future__ import annotations

import math

import pytest

from ouroboros.gauss import (
    ConformalThresholds,
    Jacobian2x2,
    ResidualThresholds,
    check_conformal,
    class_number,
    class_number_axis,
    conformal_axis,
    estimate_jacobian,
    gauss_closure_axis,
    least_squares,
    residual_axis,
    residual_fit,
)


# ---------------------------------------------------------------------------
# Primitive 17 — Least-squares
# ---------------------------------------------------------------------------


class TestLeastSquares:
    def test_solves_overdetermined_system_exactly_when_consistent(self) -> None:
        # y = 2x + 1 sampled exactly at x = 0,1,2,3.
        A = [[1.0, 0.0], [1.0, 1.0], [1.0, 2.0], [1.0, 3.0]]
        b = [1.0, 3.0, 5.0, 7.0]
        report = least_squares(A, b)
        assert math.isclose(report.solution[0], 1.0, abs_tol=1e-10)
        assert math.isclose(report.solution[1], 2.0, abs_tol=1e-10)
        assert report.residual_norm < 1e-10
        assert report.m == 4
        assert report.n == 2
        assert report.normals_positive_definite is True

    def test_residuals_for_inconsistent_system(self) -> None:
        # Same line but with one perturbed observation.
        A = [[1.0, 0.0], [1.0, 1.0], [1.0, 2.0], [1.0, 3.0]]
        b = [1.0, 3.0, 5.5, 7.0]
        report = least_squares(A, b)
        assert report.residual_norm > 0
        # Sum of residuals over rows is zero for OLS with intercept.
        assert abs(sum(report.residuals)) < 1e-10

    def test_rejects_empty_matrix(self) -> None:
        with pytest.raises(ValueError):
            least_squares([], [])

    def test_rejects_underdetermined(self) -> None:
        with pytest.raises(ValueError):
            least_squares([[1.0, 0.0, 0.0]], [1.0])

    def test_rejects_rank_deficient(self) -> None:
        # Two identical columns => rank 1 < 2.
        A = [[1.0, 1.0], [1.0, 1.0], [1.0, 1.0]]
        b = [1.0, 2.0, 3.0]
        with pytest.raises(ValueError):
            least_squares(A, b)

    def test_rejects_non_finite(self) -> None:
        with pytest.raises(ValueError):
            least_squares([[1.0, float("nan")], [1.0, 1.0]], [1.0, 2.0])

    def test_gauss_closure_axis_is_one_when_perfect_closure(self) -> None:
        A = [[1.0, 0.0], [1.0, 1.0], [1.0, 2.0]]
        b = [1.0, 3.0, 5.0]
        report = least_squares(A, b)
        assert math.isclose(gauss_closure_axis(report), 1.0, abs_tol=1e-10)

    def test_gauss_closure_axis_decays_for_noisy_residuals(self) -> None:
        A = [[1.0, 0.0], [1.0, 1.0], [1.0, 2.0]]
        b = [1.0, 3.0, 6.0]  # last point off
        report = least_squares(A, b)
        g = gauss_closure_axis(report, noise_sigma=1.0)
        assert 0 < g < 1


# ---------------------------------------------------------------------------
# Primitive 18 — Conformal projection check
# ---------------------------------------------------------------------------


class TestConformal:
    def test_identity_is_conformal(self) -> None:
        J = Jacobian2x2(1.0, 0.0, 0.0, 1.0)
        reading = check_conformal(J)
        assert reading.verdict == "CONFORMAL"
        assert reading.conformal_defect < 1e-9
        assert math.isclose(conformal_axis(reading), 1.0, abs_tol=1e-9)

    def test_pure_rotation_is_conformal(self) -> None:
        theta = math.pi / 6
        J = Jacobian2x2(math.cos(theta), -math.sin(theta), math.sin(theta), math.cos(theta))
        reading = check_conformal(J)
        assert reading.verdict == "CONFORMAL"

    def test_uniform_scaling_is_conformal(self) -> None:
        J = Jacobian2x2(2.0, 0.0, 0.0, 2.0)
        reading = check_conformal(J)
        assert reading.verdict == "CONFORMAL"
        assert math.isclose(reading.scale_factor, 2.0, rel_tol=1e-9)

    def test_anisotropic_scaling_is_non_conformal(self) -> None:
        J = Jacobian2x2(2.0, 0.0, 0.0, 1.0)
        reading = check_conformal(J)
        assert reading.verdict in ("NEAR_CONFORMAL", "NON_CONFORMAL")
        # axis depresses
        assert conformal_axis(reading) < 1.0

    def test_singular_jacobian_is_degenerate(self) -> None:
        J = Jacobian2x2(1.0, 1.0, 1.0, 1.0)
        reading = check_conformal(J)
        assert reading.verdict == "DEGENERATE"
        assert conformal_axis(reading) == 0.0

    def test_estimate_jacobian_recovers_holomorphic_map(self) -> None:
        # f(x,y) = (x² − y², 2xy) — squaring map, Cauchy–Riemann satisfied.
        def f(x: float, y: float) -> tuple[float, float]:
            return (x * x - y * y, 2 * x * y)

        J = estimate_jacobian(f, 1.5, 0.7)
        reading = check_conformal(J)
        assert reading.verdict == "CONFORMAL"


# ---------------------------------------------------------------------------
# Primitive 19 — Form class number
# ---------------------------------------------------------------------------


class TestClassNumber:
    @pytest.mark.parametrize(
        "d,expected",
        [
            (-3, 1),
            (-4, 1),
            (-7, 1),
            (-8, 1),
            (-11, 1),
            (-19, 1),
            (-43, 1),
            (-67, 1),
            (-163, 1),
        ],
    )
    def test_heegner_numbers_h_equals_one(self, d: int, expected: int) -> None:
        assert class_number(d).class_number == expected

    @pytest.mark.parametrize(
        "d,expected",
        [
            (-15, 2),
            (-23, 3),
            (-47, 5),
            (-71, 7),
        ],
    )
    def test_known_class_numbers(self, d: int, expected: int) -> None:
        assert class_number(d).class_number == expected

    def test_rejects_non_negative(self) -> None:
        with pytest.raises(ValueError):
            class_number(0)
        with pytest.raises(ValueError):
            class_number(5)

    def test_rejects_invalid_residue(self) -> None:
        # d ≡ 2 (mod 4) is not a valid discriminant.
        with pytest.raises(ValueError):
            class_number(-2)
        with pytest.raises(ValueError):
            class_number(-6)

    def test_class_number_axis_one_when_h_equals_one(self) -> None:
        report = class_number(-163)
        assert class_number_axis(report) == 1.0

    def test_class_number_axis_decays(self) -> None:
        report = class_number(-71)  # h = 7
        axis = class_number_axis(report, expected_ceiling=8)
        assert math.isclose(axis, 1 - 6 / 8, rel_tol=1e-12)


# ---------------------------------------------------------------------------
# Primitive 20 — Residual goodness-of-fit
# ---------------------------------------------------------------------------


def _gaussian_sample(n: int, seed: int = 1) -> list[float]:
    """Box-Muller deterministic Gaussian sample for tests."""
    out: list[float] = []
    state = seed
    for _ in range((n + 1) // 2):
        state = (1103515245 * state + 12345) & 0x7FFFFFFF
        u1 = ((state & 0xFFFF) + 1) / 0x10000
        state = (1103515245 * state + 12345) & 0x7FFFFFFF
        u2 = ((state & 0xFFFF) + 1) / 0x10000
        r = math.sqrt(-2 * math.log(u1))
        theta = 2 * math.pi * u2
        out.append(r * math.cos(theta))
        if len(out) < n:
            out.append(r * math.sin(theta))
    return out[:n]


class TestResidualFit:
    def test_insufficient_when_less_than_eight(self) -> None:
        report = residual_fit([0.1, -0.2, 0.05])
        assert report.verdict == "INSUFFICIENT"
        assert residual_axis(report) == 1.0

    def test_gaussian_sample_passes(self) -> None:
        sample = _gaussian_sample(200)
        # mean-correct so the test focuses on shape, not mean-drift
        m = sum(sample) / len(sample)
        sample = [s - m for s in sample]
        report = residual_fit(sample)
        assert report.verdict == "GAUSSIAN"
        assert residual_axis(report) > 0.5

    def test_drifting_mean_detected(self) -> None:
        sample = _gaussian_sample(200)
        m = sum(sample) / len(sample)
        sample = [s - m for s in sample]
        biased = [s + 1.5 for s in sample]  # shift mean by ~1.5σ
        report = residual_fit(biased)
        assert report.verdict == "DRIFTING_MEAN"
        assert residual_axis(report) == 0.0

    def test_non_gaussian_detected_for_exponential(self) -> None:
        # Exponential samples have skewness = 2, kurtosis = 9 → very high JB.
        # We mean-correct so the verdict targets the shape, not the mean.
        raw = [-math.log(((1103515245 * (i + 1) + 12345) & 0x7FFFFFFF) / 0x80000000 + 1e-9)
               for i in range(200)]
        m = sum(raw) / len(raw)
        sample = [r - m for r in raw]
        report = residual_fit(sample)
        assert report.verdict == "NON_GAUSSIAN"
        assert residual_axis(report) < 0.5

    def test_rejects_non_finite(self) -> None:
        with pytest.raises(ValueError):
            residual_fit([0.0] * 7 + [float("inf")])
