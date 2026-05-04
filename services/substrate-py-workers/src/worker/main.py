"""
Substrate Python Worker — FastAPI application.

Endpoints:
  POST /claim      — Receive a stage claim from the TypeScript engine, execute, return result
  GET  /health     — Liveness probe (always returns 200 while the process is running)
  GET  /ready      — Readiness probe (returns 503 when draining or at capacity)
  GET  /workers    — List registered workers (for the coordinator's fleet view)
  GET  /metrics    — Autoscaling capacity report

Environment variables:
  WORKER_ID                 — unique worker ID (default: py-worker-{random})
  WORKER_MAX_CONCURRENCY    — max concurrent stage claims (default: 4)
  SUBSTRATE_PYTHON_WORKER_URL — not used by the worker itself; only by the TS engine
  OTEL_EXPORTER_OTLP_ENDPOINT — where to send OTel traces (optional)
  WORKER_HEARTBEAT_INTERVAL_S — heartbeat interval in seconds (default: 5)
  WORKER_DRAIN_TIMEOUT_S    — seconds to wait for in-flight stages on drain (default: 60)
"""

from __future__ import annotations

import time
from contextlib import asynccontextmanager
from typing import Any

import structlog
import uvicorn
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.responses import JSONResponse

from .autoscaling import AutoscalingPolicy, build_capacity_report
from .claim_loop import ClaimLoop, ClaimState, WORKER_ID, MAX_CONCURRENCY, get_claim_loop
from .protocol import (
    StageClaimMessage,
    StageResultMessage,
    StageErrorMessage,
    HealthResponse,
    ReadinessResponse,
)
from .stages import STAGE_REGISTRY
from .telemetry import stage_span, get_current_span_id
from .aef_endpoints import aef_router

log = structlog.get_logger(__name__)

_autoscaling_policy = AutoscalingPolicy()


@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("worker_startup", worker_id=WORKER_ID, max_concurrency=MAX_CONCURRENCY)
    yield
    log.info("worker_shutdown", worker_id=WORKER_ID)
    claim_loop = get_claim_loop()
    await claim_loop.drain()


app = FastAPI(
    title="Substrate Python Worker",
    version="1.0.0",
    description=(
        "FastAPI worker that claims and executes stages tagged runtime='python' "
        "from the SZL Holdings Substrate engine."
    ),
    lifespan=lifespan,
)

# AEF CPU-dev embed/rerank endpoints (no model download; deterministic hash-based)
app.include_router(aef_router)


# ─── Stage dispatch ───────────────────────────────────────────────────────────

def _resolve_stage_handler(stage_type: str, stage_config: dict) -> Any:
    """
    Map a stageType + stageConfig.stageKind to a concrete Python stage handler.
    Falls back to the stageType key directly (e.g. 'retrieval', 'ocr').
    """
    stage_kind = (stage_config.get("stageKind") or stage_type).lower()
    handler = STAGE_REGISTRY.get(stage_kind)
    if handler is None:
        retrieve_aliases = {"retrieve", "retrieval", "large-context-retrieval"}
        ocr_aliases = {"ocr", "document-ocr", "doc-chunking", "clause-extraction"}
        geo_aliases = {"geospatial", "geo", "spatial", "intersection", "anomaly-detection"}
        eval_aliases = {"eval_grading", "eval-grading", "grading", "scoring", "eval"}

        if stage_kind in retrieve_aliases or stage_type.lower() in retrieve_aliases:
            return STAGE_REGISTRY["retrieval"]
        if stage_kind in ocr_aliases or stage_type.lower() in ocr_aliases:
            return STAGE_REGISTRY["ocr"]
        if stage_kind in geo_aliases or stage_type.lower() in geo_aliases:
            return STAGE_REGISTRY["geospatial"]
        if stage_kind in eval_aliases or stage_type.lower() in eval_aliases:
            return STAGE_REGISTRY["eval_grading"]

    return handler


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.post("/claim")
async def claim_stage(claim: StageClaimMessage) -> JSONResponse:
    """
    Receive a stage claim from the TypeScript substrate engine.
    Executes the stage and returns StageResultMessage or StageErrorMessage.
    """
    claim_loop = get_claim_loop()
    start_ms = time.monotonic()

    acquired = await claim_loop.try_claim(claim.runId, claim.stageId)
    if not acquired:
        status = "draining" if claim_loop.draining else "at_capacity"
        err = StageErrorMessage(
            workerId=WORKER_ID,
            runId=claim.runId,
            stageId=claim.stageId,
            errorCode="WORKER_UNAVAILABLE",
            errorMessage=f"Worker {status}; cannot accept claim for stage '{claim.stageId}'",
            retryable=True,
            durationMs=0,
        )
        return JSONResponse(content=err.model_dump(), status_code=503)

    try:
        handler = _resolve_stage_handler(claim.stageType, claim.stageConfig)
        if handler is None:
            raise ValueError(
                f"No Python stage handler registered for stageType={claim.stageType!r}. "
                f"Available: {list(STAGE_REGISTRY.keys())}"
            )

        _autoscaling_policy.report_activity(WORKER_ID)

        with stage_span(
            stage_id=claim.stageId,
            stage_type=claim.stageType,
            run_id=claim.runId,
            workflow_id=claim.workflowId,
            traceparent=claim.traceparent,
            mode=claim.mode,
            extra_attributes={"substrate.worker_id": WORKER_ID},
        ) as span:
            claim_dict = claim.model_dump()
            output = await handler(claim_dict)
            span_id = get_current_span_id()

        duration_ms = int((time.monotonic() - start_ms) * 1000)
        confidence = float(output.get("confidence", 0.9)) if isinstance(output, dict) else 0.9

        import hashlib, json as _json
        _input_hash = hashlib.sha256(
            _json.dumps(claim.model_dump().get("input", {}), sort_keys=True, default=str).encode()
        ).hexdigest()[:16]
        result = StageResultMessage(
            workerId=WORKER_ID,
            runId=claim.runId,
            stageId=claim.stageId,
            output=output,
            confidence=confidence,
            durationMs=duration_ms,
            otelSpanId=span_id,
            evidenceIds=list(output.get("evidenceIds", [])) if isinstance(output, dict) else [],
            metadata={
                "stageType": claim.stageType,
                "mode": claim.mode,
                # Required by the TS bridge's validateResultEnvelope()
                "provenance": f"python-worker:{claim.stageType}:{WORKER_ID}",
                "models": [WORKER_ID],
                "replayHash": f"{claim.stageType}-{_input_hash}",
            },
        )
        log.info(
            "stage_completed",
            run_id=claim.runId,
            stage_id=claim.stageId,
            stage_type=claim.stageType,
            duration_ms=duration_ms,
        )
        return JSONResponse(content=result.model_dump())

    except Exception as exc:
        duration_ms = int((time.monotonic() - start_ms) * 1000)
        retryable = not isinstance(exc, ValueError)
        err = StageErrorMessage(
            workerId=WORKER_ID,
            runId=claim.runId,
            stageId=claim.stageId,
            errorCode="STAGE_EXECUTION_ERROR",
            errorMessage=str(exc),
            retryable=retryable,
            durationMs=duration_ms,
        )
        log.error(
            "stage_failed",
            run_id=claim.runId,
            stage_id=claim.stageId,
            error=str(exc),
        )
        return JSONResponse(content=err.model_dump(), status_code=200)

    finally:
        await claim_loop.release(claim.runId, claim.stageId)


