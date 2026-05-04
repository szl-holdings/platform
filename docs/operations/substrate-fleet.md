# Substrate Fleet — Operations Reference

> Last updated: 2026-05-04

The substrate fleet is the GPU compute plane for the SZL Holdings AI pipeline.
It consists of two services:

| Service | Image | Port | Role |
|---|---|---|---|
| `substrate-inference` | `substrate-inference:<sha>` | 8070 | oLLM GPU engine, OpenAI-compatible API |
| `substrate-py-workers` | `substrate-py-workers:<sha>` | 8090 | Stage execution, model routing, evidence ranking |

The TypeScript API server (`artifacts/api-server`) talks to the worker via the
`substrate-worker-bridge.ts` thin pass-through. All model selection, batching,
and evidence ranking logic lives in Python.

---

## Environment Variable Reference

### substrate-inference

| Variable | Secret? | Default | Description |
|---|---|---|---|
| `PORT` | No | `8070` | Container port (takes precedence over SUBSTRATE_INFERENCE_PORT) |
| `SUBSTRATE_INFERENCE_PORT` | No | `8070` | Legacy port variable |
| `SUBSTRATE_BIND_HOST` | No | `127.0.0.1` | Bind host (`0.0.0.0` for containers) |
| `SUBSTRATE_MODELS_DIR` | No | `~/.substrate/models` | Directory for downloaded model weights |
| `SUBSTRATE_CACHE_DIR` | No | `~/.substrate/cache` | SSD KV-cache offload directory |
| `SUBSTRATE_MAX_CONCURRENT` | No | `4` | Maximum concurrent inference requests |
| `SUBSTRATE_DEFAULT_MODEL` | No | (none) | Model to auto-load on startup |
| **`SUBSTRATE_API_KEY`** | **YES** | (none) | API key protecting model load/unload endpoints |
| `SUBSTRATE_ALLOWED_ORIGINS` | No | `localhost:5000,8070` | Comma-separated CORS allowed origins |

### substrate-py-workers

| Variable | Secret? | Default | Description |
|---|---|---|---|
| `PORT` | No | `8090` | Container port |
| `WORKER_ID` | No | `py-worker-{uuid}` | Unique worker identifier |
| `WORKER_MAX_CONCURRENCY` | No | `4` | Maximum concurrent stage claims |
| `WORKER_DRAIN_TIMEOUT_S` | No | `60` | Seconds to wait for in-flight stages on SIGTERM |
| `WORKER_HEARTBEAT_INTERVAL_S` | No | `5` | Heartbeat log interval (seconds) |
| `SCALE_OUT_QUEUE_DEPTH` | No | `3` | Queue depth that triggers scale-out signal |
| `SCALE_IN_IDLE_SECONDS` | No | `120` | Seconds of idleness before scale-in signal |
| `MAX_WORKERS` | No | `10` | Maximum worker replicas |
| `MIN_WORKERS` | No | `1` | Minimum worker replicas |
| `SUBSTRATE_PYTHON_WORKER_URL` | No | (none) | URL of the worker (used by TS bridge to discover it) |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | No | (none) | OpenTelemetry OTLP collector endpoint |
| `SUBSTRATE_RETRIEVAL_ALLOW_SYNTHETIC` | No | `0` | Allow synthetic retrieval in non-live modes |
| `SUBSTRATE_EMBEDDINGS_ALLOW_DEV_MODEL` | No | `0` | Allow dev-mode embeddings without GPU |
| `EVIDENCE_RANK_METHOD` | No | `auto` | Evidence ranking method: `auto` \| `tfidf` \| `bm25` \| `cross-encoder` |
| `EVIDENCE_RANK_TOP_K` | No | `10` | Default number of evidence items to return from ranker |
| `EVIDENCE_CROSS_ENCODER_MODEL` | No | `cross-encoder/ms-marco-MiniLM-L-6-v2` | Cross-encoder model for evidence reranking |

### TypeScript bridge (API server)

| Variable | Secret? | Default | Description |
|---|---|---|---|
| `SUBSTRATE_PYTHON_WORKER_URL` | No | (none) | URL the TS bridge uses to reach the Python worker |
| `MODEL_PROVIDER` | No | (auto) | Force a model provider: `substrate` \| `openai` \| `deepseek` \| `nvidia` \| `huggingface` \| `local` \| `mock` |
| `DEFAULT_REASONING_MODEL` | No | `gpt-4o` | Default reasoning model (provider-specific) |
| `DEFAULT_FAST_MODEL` | No | `gpt-4o-mini` | Default fast model |
| `DEFAULT_LONG_CONTEXT_MODEL` | No | `gpt-4o` | Default long-context model |
| `SUBSTRATE_DEFAULT_MODEL` | No | `llama-3.3-70b-instruct` | Default substrate GPU model |
| `HF_ENABLE_LIVE_INFERENCE` | No | `0` | Gate: enable Hugging Face live inference |
| `HF_PRODUCTION_APPROVED` | No | `0` | Gate: HF production approval |
| `HF_LICENSE_APPROVED` | No | `0` | Gate: HF license approval |
| `HF_TOKEN` | **YES** | (none) | Hugging Face API token |
| `OPENAI_API_KEY` | **YES** | (none) | OpenAI API key |
| `DEEPSEEK_API_KEY` | **YES** | (none) | DeepSeek API key |
| `NVIDIA_API_KEY` | **YES** | (none) | NVIDIA NIM API key |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    TypeScript API Server                      │
│                                                               │
│  ┌────────────────────────────────┐                          │
│  │   substrate-worker-bridge.ts   │  thin pass-through only   │
│  │   (no model selection,         │  handles: protocol,       │
│  │    no batching, no ranking)    │  timeout, fail-closed     │
│  └──────────────┬─────────────────┘                          │
└─────────────────┼───────────────────────────────────────────┘
                  │ POST /claim (stageType=*)
                  ▼
