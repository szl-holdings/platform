# AEF Phase 6 — Integration Summary

_SZL Holdings — Alloy Embedding Fabric (AEF) — April 2026_

---

## What Was Added

### packages/aef-sdk

A new first-class SDK package (`@workspace/aef-sdk`) that wraps the AEF native HTTP API with a typed, production-hardened client. The SDK centralises every concern that previously had to be handled individually by each caller:

- **AefClient** — typed wrapper for `embed()`, `rerank()`, `hybridSearch()`, and `ingest()`. All request shapes are validated against `@workspace/aef-contracts` schemas on the way out and on the way in.
- **Authentication** — bearer-token injection via the `authorization` header. Tenant identity is stamped on every request via the `x-tenant-id` header. Both are configured once at client construction and never repeated in application code.
- **Retry with exponential backoff** — retryable 5xx errors are automatically retried up to three times with jitter. Non-retryable errors (401, 403, 429, policy rejections) surface immediately.
- **Explicit error types** — `AefUnavailableError`, `AefAuthError`, `AefPolicyError`, `AefTimeoutError`, and `AefRateLimitError` give callers structured, actionable failure information. Silent fallbacks are explicitly rejected by design.
- **React hooks** — `useAefSearch` and `useAefEmbed` provide query-bound access to the SDK from any Vite/React consumer app. The hooks detect configuration at runtime and surface a clear "not configured" state when environment variables are absent rather than throwing silently.
- **Browser and Node.js compatible** — uses `globalThis.fetch` and `globalThis.crypto.randomUUID()` (with a pure-JS fallback), avoiding any Node.js-only imports. The same client code works in Vite browser bundles and in server-side tool-mesh workers.

### packages/tool-mesh — document-retrieval tool (v2.0.0)

The stub `document-retrieval` tool has been rewritten to call `hybridSearch()` via the AEF SDK. Key changes:

- The handler now requires `AEF_GATEWAY_URL` and `AEF_API_KEY` to be set. If either is absent, the tool throws an explicit error that describes what is missing and where to find setup instructions — no silent fallback, no empty result set.
- The output schema is extended with a full evidence envelope per hit: `denseScore`, `keywordScore`, `fusedScore`, `rerankerScore`, `finalScore`, `boostApplied`, `pathway` (human-readable), `rationale`, `traceId`, and `evidenceId`.
- The tool manifest is updated to version 2.0.0, reflecting the new output schema. The `failureModes` array now explicitly lists `policy-rejected` as a non-retryable error class.
- Domain scope is mapped to an AEF profile ID automatically: passing `domain: "lyte"` resolves to `lyte_governance_ops`, `domain: "vessels"` resolves to `vessels_maritime_risk`, and so on for all six domains.

### Six consumer apps — AEF retrieval surface

Each of the six SZL product surfaces received one new retrieval page wired to its domain profile. The pages are intentionally minimal and consistent: a search bar, a ranked result list with expandable evidence cards, and a retrieval pipeline breadcrumb.

| App | Route | Domain Profile |
|-----|-------|---------------|
| Lyte — Decision Intelligence | `/lyte/aef-search` | `lyte_governance_ops` |
| Vessels Maritime Intelligence | `/vessels/aef-search` | `vessels_maritime_risk` |
| Terra — Real Estate Intelligence | `/terra/aef-search` | `terra_real_estate_intel` |
| Aegis — Cyber Resilience Command | `/aegis/aef-search` | `aegis_security_incident` |
| PRISM Counsel — Legal Command | `/prism-counsel/aef-search` | `prism_legal_matter` |
| Carlota Jo Consulting | `/carlota-jo/aef-search` | `carlota_private_advisory` |

Every result card exposes the full evidence breakdown — dense vector score, BM25 keyword score, reciprocal-rank fusion score, cross-encoder reranker score (when enabled), and final score — alongside the retrieval pathway used (e.g. `dense+keyword → fusion → rerank`) and any rationale text produced by the profile's query prompt template. Trace IDs and evidence IDs are displayed for every hit, making every retrieval event auditable to its ledger entry.

