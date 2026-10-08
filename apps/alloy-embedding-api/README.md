# Alloy Embedding Fabric — REST API Gateway

AEF Phase 3: REST API gateway for embedding, reranking, hybrid-search, ingestion, index operations, and evals.

## Quick Start

```bash
NODE_ENV=development AEF_AUTH_BYPASS=true \
  pnpm --filter @workspace/alloy-embedding-api run dev
```

The server starts on the port defined in `PORT` (default: `8766`).

## Environment Variables

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `8766` | Listening port |
| `BASE_PATH` | `/alloy-embedding-api` | URL prefix |
| `AEF_API_KEY` | none | Required bearer token; inject it through the production secret manager |
| `AEF_API_TENANT_ID` | none | Tenant bound to that production credential; must match `X-Tenant-ID` exactly |
| `AEF_AUTH_BYPASS` | `false` | Skip bearer auth only when `NODE_ENV=development` or `test` |
| `CORS_ALLOWED_ORIGINS` | none | Exact comma-separated HTTP(S) browser origins; wildcard is rejected in production |
| `AEF_RATE_LIMIT_RPM` | `300` | Requests per minute per tenant |
| `AEF_EMBED_BATCH_SIZE` | `32` | Micro-batch flush size |
| `AEF_EMBED_FLUSH_MS` | `20` | Micro-batch flush interval |
| `SUBSTRATE_EMBED_URL` | none | Real embed backend URL; required in production unless `HF_EMBED_URL` is set |
| `SUBSTRATE_EMBED_PATH` | `/embed` | Request path exposed by the configured substrate backend |
| `SUBSTRATE_EMBED_API_KEY` | none | Internal bearer credential; required with a production substrate URL and deployed with the same value as `SUBSTRATE_PYTHON_WORKER_API_KEY` |
| `SUBSTRATE_EMBED_TENANT_ID` | none | Internal bound tenant; required with a production substrate URL and deployed with the same value as `SUBSTRATE_PYTHON_WORKER_TENANT_ID` |
| `HF_EMBED_URL` | none | Alternative real embed backend URL |
| `HF_EMBED_PATH` | `/embed` | Request path exposed by the alternative backend |
| `HF_EMBED_MODEL_REVISION` | none | Immutable 40-hex Hugging Face commit SHA; required in production |
| `HF_EMBED_ARTIFACT_SET_DIGEST` | none | External artifact-set SHA-256; required in production |
| `AEF_EMBED_PROMOTION_STATE` | `DEVELOPMENT` | Must be `QUALIFIED` in production and proven by the backend response |
| `AEF_RERANK_ENABLED` | non-production: `true`; production: `false` | Explicitly enable the rerank lane |
| `AEF_RERANK_MODEL` | `lexical-overlap-v1` | Server-owned implementation identity; other labels are rejected |
| `SUBSTRATE_RERANK_URL` | dev: `http://localhost:9800`; production: none | Rerank backend base URL |
| `SUBSTRATE_RERANK_API_KEY` | none | Internal rerank bearer credential; required in production and deployed with the same value as the Python worker's `SUBSTRATE_PYTHON_WORKER_API_KEY` |
| `SUBSTRATE_RERANK_TENANT_ID` | none | Server-bound internal rerank tenant; required in production and deployed with the same value as `SUBSTRATE_PYTHON_WORKER_TENANT_ID` |
| `AEF_RERANK_MODEL_REVISION` | none | Immutable 40-hex revision required for production reranking |
| `AEF_RERANK_ARTIFACT_SET_DIGEST` | none | SHA-256 artifact-set digest required for production reranking |
| `AEF_RERANK_PROMOTION_STATE` | `DEVELOPMENT` | Must be `QUALIFIED` and proven by the production backend |
| `DATABASE_URL` | none | Required for production hybrid retrieval; selects pgvector |
| `AEF_STORE_BACKEND` | automatic | `in-memory` is admitted only outside production; `pgvector` requires `DATABASE_URL` |

## Endpoints

The process fails at startup when no `AEF_API_KEY` is configured. Production
also requires a valid HTTP(S) `SUBSTRATE_EMBED_URL` or `HF_EMBED_URL`; it never
silently promotes the development hash backend. A production backend must also
be configured as `QUALIFIED` with an immutable 40-hex model commit and a 64-hex
artifact-set SHA-256. Every readiness inference must prove that same promotion
state, revision, and digest. The only authentication exception is the explicit
`AEF_AUTH_BYPASS=true` mode, which is rejected unless `NODE_ENV` is
`development` or `test`. Never bake the key into an image or source-controlled
environment file.

Requests to a configured substrate embedder carry its internal bearer
credential and `X-Tenant-ID`. The Python worker validates those independently
from the public AEF API credential and tenant boundary.

Every operational endpoint requires `Authorization: Bearer <token>` unless the
development/test-only bypass is active. Every protected request must also carry
a non-empty `X-Tenant-ID` header matching both the credential-bound
`AEF_API_TENANT_ID` and any `tenantId` in the body or query; there is no default
tenant. `/healthz`, `/readyz`, and the base-path health, metrics, and OpenAPI
document are public probe/documentation surfaces.

Production reranking is disabled unless explicitly enabled with a qualified
external backend. A requested disabled rerank returns 503; an unavailable or
identity-drifting backend returns 502. The deterministic lexical fallback is
available only in development/test and its receipt always says
`promotionState=DEVELOPMENT` and `fallback=true`.
The gateway authenticates each Python rerank request with the configured bearer
credential and `X-Tenant-ID`; the worker validates those against its shared key
and production-bound tenant.

