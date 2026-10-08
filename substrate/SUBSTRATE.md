# Substrate Fleet — Architecture & Configuration Guide

The substrate fleet is the GPU compute plane for the SZL Holdings AI pipeline.
It consists of two services that together form a governed, auto-scaling Python
backend. The TypeScript API server delegates to it via a thin bridge.

> Full operations reference: `docs/operations/substrate-fleet.md`
> Deploy: `./scripts/deploy-substrate.sh`
> Runbooks: `infra/runbooks/`

---

## Fleet Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          TypeScript API Server                            │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  substrate-worker-bridge.ts  ← THIN PASS-THROUGH ONLY               │ │
│  │                                                                      │ │
│  │  Responsibilities:  protocol, auth, timeout, fail-closed, logging    │ │
│  │  NOT here:          model selection, batching, ranking, cache warm   │ │
│  └─────────────────────────┬────────────────────────────────────────────┘ │
└────────────────────────────┼───────────────────────────────────────────────┘
                              │ POST /claim  (stageType=*)
                              ▼
┌──────────────────────────────────────────────────────────────────────────┐
│             substrate-py-workers  (port 8090)  ← HEAVYWEIGHT BACKEND     │
│                                                                            │
│  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────────────────┐ │
│  │  model_router   │  │ evidence_ranker   │  │  Stage handlers         │ │
│  │  (source of     │  │ TF-IDF / BM25 /  │  │  retrieval, ocr,        │ │
│  │  truth for      │  │ cross-encoder     │  │  geospatial,            │ │
│  │  provider &     │  │ ranking           │  │  eval_grading           │ │
│  │  model select.) │  └──────────────────┘  └─────────────────────────┘ │
│  └────────┬────────┘                                                       │
│           │ stageType=ModelRoute delegation                                │
│  ┌────────▼───────────────────────────────────────────────────────────┐   │
│  │  AutoscalingPolicy — /metrics endpoint                              │   │
│  │  Emits: scale-out / scale-in / hold                                 │   │
│  │  KEDA polls this endpoint and adjusts replicas                      │   │
│  └────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
                              │ (when MODEL_PROVIDER=substrate)
                              ▼
