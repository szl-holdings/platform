# Alloy Meridian — Model Router

## Overview

The Model Router provides provider-abstracted routing across model lanes. Provider identities in this document are source configuration, not proof that a provider/model is production-qualified. Live availability remains separately gated by credentials, runtime controls, evaluation receipts, and the active source revision.

## DeepSeek identity boundary — 2026-09-14

DeepSeek's current canonical API alias for V4.1 Flash is `deepseek-flash`. The historical `deepseek-v4-flash` and `deepseek-v4-flash-vision-exp` names are compatibility redirects, and `deepseek-v4-pro` began routing to V4.1 Flash at 04:00 UTC on 2026-09-14. The earlier `deepseek-chat` and `deepseek-reasoner` aliases are retired and must not be used as canonical model identities in A11oy receipts or provider configuration.

The provider registry therefore records `deepseek-flash`, but keeps the DeepSeek provider unavailable by default. This is an identity-drift repair only. It does **not** establish V4.1 Flash production qualification or authorize a route/default change. Exact-source evaluation remains governed by `szl-holdings/szl-frontier#134/#135` and its Forge/Serve/GPU evidence chain.

Any future live receipt must preserve both the requested provider/model alias and the resolved, qualified model identity so upstream compatibility redirects cannot silently change provenance.

## Model Lanes

### Strategy Lane
Deep reasoning and multi-step strategic analysis.

| Model | Provider | Status | Notes |
|---|---|---|---|
| DeepSeek V4.1 Flash (`deepseek-flash`) | DeepSeek | HOLD / EVALUATION | Current canonical API identity; no production qualification implied |
| GLM-5.1 | Zhipu | existing lane | |
| Kimi-K2.6 | Moonshot | existing lane | |

**Env key**: `DEEPSEEK_API_KEY` (gated), `ZHIPU_API_KEY`, `MOONSHOT_API_KEY`

### Fast-Ops Lane
High-throughput operational tasks.

| Model | Provider | Status | Notes |
|---|---|---|---|
| DeepSeek V4.1 Flash (`deepseek-flash`) | DeepSeek | HOLD / EVALUATION | Do not infer latency or throughput from upstream claims |
| Gemma-4 | Google | existing lane | |
| Qwen3.5-9B | Alibaba | existing lane | |

**Env key**: `DEEPSEEK_API_KEY` (gated), `GOOGLE_AI_API_KEY`, `DASHSCOPE_API_KEY`

### Coding Lane
Code generation, review, and engineering automation.

| Model | Provider | Status | Notes |
|---|---|---|---|
| Qwen3-Coder-Next | Alibaba | existing lane | |
| DeepSeek V4.1 Flash (`deepseek-flash`) | DeepSeek | HOLD / EVALUATION | Candidate only; exact-source and serving gates still apply |

**Env key**: `DASHSCOPE_API_KEY`, `DEEPSEEK_API_KEY` (gated)

### Forecasting Lane
Time-series forecasting for business metrics.

| Model | Provider | Notes |
|---|---|---|
| Chronos-2 | Amazon/HF | Amazon probabilistic foundation model |
| TimesFM | Google/HF | Zero-shot forecasting |
| Kronos | Salesforce/HF | Moirai family |
| Timer | THUML/HF | General-purpose |
| Lag-Llama | HF | Probabilistic lag-based |

**Env key**: `HF_TOKEN`

### Retrieval Lane
Embedding and semantic retrieval.

| Model | Provider | Notes |
|---|---|---|
| BGE-M3 | BAAI/HF | Multi-lingual, multi-granularity |
| MiniLM-L6-v2 | HF | Fast, small |

**Env key**: `HF_TOKEN`

### Speech Lane
Speech-to-text and text-to-speech.

| Model | Provider | Notes |
|---|---|---|
| Whisper Large v3 | OpenAI/HF | ASR candidate |
| Kokoro-82M | HF | TTS candidate |

**Env key**: `HF_TOKEN`

### Vision Lane
Document OCR and visual understanding.

| Model | Provider | Notes |
|---|---|---|
| GLM-OCR | Zhipu | Document and handwriting OCR |
| Gemma-4-31B | Google | Multimodal fallback |

**Env key**: `ZHIPU_API_KEY`, `GOOGLE_AI_API_KEY`

### Creative Lane
Image and media generation.

| Model | Provider | Notes |
|---|---|---|
| FLUX.1 | FAL.AI | Open image-generation candidate |
| FLUX.2 | FAL.AI | Higher-resolution candidate |
| ERNIE-Image | Baidu | Alternate candidate |

**Env key**: `FAL_KEY`, `BAIDU_API_KEY`

---

## Routing Logic

1. Provider/model source configuration does not by itself authorize live inference.
2. A provider must be explicitly available under the repository's normal controls before a credential can make it eligible.
3. The selected model identity must be canonical and non-retired; redirect-only aliases are not admissible as receipt identities.
4. If no qualified provider is available, the system must remain in mock/unavailable behavior rather than silently promoting a candidate.
5. A live receipt must bind requested alias, resolved model identity, provider, source/runtime revision, and the applicable evaluation/proof evidence.

## API

The API surface is implementation-dependent and must be verified against the active source tree before use. Historical examples in this document are not an authorization to call a provider or infer route availability.
