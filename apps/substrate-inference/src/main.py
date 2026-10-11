"""
Substrate Edge Inference Service — FastAPI application for the checked-in
Transformers adapter.

Provides OpenAI-compatible API endpoints for local GPU inference:
  POST /v1/chat/completions  — Chat completion (auth required; streaming supported)
  GET  /v1/models            — List available models (auth required)
  POST /v1/models/load       — Hot-load a model into GPU memory (auth required)
  POST /v1/models/unload     — Unload a model from GPU memory (auth required)
  GET  /health               — Authenticated GPU/VRAM diagnostics
  GET  /healthz              — Lightweight liveness probe (process up; no GPU query)

Environment variables:
  SUBSTRATE_INFERENCE_PORT    — Port to listen on (default: 8070)
  SUBSTRATE_MODELS_DIR        — Directory for model weights (default: ~/.substrate/models)
  SUBSTRATE_CACHE_DIR         — Reserved cache directory (default: ~/.substrate/cache)
  SUBSTRATE_MAX_CONCURRENT    — Max concurrent inference requests (default: 4)
  SUBSTRATE_DEFAULT_MODEL     — Default model to load on startup (optional)
  SUBSTRATE_API_KEY           — Bearer credential required by all /v1 routes
  SUBSTRATE_INFERENCE_ENV     — Runtime environment (production/development/test)
  SUBSTRATE_INFERENCE_AUTH_BYPASS
                              — Explicit auth bypass; accepted only in development/test
  SUBSTRATE_ALLOWED_ORIGINS   — Comma-separated CORS origins (default: localhost only)
  SUBSTRATE_BIND_HOST         — Host to bind to (default: 127.0.0.1 for localhost-only)
"""

from __future__ import annotations

import hmac
import json
import os
import re
import time
import uuid
from contextlib import asynccontextmanager
from urllib.parse import urlsplit

import structlog
import uvicorn
from fastapi import Depends, FastAPI, HTTPException, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from .models import (
    ChatCompletionChoice,
    ChatCompletionRequest,
    ChatCompletionResponse,
    ChatMessage,
    CompletionUsage,
    GpuInfo,
    HealthResponse,
    ModelInfo,
    ModelListResponse,
    ModelLoadRequest,
    ModelLoadResponse,
)
from .security import (
    AuthenticatedPrincipal,
    load_security_config,
    require_inference_access,
    require_model_admin,
)

import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from engine import SubstrateRuntime, EngineMode

log = structlog.get_logger(__name__)

MODELS_DIR = os.environ.get("SUBSTRATE_MODELS_DIR", os.path.expanduser("~/.substrate/models"))
CACHE_DIR = os.environ.get("SUBSTRATE_CACHE_DIR", os.path.expanduser("~/.substrate/cache"))
MAX_CONCURRENT = int(os.environ.get("SUBSTRATE_MAX_CONCURRENT", "4"))
DEFAULT_MODEL = os.environ.get("SUBSTRATE_DEFAULT_MODEL", "")
BIND_HOST = os.environ.get("SUBSTRATE_BIND_HOST", "127.0.0.1")
MODEL_REVISIONS_ENV = "SUBSTRATE_MODEL_REVISIONS_JSON"
_IMMUTABLE_REVISION_PATTERN = re.compile(r"^[a-f0-9]{40}$", re.IGNORECASE)

_DEFAULT_ORIGINS = [
    "http://localhost:5000",
    "http://localhost:8070",
    "http://127.0.0.1:5000",
    "http://127.0.0.1:8070",
]
ALLOWED_ORIGINS: list[str] = (
    [o.strip() for o in os.environ["SUBSTRATE_ALLOWED_ORIGINS"].split(",") if o.strip()]
    if os.environ.get("SUBSTRATE_ALLOWED_ORIGINS")
    else _DEFAULT_ORIGINS
)


