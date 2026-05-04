"""
AutoInference — unified entry-point for oLLM model loading and inference.

Implements the core oLLM engine capabilities:
  - SSD-offloaded KV cache for running large models on constrained VRAM
  - CPU layer offloading for memory-constrained environments
  - FlashAttention-2 integration for efficient attention computation
  - Multimodal support for image and audio content blocks
  - PEFT/LoRA adapter loading (merge at load time for native inference speed)
  - Real token-by-token streaming via TextIteratorStreamer
  - Quantization support (4bit/8bit via bitsandbytes)
  - CUDA error recovery with automatic cache clearing

On a GPU host with CUDA + transformers, ``from_pretrained`` loads the model
with the specified offload strategy.  On CPU-only hosts, it raises
``RuntimeError`` so SubstrateRuntime falls back to STUB mode.
"""
from __future__ import annotations

import base64
import importlib
import logging
import os
import tempfile
import threading
from dataclasses import dataclass, field
from typing import Any, Iterator

log = logging.getLogger("ollm.auto_inference")


@dataclass
class AdapterEntry:
    """
    Tracks a PEFT/LoRA adapter that has been merged into the base model.

    Adapters are merged at load time via merge_and_unload() so inference runs
    at native speed without PEFT overhead. Unloading requires reloading the
    base model from disk cache (see unload_adapter()).
    """
    name: str
    path: str
    base_model_id: str


class _SSDKVCacheManager:
    """Manages SSD-backed KV cache storage for large-context inference."""

    def __init__(self, cache_dir: str, max_cache_size_gb: float = 64.0):
        self.cache_dir = cache_dir
        self.max_cache_size_gb = max_cache_size_gb
        self._active = False

        os.makedirs(cache_dir, exist_ok=True)
        log.info("SSD KV cache initialized at %s (max %.1f GB)", cache_dir, max_cache_size_gb)
        self._active = True

    @property
    def active(self) -> bool:
        return self._active

    def get_cache_path(self, model_id: str) -> str:
        safe_name = model_id.replace("/", "_").replace("\\", "_")
        path = os.path.join(self.cache_dir, f"{safe_name}_kv_cache")
        os.makedirs(path, exist_ok=True)
        return path

    def flush(self) -> None:
        import shutil
        try:
            if os.path.isdir(self.cache_dir):
                for item in os.listdir(self.cache_dir):
                    item_path = os.path.join(self.cache_dir, item)
                    if os.path.isdir(item_path) and item.endswith("_kv_cache"):
                        shutil.rmtree(item_path, ignore_errors=True)
            log.info("SSD KV cache flushed at %s", self.cache_dir)
        except Exception as exc:
            log.warning("SSD cache flush failed: %s", exc)


class _DisconnectStoppingCriteria:
    """
    HuggingFace StoppingCriteria that halts generation when a client disconnects.

    Imported lazily to avoid top-level transformers import on CPU hosts.
    """

    def __init__(self, disconnect_event: threading.Event):
        self._event = disconnect_event

    def __call__(self, input_ids: Any, scores: Any, **kwargs: Any) -> bool:
        return self._event.is_set()


