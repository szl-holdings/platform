"""
Sentra Detector Sidecar — FastAPI app.

Endpoints:
  GET  /health
  GET  /detectors              — list manifests hosted here
  POST /detectors/{id}/run     — run a detector with inline inputs/params

On startup, the sidecar fires a registration call to the api-server
(`POST /api/sentra/detectors/sidecar-register`) so the api-server
persists the manifests with this sidecar's baseUrl and can call back
into us. Registration is best-effort: if the api-server is offline at
boot we log a warning, retry on a slow loop, and keep serving local
requests.

Run locally:
  pnpm sentra:sidecar:dev
"""

from __future__ import annotations

import asyncio
import logging
import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Any

import httpx
import uvicorn
from fastapi import FastAPI, HTTPException

from .contracts import (
    DetectorContext,
    Finding,
    SidecarRunRequest,
    SidecarRunResponse,
    TraceLine,
)
from .detectors import EmbeddingDriftDetector, LogAnomalyIsoForestDetector
from .registry import registry

log = logging.getLogger("sentra-detector-sidecar")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")

SIDECAR_ID = os.environ.get("SENTRA_SIDECAR_ID", "sentra-detector-sidecar-local")
SIDECAR_PORT = int(os.environ.get("PORT", os.environ.get("SENTRA_SIDECAR_PORT", "8765")))
SIDECAR_HOST = os.environ.get("SENTRA_SIDECAR_HOST", "127.0.0.1")
# When advertising back to the api-server, the URL must be reachable from
# the api-server's POV. In dev that's loopback; in prod operators set
# SENTRA_SIDECAR_BASE_URL to the in-cluster DNS name of this sidecar.
SIDECAR_ADVERTISED_HOST = os.environ.get("SENTRA_SIDECAR_ADVERTISED_HOST", "127.0.0.1")
SIDECAR_BASE_URL = os.environ.get(
    "SENTRA_SIDECAR_BASE_URL", f"http://{SIDECAR_ADVERTISED_HOST}:{SIDECAR_PORT}"
)
API_SERVER_URL = os.environ.get("SENTRA_API_SERVER_URL", "http://127.0.0.1:5000")
# Heartbeat cadence: re-register periodically so that api-server restarts
# (which lose nothing persistent but DO need to know the sidecar is still
# alive for the /sentra/sidecars observability surface) recover within
# one interval, and so that lastSeenAt stays fresh for operator
# dashboards. Set to 0 to disable the heartbeat loop.
SIDECAR_HEARTBEAT_SECONDS = int(
    os.environ.get("SENTRA_SIDECAR_HEARTBEAT_SECONDS", "30")
)
# Cap on the registration backoff. Registration retries indefinitely so
# that a sidecar booted before the api-server (or during an api-server
# rolling restart) eventually converges without manual intervention.
SIDECAR_REGISTER_MAX_BACKOFF_SECONDS = float(
    os.environ.get("SENTRA_SIDECAR_REGISTER_MAX_BACKOFF_SECONDS", "60")
)

# Register canonical Python detectors at import time so registry.list()
# is non-empty before lifespan startup.
registry.register(EmbeddingDriftDetector())
registry.register(LogAnomalyIsoForestDetector())


_register_state: dict[str, Any] = {
    "lastAttemptAt": None,
    "lastSuccessAt": None,
    "lastError": None,
    "attempts": 0,
    "successes": 0,
}


def _build_register_request() -> tuple[str, dict[str, Any], dict[str, str]]:
    payload = {
        "sidecarId": SIDECAR_ID,
        "baseUrl": SIDECAR_BASE_URL,
        "detectors": [d.manifest.model_dump() for d in registry.list()],
    }
    url = f"{API_SERVER_URL}/api/sentra/detectors/sidecar-register"
    secret = os.environ.get(
        "SENTRA_SIDECAR_SHARED_SECRET", "sentra-sidecar-loopback-dev"
    )
    headers = {"x-sentra-sidecar-secret": secret}
    # The api-server's globalAuthEnforcer gates all /api/sentra/* routes.
    # Local dev (loopback) bypasses it, but any non-loopback deploy must
    # set SENTRA_SIDECAR_INTERNAL_TOKEN to a value accepted by the
    # api-server's x-internal-token verifier (see lib/internal-tokens).
    internal_token = os.environ.get("SENTRA_SIDECAR_INTERNAL_TOKEN")
    if internal_token:
        headers["x-internal-token"] = internal_token
    return url, payload, headers


