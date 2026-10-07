# Substrate Python Worker Source Contract

**Package:** `services/substrate-py-workers`
**Protocol version:** 1.0
**Runtime:** Python 3.11+, FastAPI, Pydantic v2
**Status:** Candidate source implementation; deployment and reproducible packaging **HOLD**

> **Evidence boundary (2026-10-07):** This document describes tracked code and
> reference deployment sketches. No provider receipt establishes a running
> fleet, load balancer, autoscaler, durable completed-claim store, exact Python
> dependency graph, image digest, or production traffic. The service dependency
> files use ranges and no committed hashed service lock. Dependency-backed
> pytest could not be executed in the restricted onboarding environment because
> the required packages were unavailable. Do not describe this source as a
> production fleet, exactly-once execution, or zero-downtime deployment.

> **Production execution HOLD:** If any supported environment marker is `prod`
> or `production`, `/ready` and authenticated `/claim` return `503` before the
> process-local claim loop or a stage handler is touched. Production admission
> requires verified stage-specific qualification receipts, a shared durable
> tenant/run/stage claim-and-result store, and a durable transactional evidence
> ledger. All three capabilities are unavailable in this source.

---

## Overview

The Python worker source lets the TypeScript Substrate engine dispatch selected
heavy-compute stages to a configured Python HTTP process. In the current source
contract, the TypeScript substrate remains the policy, journal, approval, and
evidence authority; only stage _execution_ is delegated. This is an
implementation boundary, not proof that either side is deployed or durable.

This is opt-in: only stages explicitly tagged `runtime: "python"` use the
Python channel. All other stages continue to execute in-process. Live mode
fails closed when the configured worker cannot be reached; non-live modes may
use the explicitly labeled in-process simulation.

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
│  Python Worker HTTP process(es)         │
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

### Retriever adapter HTTP contract

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

The `lyte-metrics-store` and `lyte-retriever` ids resolve in source to the standalone
`services/lyte-metrics-store` FastAPI service (see its `README.md` for the
wire contract, auth model, and corpus). For a future admitted deployment,
configure:

```bash
LYTE_METRICS_STORE_URL=http://lyte-metrics-store.internal:8081
LYTE_METRICS_STORE_API_KEY=<bearer-token>
```