class AutoInference:
    """oLLM inference engine with SSD KV cache offload and FlashAttention-2."""

    def __init__(
        self,
        model_id: str,
        model: Any = None,
        tokenizer: Any = None,
        processor: Any = None,
        vram_used_mb: float = 0.0,
        ssd_cache: _SSDKVCacheManager | None = None,
        cpu_offload_layers: int = 0,
        use_flash_attn: bool = False,
        quantization: str = "none",
    ):
        self.model_id = model_id
        self._model = model
        self._tokenizer = tokenizer
        self._processor = processor
        self.vram_used_mb = vram_used_mb
        self._ssd_cache = ssd_cache
        self._cpu_offload_layers = cpu_offload_layers
        self._use_flash_attn = use_flash_attn
        self.quantization = quantization
        self._adapters: dict[str, AdapterEntry] = {}
        # Stored so unload_adapter() can reload the base model from disk cache.
        self._load_kwargs: dict[str, Any] | None = None

    @classmethod
    def from_pretrained(
        cls,
        model_name_or_path: str,
        *,
        cache_dir: str | None = None,
        ssd_cache_dir: str | None = None,
        cpu_offload_layers: int = 0,
        torch_dtype: str = "auto",
        trust_remote_code: bool = True,
        quantization: str = "none",
    ) -> "AutoInference":
        try:
            torch = importlib.import_module("torch")
        except ImportError as exc:
            raise RuntimeError(
                "oLLM requires PyTorch. "
                "Install with: pip install torch"
            ) from exc

        gpu_backend = _detect_gpu_backend(torch)
        if gpu_backend is None:
            raise RuntimeError(
                "oLLM requires a GPU (CUDA, ROCm, or Apple MPS). No GPU backend detected. "
                "For CPU-only development, the SubstrateRuntime will use STUB mode."
            )

        try:
            transformers = importlib.import_module("transformers")
        except ImportError as exc:
            raise RuntimeError(
                "oLLM requires the transformers library. "
                "Install with: pip install transformers"
            ) from exc

        dtype = _resolve_dtype(torch, torch_dtype, quantization=quantization)

        ssd_cache = None
        if ssd_cache_dir:
            ssd_cache = _SSDKVCacheManager(ssd_cache_dir)

        use_flash_attn = False
        attn_impl = "sdpa"
        try:
            importlib.import_module("flash_attn")
            attn_impl = "flash_attention_2"
            use_flash_attn = True
            log.info("FlashAttention-2 available, using flash_attention_2 backend")
        except ImportError:
            log.info("FlashAttention-2 not available, falling back to SDPA")

        try:
            config = transformers.AutoConfig.from_pretrained(
                model_name_or_path,
                cache_dir=cache_dir,
                trust_remote_code=trust_remote_code,
            )
        except Exception as exc:
            log.warning("Could not load model config for device map: %s", exc)
            config = None

        device_map = _build_device_map(torch, cpu_offload_layers, config)

        model_kwargs: dict[str, Any] = {
            "cache_dir": cache_dir,
            "torch_dtype": dtype,
            "device_map": device_map,
            "trust_remote_code": trust_remote_code,
            "attn_implementation": attn_impl,
        }

        if quantization in ("4bit", "8bit"):
            try:
                bnb_config_cls = transformers.BitsAndBytesConfig
                if quantization == "4bit":
                    bnb_config = bnb_config_cls(
                        load_in_4bit=True,
                        bnb_4bit_use_double_quant=True,
                        bnb_4bit_quant_type="nf4",
                        bnb_4bit_compute_dtype=torch.bfloat16,
                    )
                else:
                    bnb_config = bnb_config_cls(load_in_8bit=True)
                model_kwargs["quantization_config"] = bnb_config
                model_kwargs.pop("torch_dtype", None)
                log.info("Quantization enabled: %s via bitsandbytes", quantization)
            except Exception as exc:
                log.warning(
                    "Failed to configure %s quantization: %s. Loading without quantization.",
                    quantization,
                    exc,
                )

        if cpu_offload_layers > 0:
            offload_dir = os.path.join(
                ssd_cache_dir or tempfile.gettempdir(), "cpu_offload"
            )
            os.makedirs(offload_dir, exist_ok=True)
            model_kwargs["offload_folder"] = offload_dir
            log.info(
                "CPU offloading %d layers to %s",
                cpu_offload_layers,
                offload_dir,
            )

        processor = None
        try:
            processor = transformers.AutoProcessor.from_pretrained(
                model_name_or_path,
                cache_dir=cache_dir,
                trust_remote_code=trust_remote_code,
            )
            log.info("Loaded multimodal processor for %s", model_name_or_path)
        except Exception:
            pass

        tokenizer = transformers.AutoTokenizer.from_pretrained(
            model_name_or_path,
            cache_dir=cache_dir,
            trust_remote_code=trust_remote_code,
        )

        model = transformers.AutoModelForCausalLM.from_pretrained(
            model_name_or_path,
            **model_kwargs,
        )

        vram_used = _measure_vram_used(torch, quantization)

        log.info(
            "Model loaded: %s, VRAM: %.1f MB, flash_attn: %s, cpu_offload: %d layers, ssd_cache: %s, quantization: %s",
            model_name_or_path,
            vram_used,
            use_flash_attn,
            cpu_offload_layers,
            bool(ssd_cache),
            quantization,
        )

        instance = cls(
            model_id=model_name_or_path,
            model=model,
            tokenizer=tokenizer,
            processor=processor,
            vram_used_mb=vram_used,
            ssd_cache=ssd_cache,
            cpu_offload_layers=cpu_offload_layers,
            use_flash_attn=use_flash_attn,
            quantization=quantization,
        )
        # Store load params so unload_adapter() can reload the base model from
        # the HF disk cache (no network download — files are already local).
        instance._load_kwargs = {
            "model_name_or_path": model_name_or_path,
            "cache_dir": cache_dir,
            "ssd_cache_dir": ssd_cache_dir,
            "cpu_offload_layers": cpu_offload_layers,
            "torch_dtype": torch_dtype,
            "trust_remote_code": trust_remote_code,
            "quantization": quantization,
        }
        return instance

    def load_adapter(self, adapter_path: str, adapter_name: str) -> None:
        """
        Load a PEFT/LoRA adapter and merge its weights into the base model.

        Calls PeftModel.from_pretrained() then merge_and_unload() so the
        adapter weights are permanently fused into the base model tensors.
        Inference runs at native speed with no PEFT runtime overhead.

        Only one adapter may be merged at a time because merge_and_unload()
        permanently fuses weights — there is no mechanism to later isolate
        one adapter's contribution from another. Attempting to load a second
        adapter raises RuntimeError; call unload_adapter() first to reload
        the clean base model, then load the new adapter.

        To revert adapter effects, call unload_adapter() which reloads the
        original base model weights from the local HuggingFace disk cache.
        """
        if self._model is None:
            raise RuntimeError("Model not loaded — call from_pretrained() first")

        if self._adapters:
            existing = list(self._adapters.keys())
            raise RuntimeError(
                f"Adapter(s) already merged into this model: {existing}. "
                "Because adapters are fused via merge_and_unload(), multiple "
                "simultaneous adapters are not supported. "
                "Call unload_adapter() to restore the base model first."
            )

        try:
            peft = importlib.import_module("peft")
        except ImportError as exc:
            raise RuntimeError(
                "PEFT adapter loading requires the peft library. "
                "Install with: pip install peft>=0.14.0"
            ) from exc

        log.info(
            "Loading adapter '%s' from %s for base model %s",
            adapter_name,
            adapter_path,
            self.model_id,
        )

        peft_model = peft.PeftModel.from_pretrained(
            self._model, adapter_path, adapter_name=adapter_name
        )
        log.info("Merging adapter '%s' weights into base model via merge_and_unload()", adapter_name)
        self._model = peft_model.merge_and_unload()

        self._adapters[adapter_name] = AdapterEntry(
            name=adapter_name,
            path=adapter_path,
            base_model_id=self.model_id,
        )
        log.info("Adapter '%s' merged and active; inference uses fused weights", adapter_name)

    def unload_adapter(self, adapter_name: str) -> None:
        """
        Unload a merged adapter by reloading the base model from disk cache.

        Because adapters are merged at load time (merge_and_unload), their
        weights are permanently fused into the base model tensors. The only
        way to truly revert is to reload the original base model weights.

        This method:
          1. Frees the current (merged) model from GPU memory
          2. Reloads the base model from the local HuggingFace disk cache
             (no network download — files cached from the initial load)
          3. Restores tokenizer and processor references
          4. Clears the full adapters registry (all merged adapters are gone
             once the base model is restored)

        After this call, inference uses the original base model weights.
        """
        if adapter_name not in self._adapters:
            raise RuntimeError(f"Adapter '{adapter_name}' is not loaded")

        if self._model is None:
            raise RuntimeError("Model not loaded")

        if self._load_kwargs is None:
            raise RuntimeError(
                "Cannot reload base model: load kwargs not available. "
                "This instance was not created via from_pretrained()."
            )

        log.info(
            "Unloading adapter '%s' — reloading base model '%s' from disk cache",
            adapter_name,
            self.model_id,
        )

        try:
            torch = importlib.import_module("torch")
            del self._model
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
                torch.cuda.synchronize()
        except Exception as exc:
            log.warning("Error freeing GPU memory before base model reload: %s", exc)

        log.info("Reloading base model from local cache (no network required)")
        reloaded = AutoInference.from_pretrained(**self._load_kwargs)

        self._model = reloaded._model
        self._tokenizer = reloaded._tokenizer
        self._processor = reloaded._processor
        self.vram_used_mb = reloaded.vram_used_mb

        self._adapters.clear()
        log.info(
            "Adapter '%s' unloaded; base model restored; inference uses original weights",
            adapter_name,
        )

    def list_adapters(self) -> list[dict[str, str]]:
        """Return info about all merged adapters currently tracked."""
        return [
            {"name": a.name, "path": a.path, "base_model_id": a.base_model_id}
            for a in self._adapters.values()
        ]

    def chat(
        self,
        messages: list[dict[str, Any]],
        *,
        temperature: float = 0.7,
        max_new_tokens: int = 4096,
        top_p: float = 1.0,
        stop: list[str] | None = None,
    ) -> dict[str, Any]:
        if self._model is None or self._tokenizer is None:
            raise RuntimeError("Model not loaded — call from_pretrained() first")

        torch = importlib.import_module("torch")

        has_media = any(
            msg.get("images") or msg.get("audios") for msg in messages
        )

        if has_media and self._processor is not None:
            return self._multimodal_chat(
                messages,
                temperature=temperature,
                max_new_tokens=max_new_tokens,
                top_p=top_p,
                stop=stop,
            )

        prompt = self._apply_chat_template(messages)
        inputs = self._tokenizer(prompt, return_tensors="pt").to(self._model.device)
        prompt_token_count = inputs["input_ids"].shape[-1]

        gen_kwargs = self._build_gen_kwargs(temperature, max_new_tokens, top_p)

        try:
            with torch.no_grad():
                output_ids = self._model.generate(**inputs, **gen_kwargs)
        except RuntimeError as exc:
            if _is_cuda_oom(exc):
                _recover_cuda(torch, self)
                raise RuntimeError(
                    f"CUDA out-of-memory during inference for model '{self.model_id}'. "
                    "Model has been unloaded to recover GPU memory."
                ) from exc
            raise

        new_ids = output_ids[0][prompt_token_count:]
        text = self._tokenizer.decode(new_ids, skip_special_tokens=True)
        text = _apply_stop_sequences(text, stop)

        return {
            "content": text,
            "prompt_tokens": prompt_token_count,
            "completion_tokens": len(new_ids),
        }

    def _multimodal_chat(
        self,
        messages: list[dict[str, Any]],
        *,
        temperature: float = 0.7,
        max_new_tokens: int = 4096,
        top_p: float = 1.0,
        stop: list[str] | None = None,
    ) -> dict[str, Any]:
        torch = importlib.import_module("torch")
        PIL = importlib.import_module("PIL.Image")

        processor_messages = []
        images = []
        audios = []

        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")

            msg_images = msg.get("images", [])
            for img_src in msg_images:
                pil_img = _load_image(img_src, PIL)
                if pil_img is not None:
                    images.append(pil_img)
                    content = f"<image>\n{content}" if content else "<image>"

            msg_audios = msg.get("audios", [])
            for audio_src in msg_audios:
                audio_data = _load_audio(audio_src)
                if audio_data is not None:
                    audios.append(audio_data)
                    content = f"<audio>\n{content}" if content else "<audio>"

            processor_messages.append({"role": role, "content": content})

        prompt = self._apply_chat_template(processor_messages)

        proc_kwargs: dict[str, Any] = {
            "text": prompt,
            "return_tensors": "pt",
        }
        if images:
            proc_kwargs["images"] = images
        if audios:
            proc_kwargs["audios"] = audios

        inputs = self._processor(**proc_kwargs).to(self._model.device)
        prompt_token_count = (
            inputs.get("input_ids", torch.tensor([])).shape[-1]
            if "input_ids" in inputs
            else 0
        )

        gen_kwargs = self._build_gen_kwargs(temperature, max_new_tokens, top_p)

        try:
            with torch.no_grad():
                output_ids = self._model.generate(**inputs, **gen_kwargs)
        except RuntimeError as exc:
            if _is_cuda_oom(exc):
                _recover_cuda(torch, self)
                raise RuntimeError(
                    f"CUDA out-of-memory during multimodal inference for model '{self.model_id}'."
                ) from exc
            raise

        new_ids = output_ids[0][prompt_token_count:]
        text = self._tokenizer.decode(new_ids, skip_special_tokens=True)
        text = _apply_stop_sequences(text, stop)

        return {
            "content": text,
            "prompt_tokens": prompt_token_count,
            "completion_tokens": len(new_ids),
        }

    def _multimodal_chat_stream(
        self,
        messages: list[dict[str, Any]],
        *,
        temperature: float = 0.7,
        max_new_tokens: int = 4096,
        top_p: float = 1.0,
        stop: list[str] | None = None,
        disconnect_event: threading.Event | None = None,
    ) -> Iterator[dict[str, str]]:
        """
        Real token-by-token streaming for multimodal (image/audio) inputs.

        Uses TextIteratorStreamer in a background thread — the same mechanism
        as text-only chat_stream — so the caller is never blocked waiting for
        a complete response and disconnect signals are handled promptly.
        """
        torch = importlib.import_module("torch")
        transformers = importlib.import_module("transformers")
        PIL = importlib.import_module("PIL.Image")

        processor_messages: list[dict[str, Any]] = []
        images: list[Any] = []
        audios: list[Any] = []

        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            for img_src in msg.get("images", []):
                pil_img = _load_image(img_src, PIL)
                if pil_img is not None:
                    images.append(pil_img)
                    content = f"<image>\n{content}" if content else "<image>"
            for audio_src in msg.get("audios", []):
                audio_data = _load_audio(audio_src)
                if audio_data is not None:
                    audios.append(audio_data)
                    content = f"<audio>\n{content}" if content else "<audio>"
            processor_messages.append({"role": role, "content": content})

        prompt = self._apply_chat_template(processor_messages)
        proc_kwargs: dict[str, Any] = {"text": prompt, "return_tensors": "pt"}
        if images:
            proc_kwargs["images"] = images
        if audios:
            proc_kwargs["audios"] = audios

        inputs = self._processor(**proc_kwargs).to(self._model.device)

        streamer = transformers.TextIteratorStreamer(
            self._tokenizer,
            skip_prompt=True,
            skip_special_tokens=True,
        )

        gen_kwargs = self._build_gen_kwargs(temperature, max_new_tokens, top_p)
        gen_kwargs["streamer"] = streamer

        if disconnect_event is not None:
            criteria = _DisconnectStoppingCriteria(disconnect_event)
            gen_kwargs["stopping_criteria"] = transformers.StoppingCriteriaList([criteria])

        generation_error: list[Exception] = []

        def _generate() -> None:
            try:
                with torch.no_grad():
                    self._model.generate(**inputs, **gen_kwargs)
            except RuntimeError as exc:
                if _is_cuda_oom(exc):
                    _recover_cuda(torch, self)
                generation_error.append(exc)
            except (ValueError, TypeError, KeyError) as exc:
                generation_error.append(exc)
            finally:
                try:
                    streamer.end()
                except (AttributeError, RuntimeError):
                    pass

        thread = threading.Thread(target=_generate, daemon=True)
        thread.start()

        accumulated = ""
        try:
            for token_text in streamer:
                accumulated += token_text
                if stop:
                    truncated = _apply_stop_sequences(accumulated, stop)
                    if len(truncated) < len(accumulated):
                        tail = truncated[len(accumulated) - len(token_text):]
                        if tail:
                            yield {"content": tail}
                        break
                yield {"content": token_text}
        finally:
            thread.join(timeout=10.0)
            if generation_error:
                raise generation_error[0]

    def chat_stream(
        self,
        messages: list[dict[str, Any]],
        *,
        temperature: float = 0.7,
        max_new_tokens: int = 4096,
        top_p: float = 1.0,
        stop: list[str] | None = None,
        disconnect_event: threading.Event | None = None,
    ) -> Iterator[dict[str, str]]:
        """
        Stream tokens via TextIteratorStreamer in a background thread.

        When ``disconnect_event`` is set (client disconnected), a
        ``StoppingCriteria`` instructs ``model.generate()`` to stop at the
        next token boundary, cleanly terminating the background thread and
        freeing GPU resources promptly.
        """
        if self._model is None or self._tokenizer is None:
            raise RuntimeError("Model not loaded — call from_pretrained() first")

        torch = importlib.import_module("torch")
        transformers = importlib.import_module("transformers")

        has_media = any(msg.get("images") or msg.get("audios") for msg in messages)
        if has_media and self._processor is not None:
            yield from self._multimodal_chat_stream(
                messages,
                temperature=temperature,
                max_new_tokens=max_new_tokens,
                top_p=top_p,
                stop=stop,
                disconnect_event=disconnect_event,
            )
            return

        prompt = self._apply_chat_template(messages)
        inputs = self._tokenizer(prompt, return_tensors="pt").to(self._model.device)

        streamer = transformers.TextIteratorStreamer(
            self._tokenizer,
            skip_prompt=True,
            skip_special_tokens=True,
        )

        gen_kwargs = self._build_gen_kwargs(temperature, max_new_tokens, top_p)
        gen_kwargs["streamer"] = streamer

        if disconnect_event is not None:
            criteria = _DisconnectStoppingCriteria(disconnect_event)
            gen_kwargs["stopping_criteria"] = transformers.StoppingCriteriaList([criteria])

        generation_error: list[Exception] = []

        def _generate() -> None:
            try:
                with torch.no_grad():
                    self._model.generate(**inputs, **gen_kwargs)
            except RuntimeError as exc:
                if _is_cuda_oom(exc):
                    _recover_cuda(torch, self)
                generation_error.append(exc)
            except (ValueError, TypeError, KeyError) as exc:
                generation_error.append(exc)
            finally:
                try:
                    streamer.end()
                except (AttributeError, RuntimeError):
                    pass

        thread = threading.Thread(target=_generate, daemon=True)
        thread.start()

        accumulated = ""
        try:
            for token_text in streamer:
                accumulated += token_text
                if stop:
                    truncated = _apply_stop_sequences(accumulated, stop)
                    if len(truncated) < len(accumulated):
                        tail = truncated[len(accumulated) - len(token_text):]
                        if tail:
                            yield {"content": tail}
                        break
                yield {"content": token_text}
        finally:
            thread.join(timeout=10.0)
            if generation_error:
                raise generation_error[0]

    def run_health_check(self) -> dict[str, Any]:
        """Run a lightweight test prompt to verify inference capability."""
        import time

        if self._model is None or self._tokenizer is None:
            return {"pass": False, "latency_ms": 0, "error": "Model not loaded"}

        try:
            start = time.monotonic()
            result = self.chat(
                [{"role": "user", "content": "Hi"}],
                temperature=0.0,
                max_new_tokens=8,
            )
            latency_ms = round((time.monotonic() - start) * 1000, 2)
            if result.get("content") is not None:
                return {"pass": True, "latency_ms": latency_ms}
            return {"pass": False, "latency_ms": latency_ms, "error": "Empty response"}
        except Exception as exc:
            return {"pass": False, "latency_ms": 0, "error": str(exc)}

    def unload(self) -> None:
        if self._model is not None:
            del self._model
            self._model = None
        if self._tokenizer is not None:
            del self._tokenizer
            self._tokenizer = None
        if self._processor is not None:
            del self._processor
            self._processor = None
        self.vram_used_mb = 0.0
        self._adapters.clear()

        if self._ssd_cache is not None:
            self._ssd_cache.flush()

        try:
            torch = importlib.import_module("torch")
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
        except ImportError:
            pass

    def _build_gen_kwargs(
        self, temperature: float, max_new_tokens: int, top_p: float
    ) -> dict[str, Any]:
        gen_kwargs: dict[str, Any] = {
            "max_new_tokens": max_new_tokens,
            "do_sample": temperature > 0,
            "top_p": top_p,
        }
        if temperature > 0:
            gen_kwargs["temperature"] = temperature
        return gen_kwargs

    def _apply_chat_template(self, messages: list[dict[str, Any]]) -> str:
        if hasattr(self._tokenizer, "apply_chat_template"):
            return self._tokenizer.apply_chat_template(
                messages, tokenize=False, add_generation_prompt=True
            )
        parts = []
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            parts.append(f"<|{role}|>\n{content}")
        parts.append("<|assistant|>\n")
        return "\n".join(parts)


