"""
AutoInference — unified entry-point for oLLM model loading and inference.

This checked-in adapter delegates model loading and generation to Transformers.
FlashAttention may be selected when installed, and compatible processors may
handle image/audio inputs. SSD KV-cache offload and explicit CPU-layer offload
are not implemented by this source and are rejected rather than silently
ignored.

On a GPU host with a supported backend and Transformers, ``from_pretrained``
loads the model with the standard automatic device map. On CPU-only hosts, it
raises ``RuntimeError`` so SubstrateRuntime falls back to STUB mode.
"""
from __future__ import annotations

import base64
import importlib
import logging
from typing import Any, Iterator

log = logging.getLogger("ollm.auto_inference")


def _safe_log(value: Any) -> str:
    """Strip CR/LF so attacker-influenced values cannot forge log lines (CWE-117)."""
    return str(value).replace("\r", " ").replace("\n", " ")


class AutoInference:
    """Checked-in Transformers inference adapter."""

    def __init__(
        self,
        model_id: str,
        model: Any = None,
        tokenizer: Any = None,
        processor: Any = None,
        vram_used_mb: float = 0.0,
        use_flash_attn: bool = False,
    ):
        self.model_id = model_id
        self._model = model
        self._tokenizer = tokenizer
        self._processor = processor
        self.vram_used_mb = vram_used_mb
        self._use_flash_attn = use_flash_attn

    @classmethod
    def from_pretrained(
        cls,
        model_name_or_path: str,
        *,
        cache_dir: str | None = None,
        ssd_cache_dir: str | None = None,
        cpu_offload_layers: int = 0,
        torch_dtype: str = "auto",
        trust_remote_code: bool = False,
        revision: str | None = None,
    ) -> "AutoInference":
        try:
            torch = importlib.import_module("torch")
        except ImportError as exc:
            raise RuntimeError(
                "The checked-in adapter requires PyTorch. "
                "Install with: pip install torch"
            ) from exc

        gpu_backend = _detect_gpu_backend(torch)
        if gpu_backend is None:
            raise RuntimeError(
                "The checked-in adapter requires a GPU (CUDA, ROCm, or Apple MPS). "
                "No GPU backend was detected. "
                "For CPU-only development, the SubstrateRuntime will use STUB mode."
            )

        if ssd_cache_dir is not None:
            raise RuntimeError(
                "SSD KV-cache offload is not implemented by the checked-in adapter"
            )
        if cpu_offload_layers > 0:
            raise RuntimeError(
                "Explicit CPU-layer offload is not implemented by the checked-in adapter"
            )

        try:
            transformers = importlib.import_module("transformers")
        except ImportError as exc:
            raise RuntimeError(
                "The checked-in adapter requires the Transformers library. "
                "Install with: pip install transformers"
            ) from exc

        dtype = _resolve_dtype(torch, torch_dtype)

        use_flash_attn = False
        attn_impl = "sdpa"
        try:
            importlib.import_module("flash_attn")
            attn_impl = "flash_attention_2"
            use_flash_attn = True
            log.info("FlashAttention-2 available, using flash_attention_2 backend")
        except ImportError:
            log.info("FlashAttention-2 not available, falling back to SDPA")

        model_kwargs: dict[str, Any] = {
            "cache_dir": cache_dir,
            "torch_dtype": dtype,
            "device_map": "auto",
            "trust_remote_code": trust_remote_code,
            "attn_implementation": attn_impl,
        }
        if revision is not None:
            model_kwargs["revision"] = revision

        processor = None
        try:
            processor = transformers.AutoProcessor.from_pretrained(
                model_name_or_path,
                cache_dir=cache_dir,
                trust_remote_code=trust_remote_code,
                revision=revision,
            )
            log.info("Loaded multimodal processor for %s", _safe_log(model_name_or_path))
        except Exception:
            pass

        tokenizer = transformers.AutoTokenizer.from_pretrained(
            model_name_or_path,
            cache_dir=cache_dir,
            trust_remote_code=trust_remote_code,
            revision=revision,
        )

        model = transformers.AutoModelForCausalLM.from_pretrained(
            model_name_or_path,
            **model_kwargs,
        )

        vram_used = 0.0
        if gpu_backend == "cuda":
            mem_info = torch.cuda.mem_get_info(0)
            total = torch.cuda.get_device_properties(0).total_mem
            vram_used = round((total - mem_info[0]) / 1024 / 1024, 1)

        log.info(
            "Model loaded: %s, VRAM: %.1f MB, flash_attn: %s",
            _safe_log(model_name_or_path),
            vram_used,
            use_flash_attn,
        )

        return cls(
            model_id=model_name_or_path,
            model=model,
            tokenizer=tokenizer,
            processor=processor,
            vram_used_mb=vram_used,
            use_flash_attn=use_flash_attn,
        )

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

        with torch.no_grad():
            output_ids = self._model.generate(**inputs, **gen_kwargs)

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
        prompt_token_count = inputs.get("input_ids", torch.tensor([])).shape[-1] if "input_ids" in inputs else 0

        gen_kwargs = self._build_gen_kwargs(temperature, max_new_tokens, top_p)

        with torch.no_grad():
            output_ids = self._model.generate(**inputs, **gen_kwargs)

        new_ids = output_ids[0][prompt_token_count:]
        text = self._tokenizer.decode(new_ids, skip_special_tokens=True)
        text = _apply_stop_sequences(text, stop)

        return {
            "content": text,
            "prompt_tokens": prompt_token_count,
            "completion_tokens": len(new_ids),
        }

    def chat_stream(
        self,
        messages: list[dict[str, Any]],
        *,
        temperature: float = 0.7,
        max_new_tokens: int = 4096,
        top_p: float = 1.0,
        stop: list[str] | None = None,
    ) -> Iterator[dict[str, str]]:
        result = self.chat(
            messages,
            temperature=temperature,
            max_new_tokens=max_new_tokens,
            top_p=top_p,
            stop=stop,
        )
        content = result.get("content", "")
        tokens = content.split(" ")
        for i, token in enumerate(tokens):
            yield {"content": token + (" " if i < len(tokens) - 1 else "")}

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


def _resolve_dtype(torch_mod: Any, dtype_str: str) -> Any:
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
