"""Governed Ovis-Omni multimodal embedding evaluation runtime.

This module deliberately does not import Torch or Transformers at import time.
The 3B checkpoint is loaded only after the feature flag, promotion gate, exact
revision, and artifact checks pass. Media inputs are immutable CAS references;
HTTP(S), file, data, and arbitrary filesystem paths are never accepted.
"""

from __future__ import annotations

import hashlib
import hmac
import json
import math
import os
import re
import threading
from pathlib import Path
from typing import Annotated, Any, Literal, Protocol, Union

import anyio
import structlog
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

log = structlog.get_logger(__name__)
ovis_router = APIRouter(prefix="/ovis", tags=["AEF Ovis multimodal evaluation"])

MODEL_ID = "ATH-MaaS/Ovis-Omni-Embedding-3B"
MODEL_REVISION = "08547b8479edc10edc9878597438ebd076f74dff"
ARTIFACT_SET_DIGEST = "4ea7bf104aaf758eb648ea5f954b0aa19575f4e28d286f59103dfe223f4b4926"
NATIVE_DIMENSIONS = 2048
RUNTIME_ID = "substrate-py-workers/ovis-omni"
RUNTIME_VERSION = "1.0.0"
SUPPORTED_MODALITIES = [
    "text",
    "image",
    "visual_document",
    "audio",
    "video",
    "interleaved",
]
CAS_URI_RE = re.compile(r"^cas://sha256/([a-f0-9]{64})$", re.IGNORECASE)
SHA256_RE = re.compile(r"^[a-f0-9]{64}$", re.IGNORECASE)

# LFS identities read from the exact immutable Hub revision on 2026-09-24.
EXPECTED_ARTIFACTS: dict[str, tuple[str, int]] = {
    "model/model-00001-of-00003.safetensors": (
        "3859069435a04d363906c0ad05a5fcf480917225de6686f3a37489a27241d9ad",
        4_985_032_488,
    ),
    "model/model-00002-of-00003.safetensors": (
        "2ab4c3c8ab840be3614be89ac5521e6f6df48dce62a03adfac31cc83f0209ce4",
        4_999_949_856,
    ),
    "model/model-00003-of-00003.safetensors": (
        "6eebd641ef74ae7f865f8ca817ccbf3c6fe20a1b9107f8085f2ec79b2b519556",
        1_089_579_000,
    ),
    "model/tokenizer.json": (
        "1ab7a851e5c63d5fafbfdac72e3b4a8d08613f6bbb06ee39036fdf870ef59c93",
        11_421_866,
    ),
}


def _to_camel(value: str) -> str:
    head, *tail = value.split("_")
    return head + "".join(part.capitalize() for part in tail)


class ApiModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=_to_camel,
        populate_by_name=True,
        extra="forbid",
    )


class OvisAsset(ApiModel):
    asset_id: str = Field(min_length=1)
    uri: str
    sha256: str
    media_type: str = Field(min_length=1)
    byte_length: int = Field(ge=0)
    modality: Literal["image", "visual_document", "audio", "video"]

    @field_validator("sha256")
    @classmethod
    def validate_sha256(cls, value: str) -> str:
        if not SHA256_RE.fullmatch(value):
            raise ValueError("sha256 must contain 64 hexadecimal characters")
        return value.lower()

    @model_validator(mode="after")
    def validate_cas_identity(self) -> "OvisAsset":
        match = CAS_URI_RE.fullmatch(self.uri)
        if not match or match.group(1).lower() != self.sha256:
            raise ValueError("uri must be cas://sha256/<sha256> and match sha256")
        return self


class TextSegment(ApiModel):
    kind: Literal["text"]
    text: str = Field(min_length=1)


class AssetSegment(ApiModel):
    kind: Literal["asset"]
    asset: OvisAsset


Segment = Annotated[Union[TextSegment, AssetSegment], Field(discriminator="kind")]


class OvisItem(ApiModel):
    item_id: str = Field(min_length=1)
    instruction: str = Field(min_length=1, max_length=4096)
    segments: list[Segment] = Field(min_length=1, max_length=32)


class OvisEmbedRequest(ApiModel):
    request_id: str = Field(min_length=1)
    tenant_id: str = Field(min_length=1)
    profile_id: str | None = None
    model_id: str = Field(min_length=1)
    model_revision: str = Field(min_length=1)
    dimensions: Literal[2048, 1024, 512, 256, 128] = NATIVE_DIMENSIONS
    normalize: Literal[True] = True
    items: list[OvisItem] = Field(min_length=1, max_length=32)
    metadata: dict[str, Any] = Field(default_factory=dict)


