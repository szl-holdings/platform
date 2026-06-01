# Alloy Embedding Fabric — REST API Gateway

AEF Phase 3: REST API gateway for embedding, reranking, hybrid-search, ingestion, index operations, and evals.

## Quick Start

```bash
cp .env.example .env
pnpm --filter @workspace/alloy-embedding-api run dev
```

The server starts on the port defined in `PORT` (default: `8766`).

## Environment Variables

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `8766` | Listening port |
| `BASE_PATH` | `/alloy-embedding-api` | URL prefix |
| `AEF_API_KEY` | (empty) | Bearer token for auth (empty = any token accepted) |
| `AEF_AUTH_BYPASS` | `false` | Skip bearer-token auth entirely |
| `AEF_RATE_LIMIT_RPM` | `300` | Requests per minute per tenant |
| `AEF_EMBED_BATCH_SIZE` | `32` | Micro-batch flush size |
| `AEF_EMBED_FLUSH_MS` | `20` | Micro-batch flush interval |
| `SUBSTRATE_EMBED_URL` | `http://localhost:9800` | CPU-local embed backend URL |
| `SUBSTRATE_RERANK_URL` | `http://localhost:9800` | CPU-local rerank backend URL |

## Endpoints

All endpoints require `Authorization: Bearer <token>` unless `AEF_AUTH_BYPASS=true`.
Tenant is set via `x-tenant-id` header or `tenantId` query param (defaults to `default`).

### Embed

```bash
curl -X POST http://localhost:8080/alloy-embedding-api/v1/embed \
  -H "Content-Type: application/json" \
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
  -d '{"requestId": "req-005", "tenantId": "my-tenant"}'

# Verify index
curl -X POST http://localhost:8080/alloy-embedding-api/v1/index/verify \
  -H "Content-Type: application/json" \
  -d '{"requestId": "req-006", "tenantId": "my-tenant"}'
```

### Evals

```bash
curl -X POST http://localhost:8080/alloy-embedding-api/v1/evals/run \
  -H "Content-Type: application/json" \
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
  -d '{"input": ["maritime law", "contract law"], "model": "aef-default"}'
```

### Health & Metrics

```bash
curl http://localhost:8080/alloy-embedding-api/health
curl http://localhost:8080/alloy-embedding-api/metrics
curl http://localhost:8080/alloy-embedding-api/docs
```

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
    → Evidence ledger write (defaultLedgerStore)
  → Structured JSON response with traceId + evidenceIds
```

## CPU Dev Backend

The `substrate-py-workers` service exposes `/aef/embed` and `/aef/rerank` for local development. These return deterministic hash-based embeddings — no model download required. Swap to a real model by following the instructions in `services/substrate-py-workers/src/worker/aef_endpoints.py`.