┌──────────────────────────────────────────────────────────────────────────┐
│           substrate-inference  (port 8070)                                │
│   oLLM GPU engine — OpenAI-compatible API                                  │
│                                                                            │
│   GET  /health   (liveness  — always 200 while running)                   │
│   GET  /ready    (readiness — 503 until model loaded + queue clear)       │
│   POST /v1/chat/completions  (streaming SSE supported)                    │
│   GET  /v1/models            (list available models)                      │
│   POST /v1/models/load       (hot-load model into GPU VRAM, auth req'd)  │
│   POST /v1/models/unload     (unload model, auth req'd)                   │
└──────────────────────────────────────────────────────────────────────────┘
```

### Responsibility boundaries

| Concern | Owned by |
|---|---|
| Model / provider selection | `model_router.py` (Python) |
| Per-stage batching | `substrate-py-workers` (Python) |
| Evidence ranking | `evidence_ranker.py` (Python) |
| Stage execution (retrieval, OCR, geo, eval) | `substrate-py-workers` (Python) |
| GPU inference | `substrate-inference` (Python) |
| Protocol, timeout, fail-closed | `substrate-worker-bridge.ts` (TypeScript) |
| Orchestration / run lifecycle | API server `a11oy` runtime (TypeScript) |

---

## GPU Requirements

| Model | Min VRAM | Recommended VRAM | SSD Offload |
|---|---|---|---|
| Llama 3.1 8B | 6 GB | 8 GB | No |
| Gemma3 12B | 8 GB | 12 GB | No |
| GPT-OSS 20B | 8 GB | 16 GB | Yes |
| Voxtral Small 24B | 8 GB | 16 GB | Yes |
| Llama 3.3 70B | 8 GB | 24 GB | Yes |
| Qwen3-Next 80B | 8 GB | 24 GB | Yes |

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

---

## Local Development

### GPU host (full stack)

```bash
cp .env.substrate.example .env.substrate
$EDITOR .env.substrate

docker compose --env-file .env.substrate -f docker-compose.gpu.yml up --build
```

### No GPU (development-only CPU contract stub)

```bash
docker compose -f docker-compose.cpu-stub.yml up
```

This standalone stack does not inherit production credentials or GPU device
reservations. It exposes the request/response contract for local development,
but performs no qualified inference: `/healthz` reports process liveness and
`/ready` deliberately returns `503` while the engine is a CPU stub.

### Without Docker (Python directly)

```bash
# Inference service
cd apps/substrate-inference
pip install -r requirements.txt
PORT=8070 python -m src.main

# Workers (separate terminal)
cd services/substrate-py-workers
pip install -r requirements.txt
PORT=8090 python -m worker.main
```

---

## Autoscaling

Autoscaling operates at two layers:

1. **AutoscalingPolicy (Python, in-process)** — evaluates `active_claims` and
   idle time. Emits recommendations at `/metrics`. No cloud calls.

2. **KEDA / VMSS (Azure)** — polls `/metrics` and scales Container App replicas:
   - Scale-out when `availableSlots < SCALE_OUT_QUEUE_DEPTH` (default 3)
   - Scale-in via KEDA cooldown after `SCALE_IN_IDLE_SECONDS` (default 120)
   - Min replicas: `MIN_WORKERS` (default 1)
   - Max replicas: `MAX_WORKERS` (default 10)

Simulate locally (no cloud):

```bash
python -m worker.autoscaling_sim
# or: pytest services/substrate-py-workers/tests/test_autoscaling_sim.py -v
```

---

## Governance & Fail-Closed Contract

The TypeScript bridge enforces these rules without exception:

| Mode | Worker unreachable | Worker not ready |
|---|---|---|
| `live` | **Explicit error** (fail-closed, no fabrication) | **Explicit error** |
| `dry-run` | Deterministic fallback (if gate open) | Deterministic fallback |
| `replay` | Deterministic fallback (if gate open) | Deterministic fallback |
| `counterfactual` | Deterministic fallback (if gate open) | Deterministic fallback |

Gate environment variables that control fallback permission:

| Gate | Variable |
|---|---|
| Allow synthetic retrieval | `SUBSTRATE_RETRIEVAL_ALLOW_SYNTHETIC=1` |
| Allow dev-mode embeddings | `SUBSTRATE_EMBEDDINGS_ALLOW_DEV_MODEL=1` |

---

## Model API

```bash
# List available models
curl http://localhost:8070/v1/models | python3 -m json.tool

# Load a model into GPU memory
curl -X POST http://localhost:8070/v1/models/load \
  -H "Authorization: Bearer $SUBSTRATE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model_id": "llama-3.1-8b-instruct"}'

# Run inference
curl -X POST http://localhost:8070/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama-3.1-8b-instruct",
    "messages": [{"role": "user", "content": "Summarise the key risk factors."}],
    "max_tokens": 512
  }'
```

Monitor progress:
```bash
curl http://localhost:8070/health | python3 -m json.tool | grep -A5 download_progress
```

## Service Startup
---

## Production Deployment

```bash
./scripts/deploy-substrate.sh
```

See `docs/operations/substrate-fleet.md` for the full go-live checklist and
`infra/runbooks/` for step-by-step operational runbooks.

### Production (with GPU)

```bash
cd apps/substrate-inference
pip install -r requirements.txt
pip install torch>=2.5.0 transformers>=4.47.0 accelerate>=1.2.0 safetensors>=0.5.0
pip install peft>=0.14.0 bitsandbytes>=0.44.0   # for adapter + quantization support
pip install flash-attn>=2.7.0                    # optional FlashAttention-2
pip install ollm                                 # oLLM engine (requires CUDA)
export SUBSTRATE_INFERENCE_ENV=production
# Inject SUBSTRATE_API_KEY from the deployment secret manager.
python -m src.main
```

The engine auto-detects GPU availability. When `torch.cuda.is_available()`
and the `ollm` package are importable, the service operates in **LIVE** mode
and delegates inference to `ollm.AutoInference`.

In development, `SUBSTRATE_DEFAULT_MODEL` may be loaded on startup. Production
autoload and model mutation remain held until a verified, image-bound promotion
receipt covers the exact model revision, artifact digest, and an observed
bounded inference. The current release therefore returns `503` from `/ready`
in production even when a live GPU adapter is present.

### Smoke Test

After starting the service, run the smoke test to verify all modes:

```bash
cd apps/substrate-inference
# First load a model (the test uses llama-3.1-8b-instruct by default)
python scripts/smoke_test.py --base-url http://localhost:8070 --api-key $SUBSTRATE_API_KEY
```

This development smoke exercise covers health, model listing, completion,
streaming, multimodal requests, and adapter load/unload. A STUB response is a
contract-development result only; it is never readiness or production proof.

## Environment Variables

| Variable                      | Default                    | Description                                     |
|-------------------------------|----------------------------|-------------------------------------------------|
| `SUBSTRATE_INFERENCE_URL`     | `http://localhost:8070/v1` | Base URL for the inference service (used by TS)  |
| `SUBSTRATE_INFERENCE_PORT`    | `8070`                     | Port the FastAPI service listens on              |
| `SUBSTRATE_MODELS_DIR`       | `~/.substrate/models`      | Directory for downloaded model weights           |
| `SUBSTRATE_CACHE_DIR`         | `~/.substrate/cache`       | SSD cache directory for KV cache offload         |
| `SUBSTRATE_MAX_CONCURRENT`    | `4`                        | Maximum concurrent inference requests            |
| `SUBSTRATE_DEFAULT_MODEL`     | (none)                     | Model to auto-load on startup                    |
| `SUBSTRATE_API_KEY`           | (required*)                | Secret-backed bearer credential for every `/v1` route |
| `SUBSTRATE_INFERENCE_ENV`     | (unspecified)              | Runtime environment (`production`, `development`, or `test`) |
| `SUBSTRATE_INFERENCE_AUTH_BYPASS` | `false`                | Explicit bypass; accepted only in development/test |
| `SUBSTRATE_ALLOWED_ORIGINS`   | `localhost:5000,8070`      | Comma-separated CORS allowed origins             |
| `SUBSTRATE_BIND_HOST`         | `127.0.0.1`               | Bind host (set to `0.0.0.0` for network access)  |

