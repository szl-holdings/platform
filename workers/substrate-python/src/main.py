"""
SZL Substrate — Python Worker Reference Implementation
======================================================

FastAPI + Pydantic v2 + OpenTelemetry worker that claims and executes
stages tagged `runtime: "python"` in the Sovereign Execution Substrate.

This is the Phase 1 reference worker. It:
1. Registers itself with the substrate via the typed wire protocol
2. Claims stages tagged runtime="python" from the event bus
3. Executes stages (heavy retrieval, OCR, geospatial, etc.)
4. Returns typed results with confidence scores and OTel spans
5. Sends heartbeats while processing

Phase 1 ships one heavy-retrieval stage executing in Python to prove
the federation works. The TypeScript substrate journal, policy, and
evidence layers remain the single source of truth.

Wire Protocol Version: 1.0
"""

from __future__ import annotations

import asyncio
import time
import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import FastAPI
from opentelemetry import trace
from opentelemetry.context import attach, detach
from opentelemetry.propagate import extract
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import SimpleSpanProcessor, ConsoleSpanExporter
from opentelemetry.trace import SpanKind, StatusCode
from pydantic import BaseModel, Field

# ─── OpenTelemetry Setup ───────────────────────────────────────────────────────

_resource = Resource.create({"service.name": "szl-substrate-python-worker", "service.version": "1.0.0"})
_provider = TracerProvider(resource=_resource)
_provider.add_span_processor(SimpleSpanProcessor(ConsoleSpanExporter()))
trace.set_tracer_provider(_provider)
_tracer = trace.get_tracer("szl.substrate.python", "1.0.0")

# ─── Pydantic v2 Message Models ───────────────────────────────────────────────

PROTOCOL_VERSION = "1.0"


class BaseMessage(BaseModel):
    protocol_version: str = Field(default=PROTOCOL_VERSION, alias="protocolVersion")
    message_id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="messageId")
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        alias="timestamp",
    )

    model_config = {"populate_by_name": True}


class WorkerCapabilities(BaseModel):
    stage_types: list[str] = Field(alias="stageTypes", default=["Retrieve"])
    max_concurrency: int = Field(alias="maxConcurrency", default=4)
    version: str = Field(default="1.0.0-python")
    otel_endpoint: str | None = Field(alias="otelEndpoint", default=None)

    model_config = {"populate_by_name": True}


class WorkerRegisterMessage(BaseMessage):
    type: str = "worker.register"
    worker_id: str = Field(alias="workerId")
    worker_capabilities: WorkerCapabilities = Field(alias="workerCapabilities")

    model_config = {"populate_by_name": True}


class BudgetConfig(BaseModel):
    escalate_at: float = Field(alias="escalateAt", default=0.5)
    require_human_below: float = Field(alias="requireHumanBelow", default=0.3)

    model_config = {"populate_by_name": True}


class StageClaimMessage(BaseMessage):
    type: str = "stage.claim"
    worker_id: str = Field(alias="workerId")
    run_id: str = Field(alias="runId")
    workflow_id: str = Field(alias="workflowId")
    stage_id: str = Field(alias="stageId")
    stage_type: str = Field(alias="stageType")
    stage_config: dict[str, Any] = Field(alias="stageConfig")
    input: Any
    budget_config: BudgetConfig = Field(alias="budgetConfig")
    trace_id: str = Field(alias="traceId")
    traceparent: str | None = None

    model_config = {"populate_by_name": True}


class StageHeartbeatMessage(BaseMessage):
    type: str = "stage.heartbeat"
    worker_id: str = Field(alias="workerId")
    run_id: str = Field(alias="runId")
    stage_id: str = Field(alias="stageId")
    progress_percent: float | None = Field(alias="progressPercent", default=None)
    note: str | None = None

    model_config = {"populate_by_name": True}


class StageResultMessage(BaseMessage):
    type: str = "stage.result"
    worker_id: str = Field(alias="workerId")
    run_id: str = Field(alias="runId")
    stage_id: str = Field(alias="stageId")
    output: Any
    confidence: float
    duration_ms: int = Field(alias="durationMs")
    otel_span_id: str | None = Field(alias="otelSpanId", default=None)
    evidence_ids: list[str] = Field(alias="evidenceIds", default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)

    model_config = {"populate_by_name": True}


