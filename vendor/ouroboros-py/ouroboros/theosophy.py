"""
Theosophy module — Primitives 49-52.

Primitive 49: Universal-brotherhood gate
Primitive 50: Comparative-corpus reading
Primitive 51: Latent-capacity ledger
Primitive 52: Periodicity tracker
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Any, Dict, Generic, List, Optional, TypeVar

T = TypeVar("T")

# ---------------------------------------------------------------------------
# Primitive 49 — Universal-brotherhood gate
# ---------------------------------------------------------------------------

@dataclass
class DecisionRecord:
    protected_attrs: Dict[str, str]
    non_protected_key: str
    decision: Any


@dataclass
class BrotherhoodViolation:
    key: str
    distinct: List[Any]


@dataclass
class BrotherhoodAudit:
    grouped_by_non_protected: Dict[str, List[Any]]
    violations: List[BrotherhoodViolation]
    passes: bool


def audit_brotherhood(records: List[DecisionRecord]) -> BrotherhoodAudit:
    """
    A routing decision must not vary across protected attributes when
    non-protected inputs are equal.
    """
    grouped: Dict[str, List[Any]] = {}
    for r in records:
        key = r.non_protected_key
        if key not in grouped:
            grouped[key] = []
        grouped[key].append(r.decision)

    violations: List[BrotherhoodViolation] = []
    for key, decisions in grouped.items():
        # Deduplicate while preserving order (like JS Set)
        seen = []
        seen_set = set()
        for d in decisions:
            # Use repr for hashability
            h = repr(d)
            if h not in seen_set:
                seen_set.add(h)
                seen.append(d)
        distinct = seen
        if len(distinct) > 1:
            violations.append(BrotherhoodViolation(key=key, distinct=distinct))

    return BrotherhoodAudit(
        grouped_by_non_protected=grouped,
        violations=violations,
        passes=len(violations) == 0,
    )


# ---------------------------------------------------------------------------
# Primitive 50 — Comparative-corpus reading
# ---------------------------------------------------------------------------

@dataclass
class CorpusCitation:
    corpus_id: str  # distinct corpus identifier
    reference: str  # citation string


@dataclass
class TriangulationReceipt:
    citations: List[CorpusCitation]
    distinct_corpora: int
    required: int
    passes: bool
    rationale: str


def triangulate(citations: List[CorpusCitation], required: int = 3) -> TriangulationReceipt:
    """
    Any factual claim of cross-tradition scope must cite >= 3 independent
    corpora before being accepted.
    """
    distinct = len({c.corpus_id for c in citations})
    passes = distinct >= required
    return TriangulationReceipt(
        citations=citations,
        distinct_corpora=distinct,
        required=required,
        passes=passes,
        rationale=(
            f"triangulation passes: {distinct} distinct corpora >= {required}"
            if passes
            else f"under-triangulated: {distinct} corpora < {required} required"
        ),
    )


# ---------------------------------------------------------------------------
# Primitive 51 — Latent-capacity ledger
# ---------------------------------------------------------------------------

@dataclass
class LatentClaim:
    capacity_id: str
    description: str
    witness: str
    activation_criterion: str
    falsifier: str


@dataclass
class LatentEntry:
    capacity_id: str
    description: str
    witness: str
    activation_criterion: str
    falsifier: str
    accepted_at: str
    activated: bool
    falsified: bool


class LatentCapacityLedger:
    """
    Any claim that a system holds a capacity not yet activated must be entered
    with (a) a witness, (b) an activation criterion, (c) a falsifier.
    """

    def __init__(self) -> None:
        self._entries: Dict[str, LatentEntry] = {}

    def declare(self, claim: LatentClaim, accepted_at: str) -> LatentEntry:
        if not claim.witness or not claim.activation_criterion or not claim.falsifier:
            raise ValueError("latent claim requires witness, activationCriterion, and falsifier")
        e = LatentEntry(
            capacity_id=claim.capacity_id,
            description=claim.description,
            witness=claim.witness,
            activation_criterion=claim.activation_criterion,
            falsifier=claim.falsifier,
            accepted_at=accepted_at,
            activated=False,
            falsified=False,
        )
        self._entries[claim.capacity_id] = e
        return e

    def activate(self, id: str) -> bool:
        e = self._entries.get(id)
        if e is None or e.falsified:
            return False
        e.activated = True
        return True

    def falsify(self, id: str) -> bool:
        e = self._entries.get(id)
        if e is None:
            return False
        e.falsified = True
        e.activated = False
        return True

    def list(self) -> List[LatentEntry]:
        return list(self._entries.values())


# ---------------------------------------------------------------------------
# Primitive 52 — Periodicity tracker
# ---------------------------------------------------------------------------

@dataclass
class PeriodicityReport:
    dominant_lag: int    # 0 if no peak above threshold
    strength: float      # normalised autocorrelation in [-1, 1]
    threshold: float
    declared: bool       # whether dominant_lag > 0 above threshold


def detect_period(
    series: List[float],
    max_lag: Optional[int] = None,
    threshold: float = 0.5,
) -> PeriodicityReport:
    """
    Naive autocorrelation peak finder over a sequence of observations,
    returning the dominant integer lag and its strength.
    """
    if max_lag is None:
        max_lag = len(series) // 2

    if len(series) < 4:
        return PeriodicityReport(dominant_lag=0, strength=0.0, threshold=threshold, declared=False)

    n = len(series)
    mean = sum(series) / n
    centered = [x - mean for x in series]
    denom = sum(c * c for c in centered)

    if denom == 0:
        return PeriodicityReport(dominant_lag=0, strength=0.0, threshold=threshold, declared=False)

    best_lag = 0
    best_r = 0.0

    for lag in range(1, max_lag + 1):
        num = sum(centered[i] * centered[i + lag] for i in range(n - lag))
        r = num / denom
        if abs(r) > abs(best_r):
            best_r = r
            best_lag = lag

    declared = abs(best_r) >= threshold and best_lag > 0
    return PeriodicityReport(
        dominant_lag=best_lag if declared else 0,
        strength=best_r,
        threshold=threshold,
        declared=declared,
    )