When AEF is not configured (i.e., `VITE_AEF_GATEWAY_URL` or `VITE_AEF_API_KEY` are absent), the page renders a clear, actionable configuration notice rather than an empty result set.

### docs/aef/RUNBOOK.md

Operational runbook covering all three deployment paths: Replit Reserved VM (the recommended path for the AEF control plane and API gateway), Replit Autoscale (for light, stateless embed workloads), and an external container path for production-scale GPU embedding workers. See RUNBOOK.md for the full procedure.

---

## Where AEF Plugs Into Alloy and the SZL Platform

The Alloy platform is the central governance layer that connects every SZL product surface. AEF sits inside Alloy as its retrieval primitive. The integration chain is:

```
Consumer app (React/Vite)
  └─ useAefSearch hook (@workspace/aef-sdk)
       └─ AefClient.hybridSearch()
            └─ POST /v1/search/hybrid → AEF API gateway
                 ├─ Domain profile loaded from @workspace/aef-domain-profiles
                 ├─ Query normalised via @workspace/aef-retrieval-core/query-normalizer
                 ├─ Dense ANN + BM25 keyword search (storage adapter)
                 ├─ Exact-match boost rules applied
                 ├─ Reciprocal-rank fusion (@workspace/aef-retrieval-core/fusion)
                 ├─ Metadata filter pass
                 ├─ Cross-encoder rerank (when rerankEnabled=true)
                 ├─ Evidence assembled (@workspace/aef-evidence-ledger)
                 ├─ Policy guard check (@workspace/aef-policy-guard)
                 └─ Response normalised and returned to SDK

Agent workflows (tool-mesh)
  └─ documentRetrievalHandler
       └─ AefClient.hybridSearch() (same path above)
            └─ Results mapped to DocumentRetrievalHit with evidence
```

The AEF evidence ledger writes a record for every retrieval event, linking the `traceId` and `evidenceId` to the originating request. These IDs propagate to the consumer UI so that any displayed result can be traced back to its audit record.

---

## How Each Consumer App Uses AEF

### Lyte — Decision Intelligence (`lyte_governance_ops`)

Lyte uses AEF to retrieve operational governance documents: approval chain records, risk signals, ownership gap reports, and stakeholder briefings. Exact-match boost is applied to opportunity IDs and project codes so that structured identifiers always surface at position one. The retrieval surface is at `/lyte/aef-search`. Reranking is enabled.

### Vessels Maritime Intelligence (`vessels_maritime_risk`)

Vessels uses AEF to retrieve maritime risk assessments, vessel incident reports, AIS anomaly logs, sanctions screening records, and port-state control findings. IMO numbers receive a 2× boost and MMSI identifiers a 1.8× boost. The retrieval surface is at `/vessels/aef-search`. Reranking is enabled.

### Terra — Real Estate Intelligence (`terra_real_estate_intel`)

Terra uses AEF to retrieve property ownership records, tax lien filings, distress signal reports, deal pipeline entries, and NYC market comps. NYC parcel IDs in BBL format (borough-block-lot) receive a 1.9× exact-match boost. The retrieval surface is at `/terra/aef-search`. Reranking is enabled.

### Aegis — Cyber Resilience Command (`aegis_security_incident`)

Aegis uses AEF to retrieve incident investigation timelines, threat indicator records, CVE advisories, MITRE ATT&CK technique mappings, MSP operational alerts, and cyber-asset exposure reports. CVE identifiers and incident IDs receive a 2× boost. The retrieval surface is at `/aegis/aef-search`. Reranking is enabled.

### PRISM Counsel — Legal Command (`prism_legal_matter`)

PRISM uses AEF to retrieve matter briefs, filing obligation timelines, discovery logs, contract clauses, and court docket entries. Docket IDs and case numbers receive a 1.9× boost. All retrieval is subject to attorney-client privilege handling — the profile explicitly prohibits cross-matter boundary document exposure. The retrieval surface is at `/prism-counsel/aef-search`. Reranking is enabled.

