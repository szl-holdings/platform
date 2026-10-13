# RUNBOOK — alloy-embedding-api `/v1/hybrid-search` on the real stack

This route can wire a qualified external embedder, pgvector store (cosine ANN +
Postgres FTS), reciprocal-rank-fusion retriever, and governance ledger into one
request path. The external model and pgvector dependencies must be provisioned
and verified as described below; the repository does not bundle BGE-M3 model
weights or claim that its deterministic Python development helper is BGE-M3.

## What changed (the wiring)

`apps/alloy-embedding-api/src/routes/hybrid-search.ts` previously:
- embedded with the dev-hash backend, and
- fabricated `synthetic-chunk-*` dense + keyword hits.

It now:
- selects the external HTTP backend when `SUBSTRATE_EMBED_URL` is set, falling
  back to dev-hash only in non-production when no external URL is configured;
- queries the **real store** for real hits — pgvector when `DATABASE_URL` is set,
  in-memory for local dev — via the shared `VectorStore` / `MetadataIndexStore`
  interfaces;
- keeps the development/test governance envelope intact: `PolicyEngine.evaluate`
  gate plus one process-local `EvidenceEntry` per returned chunk, stamped with
  `backendId = "<embedBackend>+<storeBackend>"`. Production is held before this
  path because the recorder is not authoritative.

The RRF fusion, exact-match boost, rerank, and citation assembly were already
real (`@workspace/aef-retrieval-core`) and are unchanged.

## Modes at a glance

| Env state                                   | Embedder            | Store      |
|----------------------------------------------|---------------------|------------|
| nothing set (sandbox/dev default)            | dev-hash (384-dim)  | in-memory  |
| qualified external URL + identity set (dev)  | configured model    | in-memory  |
| `DATABASE_URL` set (dev)                     | dev-hash            | pgvector   |
| both qualified external + DB set             | configured model    | pgvector   |

Force in-memory even with a DB present only outside production:
`AEF_STORE_BACKEND=in-memory`. Production hybrid retrieval fails closed unless
`DATABASE_URL` selects pgvector.

## Requirements

- Node >= 24, pnpm 10.x (repo `packageManager`).
- For the real store: Postgres 15+ with the `pgvector` extension.
- For the external embedder: an HTTP service exposing the configured request
  path and returning vectors plus exact model, revision, artifact digest, and
  promotion-state evidence. `services/substrate-py-workers` exposes
  `/aef/embed`, but its checked-in implementation is deliberately a SHA-256
  development heuristic and is rejected in production. It is not a BGE-M3
  runtime or a qualified model service.

## Step 1 — Provision Postgres + pgvector

```bash
# local docker
docker run -d --name aef-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 pgvector/pgvector:pg16
export DATABASE_URL="postgres://postgres:postgres@localhost:5432/postgres"
```

## Step 2 — Apply the migration

The schema lives at `packages/db-migrations/sql/0001_aef_pgvector.sql`
(creates the `vector` extension, the `aef_rag_chunks` table, the ivfflat cosine
index, and the FTS gin index). Apply it directly:

```bash
psql "$DATABASE_URL" -f packages/db-migrations/sql/0001_aef_pgvector.sql
```

The vector column is `vector(1024)` to match bge-m3. If you change
`HF_EMBED_MODEL`/`VECTOR_DIM`, change the column dimension to match and re-ingest.

## Step 3 — Stand up the real embedder (bge-m3)

```bash
# Deploy a model service that serves the exact admitted artifact. If adapting
# substrate-py-workers, replace its development implementation and retain its
# /aef/embed route; do not relabel the checked-in dev hash.
export SUBSTRATE_EMBED_URL="http://localhost:9800"
export SUBSTRATE_EMBED_PATH="/aef/embed"
export HF_EMBED_MODEL="BAAI/bge-m3"
export HF_EMBED_MODEL_REVISION="<40-hex-hugging-face-commit-sha>"
export HF_EMBED_ARTIFACT_SET_DIGEST="<64-hex-sha256-of-admitted-artifact-set>"
export AEF_EMBED_PROMOTION_STATE="QUALIFIED"
export VECTOR_DIM=1024
# Required for the substrate Python worker; inject both from the secret manager.
export SUBSTRATE_EMBED_API_KEY="<same value as SUBSTRATE_PYTHON_WORKER_API_KEY>"
export SUBSTRATE_EMBED_TENANT_ID="<same value as SUBSTRATE_PYTHON_WORKER_TENANT_ID>"
```

