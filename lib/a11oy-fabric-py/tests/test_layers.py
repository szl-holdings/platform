"""Tests for the seven FabricLayer default implementations."""

import pytest
from a11oy_fabric_py.layers import (
    InMemoryCoverageGraph, InMemorySignalMesh, InMemoryStateEngine,
    InMemoryCausalCore, InMemoryActionRail, InMemoryCovenantLayer,
    InMemoryProofLedger, build_default_layers,
    CoverageGraphLayer, SignalMeshLayer, StateEngineLayer,
    CausalCoreLayer, ActionRailLayer, CovenantLayerProtocol,
    ProofLedgerLayer,
)
from a11oy_fabric_py.models import (
    BusinessSignal, BusinessTwin, Outcome, ActionBrief,
    CovenantPolicy, ProofPacket,
)


def _signal(id="sig-001", severity="high"):
    return BusinessSignal(
        id=id, vertical="alloy-core", entity="test", title="Test",
        description="Test", severity=severity, status="active",
        businessImpact="Test", owner="test",
    )


def _twin(id="twin-001", score=0.8):
    return BusinessTwin(
        id=id, vertical="alloy-core", entity="test", entityType="service",
        coverageScore=score, lastSignalId="", signalCount=0,
        activeOutcomes=0, pendingActions=0,
    )


class TestCoverageGraph:
    def test_protocol_conformance(self):
        assert isinstance(InMemoryCoverageGraph(), CoverageGraphLayer)

    def test_register_and_get(self):
        cg = InMemoryCoverageGraph()
        cg.register_twin(_twin())
        twins = cg.get_twins("alloy-core")
        assert len(twins) == 1

    def test_coverage_score(self):
        cg = InMemoryCoverageGraph()
        cg.register_twin(_twin(score=0.8))
        cov = cg.get_coverage("alloy-core")
        assert cov["score"] == 0.8


class TestSignalMesh:
    def test_protocol_conformance(self):
        assert isinstance(InMemorySignalMesh(), SignalMeshLayer)

    def test_ingest_and_query(self):
        sm = InMemorySignalMesh()
        sm.ingest(_signal())
        assert sm.count() == 1
        results = sm.query(vertical="alloy-core")
        assert len(results) == 1

    def test_filter_by_severity(self):
        sm = InMemorySignalMesh()
        sm.ingest(_signal("s1", "high"))
        sm.ingest(_signal("s2", "low"))
        results = sm.query(severity="high")
        assert len(results) == 1


class TestStateEngine:
    def test_protocol_conformance(self):
        assert isinstance(InMemoryStateEngine(), StateEngineLayer)

    def test_upsert_and_transition(self):
        se = InMemoryStateEngine()
        o = Outcome(
            id="out-001", title="Test", description="Test", vertical="alloy-core",
            status="pending", owner="test", targetDate="2026-01-01", successMetric="x > 0",
        )
        se.upsert_outcome(o)
        result = se.transition("out-001", "in_progress")
        assert result is not None
        assert result.status == "in_progress"


class TestCausalCore:
    def test_protocol_conformance(self):
        assert isinstance(InMemoryCausalCore(), CausalCoreLayer)

    def test_link_and_query(self):
        cc = InMemoryCausalCore()
        cc.link("sig-001", "out-001")
        assert "sig-001" in cc.get_causes("out-001")
        assert "out-001" in cc.get_effects("sig-001")


class TestActionRail:
    def test_protocol_conformance(self):
        assert isinstance(InMemoryActionRail(), ActionRailLayer)

    def test_propose_and_approve(self):
        ar = InMemoryActionRail()
        a = ActionBrief(
            id="act-001", title="Test", description="Test", vertical="alloy-core",
            status="recommended", recommendedBy="test", priority="high",
            estimatedImpact="Test", requiresApproval=True, approvalTier="operator",
        )
        ar.propose(a)
        approved = ar.approve("act-001")
        assert approved is not None
        assert approved.status == "approved"


class TestCovenantLayer:
    def test_protocol_conformance(self):
        assert isinstance(InMemoryCovenantLayer(), CovenantLayerProtocol)

    def test_block_policy(self):
        cl = InMemoryCovenantLayer()
        cl.register_policy(CovenantPolicy(
            id="pol-001", name="Block All", description="Test",
            vertical="global", enforcement="block",
        ))
        a = ActionBrief(
            id="act-001", title="Test", description="Test", vertical="alloy-core",
            status="recommended", recommendedBy="test", priority="high",
            estimatedImpact="Test", requiresApproval=True, approvalTier="operator",
        )
        allowed, triggered = cl.evaluate(a)
        assert not allowed
        assert len(triggered) == 1


class TestProofLedger:
    def test_protocol_conformance(self):
        assert isinstance(InMemoryProofLedger(), ProofLedgerLayer)

    def test_record_and_verify(self):
        pl = InMemoryProofLedger()
        pl.record(ProofPacket(
            id="pp-001", kind="signal_ingestion", entityId="sig-001",
            entityType="signal", hash="abc", vertical="global",
        ))
        pl.record(ProofPacket(
            id="pp-002", kind="state_transition", entityId="sig-001",
            entityType="signal", hash="def", previousHash="abc", vertical="global",
        ))
        assert pl.verify_chain("sig-001")


class TestBuildDefaultLayers:
    def test_returns_all_seven(self):
        layers = build_default_layers()
        assert len(layers) == 7
        expected = ["coverage_graph", "signal_mesh", "state_engine",
                     "causal_core", "action_rail", "covenant_layer", "proof_ledger"]
        for key in expected:
            assert key in layers