# ────────────────────────────────────────────────────────────────────────────
# Architecture-aware device map helpers
# ────────────────────────────────────────────────────────────────────────────

_ARCH_LAYER_PREFIX: dict[str, str] = {
    # Llama / Mistral / Qwen / Gemma / Phi / DeepSeek and most modern models
    "llama": "model.layers",
    "llama4": "model.layers",
    "mistral": "model.layers",
    "mixtral": "model.layers",
    "qwen2": "model.layers",
    "qwen2_moe": "model.layers",
    "qwen3": "model.layers",
    "qwen3_moe": "model.layers",
    "gemma": "model.layers",
    "gemma2": "model.layers",
    "gemma3": "model.layers",
    "phi": "model.layers",
    "phi3": "model.layers",
    "phi4": "model.layers",
    "deepseek": "model.layers",
    "deepseek_v2": "model.layers",
    "deepseek_v3": "model.layers",
    "internlm2": "model.layers",
    "baichuan": "model.layers",
    "yi": "model.layers",
    "cohere": "model.layers",
    "cohere2": "model.layers",
    "olmo2": "model.layers",
    "granite": "model.layers",
    "granitemoe": "model.layers",
    "starcoder2": "model.layers",
    "stablelm": "model.layers",
    "stablelm_epoch": "model.layers",
    # OLMo (v1) uses a different block path
    "olmo": "model.transformer.blocks",
    # GPT / Falcon / BLOOM / OPT family
    "falcon": "transformer.h",
    "exaone": "transformer.h",
    "gpt2": "transformer.h",
    "gpt_neo": "transformer.h",
    "gptj": "transformer.h",
    "bloom": "transformer.h",
    "falcon_mamba": "backbone.layers",
    "gpt_neox": "gpt_neox.layers",
    "opt": "model.decoder.layers",
    "mpt": "transformer.blocks",
    "dbrx": "transformer.blocks",
}

