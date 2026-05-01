"""Socrates primitives — Python port (Primitives 29–32).

Faithful Python reimplementation of packages/socrates/src/*.ts.

Sources
-------
Plato, Republic 509d–511e, 533c, 531d, 537c; Phaedo 100a; Meno 86e;
Theaetetus 197a; Sophist 230, 253b; Statesman 285b.
"""
from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from typing import Literal


# ---------------------------------------------------------------------------
# Primitive 29 — Divided line / four-level cognition ladder
# ---------------------------------------------------------------------------

CognitiveTier = Literal["EIKASIA", "PISTIS", "DIANOIA", "NOESIS"]

TIER_RANK: dict[str, int] = {
    "EIKASIA": 0,
    "PISTIS": 1,
    "DIANOIA": 2,
    "NOESIS": 3,
}

TIER_GROUNDING: dict[str, float] = {
    "EIKASIA": 0.0,
    "PISTIS": 0.33,
    "DIANOIA": 0.66,
    "NOESIS": 1.0,
}

DividedLineVerdict = Literal[
    "ADMIT_AT_NOESIS",
    "ADMIT_AT_DIANOIA",
    "ADMIT_AT_PISTIS",
    "ADMIT_AT_EIKASIA",
    "DEMOTE_NO_HYPOTHESES",
    "DEMOTE_UNRAISED_HYPOTHESES",
    "DEMOTE_NO_WITNESS",
]


@dataclass(frozen=True)
class ClaimStamp:
    claim_id: str
    declared_tier: str  # CognitiveTier
    hypothesis_ids: tuple[str, ...]
    raised_hypothesis_ids: tuple[str, ...]
    synoptic_witness_hash: str | None


@dataclass(frozen=True)
class DividedLineResult:
    claim_id: str
    declared_tier: str
    admitted_tier: str
    grounding_score: float
    verdict: str
    reason: str


def evaluate_divided_line(stamp: ClaimStamp) -> DividedLineResult:
    """Evaluate a claim's admissibility on the divided line."""
    tier = stamp.declared_tier

    if tier in ("EIKASIA", "PISTIS"):
        return DividedLineResult(
            claim_id=stamp.claim_id,
            declared_tier=tier,
            admitted_tier=tier,
            grounding_score=TIER_GROUNDING[tier],
            verdict="ADMIT_AT_EIKASIA" if tier == "EIKASIA" else "ADMIT_AT_PISTIS",
            reason="Sub-intelligible tier admits without hypotheses.",
        )

    if not stamp.hypothesis_ids:
        return DividedLineResult(
            claim_id=stamp.claim_id,
            declared_tier=tier,
            admitted_tier="PISTIS",
            grounding_score=TIER_GROUNDING["PISTIS"],
            verdict="DEMOTE_NO_HYPOTHESES",
            reason="Dianoetic/noetic claim must declare hypotheses (Republic 510b).",
        )

    if tier == "DIANOIA":
        return DividedLineResult(
            claim_id=stamp.claim_id,
            declared_tier=tier,
            admitted_tier="DIANOIA",
            grounding_score=TIER_GROUNDING["DIANOIA"],
            verdict="ADMIT_AT_DIANOIA",
            reason="Hypotheses present; soul searches from them toward consequences (510b).",
        )

    # NOESIS
    all_raised = all(h in stamp.raised_hypothesis_ids for h in stamp.hypothesis_ids)
    if not all_raised:
        return DividedLineResult(
            claim_id=stamp.claim_id,
            declared_tier=tier,
            admitted_tier="DIANOIA",
            grounding_score=TIER_GROUNDING["DIANOIA"],
            verdict="DEMOTE_UNRAISED_HYPOTHESES",
            reason="Mathematicians dream about being while hypotheses sit undisturbed (533b8).",
        )
    if not stamp.synoptic_witness_hash:
        return DividedLineResult(
            claim_id=stamp.claim_id,
            declared_tier=tier,
            admitted_tier="DIANOIA",
            grounding_score=TIER_GROUNDING["DIANOIA"],
            verdict="DEMOTE_NO_WITNESS",
            reason="Noesis requires synoptikos binding (Republic 531d, 537c).",
        )

    return DividedLineResult(
        claim_id=stamp.claim_id,
        declared_tier="NOESIS",
        admitted_tier="NOESIS",
        grounding_score=TIER_GROUNDING["NOESIS"],
        verdict="ADMIT_AT_NOESIS",
        reason="Hypotheses raised (anairousa, 533c8) and synoptic witness bound.",
    )


