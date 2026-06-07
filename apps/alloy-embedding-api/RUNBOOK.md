# RUNBOOK — alloy-embedding-api `/v1/hybrid-search` on the real stack

This route now wires the real embedder (bge-m3), the real pgvector store (cosine
ANN + Postgres FTS), the real reciprocal-rank-fusion retriever, and the real
governance ledger into one shipping request path. This runbook is what Stephen
runs on his laptop to take it from the in-memory dev default to the real
pgvector path.

## What changed (the wiring)

`apps/alloy-embedding-api/src/routes/hybrid-search.ts` previously:
- embedded with the dev-hash backend, and
- fabricated `synthetic-chunk-*` dense + keyword hits.

It now:
- selects the **real embedder** (`external-http` → bge-m3, 1024-dim) when
  `SUBSTRATE_EMBED_URL` is set, falling back to dev-hash only when it is not;
- queries the **real store** for real hits — pgvector when `DATABASE_URL` is set,
  in-memory for local dev — via the shared `VectorStore` / `MetadataIndexStore`
  interfaces;
- keeps the governance envelope intact: `PolicyEngine.evaluate` gate +
  one `EvidenceEntry` appended to the ledger per returned chunk, now stamped
  with `backendId = "<embedBackend>+<storeBackend>"`.

The RRF fusion, exact-match boost, rerank, and citation assembly were already
real (`@workspace/aef-retrieval-core`) and are unchanged.

## Modes at a glance

| Env state                                   | Embedder            | Store      |
|----------------------------------------------|---------------------|------------|
| nothing set (sandbox/dev default)            | dev-hash (384-dim)  | in-memory  |
| `SUBSTRATE_EMBED_URL` set                    | bge-m3 (1024-dim)   | in-memory  |
| `DATABASE_URL` set                           | dev-hash            | pgvector   |
| both set (production)                        | bge-m3 (1024-dim)   | pgvector   |

Force in-memory even with a DB present: `AEF_STORE_BACKEND=in-memory`.

## Requirements

- Node >= 24, pnpm 10.x (repo `packageManager`).
- For the real store: Postgres 15+ with the `pgvector` extension.
- For the real embedder: an HTTP embedding service exposing `POST /embed`
  returning `{ vectors: number[][], model, dimensions }`. The repo ships one:
  `services/substrate-py-workers` (FastAPI). It must load a real model
  (`BAAI/bge-m3`) — the default `aef_endpoints.py` dev embedder is SHA-256 hash;
  swap it for a SentenceTransformer/bge-m3 backend (CPU works; GPU is faster).

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
# in services/substrate-py-workers, replace the dev-hash _hash_embed with a real
# model (see aef_endpoints.py docstring) and serve:
#   model: BAAI/bge-m3   dim: 1024
export SUBSTRATE_EMBED_URL="http://localhost:9800"
export HF_EMBED_MODEL="BAAI/bge-m3"
export VECTOR_DIM=1024
# optional bearer:
# export SUBSTRATE_EMBED_API_KEY="..."
```

bge-m3 runs on CPU (slower) or GPU. No GPU is required to be correct — only to
be fast. If the laptop has no GPU, run it CPU-only; the code path is identical.

## Step 4 — Ingest a corpus

Each `aef_rag_chunks` row needs: `chunk_id, source_id, tenant_id, model,
dimensions, embedding (bge-m3 vector), text`, and optional `title/page/section/
metadata`. Use the ingestion-orchestrator (`/orchestrator`) or insert directly.
A minimal direct insert (vectors come from the embedder you stood up in step 3):

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
- The default `services/substrate-py-workers/aef_endpoints.py` embedder is still
  the SHA-256 dev hash; step 3 requires swapping it for a real bge-m3 backend.
  The TypeScript side is fully wired to call it — the model swap is the one
  remaining runtime piece, and it is documented, not faked.