┌─────────────────────────────────────────────────────────────┐
│              substrate-py-workers (port 8090)                 │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐ │
│  │ model_router │  │evidence_ranker│  │  Stage handlers    │ │
│  │ (source of   │  │ (TF-IDF/BM25/ │  │  retrieval, ocr,  │ │
│  │  truth for   │  │  cross-encoder│  │  geospatial, eval  │ │
│  │  provider &  │  │  ranking)     │  │                    │ │
│  │  model sel.) │  └──────────────┘  └────────────────────┘ │
│  └──────┬───────┘                                            │
│         │ when stageType=ModelRoute or local call            │
│         ▼                                                     │
│  ┌──────────────────────────────────────────────────────────┐│
│  │          AutoscalingPolicy (/metrics endpoint)           ││
│  └──────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                  │ optional: when substrate provider active
                  ▼
┌─────────────────────────────────────────────────────────────┐
│           substrate-inference (port 8070)                     │
│   oLLM GPU engine, OpenAI-compatible API                      │
│   /health (liveness) /ready (readiness) /v1/chat/completions │
└─────────────────────────────────────────────────────────────┘
```

---

## Local Development

### GPU host (full stack)

```bash
# Copy and fill in secrets
cp .env.substrate.example .env.substrate
$EDITOR .env.substrate

# Boot the GPU stack
docker compose -f docker-compose.gpu.yml up
```

### No GPU (CPU stub fallback)

```bash
docker compose -f docker-compose.gpu.yml -f docker-compose.cpu-stub.yml up
```

All API contracts are identical; responses use deterministic stubs in CPU mode.

### Without Docker (Python directly)

```bash
# substrate-inference
cd apps/substrate-inference
pip install -r requirements.txt
SUBSTRATE_INFERENCE_PORT=8070 python -m src.main

# substrate-py-workers (separate terminal)
cd services/substrate-py-workers
pip install -r requirements.txt
PORT=8090 python -m worker.main
```

---

## Health Endpoints

### substrate-inference

| Endpoint | Use | Returns 503 when |
|---|---|---|
| `GET /health` | Liveness | Never (always 200 while running) |
| `GET /ready` | Readiness | Engine initialising \| default model not loaded \| queue saturated |

### substrate-py-workers

| Endpoint | Use | Returns 503 when |
|---|---|---|
| `GET /health` | Liveness | Never (always 200 while running) |
| `GET /ready` | Readiness | Draining \| at capacity |
| `GET /metrics` | Autoscaling | N/A (always 200) |
| `GET /workers` | Fleet view | N/A |

---

## Autoscaling

Autoscaling operates at two layers:

1. **AutoscalingPolicy (Python)** — evaluates `active_claims`, `available_slots`,
   and idle time. Emits `scale-out`, `scale-in`, or `hold` recommendations via
   `/metrics`. No cloud calls; pure in-process logic.

2. **KEDA / VMSS (Azure)** — polls `/metrics` and adjusts replicas:
   - Scale-out trigger: `available_slots < SCALE_OUT_QUEUE_DEPTH`
   - Scale-in trigger: KEDA cooldown + idle detection
   - Min replicas: `MIN_WORKERS` (default 1)
   - Max replicas: `MAX_WORKERS` (default 10)

Simulate autoscaling locally (no cloud):

```bash
cd services/substrate-py-workers
python -m worker.autoscaling_sim
```

Or via pytest:

```bash
pytest services/substrate-py-workers/tests/test_autoscaling_sim.py -v
```

---

## Go-Live Checklist

The following secrets must be provided to the person running `deploy-substrate.sh`
before the deployment will succeed. Without them, the script will fail loudly
before touching any Azure resources.

```
Operator must supply before running deploy-substrate.sh:
────────────────────────────────────────────────────────────────
☐  ACR_LOGIN_SERVER          Azure Container Registry login server
                              e.g. szlholdingsacr.azurecr.io
☐  AZURE_SUBSCRIPTION_ID     Azure subscription ID (uuid)
☐  AZURE_RESOURCE_GROUP      Resource group name
☐  SUBSTRATE_API_KEY         New random secret for the inference API
                              Suggested: openssl rand -hex 32
────────────────────────────────────────────────────────────────

Optional but recommended for monitoring:
☐  OTEL_EXPORTER_OTLP_ENDPOINT   OpenTelemetry collector endpoint
☐  SUBSTRATE_DEFAULT_MODEL        Model to auto-load (default: llama-3.3-70b-instruct)

After deployment:
☐  Verify SUBSTRATE_PYTHON_WORKER_URL is set in the API server's
   Container App environment variables to point at the new worker FQDN.
☐  Verify /health and /ready pass for both services (done by smoke).
☐  Set SUBSTRATE_API_KEY in the API server environment to match.
```

See `infra/runbooks/` for detailed step-by-step runbooks.
