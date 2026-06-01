# SZL Holdings — Data Command Plane

## Overview

The Data Command Plane is SZL's original data substrate that brings structured data, documents, events, and operational entities into one governed decision layer. Unlike traditional data platforms that optimize for storage and query, the Data Command Plane optimizes for **decision readiness** — ensuring every data entity is connected to the governance primitives that make decisions auditable.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   DATA COMMAND PLANE                     │
├──────────────┬──────────────┬──────────────┬────────────┤
│  Semantic    │  Queryable   │  Document    │  Lineage   │
│  Entity      │  Metrics     │  Bridge      │  Surface   │
│  Layer       │  Layer       │  Layer       │  Layer     │
├──────────────┴──────────────┴──────────────┴────────────┤
│              Tenant-Aware Access Boundary                │
├──────────────┬──────────────┬──────────────┬────────────┤
│  Vessels     │  Terra       │  Aegis       │  Counsel   │
│  Domain      │  Domain      │  Domain      │  Domain    │
│  Store       │  Store       │  Store       │  Store     │
└──────────────┴──────────────┴──────────────┴────────────┘
```

### Semantic Entity Layer

Every business entity in the platform is registered with:
- **Entity type** — vessel, property, incident, matter, contract, portfolio position
- **Domain origin** — which domain pack owns the entity
- **Cross-domain links** — how this entity connects to entities in other domains
- **Governance hooks** — which policies apply to actions on this entity
- **Proof chain references** — which decisions have been made about this entity

Implementation: `lib/db/src/schema/` contains domain-specific entity tables. Cross-domain links flow through the Signal Mesh (`packages/signal-mesh`) and are recorded in the Proof Chain (`lib/proof-chain`).

### Queryable Metrics Layer

Domain metrics are exposed through a unified query interface:
- Portfolio NAV, risk scores, allocation percentages
- Vessel utilization, route economics, delay frequencies
- Property distress scores, occupancy rates, construction timelines
- Incident severity distributions, resolution times, control coverage
- Matter deadlines, obligation counts, evidence volumes

Implementation: `artifacts/api-server/src/routes/` exposes domain-specific metrics endpoints. The Pulse dashboard (`artifacts/pulse`) provides executive-level aggregation.

### Document Bridge Layer

Documents are classified, extracted, and linked to the entity graph:
- Source document registration
- Field extraction and normalization
- Entity-to-document linking
- Policy-aware access controls
- Audit trail for every extraction and use

Implementation: `lib/shared-ui/src/document-engine/` provides document generation, signing, and management. Domain packs (Counsel, Terra) extend with domain-specific extraction.

### Lineage Surface

Every data transformation and decision is traceable from source to outcome:
- Data source → entity → analysis → recommendation → outcome
- Model call → policy evaluation → approval → execution
- Signal → cascade → cross-domain action → verification

Implementation: Trace Graph (`packages/trace-graph`) and Proof Chain (`lib/proof-chain`) provide the lineage backbone. OpenTelemetry spans add runtime tracing.

## Tenant Boundaries

All data access is scoped to the requesting tenant's organization:
- Middleware enforcement via `tenant-scope.ts`
- Database queries filtered by organization ID
- Cross-tenant access explicitly denied at API boundary
- Audit logging for all cross-boundary access attempts
