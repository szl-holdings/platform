"""
Python model router — source-of-truth for model selection in the substrate fleet.

This module mirrors and extends the TypeScript model-router.ts logic from
artifacts/api-server/src/a11oy/runtime/router/model-router.ts.

The TypeScript bridge delegates model selection to this module via the
/claim endpoint with stageType='ModelRoute'. The TS router itself becomes a
thin pass-through that calls Python for the actual provider/model decision.

Selection priority (in order):
  1. MODEL_PROVIDER env var (explicit override)
  2. Live GPU inference (substrate-inference service, gated by SUBSTRATE_API_KEY)
  3. OpenAI (gated by key presence)
  4. DeepSeek (gated by key presence)
  5. NVIDIA NIM (gated by key presence)
  6. Hugging Face (gated by HF_ENABLE_LIVE_INFERENCE + governance gates)
  7. Local (gated by LOCAL_MODEL_URL)
  8. Mock/stub (always available; isDemo=True)
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Literal

import structlog

log = structlog.get_logger(__name__)

ModelProvider = Literal[
    "substrate", "openai", "deepseek", "nvidia", "huggingface", "local", "mock"
]

ModelRole = Literal["reasoning", "fast", "long_context"]

# ── Governance gates (mirrored from model-registry.ts logic) ──────────────────

_HF_GATE_CONDITIONS = {
    "registry_record_exists": True,
    "license_approved": os.environ.get("HF_LICENSE_APPROVED", "0") == "1",
    "sensitivity_match": True,
    "hf_live_inference_enabled": os.environ.get("HF_ENABLE_LIVE_INFERENCE", "0") == "1",
    "hf_production_approved": os.environ.get("HF_PRODUCTION_APPROVED", "0") == "1",
}


def check_hf_gate() -> tuple[bool, list[str]]:
    failed = [k for k, v in _HF_GATE_CONDITIONS.items() if not v]
    return len(failed) == 0, failed


def check_substrate_gate() -> bool:
    """
    Substrate GPU inference is available when:
      - SUBSTRATE_INFERENCE_URL is set (points to the inference service, NOT the worker itself)
      - SUBSTRATE_API_KEY is set (protects the inference model-load endpoints)

    Note: SUBSTRATE_PYTHON_WORKER_URL points to the Python worker and is intentionally
    NOT used here — inside the worker process that env var resolves back to the worker
    itself, not the inference engine, so it cannot be used as an inference availability gate.
    """
    inference_url = os.environ.get("SUBSTRATE_INFERENCE_URL", "")
    key = os.environ.get("SUBSTRATE_API_KEY", "")
    return bool(inference_url and key)


# ── Model defaults ─────────────────────────────────────────────────────────────

_DEFAULT_MODELS: dict[ModelRole, dict[ModelProvider, str]] = {
    "reasoning": {
        "substrate": os.environ.get("SUBSTRATE_DEFAULT_MODEL", "llama-3.3-70b-instruct"),
        "openai": os.environ.get("DEFAULT_REASONING_MODEL", "gpt-4o"),
        "deepseek": "deepseek-reasoner",
        "nvidia": "nvidia/llama-3.1-nemotron-ultra-253b-v1",
        "huggingface": os.environ.get("HF_PRIMARY_LLM", "Qwen/Qwen3-8B"),
        "local": "local-model",
        "mock": "mock-v1",
    },
    "fast": {
        "substrate": os.environ.get("SUBSTRATE_FAST_MODEL", "llama-3.1-8b-instruct"),
        "openai": os.environ.get("DEFAULT_FAST_MODEL", "gpt-4o-mini"),
        "deepseek": "deepseek-chat",
        "nvidia": "nvidia/llama-3.1-8b-instruct",
        "huggingface": "Qwen/Qwen3-8B",
        "local": "local-model",
        "mock": "mock-v1",
    },
    "long_context": {
        "substrate": os.environ.get("SUBSTRATE_LONG_CTX_MODEL", "llama-3.3-70b-instruct"),
        "openai": os.environ.get("DEFAULT_LONG_CONTEXT_MODEL", "gpt-4o"),
        "deepseek": "deepseek-chat",
        "nvidia": "nvidia/llama-3.1-nemotron-ultra-253b-v1",
        "huggingface": os.environ.get("HF_PRIMARY_LLM", "Qwen/Qwen3-8B"),
        "local": "local-model",
        "mock": "mock-v1",
    },
}


@dataclass
class ModelSelection:
    provider: ModelProvider
    model: str
    is_demo: bool
    reason: str
    failed_gates: list[str]


def resolve_provider() -> ModelProvider:
    """
    Resolve the active model provider in priority order.
    Matches resolveProvider() in model-router.ts exactly.
    """
    explicit = os.environ.get("MODEL_PROVIDER", "")
    if explicit:
        return explicit  # type: ignore[return-value]

    if check_substrate_gate():
        return "substrate"

    if os.environ.get("OPENAI_API_KEY") or os.environ.get("AI_INTEGRATIONS_OPENAI_API_KEY"):
        return "openai"

    if os.environ.get("DEEPSEEK_API_KEY"):
        return "deepseek"

    if os.environ.get("NVIDIA_API_KEY"):
        return "nvidia"

    hf_token = os.environ.get("HF_TOKEN") or os.environ.get("HUGGINGFACE_API_KEY")
    hf_ok, _ = check_hf_gate()
    if hf_token and hf_ok:
        return "huggingface"

    if os.environ.get("LOCAL_MODEL_URL"):
        return "local"

    return "mock"


def select_model(
    role: ModelRole = "reasoning",
    requested_model: str | None = None,
) -> ModelSelection:
    """
    Select the provider and model for a given role.

    This is the Python source-of-truth that the TypeScript bridge calls via
    stageType='ModelRoute'. It returns a ModelSelection that the TS bridge uses
    directly without further logic.
    """
    provider = resolve_provider()
    hf_ok, hf_failed = check_hf_gate()

    if requested_model:
        model = requested_model
    else:
        model = _DEFAULT_MODELS.get(role, _DEFAULT_MODELS["reasoning"]).get(
            provider, "mock-v1"
        )

    reason = f"provider={provider} role={role}"
    is_demo = provider == "mock"

    log.debug(
        "model_selected",
        provider=provider,
        model=model,
        role=role,
        is_demo=is_demo,
    )

    return ModelSelection(
        provider=provider,
        model=model,
        is_demo=is_demo,
        reason=reason,
        failed_gates=hf_failed if provider not in ("substrate", "openai", "deepseek", "nvidia", "local", "mock") else [],
    )


def get_provider_statuses() -> list[dict]:
    """
    Return a status summary for all providers.
    Mirrors getProviderStatuses() in model-router.ts.
    """
    active = resolve_provider()
    hf_token = os.environ.get("HF_TOKEN") or os.environ.get("HUGGINGFACE_API_KEY")
    hf_ok, hf_failed = check_hf_gate()
    substrate_ok = check_substrate_gate()

    return [
        {
            "provider": "substrate",
            "available": substrate_ok,
            "model": _DEFAULT_MODELS["reasoning"]["substrate"],
            "reason": None if substrate_ok else "substrate_not_configured",
            "active": active == "substrate",
        },
        {
            "provider": "openai",
            "available": bool(
                os.environ.get("AI_INTEGRATIONS_OPENAI_API_KEY") or os.environ.get("OPENAI_API_KEY")
            ),
            "model": _DEFAULT_MODELS["reasoning"]["openai"],
            "reason": None if os.environ.get("OPENAI_API_KEY") else "key_not_configured",
            "active": active == "openai",
        },
        {
            "provider": "deepseek",
            "available": bool(os.environ.get("DEEPSEEK_API_KEY")),
            "model": _DEFAULT_MODELS["reasoning"]["deepseek"],
            "reason": None if os.environ.get("DEEPSEEK_API_KEY") else "key_not_configured",
            "active": active == "deepseek",
        },
        {
            "provider": "nvidia",
            "available": bool(os.environ.get("NVIDIA_API_KEY")),
            "model": _DEFAULT_MODELS["reasoning"]["nvidia"],
            "reason": None if os.environ.get("NVIDIA_API_KEY") else "key_not_configured",
            "active": active == "nvidia",
        },
        {
            "provider": "huggingface",
            "available": bool(hf_token and hf_ok),
            "model": _DEFAULT_MODELS["reasoning"]["huggingface"],
            "reason": (
                None if (hf_token and hf_ok)
                else ("token_not_configured" if not hf_token else f"gates_blocked:{','.join(hf_failed)}")
            ),
            "active": active == "huggingface",
        },
        {
            "provider": "local",
            "available": bool(os.environ.get("LOCAL_MODEL_URL")),
            "model": "local-model",
            "reason": None if os.environ.get("LOCAL_MODEL_URL") else "url_not_configured",
            "active": active == "local",
        },
        {
            "provider": "mock",
            "available": True,
            "model": "mock-v1",
            "reason": "fallback_available" if active != "mock" else "active_provider",
            "active": active == "mock",
        },
    ]