def ontological_grounding(results: list[DividedLineResult]) -> float:
    """Mean grounding score over a batch of divided-line results."""
    if not results:
        return 0.0
    return sum(r.grounding_score for r in results) / len(results)


# ---------------------------------------------------------------------------
# Primitive 30 — Hypothesis ledger
# ---------------------------------------------------------------------------

HypothesisStatus = Literal["ASSUMED", "AGREED", "RAISED", "RETRACTED"]


@dataclass
class Hypothesis:
    id: str
    text: str
    parents: list[str]
    status: str  # HypothesisStatus
    account: str | None = None


@dataclass
class LedgerEntry:
    hypothesis: Hypothesis
    derived_claims: list[str]


class HypothesisLedger:
    """Hypothesis ledger following the analytical / hypothetical method."""

    def __init__(self) -> None:
        self._store: dict[str, LedgerEntry] = {}

    def add(self, h: Hypothesis) -> None:
        if h.id in self._store:
            raise ValueError(f"Hypothesis {h.id} already in ledger.")
        for parent_id in h.parents:
            if parent_id not in self._store:
                raise ValueError(f"Parent hypothesis {parent_id} not in ledger.")
        self._store[h.id] = LedgerEntry(hypothesis=Hypothesis(**h.__dict__), derived_claims=[])

    def get(self, id: str) -> Hypothesis | None:
        entry = self._store.get(id)
        return entry.hypothesis if entry else None

    def set_status(self, id: str, status: str, account: str | None = None) -> None:
        entry = self._store.get(id)
        if not entry:
            raise ValueError(f"Hypothesis {id} not found.")
        if status == "RAISED" and not account:
            raise ValueError("Raising a hypothesis requires an account (logos).")
        entry.hypothesis.status = status
        if account:
            entry.hypothesis.account = account

    def attach_claim(self, claim_id: str, hypothesis_ids: list[str]) -> None:
        for hid in hypothesis_ids:
            entry = self._store.get(hid)
            if not entry:
                raise ValueError(f"Hypothesis {hid} not found.")
            entry.derived_claims.append(claim_id)

    def raised_ids(self) -> list[str]:
        return [e.hypothesis.id for e in self._store.values() if e.hypothesis.status == "RAISED"]

    def retracted_ids(self) -> list[str]:
        return [e.hypothesis.id for e in self._store.values() if e.hypothesis.status == "RETRACTED"]

    def is_claim_fully_raised(self, claim_id: str) -> bool:
        required: set[str] = set()
        for entry in self._store.values():
            if claim_id in entry.derived_claims:
                self._collect_ancestors(entry.hypothesis.id, required)
        if not required:
            return False
        return all(
            self._store[hid].hypothesis.status == "RAISED"
            for hid in required
            if hid in self._store
        )

    def _collect_ancestors(self, id: str, into: set[str]) -> None:
        if id in into:
            return
        into.add(id)
        h = self._store.get(id)
        if not h:
            return
        for p in h.hypothesis.parents:
            self._collect_ancestors(p, into)

    def size(self) -> int:
        return len(self._store)


# ---------------------------------------------------------------------------
# Primitive 31 — Elenchus (reductio / refutation gate)
# ---------------------------------------------------------------------------

ElenchusVerdict = Literal["WITHSTOOD", "REFUTED", "APORIA"]


@dataclass(frozen=True)
class Proposition:
    id: str
    text: str
    negation_of: str | None = None


@dataclass(frozen=True)
class Inference:
    from_ids: tuple[str, ...]
    to_id: str
    hypothesis_ids: tuple[str, ...]


@dataclass(frozen=True)
class ElenchusInput:
    claim_id: str
    hypothesis_ids: tuple[str, ...]
    propositions: tuple[Proposition, ...]
    inferences: tuple[Inference, ...]
    max_steps: int = 64


@dataclass(frozen=True)
class ElenchusResult:
    claim_id: str
    verdict: str  # ElenchusVerdict
    reached_ids: tuple[str, ...]
    contradiction_pair: tuple[str, str] | None
    steps: int
    reason: str


