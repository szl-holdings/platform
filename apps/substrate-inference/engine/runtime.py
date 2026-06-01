"""
SubstrateRuntime — the core engine bridge between Substrate Inference and oLLM.

When the oLLM library is installed and a CUDA GPU is available, this module uses
the real inference engine. Otherwise, it operates in STUB mode for development
and testing without GPU hardware.
"""
from __future__ import annotations

import asyncio
import enum
import os
import sys
import time
from dataclasses import dataclass, field
from typing import AsyncIterator

import structlog

log = structlog.get_logger(__name__)


class EngineMode(str, enum.Enum):
    LIVE = "live"
    STUB = "stub"


@dataclass
class LoadedModel:
    model_id: str
    loaded_at: float = field(default_factory=time.monotonic)
    vram_used_mb: float = 0.0
    engine_handle: object | None = None


VRAM_ESTIMATES_MB: dict[str, float] = {
    "llama-3.3-70b-instruct": 8192,
    "llama-3.1-8b-instruct": 4800,
    "qwen3-next-80b": 6144,
    "gemma3-12b": 3200,
    "gpt-oss-20b": 4400,
    "voxtral-small-24b": 5100,
}

MODEL_HF_MAP: dict[str, str] = {
    "llama-3.3-70b-instruct": "meta-llama/Llama-3.3-70B-Instruct",
    "llama-3.1-8b-instruct": "meta-llama/Llama-3.1-8B-Instruct",
    "qwen3-next-80b": "Qwen/Qwen3-Next-80B",
    "gemma3-12b": "google/gemma-3-12b-it",
    "gpt-oss-20b": "gpt-oss/GPT-OSS-20B",
    "voxtral-small-24b": "mistralai/Voxtral-Small-24B",
}


def _try_import_ollm():
    try:
        import ollm  # type: ignore[import-untyped]
        return ollm
    except ImportError:
        pass

    vendor_path = os.path.join(os.path.dirname(__file__), "ollm")
    init_path = os.path.join(vendor_path, "ollm", "__init__.py")
    if os.path.isdir(vendor_path) and os.path.exists(init_path):
        if vendor_path not in sys.path:
            sys.path.insert(0, vendor_path)
        try:
            import ollm  # type: ignore[import-untyped]
            return ollm
        except ImportError:
            log.warning("ollm_vendored_import_failed", vendor_path=vendor_path)

    return None


def _detect_gpu_backend() -> str | None:
    try:
        import torch
    except ImportError:
        return None
    if torch.cuda.is_available():
        return "cuda"
    if hasattr(torch, "xpu") and torch.xpu.is_available():
        return "xpu"
    if hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        return "mps"
    try:
        if hasattr(torch, "hip") and torch.hip.is_available():
            return "rocm"
    except AttributeError:
        pass
    if hasattr(torch, "is_hip_available") and torch.is_hip_available():
        return "rocm"
    return None


def _detect_engine_mode() -> EngineMode:
    backend = _detect_gpu_backend()
    if backend is None:
        try:
            import torch  # noqa: F811
            log.info("engine_mode_stub", reason="No GPU backend available (CUDA/ROCm/MPS)")
        except ImportError:
            log.info("engine_mode_stub", reason="torch not installed")
        return EngineMode.STUB

    ollm_mod = _try_import_ollm()
    if ollm_mod is not None:
        log.info("engine_mode_live", reason=f"oLLM engine available (backend={backend})")
        return EngineMode.LIVE
    else:
        log.info("engine_mode_stub", reason="ollm package not installed (checked PyPI and vendor path)")
        return EngineMode.STUB