def _validate_allowed_origins(*, production: bool) -> None:
    for origin in ALLOWED_ORIGINS:
        if origin == "*":
            if production:
                raise RuntimeError(
                    "SUBSTRATE_ALLOWED_ORIGINS cannot contain a wildcard in production"
                )
            continue
        parsed = urlsplit(origin)
        if (
            parsed.scheme not in {"http", "https"}
            or not parsed.netloc
            or parsed.username is not None
            or parsed.password is not None
            or parsed.path not in {"", "/"}
            or parsed.query
            or parsed.fragment
        ):
            raise RuntimeError(
                "SUBSTRATE_ALLOWED_ORIGINS must contain only HTTP(S) origins"
            )

MODEL_REGISTRY: dict[str, ModelInfo] = {
    "llama-3.3-70b-instruct": ModelInfo(
        id="llama-3.3-70b-instruct",
        context_length=131072,
        modalities=["text"],
        parameters="70B",
    ),
    "llama-3.1-8b-instruct": ModelInfo(
        id="llama-3.1-8b-instruct",
        context_length=131072,
        modalities=["text"],
        parameters="8B",
    ),
    "qwen3-next-80b": ModelInfo(
        id="qwen3-next-80b",
        context_length=131072,
        modalities=["text"],
        parameters="80B",
    ),
    "gemma3-12b": ModelInfo(
        id="gemma3-12b",
        context_length=32768,
        modalities=["text", "image"],
        parameters="12B",
    ),
    "gpt-oss-20b": ModelInfo(
        id="gpt-oss-20b",
        context_length=65536,
        modalities=["text"],
        parameters="20B",
    ),
    "voxtral-small-24b": ModelInfo(
        id="voxtral-small-24b",
        context_length=32768,
        modalities=["text", "audio"],
        parameters="24B",
    ),
}


def _load_model_revisions() -> dict[str, str]:
    raw_value = os.environ.get(MODEL_REVISIONS_ENV, "").strip()
    if not raw_value:
        return {}
    try:
        parsed = json.loads(raw_value)
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"{MODEL_REVISIONS_ENV} must contain valid JSON") from exc
    if not isinstance(parsed, dict):
        raise RuntimeError(f"{MODEL_REVISIONS_ENV} must be a JSON object")

    revisions: dict[str, str] = {}
    for model_id, revision in parsed.items():
        if model_id not in MODEL_REGISTRY:
            raise RuntimeError(
                f"{MODEL_REVISIONS_ENV} contains an unknown server model id"
            )
        if not isinstance(revision, str) or not _IMMUTABLE_REVISION_PATTERN.fullmatch(
            revision
        ):
            raise RuntimeError(
                f"{MODEL_REVISIONS_ENV} revisions must be exact 40-character commit SHAs"
            )
        revisions[model_id] = revision.lower()
    return revisions

runtime: SubstrateRuntime | None = None
_start_time: float = 0.0
_PRODUCTION_PROMOTION_HOLDS = (
    "No verified model artifact-set digest and signed promotion receipt are wired.",
    "No observed GPU load/inference qualification receipt is wired for this release image.",
    "Python dependencies are range-based without a committed hashed lock and release SBOM.",
)


def _production_hold_payload() -> dict:
    return {
        "ready": False,
        "status": "HOLD",
        "code": "PRODUCTION_INFERENCE_UNQUALIFIED",
        "evidence_state": "UNAVAILABLE",
        "promotion_receipt_verified": False,
        "holds": list(_PRODUCTION_PROMOTION_HOLDS),
    }