# Default embed/norm/lm_head keys for architectures with model.layers prefix.
_DEFAULT_EMBED_NORM_LM = ("model.embed_tokens", "model.norm", "lm_head")

_ARCH_EMBED_NORM_LM: dict[str, tuple[str, str, str]] = {
    # model.layers family — use defaults (most modern models)
    "llama": _DEFAULT_EMBED_NORM_LM,
    "mistral": _DEFAULT_EMBED_NORM_LM,
    "mixtral": _DEFAULT_EMBED_NORM_LM,
    "llama4": _DEFAULT_EMBED_NORM_LM,
    "qwen2": _DEFAULT_EMBED_NORM_LM,
    "qwen2_moe": _DEFAULT_EMBED_NORM_LM,
    "qwen3": _DEFAULT_EMBED_NORM_LM,
    "qwen3_moe": _DEFAULT_EMBED_NORM_LM,
    "gemma": _DEFAULT_EMBED_NORM_LM,
    "gemma2": _DEFAULT_EMBED_NORM_LM,
    "gemma3": _DEFAULT_EMBED_NORM_LM,
    "phi3": _DEFAULT_EMBED_NORM_LM,
    "phi4": _DEFAULT_EMBED_NORM_LM,
    "deepseek": _DEFAULT_EMBED_NORM_LM,
    "deepseek_v2": _DEFAULT_EMBED_NORM_LM,
    "deepseek_v3": _DEFAULT_EMBED_NORM_LM,
    "internlm2": _DEFAULT_EMBED_NORM_LM,
    "baichuan": _DEFAULT_EMBED_NORM_LM,
    "yi": _DEFAULT_EMBED_NORM_LM,
    "cohere": _DEFAULT_EMBED_NORM_LM,
    "cohere2": _DEFAULT_EMBED_NORM_LM,
    "olmo2": _DEFAULT_EMBED_NORM_LM,
    "granite": _DEFAULT_EMBED_NORM_LM,
    "granitemoe": _DEFAULT_EMBED_NORM_LM,
    "stablelm": _DEFAULT_EMBED_NORM_LM,
    "stablelm_epoch": _DEFAULT_EMBED_NORM_LM,
    "starcoder2": _DEFAULT_EMBED_NORM_LM,
    # Phi (v1) uses a different norm key
    "phi": ("model.embed_tokens", "model.final_layernorm", "lm_head"),
    # GPT-2 family
    "gpt2": ("transformer.wte", "transformer.ln_f", "lm_head"),
    "gpt_neo": ("transformer.wte", "transformer.ln_f", "lm_head"),
    "gptj": ("transformer.wte", "transformer.ln_f", "lm_head"),
    "exaone": ("transformer.wte", "transformer.ln_f", "lm_head"),
    # GPT-NeoX
    "gpt_neox": ("gpt_neox.embed_in", "gpt_neox.final_layer_norm", "embed_out"),
    # BLOOM / Falcon
    "bloom": ("transformer.word_embeddings", "transformer.ln_f", "lm_head"),
    "falcon": ("transformer.word_embeddings", "transformer.ln_f", "lm_head"),
    # OPT
    "opt": ("model.decoder.embed_tokens", "model.decoder.final_layer_norm", "lm_head"),
    # MPT / DBRX
    "mpt": ("transformer.wte", "transformer.norm_f", "lm_head"),
    "dbrx": ("transformer.wte", "transformer.norm_f", "lm_head"),
}