Stateful ingest, index, eval, and approval-resume workflows are not admitted in
production yet. Their checked-in run/checkpoint/approval/audit stores and ingest
idempotency boundary are process-local, so those routes return HTTP 503 with
`DURABLE_ORCHESTRATOR_STATE_REQUIRED`. This is an explicit release hold, not a
durability claim.

The checked-in evidence ledger is also development/test-only: its default store
is process-local and neither it nor the mutable JSONL adapter is hash-chained.
Production embed, rerank, hybrid-search, and multimodal-embed requests therefore
return 503 `EVIDENCE_LEDGER_DURABILITY_REQUIRED` before inference or evidence-ID
minting. There is intentionally no environment flag that relabels these stores
as production authority.

### Embed

```bash
curl -X POST http://localhost:8080/alloy-embedding-api/v1/embed \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: my-tenant" \
  -d '{
    "requestId": "req-001",
    "tenantId": "my-tenant",
    "texts": ["What is maritime law?", "Define force majeure."],
    "model": "aef-dev-hash",
    "normalize": true
  }'
```

### Rerank

```bash
curl -X POST http://localhost:8080/alloy-embedding-api/v1/rerank \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: my-tenant" \
  -d '{
    "requestId": "req-002",
    "tenantId": "my-tenant",
    "query": "maritime law",
    "candidates": [
      {"id": "c1", "text": "Maritime law governs shipping.", "score": 0.8},
      {"id": "c2", "text": "Tax policy differs by country.", "score": 0.3}
    ],
    "topK": 2
  }'
```

### Hybrid Search

```bash
curl -X POST http://localhost:8080/alloy-embedding-api/v1/hybrid-search \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: my-tenant" \
  -d '{
    "requestId": "req-003",
    "tenantId": "my-tenant",
    "query": "force majeure maritime",
    "topK": 5,
    "denseWeight": 0.6,
    "keywordWeight": 0.4,
    "rerankEnabled": false,
    "includeProvenance": true
  }'
```

### Ingest

```bash
curl -X POST http://localhost:8080/alloy-embedding-api/v1/ingest \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: my-tenant" \
  -d '{
    "requestId": "req-004",
    "tenantId": "my-tenant",
    "documents": [
      {
        "sourceId": "doc-001",
        "content": "Maritime law is a body of law...",
        "contentType": "text/plain"
      }
    ]
  }'
```

### Index Operations

```bash
# Trigger rebuild
curl -X POST http://localhost:8080/alloy-embedding-api/v1/index/rebuild \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: my-tenant" \
  -d '{"requestId": "req-005", "tenantId": "my-tenant"}'

# Verify index
curl -X POST http://localhost:8080/alloy-embedding-api/v1/index/verify \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: my-tenant" \
  -d '{"requestId": "req-006", "tenantId": "my-tenant"}'
```

### Evals

```bash
curl -X POST http://localhost:8080/alloy-embedding-api/v1/evals/run \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: my-tenant" \
  -d '{
    "requestId": "req-007",
    "tenantId": "my-tenant",
    "profileId": "default",
    "datasetId": "eval-ds-001",
    "queries": [{"queryId": "q1", "query": "maritime law", "relevantChunkIds": ["c1"]}]
  }'
```

### OpenAI-Compatible Embeddings

```bash
curl -X POST http://localhost:8080/alloy-embedding-api/v1/openai/embeddings \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: my-tenant" \
  -d '{"input": ["maritime law", "contract law"], "model": "aef-default"}'
```

### Health & Metrics

```bash
curl http://localhost:8766/healthz
curl http://localhost:8766/readyz
curl http://localhost:8080/alloy-embedding-api/health
curl http://localhost:8080/alloy-embedding-api/metrics
curl http://localhost:8080/alloy-embedding-api/docs
```

`/healthz` reports process liveness. `/readyz` performs bounded inference against
the admitted embedding backend and, when enabled, the reranker. It returns 503
if either model contract cannot be verified, retrieval storage is not admitted,
the evidence ledger lacks durable tamper-evident authority, or stateful workflows
remain on `EVALUATION_HOLD`. The response keeps each component report separate
for diagnosis; production therefore stays unready without mislabelling
process-local state.

## Smoke Test

```bash
# Run smoke test against the running API server
AEF_API_URL=http://localhost:8080/alloy-embedding-api tsx scripts/aef-smoke.ts
```

## Architecture

```
Request
  → Bearer-token auth (conditionalAuth)
  → Tenant scoping (x-tenant-id header)
  → Per-tenant rate limit (token bucket, 300 rpm default)
  → Request tracing (generates traceId)
  → Route handler
    → Policy guard evaluation (PolicyEngine)
    → Embed worker (MicroBatchQueue → CpuLocalEmbeddingBackend → substrate-py-workers)
    → Development/test evidence recorder write (defaultLedgerStore)
  → Local structured response with traceId + non-authoritative evidenceIds
```

Production stops at the evidence-ledger admission gate before the route handler
until a durable, tamper-evident backend replaces this local recorder.

## CPU Dev Backend

The `substrate-py-workers` service exposes authenticated `/aef/embed` and
`/aef/rerank` heuristics for local development. They return deterministic
development outputs, reject invented model labels, and are unavailable in
production. A qualified production model service is a separate deployment and
must return the exact revision, artifact digest, and promotion evidence expected
by this gateway.
