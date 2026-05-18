"""
Pydantic mirror of `@szl-holdings/sentra-detector-sdk`.

When the TS SDK changes, mirror those changes here. The api-server
validates incoming payloads with the zod schemas in
`packages/sentra-detector-sdk/src/schemas.ts`, so any drift between this
file and that one will surface immediately as a 400 on the sidecar
register / run round-trip.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Awaitable, Callable, Literal, Optional, Protocol

from pydantic import BaseModel, Field

DetectorKind = Literal["heuristic", "signature", "statistical", "ml", "correlation"]
DetectorRuntime = Literal["ts", "python"]
CostClass = Literal["free", "cheap", "moderate", "expensive"]
GovernanceClass = Literal["read-only", "advisory", "mutating", "auto-remediable"]
FindingSeverity = Literal["critical", "high", "medium", "low", "info"]


class DetectorManifest(BaseModel):
    id: str
    label: str
    description: str
    kind: DetectorKind
    runtime: DetectorRuntime = "python"
    inputs: list[str] = Field(default_factory=list)
    costClass: CostClass
    governanceClass: GovernanceClass
    attackTechniques: Optional[list[str]] = None
    version: Optional[str] = None


class RecommendedAction(BaseModel):
    kind: Literal["patch", "block", "quarantine", "investigate", "tune"]
    detail: str


class Finding(BaseModel):
    id: str
    detectorId: str
    runId: str
    severity: FindingSeverity
    score: float = Field(ge=0.0, le=1.0)
    title: str
    summary: str
    attackTechniques: Optional[list[str]] = None
    affectedAssets: list[str] = Field(default_factory=list)
    evidence: dict[str, Any] = Field(default_factory=dict)
    recommendedAction: Optional[RecommendedAction] = None
    emittedAt: str
    governanceClass: GovernanceClass


class TraceLine(BaseModel):
    ts: str
    msg: str
    data: Optional[dict[str, Any]] = None


class SidecarRunRequest(BaseModel):
    detectorId: str
    runId: str
    triggeredBy: str = "system"
    startedAt: str
    params: dict[str, Any] = Field(default_factory=dict)
    inputs: dict[str, list[Any]] = Field(default_factory=dict)


class SidecarRunResponse(BaseModel):
    status: Literal["ok", "error"]
    findings: list[Finding] = Field(default_factory=list)
    trace: list[TraceLine] = Field(default_factory=list)
    errorMessage: Optional[str] = None


class SidecarRegisterRequest(BaseModel):
    sidecarId: str
    baseUrl: str
    detectors: list[DetectorManifest]


class DetectorContext(BaseModel):
    """Runtime context handed to a Python detector at evaluation time."""

    model_config = {"arbitrary_types_allowed": True}

    detectorId: str
    runId: str
    startedAt: str
    triggeredBy: str
    params: dict[str, Any]
    inputs: dict[str, list[Any]]
    trace_lines: list[TraceLine] = Field(default_factory=list)

    def read(self, input_name: str) -> list[Any]:
        return self.inputs.get(input_name, [])

    def trace(self, msg: str, data: Optional[dict[str, Any]] = None) -> None:
        self.trace_lines.append(
            TraceLine(
                ts=datetime.now(timezone.utc).isoformat(),
                msg=msg,
                data=data,
            )
        )


EvaluateFn = Callable[[DetectorContext], Awaitable[list[Finding]]]


class Detector(Protocol):
    manifest: DetectorManifest

    async def evaluate(self, ctx: DetectorContext) -> list[Finding]:  # pragma: no cover - protocol
        ...
