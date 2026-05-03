"""Pydantic v2 models mirroring lib/a11oy-fabric/src/schema.ts.

Field names and types match the TypeScript interfaces exactly so downstream
JSON consumers do not have to translate. Where the TS schema is loose
(``Record<string, unknown>``), the Python model uses ``dict[str, Any]``.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

from .types import (
    ActionPriority,
    ActionStatus,
    ApprovalTier,
    EntityType,
    ExecutionMode,
    FabricLayerName,
    MirrorEvalVerdict,
    OutcomeStatus,
    PolicyEnforcement,
    ProofPacketKind,
    SignalSeverity,
    SignalStatus,
    Vertical,
    VerticalOrGlobal,
    WorkcellStatus,
)


def _utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


class _FabricModel(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        str_strip_whitespace=False,
        populate_by_name=True,
    )


# ── Core primitives ─────────────────────────────────────────────────────────


class BusinessSignal(_FabricModel):
    id: str
    vertical: Vertical
    entity: str
    title: str
    description: str
    severity: SignalSeverity
    status: SignalStatus
    businessImpact: str
    evidenceRefs: list[str] = Field(default_factory=list)
    owner: str
    detectedAt: str = Field(default_factory=_utcnow)
    updatedAt: str = Field(default_factory=_utcnow)
    tags: list[str] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)


class Outcome(_FabricModel):
    id: str
    title: str
    description: str
    vertical: Vertical
    status: OutcomeStatus
    owner: str
    targetDate: str
    successMetric: str
    currentValue: float | None = None
    targetValue: float | None = None
    unit: str | None = None
    linkedSignalIds: list[str] = Field(default_factory=list)
    createdAt: str = Field(default_factory=_utcnow)
    updatedAt: str = Field(default_factory=_utcnow)


class ActionBrief(_FabricModel):
    id: str
    title: str
    description: str
    vertical: Vertical
    status: ActionStatus
    recommendedBy: str
    assignedTo: str | None = None
    priority: ActionPriority
    estimatedImpact: str
    requiresApproval: bool
    approvalTier: ApprovalTier
    linkedSignalIds: list[str] = Field(default_factory=list)
    linkedOutcomeIds: list[str] = Field(default_factory=list)
    proofPacketId: str | None = None
    createdAt: str = Field(default_factory=_utcnow)
    updatedAt: str = Field(default_factory=_utcnow)


class PolicyCondition(_FabricModel):
    field: str
    operator: Literal["eq", "neq", "gt", "gte", "lt", "lte", "in", "contains"]
    value: Any


class ApprovalRequirement(_FabricModel):
    tier: Literal["operator", "executive", "board"]
    quorum: int | None = None


class CovenantPolicy(_FabricModel):
    id: str
    name: str
    description: str
    vertical: VerticalOrGlobal
    enforcement: PolicyEnforcement
    conditions: list[PolicyCondition] = Field(default_factory=list)
    approvalRequirements: ApprovalRequirement | None = None
    active: bool = True
    version: int = 1
    createdAt: str = Field(default_factory=_utcnow)
    updatedAt: str = Field(default_factory=_utcnow)


class ProofPacket(_FabricModel):
    id: str
    kind: ProofPacketKind
    entityId: str
    entityType: EntityType
    hash: str
    previousHash: str | None = None
    payload: dict[str, Any] = Field(default_factory=dict)
    policyEvaluationId: str | None = None
    approvalRecordId: str | None = None
    witnessedBy: list[str] = Field(default_factory=list)
    issuedAt: str = Field(default_factory=_utcnow)
    vertical: VerticalOrGlobal


class MirrorEvalDimension(_FabricModel):
    name: str
    score: float
    rationale: str


class MirrorEvalResult(_FabricModel):
    id: str
    targetId: str
    targetType: Literal["action", "workcell", "signal"]
    verdict: MirrorEvalVerdict
    score: float
    dimensions: list[MirrorEvalDimension] = Field(default_factory=list)
    flags: list[str] = Field(default_factory=list)
    evaluatorModel: str
    evaluatedAt: str = Field(default_factory=_utcnow)


class AgentSequenceStep(_FabricModel):
    agentId: str
    role: str
    action: str


class VerificationResult(_FabricModel):
    status: Literal["passed", "failed"]
    checksum: str


class Workcell(_FabricModel):
    id: str
    name: str
    vertical: Vertical
    status: WorkcellStatus
    objective: str
    signals: list[str] = Field(default_factory=list)
    contextPack: dict[str, Any] = Field(default_factory=dict)
    agentSequence: list[AgentSequenceStep] = Field(default_factory=list)
    actionBrief: ActionBrief
    mirrorEvalResult: MirrorEvalResult
    pceContractId: str
    requiresApproval: bool
    mockExecutionResult: dict[str, Any] = Field(default_factory=dict)
    verificationResult: VerificationResult
    proofPacketId: str
    executionTraceId: str
    createdAt: str = Field(default_factory=_utcnow)
    updatedAt: str = Field(default_factory=_utcnow)


class TraceStep(_FabricModel):
    stepId: str
    name: str
    tool: str
    input: dict[str, Any] = Field(default_factory=dict)
    output: dict[str, Any] = Field(default_factory=dict)
    durationMs: int
    status: Literal["ok", "error", "skipped"]
    timestamp: str


class ExecutionTrace(_FabricModel):
    id: str
    workcellId: str
    runId: str
    steps: list[TraceStep] = Field(default_factory=list)
    finalStatus: Literal["completed", "failed", "cancelled"]
    durationMs: int
    proofPacketId: str
    startedAt: str
    completedAt: str


class BusinessTwin(_FabricModel):
    id: str
    vertical: Vertical
    entity: str
    entityType: str
    currentState: dict[str, Any] = Field(default_factory=dict)
    lastSignalId: str
    signalCount: int
    activeOutcomes: int
    pendingActions: int
    coverageScore: float
    updatedAt: str = Field(default_factory=_utcnow)


class FabricStatus(_FabricModel):
    layer: FabricLayerName
    status: Literal["healthy", "degraded", "offline"]
    signalCount: int | None = None
    processingRateHz: float | None = None
    latencyMs: float | None = None
    lastHeartbeat: str = Field(default_factory=_utcnow)


# ── Pack-run wrapper ────────────────────────────────────────────────────────
# This is the JSON artifact emitted to reports/a11oy-substrate/<pack-slug>/.
# Downstream consumers (TS fabric, future a11oy UI, external tooling) typecheck
# against the JSON Schema for this model.


class PackRunReport(_FabricModel):
    """Top-level deterministic JSON artifact for a single pack run."""

    schemaVersion: Literal["1.0"] = "1.0"
    engineVersion: str
    packSlug: str
    packVersion: str
    vertical: Vertical
    runId: str
    mode: ExecutionMode
    startedAt: str
    completedAt: str
    inputFingerprint: str
    signals: list[BusinessSignal] = Field(default_factory=list)
    outcomes: list[Outcome] = Field(default_factory=list)
    actions: list[ActionBrief] = Field(default_factory=list)
    policies: list[CovenantPolicy] = Field(default_factory=list)
    twins: list[BusinessTwin] = Field(default_factory=list)
    proofPackets: list[ProofPacket] = Field(default_factory=list)
    fabricStatus: list[FabricStatus] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)


# Convenience tuple of every primitive whose JSON Schema is exported under
# reports/a11oy-substrate/_schema/.
SCHEMA_EXPORTS: tuple[type[_FabricModel], ...] = (
    BusinessSignal,
    Outcome,
    ActionBrief,
    CovenantPolicy,
    ProofPacket,
    MirrorEvalResult,
    Workcell,
    ExecutionTrace,
    BusinessTwin,
    FabricStatus,
    PackRunReport,
)
