"""The seven FabricLayer interfaces as ``typing.Protocol`` definitions plus
functional in-memory default implementations.

The default implementations are NOT stubs — they support the reference packs
end-to-end. A vertical pack may swap any layer by passing a custom
implementation to ``PackContext``.
"""

from __future__ import annotations

from typing import Any, Iterable, Protocol, runtime_checkable

import structlog

from .models import (
    ActionBrief,
    BusinessSignal,
    BusinessTwin,
    CovenantPolicy,
    FabricStatus,
    Outcome,
    PolicyCondition,
    ProofPacket,
)
from .types import FabricLayerName, PolicyEnforcement

_log = structlog.get_logger(__name__)


# ── Protocols ───────────────────────────────────────────────────────────────


@runtime_checkable
class CoverageGraph(Protocol):
    """Layer 1 — what is in scope for the substrate to observe."""

    name: FabricLayerName

    def register_entity(self, vertical: str, entity_id: str, kind: str) -> None: ...
    def covered_entities(self) -> list[tuple[str, str, str]]: ...
    def coverage_score(self, vertical: str) -> float: ...


@runtime_checkable
class SignalMesh(Protocol):
    """Layer 2 — ingest BusinessSignals and route them downstream."""

    name: FabricLayerName

    def ingest(self, signal: BusinessSignal) -> None: ...
    def all_signals(self) -> list[BusinessSignal]: ...
    def by_vertical(self, vertical: str) -> list[BusinessSignal]: ...


@runtime_checkable
class StateEngine(Protocol):
    """Layer 3 — projects ingested signals into BusinessTwins per entity."""

    name: FabricLayerName

    def project(self, signals: Iterable[BusinessSignal]) -> list[BusinessTwin]: ...


@runtime_checkable
class CausalCore(Protocol):
    """Layer 4 — links signals to outcomes and explains the chain."""

    name: FabricLayerName

    def link(self, outcome: Outcome, signals: Iterable[BusinessSignal]) -> None: ...
    def linked(self) -> dict[str, list[str]]: ...


@runtime_checkable
class ActionRail(Protocol):
    """Layer 5 — recommend ActionBriefs derived from signals + outcomes."""

    name: FabricLayerName

    def recommend(self, action: ActionBrief) -> ActionBrief: ...
    def all_actions(self) -> list[ActionBrief]: ...


@runtime_checkable
class CovenantLayer(Protocol):
    """Layer 6 — evaluate CovenantPolicies and gate actions."""

    name: FabricLayerName

    def register(self, policy: CovenantPolicy) -> None: ...
    def evaluate(self, action: ActionBrief, context: dict[str, Any]) -> dict[str, Any]: ...
    def all_policies(self) -> list[CovenantPolicy]: ...


@runtime_checkable
class ProofLedger(Protocol):
    """Layer 7 — append-only ProofPacket store with hash-chained ordering."""

    name: FabricLayerName

    def append(self, packet: ProofPacket) -> ProofPacket: ...
    def all_packets(self) -> list[ProofPacket]: ...
    def head_hash(self) -> str | None: ...


# ── Default in-memory implementations ───────────────────────────────────────


class InMemoryCoverageGraph:
    name: FabricLayerName = "coverage_graph"

    def __init__(self) -> None:
        self._entities: list[tuple[str, str, str]] = []
        self._by_vertical: dict[str, set[str]] = {}

    def register_entity(self, vertical: str, entity_id: str, kind: str) -> None:
        self._entities.append((vertical, entity_id, kind))
        self._by_vertical.setdefault(vertical, set()).add(entity_id)

    def covered_entities(self) -> list[tuple[str, str, str]]:
        return list(self._entities)

    def coverage_score(self, vertical: str) -> float:
        # Coverage score is the fraction of distinct entities under this
        # vertical relative to the total entity universe. For the in-memory
        # default we treat 1 covered entity as the floor (0.0) and 25+ as a
        # full grade (1.0). Packs typically override this layer if they
        # have a richer coverage definition.
        n = len(self._by_vertical.get(vertical, set()))
        if n <= 0:
            return 0.0
        return min(1.0, n / 25.0)


class InMemorySignalMesh:
    name: FabricLayerName = "signal_mesh"

    def __init__(self) -> None:
        self._signals: list[BusinessSignal] = []

    def ingest(self, signal: BusinessSignal) -> None:
        self._signals.append(signal)

    def all_signals(self) -> list[BusinessSignal]:
        return list(self._signals)

    def by_vertical(self, vertical: str) -> list[BusinessSignal]:
        return [s for s in self._signals if s.vertical == vertical]


class InMemoryStateEngine:
    name: FabricLayerName = "state_engine"

    def project(self, signals: Iterable[BusinessSignal]) -> list[BusinessTwin]:
        signals = list(signals)
        by_entity: dict[tuple[str, str], list[BusinessSignal]] = {}
        for s in signals:
            by_entity.setdefault((s.vertical, s.entity), []).append(s)

        twins: list[BusinessTwin] = []
        for (vertical, entity), entity_signals in by_entity.items():
            entity_signals.sort(key=lambda s: s.detectedAt)
            last = entity_signals[-1]
            severities = [s.severity for s in entity_signals]
            crit = sum(1 for sev in severities if sev == "critical")
            high = sum(1 for sev in severities if sev == "high")
            score = max(
                0.0,
                min(1.0, 1.0 - (crit * 0.2 + high * 0.1) / max(len(entity_signals), 1)),
            )
            twins.append(
                BusinessTwin(
                    id=f"twin-{vertical}-{entity}".replace(" ", "-").lower(),
                    vertical=last.vertical,
                    entity=entity,
                    entityType="auto",
                    currentState={
                        "lastSeverity": last.severity,
                        "lastStatus": last.status,
                        "criticalCount": crit,
                        "highCount": high,
                    },
                    lastSignalId=last.id,
                    signalCount=len(entity_signals),
                    activeOutcomes=0,
                    pendingActions=0,
                    coverageScore=round(score, 4),
                    updatedAt=last.updatedAt,
                )
            )
        return twins