\* Required unless the explicit development/test bypass is enabled. Never put
the server credential in a `VITE_*` variable or browser bundle.

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
- **API key authentication** protects every `/v1` route. Production startup
  fails closed when `SUBSTRATE_API_KEY` is missing. Only `/health` and
  `/healthz` are public for orchestrator probes.
- **Development/test bypass** is opt-in via
  `SUBSTRATE_INFERENCE_AUTH_BYPASS=true` and is rejected if any environment
  marker declares production.
- **CORS** restricted to localhost origins by default. Configure
  `SUBSTRATE_ALLOWED_ORIGINS` for cross-origin access from other services.

## Multimodal Support

- **Image + Text:** Use Gemma3-12B for vision tasks
- **Audio + Text:** Use Voxtral-Small-24B for audio understanding

### Image Example

```bash
curl -X POST http://localhost:8070/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUBSTRATE_API_KEY" \
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
  -H "Authorization: Bearer $SUBSTRATE_API_KEY" \
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
| POST   | `/v1/chat/completions`  | API Key  | Chat completion (real streaming SSE)            |
| GET    | `/v1/models`            | API Key  | List available models                           |
| POST   | `/v1/models/load`       | API Key  | Hot-load a model into GPU memory (+ quantization) |
| POST   | `/v1/models/unload`     | API Key  | Unload a model from GPU memory                  |
| POST   | `/v1/adapters/load`     | API Key  | Load a PEFT/LoRA adapter onto a base model      |
| POST   | `/v1/adapters/unload`   | API Key  | Unload a PEFT/LoRA adapter                      |
| GET    | `/v1/adapters`          | API Key  | List all active adapters                        |
| GET    | `/health`               | No       | GPU stats, inference health, download progress  |
| GET    | `/healthz`              | No       | Process liveness                                |

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
- **STUB**: Missing dependencies → development-only contract responses; `/ready` remains `503`

The Command dashboard at `/infrastructure/substrate` polls the health and
models endpoints to display real-time GPU status and model state. Load/unload
buttons call the FastAPI endpoints directly.
---

## Security

- **Tenant-bound inference key** (`SUBSTRATE_API_KEY`) protects inference and
  read routes; `SUBSTRATE_API_TENANT_ID` binds the credential to the required
  `X-Tenant-ID` header and request payload.
- **Separate model-admin key** (`SUBSTRATE_MODEL_ADMIN_API_KEY`) protects model
  load/unload. Production rejects reuse of the inference credential and keeps
  those mutations held until promotion evidence is verified.
- `/healthz` is public liveness. `/ready` is public readiness and currently
  returns `503` in production because the release lacks a verified promotion
  receipt and a hashed Python dependency lock/SBOM.
- **NSG** (`substrate-nsg`) blocks all external inbound traffic. Only the API
  server's egress CIDRs are permitted on the substrate ports (8070, 8090).
- **Key Vault** stores `SUBSTRATE_API_KEY` as a secret; Container Apps pull it
  at runtime via managed identity — the plaintext never touches deployment logs.

---

## Multimodal Support

- **Image + Text:** Gemma3-12B — `"modalities": ["text", "image"]`
- **Audio + Text:** Voxtral-Small-24B — `"modalities": ["text", "audio"]`
