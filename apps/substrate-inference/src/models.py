from __future__ import annotations

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: str = Field(..., description="Message role: system, user, or assistant")
    content: str | list = Field(..., description="Message content (text or multimodal array)")


class ChatCompletionRequest(BaseModel):
    model: str = Field(..., description="Model ID to use for inference")
    messages: list[ChatMessage] = Field(..., description="Conversation messages")
    temperature: float = Field(0.7, ge=0.0, le=2.0)
    max_tokens: int = Field(4096, ge=1, le=131072)
    top_p: float = Field(1.0, ge=0.0, le=1.0)
    stream: bool = Field(False, description="Enable streaming SSE response")
    stop: list[str] | None = Field(None, description="Stop sequences")


class ChatCompletionChoice(BaseModel):
    index: int
    message: ChatMessage
    finish_reason: str = "stop"


class CompletionUsage(BaseModel):
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0


class ChatCompletionResponse(BaseModel):
    id: str
    object: str = "chat.completion"
    created: int
    model: str
    choices: list[ChatCompletionChoice]
    usage: CompletionUsage


class ModelInfo(BaseModel):
    id: str
    object: str = "model"
    owned_by: str = "substrate-inference"
    context_length: int = 131072
    modalities: list[str] = ["text"]
    parameters: str = ""
    loaded: bool = False
    vram_used_mb: float = 0


class ModelListResponse(BaseModel):
    object: str = "list"
    data: list[ModelInfo]


class ModelLoadRequest(BaseModel):
    model_id: str = Field(..., description="Model ID to load into GPU memory")
    cpu_offload_layers: int = Field(0, ge=0, description="Number of layers to offload to CPU")
    ssd_cache_dir: str | None = Field(None, description="SSD cache directory for KV cache offload")


class ModelLoadResponse(BaseModel):
    status: str
    message: str
    model_id: str


class GpuInfo(BaseModel):
    name: str = "N/A"
    vram_total_mb: float = 0
    vram_used_mb: float = 0
    vram_free_mb: float = 0
    temperature: float | None = None


class StreamDelta(BaseModel):
    role: str | None = None
    content: str | None = None


class StreamChoice(BaseModel):
    index: int = 0
    delta: StreamDelta
    finish_reason: str | None = None


class ChatCompletionChunk(BaseModel):
    id: str
    object: str = "chat.completion.chunk"
    created: int
    model: str
    choices: list[StreamChoice]


class HealthResponse(BaseModel):
    status: str = "ok"
    loaded_models: list[str] = []
    gpu_info: GpuInfo | None = None
    queue_depth: int = 0
    avg_latency_ms: float = 0
    uptime: float = 0
    version: str = "1.0.0"
    engine: str = "oLLM/Substrate"
