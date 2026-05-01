"""
Jung module — Primitives 45-48.

Primitive 45: Shadow registry
Primitive 46: Individuation ledger
Primitive 47: Archetype mapping
Primitive 48: Synchronicity log
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Dict, List, Literal, Optional, Tuple

# ---------------------------------------------------------------------------
# Primitive 45 — Shadow registry
# ---------------------------------------------------------------------------

@dataclass
class ShadowEntry:
    id: str
    description: str
    declared_at: str  # ISO-8601
    acknowledged: bool


class ShadowRegistry:
    """
    Forces every system to enumerate states it does NOT accept (failure modes,
    refusals, hidden assumptions) so they cannot act unconsciously.
    """

    def __init__(self) -> None:
        self._entries: Dict[str, ShadowEntry] = {}

    def declare(self, id: str, description: str, declared_at: str) -> ShadowEntry:
        e = ShadowEntry(id=id, description=description, declared_at=declared_at, acknowledged=False)
        self._entries[id] = e
        return e

    def acknowledge(self, id: str) -> bool:
        e = self._entries.get(id)
        if e is None:
            return False
        e.acknowledged = True
        return True

    def list(self) -> List[ShadowEntry]:
        return list(self._entries.values())

    def unacknowledged(self) -> List[ShadowEntry]:
        return [e for e in self.list() if not e.acknowledged]

    def is_integrated(self) -> bool:
        """A registry is integrated when every declared shadow is acknowledged."""
        return len(self.unacknowledged()) == 0 and len(self._entries) > 0

    def size(self) -> int:
        return len(self._entries)


# ---------------------------------------------------------------------------
# Primitive 46 — Individuation ledger
# ---------------------------------------------------------------------------

INDIVIDUATION_STAGES: Tuple[str, ...] = (
    "persona",
    "shadow-encounter",
    "anima-animus",
    "self-recognition",
    "wholeness",
)

IndividuationStage = str  # one of INDIVIDUATION_STAGES


@dataclass
class IndividuationEvent:
    stage: str
    witness: str
    timestamp: str


@dataclass
class IndividuationRegression:
    from_stage: str
    to_stage: str


@dataclass
class IndividuationReport:
    stages_reached: List[str]
    monotone: bool
    regressions: List[IndividuationRegression]
    highest: Optional[str]


def _stage_rank(s: str) -> int:
    return list(INDIVIDUATION_STAGES).index(s)


def summarise_individuation(events: List[IndividuationEvent]) -> IndividuationReport:
    stages_reached: List[str] = []
    regressions: List[IndividuationRegression] = []
    highest_rank = -1
    highest: Optional[str] = None

    for ev in events:
        if not ev.witness or ev.witness.strip() == "":
            raise ValueError(f"stage {ev.stage} requires a non-empty witness")
        r = _stage_rank(ev.stage)
        stages_reached.append(ev.stage)
        if r >= highest_rank:
            highest_rank = r
            highest = ev.stage
        else:
            regressions.append(IndividuationRegression(from_stage=highest, to_stage=ev.stage))

    return IndividuationReport(
        stages_reached=stages_reached,
        monotone=len(regressions) == 0,
        regressions=regressions,
        highest=highest,
    )


# ---------------------------------------------------------------------------
# Primitive 47 — Archetype mapping
# ---------------------------------------------------------------------------

ARCHETYPES = frozenset({
    "hero", "sage", "caregiver", "trickster", "ruler",
    "explorer", "creator", "innocent", "lover", "magician", "everyman", "outlaw",
})

Archetype = str  # one of ARCHETYPES


@dataclass
class ArchetypeBinding:
    agent_id: str
    archetype: str
    rationale: str


class ArchetypeMap:
    """
    Legible role routing: every agent acting in a context must declare which
    archetype it is invoking. Mappings are unique per agent, and reversible.
    """

    def __init__(self) -> None:
        self._by_agent: Dict[str, ArchetypeBinding] = {}

    def bind(self, b: ArchetypeBinding) -> None:
        if b.agent_id in self._by_agent:
            raise ValueError(f"agent {b.agent_id} already bound")
        self._by_agent[b.agent_id] = b

    def lookup(self, agent_id: str) -> Optional[ArchetypeBinding]:
        return self._by_agent.get(agent_id)

    def agents_for(self, arch: str) -> List[str]:
        return [b.agent_id for b in self._by_agent.values() if b.archetype == arch]

    def is_legible(self) -> bool:
        """Every agent has a non-empty rationale."""
        return all(b.rationale and b.rationale.strip() for b in self._by_agent.values())

    def size(self) -> int:
        return len(self._by_agent)


# ---------------------------------------------------------------------------
# Primitive 48 — Synchronicity log
# ---------------------------------------------------------------------------

@dataclass
class CoOccurrence:
    event_a: str
    event_b: str
    p_a: float   # marginal probability 0..1
    p_b: float   # marginal probability 0..1
    observed_at: str  # ISO-8601
    note: Optional[str] = None


@dataclass
class SynchronicityRecord:
    event_a: str
    event_b: str
    p_a: float
    p_b: float
    observed_at: str
    note: Optional[str]
    expected_joint: float  # p_a * p_b under independence assumption
    surprise_index: float  # -log2(expected_joint), guarded
    causal_claim: Literal[False] = False  # hard-coded


class SynchronicityLog:
    """
    Records co-occurrences of independent events, computes a naive coincidence
    index, and refuses to assert causation.
    """

    def __init__(self) -> None:
        self._records: List[SynchronicityRecord] = []

    def observe(self, co: CoOccurrence) -> SynchronicityRecord:
        if co.p_a <= 0 or co.p_a > 1 or co.p_b <= 0 or co.p_b > 1:
            raise ValueError("marginals must be in (0,1]")
        expected_joint = co.p_a * co.p_b
        surprise_index = -math.log2(max(expected_joint, 1e-300))
        r = SynchronicityRecord(
            event_a=co.event_a,
            event_b=co.event_b,
            p_a=co.p_a,
            p_b=co.p_b,
            observed_at=co.observed_at,
            note=co.note,
            expected_joint=expected_joint,
            surprise_index=surprise_index,
            causal_claim=False,
        )
        self._records.append(r)
        return r

    def list(self) -> List[SynchronicityRecord]:
        return list(self._records)

    def count(self) -> int:
        return len(self._records)
