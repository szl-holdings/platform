# Substrate Edge Inference — Configuration Guide

Substrate Edge Inference integrates the open-source oLLM library into the SZL
Holdings ecosystem, enabling air-gapped, zero-cost local GPU inference for
80B+ parameter models on consumer hardware.

## GPU Requirements

| Model               | Min VRAM | Recommended VRAM | SSD Offload |
|---------------------|----------|------------------|-------------|
| Llama 3.1 8B        | 6 GB     | 8 GB             | No          |
| Gemma3 12B          | 8 GB     | 12 GB            | No          |
| GPT-OSS 20B         | 8 GB     | 16 GB            | Yes         |
| Voxtral Small 24B   | 8 GB     | 16 GB            | Yes         |
| Llama 3.3 70B       | 8 GB     | 24 GB            | Yes         |
| Qwen3-Next 80B      | 8 GB     | 24 GB            | Yes         |

**Supported GPUs:** NVIDIA (CUDA 12+), AMD (ROCm 6+), Apple Silicon (MPS).

Models larger than available VRAM use SSD-offloaded KV cache and
layer-by-layer GPU loading to run at full fp16/bf16 precision without
quantization.

## Quantization

When VRAM is limited, load models with reduced precision:

```bash
# 4-bit quantization (~30% of normal VRAM, requires bitsandbytes)
curl -X POST http://localhost:8070/v1/models/load \
  -H "Authorization: Bearer $SUBSTRATE_API_KEY" \
  -d '{"model_id": "llama-3.3-70b-instruct", "quantization": "4bit"}'

# 8-bit quantization (~55% of normal VRAM)
curl -X POST http://localhost:8070/v1/models/load \
  -d '{"model_id": "llama-3.3-70b-instruct", "quantization": "8bit"}'
```

## PEFT / LoRA Adapter Support

Hot-swap adapters onto a loaded base model without reloading the weights:

```bash
# Load adapter
curl -X POST http://localhost:8070/v1/adapters/load \
  -H "Authorization: Bearer $SUBSTRATE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model_id": "llama-3.1-8b-instruct", "adapter_path": "/path/to/adapter", "adapter_name": "my-lora"}'

# List all active adapters
curl http://localhost:8070/v1/adapters

# Unload adapter
curl -X POST http://localhost:8070/v1/adapters/unload \
  -H "Authorization: Bearer $SUBSTRATE_API_KEY" \
  -d '{"model_id": "llama-3.1-8b-instruct", "adapter_name": "my-lora"}'
```

The `/health` endpoint includes an `active_adapters` count. Requires
`peft>=0.14.0` in the GPU dependency set.

## Model Download

Models are stored in `SUBSTRATE_MODELS_DIR` (default `~/.substrate/models`).
Download progress is tracked and surfaced via the `/health` endpoint under
`download_progress`. Downloads resume automatically if interrupted; the HuggingFace
`transformers` cache handles checksum validation.

```bash
curl -X POST http://localhost:8070/v1/models/load \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUBSTRATE_API_KEY" \
  -d '{"model_id": "llama-3.3-70b-instruct"}'
```

Monitor progress:
```bash
curl http://localhost:8070/health | python3 -m json.tool | grep -A5 download_progress
```

## Service Startup

### Development (no GPU)

```bash
cd apps/substrate-inference
pip install -r requirements.txt
python -m src.main
```

The service starts on port 8070 in **STUB** mode — all API contracts work
identically, but responses are labelled as stubs. This allows developing
and testing the Command dashboard and AI Control Plane without GPU hardware.

### Production (with GPU)

```bash
cd apps/substrate-inference
pip install -r requirements.txt
pip install torch>=2.5.0 transformers>=4.47.0 accelerate>=1.2.0 safetensors>=0.5.0
pip install peft>=0.14.0 bitsandbytes>=0.44.0   # for adapter + quantization support
pip install flash-attn>=2.7.0                    # optional FlashAttention-2
pip install ollm                                 # oLLM engine (requires CUDA)
python -m src.main
```

The engine auto-detects GPU availability. When `torch.cuda.is_available()`
and the `ollm` package are importable, the service operates in **LIVE** mode
and delegates inference to `ollm.AutoInference`.

