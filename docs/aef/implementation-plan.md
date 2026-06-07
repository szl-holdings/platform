# Alloy Embedding Fabric — Implementation Plan

## Status: Implemented (Phase 1 — CPU-Runnable)

This document describes the implementation roadmap for the Alloy Embedding Fabric (AEF), including what has been shipped, what is deferred to later phases, and how to extend the system.

---

## Phase 1 (Shipped)

### Core Packages

| Package | Description |
|---|---|
| `@workspace/aef-contracts` | Zod schemas and TypeScript DTOs for all AEF API surfaces. Single source of truth for request/response shapes across all services. |
| `@workspace/aef-evidence-ledger` | Append-only evidence store. Every retrieval result is written here before being returned to the caller. Supports in-memory and filesystem adapters. |
| `@workspace/aef-policy-guard` | Tenant boundary enforcement, redaction rules, retention policy, and field-level security. Called on every retrieval before results are returned. |
| `@workspace/aef-retrieval-core` | Query normalizer, RRF fusion, domain-profile boost logic, metadata filter, citation builder, and embedding/reranking adapter interfaces. |
| `@workspace/aef-domain-profiles` | Versioned ProfileRegistry with staged rollout, rollback, and tenant-scoped overrides. Ships 6 starter profiles: `vessels_maritime_risk`, `lyte_governance_ops`, `terra_real_estate_intel`, `aegis_security_incident`, `prism_legal_matter`, `carlota_private_advisory`. |
| `@workspace/aef-storage-adapters` | Unified storage interface covering RawDocs, Chunks, Vectors, MetadataIndex, EvalFixtures. Working in-memory and local-fs adapters. Stubs for pgvector, Azure AI Search, and object storage. |
| `@workspace/aef-workflow-runtime` | Deterministic workflow state machine with checkpoint, retry, approval interrupts, and resumable execution. Ships 5 workflows and 8 actor roles. |
| `@workspace/aef-evals` | Eval harness with nDCG, recall, precision, MRR, latency, and evidence-completeness metrics. 6 golden fixture sets (one per vertical). |

### Services

| Service | Port | Description |
|---|---|---|
| `alloy-fabric-api` | 4200 | Primary REST API gateway. All `/v1/*` endpoints, bearer auth, tenant scoping, OpenAI-compat route. |
| `alloy-fabric-ingest-control` | 4201 | Ingestion orchestration. Runs workflow state machines with approval gates. |

### Workers

| Worker | Port | Description |
|---|---|---|
| `alloy-vector-worker` | 4202 | Dense embedding micro-batch worker. LocalCpuBackend by default; seams for ExternalHttpBackend, FutureGpuBackend, FutureAzureBackend. |
| `alloy-rank-worker` | 4203 | Cross-encoder reranking worker. Lightweight fallback mode (score inversion) when no model is loaded. |

---

## Phase 2 (Planned)

### Storage Layer Upgrades
- **pgvector adapter** — Drop the in-memory vector store; use PostgreSQL + pgvector for persistent, ACID-safe vectors.
- **Azure AI Search adapter** — Full hybrid search (semantic + keyword) with built-in RRF support.
- **Object storage adapter** — Raw document storage in S3/Azure Blob using the `@workspace/object-storage` integration.

### Embedding Layer Upgrades
- **FutureGpuBackend** — Run ONNX-exported sentence-transformer models on GPU. Activate by setting `AEF_EMBED_BACKEND=future-gpu` and mounting a model volume.
- **FutureAzureBackend** — Use Azure OpenAI text-embedding-3-large via the managed integration. Activate by setting `AEF_EMBED_BACKEND=future-azure`.

### Reranking Layer Upgrades
- **Cross-encoder model loading** — Load a real cross-encoder (e.g. `ms-marco-MiniLM`) via ONNX runtime in the rank-worker.

### Infrastructure
- **Queue-based ingestion** — Replace synchronous HTTP dispatch with a durable queue (e.g. Bull + Redis or Azure Service Bus) for large-scale ingestion.
- **Horizontal scale** — The vector and rank workers are stateless; add a load balancer and scale horizontally.
- **Kubernetes / container deployment** — Each service and worker has its own Dockerfile. Deploy to Azure AKS or GKE.

### Observability
- **Structured logging** — Replace `console.log` with a structured logger (e.g. pino or winston) with request/tenant correlation.
- **OpenTelemetry tracing** — Add trace spans per workflow step and retrieval call.
- **Prometheus metrics** — Expose Prometheus-compatible `/metrics` endpoint from all services.

---

## Extending a Domain Profile

1. Create a new file in `packages/aef-domain-profiles/src/profiles/`.
2. Export a `DomainProfile` object validated against `DomainProfileSchema`.
3. Import and register it in `packages/aef-domain-profiles/src/defaults.ts`.
4. Add golden fixtures to `packages/aef-evals/src/fixtures/` for your domain.
5. Set `AEF_PROFILE_ID` on your tenant config.

---

## Adding a Storage Adapter

All storage adapters implement the interfaces in `packages/aef-storage-adapters/src/interfaces.ts`. Steps:

1. Create a new file, e.g. `packages/aef-storage-adapters/src/pgvector.ts`.
2. Implement `RawDocStore`, `ChunkStore`, `VectorStore`, `MetadataIndexStore`.
3. Export a `createPgvectorBundle(): StorageBundle` factory.
4. Wire into the service config via the `AEF_STORAGE_ADAPTER` environment variable.

---

## Running Evaluations

```bash
# From workspace root
pnpm --filter "@workspace/aef-evals" vitest run

# Via API (requires alloy-fabric-api running)
curl -s -X POST http://localhost:4200/v1/evals/run \
  -H "Authorization: Bearer dev-insecure-key" \
  -H "X-Tenant-ID: szl-internal" \
  -H "Content-Type: application/json" \
  -d @scripts/aef/smoke-test-eval.json
```

---

## Security Considerations

- All `/v1/*` endpoints require a `Bearer` token. Use `AEF_API_KEY` for external callers and `AEF_S2S_SECRET` for service-to-service calls.
- All requests must include `X-Tenant-ID`. The tenant ID is enforced as a hard boundary on all storage reads and writes.
- Policy Guard runs on every retrieval before results are returned. Redacted fields are logged in the evidence ledger.
- Destructive operations (`rebuild_index`, `rotate_profile_version`) require `approvalRequired: true` and an explicit human approval before the workflow continues.
- No summarize-then-embed truncation is allowed. The `truncationPolicy` in each domain profile controls exactly how oversize inputs are handled.
