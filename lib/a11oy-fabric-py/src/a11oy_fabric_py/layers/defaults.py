"""
Default in-memory implementations of the seven FabricLayer interfaces.

These are functional (not stubs) — the reference packs run on top of them.
"""

from __future__ import annotations

import hashlib
import json
import uuid
from datetime import datetime, timezone

from ..models import (
    BusinessSignal, BusinessTwin, Outcome, ActionBrief,
    CovenantPolicy, ProofPacket, Workcell,
)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class InMemoryCoverageGraph:
    def __init__(self) -> None:
        self._twins: list[BusinessTwin] = []

    def get_coverage(self, vertical: str) -> dict[str, float]:
        twins = [t for t in self._twins if t.vertical == vertical]
        if not twins:
            return {"score": 0.0, "twinCount": 0}
        avg = sum(t.coverageScore for t in twins) / len(twins)
        return {"score": round(avg, 3), "twinCount": float(len(twins))}

    def register_twin(self, twin: BusinessTwin) -> None:
        self._twins = [t for t in self._twins if t.id != twin.id]
        self._twins.append(twin)

    def get_twins(self, vertical: str | None = None) -> list[BusinessTwin]:
        if vertical is None:
            return list(self._twins)
        return [t for t in self._twins if t.vertical == vertical]


class InMemorySignalMesh:
    def __init__(self) -> None:
        self._signals: list[BusinessSignal] = []

    def ingest(self, signal: BusinessSignal) -> None:
        self._signals = [s for s in self._signals if s.id != signal.id]
        self._signals.append(signal)

    def query(self, vertical: str | None = None, severity: str | None = None) -> list[BusinessSignal]:
        result = self._signals
        if vertical is not None:
            result = [s for s in result if s.vertical == vertical]
        if severity is not None:
            result = [s for s in result if s.severity == severity]
        return result

    def count(self) -> int:
        return len(self._signals)


class InMemoryStateEngine:
    def __init__(self) -> None:
        self._outcomes: dict[str, Outcome] = {}

    def get_outcomes(self, vertical: str | None = None) -> list[Outcome]:
        outcomes = list(self._outcomes.values())
        if vertical is not None:
            outcomes = [o for o in outcomes if o.vertical == vertical]
        return outcomes

    def upsert_outcome(self, outcome: Outcome) -> None:
        self._outcomes[outcome.id] = outcome

    def transition(self, outcome_id: str, new_status: str) -> Outcome | None:
        if outcome_id not in self._outcomes:
            return None
        o = self._outcomes[outcome_id]
        updated = o.model_copy(update={"status": new_status, "updatedAt": _now_iso()})
        self._outcomes[outcome_id] = updated
        return updated


class InMemoryCausalCore:
    def __init__(self) -> None:
        self._links: list[tuple[str, str]] = []

    def link(self, signal_id: str, outcome_id: str) -> None:
        pair = (signal_id, outcome_id)
        if pair not in self._links:
            self._links.append(pair)

    def get_causes(self, outcome_id: str) -> list[str]:
        return [s for s, o in self._links if o == outcome_id]

    def get_effects(self, signal_id: str) -> list[str]:
        return [o for s, o in self._links if s == signal_id]


class InMemoryActionRail:
    def __init__(self) -> None:
        self._actions: dict[str, ActionBrief] = {}

    def propose(self, action: ActionBrief) -> ActionBrief:
        self._actions[action.id] = action
        return action

    def list_actions(self, vertical: str | None = None) -> list[ActionBrief]:
        actions = list(self._actions.values())
        if vertical is not None:
            actions = [a for a in actions if a.vertical == vertical]
        return actions

    def approve(self, action_id: str) -> ActionBrief | None:
        if action_id not in self._actions:
            return None
        a = self._actions[action_id]
        updated = a.model_copy(update={"status": "approved", "updatedAt": _now_iso()})
        self._actions[action_id] = updated
        return updated

    def reject(self, action_id: str) -> ActionBrief | None:
        if action_id not in self._actions:
            return None
        a = self._actions[action_id]
        updated = a.model_copy(update={"status": "rejected", "updatedAt": _now_iso()})
        self._actions[action_id] = updated
        return updated


class InMemoryCovenantLayer:
    def __init__(self) -> None:
        self._policies: list[CovenantPolicy] = []

    def register_policy(self, policy: CovenantPolicy) -> None:
        self._policies = [p for p in self._policies if p.id != policy.id]
        self._policies.append(policy)

    def evaluate(self, action: ActionBrief) -> tuple[bool, list[CovenantPolicy]]:
        triggered: list[CovenantPolicy] = []
        for policy in self._policies:
            if not policy.active:
                continue
            if policy.vertical != "global" and policy.vertical != action.vertical:
                continue
            if policy.enforcement == "block":
                triggered.append(policy)
            elif policy.enforcement == "require_approval" and not action.requiresApproval:
                triggered.append(policy)
        allowed = not any(p.enforcement == "block" for p in triggered)
        return allowed, triggered

    def get_policies(self, vertical: str | None = None) -> list[CovenantPolicy]:
        if vertical is None:
            return list(self._policies)
        return [p for p in self._policies if p.vertical in (vertical, "global")]


class InMemoryProofLedger:
    def __init__(self) -> None:
        self._packets: list[ProofPacket] = []

    def record(self, packet: ProofPacket) -> None:
        self._packets.append(packet)

    def get_chain(self, entity_id: str) -> list[ProofPacket]:
        return [p for p in self._packets if p.entityId == entity_id]

    def verify_chain(self, entity_id: str) -> bool:
        chain = self.get_chain(entity_id)
        if not chain:
            return True
        for i in range(1, len(chain)):
            if chain[i].previousHash != chain[i - 1].hash:
                return False
        return True


def build_default_layers() -> dict[str, object]:
    return {
        "coverage_graph": InMemoryCoverageGraph(),
        "signal_mesh": InMemorySignalMesh(),
        "state_engine": InMemoryStateEngine(),
        "causal_core": InMemoryCausalCore(),
        "action_rail": InMemoryActionRail(),
        "covenant_layer": InMemoryCovenantLayer(),
        "proof_ledger": InMemoryProofLedger(),
    }
