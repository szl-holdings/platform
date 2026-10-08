"""
Typed wire protocol — Pydantic v2 models mirroring the TypeScript definitions
in packages/substrate/src/python-worker.ts.

Protocol version: 1.0 (must stay in sync with PYTHON_WORKER_PROTOCOL_VERSION)
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator

PROTOCOL_VERSION: Literal["1.0"] = "1.0"


# ─── Base ─────────────────────────────────────────────────────────────────────

class BaseMessage(BaseModel):
    protocolVersion: str = PROTOCOL_VERSION
    messageId: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )


# ─── Inbound: claim dispatched by the TypeScript engine ───────────────────────

class BudgetConfig(BaseModel):
    escalateAt: float
    requireHumanBelow: float


ExecutionMode = Literal["live", "dry-run", "replay", "counterfactual"]


class StageClaimMessage(BaseMessage):
    type: Literal["stage.claim"] = "stage.claim"
    workerId: str
    runId: str
    workflowId: str
    # The governed tenant is present in both the authenticated header and the
    # signed/recorded claim body. POST /claim rejects a missing or mismatched
    # identity before acquiring an execution slot.
    tenantId: str = Field(
        min_length=1,
        max_length=128,
        pattern=r"^[A-Za-z0-9][A-Za-z0-9._:@/-]{0,127}$",
    )
    stageId: str
    stageType: str
    stageConfig: dict[str, Any] = Field(default_factory=dict)
    input: Any
    budgetConfig: BudgetConfig
    traceId: str
    traceparent: str | None = None
    mode: ExecutionMode = "live"

    @field_validator("protocolVersion")
    @classmethod
    def check_version(cls, v: str) -> str:
        if v != PROTOCOL_VERSION:
            raise ValueError(f"Unsupported protocol version: {v!r}, expected {PROTOCOL_VERSION!r}")
        return v


# ─── Outbound: result or error returned to the TypeScript engine ───────────────

class StageResultMessage(BaseMessage):
    type: Literal["stage.result"] = "stage.result"
    workerId: str
    runId: str
    stageId: str
    output: Any
    # None means the handler did not emit a measured confidence. The worker
    # must not manufacture a high score merely because execution completed.
    confidence: float | None = Field(default=None, ge=0.0, le=1.0)
    durationMs: int = Field(ge=0)
    otelSpanId: str | None = None
    evidenceIds: list[str] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)


class StageErrorMessage(BaseMessage):
    type: Literal["stage.error"] = "stage.error"
    workerId: str
    runId: str
    stageId: str
    errorCode: str
    errorMessage: str
    retryable: bool
    durationMs: int = Field(ge=0)
    correlationId: str | None = None


# ─── Worker lifecycle messages ────────────────────────────────────────────────

class WorkerCapabilities(BaseModel):
    stageTypes: list[str]
    maxConcurrency: int = 4
    version: str = "1.0.0"
    otelEndpoint: str | None = None


class WorkerRegisterMessage(BaseMessage):
    type: Literal["worker.register"] = "worker.register"
    workerId: str
    workerCapabilities: WorkerCapabilities


class StageHeartbeatMessage(BaseMessage):
    type: Literal["stage.heartbeat"] = "stage.heartbeat"
    workerId: str
    runId: str
    stageId: str
    progressPercent: float | None = None
    note: str | None = None


class WorkerShutdownMessage(BaseMessage):
    type: Literal["worker.shutdown"] = "worker.shutdown"
    workerId: str
    graceful: bool = True


# ─── Health / readiness payloads (not wire protocol, internal use) ────────────

class HealthResponse(BaseModel):
    status: Literal["ok", "degraded", "down"]
    workerId: str
    activeClaims: int
    maxConcurrency: int
    draining: bool
    uptimeSeconds: float


class ReadinessResponse(BaseModel):
    ready: bool
    reason: str | None = None
    role: Literal["stage-execution-worker"] = "stage-execution-worker"
    authority: Literal["typescript-substrate"] = "typescript-substrate"
    dependencyStatus: Literal["not-asserted"] = "not-asserted"
