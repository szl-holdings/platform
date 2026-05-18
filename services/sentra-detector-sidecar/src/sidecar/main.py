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
SIDECAR_BASE_URL = os.environ.get(
    "SENTRA_SIDECAR_BASE_URL", f"http://{SIDECAR_HOST}:{SIDECAR_PORT}"
)
API_SERVER_URL = os.environ.get("SENTRA_API_SERVER_URL", "http://127.0.0.1:5000")

# Register canonical Python detectors at import time so registry.list()
# is non-empty before lifespan startup.
registry.register(EmbeddingDriftDetector())
registry.register(LogAnomalyIsoForestDetector())


async def _register_with_api_server() -> None:
    """Best-effort sidecar handshake. Backs off on failure."""
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
    delay = 2.0
    for attempt in range(5):
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                r = await client.post(url, json=payload, headers=headers)
            if r.status_code < 300:
                log.info(
                    "registered %d detectors with api-server",
                    len(payload["detectors"]),
                )
                return
            log.warning("api-server returned %s on register attempt %d", r.status_code, attempt + 1)
        except Exception as e:  # noqa: BLE001
            log.warning("register attempt %d failed: %s", attempt + 1, e)
        await asyncio.sleep(delay)
        delay = min(30.0, delay * 2)
    log.warning("api-server registration ultimately failed; serving locally only")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    asyncio.create_task(_register_with_api_server())
    yield


app = FastAPI(title="Sentra Detector Sidecar", version="0.1.0", lifespan=lifespan)


@app.get("/health")
async def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "sidecarId": SIDECAR_ID,
        "detectors": [d.manifest.id for d in registry.list()],
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
