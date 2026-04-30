# Alloy Embedding Fabric (AEF)

The Alloy Embedding Fabric (AEF) is the retrieval intelligence layer of the SZL Holdings platform. It provides every product in the portfolio — Lyte, Vessels, Terra, Aegis, Counsel, and Carlota Jo — with governed, domain-aware document retrieval backed by dense embedding, hybrid search, reciprocal rank fusion, and multi-stage reranking.

AEF is not a generic RAG pipeline. Every retrieval operation runs under a named domain profile that specifies chunking parameters, query and document prompt templates, exact-match boost rules, score thresholds, privacy controls, and retention obligations. Profiles are versioned, tenant-scoped, and rotatable through the orchestrator without a service restart.

All components are CPU-runnable without a GPU. GPU and Azure AI Search adapters are seam-ready for future activation.

## Why AEF Exists

Retrieval quality degrades when domain context is absent. A query about vessel IMO numbers retrieves different signals than a query about court docket IDs, even though both are structured-identifier lookups. AEF solves this by making domain awareness a first-class retrieval primitive rather than an application-layer afterthought.

The second motivation is governance. SZL's core doctrine is that every AI decision must be auditable, reversible, and policy-bounded. AEF applies the same standard to retrieval: every chunk surfaced carries provenance metadata, every retrieval operation is recorded in the evidence ledger, and every cross-tenant access is blocked at the policy layer before results are returned.

## What AEF Is Not

AEF is not an LLM. It does not generate answers. It retrieves the evidence that downstream agents and decision engines use to form responses. This distinction matters because the evidence ledger — not the language model — is the authoritative source of what the system knew at the moment of decision.

AEF is not a monolith. The fabric is composed of discrete packages that can be deployed together or independently:

| Package | Role |
|---|---|
| `@workspace/aef-contracts` | Zod schemas and TypeScript contracts for all API shapes |
| `@workspace/aef-retrieval-core` | Pure retrieval functions: fusion, boost, filter, normalize, citations |
| `@workspace/aef-evidence-ledger` | Append-only audit store for every retrieval operation |
| `@workspace/aef-policy-guard` | Tenant boundary enforcement, redaction, retention controls |
| `@workspace/aef-domain-profiles` | Six versioned domain profiles and the model registry |
| `@workspace/aef-evals` | Retrieval evaluation harness, golden fixtures, and smoke tests |

## Core Concepts

### Domain Profiles

A domain profile is the retrieval configuration for a single business domain. It declares:

- **Chunking strategy** — how documents are segmented before indexing
- **Query prompt template** — the system prompt used to encode queries
- **Document prompt template** — the system prompt used to encode documents
- **Exact-match boost terms** — structured identifiers (IMO numbers, parcel IDs, docket IDs) that receive a score multiplier when detected in the query
- **Default metadata filters** — automatically applied to every retrieval in that domain
- **Score thresholds** — minimum relevance, high-confidence, and rerank-drop thresholds
- **Privacy level** — one of `public`, `internal`, `confidential`, `restricted`, `privileged`
- **Retention rules** — per-domain data lifecycle requirements

Profiles are versioned with semantic versioning. The active profile for a tenant is tracked by the model registry; rotation and rollback go through the orchestrator's `rotate_profile_version` workflow.

### Evidence Ledger

Every retrieval operation appends an entry to the evidence ledger. The entry records the request ID, query, chunks retrieved, chunk scores, boost rules applied, policy decisions, and the profile version active at the time. The ledger is append-only and integrity-checked. It is the primary artifact used in auditability reviews.

### Policy Guard

The policy guard runs between the retrieval layer and the result assembler. It enforces:

- Tenant boundary isolation (no cross-tenant chunk leakage)
- Privacy level controls (privileged content requires elevated clearance)
- Redaction of specified metadata fields
- Retention-policy compliance (stale chunks older than the profile's retention window are suppressed from results)

---

## Package Map

```
packages/
  aef-contracts            — Zod schemas + TypeScript DTOs for all AEF API shapes
  aef-evidence-ledger      — Append-only evidence ledger (in-memory + fs adapters)
  aef-policy-guard         — Policy engine, tenant boundary, redaction, retention
  aef-retrieval-core       — RRF fusion, boost, filter, citations, adapter interfaces
  aef-domain-profiles      — Versioned ProfileRegistry + 6 domain profiles
  aef-storage-adapters     — Unified storage interfaces + in-memory + SQLite adapters
  aef-workflow-runtime     — Deterministic state machine + 5 workflows + 8 actor roles
  aef-evals                — Eval harness, IR metrics, 6 golden fixture sets

services/
  alloy-fabric-api         — REST API gateway (port 4200)
  alloy-fabric-ingest-control — Ingestion orchestration (port 4201)

workers/
  alloy-vector-worker      — Dense embedding micro-batch worker (port 4202)
  alloy-rank-worker        — Cross-encoder reranking worker (port 4203)

docs/aef/
  ARCHITECTURE.md          — System architecture and Mermaid diagram
  implementation-plan.md   — Phase 1/2 roadmap and extension guide
  integration-summary.md   — Per-vertical integration reference

scripts/aef/
  smoke-test.sh            — End-to-end smoke test for all /v1/* endpoints
  curl-examples.sh         — curl examples for every API endpoint
```

---

## Domain Profiles

| Profile | Vertical | Key Exact-Match Classes |
|---|---|---|
| `vessels_maritime_risk` | Vessels Maritime Intelligence | IMO, MMSI, port_call_id, sanctions_entity |
| `lyte_governance_ops` | Lyte Decision Intelligence | regulation_code, control_id, audit_finding_id |
| `terra_real_estate_intel` | Terra Real Estate Intelligence | parcel_id, APN, lease_id, permit_number |
| `aegis_security_incident` | Aegis Cyber/Security | CVE_id, incident_id, MITRE_technique, endpoint_id |
| `prism_legal_matter` | Counsel | docket_number, matter_id, statute_citation, contract_id |
| `carlota_private_advisory` | Carlota Jo Consulting | engagement_id, vendor_id, deliverable_id |

---

## API Reference (Quick Start)

```bash
# Health
curl http://localhost:4200/health

# Embed
curl -X POST http://localhost:4200/v1/embed \
  -H "Authorization: Bearer dev-insecure-key" \
  -H "X-Tenant-ID: szl-internal" \
  -H "Content-Type: application/json" \
  -d '{"requestId":"r1","tenantId":"szl-internal","texts":["IMO 9123456 vessel port history"]}'

# Hybrid Search (dense + keyword, RRF fusion)
curl -X POST http://localhost:4200/v1/hybrid-search \
  -H "Authorization: Bearer dev-insecure-key" \
  -H "X-Tenant-ID: szl-internal" \
  -H "Content-Type: application/json" \
  -d '{"requestId":"r2","tenantId":"szl-internal","profileId":"vessels_maritime_risk","query":"IMO 9123456 vessel sanctions","topK":10,"includeProvenance":true}'

# OpenAI drop-in
curl -X POST http://localhost:4200/v1/openai/embeddings \
  -H "Authorization: Bearer dev-insecure-key" \
  -H "X-Tenant-ID: szl-internal" \
  -H "Content-Type: application/json" \
  -d '{"input":"vessel IMO 9123456","model":"aef-embed-cpu-v1"}'
```

See `scripts/aef/curl-examples.sh` for the full set.

---

## Running Tests

```bash
# All AEF packages
pnpm --filter "@workspace/aef-*" test

# Individual package
cd packages/aef-evals && pnpm vitest run

# Smoke test (requires alloy-fabric-api running on port 4200)
bash scripts/aef/smoke-test.sh
```

---

## Environment Variables

See `.env.example` for the full AEF section. Key variables:

| Variable | Default | Description |
|---|---|---|
| `AEF_API_KEY` | `dev-insecure-key` | Bearer token for external callers |
| `AEF_S2S_SECRET` | `dev-s2s-secret` | Service-to-service bearer token |
| `AEF_EMBED_BACKEND` | `local-cpu` | Embedding backend selection |
| `AEF_RANK_MODE` | `cross-encoder` | Reranking mode |

---

## Design Principles

1. **Evidence-first** — Every retrieval result is logged to the evidence ledger before being returned. `includeProvenance: true` includes the full ledger entry in the API response.
2. **Tenant isolation** — All storage reads and writes are scoped to `tenantId`. Cross-tenant data access is prevented at the storage adapter layer.
3. **No silent truncation** — The `truncationPolicy` in each domain profile controls exactly how oversize inputs are handled. No summarize-then-embed is allowed.
4. **Deterministic workflows** — Every ingestion, rebuild, eval, and profile rotation runs through a checkpointed state machine. Destructive operations require explicit approval before continuing.
5. **CPU-runnable** — All embedding and reranking defaults to `LocalCpuBackend`. GPU and Azure backends are adapter-seam ready and activate via environment variable.
6. **Profile-driven configuration** — Boost rules, exact-match classes, dense/keyword weights, retention, and provenance requirements are all per-profile, versioned, and rollback-safe.

## Getting Started

See `LOCAL_DEV.md` for local setup instructions, `REPLIT_GUIDE.md` for Replit-specific guidance, and `ARCHITECTURE.md` for the full system diagram and data flow.
