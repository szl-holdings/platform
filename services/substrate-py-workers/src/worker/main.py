"""
Substrate Python Worker — FastAPI application.

Endpoints:
  POST /claim      — Receive a stage claim from the TypeScript engine, execute, return result
  GET  /health     — Liveness probe (always returns 200 while the process is running)
  GET  /ready      — Readiness probe (returns 503 when draining or at capacity)
  GET  /workers    — List registered workers (for the coordinator's fleet view)
  GET  /metrics    — Capacity telemetry (no active autoscaling coordinator)

Environment variables:
  WORKER_ID                 — unique worker ID (default: py-worker-{random})
  WORKER_MAX_CONCURRENCY    — max concurrent stage claims (default: 4)
  SUBSTRATE_PYTHON_WORKER_URL — not used by the worker itself; only by the TS engine
  OTEL_EXPORTER_OTLP_ENDPOINT — where to send OTel traces (optional)
  WORKER_HEARTBEAT_INTERVAL_S — heartbeat interval in seconds (default: 5)
  WORKER_DRAIN_TIMEOUT_S    — seconds to wait for in-flight stages on drain (default: 60)
  HOST                      — listen host (default: 127.0.0.1; deploys opt into 0.0.0.0)
  SUBSTRATE_PYTHON_WORKER_API_KEY — bearer credential for POST /claim (no default)
  SUBSTRATE_PYTHON_WORKER_AUTH_BYPASS — explicit development/test-only auth bypass
  SUBSTRATE_PYTHON_WORKER_ENV — worker environment override (development/test/production)
  RUNTIME_MODE               — canonical runtime mode; invalid values fail startup
  SUBSTRATE_PYTHON_WORKER_TENANT_ID — tenant bound to the bearer credential in production
"""

from __future__ import annotations

import math
import secrets
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
    ReadinessResponse,
)
from .runtime_admission import (
    build_production_execution_hold,
    production_execution_held,
)
from .stages import STAGE_REGISTRY
from .telemetry import stage_span, get_current_span_id
from .aef_endpoints import aef_router
from .ovis_omni import OvisRuntimeError, validate_ovis_configuration
from .security import (
    ClaimAuthenticationError,
    WorkerSecurityConfigurationError,
    authenticate_claim,
    load_worker_security_config,
)

log = structlog.get_logger(__name__)

_autoscaling_policy = AutoscalingPolicy()


def _measured_confidence(output: Any) -> float | None:
    """Accept only an explicit finite handler measurement; never invent one."""

    if not isinstance(output, dict):
        return None
    candidate = output.get("confidence")
    if (
        isinstance(candidate, bool)
        or not isinstance(candidate, (int, float))
        or not math.isfinite(candidate)
        or candidate < 0
        or candidate > 1
    ):
        return None
    return float(candidate)


def _authenticate_worker_request(
    request: Request,
    *,
    claim_tenant_id: str | None = None,
):
    """Map the shared bearer/tenant contract to an authenticated principal."""

    try:
        return authenticate_claim(
            authorization=request.headers.get("authorization"),
            header_tenant_id=request.headers.get("x-tenant-id"),
            claim_tenant_id=claim_tenant_id,
        )
    except WorkerSecurityConfigurationError:
        log.error("worker_security_configuration_unavailable")
        raise HTTPException(
            status_code=503,
            detail="Worker security configuration is unavailable",
        ) from None
    except ClaimAuthenticationError as exc:
        headers = {"WWW-Authenticate": "Bearer"} if exc.authenticate_header else None
        raise HTTPException(
            status_code=exc.status_code,
            detail=exc.public_message,
            headers=headers,
        ) from None