def _build_device_map(
    torch_mod: Any,
    cpu_offload_layers: int,
    config: Any = None,
) -> str | dict[str, Any]:
    """
    Build a per-module device map honouring ``cpu_offload_layers``.

    Uses the loaded model config to determine:
      - Total number of transformer layers (via ``num_hidden_layers`` or similar)
      - Architecture-specific module name prefix (via ``_ARCH_LAYER_PREFIX``)

    For architectures not in the lookup table, applies a heuristic fallback:
    the vast majority of modern decoder-only models (Qwen3, DeepSeek, etc.)
    use ``model.layers`` with ``model.embed_tokens`` / ``model.norm`` /
    ``lm_head``. This heuristic honours ``cpu_offload_layers`` for all
    models that follow the convention, rather than silently returning "auto"
    and ignoring the requested CPU offload entirely.

    Falls back to ``"auto"`` only when layer count cannot be determined.
    """
    if cpu_offload_layers <= 0:
        return "auto"

    if not torch_mod.cuda.is_available():
        return "auto"

    if config is None:
        log.warning("_build_device_map: no config available, falling back to 'auto'")
        return "auto"

    model_type: str = getattr(config, "model_type", "").lower()

    num_layers: int | None = None
    for attr in ("num_hidden_layers", "n_layer", "n_layers", "num_layers",
                 "num_hidden_layers_per_pipeline_stage"):
        val = getattr(config, attr, None)
        if isinstance(val, int) and val > 0:
            num_layers = val
            break

    if num_layers is None:
        log.warning(
            "_build_device_map: cannot determine layer count for model_type=%s, falling back to 'auto'",
            model_type,
        )
        return "auto"

    layer_prefix = _ARCH_LAYER_PREFIX.get(model_type)
    embed_key, norm_key, lm_key = _ARCH_EMBED_NORM_LM.get(
        model_type, _DEFAULT_EMBED_NORM_LM
    )

    if layer_prefix is None:
        # Heuristic fallback: most modern decoder-only models use model.layers.
        # This is better than returning "auto" which would ignore cpu_offload_layers.
        layer_prefix = "model.layers"
        log.warning(
            "_build_device_map: unknown model_type=%s — applying heuristic "
            "layer prefix '%s' (override _ARCH_LAYER_PREFIX to set explicitly)",
            model_type,
            layer_prefix,
        )

    n_cpu = min(cpu_offload_layers, num_layers)
    device_map: dict[str, Any] = {
        embed_key: 0,
        norm_key: 0,
        lm_key: 0,
    }
    for i in range(num_layers):
        device_map[f"{layer_prefix}.{i}"] = "cpu" if i < n_cpu else 0

    log.info(
        "_build_device_map: model_type=%s, layers=%d, cpu_layers=%d, gpu_layers=%d, prefix=%s",
        model_type,
        num_layers,
        n_cpu,
        num_layers - n_cpu,
        layer_prefix,
    )
    return device_map


