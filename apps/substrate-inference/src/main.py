"""
Substrate Edge Inference Service — FastAPI application wrapping the oLLM engine.

Provides OpenAI-compatible API endpoints for local GPU inference:
  POST /v1/chat/completions       — Chat completion (with streaming SSE support)
  GET  /v1/models                 — List available models
  POST /v1/models/load            — Hot-load a model into GPU memory (auth required)
  POST /v1/models/unload          — Unload a model from GPU memory (auth required)
  POST /v1/adapters/load          — Load a PEFT/LoRA adapter (auth required)
  POST /v1/adapters/unload        — Unload a PEFT/LoRA adapter (auth required)
  GET  /v1/adapters               — List all active adapters
  GET  /health                    — GPU/VRAM status and service health

Environment variables:
  SUBSTRATE_INFERENCE_PORT    — Port to listen on (default: 8070)
  SUBSTRATE_MODELS_DIR        — Directory for model weights (default: ~/.substrate/models)
  SUBSTRATE_CACHE_DIR         — SSD cache directory for KV offload (default: ~/.substrate/cache)
  SUBSTRATE_MAX_CONCURRENT    — Max concurrent inference requests (default: 4)
  SUBSTRATE_DEFAULT_MODEL     — Default model to load on startup (optional)
  SUBSTRATE_API_KEY           — API key for model management endpoints (optional; when set,
                                 /v1/models/load, /v1/models/unload, /v1/adapters/load,
                                 and /v1/adapters/unload require it via
                                 Authorization: Bearer <key> header)
  SUBSTRATE_ALLOWED_ORIGINS   — Comma-separated CORS origins (default: localhost only)
  SUBSTRATE_BIND_HOST         — Host to bind to (default: 127.0.0.1 for localhost-only)
"""

from __future__ import annotations

import asyncio
import json
import os
import time
import uuid
from contextlib import asynccontextmanager