@asynccontextmanager
async def lifespan(app: FastAPI):
    global runtime, _start_time
    security_config = load_security_config()
    app.state.security_config = security_config
    _validate_allowed_origins(production=security_config.environment == "production")
    model_revisions = _load_model_revisions()
    if security_config.environment == "production" and not model_revisions:
        raise RuntimeError(
            f"{MODEL_REVISIONS_ENV} must admit at least one immutable model revision in production"
        )
    _start_time = time.monotonic()
    os.makedirs(MODELS_DIR, exist_ok=True)
    os.makedirs(CACHE_DIR, exist_ok=True)

    runtime = SubstrateRuntime(
        models_dir=MODELS_DIR,
        cache_dir=CACHE_DIR,
        max_concurrent=MAX_CONCURRENT,
        model_revisions=model_revisions,
        require_immutable_revisions=security_config.environment == "production",
    )

    if security_config.environment == "production" and runtime.mode != EngineMode.LIVE:
        raise RuntimeError(
            "Production requires the live checked-in transformer adapter; "
            "STUB mode is development/test only"
        )

    if DEFAULT_MODEL and DEFAULT_MODEL not in MODEL_REGISTRY:
        raise RuntimeError(
            f"SUBSTRATE_DEFAULT_MODEL {DEFAULT_MODEL!r} is not in the server model registry"
        )

    log.info(
        "substrate_inference_startup",
        models_dir=MODELS_DIR,
        cache_dir=CACHE_DIR,
        max_concurrent=MAX_CONCURRENT,
        engine_mode=runtime.mode.value,
        auth_mode="bypass" if security_config.bypass_enabled else "bearer",
        environment=security_config.environment,
    )

    if DEFAULT_MODEL and security_config.environment == "production":
        log.warning(
            "default_model_autoload_held",
            model=DEFAULT_MODEL,
            reason="production promotion receipt is not verified",
        )
    elif DEFAULT_MODEL:
        try:
            await runtime.load_model(DEFAULT_MODEL)
            log.info("default_model_loaded", model=DEFAULT_MODEL)
        except Exception as exc:
            log.error("default_model_load_failed", model=DEFAULT_MODEL, error=str(exc))
            if security_config.environment == "production":
                raise RuntimeError(
                    "The configured production default model failed to load"
                ) from exc

    yield
    log.info("substrate_inference_shutdown")


app = FastAPI(
    title="Substrate Edge Inference",
    version="1.0.0",
    description=(
        "Development-facing local GPU inference service. Registry models are "
        "available only when the live engine, exact revision, artifacts, and "
        "required hardware are configured."
    ),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "User-Agent", "X-Tenant-ID"],
)


def _messages_to_dicts(messages: list[ChatMessage]) -> list[dict]:
    result = []
    for m in messages:
        entry: dict = {"role": m.role}
        if isinstance(m.content, str):
            entry["content"] = m.content
        elif isinstance(m.content, list):
            entry["content"] = m.content
        else:
            entry["content"] = str(m.content)
        result.append(entry)
    return result


def _correlate_payload_tenant(
    payload_tenant_id: str | None,
    principal: AuthenticatedPrincipal,
) -> str | None:
    """Fail closed when credential, header, and payload tenant identities diverge."""

    if payload_tenant_id is not None and payload_tenant_id != payload_tenant_id.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="tenant_id must not contain surrounding whitespace",
        )
    if principal.tenant_id is None:
        if payload_tenant_id is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="X-Tenant-ID is required when tenant_id is supplied",
            )
        return None
    if payload_tenant_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="tenant_id is required for this tenant-bound inference credential",
        )
    if not hmac.compare_digest(payload_tenant_id, principal.tenant_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Payload tenant_id does not match the authenticated tenant",
        )
    return principal.tenant_id


@app.post("/v1/chat/completions")
async def chat_completions(
    request: ChatCompletionRequest,
    principal: AuthenticatedPrincipal = Depends(require_inference_access),
):
    tenant_id = _correlate_payload_tenant(request.tenant_id, principal)
    if principal.environment == "production":
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=_production_hold_payload(),
            headers={"Retry-After": "60"},
        )
    if runtime is None:
        raise HTTPException(status_code=503, detail="Engine not initialized")

    model_id = request.model
    if model_id not in MODEL_REGISTRY:
        raise HTTPException(status_code=404, detail=f"Model '{model_id}' not found in registry")

    if not runtime.is_loaded(model_id):
        raise HTTPException(
            status_code=503,
            detail=f"Model '{model_id}' is not loaded. POST /v1/models/load to load it first.",
        )

    messages = _messages_to_dicts(request.messages)

    if request.stream:
        return StreamingResponse(
            _stream_sse(model_id, messages, request, tenant_id),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
        )

    result = await runtime.complete(
        model_id=model_id,
        messages=messages,
        temperature=request.temperature,
        max_tokens=request.max_tokens,
        top_p=request.top_p,
        stop=request.stop,
    )

    completion_id = f"substrate-{uuid.uuid4().hex[:12]}"
    return ChatCompletionResponse(
        id=completion_id,
        created=int(time.time()),
        model=model_id,
        tenant_id=tenant_id,
        model_revision=runtime.get_revision_for_model(model_id),
        choices=[
            ChatCompletionChoice(
                index=0,
                message=ChatMessage(role="assistant", content=result["content"]),
                finish_reason=result.get("finish_reason", "stop"),
            )
        ],
        usage=CompletionUsage(
            prompt_tokens=result.get("prompt_tokens", 0),
            completion_tokens=result.get("completion_tokens", 0),
            total_tokens=result.get("prompt_tokens", 0) + result.get("completion_tokens", 0),
        ),
    )