The same env vars feed the substrate Python worker process (which is the
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
Authorization: Bearer ${SUBSTRATE_PYTHON_WORKER_API_KEY}
X-Tenant-ID: <authenticated-tenant-id>

{
  "protocolVersion": "1.0",
  "messageId": "<uuid>",
  "timestamp": "<ISO-8601>",
  "type": "stage.claim",
  "workerId": "substrate-ts-engine",
  "runId": "<run-uuid>",
  "workflowId": "<workflow-id>",
  "tenantId": "<authenticated-tenant-id>",
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

The TypeScript authority obtains `tenantId` from its governed run context and
uses that one value for both the payload and `X-Tenant-ID`; there is no
independent transport override. The Python worker compares the header and body
tenant identities and, in production, compares them with the server-configured
`SUBSTRATE_PYTHON_WORKER_TENANT_ID` bound to that bearer credential. A mismatch
returns `403` before it claims a worker slot. Use a distinct worker deployment
and credential per tenant; a shared key plus a caller-selected tenant header is
not treated as tenant authorization. The payload field is optional only for
protocol-v1 compatibility; the tenant header is always required.

### Success response (Python → TypeScript)

```json
{
  "protocolVersion": "1.0",
  "type": "stage.result",
  "workerId": "py-worker-<id>",
  "runId": "<run-uuid>",
  "stageId": "<stage-id>",
  "output": { ... },
  "confidence": null,
  "durationMs": 340,
  "otelSpanId": "<hex-span-id>",
  "evidenceIds": [],
  "metadata": {}
}
```

`confidence` is a measured handler output or `null` with
`metadata.confidenceAssessment="UNASSESSED"`. The worker never substitutes a
default confidence. A TypeScript stage that requires confidence-based routing
rejects an unassessed result rather than treating it as evidence.

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
  "retryable": false,
  "durationMs": 12,
  "correlationId": "<operator-correlation-id>"
}
```

Stage execution failures return HTTP `500` with a stable error envelope and an
operator correlation ID. Internal exception messages remain in server-side
telemetry and are not returned to callers. Admission failures use `400` for an
invalid/missing tenant, `401` for missing/wrong bearer credentials, and `403`
for a cross-tenant mismatch.

An authenticated request under any production marker returns `503` with
`PRODUCTION_STAGE_EXECUTION_UNAVAILABLE`; it contains no stage result and is
rejected before `ClaimLoop.try_claim()` or handler resolution.

**Live-mode fail-closed:** The TypeScript channel throws if
`SUBSTRATE_PYTHON_WORKER_URL` is not set in live mode, preventing simulation
fallback from producing evidence chains over fabricated data.

---

## Capacity Recommendation and Drain Source

### Autoscaling boundary

`worker/autoscaling.py` defines an `AutoscalingPolicy` that can emit a desired
worker count from supplied reports. The current service only reports its own
capacity at `/metrics`; no tracked coordinator polls every worker, invokes
`AutoscalingPolicy.evaluate()`, or changes a deployment's replica count.
`SCALE_OUT_QUEUE_DEPTH` is declared but is not wired into an executing
coordinator. Autoscaling is therefore **NOT IMPLEMENTED / HOLD**, not an
operational fleet property.

Environment variables:

| Variable | Default | Purpose |
|---|---|---|
| `WORKER_MAX_CONCURRENCY` | `4` | Max concurrent claims per worker |
| `SUBSTRATE_PYTHON_WORKER_API_KEY` | none | Required bearer secret for the TypeScript authority and its tenant-dedicated workers |
| `SUBSTRATE_PYTHON_WORKER_TENANT_ID` | none | Production-required tenant bound to that bearer secret; configure the same value on the authority for fail-fast dispatch |
| `SUBSTRATE_PYTHON_WORKER_ENV` | `development` | Worker environment; `prod`/`production` activates the current execution HOLD |
| `SUBSTRATE_PYTHON_WORKER_AUTH_BYPASS` | unset | Explicit credential bypass accepted only in development/test |
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

**Duplicate execution boundary:** The Python `ClaimLoop` rejects a duplicate
active `(runId, stageId)` only inside one process. It does not persist completed
claims and does not coordinate multiple workers. The TypeScript stage state is
advanced before HTTP dispatch, but that does not prevent a proxy or engine
retry after a worker accepted a claim and its response was lost. Until a
durable tenant/run/stage reservation and completed-result replay contract
exists, the outcome after a lost response is ambiguous and replay is not
duplicate-safe. Candidate source sends one HTTP attempt and disables proxy
failover for `/claim`; side-effecting Python stages must not be admitted where
recovery would require an ungoverned replay.

### Concurrency test source

`tests/test_concurrent.py` defines N=3 concurrent-claim cases against one
in-process worker. That is not a three-worker, load-balancer, restart, or
ambiguous-response test. The cases assert:
- All three claims complete without error.
- No duplicate execution occurs for the same `(runId, stageId)`.
- Capacity enforcement: a second concurrent claim to a `maxConcurrency=1`
  worker is rejected with `WORKER_UNAVAILABLE`.
- Drain: new claims are rejected while the worker is draining.

---

## OpenTelemetry Integration

The source is designed for Python stages to join the TypeScript parent trace:

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

The four stage handlers define the following source-mode behavior:

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

The command below resolves dependency ranges and is for development only. It is
not a reproducible release install; promotion requires a committed exact,
hash-verified dependency graph and a clean image rebuild/SBOM receipt.

```bash
cd services/substrate-py-workers
pip install -e ".[dev]"

# Start one worker with the explicit local-only bypass
SUBSTRATE_PYTHON_WORKER_ENV=development \
SUBSTRATE_PYTHON_WORKER_AUTH_BYPASS=1 \
PORT=8090 uvicorn worker.main:app --host 0.0.0.0 --port 8090

# Point the TS engine at it
SUBSTRATE_PYTHON_WORKER_URL=http://localhost:8090 \
SUBSTRATE_PYTHON_WORKER_ENV=development \
SUBSTRATE_PYTHON_WORKER_AUTH_BYPASS=1 \
  node packages/substrate/dist/engine.js
```

The direct runner must also receive a governed `tenantId`. Deployed callers
must inject `SUBSTRATE_PYTHON_WORKER_API_KEY` and set
`SUBSTRATE_PYTHON_WORKER_TENANT_ID` to the credential's single authorized
tenant; the bypass above is intentionally rejected when the worker environment
is production.

### Run tests

```bash
cd services/substrate-py-workers
pytest -v tests/
```

### Start three independent local processes (not fleet proof)

```bash
PORT=8090 uvicorn worker.main:app &
PORT=8091 WORKER_ID=py-worker-2 uvicorn worker.main:app &
PORT=8092 WORKER_ID=py-worker-3 uvicorn worker.main:app &
```

---

## Reference Load-Balancer Sketches

The tracked proxy and Kubernetes files are deployment sketches, not admitted
production configurations. They have no exact image build, provider readback,
cross-worker idempotency store, or end-to-end failover receipt. Pointing the
engine at a proxy can remove a single address dependency, but it does not make
stage execution exactly once or zero downtime.

`POST /claim` is not currently safe to retry after an ambiguous upstream
failure. A worker may finish the stage while the response is lost; sending the
same claim to another worker can execute it again because deduplication is
process-local. Automatic cross-upstream retries must remain disabled unless a
durable tenant/run/stage reservation and result-replay contract is added.

Three reference configurations are committed in
`services/substrate-py-workers/deploy/`:

| File | Topology |
|---|---|
| `nginx.conf` | Standalone nginx in front of N worker processes |
| `Caddyfile` | Standalone Caddy with native active health checks against `/ready` |
| `k8s-service.yaml` | Kubernetes `Service` + `Deployment` with `readinessProbe` driving Endpoints membership |

They express related routing targets, with important implementation differences:

1. The examples distribute new requests among configured processes or ready
   Pods; this source behavior has not been exercised in a deployed topology.
2. Caddy and Kubernetes declare active readiness checks. Open-source nginx uses
   passive upstream failure handling; the referenced active-check sidecar is
   not present in this directory.
3. Capacity-based `/ready` can temporarily remove a busy worker, but no source
   coordinator aggregates queue depth or changes replica count.
4. Long read timeouts accommodate heavy stages but enlarge the ambiguous
   completion window; they do not prove safe failover.
5. Authentication and tenant headers must be preserved, and each credential is
   bound to one tenant in production source configuration.

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

### Candidate deployment exercise (not a production receipt)

1. Start `MIN_WORKERS` (default 3) worker processes/Pods. Each binds its
   own `PORT` and exposes `/health`, `/ready`, `/claim`, `/metrics`.
2. Start the load-balancer:
   - **nginx:** `nginx -c $(pwd)/services/substrate-py-workers/deploy/nginx.conf -g 'daemon off;'`
   - **Caddy:** `caddy run --config services/substrate-py-workers/deploy/Caddyfile`
   - **Kubernetes:** `kubectl apply -f services/substrate-py-workers/deploy/k8s-service.yaml`
3. Verify the proxy can reach at least one process:
   ```bash
   curl http://substrate-py-lb:8080/ready          # → 200 only in development/evaluation
   curl http://substrate-py-lb:8080/workers        # → fleet view
   ```
4. Set `SUBSTRATE_PYTHON_WORKER_URL` on the TypeScript engine and start it.

Before step 1, inject the same `SUBSTRATE_PYTHON_WORKER_API_KEY` secret and
`SUBSTRATE_PYTHON_WORKER_TENANT_ID` binding into the engine and tenant-dedicated
workers. For the Kubernetes example, create the externally managed
`substrate-py-workers` Secret with an `api-key` entry and ConfigMap with a
`tenant-id` entry before applying the Deployment. The committed manifest
contains only those references.

`GET /health` and `GET /ready` remain public in source for orchestrator probes.
Readiness returns `503` when security configuration is invalid and under every
production marker. In development/evaluation it labels the process as a
`stage-execution-worker` whose authority is the TypeScript Substrate and reports
dependency status as `not-asserted`; a development-ready response does not claim
that a stage-specific retriever, OCR binary, model, or other external dependency
is available.

The colocated `/aef/embed` and `/aef/rerank` routes are local smoke-test
heuristics only. They accept and emit the exact server-owned identities
`aef-dev-hash` and `lexical-overlap-v1`; requests naming any other model are
rejected. Both routes return `503` in production and therefore cannot be
admitted as real embedding or cross-encoder backends.

### Failure boundary

| Event | Source/configuration behavior | Unresolved risk |
|---|---|---|
| Worker unavailable before accepting a claim | Readiness/passive checks can steer a later new request elsewhere | No deployment test proves detection time or availability |
| Response lost after a worker accepts a claim | The caller sees an ambiguous failure | Retrying elsewhere can duplicate execution; fail closed until durable result replay exists |
| Worker reaches `WORKER_MAX_CONCURRENCY` | Its `/ready` returns `503` | Requests already selected for it can fail; no queue/dispatcher contract is proved |
| Rolling replacement | `SIGTERM` triggers process-local drain and `/ready` becomes `503` | Endpoint propagation races, forced termination, and in-flight side effects are untested |
| All workers unreachable | The TypeScript channel fails closed in `live` mode; non-live modes may simulate | This is correct truth behavior, not an availability guarantee |

### Illustrative replacement sequence

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

This sequence is an operator target, not proof of uninterrupted service or no
claim loss. Retain exact image identities, proxy/endpoint state, in-flight claim
receipts, and post-replacement semantic checks before making either claim.