async def _attempt_register_once() -> bool:
    url, payload, headers = _build_register_request()
    _register_state["lastAttemptAt"] = datetime.now(timezone.utc).isoformat()
    _register_state["attempts"] += 1
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            r = await client.post(url, json=payload, headers=headers)
        if r.status_code < 300:
            _register_state["lastSuccessAt"] = datetime.now(timezone.utc).isoformat()
            _register_state["lastError"] = None
            _register_state["successes"] += 1
            return True
        _register_state["lastError"] = f"HTTP {r.status_code}: {r.text[:200]}"
        return False
    except Exception as e:  # noqa: BLE001
        _register_state["lastError"] = str(e)
        return False


async def _register_loop() -> None:
    """Indefinite registration + heartbeat loop.

    The sidecar must survive: (1) being booted before the api-server,
    (2) the api-server restarting under it, and (3) transient network
    blips. Strategy: try once with fast backoff until the first
    success, then heartbeat re-register on a slow cadence so the
    api-server's lastSeenAt stays fresh and a restarted api-server
    re-learns about us within one heartbeat interval.
    """
    delay = 2.0
    # Phase 1: exponential backoff until first success.
    while True:
        ok = await _attempt_register_once()
        if ok:
            log.info(
                "registered %d detectors with api-server (attempt %d)",
                len(registry.list()),
                _register_state["attempts"],
            )
            break
        log.warning(
            "register attempt %d failed: %s — retry in %.1fs",
            _register_state["attempts"],
            _register_state["lastError"],
            delay,
        )
        await asyncio.sleep(delay)
        delay = min(SIDECAR_REGISTER_MAX_BACKOFF_SECONDS, delay * 2)

    # Phase 2: heartbeat loop. Failure here demotes to warn — we keep
    # serving local /detectors/{id}/run calls that the api-server
    # already knows how to route to us.
    if SIDECAR_HEARTBEAT_SECONDS <= 0:
        return
    while True:
        await asyncio.sleep(SIDECAR_HEARTBEAT_SECONDS)
        ok = await _attempt_register_once()
        if not ok:
            log.warning(
                "heartbeat re-register failed: %s",
                _register_state["lastError"],
            )


@asynccontextmanager
async def lifespan(_app: FastAPI):
    task = asyncio.create_task(_register_loop())
    try:
        yield
    finally:
        task.cancel()
        try:
            await task
        except (asyncio.CancelledError, Exception):  # noqa: BLE001
            pass


app = FastAPI(title="Sentra Detector Sidecar", version="0.1.0", lifespan=lifespan)


@app.get("/health")
async def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "sidecarId": SIDECAR_ID,
        "baseUrl": SIDECAR_BASE_URL,
        "detectors": [d.manifest.id for d in registry.list()],
        "registration": dict(_register_state),
    }


@app.get("/detectors")
async def list_detectors() -> dict[str, Any]:
    return {"detectors": [d.manifest.model_dump() for d in registry.list()]}


@app.post("/detectors/{detector_id}/run", response_model=SidecarRunResponse)
async def run_detector(detector_id: str, req: SidecarRunRequest) -> SidecarRunResponse:
    detector = registry.get(detector_id)
    if detector is None:
        raise HTTPException(status_code=404, detail=f"detector {detector_id} not hosted here")
    if req.detectorId != detector_id:
        raise HTTPException(status_code=400, detail="detectorId mismatch between path and body")
    ctx = DetectorContext(
        detectorId=req.detectorId,
        runId=req.runId,
        startedAt=req.startedAt,
        triggeredBy=req.triggeredBy,
        params=req.params,
        inputs=req.inputs,
    )
    try:
        findings: list[Finding] = await detector.evaluate(ctx)
        return SidecarRunResponse(status="ok", findings=findings, trace=ctx.trace_lines)
    except Exception as e:  # noqa: BLE001
        log.exception("detector %s failed", detector_id)
        return SidecarRunResponse(
            status="error",
            findings=[],
            trace=ctx.trace_lines + [
                TraceLine(
                    ts=datetime.now(timezone.utc).isoformat(),
                    msg="evaluate.failed",
                    data={"error": str(e)},
                )
            ],
            errorMessage=str(e),
        )


def main() -> None:  # pragma: no cover - entry point
    uvicorn.run(
        "sidecar.main:app",
        host=SIDECAR_HOST,
        port=SIDECAR_PORT,
        log_level="info",
        reload=False,
    )


if __name__ == "__main__":  # pragma: no cover
    main()
