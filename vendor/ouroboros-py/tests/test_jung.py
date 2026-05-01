"""Tests for jung.py — Primitives 45-48."""

import math
import pytest

from ouroboros.jung import (
    # Primitive 45
    ShadowRegistry,
    ShadowEntry,
    # Primitive 46
    summarise_individuation,
    IndividuationEvent,
    # Primitive 47
    ArchetypeMap,
    ArchetypeBinding,
    # Primitive 48
    SynchronicityLog,
    CoOccurrence,
)


# ---------------------------------------------------------------------------
# Primitive 45 — Shadow registry
# ---------------------------------------------------------------------------

class TestShadowRegistry:
    def test_declares_and_lists_entries(self):
        r = ShadowRegistry()
        r.declare(id="s1", description="refusal mode A", declared_at="2026-05-01")
        assert r.size() == 1

    def test_not_integrated_until_all_acknowledged(self):
        r = ShadowRegistry()
        r.declare(id="s1", description="x", declared_at="t")
        r.declare(id="s2", description="y", declared_at="t")
        assert r.is_integrated() is False
        r.acknowledge("s1")
        assert r.is_integrated() is False
        r.acknowledge("s2")
        assert r.is_integrated() is True

    def test_empty_registry_is_not_integrated(self):
        r = ShadowRegistry()
        assert r.is_integrated() is False

    def test_acknowledge_unknown_returns_false(self):
        r = ShadowRegistry()
        assert r.acknowledge("missing") is False

    def test_unacknowledged_lists_only_not_acknowledged(self):
        r = ShadowRegistry()
        r.declare(id="s1", description="x", declared_at="t")
        r.declare(id="s2", description="y", declared_at="t")
        r.acknowledge("s1")
        assert [e.id for e in r.unacknowledged()] == ["s2"]

    def test_declaration_sets_acknowledged_false(self):
        r = ShadowRegistry()
        e = r.declare(id="s1", description="x", declared_at="t")
        assert e.acknowledged is False


# ---------------------------------------------------------------------------
# Primitive 46 — Individuation ledger
# ---------------------------------------------------------------------------

class TestIndividuationLedger:
    def test_monotone_advance_detected(self):
        r = summarise_individuation([
            IndividuationEvent(stage="persona", witness="w", timestamp="t1"),
            IndividuationEvent(stage="shadow-encounter", witness="w", timestamp="t2"),
            IndividuationEvent(stage="self-recognition", witness="w", timestamp="t3"),
        ])
        assert r.monotone is True
        assert r.regressions == []
        assert r.highest == "self-recognition"

    def test_regressions_logged_honestly(self):
        r = summarise_individuation([
            IndividuationEvent(stage="self-recognition", witness="w", timestamp="t1"),
            IndividuationEvent(stage="persona", witness="w", timestamp="t2"),
        ])
        assert r.monotone is False
        assert len(r.regressions) == 1
        assert r.regressions[0].from_stage == "self-recognition"
        assert r.regressions[0].to_stage == "persona"

    def test_missing_witness_throws(self):
        with pytest.raises((ValueError, Exception)):
            summarise_individuation([
                IndividuationEvent(stage="persona", witness="", timestamp="t"),
            ])

    def test_repeating_same_stage_is_not_regression(self):
        r = summarise_individuation([
            IndividuationEvent(stage="persona", witness="w", timestamp="t1"),
            IndividuationEvent(stage="persona", witness="w", timestamp="t2"),
        ])
        assert r.monotone is True

    def test_empty_input_gives_null_highest(self):
        r = summarise_individuation([])
        assert r.highest is None
        assert r.monotone is True

    def test_stages_reached_preserves_event_order(self):
        r = summarise_individuation([
            IndividuationEvent(stage="persona", witness="w", timestamp="t1"),
            IndividuationEvent(stage="shadow-encounter", witness="w", timestamp="t2"),
        ])
        assert r.stages_reached == ["persona", "shadow-encounter"]


# ---------------------------------------------------------------------------
# Primitive 47 — Archetype mapping
# ---------------------------------------------------------------------------

class TestArchetypeMap:
    def test_binds_and_looks_up_agent(self):
        m = ArchetypeMap()
        m.bind(ArchetypeBinding(agent_id="a1", archetype="sage", rationale="research role"))
        assert m.lookup("a1").archetype == "sage"

    def test_rejects_double_binding_same_agent(self):
        m = ArchetypeMap()
        m.bind(ArchetypeBinding(agent_id="a1", archetype="sage", rationale="r"))
        with pytest.raises((ValueError, Exception)):
            m.bind(ArchetypeBinding(agent_id="a1", archetype="hero", rationale="r"))

    def test_agents_for_returns_all_agents_in_archetype(self):
        m = ArchetypeMap()
        m.bind(ArchetypeBinding(agent_id="a1", archetype="sage", rationale="r"))
        m.bind(ArchetypeBinding(agent_id="a2", archetype="sage", rationale="r"))
        m.bind(ArchetypeBinding(agent_id="a3", archetype="hero", rationale="r"))
        assert sorted(m.agents_for("sage")) == ["a1", "a2"]

    def test_is_legible_requires_nonempty_rationale(self):
        m = ArchetypeMap()
        m.bind(ArchetypeBinding(agent_id="a1", archetype="sage", rationale="ok"))
        assert m.is_legible() is True

    def test_size_reports_count(self):
        m = ArchetypeMap()
        m.bind(ArchetypeBinding(agent_id="a1", archetype="sage", rationale="r"))
        m.bind(ArchetypeBinding(agent_id="a2", archetype="hero", rationale="r"))
        assert m.size() == 2

    def test_lookup_returns_none_for_unknown(self):
        m = ArchetypeMap()
        assert m.lookup("missing") is None


# ---------------------------------------------------------------------------
# Primitive 48 — Synchronicity log
# ---------------------------------------------------------------------------

class TestSynchronicityLog:
    def test_records_co_occurrence_with_expected_joint(self):
        log = SynchronicityLog()
        r = log.observe(CoOccurrence(
            event_a="A", event_b="B", p_a=0.1, p_b=0.2, observed_at="2026-05-01"
        ))
        assert abs(r.expected_joint - 0.02) < 1e-12

    def test_never_claims_causation(self):
        log = SynchronicityLog()
        r = log.observe(CoOccurrence(
            event_a="A", event_b="B", p_a=0.5, p_b=0.5, observed_at="t"
        ))
        assert r.causal_claim is False

    def test_rejects_non_probability_marginals(self):
        log = SynchronicityLog()
        with pytest.raises((ValueError, Exception)):
            log.observe(CoOccurrence(event_a="A", event_b="B", p_a=0, p_b=0.5, observed_at="t"))
        with pytest.raises((ValueError, Exception)):
            log.observe(CoOccurrence(event_a="A", event_b="B", p_a=1.5, p_b=0.5, observed_at="t"))

    def test_surprise_index_grows_for_rarer_joint_events(self):
        log = SynchronicityLog()
        a = log.observe(CoOccurrence(event_a="A", event_b="B", p_a=0.5, p_b=0.5, observed_at="t"))
        b = log.observe(CoOccurrence(event_a="A", event_b="B", p_a=0.01, p_b=0.01, observed_at="t"))
        assert b.surprise_index > a.surprise_index

    def test_count_tracks_records(self):
        log = SynchronicityLog()
        log.observe(CoOccurrence(event_a="A", event_b="B", p_a=0.5, p_b=0.5, observed_at="t"))
        log.observe(CoOccurrence(event_a="C", event_b="D", p_a=0.5, p_b=0.5, observed_at="t"))
        assert log.count() == 2