class StageErrorMessage(BaseMessage):
    type: str = "stage.error"
    worker_id: str = Field(alias="workerId")
    run_id: str = Field(alias="runId")
    stage_id: str = Field(alias="stageId")
    error_code: str = Field(alias="errorCode")
    error_message: str = Field(alias="errorMessage")
    retryable: bool = True
    duration_ms: int = Field(alias="durationMs")

    model_config = {"populate_by_name": True}


# ─── Retrieval Result ─────────────────────────────────────────────────────────

class RetrievedDocument(BaseModel):
    id: str
    content: str
    relevance_score: float = Field(alias="relevanceScore")
    source: str
    metadata: dict[str, Any] = Field(default_factory=dict)

    model_config = {"populate_by_name": True}


class RetrievalOutput(BaseModel):
    documents: list[RetrievedDocument]
    retrieved_count: int = Field(alias="retrievedCount")
    query: str
    worker: str = "python"
    duration_ms: int = Field(alias="durationMs")

    model_config = {"populate_by_name": True}


# ─── Worker State ─────────────────────────────────────────────────────────────

WORKER_ID = f"python-worker-{uuid.uuid4().hex[:8]}"
active_claims: dict[str, StageClaimMessage] = {}


# ─── Heavy Retrieval Executor ─────────────────────────────────────────────────

async def execute_heavy_retrieval(claim: StageClaimMessage) -> StageResultMessage:
    """
    Reference heavy-retrieval stage executor.

    In production, this would call:
    - pgvector / Pinecone for semantic search
    - Elasticsearch for full-text retrieval
    - S3/GCS for document fetching
    - PDF/OCR processing for unstructured documents

    Phase 1 ships a realistic mock to prove the federation protocol.
    All executions are wrapped in an OTel span; traceparent from the TS
    substrate is propagated via W3C TraceContext so spans nest correctly.
    """
    # ── W3C TraceContext propagation ─────────────────────────────────────────
    # Extract the incoming traceparent header so our span becomes a child of
    # the TypeScript substrate trace.
    carrier: dict[str, str] = {}
    if claim.traceparent:
        carrier["traceparent"] = claim.traceparent

    parent_ctx = extract(carrier)
    token = attach(parent_ctx)

    span_id_hex: str | None = None

    try:
        with _tracer.start_as_current_span(
            f"substrate.python.retrieve/{claim.stage_id}",
            kind=SpanKind.SERVER,
        ) as span:
            span.set_attribute("substrate.run_id", claim.run_id)
            span.set_attribute("substrate.workflow_id", claim.workflow_id)
            span.set_attribute("substrate.stage_id", claim.stage_id)
            span.set_attribute("substrate.stage_type", claim.stage_type)
            span.set_attribute("substrate.worker_id", WORKER_ID)

            # Export span ID for evidence chaining in the TS journal
            ctx = span.get_span_context()
            if ctx and ctx.span_id:
                span_id_hex = format(ctx.span_id, "016x")

            start_ms = int(time.time() * 1000)
            stage_config = claim.stage_config

            top_k: int = int(stage_config.get("topK", 10))
            min_score: float = float(stage_config.get("minRelevanceScore", 0.5))

            query = ""
            if isinstance(claim.input, str):
                query = claim.input
            elif isinstance(claim.input, dict):
                query = claim.input.get("query", str(claim.input))[:200]

            span.set_attribute("substrate.retrieve.query", query[:200])
            span.set_attribute("substrate.retrieve.top_k", top_k)

            # Send heartbeat while "processing"
            heartbeat = StageHeartbeatMessage(
                workerId=WORKER_ID,
                runId=claim.run_id,
                stageId=claim.stage_id,
                progressPercent=50.0,
                note="Retrieving corpus documents",
            )
            # In production: publish to event bus
            print(f"[heartbeat] {heartbeat.model_dump_json(by_alias=True)}")

            # Simulate retrieval latency
            await asyncio.sleep(0.02)

            # Generate synthetic but realistic documents
            docs = []
            sources = [
                "lyte-metrics-store",
                "lyte-trace-index",
                "lyte-alert-corpus",
                "lyte-runbook-library",
            ]

            for i in range(min(top_k, 4)):
                score = max(min_score, 0.95 - i * 0.08)
                doc = RetrievedDocument(
                    id=f"py-doc-{claim.run_id[:8]}-{i}",
                    content=f"[python-retrieval] Lyte service document {i+1}: "
                            f"Service anomaly data for '{query[:50]}'. "
                            f"Contains performance metrics, SLO compliance data, and incident signals.",
                    relevanceScore=score,
                    source=sources[i % len(sources)],
                    metadata={
                        "worker": "python",
                        "run_id": claim.run_id,
                        "stage_id": claim.stage_id,
                        "language": "python",
                        "index": i,
                    },
                )
                docs.append(doc)

            duration_ms = int(time.time() * 1000) - start_ms
            avg_confidence = sum(d.relevance_score for d in docs) / max(len(docs), 1)

            span.set_attribute("substrate.retrieve.document_count", len(docs))
            span.set_attribute("substrate.retrieve.avg_confidence", avg_confidence)
            span.set_attribute("substrate.retrieve.duration_ms", duration_ms)
            span.set_status(StatusCode.OK)

            output = RetrievalOutput(
                documents=docs,
                retrievedCount=len(docs),
                query=query,
                durationMs=duration_ms,
            )

            return StageResultMessage(
                workerId=WORKER_ID,
                runId=claim.run_id,
                stageId=claim.stage_id,
                output=output.model_dump(by_alias=True),
                confidence=avg_confidence,
                durationMs=duration_ms,
                otelSpanId=span_id_hex,
                metadata={
                    "worker_id": WORKER_ID,
                    "python_version": "3.11",
                    "phase": "1",
                    "execution_environment": "python-fastapi",
                    "otel_trace_id": format(ctx.trace_id, "032x") if ctx and ctx.trace_id else None,
                },
            )

    finally:
        detach(token)


