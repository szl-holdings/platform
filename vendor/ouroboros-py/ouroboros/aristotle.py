"""Aristotle primitives — Python port (Primitives 73–76).

Faithful Python reimplementation of packages/aristotle/src/*.ts.

Source
------
Henry Mendell, "Aristotle and Mathematics," Stanford Encyclopedia of
Philosophy. Aristotle, Posterior Analytics, Metaphysics, Physics III.6.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Callable, List, Sequence


# ---------------------------------------------------------------------------
# Primitive 73 — Aphairesis abstraction
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class Property:
    name: str
    value: object | None = None


@dataclass(frozen=True)
class AphairesisReceipt:
    subject_id: str
    retained: tuple[Property, ...]
    removed: tuple[Property, ...]
    removed_by: str
    timestamp: str
    precision: float
    honest: bool


def abstract_by_removal(
    subject_id: str,
    all_properties: Sequence[Property],
    retained_properties: Sequence[str],
    removed_by: str,
    timestamp: str,
) -> AphairesisReceipt:
    retained_set = set(retained_properties)
    retained: list[Property] = []
    removed: list[Property] = []
    for p in all_properties:
        (retained if p.name in retained_set else removed).append(p)
    total = len(all_properties)
    precision = 0.0 if total == 0 else len(removed) / total
    all_names = {p.name for p in all_properties}
    honest = all(n in all_names for n in retained_properties)
    return AphairesisReceipt(
        subject_id=subject_id,
        retained=tuple(retained),
        removed=tuple(removed),
        removed_by=removed_by,
        timestamp=timestamp,
        precision=precision,
        honest=honest,
    )


def more_akribeic(a: AphairesisReceipt, b: AphairesisReceipt) -> AphairesisReceipt:
    return a if a.precision >= b.precision else b


# ---------------------------------------------------------------------------
# Primitive 74 — Qua-realism gate
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class QuaVerificationResult:
    ok: bool
    reason: str


Verifier = Callable[[str, str], QuaVerificationResult]


def qua_realism_gate(
    subject_id: str,
    qua: str,
    evidence: Sequence[str],
    verifier: Verifier,
) -> QuaVerificationResult:
    if not subject_id or not qua:
        return QuaVerificationResult(False, "subject_id and qua required")
    if len(evidence) == 0:
        return QuaVerificationResult(False, "no evidence supplied")
    return verifier(subject_id, qua)


def trivial_true_verifier(_s: str, _q: str) -> QuaVerificationResult:
    return QuaVerificationResult(True, "verified")


def trivial_false_verifier(s: str, q: str) -> QuaVerificationResult:
    return QuaVerificationResult(False, f"{s} not {q}")


# ---------------------------------------------------------------------------
# Primitive 75 — Axiom / posit separator
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class Premise:
    id: str
    text: str
    kind: str  # "axiom" | "definition" | "hypothesis" | "unknown"


@dataclass(frozen=True)
class SeparationReport:
    axioms: tuple[Premise, ...]
    definitions: tuple[Premise, ...]
    hypotheses: tuple[Premise, ...]
    unknowns: tuple[Premise, ...]
    ok: bool
    reason: str


def separate(premises: Sequence[Premise]) -> SeparationReport:
    axioms: list[Premise] = []
    definitions: list[Premise] = []
    hypotheses: list[Premise] = []
    unknowns: list[Premise] = []
    for p in premises:
        if p.kind == "axiom":
            axioms.append(p)
        elif p.kind == "definition":
            definitions.append(p)
        elif p.kind == "hypothesis":
            hypotheses.append(p)
        else:
            unknowns.append(p)
    ok = len(unknowns) == 0
    return SeparationReport(
        axioms=tuple(axioms),
        definitions=tuple(definitions),
        hypotheses=tuple(hypotheses),
        unknowns=tuple(unknowns),
        ok=ok,
        reason="all premises classified" if ok else f"{len(unknowns)} unclassified",
    )


def definition_is_honest(d: Premise) -> bool:
    if d.kind != "definition":
        return False
    t = d.text.lower()
    for marker in ("there is", "there exists", "exists"):
        if marker in t:
            return False
    return True


# ---------------------------------------------------------------------------
# Primitive 76 — Potential-infinite gate (Aristotelian finitism)
# ---------------------------------------------------------------------------

ContinuationWitness = Callable[[float], float]


@dataclass(frozen=True)
class FinitismVerdict:
    claim_id: str
    accepted: bool
    reason: str


def potential_infinite_gate(
    claim_id: str,
    asserts: str,  # "actual-infinite" | "potential-infinite"
    witness: ContinuationWitness | None = None,
    sample_bounds: Sequence[float] = (1, 10, 1000),
) -> FinitismVerdict:
    if asserts == "actual-infinite":
        return FinitismVerdict(claim_id, False, "actual-infinite rejected (Aristotle, Phys. III.6)")
    if witness is None:
        return FinitismVerdict(claim_id, False, "no continuation-witness supplied")
    for b in sample_bounds:
        try:
            nxt = witness(b)
        except Exception:
            return FinitismVerdict(claim_id, False, f"witness threw at bound {b}")
        if not (nxt > b):
            return FinitismVerdict(claim_id, False, f"witness failed monotonicity at bound {b}")
    return FinitismVerdict(claim_id, True, "potential-infinite verified by monotone witness")


__all__ = [
    "Property",
    "AphairesisReceipt",
    "abstract_by_removal",
    "more_akribeic",
    "QuaVerificationResult",
    "qua_realism_gate",
    "trivial_true_verifier",
    "trivial_false_verifier",
    "Premise",
    "SeparationReport",
    "separate",
    "definition_is_honest",
    "FinitismVerdict",
    "potential_infinite_gate",
]