@asynccontextmanager
async def lifespan(app: FastAPI):
    security_config = load_worker_security_config()
    validate_ovis_configuration()
    log.info("worker_startup", worker_id=WORKER_ID, max_concurrency=MAX_CONCURRENCY)
    log.info(
        "worker_security_ready",
        environment=security_config.environment,
        authentication_mode=(
            "development-bypass" if security_config.bypass_enabled else "bearer"
        ),
        production_execution_ready=False,
    )
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
async def claim_stage(claim: StageClaimMessage, request: Request) -> JSONResponse:
    """
    Receive a stage claim from the TypeScript substrate engine.
    Executes the stage and returns StageResultMessage or StageErrorMessage.
    """
    principal = _authenticate_worker_request(
        request,
        claim_tenant_id=claim.tenantId,
    )

    # Authentication is necessary but does not establish execution
    # qualification or durable mutation safety. This gate must stay ahead of
    # both ClaimLoop.try_claim() and handler resolution/dispatch.
    if production_execution_held():
        log.warning(
            "production_stage_execution_held",
            tenant_id=principal.tenant_id,
            run_id=claim.runId,
            stage_id=claim.stageId,
        )
        return JSONResponse(
            content=build_production_execution_hold(),
            status_code=503,
            headers={"X-Evidence-State": "UNAVAILABLE", "Retry-After": "60"},
        )

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
            # Stage handlers consume only the authenticated canonical identity,
            # never a differently-normalized value from the request payload.
            claim_dict["tenantId"] = principal.tenant_id
            output = await handler(claim_dict)
            span_id = get_current_span_id()

        duration_ms = int((time.monotonic() - start_ms) * 1000)
        confidence = _measured_confidence(output)

        result = StageResultMessage(
            workerId=WORKER_ID,
            runId=claim.runId,
            stageId=claim.stageId,
            output=output,
            confidence=confidence,
            durationMs=duration_ms,
            otelSpanId=span_id,
            metadata={
                "stageType": claim.stageType,
                "mode": claim.mode,
                "confidenceAssessment": (
                    "MEASURED" if confidence is not None else "UNASSESSED"
                ),
            },
        )
        log.info(
            "stage_completed",
            run_id=claim.runId,
            stage_id=claim.stageId,
            stage_type=claim.stageType,
            tenant_id=principal.tenant_id,
            duration_ms=duration_ms,
        )
        return JSONResponse(content=result.model_dump())

    except Exception as exc:
        duration_ms = int((time.monotonic() - start_ms) * 1000)
        correlation_id = secrets.token_hex(16)
        err = StageErrorMessage(
            workerId=WORKER_ID,
            runId=claim.runId,
            stageId=claim.stageId,
            errorCode="STAGE_EXECUTION_ERROR",
            errorMessage="Stage execution failed; use correlationId for operator investigation",
            # An execution exception can follow partial external side effects.
            # Retrying is unsafe until a shared durable claim/result record can
            # prove the prior outcome. Pre-execution capacity refusals above may
            # remain retryable because no handler was invoked.
            retryable=False,
            durationMs=duration_ms,
            correlationId=correlation_id,
        )
        log.error(
            "stage_failed",
            run_id=claim.runId,
            stage_id=claim.stageId,
            tenant_id=principal.tenant_id,
            correlation_id=correlation_id,
            exception_type=type(exc).__name__,
            exc_info=True,
        )
        return JSONResponse(content=err.model_dump(), status_code=500)

    finally:
        await claim_loop.release(claim.runId, claim.stageId)


@app.get("/health")
async def health() -> dict[str, str]:
    """Minimal public liveness probe with no worker/run/capacity state."""

    return {"status": "ok"}


@app.get("/ready")
async def ready(response: Response) -> dict[str, Any]:
    """
    Readiness probe — returns 503 when draining or at capacity.
    Load balancers should stop routing to this worker on 503.
    """
    try:
        load_worker_security_config()
    except WorkerSecurityConfigurationError:
        response.status_code = 503
        return ReadinessResponse(
            ready=False,
            reason="worker security configuration is unavailable",
        ).model_dump()
    if production_execution_held():
        response.status_code = 503
        response.headers["X-Evidence-State"] = "UNAVAILABLE"
        response.headers["Retry-After"] = "60"
        return build_production_execution_hold()
    try:
        validate_ovis_configuration()
    except OvisRuntimeError:
        response.status_code = 503
        return ReadinessResponse(
            ready=False,
            reason="worker security configuration is unavailable",
        ).model_dump()

    claim_loop = get_claim_loop()
    if claim_loop.draining:
        response.status_code = 503
        return ReadinessResponse(ready=False, reason="worker is draining").model_dump()
    if claim_loop.active_claims >= claim_loop.max_concurrency:
        response.status_code = 503
        return ReadinessResponse(ready=False, reason="worker at capacity").model_dump()
    return {
        **ReadinessResponse(ready=True).model_dump(),
        "promotionState": "DEVELOPMENT",
        "productionExecutionReady": False,
    }


@app.get("/workers")
async def list_workers(request: Request) -> dict:
    """Return fleet view for coordinator or load-balancer."""
    _authenticate_worker_request(request)
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
async def metrics(request: Request) -> dict:
    """Capacity telemetry; this repository has no active scaling coordinator."""
    _authenticate_worker_request(request)
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
    host = os.environ.get("HOST", "127.0.0.1")
    uvicorn.run("worker.main:app", host=host, port=port, reload=False)