# ─── FastAPI App ──────────────────────────────────────────────────────────────

app = FastAPI(
    title="SZL Substrate Python Worker",
    description="Phase 1 reference Python worker for the Sovereign Execution Substrate",
    version="1.0.0",
)


@app.get("/health")
async def health() -> dict[str, Any]:
    return {
        "status": "healthy",
        "workerId": WORKER_ID,
        "protocolVersion": PROTOCOL_VERSION,
        "capabilities": {
            "stageTypes": ["Retrieve"],
            "maxConcurrency": 4,
        },
        "activeClaims": len(active_claims),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.post("/claim")
async def claim_stage(claim: StageClaimMessage) -> StageResultMessage | StageErrorMessage:
    """
    Claim and execute a stage dispatched by the TypeScript substrate engine.

    In production, claims would arrive via the event bus (Redis Streams,
    Postgres LISTEN/NOTIFY, or NATS). Phase 1 accepts direct HTTP calls.
    """
    if claim.stage_type not in {"Retrieve"}:
        return StageErrorMessage(
            workerId=WORKER_ID,
            runId=claim.run_id,
            stageId=claim.stage_id,
            errorCode="UNSUPPORTED_STAGE_TYPE",
            errorMessage=f"Worker does not support stage type '{claim.stage_type}'",
            retryable=False,
            durationMs=0,
        )

    active_claims[f"{claim.run_id}:{claim.stage_id}"] = claim

    try:
        if claim.stage_type == "Retrieve":
            result = await execute_heavy_retrieval(claim)
        else:
            result = StageErrorMessage(
                workerId=WORKER_ID,
                runId=claim.run_id,
                stageId=claim.stage_id,
                errorCode="UNSUPPORTED_STAGE_TYPE",
                errorMessage=f"Unsupported stage type: {claim.stage_type}",
                retryable=False,
                durationMs=0,
            )
    finally:
        active_claims.pop(f"{claim.run_id}:{claim.stage_id}", None)

    return result


@app.get("/workers")
async def list_workers() -> dict[str, Any]:
    return {
        "workers": [
            {
                "workerId": WORKER_ID,
                "capabilities": {
                    "stageTypes": ["Retrieve"],
                    "maxConcurrency": 4,
                    "version": "1.0.0-python",
                },
                "activeClaims": len(active_claims),
            }
        ]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
