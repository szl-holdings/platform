"""
Substrate Edge Inference Service — FastAPI application wrapping the oLLM engine.

Provides OpenAI-compatible API endpoints for local GPU inference:
  POST /v1/chat/completions  — Chat completion (with streaming SSE support)
  GET  /v1/models            — List available models
  POST /v1/models/load       — Hot-load a model into GPU memory (auth required)
  POST /v1/models/unload     — Unload a model from GPU memory (auth required)
  GET  /health               — GPU/VRAM status and service health
  GET  /healthz              — Lightweight liveness probe (process up; no GPU query)

Environment variables:
  SUBSTRATE_INFERENCE_PORT    — Port to listen on (default: 8070)
  SUBSTRATE_MODELS_DIR        — Directory for model weights (default: ~/.substrate/models)
  SUBSTRATE_CACHE_DIR         — SSD cache directory for KV offload (default: ~/.substrate/cache)
  SUBSTRATE_MAX_CONCURRENT    — Max concurrent inference requests (default: 4)
  SUBSTRATE_DEFAULT_MODEL     — Default model to load on startup (optional)
  SUBSTRATE_API_KEY           — API key for model management endpoints (optional; when set,
                                 /v1/models/load and /v1/models/unload require it via
                                 Authorization: Bearer <key> header)
  SUBSTRATE_ALLOWED_ORIGINS   — Comma-separated CORS origins (default: localhost only)
  SUBSTRATE_BIND_HOST         — Host to bind to (default: 127.0.0.1 for localhost-only)
"""

from __future__ import annotations

import json
import os
import time
import uuid
from contextlib import asynccontextmanager

import structlog
import uvicorn
from fastapi import Depends, FastAPI, Header, HTTPException
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

import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from engine import SubstrateRuntime, EngineMode

log = structlog.get_logger(__name__)

MODELS_DIR = os.environ.get("SUBSTRATE_MODELS_DIR", os.path.expanduser("~/.substrate/models"))
CACHE_DIR = os.environ.get("SUBSTRATE_CACHE_DIR", os.path.expanduser("~/.substrate/cache"))
MAX_CONCURRENT = int(os.environ.get("SUBSTRATE_MAX_CONCURRENT", "4"))
DEFAULT_MODEL = os.environ.get("SUBSTRATE_DEFAULT_MODEL", "")
API_KEY = os.environ.get("SUBSTRATE_API_KEY", "")
BIND_HOST = os.environ.get("SUBSTRATE_BIND_HOST", "127.0.0.1")

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


async def _require_api_key(authorization: str | None = Header(default=None)) -> None:
    if not API_KEY:
        return
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    parts = authorization.split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer" or parts[1] != API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API key")

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

runtime: SubstrateRuntime | None = None
_start_time: float = 0.0


@asynccontextmanager
async def lifespan(app: FastAPI):
    global runtime, _start_time
    _start_time = time.monotonic()
    os.makedirs(MODELS_DIR, exist_ok=True)
    os.makedirs(CACHE_DIR, exist_ok=True)

    runtime = SubstrateRuntime(
        models_dir=MODELS_DIR,
        cache_dir=CACHE_DIR,
        max_concurrent=MAX_CONCURRENT,
    )

    log.info(
        "substrate_inference_startup",
        models_dir=MODELS_DIR,
        cache_dir=CACHE_DIR,
        max_concurrent=MAX_CONCURRENT,
        engine_mode=runtime.mode.value,
    )

    if DEFAULT_MODEL and DEFAULT_MODEL in MODEL_REGISTRY:
        try:
            await runtime.load_model(DEFAULT_MODEL)
            log.info("default_model_loaded", model=DEFAULT_MODEL)
        except Exception as exc:
            log.error("default_model_load_failed", model=DEFAULT_MODEL, error=str(exc))

    yield
    log.info("substrate_inference_shutdown")


app = FastAPI(
    title="Substrate Edge Inference",
    version="1.0.0",
    description=(
        "oLLM-powered local GPU inference service. "
        "Runs 80B+ parameter models on consumer GPUs (8GB VRAM) at full fp16/bf16 precision "
        "with SSD-offloaded KV cache and FlashAttention-2."
    ),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "User-Agent"],
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


@app.post("/v1/chat/completions")
async def chat_completions(request: ChatCompletionRequest):
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
            _stream_sse(model_id, messages, request),
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


async def _stream_sse(model_id: str, messages: list[dict], request: ChatCompletionRequest):
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
async def list_models() -> ModelListResponse:
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
                loaded=loaded,
                vram_used_mb=vram,
            )
        )
    return ModelListResponse(data=models)


@app.post("/v1/models/load")
async def load_model(request: ModelLoadRequest, _: None = Depends(_require_api_key)) -> ModelLoadResponse:
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
        )

    try:
        await runtime.load_model(
            model_id=request.model_id,
            cpu_offload_layers=request.cpu_offload_layers,
            ssd_cache_dir=request.ssd_cache_dir or CACHE_DIR,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    log.info(
        "model_loaded",
        model_id=request.model_id,
        cpu_offload_layers=request.cpu_offload_layers,
        engine_mode=runtime.mode.value,
    )

    return ModelLoadResponse(
        status="loaded",
        message=f"Model '{request.model_id}' loaded successfully",
        model_id=request.model_id,
    )


@app.post("/v1/models/unload")
async def unload_model(request: ModelLoadRequest, _: None = Depends(_require_api_key)) -> ModelLoadResponse:
    if runtime is None:
        raise HTTPException(status_code=503, detail="Engine not initialized")

    removed = await runtime.unload_model(request.model_id)
    if not removed:
        return ModelLoadResponse(
            status="not_loaded",
            message=f"Model '{request.model_id}' is not currently loaded",
            model_id=request.model_id,
        )

    return ModelLoadResponse(
        status="unloaded",
        message=f"Model '{request.model_id}' unloaded successfully",
        model_id=request.model_id,
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


@app.get("/health")
async def health() -> HealthResponse:
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

    return HealthResponse(
        status="ok" if runtime.loaded_model_ids else "idle",
        loaded_models=runtime.loaded_model_ids,
        gpu_info=gpu_info,
        queue_depth=runtime.queue_depth,
        avg_latency_ms=round(runtime.avg_latency_ms, 2),
        uptime=round(uptime, 1),
        engine=f"oLLM/Substrate ({runtime.mode.value})",
    )


if __name__ == "__main__":
    port = int(os.environ.get("SUBSTRATE_INFERENCE_PORT", "8070"))
    uvicorn.run(
        "src.main:app",
        host=BIND_HOST,
        port=port,
        reload=False,
    )