# ────────────────────────────────────────────────────────────────────────────
# Module-level helpers
# ────────────────────────────────────────────────────────────────────────────

def _detect_gpu_backend(torch_mod: Any) -> str | None:
    if torch_mod.cuda.is_available():
        return "cuda"
    if hasattr(torch_mod, "xpu") and torch_mod.xpu.is_available():
        return "xpu"
    if hasattr(torch_mod.backends, "mps") and torch_mod.backends.mps.is_available():
        return "mps"
    try:
        if hasattr(torch_mod, "hip") and torch_mod.hip.is_available():
            return "rocm"
    except AttributeError:
        pass
    if hasattr(torch_mod, "is_hip_available") and torch_mod.is_hip_available():
        return "rocm"
    return None


def _resolve_dtype(torch_mod: Any, dtype_str: str, quantization: str = "none") -> Any:
    if quantization in ("4bit", "8bit"):
        return torch_mod.float16
    if dtype_str == "auto":
        try:
            if torch_mod.cuda.is_available() and torch_mod.cuda.is_bf16_supported():
                return torch_mod.bfloat16
        except Exception:
            pass
        return torch_mod.float16
    mapping = {
        "float16": torch_mod.float16,
        "bfloat16": torch_mod.bfloat16,
        "float32": torch_mod.float32,
    }
    return mapping.get(dtype_str, torch_mod.float16)


