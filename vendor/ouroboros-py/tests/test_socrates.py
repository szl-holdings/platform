"""Tests for the Socrates primitives Python port (Primitives 29–32)."""
from __future__ import annotations

import pytest

from ouroboros.socrates import (
    ClaimStamp,
    ElenchusInput,
    Hypothesis,
    HypothesisLedger,
    Inference,
    KinshipDeclaration,
    NamedPrimitive,
    Proposition,
    SynopticWitnessInput,
    bind_synoptic_witness,
    evaluate_divided_line,
    ontological_grounding,
    run_elenchus,
)


def _stamp(**kwargs):
    defaults = dict(
        claim_id="c1",
        declared_tier="DIANOIA",
        hypothesis_ids=("h1",),
        raised_hypothesis_ids=(),
        synoptic_witness_hash=None,
    )
    defaults.update(kwargs)
    return ClaimStamp(**defaults)


# ---------------------------------------------------------------------------
# Primitive 29 — Divided line
# ---------------------------------------------------------------------------

class TestDividedLine:
    def test_admits_eikasia(self) -> None:
        r = evaluate_divided_line(_stamp(declared_tier="EIKASIA", hypothesis_ids=()))
        assert r.admitted_tier == "EIKASIA"
        assert r.grounding_score == 0.0
        assert r.verdict == "ADMIT_AT_EIKASIA"

    def test_admits_pistis(self) -> None:
        r = evaluate_divided_line(_stamp(declared_tier="PISTIS", hypothesis_ids=()))
        assert r.admitted_tier == "PISTIS"
        assert abs(r.grounding_score - 0.33) < 1e-9

    def test_demotes_dianoia_without_hypotheses(self) -> None:
        r = evaluate_divided_line(_stamp(hypothesis_ids=()))
        assert r.verdict == "DEMOTE_NO_HYPOTHESES"
        assert r.admitted_tier == "PISTIS"

    def test_admits_dianoia_with_hypotheses(self) -> None:
        r = evaluate_divided_line(_stamp(declared_tier="DIANOIA"))
        assert r.admitted_tier == "DIANOIA"
        assert abs(r.grounding_score - 0.66) < 1e-9

    def test_demotes_noesis_with_unraised_hypotheses(self) -> None:
        r = evaluate_divided_line(_stamp(declared_tier="NOESIS"))
        assert r.verdict == "DEMOTE_UNRAISED_HYPOTHESES"
        assert r.admitted_tier == "DIANOIA"

    def test_demotes_noesis_without_synoptic_witness(self) -> None:
        r = evaluate_divided_line(_stamp(declared_tier="NOESIS", raised_hypothesis_ids=("h1",)))
        assert r.verdict == "DEMOTE_NO_WITNESS"
        assert r.admitted_tier == "DIANOIA"

    def test_admits_noesis_fully(self) -> None:
        r = evaluate_divided_line(_stamp(
            declared_tier="NOESIS",
            raised_hypothesis_ids=("h1",),
            synoptic_witness_hash="deadbeef",
        ))
        assert r.admitted_tier == "NOESIS"
        assert r.grounding_score == 1.0
        assert r.verdict == "ADMIT_AT_NOESIS"

    def test_ontological_grounding_mean(self) -> None:
        a = evaluate_divided_line(_stamp(declared_tier="EIKASIA", hypothesis_ids=()))
        b = evaluate_divided_line(_stamp(
            declared_tier="NOESIS",
            raised_hypothesis_ids=("h1",),
            synoptic_witness_hash="h",
        ))
        assert abs(ontological_grounding([a, b]) - 0.5) < 1e-5
        assert ontological_grounding([]) == 0


# ---------------------------------------------------------------------------
# Primitive 30 — Hypothesis ledger
# ---------------------------------------------------------------------------