class InMemoryCausalCore:
    name: FabricLayerName = "causal_core"

    def __init__(self) -> None:
        self._links: dict[str, list[str]] = {}

    def link(self, outcome: Outcome, signals: Iterable[BusinessSignal]) -> None:
        self._links[outcome.id] = [s.id for s in signals]

    def linked(self) -> dict[str, list[str]]:
        return {k: list(v) for k, v in self._links.items()}


class InMemoryActionRail:
    name: FabricLayerName = "action_rail"

    def __init__(self) -> None:
        self._actions: list[ActionBrief] = []

    def recommend(self, action: ActionBrief) -> ActionBrief:
        self._actions.append(action)
        return action

    def all_actions(self) -> list[ActionBrief]:
        return list(self._actions)


def _eval_condition(cond: PolicyCondition, payload: dict[str, Any]) -> bool:
    parts = cond.field.split(".")
    cur: Any = payload
    for p in parts:
        if isinstance(cur, dict) and p in cur:
            cur = cur[p]
        else:
            cur = None
            break
    op = cond.operator
    val = cond.value
    if op == "eq":
        return cur == val
    if op == "neq":
        return cur != val
    if op == "gt":
        return cur is not None and cur > val
    if op == "gte":
        return cur is not None and cur >= val
    if op == "lt":
        return cur is not None and cur < val
    if op == "lte":
        return cur is not None and cur <= val
    if op == "in":
        return cur in val if isinstance(val, (list, tuple, set)) else False
    if op == "contains":
        if isinstance(cur, (list, tuple, set, str)):
            return val in cur
        return False
    return False


class InMemoryCovenantLayer:
    name: FabricLayerName = "covenant_layer"

    def __init__(self) -> None:
        self._policies: list[CovenantPolicy] = []

    def register(self, policy: CovenantPolicy) -> None:
        self._policies.append(policy)

    def evaluate(self, action: ActionBrief, context: dict[str, Any]) -> dict[str, Any]:
        applied: list[dict[str, Any]] = []
        verdict: PolicyEnforcement = "log"
        for pol in self._policies:
            if not pol.active:
                continue
            if pol.vertical not in ("global", action.vertical):
                continue
            if not pol.conditions or all(_eval_condition(c, context) for c in pol.conditions):
                applied.append({"policyId": pol.id, "enforcement": pol.enforcement})
                # Most-restrictive wins: block > require_approval > warn > log.
                ranking = {"log": 0, "warn": 1, "require_approval": 2, "block": 3}
                if ranking[pol.enforcement] > ranking[verdict]:
                    verdict = pol.enforcement
        return {"verdict": verdict, "applied": applied}

    def all_policies(self) -> list[CovenantPolicy]:
        return list(self._policies)


class InMemoryProofLedger:
    name: FabricLayerName = "proof_ledger"

    def __init__(self) -> None:
        self._packets: list[ProofPacket] = []

    def append(self, packet: ProofPacket) -> ProofPacket:
        if self._packets:
            packet.previousHash = self._packets[-1].hash
        self._packets.append(packet)
        return packet

    def all_packets(self) -> list[ProofPacket]:
        return list(self._packets)

    def head_hash(self) -> str | None:
        return self._packets[-1].hash if self._packets else None


# ── Default bundle ──────────────────────────────────────────────────────────


class LayerBundle:
    """Container for one instance of every FabricLayer."""

    def __init__(
        self,
        coverage_graph: CoverageGraph,
        signal_mesh: SignalMesh,
        state_engine: StateEngine,
        causal_core: CausalCore,
        action_rail: ActionRail,
        covenant_layer: CovenantLayer,
        proof_ledger: ProofLedger,
    ) -> None:
        self.coverage_graph = coverage_graph
        self.signal_mesh = signal_mesh
        self.state_engine = state_engine
        self.causal_core = causal_core
        self.action_rail = action_rail
        self.covenant_layer = covenant_layer
        self.proof_ledger = proof_ledger

    def status(self) -> list[FabricStatus]:
        return [
            FabricStatus(layer=l.name, status="healthy")
            for l in (
                self.coverage_graph,
                self.signal_mesh,
                self.state_engine,
                self.causal_core,
                self.action_rail,
                self.covenant_layer,
                self.proof_ledger,
            )
        ]


def default_layer_bundle() -> LayerBundle:
    return LayerBundle(
        coverage_graph=InMemoryCoverageGraph(),
        signal_mesh=InMemorySignalMesh(),
        state_engine=InMemoryStateEngine(),
        causal_core=InMemoryCausalCore(),
        action_rail=InMemoryActionRail(),
        covenant_layer=InMemoryCovenantLayer(),
        proof_ledger=InMemoryProofLedger(),
    )
