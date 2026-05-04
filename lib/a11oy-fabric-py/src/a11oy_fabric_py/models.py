"""Pydantic v2 models mirroring lib/a11oy-fabric/src/schema.ts.

Field names and types match the TypeScript interfaces exactly so downstream
JSON consumers do not have to translate. Where the TS schema is loose
(``Record<string, unknown>``), the Python model uses ``dict[str, Any]``.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

Vertical = Literal[
    "lyte-revenue",
    "vessels-maritime",
    "terra-real-estate",
    "aegis-defense",
    "prism-counsel",
    "carlota-jo",
    "alloy-core",
    "sentra-cyber",
    "firestorm-ops",
    "nuro-forge",
    "meridian-infra",
    "constellation-graph",
    "tenax-cyber",
    "pulse-health",
    "fincept-finance",
    "growth-marketing",
]

VerticalOrGlobal = Vertical | Literal["global"]
ActionPriority = Literal["urgent", "high", "normal", "low"]
ApprovalTier = Literal["auto", "operator", "executive", "board"]
SignalSeverity = Literal["critical", "high", "medium", "low", "info"]
SignalStatus = Literal["active", "acknowledged", "resolved", "escalated", "suppressed"]
OutcomeStatus = Literal["pending", "in_progress", "achieved", "missed", "blocked"]
ActionStatus = Literal[
    "recommended", "pending_approval", "approved", "executing",
    "completed", "rejected", "failed",
]
PolicyEnforcement = Literal["block", "warn", "log", "require_approval"]
WorkcellStatus = Literal["idle", "running", "paused", "error", "completed"]
ProofPacketKind = Literal[
    "signal_ingestion", "state_transition", "action_execution",
    "policy_evaluation", "mirror_eval", "human_approval",
]
EntityType = Literal["signal", "action", "outcome", "workcell", "policy"]
FabricLayerName = Literal[
    "coverage_graph", "signal_mesh", "state_engine", "causal_core",
    "action_rail", "covenant_layer", "proof_ledger",
]
MirrorEvalVerdict = Literal["pass", "fail", "warn", "abstain"]
ExecutionMode = Literal["demo", "governed", "autonomous", "supervised", "discovery"]


def _utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


class _FabricModel(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        str_strip_whitespace=False,
        populate_by_name=True,
    )


class PolicyCondition(_FabricModel):
    field: str
    operator: Literal["eq", "neq", "gt", "gte", "lt", "lte", "in", "contains"]
    value: Any


class ApprovalRequirement(_FabricModel):
    tier: Literal["operator", "executive", "board"]
    quorum: int | None = None


class MirrorEvalDimension(_FabricModel):
    name: str
    score: float
    rationale: str


class AgentSequenceStep(_FabricModel):
    agentId: str
    role: str
    action: str


class VerificationResult(_FabricModel):
    status: Literal["passed", "failed"]
    checksum: str


class TraceStep(_FabricModel):
    stepId: str
    name: str
    tool: str
    input: dict[str, Any] = Field(default_factory=dict)
    output: dict[str, Any] = Field(default_factory=dict)
    durationMs: int
    status: Literal["ok", "error", "skipped"]
    timestamp: str


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


class MirrorEvalResult(_FabricModel):
    id: str
    targetId: str
    targetType: Literal["action", "workcell", "signal"]
    verdict: MirrorEvalVerdict
    score: float
    dimensions: list[MirrorEvalDimension] = Field(default_factory=list)
    flags: list[str] = Field(default_factory=list)
    evaluatorModel: str = "substrate-mirror-v1"
    evaluatedAt: str = Field(default_factory=_utcnow)


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


class PackRunReport(_FabricModel):
    schemaVersion: Literal["1.0"] = "1.0"
    engineVersion: str
    packSlug: str
    packVersion: str
    vertical: Vertical
    runId: str
    mode: ExecutionMode
    timestamp: str = Field(default_factory=_utcnow)
    startedAt: str = Field(default_factory=_utcnow)
    completedAt: str = Field(default_factory=_utcnow)
    inputFingerprint: str = ""
    signals: list[BusinessSignal] = Field(default_factory=list)
    outcomes: list[Outcome] = Field(default_factory=list)
    actions: list[ActionBrief] = Field(default_factory=list)
    policies: list[CovenantPolicy] = Field(default_factory=list)
    twins: list[BusinessTwin] = Field(default_factory=list)
    proofPackets: list[ProofPacket] = Field(default_factory=list)
    workcells: list[Workcell] = Field(default_factory=list)
    traces: list[ExecutionTrace] = Field(default_factory=list)
    fabricStatus: list[FabricStatus] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)


class PCPRProof(_FabricModel):
    runId: str
    packSlug: str
    engineVersion: str
    packVersion: str
    timestamp: str = Field(default_factory=_utcnow)
    inputFingerprint: str
    entityIds: list[str] = Field(default_factory=list)
    reportHash: str
    chainHash: str
    previousChainHash: str | None = None


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
    PCPRProof,
)