class TestHypothesisLedger:
    def test_add_and_retrieve(self) -> None:
        l = HypothesisLedger()
        l.add(Hypothesis(id="h1", text="x is finite", parents=[], status="ASSUMED"))
        assert l.get("h1") is not None
        assert l.get("h1").text == "x is finite"
        assert l.size() == 1

    def test_rejects_duplicate_ids(self) -> None:
        l = HypothesisLedger()
        l.add(Hypothesis(id="h1", text="a", parents=[], status="ASSUMED"))
        with pytest.raises(ValueError):
            l.add(Hypothesis(id="h1", text="b", parents=[], status="ASSUMED"))

    def test_rejects_unknown_parents(self) -> None:
        l = HypothesisLedger()
        with pytest.raises(ValueError):
            l.add(Hypothesis(id="h1", text="a", parents=["missing"], status="ASSUMED"))

    def test_requires_account_to_raise(self) -> None:
        l = HypothesisLedger()
        l.add(Hypothesis(id="h1", text="a", parents=[], status="ASSUMED"))
        with pytest.raises(ValueError):
            l.set_status("h1", "RAISED")
        l.set_status("h1", "RAISED", "logos given")
        assert l.get("h1").status == "RAISED"
        assert l.get("h1").account == "logos given"

    def test_tracks_raised_and_retracted(self) -> None:
        l = HypothesisLedger()
        l.add(Hypothesis(id="h1", text="a", parents=[], status="ASSUMED"))
        l.add(Hypothesis(id="h2", text="b", parents=[], status="ASSUMED"))
        l.add(Hypothesis(id="h3", text="c", parents=[], status="ASSUMED"))
        l.set_status("h1", "RAISED", "ok")
        l.set_status("h2", "RETRACTED")
        assert l.raised_ids() == ["h1"]
        assert l.retracted_ids() == ["h2"]

    def test_is_claim_fully_raised_ancestor_chain(self) -> None:
        l = HypothesisLedger()
        l.add(Hypothesis(id="h1", text="root", parents=[], status="RAISED", account="a"))
        l.add(Hypothesis(id="h2", text="child", parents=["h1"], status="RAISED", account="b"))
        l.attach_claim("C", ["h2"])
        assert l.is_claim_fully_raised("C") is True
        l.add(Hypothesis(id="h3", text="grand", parents=["h2"], status="ASSUMED"))
        l.attach_claim("D", ["h3"])
        assert l.is_claim_fully_raised("D") is False

    def test_false_for_claim_with_no_hypotheses(self) -> None:
        l = HypothesisLedger()
        assert l.is_claim_fully_raised("Z") is False

    def test_attach_claim_throws_if_missing(self) -> None:
        l = HypothesisLedger()
        with pytest.raises(ValueError):
            l.attach_claim("X", ["nope"])


# ---------------------------------------------------------------------------
# Primitive 31 — Elenchus
# ---------------------------------------------------------------------------

class TestElenchus:
    def test_withstood_when_claim_derivable(self) -> None:
        r = run_elenchus(ElenchusInput(
            claim_id="Q",
            hypothesis_ids=("H",),
            propositions=(
                Proposition(id="Q", text="the claim"),
                Proposition(id="H", text="hypothesis"),
            ),
            inferences=(
                Inference(from_ids=("H",), to_id="Q", hypothesis_ids=("H",)),
            ),
        ))
        assert r.verdict == "WITHSTOOD"
        assert "Q" in r.reached_ids

    def test_refuted_when_contradiction_reachable(self) -> None:
        r = run_elenchus(ElenchusInput(
            claim_id="Q",
            hypothesis_ids=("H",),
            propositions=(
                Proposition(id="P", text="p"),
                Proposition(id="NP", text="not p", negation_of="P"),
                Proposition(id="H", text="h"),
                Proposition(id="Q", text="q"),
            ),
            inferences=(
                Inference(from_ids=("H",), to_id="P", hypothesis_ids=("H",)),
                Inference(from_ids=("H",), to_id="NP", hypothesis_ids=("H",)),
            ),
        ))
        assert r.verdict == "REFUTED"
        assert r.contradiction_pair == ("NP", "P")

    def test_aporia_when_claim_unreachable(self) -> None:
        r = run_elenchus(ElenchusInput(
            claim_id="Q",
            hypothesis_ids=("H",),
            propositions=(
                Proposition(id="Q", text="q"),
                Proposition(id="H", text="h"),
            ),
            inferences=(),
        ))
        assert r.verdict == "APORIA"

    def test_aporia_when_claim_absent(self) -> None:
        r = run_elenchus(ElenchusInput(
            claim_id="missing",
            hypothesis_ids=("H",),
            propositions=(Proposition(id="H", text="h"),),
            inferences=(),
        ))
        assert r.verdict == "APORIA"
        assert "absent" in r.reason

    def test_does_not_advance_missing_hypothesis(self) -> None:
        r = run_elenchus(ElenchusInput(
            claim_id="Q",
            hypothesis_ids=(),
            propositions=(
                Proposition(id="Q", text="q"),
                Proposition(id="H", text="h"),
            ),
            inferences=(
                Inference(from_ids=("H",), to_id="Q", hypothesis_ids=("H",)),
            ),
        ))
        assert r.verdict == "APORIA"
        assert "Q" not in r.reached_ids

    def test_respects_max_steps(self) -> None:
        r = run_elenchus(ElenchusInput(
            claim_id="Q",
            hypothesis_ids=("H",),
            propositions=(
                Proposition(id="H", text="h"),
                Proposition(id="Q", text="q"),
            ),
            inferences=(
                Inference(from_ids=("H",), to_id="Q", hypothesis_ids=("H",)),
            ),
            max_steps=1,
        ))
        assert r.steps <= 1
        assert r.verdict == "WITHSTOOD"