async def _stream_sse(
    model_id: str,
    messages: list[dict],
    request: ChatCompletionRequest,
    tenant_id: str | None,
):
    completion_id = f"substrate-{uuid.uuid4().hex[:12]}"
    created = int(time.time())

    async for chunk in runtime.stream_complete(
        model_id=model_id,
        messages=messages,
        temperature=request.temperature,
        max_tokens=request.max_tokens,
        top_p=request.top_p,
        stop=request.stop,
    ):
        delta: dict = {}
        if chunk.get("content"):
            delta["content"] = chunk["content"]
        if chunk.get("role"):
            delta["role"] = chunk["role"]

        sse_data = {
            "id": completion_id,
            "object": "chat.completion.chunk",
            "created": created,
            "model": model_id,
            "tenant_id": tenant_id,
            "model_revision": runtime.get_revision_for_model(model_id),
            "choices": [
                {
                    "index": 0,
                    "delta": delta,
                    "finish_reason": chunk.get("finish_reason"),
                }
            ],
        }
        yield f"data: {json.dumps(sse_data)}\n\n"

    yield "data: [DONE]\n\n"


@app.get("/v1/models")
async def list_models(
    _: AuthenticatedPrincipal = Depends(require_inference_access),
) -> ModelListResponse:
    models = []
    for model_id, info in MODEL_REGISTRY.items():
        loaded = runtime.is_loaded(model_id) if runtime else False
        vram = runtime.get_vram_for_model(model_id) if runtime else 0
        models.append(
            ModelInfo(
                id=info.id,
                context_length=info.context_length,
                modalities=info.modalities,
                parameters=info.parameters,
                revision=runtime.get_revision_for_model(model_id) if runtime else None,
                loaded=loaded,
                vram_used_mb=vram,
            )
        )
    return ModelListResponse(data=models)