class OvisVector(ApiModel):
    item_id: str
    vector: list[float]
    input_digest: str
    modalities: list[str]
    token_count: int | None = None


class ExecutionReceipt(ApiModel):
    backend_id: str
    model_id: str
    model_revision: str
    artifact_set_digest: str
    processor_revision: str
    runtime_id: str
    runtime_version: str
    dimensions: int
    normalized: bool
    promotion_state: Literal["DEVELOPMENT", "EVALUATION_HOLD", "QUALIFIED", "REVOKED"]
    supported_modalities: list[str]


class OvisEmbedResponse(ApiModel):
    request_id: str
    tenant_id: str
    model_id: str
    model_revision: str
    dimensions: int
    vectors: list[OvisVector]
    execution: ExecutionReceipt


class RuntimeProtocol(Protocol):
    def embed_items(self, items: list[OvisItem]) -> list[OvisVector]: ...


class OvisRuntimeError(RuntimeError):
    def __init__(self, code: str, safe_message: str, status_code: int = 503) -> None:
        super().__init__(safe_message)
        self.code = code
        self.safe_message = safe_message
        self.status_code = status_code


def _is_production() -> bool:
    return (os.getenv("NODE_ENV") or os.getenv("SZL_ENV") or "").lower() == "production"


def _promotion_state() -> str:
    state = os.getenv("OVIS_PROMOTION_STATE", "EVALUATION_HOLD").upper()
    if state not in {"DEVELOPMENT", "EVALUATION_HOLD", "QUALIFIED", "REVOKED"}:
        raise OvisRuntimeError("INVALID_PROMOTION_STATE", "Ovis promotion state is invalid")
    return state


def _assert_runtime_gate() -> None:
    if os.getenv("OVIS_OMNI_ENABLED", "0") != "1":
        raise OvisRuntimeError("OVIS_RUNTIME_DISABLED", "Ovis multimodal runtime is disabled")

    state = _promotion_state()
    if state == "REVOKED":
        raise OvisRuntimeError("OVIS_MODEL_REVOKED", "Ovis multimodal model is revoked")

    if _is_production():
        receipt = os.getenv("OVIS_QUALIFICATION_RECEIPT_SHA256", "")
        if state != "QUALIFIED" or not SHA256_RE.fullmatch(receipt):
            raise OvisRuntimeError(
                "OVIS_NOT_QUALIFIED",
                "Ovis multimodal model is not qualified for production",
            )
        if os.getenv("OVIS_VERIFY_ARTIFACTS", "1") != "1":
            raise OvisRuntimeError(
                "ARTIFACT_VERIFICATION_REQUIRED",
                "Production Ovis runtime requires artifact verification",
            )


def _require_internal_auth(request: Request) -> None:
    expected = os.getenv("OVIS_INTERNAL_API_KEY", "")
    if _is_production() and not expected:
        raise HTTPException(status_code=503, detail="OVIS_INTERNAL_API_KEY is required")
    if not expected:
        return
    authorization = request.headers.get("authorization", "")
    supplied = authorization.removeprefix("Bearer ") if authorization.startswith("Bearer ") else ""
    if not supplied or not hmac.compare_digest(supplied, expected):
        raise HTTPException(status_code=401, detail="Unauthorized")