# ---------------------------------------------------------------------------
# Primitive 32 — Synoptic witness
# ---------------------------------------------------------------------------

class TestSynopticWitness:
    def test_complete_when_all_pairs_declared(self) -> None:
        r = bind_synoptic_witness(SynopticWitnessInput(
            witness_id="W",
            primitives=(
                NamedPrimitive(id="a", version="1", digest="x"),
                NamedPrimitive(id="b", version="1", digest="y"),
                NamedPrimitive(id="c", version="1", digest="z"),
            ),
            kinships=(
                KinshipDeclaration(pair=("a", "b"), consonant=True, note=""),
                KinshipDeclaration(pair=("a", "c"), consonant=True, note=""),
                KinshipDeclaration(pair=("b", "c"), consonant=True, note=""),
            ),
        ))
        assert r.complete is True
        assert r.consonant_count == 3
        assert r.dissonant_count == 0

    def test_incomplete_when_pair_missing(self) -> None:
        r = bind_synoptic_witness(SynopticWitnessInput(
            witness_id="W",
            primitives=(
                NamedPrimitive(id="a", version="1", digest="x"),
                NamedPrimitive(id="b", version="1", digest="y"),
                NamedPrimitive(id="c", version="1", digest="z"),
            ),
            kinships=(KinshipDeclaration(pair=("a", "b"), consonant=True, note=""),),
        ))
        assert r.complete is False

    def test_hash_is_deterministic(self) -> None:
        a = bind_synoptic_witness(SynopticWitnessInput(
            witness_id="W",
            primitives=(
                NamedPrimitive(id="p2", version="1", digest="y"),
                NamedPrimitive(id="p1", version="1", digest="x"),
            ),
            kinships=(KinshipDeclaration(pair=("p2", "p1"), consonant=True, note=""),),
        ))
        b = bind_synoptic_witness(SynopticWitnessInput(
            witness_id="W",
            primitives=(
                NamedPrimitive(id="p1", version="1", digest="x"),
                NamedPrimitive(id="p2", version="1", digest="y"),
            ),
            kinships=(KinshipDeclaration(pair=("p1", "p2"), consonant=True, note=""),),
        ))
        assert a.synoptic_hash == b.synoptic_hash

    def test_hash_changes_with_digest(self) -> None:
        a = bind_synoptic_witness(SynopticWitnessInput(
            witness_id="W",
            primitives=(NamedPrimitive(id="p", version="1", digest="x"),),
            kinships=(),
        ))
        b = bind_synoptic_witness(SynopticWitnessInput(
            witness_id="W",
            primitives=(NamedPrimitive(id="p", version="1", digest="y"),),
            kinships=(),
        ))
        assert a.synoptic_hash != b.synoptic_hash

    def test_counts_dissonant(self) -> None:
        r = bind_synoptic_witness(SynopticWitnessInput(
            witness_id="W",
            primitives=(
                NamedPrimitive(id="a", version="1", digest="x"),
                NamedPrimitive(id="b", version="1", digest="y"),
            ),
            kinships=(KinshipDeclaration(pair=("a", "b"), consonant=False, note="broken"),),
        ))
        assert r.dissonant_count == 1

    def test_empty_primitives_vacuously_complete(self) -> None:
        r = bind_synoptic_witness(SynopticWitnessInput(
            witness_id="W",
            primitives=(),
            kinships=(),
        ))
        assert r.complete is True
        assert r.primitive_count == 0
