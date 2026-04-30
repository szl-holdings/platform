# Alloy Embedding Fabric — Integration Summary

This document explains how each SZL Holdings vertical integrates with the Alloy Embedding Fabric (AEF) and which domain profiles to use.

---

## Vessels Maritime Intelligence

**Profile:** `vessels_maritime_risk`
**Service:** `artifacts/vessels`
**Ingest sources:** Port authority manifests, AIS feeds, sanctions lists, PSC detention records, classification society certificates.

### Integration points
- Ingest AIS vessel records via `POST /v1/ingest` with `profileId: "vessels_maritime_risk"`.
- Search using `POST /v1/hybrid-search` with query terms; the profile boosts IMO numbers, MMSI identifiers, and flag state codes automatically.
- Exact-match classes: `IMO`, `MMSI`, `port_call_id`, `vessel_name`, `sanctions_entity`.
- Evidence ledger traces every retrieval hit with `chunkId`, `sourceId`, `denseScore`, `fusedScore`, and `policyAllow`.

---

## Counsel — Legal Matter Command

**Profile:** `prism_legal_matter`
**Service:** `artifacts/prism-counsel`
**Ingest sources:** Court filings, docket records, matter management exports, contract PDFs, deposition transcripts.

### Integration points
- Index legal documents via `POST /v1/ingest` with `profileId: "prism_legal_matter"`.
- Search with `POST /v1/hybrid-search`; the profile boosts docket numbers, statute citations (`15 U.S.C. § 78j`), and matter IDs.
- Exact-match classes: `docket_number`, `matter_id`, `statute_citation`, `contract_id`, `case_citation`.
- Use `includeProvenance: true` to get a full evidence chain in the response payload.

---

## Lyte — Decision Intelligence / Governance Ops

**Profile:** `lyte_governance_ops`
**Service:** `artifacts/lyte-command-center`
**Ingest sources:** Compliance control frameworks (NIST, SOC 2, PCI-DSS, GDPR), audit findings, remediation evidence.

### Integration points
- Index controls and evidence via `POST /v1/ingest`.
- Boost terms: regulation codes (`NIST SP 800-53`, `SOC 2 CC6.1`), control IDs, and compliance verbs (`attestation`, `remediation`).
- Exact-match classes: `regulation_code`, `control_id`, `audit_finding_id`, `policy_ref`.
- Run automated evals via `POST /v1/evals/run` to verify retrieval quality after every ingestion batch.

---

## Terra — Real Estate Intelligence

**Profile:** `terra_real_estate_intel`
**Service:** `artifacts/terra`
**Ingest sources:** Property assessments, deed records, lease agreements, comparables, zoning permits.

### Integration points
- Index property records keyed by parcel ID or APN.
- Boost terms: real estate financial metrics (`cap rate`, `NOI`, `NNN`), property classes, and transaction verbs.
- Exact-match classes: `parcel_id`, `apn`, `lease_id`, `permit_number`, `property_address`.
- Use `metadataFilter: { propertyType: "multifamily" }` to scope searches to a property class.

---

## Aegis — Cyber / Security Incident

**Profile:** `aegis_security_incident`
**Service:** `artifacts/aegis`
**Ingest sources:** CVE advisories, threat intelligence feeds, MITRE ATT&CK techniques, endpoint telemetry, incident reports.

### Integration points
- Index CVE and incident data with `profileId: "aegis_security_incident"`.
- CVE IDs (`CVE-2024-12345`) and MITRE technique codes (`T1071`) receive strong exact-match boosts.
- Exact-match classes: `cve_id`, `incident_id`, `mitre_technique`, `endpoint_id`, `threat_actor`.
- High-sensitivity mode: set `provenanceRequired: true` in the profile to require full evidence chain on every result.

---

## Carlota Jo Consulting — Private Advisory

**Profile:** `carlota_private_advisory`
**Service:** `artifacts/carlota-jo`
**Ingest sources:** Engagement records, vendor due diligence reports, deliverables, strategic briefings.

### Integration points
- Index client engagement documents; the profile applies conservative sensitivity controls.
- Boost terms: engagement identifiers, advisory verbs, and vendor assessment terms.
- Exact-match classes: `engagement_id`, `vendor_id`, `deliverable_id`, `compliance_control_id`.
- Maximum retention: 2 years (730 days) — the profile's `retentionDays` enforces this at the policy layer.

---

## Common Integration Patterns

### Embedding a document
```http
POST /v1/embed
Authorization: Bearer {AEF_API_KEY}
X-Tenant-ID: {tenantId}
Content-Type: application/json

{
  "requestId": "req-001",
  "tenantId": "szl-internal",
  "profileId": "vessels_maritime_risk",
  "texts": ["MV Example Vessel, IMO 9123456, departed Port of Rotterdam 2024-03-01"]
}
```

### Hybrid search with provenance
```http
POST /v1/hybrid-search
Authorization: Bearer {AEF_API_KEY}
X-Tenant-ID: {tenantId}
Content-Type: application/json

{
  "requestId": "req-002",
  "tenantId": "szl-internal",
  "profileId": "vessels_maritime_risk",
  "query": "IMO 9123456 vessel sanctions list",
  "topK": 10,
  "denseWeight": 0.6,
  "keywordWeight": 0.4,
  "includeProvenance": true
}
```

### OpenAI drop-in
```javascript
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.AEF_API_KEY,
  baseURL: "http://localhost:4200/v1/openai",
});

const response = await client.embeddings.create({
  model: "aef-embed-cpu-v1",
  input: "The vessel MV Example departed Port of Rotterdam",
});
```

---

## Environment Variables

| Variable | Service | Description |
|---|---|---|
| `AEF_API_KEY` | alloy-fabric-api | Bearer token for external callers. |
| `AEF_S2S_SECRET` | all services | Service-to-service bearer token. |
| `AEF_EMBED_BACKEND` | alloy-vector-worker | `local-cpu` (default), `external-http`, `future-gpu`, `future-azure`. |
| `AEF_EMBED_ENDPOINT` | alloy-vector-worker | Endpoint for `external-http` backend. |
| `AEF_RANK_MODE` | alloy-rank-worker | `cross-encoder` (default) or `fallback-inversion`. |
| `AEF_RATE_LIMIT_RPM` | alloy-fabric-api | Requests per minute per tenant (default: 60). |

---

## Evidence and Audit Trail

Every search response with `includeProvenance: true` creates an evidence entry in the AEF ledger containing:

- `entryId` — unique identifier for this retrieval event
- `requestId` — correlates to the originating request
- `tenantId` — enforced tenant boundary
- `profileId` — the domain profile used for this search
- `chunkId` / `sourceId` — the exact chunk and source document
- `denseScore` / `keywordScore` / `fusedScore` / `finalScore` — full score breakdown
- `policyAllow` — whether the policy guard permitted this result
- `redactedFields` — any fields that were redacted before returning
- `requestedAt` / `completedAt` — timestamps for latency attribution

This satisfies audit requirements for all six SZL Holdings verticals.
