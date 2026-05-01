"""Anduril / Lattice primitives — Python port (Primitives 80–83).

Faithful Python reimplementation of packages/anduril/src/*.ts.

Source
------
Inspired by Anduril Industries Lattice SDK
(github.com/anduril, anduril.com/lattice/lattice-sdk), Menace edge
compute (anduril.com/news Steel Knight), and the Air Force CCA
Autonomy Government Reference Architecture (af.mil A-GRA). Lift the
architectural patterns; ship original code under MIT.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Callable, Sequence


# ---------------------------------------------------------------------------
# Primitive 80 — Entity-data-mesh
# ---------------------------------------------------------------------------


@dataclass
class EntityClaim:
    entity_id: str
    field: str
    value: object
    producer_id: str
    timestamp: str


@dataclass
class _FieldRecord:
    value: object
    producer_id: str
    timestamp: str


@dataclass
class EntityRecord:
    entity_id: str
    fields: dict
    lineage: list


ProducerPrecedence = Callable[[str, str], int]


def _default_precedence(a: str, b: str) -> int:
    return -1 if a < b else (1 if a > b else 0)


class EntityDataMesh:
    def __init__(self, precedence: ProducerPrecedence | None = None) -> None:
        self._records: dict[str, EntityRecord] = {}
        self._precedence: ProducerPrecedence = precedence or _default_precedence

    def apply(self, claim: EntityClaim) -> tuple[bool, str]:
        if not claim.entity_id or not claim.field or not claim.producer_id:
            return False, "entity_id, field, producer_id required"
        rec = self._records.get(claim.entity_id)
        if rec is None:
            rec = EntityRecord(entity_id=claim.entity_id, fields={}, lineage=[])
            self._records[claim.entity_id] = rec
        current = rec.fields.get(claim.field)
        if current is not None:
            if claim.timestamp < current.timestamp:
                rec.lineage.append(claim)
                return False, "stale timestamp; lineage recorded but field unchanged"
            if claim.timestamp == current.timestamp:
                cmp = self._precedence(claim.producer_id, current.producer_id)
                if cmp >= 0:
                    rec.lineage.append(claim)
                    return False, "tie broken in favor of incumbent; lineage recorded"
        rec.fields[claim.field] = _FieldRecord(claim.value, claim.producer_id, claim.timestamp)
        rec.lineage.append(claim)
        return True, "claim applied"

    def read(self, entity_id: str) -> EntityRecord | None:
        return self._records.get(entity_id)

    def lineage_of(self, entity_id: str) -> list[EntityClaim]:
        rec = self._records.get(entity_id)
        return list(rec.lineage) if rec else []

    def size(self) -> int:
        return len(self._records)


# ---------------------------------------------------------------------------
# Primitive 81 — C2 tasking receipt
# ---------------------------------------------------------------------------


@dataclass
class TaskContext:
    battery: float = 0.9
    within_authority: bool = True
    rules_of_engagement: tuple[str, ...] = ()
    collateral_risk_score: float = 0.0


@dataclass
class RefusalCondition:
    id: str
    describe: str
    predicate: Callable[[TaskContext], bool]


@dataclass
class Task:
    id: str
    kind: str  # "move" | "sense" | "act" | "report"
    target: str
    authority_chain: tuple[str, ...]
    refusal_conditions: tuple[RefusalCondition, ...]


@dataclass
class TaskAcceptance:
    task_id: str
    accepted: bool
    refused_by: tuple[str, ...]
    reason: str


def evaluate_task(task: Task, ctx: TaskContext) -> TaskAcceptance:
    if len(task.authority_chain) == 0:
        return TaskAcceptance(task.id, False, (), "empty authority chain")
    fired = [c for c in task.refusal_conditions if c.predicate(ctx)]
    if fired:
        return TaskAcceptance(
            task.id,
            False,
            tuple(c.id for c in fired),
            f"refused: {'; '.join(c.describe for c in fired)}",
        )
    return TaskAcceptance(task.id, True, (), "all refusal conditions pass")


std_refusals: tuple[RefusalCondition, ...] = (
    RefusalCondition("low-battery", "battery below 15%", lambda c: c.battery < 0.15),
    RefusalCondition("out-of-authority", "task outside delegated authority", lambda c: not c.within_authority),
    RefusalCondition(
        "high-collateral-risk",
        "collateral risk above 0.7",
        lambda c: c.collateral_risk_score > 0.7,
    ),
)


# ---------------------------------------------------------------------------
# Primitive 82 — Edge-aggregation receipt (Menace)
# ---------------------------------------------------------------------------


_CONN_RANK = {"online": 1.0, "intermittent": 0.6, "offline": 0.2}


@dataclass(frozen=True)
class EdgeSample:
    ts: float
    value: float
    connectivity: str  # "online" | "intermittent" | "offline"


@dataclass(frozen=True)
class EdgeAggregate:
    window_start: float
    window_end: float
    count: int
    mean: float
    min: float
    max: float
    worst_connectivity: str
    trust_score: float


def aggregate_edge(samples: Sequence[EdgeSample]) -> EdgeAggregate:
    if len(samples) == 0:
        raise ValueError("cannot aggregate empty sample window")
    sorted_s = sorted(samples, key=lambda s: s.ts)
    total = sum(s.value for s in sorted_s)
    mn = min(s.value for s in sorted_s)
    mx = max(s.value for s in sorted_s)
    worst = "online"
    worst_rank = 1.0
    for s in sorted_s:
        r = _CONN_RANK[s.connectivity]
        if r < worst_rank:
            worst_rank = r
            worst = s.connectivity
    trust = sum(_CONN_RANK[s.connectivity] for s in sorted_s) / len(sorted_s)
    return EdgeAggregate(
        window_start=sorted_s[0].ts,
        window_end=sorted_s[-1].ts,
        count=len(sorted_s),
        mean=total / len(sorted_s),
        min=mn,
        max=mx,
        worst_connectivity=worst,
        trust_score=trust,
    )


def emit_gate(agg: EdgeAggregate, trust_floor: float, fail_closed: bool) -> tuple[bool, str]:
    if agg.trust_score >= trust_floor:
        return True, "trust above floor"
    if fail_closed:
        return False, f"trust {agg.trust_score:.3f} below floor {trust_floor} (fail-closed)"
    return True, "trust below floor but fail-open policy"


# ---------------------------------------------------------------------------
# Primitive 83 — Autonomy / authority ladder
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class ActionRequest:
    id: str
    description: str
    required_level: int  # 0..5
    reversible: bool


@dataclass(frozen=True)
class PromotionEvent:
    agent_id: str
    from_level: int
    to_level: int
    authorized_by: str
    timestamp: str
    reason: str


@dataclass
class AgentState:
    agent_id: str
    current_level: int
    promotion_ledger: list[PromotionEvent] = field(default_factory=list)


@dataclass(frozen=True)
class AuthorityVerdict:
    action_id: str
    permitted: bool
    reason: str


def check_authority(action: ActionRequest, agent: AgentState) -> AuthorityVerdict:
    if agent.current_level < action.required_level:
        return AuthorityVerdict(action.id, False, f"agent level {agent.current_level} < required {action.required_level}")
    if not action.reversible and action.required_level >= 4:
        return AuthorityVerdict(action.id, False, "irreversible action at level >= 4 needs explicit confirm step")
    return AuthorityVerdict(action.id, True, "authority sufficient")


def promote(
    agent: AgentState,
    to_level: int,
    authorized_by: str,
    timestamp: str,
    reason: str,
) -> AgentState:
    if not authorized_by:
        raise ValueError("promotion requires named authority")
    event = PromotionEvent(
        agent_id=agent.agent_id,
        from_level=agent.current_level,
        to_level=to_level,
        authorized_by=authorized_by,
        timestamp=timestamp,
        reason=reason,
    )
    return AgentState(
        agent_id=agent.agent_id,
        current_level=to_level,
        promotion_ledger=[*agent.promotion_ledger, event],
    )


__all__ = [
    "EntityClaim",
    "EntityRecord",
    "EntityDataMesh",
    "TaskContext",
    "RefusalCondition",
    "Task",
    "TaskAcceptance",
    "evaluate_task",
    "std_refusals",
    "EdgeSample",
    "EdgeAggregate",
    "aggregate_edge",
    "emit_gate",
    "ActionRequest",
    "PromotionEvent",
    "AgentState",
    "AuthorityVerdict",
    "check_authority",
    "promote",
]