import structlog
import uvicorn
from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from .models import (
    AdapterInfo,
    AdapterListResponse,
    AdapterLoadRequest,
    AdapterResponse,
    AdapterUnloadRequest,
    ChatCompletionChoice,
    ChatCompletionRequest,
    ChatCompletionResponse,
    ChatMessage,
    CompletionUsage,
    GpuInfo,
    HealthResponse,
    InferenceHealthResult,
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
        log.info("default_model_preloading", model=DEFAULT_MODEL)
        try:
            await runtime.load_model(DEFAULT_MODEL)
            log.info("default_model_loaded", model=DEFAULT_MODEL)
        except Exception as exc:
            log.error("default_model_load_failed", model=DEFAULT_MODEL, error=str(exc))

    yield

    log.info("substrate_inference_shutdown_start")
    if runtime is not None:
        await runtime.unload_all_models()
    log.info("substrate_inference_shutdown_complete")


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
async def chat_completions(request: ChatCompletionRequest, http_request: Request):
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
        import threading
        disconnect_event = threading.Event()

        async def _watch_disconnect():
            try:
                while not await http_request.is_disconnected():
                    await asyncio.sleep(0.5)
                disconnect_event.set()
                log.info("sse_client_disconnected", model_id=model_id)
            except Exception:
                disconnect_event.set()

        asyncio.create_task(_watch_disconnect())

        return StreamingResponse(
            _stream_sse(model_id, messages, request, disconnect_event),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
        )

    try:
        result = await runtime.complete(
            model_id=model_id,
            messages=messages,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            top_p=request.top_p,
            stop=request.stop,
        )
    except RuntimeError as exc:
        err = str(exc)
        if "out of memory" in err.lower() or "cuda" in err.lower() or "oom" in err.lower():
            log.error("inference_cuda_oom", model_id=model_id, error=err)
            raise HTTPException(
                status_code=503,
                detail={
                    "error": "cuda_oom",
                    "message": f"CUDA out-of-memory during inference for model '{model_id}'. "
                               "Reduce max_tokens, load a quantized model, or free GPU memory.",
                    "detail": err,
                },
            )
        log.error("inference_runtime_error", model_id=model_id, error=err)
        raise HTTPException(
            status_code=500,
            detail={"error": "inference_failed", "message": err},
        )
    except Exception as exc:
        log.error("inference_unexpected_error", model_id=model_id, error=str(exc))
        raise HTTPException(
            status_code=500,
            detail={"error": "inference_error", "message": str(exc)},
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


async def _stream_sse(model_id: str, messages: list[dict], request: ChatCompletionRequest, disconnect_event=None):
    """
    SSE generator for streaming chat completions.

    All inference exceptions (including CUDA OOM) are caught and emitted as
    a final structured SSE error event before the [DONE] frame so clients
    can detect failures without relying on HTTP status codes (which are
    already committed once streaming starts).
    """
    completion_id = f"substrate-{uuid.uuid4().hex[:12]}"
    created = int(time.time())

    try:
        async for chunk in runtime.stream_complete(
            model_id=model_id,
            messages=messages,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            top_p=request.top_p,
            stop=request.stop,
            disconnect_event=disconnect_event,
        ):
            if disconnect_event is not None and disconnect_event.is_set():
                break

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

    except RuntimeError as exc:
        err = str(exc)
        error_type = "cuda_oom" if (
            "out of memory" in err.lower() or "cuda" in err.lower() or "oom" in err.lower()
        ) else "inference_failed"
        log.error("stream_inference_error", model_id=model_id, error_type=error_type, error=err)
        error_event = {
            "id": completion_id,
            "object": "chat.completion.chunk",
            "created": created,
            "model": model_id,
            "error": {"type": error_type, "message": err},
            "choices": [],
        }
        yield f"data: {json.dumps(error_event)}\n\n"
    except Exception as exc:
        log.error("stream_unexpected_error", model_id=model_id, error=str(exc))
        error_event = {
            "id": completion_id,
            "object": "chat.completion.chunk",
            "created": created,
            "model": model_id,
            "error": {"type": "inference_error", "message": str(exc)},
            "choices": [],
        }
        yield f"data: {json.dumps(error_event)}\n\n"

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
            quantization=request.quantization,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    log.info(
        "model_loaded",
        model_id=request.model_id,
        cpu_offload_layers=request.cpu_offload_layers,
        quantization=request.quantization,
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


@app.post("/v1/adapters/load")
async def load_adapter(request: AdapterLoadRequest, _: None = Depends(_require_api_key)) -> AdapterResponse:
    if runtime is None:
        raise HTTPException(status_code=503, detail="Engine not initialized")

    if not runtime.is_loaded(request.model_id):
        raise HTTPException(
            status_code=503,
            detail=f"Base model '{request.model_id}' is not loaded. Load the model first.",
        )

    try:
        result = await runtime.load_adapter(
            model_id=request.model_id,
            adapter_path=request.adapter_path,
            adapter_name=request.adapter_name,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return AdapterResponse(
        status=result.get("status", "loaded"),
        message=f"Adapter '{request.adapter_name}' loaded onto model '{request.model_id}'",
        adapter_name=request.adapter_name,
        model_id=request.model_id,
        stub=result.get("stub", False),
    )


@app.post("/v1/adapters/unload")
async def unload_adapter(request: AdapterUnloadRequest, _: None = Depends(_require_api_key)) -> AdapterResponse:
    if runtime is None:
        raise HTTPException(status_code=503, detail="Engine not initialized")

    if not runtime.is_loaded(request.model_id):
        raise HTTPException(
            status_code=503,
            detail=f"Base model '{request.model_id}' is not loaded",
        )

    try:
        result = await runtime.unload_adapter(
            model_id=request.model_id,
            adapter_name=request.adapter_name,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return AdapterResponse(
        status=result.get("status", "unloaded"),
        message=f"Adapter '{request.adapter_name}' unloaded from model '{request.model_id}'",
        adapter_name=request.adapter_name,
        model_id=request.model_id,
        stub=result.get("stub", False),
    )


@app.get("/v1/adapters")
async def list_adapters() -> AdapterListResponse:
    if runtime is None:
        return AdapterListResponse(data=[])

    adapters_raw = await runtime.list_adapters()
    adapters = [
        AdapterInfo(
            name=a.get("name", ""),
            path=a.get("path", ""),
            base_model_id=a.get("base_model_id", ""),
            stub=a.get("stub", False),
        )
        for a in adapters_raw
    ]
    return AdapterListResponse(data=adapters)


@app.get("/health")
async def health() -> HealthResponse:
    """Liveness probe — always 200 while the process is running."""
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

    active_adapters = runtime.get_active_adapters_count()
    download_progress = runtime.get_download_progress()

    inference_health_raw = await runtime.run_inference_health_checks()
    inference_health = [
        InferenceHealthResult(**{
            "model_id": mid,
            "pass": check.get("pass", False),
            "latency_ms": check.get("latency_ms", 0),
            "error": check.get("error"),
            "stub": check.get("stub", False),
        })
        for mid, check in inference_health_raw.items()
    ]

    return HealthResponse(
        status="ok" if runtime.loaded_model_ids else "idle",
        loaded_models=runtime.loaded_model_ids,
        gpu_info=gpu_info,
        queue_depth=runtime.queue_depth,
        avg_latency_ms=round(runtime.avg_latency_ms, 2),
        uptime=round(uptime, 1),
        engine=f"oLLM/Substrate ({runtime.mode.value})",
        active_adapters=active_adapters,
        download_progress=download_progress,
        inference_health=inference_health,
    )


@app.get("/ready")
async def ready():
    """
    Readiness probe — returns 503 when the engine is not yet initialised,
    when the default model has not finished loading, or when the queue is
    saturated.  Load balancers should stop routing to this instance on 503.
    """
    from fastapi.responses import JSONResponse

    uptime = time.monotonic() - _start_time if _start_time else 0

    if runtime is None:
        return JSONResponse(
            status_code=503,
            content={"ready": False, "reason": "engine_initialising", "uptime": round(uptime, 1)},
        )

    gpu_raw = runtime.get_gpu_info()
    gpu_available = gpu_raw.get("vram_total_mb", 0) > 0 or runtime.mode.value == "stub"

    # If a default model is configured, require it to be loaded before becoming ready
    if DEFAULT_MODEL and not runtime.is_loaded(DEFAULT_MODEL):
        return JSONResponse(
            status_code=503,
            content={
                "ready": False,
                "reason": f"default_model_not_loaded:{DEFAULT_MODEL}",
                "uptime": round(uptime, 1),
            },
        )

    if runtime.queue_depth >= MAX_CONCURRENT:
        return JSONResponse(
            status_code=503,
            content={
                "ready": False,
                "reason": "queue_saturated",
                "queue_depth": runtime.queue_depth,
                "max_concurrent": MAX_CONCURRENT,
                "uptime": round(uptime, 1),
            },
        )

    return {
        "ready": True,
        "gpu_available": gpu_available,
        "loaded_models": runtime.loaded_model_ids,
        "queue_depth": runtime.queue_depth,
        "engine_mode": runtime.mode.value,
        "uptime": round(uptime, 1),
    }


if __name__ == "__main__":
    # Support both PORT (container-standard) and SUBSTRATE_INFERENCE_PORT (legacy)
    port = int(os.environ.get("PORT", os.environ.get("SUBSTRATE_INFERENCE_PORT", "8070")))
    uvicorn.run(
        "src.main:app",
        host=BIND_HOST,
        port=port,
        reload=False,
        log_config=None,  # structlog handles all logging
    )
