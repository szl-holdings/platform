# Substrate Python Worker Fleet

**Package:** `services/substrate-py-workers`
**Protocol version:** 1.0
**Runtime:** Python 3.11+, FastAPI, Pydantic v2

---

## Overview

The Python worker fleet enables the Substrate execution engine to dispatch
heavy-compute stages to dedicated Python processes instead of running them
inside the TypeScript engine. The TypeScript substrate retains full control
of the journal, policy, approval gates, and evidence graph — only stage
_execution_ is federated.

This is an opt-in extension: only stages explicitly tagged `runtime: "python"`
are dispatched to the fleet. All other stages continue to execute in-process.

---

## Architecture

```
┌─────────────────────────────────────────┐
│  TypeScript Substrate Engine            │
│  (packages/substrate)                   │
│                                         │
│  compile → journal → execute loop       │
│                │                        │
│  stage.runtime === "python"?            │
│        │  YES                           │
│        ▼                                │
│  PythonWorkerChannel.dispatch()         │
│    POST /claim → FastAPI worker         │
└─────────────────────────────────────────┘
              │  HTTP (StageClaimMessage)
              ▼
┌─────────────────────────────────────────┐
│  Python Worker Fleet                    │
│  services/substrate-py-workers          │
│                                         │
│  /claim → ClaimLoop → stage handler     │
│  /health  /ready  /workers  /metrics    │
└─────────────────────────────────────────┘
```

---

## Stage Tagging Convention

To route a stage to the Python fleet, set `runtime: "python"` on the stage
definition in your workflow:

```typescript
import { Retrieve } from "@szl/substrate";

const heavyRetrieval = Retrieve({
  id: "opportunity-audit-retrieval",
  name: "Large-Context Retrieval",
  runtime: "python",             // ← tells the engine to dispatch to the fleet
  retrieverAdapterId: "lyte-metrics-store",
  topK: 50,
  minRelevanceScore: 0.4,
  otelTags: { domain: "lyte", stageKind: "retrieval" },
});
```

The `stageKind` OTel tag (or the stageType itself) is used by the worker to
select the correct handler from `STAGE_REGISTRY`.

### Retriever adapters (real index)

`retrieverAdapterId` resolves to a registered backend in
`worker/adapters/retriever.py` (mirrors the
`packages/nvidia-adapters/src/nim-endpoint.ts` pattern). Each adapter has
a `baseUrl` (overridable via `baseUrlEnvVar`), an `apiKeyEnvVar`, and a
`queryPath`. The retrieval stage POSTs:

```http
POST {baseUrl}{queryPath}
Authorization: Bearer ${apiKey}

{ "query": "...", "topK": 20, "minRelevanceScore": 0.4, "filters": {} }
```

and expects `{ "documents": [{ "id", "content", "relevanceScore", "source", "metadata" }, ...] }`.

Predefined adapter ids: `lyte-metrics-store`, `lyte-retriever`,
`signal-retriever`. Register more with
`retriever_adapter_manager.register(RetrieverAdapterConfig(...))`.

The `lyte-metrics-store` and `lyte-retriever` ids resolve to the standalone
`services/lyte-metrics-store` FastAPI service (see its `README.md` for the
wire contract, auth model, and corpus). In production set:

```bash
LYTE_METRICS_STORE_URL=http://lyte-metrics-store.internal:8081
LYTE_METRICS_STORE_API_KEY=<bearer-token>
```

The same env vars feed the substrate Python worker fleet (which is the
client) and the Lyte metrics store service (which validates the bearer).
Locally the service binds to `PORT` (default `8081`) and accepts unauthenticated
calls from `127.0.0.1` so dev runs work without a key.

**Live-mode contract:**

- If a `retrieverAdapterId` is configured and the endpoint responds, those
  documents become the corpus.
- If the adapter is unavailable (unknown id, missing API key, HTTP error)
  the stage **fails closed** — it does not silently fabricate synthetic
  documents into Opportunity Audit / Executive Brief evidence chains.
- Synthetic-corpus fallback runs only in `dry-run` / `replay` /
  `counterfactual` modes, or when an operator sets
  `SUBSTRATE_RETRIEVAL_ALLOW_SYNTHETIC=1` for local development.

### Stage kinds → handlers

