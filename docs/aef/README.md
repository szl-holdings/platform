# Alloy Embedding Fabric (AEF)

The Alloy Embedding Fabric is a governed, multi-tenant, evidence-first retrieval layer for SZL Holdings. It provides embedding, hybrid search (dense + keyword + RRF fusion), ingestion, reranking, domain-profile-driven configuration, policy enforcement, an append-only evidence ledger, and deterministic workflow orchestration with approval gates.

All components are CPU-runnable without a GPU. GPU and Azure AI Search adapters are seam-ready for future activation.

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
| `prism_legal_matter` | PRISM Counsel | docket_number, matter_id, statute_citation, contract_id |
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
