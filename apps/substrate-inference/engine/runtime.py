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


@dataclass
class DownloadProgress:
    model_id: str
    bytes_downloaded: int = 0
    bytes_total: int = 0
    complete: bool = False
    error: str | None = None

    @property
    def percent(self) -> float:
        if self.bytes_total <= 0:
            return 0.0
        return round(self.bytes_downloaded / self.bytes_total * 100, 1)


VRAM_ESTIMATES_MB: dict[str, float] = {
    "llama-3.3-70b-instruct": 8192,
    "llama-3.1-8b-instruct": 4800,
    "qwen3-next-80b": 6144,
    "gemma3-12b": 3200,
    "gpt-oss-20b": 4400,
    "voxtral-small-24b": 5100,
}

VRAM_ESTIMATES_4BIT_MB: dict[str, float] = {
    k: round(v * 0.3, 1) for k, v in VRAM_ESTIMATES_MB.items()
}

VRAM_ESTIMATES_8BIT_MB: dict[str, float] = {
    k: round(v * 0.55, 1) for k, v in VRAM_ESTIMATES_MB.items()
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


def _vram_estimate(model_id: str, quantization: str = "none") -> float:
    if quantization == "4bit":
        return VRAM_ESTIMATES_4BIT_MB.get(
            model_id, round(VRAM_ESTIMATES_MB.get(model_id, 4000) * 0.3, 1)
        )
    if quantization == "8bit":
        return VRAM_ESTIMATES_8BIT_MB.get(
            model_id, round(VRAM_ESTIMATES_MB.get(model_id, 4000) * 0.55, 1)
        )
    return VRAM_ESTIMATES_MB.get(model_id, 4000)


def _pre_download_model(
    hf_name: str,
    cache_dir: str,
    progress: DownloadProgress,
) -> str:
    """
    Pre-download all model shards via huggingface_hub.snapshot_download().

    huggingface_hub handles:
    - Resuming interrupted downloads (partial file + etag checks via
      resume_download=True, which uses HTTP Range requests)
    - Checksum verification (sha256 stored in .metadata files, validated
      by huggingface_hub on each cached file access)
    - Concurrent shard downloads

    Real byte-level progress is tracked via a custom tqdm_class injected
    into snapshot_download. Each per-file tqdm instance calls update(n)
    with the number of bytes received; we aggregate these thread-safely
    into the shared DownloadProgress object for the /health endpoint.

    Returns the local snapshot directory path.
    """
    try:
        from huggingface_hub import snapshot_download
        from huggingface_hub.utils import HfHubHTTPError
    except ImportError:
        log.info(
            "huggingface_hub not available, skipping pre-download (from_pretrained will handle it)",
            hf_name=hf_name,
        )
        progress.complete = True
        return cache_dir

    import threading as _threading

    _lock = _threading.Lock()

    class _FileTqdm:
        """
        Per-file tqdm stand-in: aggregates byte updates into the shared
        DownloadProgress using thread-safe increments.
        """

        def __init__(self, *, total: int | None = None, **_kwargs: object) -> None:
            self._file_total = total or 0
            if self._file_total > 0:
                with _lock:
                    progress.bytes_total += self._file_total

        def update(self, n: int = 1) -> None:
            with _lock:
                progress.bytes_downloaded += n

        def set_postfix(self, **_kw: object) -> None:
            pass

        def set_postfix_str(self, *_a: object, **_kw: object) -> None:
            pass

        def set_description(self, *_a: object, **_kw: object) -> None:
            pass

        def reset(self, total: int | None = None) -> None:
            if total is not None and total > 0:
                with _lock:
                    if self._file_total > 0:
                        progress.bytes_total -= self._file_total
                    self._file_total = total
                    progress.bytes_total += self._file_total

        def close(self) -> None:
            pass

        def __enter__(self) -> "_FileTqdm":
            return self

        def __exit__(self, *_a: object) -> None:
            self.close()

    class _TqdmFactory:
        """
        Callable that snapshot_download uses as tqdm_class(iterable, **kwargs).
        Returns a _FileTqdm instance (which tracks bytes) and wraps the iterable.
        """

        def __call__(
            self,
            iterable: object = None,
            *,
            total: int | None = None,
            **kwargs: object,
        ) -> "_IterableTqdm":
            return _IterableTqdm(iterable, total=total)

    class _IterableTqdm(_FileTqdm):
        """_FileTqdm that is also iterable (required by snapshot_download)."""

        def __init__(
            self,
            iterable: object = None,
            *,
            total: int | None = None,
            **_kwargs: object,
        ) -> None:
            super().__init__(total=total)
            self._iterable = iterable

        def __iter__(self):  # type: ignore[override]
            for item in self._iterable or []:
                yield item

    try:
        log.info("pre_download_start", hf_name=hf_name, cache_dir=cache_dir)
        snapshot_dir = snapshot_download(
            repo_id=hf_name,
            cache_dir=cache_dir,
            resume_download=True,
            local_files_only=False,
            tqdm_class=_TqdmFactory(),  # type: ignore[arg-type]
        )

        # Post-download SHA256 integrity verification.
        # HF stores model weights as content-addressed blobs: each blob file
        # under <repo_dir>/blobs/ is named by its own SHA256 hash. Recomputing
        # and comparing against the filename is a true checksum verification —
        # not a presence check.
        try:
            import hashlib as _hashlib
            import os as _os

            blobs_dir = _os.path.normpath(
                _os.path.join(snapshot_dir, "..", "..", "blobs")
            )
            failed_blobs: list[str] = []
            if _os.path.isdir(blobs_dir):
                for blob_name in _os.listdir(blobs_dir):
                    if blob_name.startswith("."):
                        continue
                    blob_path = _os.path.join(blobs_dir, blob_name)
                    if not _os.path.isfile(blob_path):
                        continue
                    h = _hashlib.sha256()
                    with open(blob_path, "rb") as _f:
                        for _chunk in iter(lambda: _f.read(1 << 20), b""):
                            h.update(_chunk)
                    if h.hexdigest() != blob_name:
                        failed_blobs.append(blob_name)

            if failed_blobs:
                integrity_err = f"SHA256 mismatch for blobs: {failed_blobs}"
                log.error(
                    "pre_download_integrity_failure",
                    hf_name=hf_name,
                    failed_blobs=failed_blobs,
                )
                progress.error = integrity_err
            else:
                log.info(
                    "pre_download_integrity_ok",
                    hf_name=hf_name,
                    blobs_dir=blobs_dir,
                )
        except OSError as verify_exc:
            log.warning(
                "pre_download_integrity_check_failed",
                hf_name=hf_name,
                error=str(verify_exc),
            )

        progress.complete = True
        log.info("pre_download_complete", hf_name=hf_name, snapshot_dir=snapshot_dir)
        return snapshot_dir
    except HfHubHTTPError as exc:
        log.warning("pre_download_http_error", hf_name=hf_name, error=str(exc))
        progress.error = str(exc)
        return cache_dir
    except Exception as exc:
        log.warning("pre_download_failed", hf_name=hf_name, error=str(exc))
        progress.error = str(exc)
        return cache_dir


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
        self._download_progress: dict[str, DownloadProgress] = {}
        # Tracks adapter state in STUB mode (model_id -> list of adapter dicts)
        self._stub_adapters: dict[str, list[dict]] = {}

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

    def get_download_progress(self) -> dict[str, dict]:
        return {
            mid: {
                "bytes_downloaded": p.bytes_downloaded,
                "bytes_total": p.bytes_total,
                "percent": p.percent,
                "complete": p.complete,
                "error": p.error,
            }
            for mid, p in self._download_progress.items()
        }

    def get_active_adapters(self) -> list[dict]:
        adapters: list[dict] = []
        for entry in self._loaded.values():
            if entry.engine_handle is not None and hasattr(entry.engine_handle, "list_adapters"):
                adapters.extend(entry.engine_handle.list_adapters())
        # Include adapters tracked in STUB mode
        for stub_list in self._stub_adapters.values():
            adapters.extend(
                {"name": a["name"], "path": a["path"], "base_model_id": a["base_model_id"], "stub": True}
                for a in stub_list
            )
        return adapters

    def get_active_adapters_count(self) -> int:
        return len(self.get_active_adapters())

    async def load_model(
        self,
        model_id: str,
        cpu_offload_layers: int = 0,
        ssd_cache_dir: str | None = None,
        quantization: str = "none",
    ) -> LoadedModel:
        if model_id in self._loaded:
            return self._loaded[model_id]

        vram_est = _vram_estimate(model_id, quantization)
        engine_handle = None

        if self.mode == EngineMode.LIVE:
            progress = DownloadProgress(model_id=model_id)
            self._download_progress[model_id] = progress

            try:
                import ollm
                hf_name = MODEL_HF_MAP.get(model_id, model_id)
                log.info(
                    "engine_loading_model",
                    model_id=model_id,
                    hf_name=hf_name,
                    quantization=quantization,
                )

                await asyncio.to_thread(
                    _pre_download_model,
                    hf_name,
                    self.models_dir,
                    progress,
                )

                if progress.error:
                    err = progress.error
                    if "SHA256 mismatch" in err or "integrity" in err.lower():
                        raise RuntimeError(
                            f"Integrity check failed for '{model_id}': {err}"
                        )
                    log.warning(
                        "pre_download_had_error_continuing",
                        model_id=model_id,
                        error=err,
                    )

                engine_handle = await asyncio.to_thread(
                    ollm.AutoInference.from_pretrained,
                    hf_name,
                    cache_dir=self.models_dir,
                    ssd_cache_dir=ssd_cache_dir or self.cache_dir,
                    cpu_offload_layers=cpu_offload_layers,
                    torch_dtype="auto",
                    quantization=quantization,
                )

                progress.complete = True
                if hasattr(engine_handle, "vram_used_mb"):
                    vram_est = engine_handle.vram_used_mb
                log.info("engine_model_loaded", model_id=model_id, vram_mb=vram_est)
            except Exception as exc:
                if model_id in self._download_progress:
                    self._download_progress[model_id].error = str(exc)
                log.error("engine_load_failed", model_id=model_id, error=str(exc))
                raise RuntimeError(f"Failed to load model '{model_id}' via oLLM: {exc}") from exc
        else:
            log.info("stub_model_loaded", model_id=model_id, vram_mb=vram_est)
            self._download_progress[model_id] = DownloadProgress(
                model_id=model_id,
                bytes_downloaded=1,
                bytes_total=1,
                complete=True,
            )

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
                if hasattr(entry.engine_handle, "unload"):
                    await asyncio.to_thread(entry.engine_handle.unload)
                del entry.engine_handle
                try:
                    import torch
                    if torch.cuda.is_available():
                        torch.cuda.empty_cache()
                except ImportError:
                    pass
            except Exception as exc:
                log.warning("engine_unload_error", model_id=model_id, error=str(exc))

        self._download_progress.pop(model_id, None)
        log.info("model_unloaded", model_id=model_id, mode=self.mode.value)
        return True

    async def unload_all_models(self) -> None:
        model_ids = list(self._loaded.keys())
        for model_id in model_ids:
            try:
                await self.unload_model(model_id)
            except Exception as exc:
                log.warning("unload_all_error", model_id=model_id, error=str(exc))
        log.info("all_models_unloaded", count=len(model_ids))

    async def load_adapter(
        self, model_id: str, adapter_path: str, adapter_name: str
    ) -> dict:
        entry = self._loaded.get(model_id)
        if entry is None:
            raise RuntimeError(f"Model '{model_id}' is not loaded")

        if self.mode == EngineMode.LIVE and entry.engine_handle is not None:
            await asyncio.to_thread(
                entry.engine_handle.load_adapter,
                adapter_path,
                adapter_name,
            )
            log.info("adapter_loaded", model_id=model_id, adapter_name=adapter_name)
            return {
                "status": "loaded",
                "adapter_name": adapter_name,
                "model_id": model_id,
            }
        else:
            self._stub_adapters.setdefault(model_id, []).append(
                {"name": adapter_name, "path": adapter_path, "base_model_id": model_id}
            )
            log.info("stub_adapter_loaded", model_id=model_id, adapter_name=adapter_name)
            return {
                "status": "loaded",
                "adapter_name": adapter_name,
                "model_id": model_id,
                "stub": True,
            }

    async def unload_adapter(self, model_id: str, adapter_name: str) -> dict:
        entry = self._loaded.get(model_id)
        if entry is None:
            raise RuntimeError(f"Model '{model_id}' is not loaded")

        if self.mode == EngineMode.LIVE and entry.engine_handle is not None:
            await asyncio.to_thread(
                entry.engine_handle.unload_adapter,
                adapter_name,
            )
            log.info("adapter_unloaded", model_id=model_id, adapter_name=adapter_name)
            return {"status": "unloaded", "adapter_name": adapter_name, "model_id": model_id}
        else:
            prior = self._stub_adapters.get(model_id, [])
            self._stub_adapters[model_id] = [a for a in prior if a["name"] != adapter_name]
            log.info("stub_adapter_unloaded", model_id=model_id, adapter_name=adapter_name)
            return {
                "status": "unloaded",
                "adapter_name": adapter_name,
                "model_id": model_id,
                "stub": True,
            }

    async def list_adapters(self, model_id: str | None = None) -> list[dict]:
        if model_id is not None:
            entry = self._loaded.get(model_id)
            if entry is None:
                raise RuntimeError(f"Model '{model_id}' is not loaded")
            if (
                self.mode == EngineMode.LIVE
                and entry.engine_handle is not None
                and hasattr(entry.engine_handle, "list_adapters")
            ):
                return entry.engine_handle.list_adapters()
            return [
                {"name": a["name"], "path": a["path"], "base_model_id": a["base_model_id"], "stub": True}
                for a in self._stub_adapters.get(model_id, [])
            ]
        return self.get_active_adapters()

    async def run_inference_health_checks(self) -> dict[str, dict]:
        results: dict[str, dict] = {}
        for model_id, entry in self._loaded.items():
            if (
                self.mode == EngineMode.LIVE
                and entry.engine_handle is not None
                and hasattr(entry.engine_handle, "run_health_check")
            ):
                check = await asyncio.to_thread(entry.engine_handle.run_health_check)
                results[model_id] = check
            else:
                results[model_id] = {"pass": True, "latency_ms": 0, "stub": True}
        return results

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
                    try:
                        result = await asyncio.to_thread(
                            entry.engine_handle.chat,
                            messages=engine_messages,
                            temperature=temperature,
                            max_new_tokens=max_tokens,
                            top_p=top_p,
                            stop=stop,
                        )
                    except RuntimeError as exc:
                        if "out-of-memory" in str(exc).lower() or "cuda error" in str(exc).lower():
                            self._loaded.pop(model_id, None)
                            raise RuntimeError(
                                f"[CUDA Error] Model '{model_id}' caused a GPU error and has been unloaded. "
                                f"Original error: {exc}"
                            ) from exc
                        raise
                    text = result.get("content", "") if isinstance(result, dict) else str(result)
                    prompt_tokens = result.get("prompt_tokens", 0) if isinstance(result, dict) else 0
                    completion_tokens = (
                        result.get("completion_tokens", 0) if isinstance(result, dict) else len(text.split())
                    )
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
        disconnect_event=None,
    ) -> AsyncIterator[dict]:
        entry = self._loaded.get(model_id)
        if entry is None:
            raise RuntimeError(f"Model '{model_id}' is not loaded")

        async with self._semaphore:
            self._active_requests += 1
            start = time.monotonic()
            try:
                if self.mode == EngineMode.LIVE and entry.engine_handle is not None:
                    import threading

                    engine_messages = self._build_messages_for_engine(messages)
                    ev = disconnect_event or threading.Event()
                    loop = asyncio.get_event_loop()

                    _SENTINEL = object()
                    queue: asyncio.Queue = asyncio.Queue(maxsize=32)

                    def _run_generator() -> None:
                        """Run blocking sync generator in a thread; push tokens to queue."""
                        try:
                            for chunk in entry.engine_handle.chat_stream(
                                messages=engine_messages,
                                temperature=temperature,
                                max_new_tokens=max_tokens,
                                top_p=top_p,
                                stop=stop,
                                disconnect_event=ev,
                            ):
                                if ev.is_set():
                                    break
                                asyncio.run_coroutine_threadsafe(
                                    queue.put(chunk), loop
                                ).result()
                        except Exception as exc:
                            asyncio.run_coroutine_threadsafe(
                                queue.put(exc), loop
                            ).result()
                        finally:
                            asyncio.run_coroutine_threadsafe(
                                queue.put(_SENTINEL), loop
                            ).result()

                    gen_thread = threading.Thread(target=_run_generator, daemon=True)
                    gen_thread.start()

                    try:
                        while True:
                            # Check disconnect before blocking on queue.get() so
                            # cancellation is detected promptly even when tokens
                            # arrive slowly or the model pauses between tokens.
                            if disconnect_event is not None and disconnect_event.is_set():
                                ev.set()
                                break

                            try:
                                item = await asyncio.wait_for(queue.get(), timeout=0.1)
                            except asyncio.TimeoutError:
                                # No token in 100ms — spin back to check disconnect.
                                continue

                            if item is _SENTINEL:
                                break
                            if isinstance(item, RuntimeError):
                                err_str = str(item).lower()
                                if any(k in err_str for k in ("out of memory", "cuda error", "oom")):
                                    self._loaded.pop(model_id, None)
                                    raise RuntimeError(
                                        f"[CUDA Error] Model '{model_id}' caused a GPU error "
                                        f"during streaming and has been unloaded. "
                                        f"Original error: {item}"
                                    ) from item
                                raise item
                            if isinstance(item, Exception):
                                raise item

                            token_text = (
                                item.get("content", "")
                                if isinstance(item, dict)
                                else str(item)
                            )
                            yield {"content": token_text, "finish_reason": None}
                    finally:
                        ev.set()  # ensure generation thread stops if not already
                        gen_thread.join(timeout=15.0)

                    yield {"content": "", "finish_reason": "stop"}
                else:
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
                    yield {"content": "", "finish_reason": "stop"}

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