def _hash_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(8 * 1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _verify_snapshot(snapshot_root: Path) -> None:
    for relative_path, (expected_digest, expected_size) in EXPECTED_ARTIFACTS.items():
        path = snapshot_root / relative_path
        if not path.is_file() or path.is_symlink():
            raise OvisRuntimeError(
                "MODEL_ARTIFACT_MISSING",
                f"Required model artifact is missing: {relative_path}",
            )
        stat = path.stat()
        if stat.st_size != expected_size:
            raise OvisRuntimeError(
                "MODEL_ARTIFACT_SIZE_MISMATCH",
                f"Model artifact size mismatch: {relative_path}",
            )
        if _hash_file(path) != expected_digest:
            raise OvisRuntimeError(
                "MODEL_ARTIFACT_DIGEST_MISMATCH",
                f"Model artifact digest mismatch: {relative_path}",
            )


def _resolve_asset(asset: OvisAsset) -> Path:
    match = CAS_URI_RE.fullmatch(asset.uri)
    if not match:
        raise OvisRuntimeError("INVALID_CAS_URI", "Asset URI is not an admitted CAS reference", 400)

    root_value = os.getenv("OVIS_ASSET_ROOT", "")
    if not root_value:
        raise OvisRuntimeError("CAS_ROOT_NOT_CONFIGURED", "OVIS_ASSET_ROOT is not configured")

    root = Path(root_value).expanduser().resolve(strict=True)
    candidate = root / "sha256" / match.group(1).lower()
    if candidate.is_symlink():
        raise OvisRuntimeError("CAS_SYMLINK_REJECTED", "CAS assets may not be symlinks", 400)

    resolved = candidate.resolve(strict=True)
    if root != resolved and root not in resolved.parents:
        raise OvisRuntimeError("CAS_PATH_ESCAPE", "CAS asset escaped the configured root", 400)
    if not resolved.is_file():
        raise OvisRuntimeError("CAS_ASSET_NOT_FILE", "CAS asset is not a regular file", 400)
    if resolved.stat().st_size != asset.byte_length:
        raise OvisRuntimeError("CAS_SIZE_MISMATCH", "CAS asset byte length does not match", 400)
    if _hash_file(resolved) != asset.sha256:
        raise OvisRuntimeError("CAS_DIGEST_MISMATCH", "CAS asset digest does not match", 400)

    if asset.modality in {"image", "visual_document"} and not asset.media_type.startswith("image/"):
        raise OvisRuntimeError(
            "VISUAL_DOCUMENT_REQUIRES_IMAGE",
            "Visual documents must be admitted as rendered image pages; raw PDFs are not accepted",
            400,
        )
    if asset.modality == "audio" and not asset.media_type.startswith("audio/"):
        raise OvisRuntimeError("AUDIO_MEDIA_TYPE_MISMATCH", "Audio asset media type is invalid", 400)
    if asset.modality == "video" and not asset.media_type.startswith("video/"):
        raise OvisRuntimeError("VIDEO_MEDIA_TYPE_MISMATCH", "Video asset media type is invalid", 400)
    return resolved


def _input_digest(item: OvisItem) -> str:
    canonical = json.dumps(
        item.model_dump(by_alias=True, exclude_none=True),
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
    ).encode("utf-8")
    return hashlib.sha256(canonical).hexdigest()


def _item_modalities(item: OvisItem) -> list[str]:
    seen = {"text"}
    for segment in item.segments:
        if isinstance(segment, AssetSegment):
            seen.add(segment.asset.modality)
    if len(item.segments) > 1 or len(seen) > 1:
        seen.add("interleaved")
    return [modality for modality in SUPPORTED_MODALITIES if modality in seen]


class OvisOmniRuntime:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._processor: Any | None = None
        self._model: Any | None = None
        self._torch: Any | None = None
        self._process_mm_info: Any | None = None
        self._snapshot_root: Path | None = None
        self._load_error_code: str | None = None

    @property
    def loaded(self) -> bool:
        return self._processor is not None and self._model is not None

    @property
    def load_error_code(self) -> str | None:
        return self._load_error_code

    def _load(self) -> None:
        if self.loaded:
            return
        with self._lock:
            if self.loaded:
                return
            _assert_runtime_gate()
            try:
                import torch
                from huggingface_hub import snapshot_download
                from qwen_omni_utils import process_mm_info
                from transformers import AutoProcessor, Qwen2_5OmniForConditionalGeneration

                snapshot_path = Path(
                    snapshot_download(
                        repo_id=MODEL_ID,
                        revision=MODEL_REVISION,
                        allow_patterns=["model/*"],
                        token=os.getenv("HF_TOKEN") or None,
                        local_files_only=os.getenv("OVIS_LOCAL_FILES_ONLY", "0") == "1",
                    )
                ).resolve(strict=True)
                if os.getenv("OVIS_VERIFY_ARTIFACTS", "1") == "1":
                    _verify_snapshot(snapshot_path)

                model_path = snapshot_path / "model"
                processor = AutoProcessor.from_pretrained(
                    model_path,
                    trust_remote_code=False,
                    local_files_only=True,
                )

                dtype_name = os.getenv("OVIS_TORCH_DTYPE", "bfloat16")
                dtype = getattr(torch, dtype_name, None)
                if dtype is None:
                    raise OvisRuntimeError("INVALID_TORCH_DTYPE", "Configured Ovis Torch dtype is invalid")

                load_kwargs: dict[str, Any] = {
                    "trust_remote_code": False,
                    "local_files_only": True,
                    "dtype": dtype,
                    "device_map": os.getenv("OVIS_DEVICE_MAP", "auto"),
                    "low_cpu_mem_usage": True,
                    "enable_audio_output": False,
                }
                attention_backend = os.getenv("OVIS_ATTN_IMPLEMENTATION", "")
                if attention_backend:
                    load_kwargs["attn_implementation"] = attention_backend

                model = Qwen2_5OmniForConditionalGeneration.from_pretrained(
                    model_path,
                    **load_kwargs,
                )
                model.eval()

                self._snapshot_root = snapshot_path
                self._processor = processor
                self._model = model
                self._torch = torch
                self._process_mm_info = process_mm_info
                self._load_error_code = None
                log.info(
                    "ovis_runtime_loaded",
                    model_id=MODEL_ID,
                    model_revision=MODEL_REVISION,
                    artifact_set_digest=ARTIFACT_SET_DIGEST,
                )
            except OvisRuntimeError as error:
                self._load_error_code = error.code
                raise
            except Exception as error:
                self._load_error_code = "OVIS_LOAD_FAILED"
                log.exception("ovis_runtime_load_failed", error_type=type(error).__name__)
                raise OvisRuntimeError("OVIS_LOAD_FAILED", "Ovis runtime failed to load") from error

    def _messages(self, item: OvisItem) -> list[dict[str, Any]]:
        content: list[dict[str, Any]] = [{"type": "text", "text": item.instruction}]
        for segment in item.segments:
            if isinstance(segment, TextSegment):
                content.append({"type": "text", "text": segment.text})
                continue
            path = _resolve_asset(segment.asset)
            uri = path.as_uri()
            if segment.asset.modality in {"image", "visual_document"}:
                content.append({"type": "image", "image": uri})
            elif segment.asset.modality == "audio":
                content.append({"type": "audio", "audio": uri})
            elif segment.asset.modality == "video":
                content.append({"type": "video", "video": uri})
        return [{"role": "user", "content": content}]

    def _embed_one(self, item: OvisItem) -> OvisVector:
        self._load()
        assert self._processor is not None
        assert self._model is not None
        assert self._torch is not None
        assert self._process_mm_info is not None

        messages = self._messages(item)
        prompt = self._processor.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=False,
        )
        mm_info = self._process_mm_info(messages, use_audio_in_video=False)
        if not isinstance(mm_info, tuple) or len(mm_info) != 3:
            raise OvisRuntimeError(
                "QWEN_PROCESSOR_CONTRACT_MISMATCH",
                "Qwen multimodal processor returned an unsupported contract",
            )
        audios, images, videos = mm_info
        inputs = self._processor(
            text=prompt,
            audio=audios,
            images=images,
            videos=videos,
            padding=True,
            return_tensors="pt",
            use_audio_in_video=False,
        )

        thinker = getattr(self._model, "thinker", self._model)
        try:
            device = next(thinker.parameters()).device
        except StopIteration as error:
            raise OvisRuntimeError("OVIS_DEVICE_UNAVAILABLE", "Ovis model has no parameters") from error

        moved_inputs = {
            key: value.to(device) if hasattr(value, "to") else value
            for key, value in dict(inputs).items()
        }
        with self._torch.inference_mode():
            outputs = thinker(
                **moved_inputs,
                output_hidden_states=True,
                return_dict=True,
            )

        hidden = getattr(outputs, "last_hidden_state", None)
        if hidden is None:
            hidden_states = getattr(outputs, "hidden_states", None)
            hidden = hidden_states[-1] if hidden_states else None
        if hidden is None or getattr(hidden, "ndim", 0) != 3:
            raise OvisRuntimeError(
                "OVIS_HIDDEN_STATE_UNAVAILABLE",
                "Ovis runtime did not return final hidden states",
            )

        attention_mask = moved_inputs.get("attention_mask")
        if attention_mask is None:
            last_index = hidden.shape[1] - 1
            token_count = int(hidden.shape[1])
        else:
            token_count = int(attention_mask[0].sum().item())
            last_index = max(0, token_count - 1)
            if last_index >= hidden.shape[1]:
                raise OvisRuntimeError(
                    "OVIS_SEQUENCE_SHAPE_MISMATCH",
                    "Ovis attention mask does not match hidden-state length",
                )

        vector_tensor = hidden[0, last_index, :].float()
        vector_tensor = self._torch.nn.functional.normalize(vector_tensor, p=2, dim=-1)
        vector = vector_tensor.detach().cpu().tolist()
        if len(vector) != NATIVE_DIMENSIONS or any(not math.isfinite(value) for value in vector):
            raise OvisRuntimeError("OVIS_VECTOR_INVALID", "Ovis produced an invalid embedding vector")

        return OvisVector(
            item_id=item.item_id,
            vector=vector,
            input_digest=_input_digest(item),
            modalities=_item_modalities(item),
            token_count=token_count,
        )

    def embed_items(self, items: list[OvisItem]) -> list[OvisVector]:
        return [self._embed_one(item) for item in items]