@app.get("/health")
async def health() -> HealthResponse:
    """Liveness probe — always 200 while the process is alive."""
    claim_loop = get_claim_loop()
    return HealthResponse(
        status="ok",
        workerId=WORKER_ID,
        activeClaims=claim_loop.active_claims,
        maxConcurrency=claim_loop.max_concurrency,
        draining=claim_loop.draining,
        uptimeSeconds=round(claim_loop.uptime_seconds, 1),
    )


@app.get("/ready")
async def ready(response: Response) -> ReadinessResponse:
    """
    Readiness probe — returns 503 when draining or at capacity.
    Load balancers should stop routing to this worker on 503.
    """
    claim_loop = get_claim_loop()
    if claim_loop.draining:
        response.status_code = 503
        return ReadinessResponse(ready=False, reason="worker is draining")
    if claim_loop.active_claims >= claim_loop.max_concurrency:
        response.status_code = 503
        return ReadinessResponse(ready=False, reason="worker at capacity")
    return ReadinessResponse(ready=True)


@app.get("/workers")
async def list_workers() -> dict:
    """Return fleet view for coordinator or load-balancer."""
    claim_loop = get_claim_loop()
    claims = claim_loop.list_claims()
    return {
        "workers": [
            {
                "workerId": WORKER_ID,
                "activeClaims": claim_loop.active_claims,
                "maxConcurrency": claim_loop.max_concurrency,
                "draining": claim_loop.draining,
                "capabilities": {
                    "stageTypes": list(STAGE_REGISTRY.keys()),
                    "maxConcurrency": claim_loop.max_concurrency,
                    "version": "1.0.0",
                },
                "activeStageClaims": [
                    {
                        "runId": c.run_id,
                        "stageId": c.stage_id,
                        "progress": c.progress,
                        "note": c.note,
                        "elapsedMs": int((time.monotonic() - c.claimed_at) * 1000),
                    }
                    for c in claims
                ],
            }
        ]
    }


@app.get("/metrics")
async def metrics() -> dict:
    """Autoscaling capacity report — read by the coordinator to decide fleet size."""
    claim_loop = get_claim_loop()
    report = build_capacity_report(
        worker_id=WORKER_ID,
        active_claims=claim_loop.active_claims,
        max_concurrency=claim_loop.max_concurrency,
        draining=claim_loop.draining,
        uptime_seconds=claim_loop.uptime_seconds,
    )
    return {
        "workerId": report.worker_id,
        "activeClaims": report.active_claims,
        "maxConcurrency": report.max_concurrency,
        "availableSlots": report.available_slots,
        "draining": report.draining,
        "cpuPercent": report.cpu_percent,
        "memoryPercent": report.memory_percent,
        "uptimeSeconds": round(report.uptime_seconds, 1),
        "timestamp": report.timestamp,
    }


# ─── Entry point ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", "8090"))
    uvicorn.run("worker.main:app", host="0.0.0.0", port=port, reload=False)
