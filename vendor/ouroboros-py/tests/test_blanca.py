"""Tests for the Blanca primitives Python port (Primitives 21–24)."""
from __future__ import annotations

import math

import pytest

from ouroboros.blanca import (
    C_DEFAULT,
    CHSHRound,
    EPRReport,
    EquivalenceObservation,
    EquivalenceThresholds,
    FalsifiabilityCommitment,
    InvarianceThresholds,
    PairedObservation,
    SpacetimeEvent,
    apply_retraction,
    check_equivalence,
    check_invariance,
    epr_axis,
    epr_test,
    equivalence_axis,
    invariance_axis,
    lambda_retraction_axis,
    record_retraction,
    validate_commitment,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _boost(event: SpacetimeEvent, v: float, c: float = C_DEFAULT) -> SpacetimeEvent:
    """1+1 D Lorentz boost along x."""
    beta = v / c
    gamma = 1 / math.sqrt(1 - beta * beta)
    x0 = event.x[0] if event.x else 0.0
    return SpacetimeEvent(
        t=gamma * (event.t - (beta * x0) / c),
        x=(gamma * (x0 - v * event.t),),
    )


def _lcg_pm1(seed: int, n: int) -> list[int]:
    """Deterministic LCG sequence of ±1."""
    out: list[int] = []
    state = seed
    for _ in range(n):
        state = (1103515245 * state + 12345) & 0x7FFFFFFF
        out.append(1 if (state & 1) == 0 else -1)
    return out


def _local_realist_rounds(n: int, seed: int = 1) -> list[CHSHRound]:
    seq = _lcg_pm1(seed, 4 * n)
    rounds: list[CHSHRound] = []
    for i in range(n):
        rounds.append(CHSHRound(
            a1=seq[4 * i],
            a2=seq[4 * i + 1],
            b1=seq[4 * i + 2],
            b2=seq[4 * i + 3],
        ))
    return rounds


_LAMBDA: FalsifiabilityCommitment = FalsifiabilityCommitment(
    constant_name="cosmologicalConstant",
    constant_value=1.1e-52,
    witness_name="hubbleRedshift",
    retraction_threshold=0.05,
    public_log_ref="log://ouroboros/retractions/lambda",
)


# ---------------------------------------------------------------------------
# Primitive 21 — Lorentz invariance
# ---------------------------------------------------------------------------

class TestCheckInvariance:
    def test_identity_is_invariant(self) -> None:
        A = SpacetimeEvent(t=0, x=(0.0,))
        B = SpacetimeEvent(t=1, x=(C_DEFAULT * 0.5,))
        obs = PairedObservation(frame1A=A, frame1B=B, frame2A=A, frame2B=B)
        r = check_invariance(obs)
        assert r.verdict == "INVARIANT"
        assert invariance_axis(r) == 1.0

    def test_lorentz_boost_preserves_interval(self) -> None:
        A = SpacetimeEvent(t=0, x=(0.0,))
        B = SpacetimeEvent(t=1, x=(C_DEFAULT * 0.3,))
        v = 0.5 * C_DEFAULT
        obs = PairedObservation(
            frame1A=A, frame1B=B,
            frame2A=_boost(A, v), frame2B=_boost(B, v),
        )
        r = check_invariance(obs)
        assert r.verdict == "INVARIANT"

    def test_non_lorentz_breaks_invariance(self) -> None:
        A = SpacetimeEvent(t=0, x=(0.0,))
        B = SpacetimeEvent(t=1, x=(C_DEFAULT * 0.3,))
        broken = SpacetimeEvent(t=1, x=(C_DEFAULT * 0.6,))
        obs = PairedObservation(frame1A=A, frame1B=B, frame2A=A, frame2B=broken)
        r = check_invariance(obs)
        assert r.verdict == "BROKEN"
        assert invariance_axis(r) == 0.0

    def test_spacelike_interval_sign(self) -> None:
        A = SpacetimeEvent(t=0, x=(0.0,))
        B = SpacetimeEvent(t=0, x=(1.0,))
        obs = PairedObservation(frame1A=A, frame1B=B, frame2A=A, frame2B=B)
        r = check_invariance(obs)
        assert r.interval1 == -1.0
        assert r.interval2 == -1.0

    def test_timelike_interval_sign(self) -> None:
        A = SpacetimeEvent(t=0, x=(0.0,))
        B = SpacetimeEvent(t=1, x=(0.0,))
        obs = PairedObservation(frame1A=A, frame1B=B, frame2A=A, frame2B=B)
        r = check_invariance(obs)
        assert math.isclose(r.interval1, C_DEFAULT * C_DEFAULT)

    def test_3d_boost_preserves_interval(self) -> None:
        A = SpacetimeEvent(t=0, x=(0.0, 0.0, 0.0))
        B = SpacetimeEvent(t=1, x=(C_DEFAULT * 0.2, C_DEFAULT * 0.1, 0.0))
        v = 0.4 * C_DEFAULT
        beta = v / C_DEFAULT
        gamma = 1 / math.sqrt(1 - beta * beta)

        def boost_x(e: SpacetimeEvent) -> SpacetimeEvent:
            x0 = e.x[0]
            return SpacetimeEvent(
                t=gamma * (e.t - (beta * x0) / C_DEFAULT),
                x=(gamma * (x0 - v * e.t), e.x[1], e.x[2]),
            )

        obs = PairedObservation(
            frame1A=A, frame1B=B,
            frame2A=boost_x(A), frame2B=boost_x(B),
        )
        r = check_invariance(obs)
        assert r.verdict == "INVARIANT"

    def test_rejects_mismatched_spatial_dimensions(self) -> None:
        A = SpacetimeEvent(t=0, x=(0.0, 0.0))
        B = SpacetimeEvent(t=1, x=(1.0,))
        obs = PairedObservation(frame1A=A, frame1B=B, frame2A=A, frame2B=B)
        with pytest.raises(ValueError):
            check_invariance(obs)

    def test_rejects_non_positive_c(self) -> None:
        A = SpacetimeEvent(t=0, x=(0.0,))
        B = SpacetimeEvent(t=1, x=(0.0,))
        obs = PairedObservation(frame1A=A, frame1B=B, frame2A=A, frame2B=B)
        with pytest.raises(ValueError):
            check_invariance(obs, c=0)
        with pytest.raises(ValueError):
            check_invariance(obs, c=-1)

    def test_near_invariant_axis_in_range(self) -> None:
        A = SpacetimeEvent(t=0, x=(0.0,))
        B = SpacetimeEvent(t=1, x=(C_DEFAULT * 0.3,))
        perturb = SpacetimeEvent(t=1, x=(C_DEFAULT * 0.3 + 1e-2,))
        obs = PairedObservation(frame1A=A, frame1B=B, frame2A=A, frame2B=perturb)
        r = check_invariance(obs)
        ax = invariance_axis(r)
        assert 0.0 <= ax <= 1.0


# ---------------------------------------------------------------------------
# Primitive 22 — Equivalence principle
# ---------------------------------------------------------------------------

class TestCheckEquivalence:
    def test_frame_artifact(self) -> None:
        obs = EquivalenceObservation(mean_acceleration=9.8, tidal_delta=1e-5, window=5)
        r = check_equivalence(obs)
        assert r.verdict == "FRAME_ARTIFACT"
        assert equivalence_axis(r) == 1.0

    def test_field_detected(self) -> None:
        obs = EquivalenceObservation(mean_acceleration=1, tidal_delta=0.2, window=5)
        r = check_equivalence(obs)
        assert r.verdict == "FIELD_DETECTED"
        assert equivalence_axis(r) == 0.0

    def test_indistinguishable(self) -> None:
        obs = EquivalenceObservation(mean_acceleration=1, tidal_delta=0.05, window=5)
        r = check_equivalence(obs)
        assert r.verdict == "INDISTINGUISHABLE"
        ax = equivalence_axis(r)
        assert 0 < ax < 1

    def test_window_exceeded(self) -> None:
        obs = EquivalenceObservation(mean_acceleration=1, tidal_delta=0.001, window=120)
        r = check_equivalence(obs)
        assert r.verdict == "WINDOW_EXCEEDED"
        assert equivalence_axis(r) == 0.0

    def test_zero_mean_zero_tidal(self) -> None:
        obs = EquivalenceObservation(mean_acceleration=0, tidal_delta=0, window=1)
        r = check_equivalence(obs)
        assert r.tidal_ratio == 0.0
        assert r.verdict == "FRAME_ARTIFACT"

    def test_zero_mean_nonzero_tidal(self) -> None:
        obs = EquivalenceObservation(mean_acceleration=0, tidal_delta=0.1, window=1)
        r = check_equivalence(obs)
        assert r.tidal_ratio == math.inf
        assert r.verdict == "FIELD_DETECTED"

    def test_rejects_non_finite(self) -> None:
        with pytest.raises(ValueError):
            check_equivalence(EquivalenceObservation(mean_acceleration=float("nan"), tidal_delta=0, window=1))
        with pytest.raises(ValueError):
            check_equivalence(EquivalenceObservation(mean_acceleration=1, tidal_delta=0, window=0))
        with pytest.raises(ValueError):
            check_equivalence(EquivalenceObservation(mean_acceleration=1, tidal_delta=-1, window=1))

    def test_axis_monotonic(self) -> None:
        a = check_equivalence(EquivalenceObservation(mean_acceleration=1, tidal_delta=0.02, window=5))
        b = check_equivalence(EquivalenceObservation(mean_acceleration=1, tidal_delta=0.06, window=5))
        assert equivalence_axis(a) > equivalence_axis(b)

    def test_deferral_ceiling(self) -> None:
        r = check_equivalence(EquivalenceObservation(mean_acceleration=1, tidal_delta=0, window=1))
        assert r.deferral_ceiling == 60.0

    def test_custom_thresholds(self) -> None:
        r = check_equivalence(
            EquivalenceObservation(mean_acceleration=1, tidal_delta=0.05, window=1),
            EquivalenceThresholds(field_threshold=0.04, frame_threshold=0.001, max_window=60),
        )
        assert r.verdict == "FIELD_DETECTED"


# ---------------------------------------------------------------------------
# Primitive 23 — EPR completeness test
# ---------------------------------------------------------------------------

class TestEPRTest:
    def test_insufficient_when_fewer_than_16(self) -> None:
        r = epr_test([])
        assert r.verdict == "INSUFFICIENT"
        assert epr_axis(r) == 1.0

    def test_local_realist_data(self) -> None:
        rounds = _local_realist_rounds(400)
        r = epr_test(rounds)
        assert r.verdict == "LOCAL_REALIST"
        assert r.abs_S <= 2
        assert epr_axis(r) == 1.0

    def test_deterministic_rounds_cant_exceed_2(self) -> None:
        shapes = [
            CHSHRound(a1=1, a2=1, b1=1, b2=-1),
            CHSHRound(a1=1, a2=1, b1=1, b2=1),
            CHSHRound(a1=-1, a2=1, b1=1, b2=1),
            CHSHRound(a1=1, a2=-1, b1=-1, b2=1),
        ]
        for s in shapes:
            rounds = [s] * 100
            r = epr_test(rounds)
            assert r.abs_S <= 2 + 1e-12

    def test_epr_incomplete_band_axis_in_range(self) -> None:
        rounds = [CHSHRound(a1=1, a2=1, b1=1, b2=-1)] * 100
        lr = _local_realist_rounds(60, seed=7)
        mixed = rounds + lr
        r = epr_test(mixed)
        assert r.verdict in ("EPR_INCOMPLETE", "SUPERLUMINAL_REJECT", "LOCAL_REALIST")
        ax = epr_axis(r)
        assert 0.0 <= ax <= 1.0

    def test_rejects_non_pm1_outcomes(self) -> None:
        bad: list[CHSHRound] = []
        # Force an invalid outcome by using a namedtuple-like approach
        # Since CHSHRound is frozen we have to bypass type safety for the test
        # We check that epr_test raises when it encounters 0
        # Build 16 valid rounds then inject bad
        valid = [CHSHRound(a1=1, a2=1, b1=1, b2=1)] * 15
        # Simulate a "bad" round by passing a plain object with b2=0
        import dataclasses
        bad_round = dataclasses.replace(valid[0])
        # We need to bypass frozen to test: use object.__setattr__
        bad_data = [CHSHRound(a1=1, a2=1, b1=1, b2=1)] * 15
        # Create a bad round using a new dataclass instance approach - 
        # actually just test via the ValueError pathway for epr_test
        # The TS test passed { b2: 0 }; in Python we must simulate:
        class FakeRound:
            a1 = 1; a2 = 1; b1 = 1; b2 = 0
        fake_rounds = [FakeRound()] * 16  # type: ignore[list-item]
        with pytest.raises((ValueError, AttributeError)):
            epr_test(fake_rounds)  # type: ignore[arg-type]

    def test_symmetric_negation_preserves_abs_s(self) -> None:
        a = _local_realist_rounds(200, seed=11)
        negated = [CHSHRound(a1=-r.a1, a2=-r.a2, b1=-r.b1, b2=-r.b2) for r in a]
        ra = epr_test(a)
        rb = epr_test(negated)
        assert math.isclose(ra.abs_S, rb.abs_S, abs_tol=1e-12)

    def test_correlations_in_range(self) -> None:
        r = epr_test(_local_realist_rounds(200, seed=21))
        for v in (r.E_ab, r.E_abp, r.E_apb, r.E_apbp):
            assert -1 <= v <= 1

    def test_boundary_at_2_is_local_realist(self) -> None:
        rounds = [CHSHRound(a1=1, a2=1, b1=1, b2=1)] * 100
        r = epr_test(rounds)
        assert math.isclose(r.abs_S, 2, abs_tol=1e-12)
        assert r.verdict == "LOCAL_REALIST"
        assert epr_axis(r) == 1.0


# ---------------------------------------------------------------------------
# Primitive 24 — Λ-Retraction discipline
# ---------------------------------------------------------------------------

class TestValidateCommitment:
    def test_accepts_full_commitment(self) -> None:
        assert validate_commitment(_LAMBDA) is True

    def test_rejects_empty_constant_name(self) -> None:
        import dataclasses
        c = dataclasses.replace(_LAMBDA, constant_name="")
        assert validate_commitment(c) is False

    def test_rejects_empty_witness_name(self) -> None:
        import dataclasses
        c = dataclasses.replace(_LAMBDA, witness_name="  ")
        assert validate_commitment(c) is False

    def test_rejects_empty_public_log_ref(self) -> None:
        import dataclasses
        c = dataclasses.replace(_LAMBDA, public_log_ref="")
        assert validate_commitment(c) is False

    def test_rejects_non_positive_threshold(self) -> None:
        import dataclasses
        assert validate_commitment(dataclasses.replace(_LAMBDA, retraction_threshold=0)) is False
        assert validate_commitment(dataclasses.replace(_LAMBDA, retraction_threshold=-1)) is False
        assert validate_commitment(dataclasses.replace(_LAMBDA, retraction_threshold=float("nan"))) is False


class TestApplyRetraction:
    def test_holding_when_below_threshold(self) -> None:
        r = apply_retraction(_LAMBDA, 0.01)
        assert r.verdict == "HOLDING"
        assert r.retracted is False
        assert lambda_retraction_axis(r) == 1.0

    def test_marginal_in_upper_20_percent(self) -> None:
        r = apply_retraction(_LAMBDA, 0.045)
        assert r.verdict == "MARGINAL"
        ax = lambda_retraction_axis(r)
        assert 0 < ax < 1

    def test_retracted_when_signal_meets_threshold(self) -> None:
        r = apply_retraction(_LAMBDA, 0.06)
        assert r.verdict == "RETRACTED"
        assert r.retracted is True
        assert lambda_retraction_axis(r) == 0.0

    def test_inadmissible_when_commitment_incomplete(self) -> None:
        import dataclasses
        broken = dataclasses.replace(_LAMBDA, witness_name="")
        r = apply_retraction(broken, 0.001)
        assert r.verdict == "INADMISSIBLE"
        assert lambda_retraction_axis(r) == 0.0

    def test_rejects_non_finite_signal(self) -> None:
        with pytest.raises(ValueError):
            apply_retraction(_LAMBDA, float("nan"))
        with pytest.raises(ValueError):
            apply_retraction(_LAMBDA, float("inf"))

    def test_axis_monotonic_in_marginal_band(self) -> None:
        a = apply_retraction(_LAMBDA, 0.041)
        b = apply_retraction(_LAMBDA, 0.048)
        assert lambda_retraction_axis(a) > lambda_retraction_axis(b)

    def test_negative_signal_same_as_positive(self) -> None:
        pos = apply_retraction(_LAMBDA, 0.06)
        neg = apply_retraction(_LAMBDA, -0.06)
        assert pos.verdict == neg.verdict


class TestRecordRetraction:
    def test_produces_full_log_entry(self) -> None:
        r = apply_retraction(_LAMBDA, 0.07)
        entry = record_retraction(r, 1_700_000_000, "Hubble redshift exceeds tolerance")
        assert entry.timestamp == 1_700_000_000
        assert entry.public_log_ref == _LAMBDA.public_log_ref
        assert entry.retracted is True
        assert "Hubble" in entry.reason

    def test_rejects_negative_or_non_finite_timestamp(self) -> None:
        r = apply_retraction(_LAMBDA, 0.07)
        with pytest.raises(ValueError):
            record_retraction(r, -1, "x")
        with pytest.raises(ValueError):
            record_retraction(r, float("nan"), "x")

    def test_records_non_retracted_report(self) -> None:
        holding = apply_retraction(_LAMBDA, 0.01)
        entry = record_retraction(holding, 0, "no signal")
        assert entry.retracted is False