class SubstrateRuntime:
    def __init__(self, models_dir: str, cache_dir: str, max_concurrent: int = 4):
        self.models_dir = models_dir
        self.cache_dir = cache_dir
        self.max_concurrent = max_concurrent
        self.mode = _detect_engine_mode()
        self._loaded: dict[str, LoadedModel] = {}
        self._request_count = 0
        self._total_latency_ms = 0.0
        self._active_requests = 0
        self._semaphore = asyncio.Semaphore(max_concurrent)

    @property
    def is_live(self) -> bool:
        return self.mode == EngineMode.LIVE

    @property
    def loaded_model_ids(self) -> list[str]:
        return sorted(self._loaded.keys())

    @property
    def queue_depth(self) -> int:
        return self._active_requests

    @property
    def avg_latency_ms(self) -> float:
        return self._total_latency_ms / self._request_count if self._request_count > 0 else 0.0

    @property
    def total_requests(self) -> int:
        return self._request_count

    def is_loaded(self, model_id: str) -> bool:
        return model_id in self._loaded

    def get_vram_for_model(self, model_id: str) -> float:
        if model_id in self._loaded:
            return self._loaded[model_id].vram_used_mb
        return 0.0

    def get_total_vram_used(self) -> float:
        return sum(m.vram_used_mb for m in self._loaded.values())

    async def load_model(
        self,
        model_id: str,
        cpu_offload_layers: int = 0,
        ssd_cache_dir: str | None = None,
    ) -> LoadedModel:
        if model_id in self._loaded:
            return self._loaded[model_id]

        vram_est = VRAM_ESTIMATES_MB.get(model_id, 4000)
        engine_handle = None

        if self.mode == EngineMode.LIVE:
            try:
                import ollm
                hf_name = MODEL_HF_MAP.get(model_id, model_id)
                log.info("engine_loading_model", model_id=model_id, hf_name=hf_name)
                engine_handle = ollm.AutoInference.from_pretrained(
                    hf_name,
                    cache_dir=self.models_dir,
                    ssd_cache_dir=ssd_cache_dir or self.cache_dir,
                    cpu_offload_layers=cpu_offload_layers,
                    torch_dtype="auto",
                )
                if hasattr(engine_handle, 'vram_used_mb'):
                    vram_est = engine_handle.vram_used_mb
                log.info("engine_model_loaded", model_id=model_id, vram_mb=vram_est)
            except Exception as exc:
                log.error("engine_load_failed", model_id=model_id, error=str(exc))
                raise RuntimeError(f"Failed to load model '{model_id}' via oLLM: {exc}") from exc
        else:
            log.info("stub_model_loaded", model_id=model_id, vram_mb=vram_est)

        entry = LoadedModel(
            model_id=model_id,
            vram_used_mb=vram_est,
            engine_handle=engine_handle,
        )
        self._loaded[model_id] = entry
        return entry

    async def unload_model(self, model_id: str) -> bool:
        entry = self._loaded.pop(model_id, None)
        if entry is None:
            return False

        if entry.engine_handle is not None:
            try:
                if hasattr(entry.engine_handle, 'unload'):
                    entry.engine_handle.unload()
                del entry.engine_handle
                import torch
                torch.cuda.empty_cache()
            except Exception as exc:
                log.warning("engine_unload_error", model_id=model_id, error=str(exc))

        log.info("model_unloaded", model_id=model_id, mode=self.mode.value)
        return True

    def _extract_text_content(self, messages: list[dict]) -> str:
        parts: list[str] = []
        for msg in messages:
            content = msg.get("content", "")
            if isinstance(content, str):
                parts.append(content)
            elif isinstance(content, list):
                for block in content:
                    if isinstance(block, dict):
                        if block.get("type") == "text":
                            parts.append(block.get("text", ""))
                        elif block.get("type") == "image_url":
                            parts.append("[image]")
                        elif block.get("type") == "input_audio":
                            parts.append("[audio]")
                    elif isinstance(block, str):
                        parts.append(block)
        return " ".join(parts)

    def _build_messages_for_engine(self, messages: list[dict]) -> list[dict]:
        result = []
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if isinstance(content, str):
                result.append({"role": role, "content": content})
            elif isinstance(content, list):
                text_parts: list[str] = []
                image_urls: list[str] = []
                audio_urls: list[str] = []
                for block in content:
                    if isinstance(block, dict):
                        block_type = block.get("type", "")
                        if block_type == "text":
                            text_parts.append(block.get("text", ""))
                        elif block_type == "image_url":
                            url = block.get("image_url", {})
                            if isinstance(url, dict):
                                image_urls.append(url.get("url", ""))
                            elif isinstance(url, str):
                                image_urls.append(url)
                        elif block_type == "input_audio":
                            audio_data = block.get("input_audio", {})
                            if isinstance(audio_data, dict):
                                data_val = audio_data.get("data", "")
                                fmt = audio_data.get("format", "wav")
                                if data_val:
                                    audio_urls.append(f"data:audio/{fmt};base64,{data_val}")
                            elif isinstance(audio_data, str):
                                audio_urls.append(audio_data)
                        elif block_type == "audio_url":
                            url = block.get("audio_url", {})
                            if isinstance(url, dict):
                                audio_urls.append(url.get("url", ""))
                            elif isinstance(url, str):
                                audio_urls.append(url)
                    elif isinstance(block, str):
                        text_parts.append(block)
                entry: dict = {"role": role, "content": " ".join(text_parts)}
                if image_urls:
                    entry["images"] = image_urls
                if audio_urls:
                    entry["audios"] = audio_urls
                result.append(entry)
            else:
                result.append({"role": role, "content": str(content)})
        return result

    async def complete(
        self,
        model_id: str,
        messages: list[dict],
        temperature: float = 0.7,
        max_tokens: int = 4096,
        top_p: float = 1.0,
        stop: list[str] | None = None,
    ) -> dict:
        entry = self._loaded.get(model_id)
        if entry is None:
            raise RuntimeError(f"Model '{model_id}' is not loaded")

        async with self._semaphore:
            self._active_requests += 1
            start = time.monotonic()
            try:
                if self.mode == EngineMode.LIVE and entry.engine_handle is not None:
                    engine_messages = self._build_messages_for_engine(messages)
                    result = await asyncio.to_thread(
                        entry.engine_handle.chat,
                        messages=engine_messages,
                        temperature=temperature,
                        max_new_tokens=max_tokens,
                        top_p=top_p,
                        stop=stop,
                    )
                    text = result.get("content", "") if isinstance(result, dict) else str(result)
                    prompt_tokens = result.get("prompt_tokens", 0) if isinstance(result, dict) else 0
                    completion_tokens = result.get("completion_tokens", 0) if isinstance(result, dict) else len(text.split())
                else:
                    text_content = self._extract_text_content(messages)
                    prompt_tokens = len(text_content.split())
                    text = (
                        f"[Substrate/{model_id} — STUB MODE] "
                        f"oLLM engine not available. Install with: pip install ollm\n"
                        f"Model: {model_id} ({VRAM_ESTIMATES_MB.get(model_id, '?')} MB VRAM)\n"
                        f"Input tokens: ~{prompt_tokens}"
                    )
                    completion_tokens = len(text.split())

                latency_ms = (time.monotonic() - start) * 1000
                self._request_count += 1
                self._total_latency_ms += latency_ms

                return {
                    "content": text,
                    "prompt_tokens": prompt_tokens,
                    "completion_tokens": completion_tokens,
                    "latency_ms": latency_ms,
                    "finish_reason": "stop",
                }
            finally:
                self._active_requests -= 1

    async def stream_complete(
        self,
        model_id: str,
        messages: list[dict],
        temperature: float = 0.7,
        max_tokens: int = 4096,
        top_p: float = 1.0,
        stop: list[str] | None = None,
    ) -> AsyncIterator[dict]:
        entry = self._loaded.get(model_id)
        if entry is None:
            raise RuntimeError(f"Model '{model_id}' is not loaded")

        async with self._semaphore:
            self._active_requests += 1
            start = time.monotonic()
            try:
                if self.mode == EngineMode.LIVE and entry.engine_handle is not None:
                    engine_messages = self._build_messages_for_engine(messages)

                    def _stream_sync():
                        return entry.engine_handle.chat_stream(
                            messages=engine_messages,
                            temperature=temperature,
                            max_new_tokens=max_tokens,
                            top_p=top_p,
                            stop=stop,
                        )

                    stream = await asyncio.to_thread(_stream_sync)
                    token_count = 0
                    for chunk in stream:
                        token_text = chunk.get("content", "") if isinstance(chunk, dict) else str(chunk)
                        token_count += 1
                        yield {
                            "content": token_text,
                            "finish_reason": None,
                        }
                    yield {
                        "content": "",
                        "finish_reason": "stop",
                    }
                else:
                    text_content = self._extract_text_content(messages)
                    stub_response = (
                        f"[Substrate/{model_id} — STUB MODE] "
                        f"oLLM engine not available. Install with: pip install ollm. "
                        f"Model: {model_id} ({VRAM_ESTIMATES_MB.get(model_id, '?')} MB VRAM)"
                    )
                    words = stub_response.split()
                    for i, word in enumerate(words):
                        yield {
                            "content": word + (" " if i < len(words) - 1 else ""),
                            "finish_reason": None,
                        }
                        await asyncio.sleep(0.02)
                    yield {
                        "content": "",
                        "finish_reason": "stop",
                    }

                latency_ms = (time.monotonic() - start) * 1000
                self._request_count += 1
                self._total_latency_ms += latency_ms
            finally:
                self._active_requests -= 1

    def get_gpu_info(self) -> dict:
        try:
            import torch
            if torch.cuda.is_available():
                props = torch.cuda.get_device_properties(0)
                mem = torch.cuda.mem_get_info(0)
                temp = None
                try:
                    import pynvml
                    pynvml.nvmlInit()
                    handle = pynvml.nvmlDeviceGetHandleByIndex(0)
                    temp = pynvml.nvmlDeviceGetTemperature(handle, pynvml.NVML_TEMPERATURE_GPU)
                except Exception:
                    pass
                return {
                    "name": props.name,
                    "vram_total_mb": round(props.total_mem / 1024 / 1024, 1),
                    "vram_used_mb": round((props.total_mem - mem[0]) / 1024 / 1024, 1),
                    "vram_free_mb": round(mem[0] / 1024 / 1024, 1),
                    "temperature": temp,
                }
        except Exception:
            pass
        return {
            "name": "No GPU detected (CPU-only mode)",
            "vram_total_mb": 0,
            "vram_used_mb": 0,
            "vram_free_mb": 0,
            "temperature": None,
        }
