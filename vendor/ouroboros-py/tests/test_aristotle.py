"""Tests for ouroboros.aristotle (Primitives 73–76)."""
from __future__ import annotations

import math

import pytest

from ouroboros.aristotle import (
    Property,
    abstract_by_removal,
    more_akribeic,
    qua_realism_gate,
    trivial_true_verifier,
    trivial_false_verifier,
    Premise,
    separate,
    definition_is_honest,
    potential_infinite_gate,
)


# Primitive 73


SAMPLE_PROPS = [
    Property("weight"),
    Property("color"),
    Property("material"),
    Property("volume"),
    Property("radius"),
]


def test_aphairesis_retains_named() -> None:
    r = abstract_by_removal("bronze", SAMPLE_PROPS, ["volume", "radius"], "geometer", "t0")
    assert sorted(p.name for p in r.retained) == ["radius", "volume"]


def test_aphairesis_removes_others() -> None:
    r = abstract_by_removal("bronze", SAMPLE_PROPS, ["volume", "radius"], "geometer", "t0")
    assert sorted(p.name for p in r.removed) == ["color", "material", "weight"]


def test_aphairesis_precision() -> None:
    r = abstract_by_removal("bronze", SAMPLE_PROPS, ["volume", "radius"], "geometer", "t0")
    assert math.isclose(r.precision, 3 / 5)


def test_aphairesis_honest_true() -> None:
    r = abstract_by_removal("bronze", SAMPLE_PROPS, ["volume"], "geometer", "t0")
    assert r.honest is True


def test_aphairesis_honest_false_for_fictional_property() -> None:
    r = abstract_by_removal("bronze", SAMPLE_PROPS, ["soul"], "geometer", "t0")
    assert r.honest is False


def test_aphairesis_empty_list() -> None:
    r = abstract_by_removal("bronze", [], [], "geometer", "t0")
    assert r.precision == 0.0
    assert r.honest is True


def test_more_akribeic_higher_precision_wins() -> None:
    a = abstract_by_removal("x", SAMPLE_PROPS, ["volume", "radius"], "g", "t")  # 3/5
    b = abstract_by_removal("x", SAMPLE_PROPS, ["volume"], "g", "t")  # 4/5
    assert more_akribeic(a, b) is b


def test_more_akribeic_tie_returns_a() -> None:
    a = abstract_by_removal("x", SAMPLE_PROPS, ["volume"], "g", "t")
    b = abstract_by_removal("x", SAMPLE_PROPS, ["volume"], "g", "t")
    assert more_akribeic(a, b) is a


# Primitive 74


def test_qua_rejects_empty_subject() -> None:
    r = qua_realism_gate("", "volume", ["e"], trivial_true_verifier)
    assert r.ok is False


def test_qua_rejects_no_evidence() -> None:
    r = qua_realism_gate("bronze", "volume", [], trivial_true_verifier)
    assert r.ok is False
    assert "no evidence" in r.reason


def test_qua_passes_when_verifier_confirms() -> None:
    r = qua_realism_gate("bronze", "volume", ["m"], trivial_true_verifier)
    assert r.ok is True


def test_qua_fails_when_verifier_denies() -> None:
    r = qua_realism_gate("fiction", "truth", ["e"], trivial_false_verifier)
    assert r.ok is False
    assert "fiction" in r.reason
    assert "truth" in r.reason


# Primitive 75


def test_separator_buckets_all_kinds() -> None:
    rep = separate(
        [
            Premise("a", "equals from equals", "axiom"),
            Premise("d", "what a unit is", "definition"),
            Premise("h", "let there be a unit", "hypothesis"),
            Premise("u", "?", "unknown"),
        ]
    )
    assert len(rep.axioms) == 1
    assert len(rep.definitions) == 1
    assert len(rep.hypotheses) == 1
    assert len(rep.unknowns) == 1
    assert rep.ok is False


def test_separator_ok_when_classified() -> None:
    rep = separate([Premise("a", "x", "axiom")])
    assert rep.ok is True


def test_definition_honest_rejects_smuggled_existence() -> None:
    assert definition_is_honest(Premise("d", "a point exists indivisibly", "definition")) is False


def test_definition_honest_accepts_pure_definition() -> None:
    assert definition_is_honest(Premise("d", "a point is that which has no part", "definition")) is True


def test_definition_honest_rejects_non_definition() -> None:
    assert definition_is_honest(Premise("a", "harmless", "axiom")) is False


# Primitive 76


def test_potential_infinite_rejects_actual() -> None:
    v = potential_infinite_gate("c1", "actual-infinite")
    assert v.accepted is False
    assert "actual-infinite rejected" in v.reason


def test_potential_infinite_rejects_no_witness() -> None:
    v = potential_infinite_gate("c1", "potential-infinite")
    assert v.accepted is False


def test_potential_infinite_accepts_strict_increase() -> None:
    v = potential_infinite_gate("c1", "potential-infinite", witness=lambda b: b + 1)
    assert v.accepted is True


def test_potential_infinite_rejects_non_monotone() -> None:
    v = potential_infinite_gate("c1", "potential-infinite", witness=lambda b: b)
    assert v.accepted is False
    assert "monotonicity" in v.reason


def test_potential_infinite_rejects_throwing_witness() -> None:
    def bad(_b: float) -> float:
        raise RuntimeError("boom")

    v = potential_infinite_gate("c1", "potential-infinite", witness=bad)
    assert v.accepted is False
    assert "threw" in v.reason