@app.post("/v1/models/load")
async def load_model(
    request: ModelLoadRequest,
    principal: AuthenticatedPrincipal = Depends(require_model_admin),
) -> ModelLoadResponse:
    if principal.environment == "production":
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=_production_hold_payload(),
            headers={"Retry-After": "60"},
        )
    if runtime is None:
        raise HTTPException(status_code=503, detail="Engine not initialized")

    if request.model_id not in MODEL_REGISTRY:
        raise HTTPException(
            status_code=404,
            detail=f"Model '{request.model_id}' not found in registry",
        )

    if runtime.is_loaded(request.model_id):
        return ModelLoadResponse(
            status="already_loaded",
            message=f"Model '{request.model_id}' is already loaded",
            model_id=request.model_id,
            model_revision=runtime.get_revision_for_model(request.model_id),
        )

    try:
        await runtime.load_model(
            model_id=request.model_id,
            cpu_offload_layers=request.cpu_offload_layers,
            ssd_cache_dir=request.ssd_cache_dir,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    log.info(
        "model_loaded",
        model_id=request.model_id,
        model_revision=runtime.get_revision_for_model(request.model_id),
        cpu_offload_layers=request.cpu_offload_layers,
        engine_mode=runtime.mode.value,
    )

    if runtime.mode == EngineMode.STUB:
        return ModelLoadResponse(
            status="development_stub_registered",
            message=(
                f"Model '{request.model_id}' registered in development STUB mode; "
                "no model weights were loaded"
            ),
            model_id=request.model_id,
            model_revision=runtime.get_revision_for_model(request.model_id),
        )

    return ModelLoadResponse(
        status="loaded",
        message=f"Model '{request.model_id}' loaded successfully",
        model_id=request.model_id,
        model_revision=runtime.get_revision_for_model(request.model_id),
    )


@app.post("/v1/models/unload")
async def unload_model(
    request: ModelLoadRequest,
    principal: AuthenticatedPrincipal = Depends(require_model_admin),
) -> ModelLoadResponse:
    if principal.environment == "production":
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=_production_hold_payload(),
            headers={"Retry-After": "60"},
        )
    if runtime is None:
        raise HTTPException(status_code=503, detail="Engine not initialized")

    loaded_revision = runtime.get_revision_for_model(request.model_id)
    removed = await runtime.unload_model(request.model_id)
    if not removed:
        return ModelLoadResponse(
            status="not_loaded",
            message=f"Model '{request.model_id}' is not currently loaded",
            model_id=request.model_id,
            model_revision=loaded_revision,
        )

    return ModelLoadResponse(
        status="unloaded",
        message=f"Model '{request.model_id}' unloaded successfully",
        model_id=request.model_id,
        model_revision=loaded_revision,
    )


@app.get("/healthz")
async def healthz() -> dict:
    """Lightweight liveness probe.

    Returns 200 as soon as the process can serve requests. Unlike ``/health``,
    this does not query the GPU or runtime metrics, so it is cheap enough for
    frequent container/orchestrator liveness checks (and is what the Docker
    HEALTHCHECK targets).
    """
    return {"status": "ok"}


@app.get("/ready")
async def ready(response: Response) -> dict:
    """Readiness is true only for a live engine with at least one loaded model."""

    security_config = getattr(app.state, "security_config", None)
    if security_config is not None and security_config.environment == "production":
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        response.headers["Retry-After"] = "60"
        return _production_hold_payload()
    if runtime is None:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {"ready": False, "reason": "engine is not initialized"}
    if runtime.mode != EngineMode.LIVE:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {
            "ready": False,
            "reason": "development STUB engine cannot serve live inference",
        }
    if not runtime.loaded_model_ids:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {"ready": False, "reason": "no live model is loaded"}
    return {"ready": True}


@app.get("/health")
async def health(
    _: AuthenticatedPrincipal = Depends(require_inference_access),
) -> HealthResponse:
    uptime = time.monotonic() - _start_time if _start_time else 0

    if runtime is None:
        return HealthResponse(
            status="initializing",
            uptime=round(uptime, 1),
        )

    gpu_raw = runtime.get_gpu_info()
    gpu_info = GpuInfo(
        name=gpu_raw.get("name", "N/A"),
        vram_total_mb=gpu_raw.get("vram_total_mb", 0),
        vram_used_mb=gpu_raw.get("vram_used_mb", 0),
        vram_free_mb=gpu_raw.get("vram_free_mb", 0),
        temperature=gpu_raw.get("temperature"),
    )

    health_status = (
        "development-stub"
        if runtime.mode == EngineMode.STUB
        else "ok"
        if runtime.loaded_model_ids
        else "idle"
    )
    return HealthResponse(
        status=health_status,
        loaded_models=runtime.loaded_model_ids,
        gpu_info=gpu_info,
        queue_depth=runtime.queue_depth,
        avg_latency_ms=round(runtime.avg_latency_ms, 2),
        uptime=round(uptime, 1),
        engine=f"transformers-adapter ({runtime.mode.value})",
    )


if __name__ == "__main__":
    port = int(os.environ.get("SUBSTRATE_INFERENCE_PORT", "8070"))
    uvicorn.run(
        "src.main:app",
        host=BIND_HOST,
        port=port,
        reload=False,
    )