_runtime: RuntimeProtocol | None = None
_runtime_lock = threading.Lock()


def get_runtime() -> RuntimeProtocol:
    global _runtime
    if _runtime is None:
        with _runtime_lock:
            if _runtime is None:
                _runtime = OvisOmniRuntime()
    return _runtime


def _execution_receipt() -> ExecutionReceipt:
    return ExecutionReceipt(
        backend_id="ovis-omni-python",
        model_id=MODEL_ID,
        model_revision=MODEL_REVISION,
        artifact_set_digest=ARTIFACT_SET_DIGEST,
        processor_revision=MODEL_REVISION,
        runtime_id=RUNTIME_ID,
        runtime_version=RUNTIME_VERSION,
        dimensions=NATIVE_DIMENSIONS,
        normalized=True,
        promotion_state=_promotion_state(),
        supported_modalities=SUPPORTED_MODALITIES,
    )


@ovis_router.get("/health")
async def ovis_health(request: Request) -> dict[str, Any]:
    _require_internal_auth(request)
    runtime = get_runtime()
    gate_error: str | None = None
    try:
        _assert_runtime_gate()
    except OvisRuntimeError as error:
        gate_error = error.code

    loaded = isinstance(runtime, OvisOmniRuntime) and runtime.loaded
    load_error = runtime.load_error_code if isinstance(runtime, OvisOmniRuntime) else None
    healthy = gate_error is None and load_error is None
    if not healthy:
        raise HTTPException(
            status_code=503,
            detail={
                "status": "blocked",
                "gateCode": gate_error,
                "loadErrorCode": load_error,
                "modelId": MODEL_ID,
                "modelRevision": MODEL_REVISION,
                "promotionState": _promotion_state(),
            },
        )
    return {
        "status": "ready" if loaded else "cold",
        "loaded": loaded,
        "modelId": MODEL_ID,
        "modelRevision": MODEL_REVISION,
        "artifactSetDigest": ARTIFACT_SET_DIGEST,
        "promotionState": _promotion_state(),
        "artifactVerificationRequired": os.getenv("OVIS_VERIFY_ARTIFACTS", "1") == "1",
    }


