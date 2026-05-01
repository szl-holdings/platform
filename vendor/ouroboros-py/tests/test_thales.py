"""Tests for the Thales primitives — Python port."""
from __future__ import annotations

import math

import pytest

from ouroboros.thales import (
    Chord,
    LocusThresholds,
    Point2D,
    SimilarityThresholds,
    ThalesObservation,
    ThalesReference,
    WitnessOnCircle,
    compute_similarity,
    locus_axis,
    similarity_axis,
    unit_diameter,
    verify_inscribed_angle,
)


# --- Primitive 15: Similarity Ratio --------------------------------------

class TestSimilarity:
    def test_cheops_height_inferred_from_staff_and_shadow(self):
        # H = 146.5, S = 230 (one face length proxy), staff h=1, s=1.5699658703
        r = compute_similarity(
            ThalesReference(reference_height=1, reference_shadow=1.5699658703),
            ThalesObservation(observed_shadow=230),
        )
        assert r.inferred_height == pytest.approx(146.5, abs=1e-3)
        assert r.trust_ratio == pytest.approx(0.6369, abs=1e-3)

    def test_trust_ratio_independent_of_observed_shadow(self):
        a = compute_similarity(
            ThalesReference(2, 3), ThalesObservation(observed_shadow=100)
        )
        b = compute_similarity(
            ThalesReference(2, 3), ThalesObservation(observed_shadow=99999)
        )
        assert a.trust_ratio == b.trust_ratio

    def test_similar_when_defect_under_5_percent(self):
        r = compute_similarity(
            ThalesReference(1, 1),
            ThalesObservation(observed_shadow=100, observed_height=102),
        )
        assert r.verdict == "SIMILAR"
        assert r.similarity_defect == pytest.approx(0.02, abs=1e-3)

    def test_degraded_in_5_to_20_percent_band(self):
        r = compute_similarity(
            ThalesReference(1, 1),
            ThalesObservation(observed_shadow=100, observed_height=110),
        )
        assert r.verdict == "DEGRADED"

    def test_broken_above_20_percent(self):
        r = compute_similarity(
            ThalesReference(1, 1),
            ThalesObservation(observed_shadow=100, observed_height=50),
        )
        assert r.verdict == "BROKEN"

    def test_undefined_without_observation(self):
        r = compute_similarity(
            ThalesReference(1, 1), ThalesObservation(observed_shadow=100)
        )
        assert r.verdict == "UNDEFINED"
        assert math.isnan(r.similarity_defect)

    def test_rejects_degenerate_reference(self):
        with pytest.raises(ValueError):
            compute_similarity(
                ThalesReference(0, 1), ThalesObservation(observed_shadow=1)
            )
        with pytest.raises(ValueError):
            compute_similarity(
                ThalesReference(1, 0), ThalesObservation(observed_shadow=1)
            )

    def test_axis_perfect_similarity_returns_one(self):
        r = compute_similarity(
            ThalesReference(1, 1),
            ThalesObservation(observed_shadow=10, observed_height=10),
        )
        assert similarity_axis(r) == 1.0

    def test_axis_broken_returns_zero(self):
        r = compute_similarity(
            ThalesReference(1, 1),
            ThalesObservation(observed_shadow=10, observed_height=1),
        )
        assert similarity_axis(r) == 0.0

    def test_axis_undefined_returns_one(self):
        r = compute_similarity(
            ThalesReference(1, 1), ThalesObservation(observed_shadow=10)
        )
        assert similarity_axis(r) == 1.0

    def test_axis_monotonic_in_defect(self):
        r5 = compute_similarity(
            ThalesReference(1, 1),
            ThalesObservation(observed_shadow=100, observed_height=105.5),
        )
        r15 = compute_similarity(
            ThalesReference(1, 1),
            ThalesObservation(observed_shadow=100, observed_height=115),
        )
        assert similarity_axis(r5) > similarity_axis(r15)


# --- Primitive 16: Inscribed-Angle Locus ---------------------------------

def _on_unit(id_: str, theta: float) -> WitnessOnCircle:
    return WitnessOnCircle(id=id_, point=Point2D(math.cos(theta), math.sin(theta)))


class TestInscribedAngle:
    def test_classical_thales_theorem_diameter_subtends_right_angle(self):
        witnesses = [
            _on_unit("a", math.pi / 6),
            _on_unit("b", math.pi / 3),
            _on_unit("c", 2 * math.pi / 3),
            _on_unit("d", 5 * math.pi / 6),
        ]
        report = verify_inscribed_angle(witnesses, unit_diameter())
        assert report.verdict == "ON_LOCUS"
        assert report.median_angle == pytest.approx(math.pi / 2, abs=1e-9)
        assert report.max_deviation < 1e-9

    def test_on_locus_for_a_non_diameter_chord(self):
        chord = Chord(a=Point2D(1, 0), b=Point2D(0, 1))
        witnesses = [
            _on_unit("a", 3 * math.pi / 4),
            _on_unit("b", math.pi),
            _on_unit("c", 5 * math.pi / 4),
            _on_unit("d", 3 * math.pi / 2),
        ]
        report = verify_inscribed_angle(witnesses, chord)
        assert report.verdict == "ON_LOCUS"
        assert report.max_deviation < 1e-9

    def test_off_locus_for_a_witness_far_from_circle(self):
        witnesses = [
            _on_unit("a", math.pi / 6),
            _on_unit("b", math.pi / 3),
            _on_unit("c", 2 * math.pi / 3),
            WitnessOnCircle(id="rogue", point=Point2D(0, 0)),
        ]
        report = verify_inscribed_angle(witnesses, unit_diameter())
        assert report.verdict == "OFF_LOCUS"

    def test_insufficient_with_two_witnesses(self):
        r = verify_inscribed_angle(
            [_on_unit("a", 0.5), _on_unit("b", 1.5)], unit_diameter()
        )
        assert r.verdict == "INSUFFICIENT"

    def test_locus_axis_one_for_clean_circle(self):
        witnesses = [
            _on_unit("a", math.pi / 6),
            _on_unit("b", math.pi / 3),
            _on_unit("c", 2 * math.pi / 3),
        ]
        report = verify_inscribed_angle(witnesses, unit_diameter())
        assert locus_axis(report) == pytest.approx(1.0, abs=1e-9)

    def test_locus_axis_zero_for_rogue(self):
        witnesses = [
            _on_unit("a", math.pi / 6),
            _on_unit("b", math.pi / 3),
            _on_unit("c", 2 * math.pi / 3),
            WitnessOnCircle(id="rogue", point=Point2D(0, 0)),
        ]
        report = verify_inscribed_angle(witnesses, unit_diameter())
        assert locus_axis(report) == 0.0

    def test_locus_axis_one_when_insufficient(self):
        r = verify_inscribed_angle([_on_unit("a", 0.5)], unit_diameter())
        assert locus_axis(r) == 1.0