| `stageKind` (or `stageType`)        | Handler module          | Used by             |
|--------------------------------------|-------------------------|---------------------|
| `retrieval`, `retrieve`              | `stages/retrieval.py`   | Lyte, Pulse         |
| `ocr`, `doc-chunking`, `clause-extraction` | `stages/ocr.py`  | PRISM Counsel (incl. scanned PDFs via pdfminer / tesseract) |
| `geospatial`, `geo`, `intersection`, `anomaly-detection` | `stages/geospatial.py` | Vessels, Terra |
| `eval_grading`, `eval-grading`, `grading`, `scoring` | `stages/eval_grading.py` | Eval Console |

---

### OCR engine selection (PRISM Counsel)

The OCR stage handles three flavors of input on each document:

| Input field | Engine | Notes |
|---|---|---|
| `text` or `content` | none (`text`) | Pass-through; no OCR needed |
| `bytes_b64` with `mimeType: application/pdf` (or `%PDF-` magic) | `pdfminer.six`, then `pdf2image` + `pytesseract` if no text layer | First tries the embedded text layer; for scanned / image-only PDFs falls back to rasterizing each page with poppler (`pdftoppm`) and running tesseract |
| `bytes_b64` with `mimeType: image/*` (PNG/JPEG/TIFF magic) | `pytesseract` → `tesseract` | Requires the `tesseract` binary; CPU-only |
| Anything else with `bytes_b64` | placeholder | Emits `[OCR unavailable for binary document <id>]` |

The per-stage output now includes an `ocrEngines` map summarizing how many
documents each engine handled, e.g. `{ "pdfminer": 1, "text": 2 }`. Each
emitted chunk also carries an `ocrEngine` tag for downstream evidence.

Image-only / scanned PDFs are supported via `pdf2image` (which shells out to
`pdftoppm` from poppler) followed by per-page `pytesseract`. The fallback
runs only when the pdfminer text-layer extractor returns an empty string,
keeping the fast path fast for born-digital PDFs. If poppler or tesseract is
missing from the runtime, the stage gracefully degrades to a clearly-marked
placeholder so the failure mode is visible to operators.

---

## Wire Protocol

Protocol version: **1.0** (defined in `packages/substrate/src/python-worker.ts`
and mirrored in `services/substrate-py-workers/src/worker/protocol.py`).

### Claim request (TypeScript → Python)

```json
POST /claim
Content-Type: application/json

{
  "protocolVersion": "1.0",
  "messageId": "<uuid>",
  "timestamp": "<ISO-8601>",
  "type": "stage.claim",
  "workerId": "substrate-ts-engine",
  "runId": "<run-uuid>",
  "workflowId": "<workflow-id>",
  "stageId": "<stage-id>",
  "stageType": "Retrieve",
  "stageConfig": { "stageKind": "retrieval", "topK": 20, "minRelevanceScore": 0.5 },
  "input": { "query": "..." },
  "budgetConfig": { "escalateAt": 0.9, "requireHumanBelow": 0.3 },
  "traceId": "<otel-trace-id>",
  "traceparent": "00-<trace-id>-<span-id>-01",
  "mode": "live"
}
```

### Success response (Python → TypeScript)

```json
{
  "protocolVersion": "1.0",
  "type": "stage.result",
  "workerId": "py-worker-<id>",
  "runId": "<run-uuid>",
  "stageId": "<stage-id>",
  "output": { ... },
  "confidence": 0.92,
  "durationMs": 340,
  "otelSpanId": "<hex-span-id>",
  "evidenceIds": [],
  "metadata": {}
}
```

### Error response

```json
{
  "protocolVersion": "1.0",
  "type": "stage.error",
  "workerId": "py-worker-<id>",
  "runId": "<run-uuid>",
  "stageId": "<stage-id>",
  "errorCode": "STAGE_EXECUTION_ERROR",
  "errorMessage": "...",
  "retryable": true,
  "durationMs": 12
}
```

**Live-mode fail-closed:** The TypeScript channel throws if
`SUBSTRATE_PYTHON_WORKER_URL` is not set in live mode, preventing simulation
fallback from producing evidence chains over fabricated data.

---

## Autoscaling and Drain Behavior

### Scale-out

The fleet scales out when `total_available_slots < SCALE_OUT_QUEUE_DEPTH`
(default: 3). The coordinator polls `/metrics` on each worker and applies
`AutoscalingPolicy.evaluate()` to decide the desired fleet size.

Environment variables:

| Variable | Default | Purpose |
|---|---|---|
| `WORKER_MAX_CONCURRENCY` | `4` | Max concurrent claims per worker |
| `SCALE_OUT_QUEUE_DEPTH` | `3` | Queue depth threshold to trigger scale-out |
| `SCALE_IN_IDLE_SECONDS` | `120` | Idle seconds before scale-in |
| `MAX_WORKERS` | `10` | Fleet ceiling |
| `MIN_WORKERS` | `1` | Fleet floor |

