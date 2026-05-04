"""Schema round-trip tests for every primitive."""

from __future__ import annotations

import json

import pytest

from a11oy_fabric_py.models import (
    SCHEMA_EXPORTS,
    ActionBrief,
    ApprovalRequirement,
    BusinessSignal,
    BusinessTwin,
    CovenantPolicy,
    ExecutionTrace,
    FabricStatus,
    MirrorEvalDimension,
    MirrorEvalResult,
    Outcome,
    PCPRProof,
    PackRunReport,
    PolicyCondition,
    ProofPacket,
    VerificationResult,
    Workcell,
)


def _example_signal() -> BusinessSignal:
    return BusinessSignal(
        id="sig-test-001",
        vertical="alloy-core",
        entity="test-entity",
        title="t",
        description="d",
        severity="info",
        status="active",
        businessImpact="b",
        evidenceRefs=["e/1"],
        owner="o",
        tags=["x"],
        metadata={"k": "v"},
    )


def _example_action() -> ActionBrief:
    return ActionBrief(
        id="act-test-001",
        title="t",
        description="d",
        vertical="alloy-core",
        status="recommended",
        recommendedBy="r",
        priority="normal",
        estimatedImpact="i",
        requiresApproval=False,
        approvalTier="auto",
    )


def _example_mirror_eval(target_id: str = "act-test-001") -> MirrorEvalResult:
    return MirrorEvalResult(
        id="m-1",
        targetId=target_id,
        targetType="action",
        verdict="pass",
        score=1.0,
        dimensions=[MirrorEvalDimension(name="x", score=0.9, rationale="r")],
        flags=[],
        evaluatorModel="x",
    )


def test_business_signal_round_trip() -> None:
    s = _example_signal()
    raw = s.model_dump_json()
    s2 = BusinessSignal.model_validate_json(raw)
    assert s == s2


def test_outcome_round_trip() -> None:
    o = Outcome(
        id="out-1",
        title="t",
        description="d",
        vertical="alloy-core",
        status="in_progress",
        owner="o",
        targetDate="2026-12-31",
        successMetric="m",
        currentValue=1,
        targetValue=2,
        unit="x",
        linkedSignalIds=["sig-1"],
    )
    assert Outcome.model_validate_json(o.model_dump_json()) == o


def test_covenant_policy_round_trip() -> None:
    p = CovenantPolicy(
        id="pol-1",
        name="n",
        description="d",
        vertical="global",
        enforcement="require_approval",
        conditions=[PolicyCondition(field="action.x", operator="gt", value=1)],
        approvalRequirements=ApprovalRequirement(tier="executive", quorum=1),
        version=2,
    )
    assert CovenantPolicy.model_validate_json(p.model_dump_json()) == p


def test_proof_packet_round_trip() -> None:
    pp = ProofPacket(
        id="pp-1",
        kind="signal_ingestion",
        entityId="sig-1",
        entityType="signal",
        hash="sha256:abc",
        payload={"k": 1},
        witnessedBy=["w"],
        vertical="alloy-core",
    )
    assert ProofPacket.model_validate_json(pp.model_dump_json()) == pp


def test_mirror_eval_round_trip() -> None:
    m = MirrorEvalResult(
        id="m-1",
        targetId="act-1",
        targetType="action",
        verdict="pass",
        score=0.9,
        dimensions=[MirrorEvalDimension(name="x", score=0.9, rationale="r")],
        flags=[],
        evaluatorModel="gpt-test",
    )
    assert MirrorEvalResult.model_validate_json(m.model_dump_json()) == m


def test_workcell_round_trip() -> None:
    wc = Workcell(
        id="wc-1",
        name="n",
        vertical="alloy-core",
        status="idle",
        objective="o",
        actionBrief=_example_action(),
        mirrorEvalResult=_example_mirror_eval(),
        pceContractId="pce-1",
        requiresApproval=False,
        verificationResult=VerificationResult(status="passed", checksum="sha256:abc"),
        proofPacketId="pp-1",
        executionTraceId="et-1",
    )
    assert Workcell.model_validate_json(wc.model_dump_json()) == wc


def test_execution_trace_round_trip() -> None:
    et = ExecutionTrace(
        id="et-1",
        workcellId="wc-1",
        runId="run-1",
        steps=[],
        finalStatus="completed",
        durationMs=10,
        proofPacketId="pp-1",
        startedAt="2026-01-01T00:00:00Z",
        completedAt="2026-01-01T00:00:01Z",
    )
    assert ExecutionTrace.model_validate_json(et.model_dump_json()) == et


def test_business_twin_round_trip() -> None:
    bt = BusinessTwin(
        id="bt-1",
        vertical="alloy-core",
        entity="x",
        entityType="auto",
        currentState={},
        lastSignalId="sig-1",
        signalCount=1,
        activeOutcomes=0,
        pendingActions=0,
        coverageScore=0.5,
    )
    assert BusinessTwin.model_validate_json(bt.model_dump_json()) == bt


def test_fabric_status_round_trip() -> None:
    fs = FabricStatus(
        layer="signal_mesh",
        status="healthy",
        signalCount=42,
        processingRateHz=10.5,
        latencyMs=3.2,
    )
    assert FabricStatus.model_validate_json(fs.model_dump_json()) == fs


def test_pack_run_report_round_trip() -> None:
    rep = PackRunReport(
        engineVersion="0.1.0",
        packSlug="test",
        packVersion="1.0.0",
        vertical="alloy-core",
        runId="r-1",
        mode="discovery",
        startedAt="2026-01-01T00:00:00Z",
        completedAt="2026-01-01T00:00:01Z",
        inputFingerprint="sha256:abc",
        signals=[_example_signal()],
        actions=[_example_action()],
    )
    assert PackRunReport.model_validate_json(rep.model_dump_json()) == rep


def test_pcpr_proof_round_trip() -> None:
    proof = PCPRProof(
        runId="run-001",
        packSlug="test-pack",
        engineVersion="0.1.0",
        packVersion="0.1.0",
        inputFingerprint="abc123",
        reportHash="def456",
        chainHash="ghi789",
    )
    assert PCPRProof.model_validate_json(proof.model_dump_json()) == proof


def test_extra_fields_rejected() -> None:
    with pytest.raises(Exception):
        BusinessSignal(
            id="s1",
            vertical="alloy-core",
            entity="e",
            title="t",
            description="d",
            severity="info",
            status="active",
            businessImpact="b",
            owner="o",
            extraField="should fail",
        )


@pytest.mark.parametrize("model", SCHEMA_EXPORTS)
def test_models_emit_valid_jsonschema(model: type) -> None:
    schema = model.model_json_schema()
    assert "properties" in schema
    json.dumps(schema)