On startup, if `SUBSTRATE_DEFAULT_MODEL` is set the model is pre-loaded and
the cache is warmed before any traffic is served. On shutdown, all models are
cleanly unloaded and the SSD KV cache is flushed.

### Smoke Test

After starting the service, run the smoke test to verify all modes:

```bash
cd apps/substrate-inference
# First load a model (the test uses llama-3.1-8b-instruct by default)
python scripts/smoke_test.py --base-url http://localhost:8070 --api-key $SUBSTRATE_API_KEY
```

This tests: health, models list, single completion, streaming completion,
multimodal inference, and adapter load/unload. STUB mode responses count as
PASS with a `[STUB]` label.

## Environment Variables

| Variable                      | Default                    | Description                                     |
|-------------------------------|----------------------------|-------------------------------------------------|
| `SUBSTRATE_INFERENCE_URL`     | `http://localhost:8070/v1` | Base URL for the inference service (used by TS)  |
| `SUBSTRATE_INFERENCE_PORT`    | `8070`                     | Port the FastAPI service listens on              |
| `SUBSTRATE_MODELS_DIR`       | `~/.substrate/models`      | Directory for downloaded model weights           |
| `SUBSTRATE_CACHE_DIR`         | `~/.substrate/cache`       | SSD cache directory for KV cache offload         |
| `SUBSTRATE_MAX_CONCURRENT`    | `4`                        | Maximum concurrent inference requests            |
| `SUBSTRATE_DEFAULT_MODEL`     | (none)                     | Model to auto-load on startup                    |
| `SUBSTRATE_API_KEY`           | (none)                     | API key protecting model load/unload/adapter endpoints |
| `SUBSTRATE_ALLOWED_ORIGINS`   | `localhost:5000,8070`      | Comma-separated CORS allowed origins             |
| `SUBSTRATE_BIND_HOST`         | `127.0.0.1`               | Bind host (set to `0.0.0.0` for network access)  |
| `VITE_SUBSTRATE_API_KEY`      | (none)                     | API key for Command dashboard (Vite env)         |

## AI Control Plane Configuration

Substrate is registered as provider type `'substrate'` in the AI Control Plane.
By default, substrate endpoints have lower priority than cloud providers
(priority 40–45 vs cloud 10–21), so they serve as automatic fallback when cloud
providers are unavailable.

### Prefer Substrate for Specific Routes

To route all requests from a specific vertical to substrate:

```typescript
import { modelRouter } from '@szl-holdings/ai-control-plane';

const result = modelRouter.route({
  routeClass: 'reasoning',
  preferredProvider: 'substrate',
});
```

### Air-Gapped Mode

For air-gapped deployments where no cloud connectivity is available, disable
cloud providers and set substrate as the primary:

```typescript
// Remove cloud endpoints
modelRouter.removeEndpoint('openai', 'gpt-4o');
modelRouter.removeEndpoint('anthropic', 'claude-opus-4-5');

// Substrate becomes primary
```

### Fallback Chain

The default fallback chain includes:

1. `cloud-to-substrate` — When cloud providers' circuit breakers open, fall back to substrate
2. `local-to-substrate` — When local (Ollama) is unavailable, fall back to substrate
3. `budget-exceeded-to-substrate` — When cost budget is exceeded, switch to zero-cost substrate

## Security

- **Localhost-only binding** by default (`SUBSTRATE_BIND_HOST=127.0.0.1`).
  Set to `0.0.0.0` only for trusted networks or behind a reverse proxy.
- **API key authentication** protects model load/unload and adapter endpoints when
  `SUBSTRATE_API_KEY` is set. Read-only endpoints (`/health`, `/v1/models`,
  `/v1/adapters`, `/v1/chat/completions`) remain open for inference clients.
- **CORS** restricted to localhost origins by default. Configure
  `SUBSTRATE_ALLOWED_ORIGINS` for cross-origin access from other services.

## Multimodal Support

- **Image + Text:** Use Gemma3-12B for vision tasks
- **Audio + Text:** Use Voxtral-Small-24B for audio understanding

### Image Example

```bash
curl -X POST http://localhost:8070/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gemma3-12b",
    "messages": [{
      "role": "user",
      "content": [
        {"type": "text", "text": "Describe this image"},
        {"type": "image_url", "image_url": {"url": "data:image/png;base64,..."}}
      ]
    }]
  }'
```

