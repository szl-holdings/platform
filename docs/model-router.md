# Alloy Meridian — Model Router

## Overview

The Model Router (`artifacts/api-server/src/services/model-router.ts`) provides provider-abstracted routing across 8 model lanes. It reads API keys from environment variables at request time and falls back gracefully when keys are absent.

## Model Lanes

### Strategy Lane
Deep reasoning and multi-step strategic analysis.

| Model | Provider | Context | Notes |
|---|---|---|---|
| DeepSeek-R1 | DeepSeek | 128k | Chain-of-thought reasoning flagship |
| DeepSeek-V4-Pro | DeepSeek | 200k | Extended context reasoning |
| GLM-5.1 | Zhipu | 128k | |
| Kimi-K2.6 | Moonshot | 200k | |

**Env key**: `DEEPSEEK_API_KEY` (primary), `ZHIPU_API_KEY`, `MOONSHOT_API_KEY`

### Fast-Ops Lane
High-throughput, low-latency operational tasks.

| Model | Provider | Context | Notes |
|---|---|---|---|
| DeepSeek-V4-Flash | DeepSeek | 64k | Sub-200ms latency |
| Gemma-4 | Google | 128k | |
| Qwen3.5-9B | Alibaba | 32k | |

**Env key**: `DEEPSEEK_API_KEY`, `GOOGLE_AI_API_KEY`, `DASHSCOPE_API_KEY`

### Coding Lane
Code generation, review, and engineering automation.

| Model | Provider | Context | Notes |
|---|---|---|---|
| Qwen3-Coder-Next | Alibaba | 131k | Best-in-class code generation |
| DeepSeek-V4-Pro | DeepSeek | 200k | Fallback |

**Env key**: `DASHSCOPE_API_KEY`, `DEEPSEEK_API_KEY`

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
| Whisper Large v3 | OpenAI/HF | State-of-the-art ASR |
| Kokoro-82M | HF | High-quality TTS |

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
| FLUX.1 | FAL.AI | Best open image generation |
| FLUX.2 | FAL.AI | Higher resolution |
| ERNIE-Image | Baidu | Low-cost fallback |

**Env key**: `FAL_KEY`, `BAIDU_API_KEY`

---

## Routing Logic

1. The router reads the env key for each model in priority order
2. The first model whose key is present is selected
3. If no key is found, the primary model is returned with `mode: "mock"` and `envKeyPresent: false`
4. Mock mode means the routing configuration is valid but live inference is unavailable

## API

```
GET  /api/meridian/model-router       — Lane status snapshot
POST /api/meridian/model-router/route — Route a specific lane request
```

Example routing request:
```json
{
  "lane": "strategy",
  "preferredModelId": "deepseek-r1"
}
```

Example response:
```json
{
  "lane": "strategy",
  "selectedModel": { "id": "deepseek-r1", "provider": "deepseek", ... },
  "fallbacksAttempted": [],
  "reason": "primary",
  "envKeyPresent": true,
  "routedAt": "2026-04-25T..."
}
```