def run_elenchus(input: ElenchusInput) -> ElenchusResult:
    """Run an elenchus (BFS forward closure) on a proposition graph."""
    prop_index = {p.id: p for p in input.propositions}
    hyp_set = set(input.hypothesis_ids)

    reached: set[str] = set(input.hypothesis_ids)
    steps = 0
    advanced = True
    while advanced and steps < input.max_steps:
        advanced = False
        steps += 1
        for inf in input.inferences:
            if inf.to_id in reached:
                continue
            hyps_ok = all(h in hyp_set for h in inf.hypothesis_ids)
            froms_ok = all(f in reached for f in inf.from_ids)
            if hyps_ok and froms_ok:
                reached.add(inf.to_id)
                advanced = True

    # Check for contradiction
    for p in input.propositions:
        if p.negation_of and p.id in reached and p.negation_of in reached:
            return ElenchusResult(
                claim_id=input.claim_id,
                verdict="REFUTED",
                reached_ids=tuple(reached),
                contradiction_pair=(p.id, p.negation_of),
                steps=steps,
                reason=f"Contradiction: {p.id} and {p.negation_of} both reachable from declared hypotheses.",
            )

    if input.claim_id in reached:
        return ElenchusResult(
            claim_id=input.claim_id,
            verdict="WITHSTOOD",
            reached_ids=tuple(reached),
            contradiction_pair=None,
            steps=steps,
            reason="Claim derivable; no contradiction reached (Republic elenchus passed).",
        )

    if input.claim_id not in prop_index:
        return ElenchusResult(
            claim_id=input.claim_id,
            verdict="APORIA",
            reached_ids=tuple(reached),
            contradiction_pair=None,
            steps=steps,
            reason="Claim id absent from proposition set; perplexity (aporia) logged.",
        )

    return ElenchusResult(
        claim_id=input.claim_id,
        verdict="APORIA",
        reached_ids=tuple(reached),
        contradiction_pair=None,
        steps=steps,
        reason="Neither claim nor contradiction reachable; aporia (Theaetetus 197a).",
    )


# ---------------------------------------------------------------------------
# Primitive 32 — Synoptic witness
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class NamedPrimitive:
    id: str
    version: str
    digest: str


@dataclass(frozen=True)
class KinshipDeclaration:
    pair: tuple[str, str]
    consonant: bool
    note: str


@dataclass(frozen=True)
class SynopticWitnessInput:
    witness_id: str
    primitives: tuple[NamedPrimitive, ...]
    kinships: tuple[KinshipDeclaration, ...]


@dataclass(frozen=True)
class SynopticWitnessResult:
    witness_id: str
    synoptic_hash: str
    primitive_count: int
    kinship_count: int
    consonant_count: int
    dissonant_count: int
    complete: bool
    reason: str


def bind_synoptic_witness(input: SynopticWitnessInput) -> SynopticWitnessResult:
    """Bind a synoptic witness over a set of named primitives."""
    sorted_prims = sorted(input.primitives, key=lambda p: p.id)
    ids = [p.id for p in sorted_prims]

    required_pairs: set[str] = set()
    for i in range(len(ids)):
        for j in range(i + 1, len(ids)):
            required_pairs.add(f"{ids[i]}::{ids[j]}")

    seen_pairs: set[str] = set()
    consonant = 0
    dissonant = 0
    for k in input.kinships:
        a, b = sorted(k.pair)
        key = f"{a}::{b}"
        seen_pairs.add(key)
        if k.consonant:
            consonant += 1
        else:
            dissonant += 1

    complete = all(p in seen_pairs for p in required_pairs)

    # Build canonical JSON (must match the TS canonicalization exactly)
    canonical = json.dumps({
        "witnessId": input.witness_id,
        "primitives": [
            {"id": p.id, "version": p.version, "digest": p.digest}
            for p in sorted_prims
        ],
        "kinships": sorted(
            [
                {"pair": sorted(list(k.pair)), "consonant": k.consonant}
                for k in input.kinships
            ],
            key=lambda x: "::".join(x["pair"]),
        ),
    }, separators=(",", ":"))

    synoptic_hash = hashlib.sha256(canonical.encode()).hexdigest()

    return SynopticWitnessResult(
        witness_id=input.witness_id,
        synoptic_hash=synoptic_hash,
        primitive_count=len(input.primitives),
        kinship_count=len(input.kinships),
        consonant_count=consonant,
        dissonant_count=dissonant,
        complete=complete,
        reason=(
            "All pair-wise kinships declared; synopticHash bound (Republic 537c)."
            if complete
            else "Incomplete kinship declarations; not yet a dialectician (Republic 531d9)."
        ),
    )