@ovis_router.post("/embed", response_model=OvisEmbedResponse)
async def ovis_embed(request_body: OvisEmbedRequest, request: Request) -> OvisEmbedResponse:
    _require_internal_auth(request)
    _assert_runtime_gate()

    if request_body.model_id != MODEL_ID or request_body.model_revision != MODEL_REVISION:
        raise HTTPException(status_code=409, detail="MODEL_IDENTITY_NOT_ADMITTED")
    if request_body.dimensions != NATIVE_DIMENSIONS:
        raise HTTPException(status_code=409, detail="PROJECTION_ASSET_NOT_ADMITTED")

    try:
        vectors = await anyio.to_thread.run_sync(
            get_runtime().embed_items,
            request_body.items,
            abandon_on_cancel=True,
        )
    except OvisRuntimeError as error:
        log.warning("ovis_embed_rejected", code=error.code, request_id=request_body.request_id)
        raise HTTPException(status_code=error.status_code, detail=error.code) from error
    except Exception as error:
        log.exception(
            "ovis_embed_failed",
            request_id=request_body.request_id,
            error_type=type(error).__name__,
        )
        raise HTTPException(status_code=502, detail="OVIS_EMBED_FAILED") from error

    return OvisEmbedResponse(
        request_id=request_body.request_id,
        tenant_id=request_body.tenant_id,
        model_id=MODEL_ID,
        model_revision=MODEL_REVISION,
        dimensions=NATIVE_DIMENSIONS,
        vectors=vectors,
        execution=_execution_receipt(),
    )