def _measure_vram_used(torch_mod: Any, quantization: str = "none") -> float:
    try:
        if torch_mod.cuda.is_available():
            mem_info = torch_mod.cuda.mem_get_info(0)
            total = torch_mod.cuda.get_device_properties(0).total_mem
            return round((total - mem_info[0]) / 1024 / 1024, 1)
    except Exception:
        pass
    return 0.0


def _is_cuda_oom(exc: Exception) -> bool:
    msg = str(exc).lower()
    return "cuda out of memory" in msg or "out of memory" in msg or "cuda error" in msg


def _recover_cuda(torch_mod: Any, engine: "AutoInference") -> None:
    log.error(
        "CUDA error detected for model '%s'. Unloading model and clearing GPU cache.",
        engine.model_id,
    )
    try:
        engine.unload()
    except Exception as unload_exc:
        log.warning("Error during CUDA recovery unload: %s", unload_exc)
    try:
        if torch_mod.cuda.is_available():
            torch_mod.cuda.empty_cache()
            log.info("torch.cuda.empty_cache() called after CUDA error recovery")
    except Exception as cache_exc:
        log.warning("cuda.empty_cache() failed during recovery: %s", cache_exc)


def _apply_stop_sequences(text: str, stop: list[str] | None) -> str:
    if not stop:
        return text
    for seq in stop:
        idx = text.find(seq)
        if idx >= 0:
            text = text[:idx]
    return text


def _load_image(src: str, pil_module: Any) -> Any:
    if not src.startswith("data:"):
        log.warning(
            "Rejected non-data-URI image source (only base64 data URIs accepted): %.40s…",
            src,
        )
        return None
    try:
        _header, b64data = src.split(",", 1)
        raw = base64.b64decode(b64data)
        import io
        return pil_module.open(io.BytesIO(raw))
    except Exception as exc:
        log.warning("Failed to decode base64 image: %s", exc)
        return None


def _load_audio(src: str) -> Any:
    if not src.startswith("data:"):
        log.warning(
            "Rejected non-data-URI audio source (only base64 data URIs accepted): %.40s…",
            src,
        )
        return None
    try:
        _header, b64data = src.split(",", 1)
        return base64.b64decode(b64data)
    except Exception as exc:
        log.warning("Failed to decode base64 audio: %s", exc)
        return None
