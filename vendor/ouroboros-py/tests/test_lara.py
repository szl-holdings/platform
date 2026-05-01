"""Tests for the Lara primitives Python port (Primitives 33–36)."""
from __future__ import annotations

import math

import pytest

from ouroboros.lara import (
    AbramovGateResult,
    DomainSpec,
    GowersGateResult,
    LaraReceipt,
    MeasurabilityResult,
    ReconstructionTrial,
    abramov_gate,
    assess_measurability,
    declare_lara,
    gowers_norm,
    non_measurability_honesty,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _const_ones(G: int) -> list[tuple[float, float]]:
    return [(1.0, 0.0)] * G


def _G(verdict: str) -> GowersGateResult:
    return GowersGateResult(
        verdict=verdict,
        norm=0.6 if verdict == "STRUCTURED" else 0.0,
        eta=0.05,
        reason="test",
        exact=True,
    )


def _A(status: str) -> AbramovGateResult:
    return AbramovGateResult(p=2, k=5, status=status, citation="test citation", reason="test")


def _M(verdict: str) -> MeasurabilityResult:
    return MeasurabilityResult(
        candidate_polynomial_id="Q",
        verdict=verdict,
        success_rate=0.8 if verdict == "MEASURABLE" else 0.1,
        trial_count=10,
        reason="test",
    )


def _trial(succeeded: bool) -> ReconstructionTrial:
    return ReconstructionTrial(
        m=4, M=32, epsilon_at_m=0.05,
        observed_deviation=0.02 if succeeded else 0.2,
        correlation=0.3,
        succeeded=succeeded,
    )


# ---------------------------------------------------------------------------
# Primitive 33 — Gowers norm gate
# ---------------------------------------------------------------------------

class TestGowersNorm:
    def test_constant_function_structured_norm_1(self) -> None:
        G = 8  # F_2^3
        r = gowers_norm(DomainSpec(p=2, n=3), k=2, values=_const_ones(G))
        assert r.exact is True
        assert r.verdict == "STRUCTURED"
        assert math.isclose(r.norm, 1.0, abs_tol=1e-5)

    def test_linear_phase_structured_at_u2(self) -> None:
        p, n = 2, 4
        G = 1 << n
        values: list[tuple[float, float]] = []
        for i in range(G):
            x0 = i & 1
            values.append((1.0 if x0 == 0 else -1.0, 0.0))
        r = gowers_norm(DomainSpec(p=p, n=n), k=1, values=values)
        assert r.verdict == "STRUCTURED"
        assert math.isclose(r.norm, 1.0, abs_tol=1e-5)

    def test_zero_function_uniform(self) -> None:
        G = 8
        zeros: list[tuple[float, float]] = [(0.0, 0.0)] * G
        r = gowers_norm(DomainSpec(p=2, n=3), k=2, values=zeros)
        assert r.norm == 0.0
        assert r.verdict == "UNIFORM"

    def test_rejects_mismatched_length(self) -> None:
        with pytest.raises(ValueError):
            gowers_norm(DomainSpec(p=2, n=3), k=2, values=_const_ones(7))

    def test_estimated_when_domain_too_large(self) -> None:
        G = 1 << 13  # 8192 > default 4096
        values: list[tuple[float, float]] = [(0.5, 0.0)] * G
        r = gowers_norm(DomainSpec(p=2, n=13), k=2, values=values, max_exact_domain=4096)
        assert r.verdict == "ESTIMATED"
        assert r.exact is False

    def test_rejects_k_less_than_1(self) -> None:
        with pytest.raises(ValueError):
            gowers_norm(DomainSpec(p=2, n=3), k=0, values=_const_ones(8))


# ---------------------------------------------------------------------------
# Primitive 34 — Abramov-order gate
# ---------------------------------------------------------------------------

class TestAbramovGate:
    def test_proven_when_k_le_p_plus_1(self) -> None:
        assert abramov_gate(2, 2).status == "ABRAMOV_PROVEN"
        assert abramov_gate(2, 3).status == "ABRAMOV_PROVEN"
        assert abramov_gate(3, 4).status == "ABRAMOV_PROVEN"
        assert abramov_gate(5, 6).status == "ABRAMOV_PROVEN"

    def test_fails_exactly_at_p2_k5(self) -> None:
        r = abramov_gate(2, 5)
        assert r.status == "ABRAMOV_FAILS"
        assert "Jamneshan" in r.citation
        assert "2026" in r.citation

    def test_open_otherwise(self) -> None:
        assert abramov_gate(2, 4).status == "ABRAMOV_OPEN"
        assert abramov_gate(2, 6).status == "ABRAMOV_OPEN"
        assert abramov_gate(3, 5).status == "ABRAMOV_OPEN"

    def test_rejects_invalid_p_or_k(self) -> None:
        with pytest.raises((ValueError, TypeError)):
            abramov_gate(1, 2)
        with pytest.raises((ValueError, TypeError)):
            abramov_gate(2, 0)

    def test_citation_present_for_all_statuses(self) -> None:
        for p, k in [(2, 2), (2, 5), (2, 6)]:
            assert len(abramov_gate(p, k).citation) > 0


# ---------------------------------------------------------------------------
# Primitive 35 — Measurability assertion
# ---------------------------------------------------------------------------

class TestAssessMeasurability:
    def test_undetermined_with_no_trials(self) -> None:
        r = assess_measurability("P", [])
        assert r.verdict == "UNDETERMINED"
        assert r.success_rate == 0.0

    def test_measurable_when_rate_gte_05(self) -> None:
        trials = [_trial(True), _trial(True), _trial(True), _trial(False)]
        r = assess_measurability("P", trials)
        assert r.verdict == "MEASURABLE"
        assert math.isclose(r.success_rate, 0.75, abs_tol=1e-9)

    def test_non_measurable_when_rate_lt_05_and_enough_trials(self) -> None:
        trials = [_trial(i < 2) for i in range(8)]
        r = assess_measurability("P", trials)
        assert r.verdict == "NON_MEASURABLE"
        assert math.isclose(r.success_rate, 0.25, abs_tol=1e-9)

    def test_undetermined_when_rate_lt_05_but_few_trials(self) -> None:
        trials = [_trial(False), _trial(False), _trial(False)]
        r = assess_measurability("P", trials, min_trials=8)
        assert r.verdict == "UNDETERMINED"

    def test_custom_required_success_rate(self) -> None:
        trials = [_trial(i < 7) for i in range(10)]
        strict = assess_measurability("P", trials, required_success_rate=0.8)
        assert strict.verdict == "NON_MEASURABLE"
        lenient = assess_measurability("P", trials, required_success_rate=0.5)
        assert lenient.verdict == "MEASURABLE"

    def test_preserves_candidate_id(self) -> None:
        r = assess_measurability("Q-quintic-7", [_trial(True)])
        assert r.candidate_polynomial_id == "Q-quintic-7"


# ---------------------------------------------------------------------------
# Primitive 36 — Lara-gap declaration
# ---------------------------------------------------------------------------

class TestDeclareLara:
    def test_lara_na_no_structure(self) -> None:
        r = declare_lara("d1", _G("UNIFORM"), _A("ABRAMOV_PROVEN"), None)
        assert r.kind == "LARA_NA"
        assert r.reconstructibility_claim_allowed is False

    def test_lara_hold_undetermined_measurability(self) -> None:
        r = declare_lara("d2", _G("STRUCTURED"), _A("ABRAMOV_PROVEN"), None)
        assert r.kind == "LARA_HOLD"

    def test_lara_gap_abramov_fails_non_measurable(self) -> None:
        r = declare_lara("d3", _G("STRUCTURED"), _A("ABRAMOV_FAILS"), _M("NON_MEASURABLE"))
        assert r.kind == "LARA_GAP"
        assert r.reconstructibility_claim_allowed is False
        assert r.axis_n == 1.0

    def test_lara_ok_measurable_abramov_not_failing(self) -> None:
        r = declare_lara("d4", _G("STRUCTURED"), _A("ABRAMOV_PROVEN"), _M("MEASURABLE"))
        assert r.kind == "LARA_OK"
        assert r.reconstructibility_claim_allowed is True

    def test_lara_bug_proven_but_non_measurable(self) -> None:
        r = declare_lara("d5", _G("STRUCTURED"), _A("ABRAMOV_PROVEN"), _M("NON_MEASURABLE"))
        assert r.kind == "LARA_BUG"
        assert r.axis_n == 0.0

    def test_lara_gap_open_non_measurable(self) -> None:
        r = declare_lara("d6", _G("STRUCTURED"), _A("ABRAMOV_OPEN"), _M("NON_MEASURABLE"))
        assert r.kind == "LARA_GAP"

    def test_lara_hold_abramov_fails_measurable(self) -> None:
        r = declare_lara("d7", _G("STRUCTURED"), _A("ABRAMOV_FAILS"), _M("MEASURABLE"))
        assert r.kind == "LARA_HOLD"
        assert r.reconstructibility_claim_allowed is False
        assert r.axis_n == 0.5

    def test_aggregates_axis_n(self) -> None:
        ok = declare_lara("ok", _G("STRUCTURED"), _A("ABRAMOV_PROVEN"), _M("MEASURABLE"))
        gap = declare_lara("gap", _G("STRUCTURED"), _A("ABRAMOV_FAILS"), _M("NON_MEASURABLE"))
        bug = declare_lara("bug", _G("STRUCTURED"), _A("ABRAMOV_PROVEN"), _M("NON_MEASURABLE"))
        assert math.isclose(non_measurability_honesty([ok, gap, bug]), (1 + 1 + 0) / 3, abs_tol=1e-5)
        assert non_measurability_honesty([]) == 1.0

    def test_citations_include_math_ann(self) -> None:
        r = declare_lara("cite", _G("STRUCTURED"), _A("ABRAMOV_FAILS"), _M("NON_MEASURABLE"))
        assert any("Math. Ann." in c for c in r.citations)