### Graceful drain (scale-in / SIGTERM)

1. Platform sends `SIGTERM` to the target worker.
2. The SIGTERM handler calls `ClaimLoop.drain()`.
3. `_draining = True` is set; `/ready` begins returning `503` so the load-
   balancer stops sending new claims.
4. In-flight stages are awaited for up to `WORKER_DRAIN_TIMEOUT_S` (default 60 s).
5. The process exits once the active claim count reaches 0.

**Duplicate execution prevention:** The TypeScript engine uses optimistic
locking on the journal — a stage can only transition from `pending → running`
once. Even if two workers race to claim the same stage, only one will succeed
at the journal layer. The Python `ClaimLoop` also rejects duplicate
`(runId, stageId)` pairs at the worker level as a belt-and-suspenders guard.

### Horizontal scale test

The test suite in `tests/test_concurrent.py` spins up N=3 concurrent claims
against a single in-process worker and asserts:
- All three claims complete without error.
- No duplicate execution occurs for the same `(runId, stageId)`.
- Capacity enforcement: a second concurrent claim to a `maxConcurrency=1`
  worker is rejected with `WORKER_UNAVAILABLE`.
- Drain: new claims are rejected while the worker is draining.

---

## OpenTelemetry Integration

Python stages join the same OTel trace as their TypeScript parent.

1. The TypeScript engine encodes the active span as a W3C `traceparent` header
   and includes it in the `StageClaimMessage`.
2. The Python worker extracts the context with `opentelemetry.propagate.extract`
   and starts a child span via `stage_span()` in `worker/telemetry.py`.
3. The child span's `spanId` is returned in `StageResultMessage.otelSpanId` so
   the TypeScript engine can stitch it into the run timeline.

Configure the exporter endpoint:

```bash
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317
```

Without the endpoint configured, spans are emitted to stdout (console exporter).

---

## Execution Modes

All four stages support the same modes as TypeScript stages:

| Mode | Behaviour |
|---|---|
| `live` | Real execution; fail-closed if worker unreachable |
| `dry-run` | Returns empty output envelope; no computation |
| `replay` | Re-executes with original inputs; verifies `replayHash` |
| `counterfactual` | Executes like live but accepts model/policy substitutions |

### Replay hash verification

Each stage computes a deterministic SHA-256 hash over its key inputs:

- **retrieval** — `{query, topK, minScore}`
- **ocr** — `id`, first 32 chars of each document's text, and the SHA-256 of
  the full `bytes_b64` payload (so distinct binary inputs hash differently)
- **geospatial** — sorted feature and zone IDs
- **eval\_grading** — sorted case IDs + scoringFn + passMark

The first run records the hash in evidence. On replay, the hash is re-derived
and compared; a mismatch fails the stage with a descriptive error so engineers
know the input has drifted.

---

## Adding a New Heavy-Compute Stage

1. Create `services/substrate-py-workers/src/worker/stages/my_stage.py`.
2. Export `async def execute(claim: dict) -> dict` — the function receives the
   raw claim dict and must return a dict that will become `StageResultMessage.output`.
3. Register the handler in `stages/__init__.py`:
   ```python
   from .my_stage import execute as execute_my_stage
   STAGE_REGISTRY["my_stage"] = execute_my_stage
   ```
4. Add `runtime: "python"` and `otelTags: { stageKind: "my_stage" }` to the
   TypeScript stage definition.
5. Add replay hash tests in `tests/test_replay.py` using the same pattern as
   the existing four stages.
6. Document the `input` / `output` contract at the top of the module.

---

## Running the Worker Locally

```bash
cd services/substrate-py-workers
pip install -e ".[dev]"

# Start one worker
PORT=8090 uvicorn worker.main:app --host 0.0.0.0 --port 8090

# Point the TS engine at it
SUBSTRATE_PYTHON_WORKER_URL=http://localhost:8090 \
  node packages/substrate/dist/engine.js
```

### Run tests

```bash
cd services/substrate-py-workers
pytest -v tests/
```

### Simulate N=3 fleet locally

```bash
PORT=8090 uvicorn worker.main:app &
PORT=8091 WORKER_ID=py-worker-2 uvicorn worker.main:app &
PORT=8092 WORKER_ID=py-worker-3 uvicorn worker.main:app &
```

---

## Load-Balancing the Fleet