The backend response must prove the same revision, artifact digest, and
`QUALIFIED` state or startup readiness remains HTTP 503. BGE-M3 can run on CPU
(slower) or GPU; hardware does not relax the identity checks.

## Step 4 — Load a corpus

Each `aef_rag_chunks` row needs: `chunk_id, source_id, tenant_id, model,
dimensions, embedding (bge-m3 vector), text`, and optional `title/page/section/
metadata`. The checked-in ingestion orchestrator is development-only because
its runs, checkpoints, approvals, audit events, and request-id reservations are
process-local. Production workflow routes return 503 `EVALUATION_HOLD`; use a
separately governed database load until durable workflow state and idempotency
are implemented and proven. A minimal direct insert (vectors come from the
embedder you stood up in step 3):

```sql
INSERT INTO aef_rag_chunks
  (chunk_id, source_id, tenant_id, model, dimensions, embedding, text, title)
VALUES
  ('c1', 's1', 'acme', 'BAAI/bge-m3', 1024, '[...1024 floats...]'::vector,
   'Hybrid retrieval fuses dense and keyword search via RRF.', 'Hybrid Retrieval');
```

## Step 5 — Run the API and query

```bash
cd apps/alloy-embedding-api
pnpm dev   # or: pnpm build && pnpm start

curl -s localhost:8766/alloy-embedding-api/v1/hybrid-search \
  -H 'content-type: application/json' \
  -H "authorization: Bearer $AEF_API_KEY" \
  -H 'x-tenant-id: acme' \
  -d '{"requestId":"r1","tenantId":"acme","query":"hybrid retrieval rrf","topK":3}' | jq
```

The response `backends` block reports which layers served the request:
`{ embedModel, embedBackend, embedReal, retrievalBackend }`. With steps 1–4 done
it reads `embedBackend: "external-http"`, `embedReal: true`,
`retrievalBackend: "pgvector"`. Each hit carries an `evidenceId` and (when
`includeProvenance`) the full `evidence` entry; the ledger holds one entry per
hit, keyed by `requestId`.

## Verify the wiring (integration test)

```bash
cd apps/alloy-embedding-api
pnpm vitest run src/__tests__/hybrid-search.integration.test.ts
```

This asserts every layer fired: embedder → store (real ingested rows, never
`synthetic-chunk-*`) → RRF → PolicyEngine → per-chunk `EvidenceEntry` in the
ledger. It runs against the in-memory store in CI/sandbox (no Postgres); the
identical route + embedder + RRF + ledger code runs against pgvector once steps
1–4 are in place — only the `StorageBundle` implementation differs.

## Honest gaps

- The integration test runs against the in-memory store, not pgvector, because
  the sandbox has no Postgres. The pgvector adapter SQL is the proven shape from
  `lib/ai-engine/src/rag-vector-store.ts` (cosine `<=>`, `ts_rank_cd`), but its
  end-to-end execution must be verified once on a real Postgres (steps 1–5).
- The default `services/substrate-py-workers/aef_endpoints.py` embedder is the
  SHA-256 development heuristic and cannot be promoted or used in production.
  Step 3 requires a separately implemented and qualified BGE-M3 backend.
- The checked-in lexical reranker is a development heuristic, not a cross
  encoder. Production reranking defaults disabled and requires its own qualified
  immutable backend receipt plus an internal credential/tenant binding.
- The default evidence ledger is process-local; the JSONL adapter is mutable and
  not hash-chained. Production evidence-producing routes and aggregate readiness
  stay on `EVALUATION_HOLD` until a durable, tamper-evident backend is configured
  and probed. Local evidence IDs are test artifacts, not audit authority.
- Ingest retry idempotency and approval resume are not durable or atomic across
  process failure. Production stateful workflow routes are deliberately held;
  the hold closes false admission, not the underlying datastore work.
