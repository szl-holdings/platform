"""Tests for davinci.py — Primitives 57-60."""

import math
import pytest

from ouroboros.davinci import (
    # Primitive 57
    FrameTest,
    check_dual_frame,
    # Primitive 58
    Line2D,
    check_vanishing_point,
    # Primitive 59
    PHI,
    verify_phi,
    ratio_from_pair,
    # Primitive 60
    SfumatoSample,
    check_sfumato,
)


# ---------------------------------------------------------------------------
# Primitive 57 — Vitruvian dual-frame check
# ---------------------------------------------------------------------------

class TestVitruvianDualFrame:
    def test_frame_invariant_when_both_admit(self):
        r = check_dual_frame([
            FrameTest(frame_id="circle", admits=True, rationale="x"),
            FrameTest(frame_id="square", admits=True, rationale="x"),
        ])
        assert r.both_admit is True
        assert r.frame_dependent is False

    def test_frame_dependent_when_only_one_admits(self):
        r = check_dual_frame([
            FrameTest(frame_id="circle", admits=True, rationale="x"),
            FrameTest(frame_id="square", admits=False, rationale="y"),
        ])
        assert r.frame_dependent is True

    def test_rejected_by_every_frame_when_none_admit(self):
        r = check_dual_frame([
            FrameTest(frame_id="circle", admits=False, rationale="x"),
            FrameTest(frame_id="square", admits=False, rationale="y"),
        ])
        assert r.both_admit is False
        assert r.frame_dependent is False
        assert "rejected" in r.rationale

    def test_requires_at_least_2_frames(self):
        with pytest.raises((ValueError, Exception)):
            check_dual_frame([FrameTest(frame_id="circle", admits=True, rationale="x")])

    def test_requires_distinct_frame_ids(self):
        with pytest.raises((ValueError, Exception)):
            check_dual_frame([
                FrameTest(frame_id="circle", admits=True, rationale="x"),
                FrameTest(frame_id="circle", admits=True, rationale="y"),
            ])


# ---------------------------------------------------------------------------
# Primitive 58 — Vanishing-point coherence
# ---------------------------------------------------------------------------

class TestVanishingPoint:
    def test_coherent_when_all_orthogonals_pass_through_vp_exactly(self):
        vp = (10.0, 5.0)
        r = check_vanishing_point(vp, [
            Line2D(id="L1", p=(0, 0), q=(10, 5)),
            Line2D(id="L2", p=(0, 10), q=(10, 5)),
        ], tolerance=1e-9)
        assert r.coherent is True
        assert r.max_distance < 1e-9

    def test_incoherent_when_line_misses_vp_beyond_tolerance(self):
        vp = (10.0, 5.0)
        r = check_vanishing_point(vp, [
            Line2D(id="L1", p=(0, 0), q=(10, 5)),
            Line2D(id="L2", p=(0, 0), q=(10, 0)),  # misses VP by 5 vertically
        ], tolerance=0.5)
        assert r.coherent is False

    def test_per_line_reports_per_line_distance(self):
        vp = (10.0, 5.0)
        r = check_vanishing_point(vp, [
            Line2D(id="L1", p=(0, 0), q=(10, 5)),
            Line2D(id="L2", p=(0, 5), q=(10, 5)),
        ], tolerance=0.5)
        assert len(r.per_line) == 2
        assert all(isinstance(pl.distance, float) for pl in r.per_line)

    def test_requires_at_least_2_lines(self):
        with pytest.raises((ValueError, Exception)):
            check_vanishing_point((0, 0), [Line2D(id="L", p=(0, 0), q=(1, 1))])

    def test_rejects_degenerate_line(self):
        with pytest.raises((ValueError, Exception)):
            check_vanishing_point((0, 0), [
                Line2D(id="L1", p=(1, 1), q=(1, 1)),
                Line2D(id="L2", p=(0, 0), q=(1, 1)),
            ])


# ---------------------------------------------------------------------------
# Primitive 59 — Divine-proportion ledger
# ---------------------------------------------------------------------------

class TestDivineProportion:
    def test_phi_equals_golden_ratio(self):
        assert abs(PHI - 1.6180339887) < 1e-9

    def test_exact_verdict_at_phi(self):
        assert verify_phi(PHI).verdict == "exact"

    def test_approximate_verdict_for_nearby_ratios(self):
        assert verify_phi(1.6).verdict == "approximate"

    def test_none_verdict_for_far_ratios(self):
        assert verify_phi(2.0).verdict == "none"

    def test_ratio_from_pair_computes_a_over_b(self):
        assert abs(ratio_from_pair(8, 5) - 1.6) < 1e-9

    def test_ratio_from_pair_throws_on_zero_denominator(self):
        with pytest.raises((ValueError, Exception)):
            ratio_from_pair(1, 0)

    def test_rationale_tags_approximate_not_as_exact(self):
        r = verify_phi(1.62)
        assert r.verdict == "approximate"
        assert "not be cited as exact" in r.rationale


# ---------------------------------------------------------------------------
# Primitive 60 — Sfumato gradient continuity
# ---------------------------------------------------------------------------

class TestSfumato:
    def test_continuous_when_all_steps_within_tolerance(self):
        samples = [SfumatoSample(position=i, value=i * 0.01) for i in range(10)]
        r = check_sfumato(samples, 0.05)
        assert r.continuous is True
        assert r.discontinuity_index == -1

    def test_flags_discontinuity_when_step_exceeds_tolerance(self):
        samples = [
            SfumatoSample(position=0, value=0),
            SfumatoSample(position=1, value=0.01),
            SfumatoSample(position=2, value=0.5),  # jump
            SfumatoSample(position=3, value=0.51),
        ]
        r = check_sfumato(samples, 0.05)
        assert r.continuous is False
        assert r.discontinuity_index == 2

    def test_total_variation_is_sum_of_absolute_steps(self):
        samples = [
            SfumatoSample(position=0, value=0),
            SfumatoSample(position=1, value=0.1),
            SfumatoSample(position=2, value=0),
        ]
        r = check_sfumato(samples, 0.5)
        assert abs(r.total_variation - 0.2) < 1e-9

    def test_requires_at_least_2_samples(self):
        with pytest.raises((ValueError, Exception)):
            check_sfumato([SfumatoSample(position=0, value=0)])

    def test_orders_samples_by_position_before_measuring(self):
        samples = [
            SfumatoSample(position=2, value=0.1),
            SfumatoSample(position=0, value=0),
            SfumatoSample(position=1, value=0.05),
        ]
        r = check_sfumato(samples, 0.1)
        assert r.continuous is True