In production the TypeScript engine **must not** point
`SUBSTRATE_PYTHON_WORKER_URL` at any single worker — that worker becomes a
single point of failure and cannot be replaced without downtime. Instead,
point it at a load-balancer that fronts the fleet and round-robins POST
`/claim` across all healthy workers.

Three reference configurations are committed in
`services/substrate-py-workers/deploy/`:

| File | Topology |
|---|---|
| `nginx.conf` | Standalone nginx in front of N worker processes |
| `Caddyfile` | Standalone Caddy with native active health checks against `/ready` |
| `k8s-service.yaml` | Kubernetes `Service` + `Deployment` with `readinessProbe` driving Endpoints membership |

All three apply the same contract:

1. **Round-robin** POST `/claim` across `py-worker-1..N` (default 3 workers
   on ports `8090–8092`).
2. **Active health checks** poll `GET /ready` every 5 s with a 2 s timeout.
   A worker that returns `503` (draining or at capacity) is removed from
   rotation immediately.
3. **Passive health checks** as a fallback: 2 consecutive 5xx responses
   take a worker offline for 10–30 s.
4. **Retry on the next upstream** (`proxy_next_upstream` / `lb_try_duration`)
   so a single worker failure surfaces to the engine as a successful claim
   on a different worker, not as a hard error.
5. **Long read timeouts** (120 s) because heavy stages (OCR, geospatial)
   can take tens of seconds.

### Pointing the engine at the load-balancer

Set `SUBSTRATE_PYTHON_WORKER_URL` to the LB address (port `8080` in the
bundled configs), **not** to any individual worker:

```bash
# Local nginx / Caddy
SUBSTRATE_PYTHON_WORKER_URL=http://substrate-py-lb:8080

# Kubernetes Service DNS
SUBSTRATE_PYTHON_WORKER_URL=http://substrate-py-workers.default.svc.cluster.local:8080
```

The TS engine still calls `POST {URL}/claim` exactly as documented in the
wire protocol — the load-balancer is transparent.

### Startup runbook

1. Start `MIN_WORKERS` (default 3) worker processes/Pods. Each binds its
   own `PORT` and exposes `/health`, `/ready`, `/claim`, `/metrics`.
2. Start the load-balancer:
   - **nginx:** `nginx -c $(pwd)/services/substrate-py-workers/deploy/nginx.conf -g 'daemon off;'`
   - **Caddy:** `caddy run --config services/substrate-py-workers/deploy/Caddyfile`
   - **Kubernetes:** `kubectl apply -f services/substrate-py-workers/deploy/k8s-service.yaml`
3. Verify the LB sees a healthy fleet:
   ```bash
   curl http://substrate-py-lb:8080/ready          # → 200
   curl http://substrate-py-lb:8080/workers        # → fleet view
   ```
4. Set `SUBSTRATE_PYTHON_WORKER_URL` on the TypeScript engine and start it.

### Failover behaviour

| Event | What the LB does | What the engine sees |
|---|---|---|
| Worker crashes | Connect/read fails → `proxy_next_upstream` retries on next worker; passive check takes the dead worker out of rotation for `fail_timeout` | One successful `stage.result` (transparent) |
| Worker hits `WORKER_MAX_CONCURRENCY` | `/ready` returns `503` → active health check removes worker from pool until a slot frees up | No degradation — claim lands on a different worker |
| Rolling deploy / scale-in | Platform sends `SIGTERM` → `ClaimLoop.drain()` → `/ready` returns `503` → LB stops sending new claims; in-flight claims drain for up to `WORKER_DRAIN_TIMEOUT_S` | One successful `stage.result` on the replacement worker; no failed claims |
| All workers unreachable | LB returns `502` after `proxy_next_upstream_tries` exhausted | In `live` mode the engine fails closed (per `python-worker.ts` policy); in non-live modes it falls back to in-process simulation |

### Replacing a worker without downtime

```bash
# 1. Bring up the replacement first (k8s rolling update does this automatically).
PORT=8093 WORKER_ID=py-worker-4 uvicorn worker.main:app &

# 2. Add it to the LB upstream block (or let the k8s Deployment scale up).

# 3. Drain the worker you want to remove. Its /ready will start returning 503
#    and the LB will stop sending it new claims within one health-check cycle.
kill -TERM $OLD_WORKER_PID

# 4. Wait for active claims to finish (≤ WORKER_DRAIN_TIMEOUT_S, default 60 s).
#    The process exits on its own once active_claims == 0.
```

No engine restart, no env var change, no claim loss.
