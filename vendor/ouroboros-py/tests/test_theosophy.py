"""Tests for theosophy.py — Primitives 49-52."""

import math
import pytest

from ouroboros.theosophy import (
    # Primitive 49
    DecisionRecord,
    audit_brotherhood,
    # Primitive 50
    CorpusCitation,
    triangulate,
    # Primitive 51
    LatentCapacityLedger,
    LatentClaim,
    # Primitive 52
    detect_period,
)


# ---------------------------------------------------------------------------
# Primitive 49 — Universal-brotherhood gate
# ---------------------------------------------------------------------------

class TestBrotherhoodGate:
    def test_passes_when_decisions_agree_across_protected_attrs(self):
        r = audit_brotherhood([
            DecisionRecord(protected_attrs={"creed": "X"}, non_protected_key="case-1", decision="allow"),
            DecisionRecord(protected_attrs={"creed": "Y"}, non_protected_key="case-1", decision="allow"),
        ])
        assert r.passes is True
        assert r.violations == []

    def test_flags_violation_when_decisions_diverge(self):
        r = audit_brotherhood([
            DecisionRecord(protected_attrs={"creed": "X"}, non_protected_key="case-1", decision="allow"),
            DecisionRecord(protected_attrs={"creed": "Y"}, non_protected_key="case-1", decision="deny"),
        ])
        assert r.passes is False
        assert len(r.violations) == 1

    def test_groups_by_non_protected_key(self):
        r = audit_brotherhood([
            DecisionRecord(protected_attrs={}, non_protected_key="k1", decision=1),
            DecisionRecord(protected_attrs={}, non_protected_key="k2", decision=2),
        ])
        assert sorted(r.grouped_by_non_protected.keys()) == ["k1", "k2"]

    def test_empty_input_passes_vacuously(self):
        r = audit_brotherhood([])
        assert r.passes is True

    def test_multiple_matching_decisions_still_pass(self):
        r = audit_brotherhood([
            DecisionRecord(protected_attrs={}, non_protected_key="k", decision="x"),
            DecisionRecord(protected_attrs={}, non_protected_key="k", decision="x"),
            DecisionRecord(protected_attrs={}, non_protected_key="k", decision="x"),
        ])
        assert r.passes is True


# ---------------------------------------------------------------------------
# Primitive 50 — Comparative-corpus reading
# ---------------------------------------------------------------------------

class TestComparativeCorpus:
    def test_passes_with_three_distinct_corpora(self):
        r = triangulate([
            CorpusCitation(corpus_id="vedas", reference="Rg-Veda 1.1"),
            CorpusCitation(corpus_id="platonic", reference="Republic"),
            CorpusCitation(corpus_id="newtonian", reference="Principia"),
        ])
        assert r.passes is True
        assert r.distinct_corpora == 3

    def test_fails_with_only_two_distinct_corpora(self):
        r = triangulate([
            CorpusCitation(corpus_id="A", reference="x"),
            CorpusCitation(corpus_id="A", reference="y"),
            CorpusCitation(corpus_id="B", reference="z"),
        ])
        assert r.passes is False
        assert r.distinct_corpora == 2

    def test_required_threshold_is_configurable(self):
        r = triangulate([
            CorpusCitation(corpus_id="A", reference="x"),
            CorpusCitation(corpus_id="B", reference="y"),
        ], required=2)
        assert r.passes is True

    def test_rationale_describes_outcome(self):
        r = triangulate([CorpusCitation(corpus_id="A", reference="x")])
        assert "under-triangulated" in r.rationale

    def test_empty_citations_fails(self):
        r = triangulate([])
        assert r.passes is False
        assert r.distinct_corpora == 0


# ---------------------------------------------------------------------------
# Primitive 51 — Latent-capacity ledger
# ---------------------------------------------------------------------------

class TestLatentCapacityLedger:
    def _full_claim(self, capacity_id: str = "c1") -> LatentClaim:
        return LatentClaim(
            capacity_id=capacity_id,
            description="memory recall",
            witness="Dr X",
            activation_criterion="passes 90% recall test",
            falsifier="fails recall under double-blind",
        )

    def test_declares_with_full_triple(self):
        l = LatentCapacityLedger()
        e = l.declare(self._full_claim(), "2026-05-01")
        assert e.activated is False
        assert e.falsified is False

    def test_rejects_missing_falsifier(self):
        l = LatentCapacityLedger()
        with pytest.raises((ValueError, Exception)):
            l.declare(
                LatentClaim(
                    capacity_id="c1",
                    description="x",
                    witness="w",
                    activation_criterion="y",
                    falsifier="",
                ),
                "t",
            )

    def test_activate_succeeds_before_falsify(self):
        l = LatentCapacityLedger()
        l.declare(LatentClaim(
            capacity_id="c1", description="x", witness="w",
            activation_criterion="y", falsifier="z"
        ), "t")
        assert l.activate("c1") is True

    def test_falsify_locks_out_activate(self):
        l = LatentCapacityLedger()
        l.declare(LatentClaim(
            capacity_id="c1", description="x", witness="w",
            activation_criterion="y", falsifier="z"
        ), "t")
        l.falsify("c1")
        assert l.activate("c1") is False

    def test_falsify_clears_prior_activation(self):
        l = LatentCapacityLedger()
        l.declare(LatentClaim(
            capacity_id="c1", description="x", witness="w",
            activation_criterion="y", falsifier="z"
        ), "t")
        l.activate("c1")
        l.falsify("c1")
        assert l.list()[0].activated is False

    def test_activate_unknown_returns_false(self):
        l = LatentCapacityLedger()
        assert l.activate("missing") is False


# ---------------------------------------------------------------------------
# Primitive 52 — Periodicity tracker
# ---------------------------------------------------------------------------

class TestPeriodicityTracker:
    def test_detects_period_4_sine_wave(self):
        series = [math.sin(2 * math.pi * i / 4) for i in range(32)]
        r = detect_period(series)
        assert r.declared is True
        assert r.dominant_lag in [2, 4]

    def test_no_period_for_constant_series(self):
        r = detect_period([1, 1, 1, 1, 1, 1, 1, 1])
        assert r.declared is False
        assert r.dominant_lag == 0

    def test_handles_short_series_gracefully(self):
        r = detect_period([1, 2])
        assert r.declared is False

    def test_respects_threshold(self):
        series = [1, 2, 1, 2, 1, 2, 1, 2]
        high = detect_period(series, None, 0.99)
        low = detect_period(series, None, 0.1)
        assert low.declared is True
        assert high.dominant_lag >= 0

    def test_declared_false_when_peak_below_threshold(self):
        import random
        random.seed(42)
        series = [random.random() for _ in range(16)]
        r = detect_period(series, None, 0.99)
        assert r.declared is False