### Carlota Jo Consulting (`carlota_private_advisory`)

Carlota Jo uses AEF to retrieve client engagement records, strategy briefs, brand positioning documents, and operational planning notes. Privacy level is set to `privileged` — the highest tier — and cross-region replication is prohibited. Engagement IDs and client reference codes receive exact-match boost. No document retrieved under this profile may be surfaced outside the requesting principal's own tenant boundary. The retrieval surface is at `/carlota-jo/aef-search`. Reranking is enabled.

---

## Migration Notes

### Code that previously relied on the stub document-retrieval tool

The stub implementation returned an empty `documents` array with a descriptive message. Any caller that tested for `documents.length > 0` or `totalFound > 0` will now receive real results (when AEF is configured) or an explicit thrown error (when it is not). 

**Action required:** Any agent workflow, eval harness, or integration test that asserted on the stub's empty result set must be updated to:
1. Set `AEF_GATEWAY_URL` and `AEF_API_KEY` in the test environment, or
2. Mock `AefClient.hybridSearch()` at the SDK boundary for unit tests that should not make network calls.

### Output schema change (v1.0.0 → v2.0.0)

The tool output schema changed significantly. Key additions:

| Field | v1 | v2 |
|-------|----|----|
| `documents` (array of raw objects) | present | **removed** |
| `hits` (typed `DocumentRetrievalHit[]`) | absent | **added** |
| `traceId` | absent | **added** |
| `retrievalPath` | absent | **added** |
| `evidence` per hit | absent | **added** (dense/keyword/fused/reranker/final scores + pathway) |
| `evidenceId` per hit | absent | **added** |
| `message` (stub message) | present | **removed** |

Any consumer of the v1 output must migrate to the `hits` field. The `message` string is gone — errors now surface as thrown exceptions rather than inline strings.

---

## What Remains Optional for External GPU Scale

The current AEF deployment uses the `local-cpu` embedding backend, which runs a quantised embedding model on CPU inside the Replit Reserved VM. This is sufficient for development, staging, and moderate production loads.

For high-throughput production workloads (>1,000 documents per minute, sub-100ms embedding latency requirements), the AEF architecture supports an external GPU path via the `external-http` backend:

- Set `AEF_EMBED_BACKEND=external-http` on the AEF API service.
- Set `AEF_EMBED_ENDPOINT` to an NVIDIA NIM, Hugging Face Inference Endpoint, or any OpenAI-compatible embedding endpoint.
- Set `AEF_EMBED_API_KEY` for the external endpoint.

The vector worker and rank worker can be deployed as separate containers on GPU-equipped VMs (NVIDIA A10G or better recommended for production). The AEF API gateway and ingest-control service remain on Replit Reserved VM as the stable control plane.

**Capacity planning:** At batch size 32 and the default `local-cpu` backend, expect approximately 8–12 embeddings per second on a standard Replit VM. An A10G GPU (24 GB VRAM) running `nvidia/nv-embed-v2` produces approximately 400–600 embeddings per second at the same batch size. The external GPU path requires no code changes — only environment variable changes.

**Cutover plan:**
1. Provision external GPU endpoint and verify reachability from the Replit VM.
2. Set `AEF_EMBED_BACKEND=external-http` and `AEF_EMBED_ENDPOINT` as Replit secrets.
3. Restart the AEF vector worker workflow.
4. Monitor the `/metrics` endpoint for embedding latency and queue depth.
5. If latency degrades, roll back by removing `AEF_EMBED_BACKEND` (defaults to `local-cpu`).

Document backfilling (ingesting historical documents into AEF indexes) is handled per-app via the `ingest_document` workflow in `@workspace/aef-workflow-runtime`. This is a follow-up operational step and is not required for the retrieval surfaces to function — they will simply return empty results until indexed content is available.
