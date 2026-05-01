"""Tests for ouroboros.anduril (Primitives 80–83)."""
from __future__ import annotations

import math

import pytest

from ouroboros.anduril import (
    EntityClaim,
    EntityDataMesh,
    Task,
    TaskContext,
    RefusalCondition,
    evaluate_task,
    std_refusals,
    EdgeSample,
    aggregate_edge,
    emit_gate,
    ActionRequest,
    AgentState,
    check_authority,
    promote,
)


# Primitive 80


def test_mesh_apply_first() -> None:
    m = EntityDataMesh()
    ok, _ = m.apply(EntityClaim("e", "x", 1, "A", "t1"))
    assert ok is True


def test_mesh_rejects_empty_entity() -> None:
    m = EntityDataMesh()
    ok, _ = m.apply(EntityClaim("", "x", 1, "A", "t"))
    assert ok is False


def test_mesh_later_timestamp_wins() -> None:
    m = EntityDataMesh()
    m.apply(EntityClaim("e", "x", 1, "A", "t1"))
    ok, _ = m.apply(EntityClaim("e", "x", 99, "B", "t2"))
    assert ok is True
    assert m.read("e").fields["x"].value == 99


def test_mesh_stale_recorded_not_applied() -> None:
    m = EntityDataMesh()
    m.apply(EntityClaim("e", "x", 1, "A", "t2"))
    ok, reason = m.apply(EntityClaim("e", "x", 99, "B", "t1"))
    assert ok is False
    assert "stale" in reason
    assert len(m.lineage_of("e")) == 2


def test_mesh_lineage_records_every_claim() -> None:
    m = EntityDataMesh()
    m.apply(EntityClaim("e", "x", 1, "A", "t1"))
    m.apply(EntityClaim("e", "x", 2, "B", "t2"))
    m.apply(EntityClaim("e", "y", 3, "C", "t3"))
    assert len(m.lineage_of("e")) == 3


def test_mesh_size_unique_entities() -> None:
    m = EntityDataMesh()
    m.apply(EntityClaim("e1", "x", 1, "A", "t"))
    m.apply(EntityClaim("e2", "x", 1, "A", "t"))
    m.apply(EntityClaim("e1", "y", 1, "A", "t"))
    assert m.size() == 2


def test_mesh_read_unknown_returns_none() -> None:
    m = EntityDataMesh()
    assert m.read("ghost") is None


# Primitive 81


def _ctx(**over: object) -> TaskContext:
    base = dict(battery=0.9, within_authority=True, rules_of_engagement=("roe-1",), collateral_risk_score=0.1)
    base.update(over)
    return TaskContext(**base)  # type: ignore[arg-type]


def _task(**over: object) -> Task:
    base = dict(id="t1", kind="move", target="alpha", authority_chain=("issuer", "supervisor"), refusal_conditions=std_refusals)
    base.update(over)
    return Task(**base)  # type: ignore[arg-type]


def test_task_accepts_when_clean() -> None:
    assert evaluate_task(_task(), _ctx()).accepted is True


def test_task_refuses_low_battery() -> None:
    r = evaluate_task(_task(), _ctx(battery=0.05))
    assert r.accepted is False
    assert "low-battery" in r.refused_by


def test_task_refuses_out_of_authority() -> None:
    r = evaluate_task(_task(), _ctx(within_authority=False))
    assert r.accepted is False
    assert "out-of-authority" in r.refused_by


def test_task_refuses_high_collateral() -> None:
    r = evaluate_task(_task(), _ctx(collateral_risk_score=0.95))
    assert r.accepted is False
    assert "high-collateral-risk" in r.refused_by


def test_task_empty_authority_chain_refused() -> None:
    r = evaluate_task(_task(authority_chain=()), _ctx())
    assert r.accepted is False
    assert "authority chain" in r.reason


def test_task_multi_refusal_reported() -> None:
    r = evaluate_task(_task(), _ctx(battery=0.05, within_authority=False))
    assert len(r.refused_by) >= 2


# Primitive 82


def test_edge_empty_raises() -> None:
    with pytest.raises(ValueError):
        aggregate_edge([])


def test_edge_mean() -> None:
    a = aggregate_edge([EdgeSample(0, 10, "online"), EdgeSample(1, 20, "online"), EdgeSample(2, 30, "online")])
    assert math.isclose(a.mean, 20)


def test_edge_worst_connectivity() -> None:
    a = aggregate_edge([
        EdgeSample(0, 1, "online"),
        EdgeSample(1, 2, "intermittent"),
        EdgeSample(2, 3, "offline"),
    ])
    assert a.worst_connectivity == "offline"


def test_edge_trust_all_online() -> None:
    a = aggregate_edge([EdgeSample(0, 1, "online"), EdgeSample(1, 2, "online")])
    assert math.isclose(a.trust_score, 1.0)


def test_edge_trust_mixed() -> None:
    a = aggregate_edge([EdgeSample(0, 1, "online"), EdgeSample(1, 2, "offline")])
    assert math.isclose(a.trust_score, (1.0 + 0.2) / 2)


def test_edge_emit_gate_above_floor() -> None:
    a = aggregate_edge([EdgeSample(0, 1, "online")])
    ok, _ = emit_gate(a, 0.5, True)
    assert ok is True


def test_edge_emit_gate_below_floor_failclosed() -> None:
    a = aggregate_edge([EdgeSample(0, 1, "offline")])
    ok, _ = emit_gate(a, 0.5, True)
    assert ok is False


def test_edge_emit_gate_below_floor_failopen() -> None:
    a = aggregate_edge([EdgeSample(0, 1, "offline")])
    ok, _ = emit_gate(a, 0.5, False)
    assert ok is True


# Primitive 83


def _agent(level: int = 2) -> AgentState:
    return AgentState(agent_id="a1", current_level=level, promotion_ledger=[])


def test_authority_permits_sufficient_reversible() -> None:
    v = check_authority(ActionRequest("a", "move", 2, True), _agent(3))
    assert v.permitted is True


def test_authority_refuses_below_level() -> None:
    v = check_authority(ActionRequest("a", "move", 4, True), _agent(2))
    assert v.permitted is False
    assert "level 2 < required 4" in v.reason


def test_authority_refuses_irreversible_high_level() -> None:
    v = check_authority(ActionRequest("a", "fire", 4, False), _agent(5))
    assert v.permitted is False
    assert "irreversible" in v.reason


def test_authority_permits_reversible_high() -> None:
    v = check_authority(ActionRequest("a", "scan", 5, True), _agent(5))
    assert v.permitted is True


def test_promote_raises_level() -> None:
    a = _agent(1)
    nxt = promote(a, 3, "commander", "t1", "tactical need")
    assert nxt.current_level == 3


def test_promote_ledgers_event() -> None:
    a = _agent(1)
    nxt = promote(a, 3, "commander", "t1", "tactical need")
    assert len(nxt.promotion_ledger) == 1
    assert nxt.promotion_ledger[0].from_level == 1
    assert nxt.promotion_ledger[0].to_level == 3


def test_promote_requires_authority() -> None:
    with pytest.raises(ValueError):
        promote(_agent(1), 2, "", "t", "r")


def test_authority_equal_level_permitted() -> None:
    v = check_authority(ActionRequest("a", "x", 3, True), _agent(3))
    assert v.permitted is True