### Audio Example

```bash
curl -X POST http://localhost:8070/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "voxtral-small-24b",
    "messages": [{
      "role": "user",
      "content": [
        {"type": "text", "text": "Transcribe and summarize this audio"},
        {"type": "input_audio", "input_audio": {"data": "<base64-wav>", "format": "wav"}}
      ]
    }]
  }'
```

## API Endpoints

| Method | Path                    | Auth     | Description                                     |
|--------|-------------------------|----------|-------------------------------------------------|
| POST   | `/v1/chat/completions`  | No       | Chat completion (real streaming SSE)            |
| GET    | `/v1/models`            | No       | List available models                           |
| POST   | `/v1/models/load`       | API Key  | Hot-load a model into GPU memory (+ quantization) |
| POST   | `/v1/models/unload`     | API Key  | Unload a model from GPU memory                  |
| POST   | `/v1/adapters/load`     | API Key  | Load a PEFT/LoRA adapter onto a base model      |
| POST   | `/v1/adapters/unload`   | API Key  | Unload a PEFT/LoRA adapter                      |
| GET    | `/v1/adapters`          | No       | List all active adapters                        |
| GET    | `/health`               | No       | GPU stats, inference health, download progress  |

## Health Response Fields

The `/health` endpoint now includes:

- `active_adapters` — count of currently loaded PEFT adapters
- `download_progress` — per-model download status (`percent`, `complete`, `error`)
- `inference_health` — per-model lightweight inference test result (`pass`, `latency_ms`)

## CUDA Error Recovery

In LIVE mode, inference calls are wrapped with CUDA/OOM detection. On a GPU
out-of-memory or CUDA error the engine:

1. Catches the exception before it crashes the process
2. Calls `engine.unload()` on the offending model (deletes tensors, clears refs)
3. Calls `torch.cuda.empty_cache()` to reclaim VRAM
4. Returns a structured `500` error to the caller

The service continues running for other loaded models.

## Architecture

```
┌─────────────────────────────────┐
│  TypeScript Ecosystem           │
│  ┌───────────────────────────┐  │
│  │ ai-control-plane (router) │──┼──► Cloud (OpenAI, Anthropic)
│  │  provider: 'substrate'    │  │
│  └───────────┬───────────────┘  │
│              │                  │
│  ┌───────────▼───────────────┐  │
│  │ substrate-adapters        │  │
│  │  SubstrateEndpointManager │  │
│  │  loadAdapter / listAdapters│  │
│  └───────────┬───────────────┘  │
└──────────────┼──────────────────┘
               │ HTTP (OpenAI-compat)
┌──────────────▼──────────────────┐
│  Python Service                 │
│  apps/substrate-inference/      │
│  ┌───────────────────────────┐  │
│  │ FastAPI (src/main.py)     │  │
│  │  /v1/chat/completions     │  │
│  │  /v1/models, /health      │  │
│  │  /v1/adapters/*           │  │
│  │  Real SSE streaming       │  │
│  │  Startup/shutdown hooks   │  │
│  └───────────┬───────────────┘  │
│              │                  │
│  ┌───────────▼───────────────┐  │
│  │ SubstrateRuntime          │  │
│  │  engine/runtime.py        │  │
│  │  Adapter load/unload      │  │
│  │  Quantization support     │  │
│  │  Download progress        │  │
│  │  Inference health checks  │  │
│  └───────────┬───────────────┘  │
│              │ (LIVE mode only) │
│  ┌───────────▼───────────────┐  │
│  │ oLLM (vendored)           │  │
│  │  engine/ollm/             │  │
│  │  AutoInference            │  │
│  │  TextIteratorStreamer      │  │
│  │  PEFT/LoRA adapters       │  │
│  │  bitsandbytes quant       │  │
│  │  CUDA error recovery      │  │
│  │  FlashAttention-2         │  │
│  │  SSD KV Cache Offload     │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

### Engine Modes

- **LIVE**: `torch` + CUDA + `ollm` installed → real GPU inference via `ollm.AutoInference`
- **STUB**: Missing dependencies → returns labelled stub responses with identical API contracts

The Command dashboard at `/infrastructure/substrate` polls the health and
models endpoints to display real-time GPU status and model state. Load/unload
buttons call the FastAPI endpoints directly.
