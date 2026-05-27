# Amaru — Data model & route contract

Amaru (artifact slug: `conduit`, repo: `szl-holdings/amaru`) is the SZL convergent
multi-source sync fabric. The frontend lives in `artifacts/conduit/` and renders at
`/conduit/`. All operational data is served by `artifacts/api-server` under the
`/api/conduit/*` namespace, allowlisted in
`artifacts/api-server/src/middlewares/global-auth-enforcer.ts` (see the `/api/conduit/`
prefix entry).

## Tables (Drizzle, `@szl-holdings/db`)

| Table                      | Purpose                                            |
| -------------------------- | -------------------------------------------------- |
| `conduitConnectionsTable`  | Destination credentials + tested-at status         |
| `conduitSyncsTable`        | Source ↔ destination sync configurations           |
| `conduitSyncMappingsTable` | Field-level mappings + transforms per sync         |
| `conduitSyncRunsTable`     | One row per executed run (rows read/written/failed)|
| `conduitSyncRunRowsTable`  | Per-row failure samples for retry/debug            |
| `conduitTemplatesTable`    | Saved sync templates (also seeded at boot)         |

## Routes (`artifacts/api-server/src/routes/conduit.ts`)

```
GET    /api/conduit/stats
GET    /api/conduit/connections
POST   /api/conduit/connections
GET    /api/conduit/connections/:id
PATCH  /api/conduit/connections/:id
DELETE /api/conduit/connections/:id
POST   /api/conduit/connections/validate
POST   /api/conduit/connections/:id/test

GET    /api/conduit/syncs
POST   /api/conduit/syncs
GET    /api/conduit/syncs/:id
PATCH  /api/conduit/syncs/:id
DELETE /api/conduit/syncs/:id
POST   /api/conduit/syncs/:id/run
GET    /api/conduit/syncs/:id/mappings
PUT    /api/conduit/syncs/:id/mappings

GET    /api/conduit/sync-runs
GET    /api/conduit/sync-runs/:id
GET    /api/conduit/sync-runs/:id/rows
POST   /api/conduit/sync-runs/:id/rows/:rowId/retry

GET    /api/conduit/templates
GET    /api/conduit/templates/:id
POST   /api/conduit/templates/:id/apply

POST   /api/conduit/sources/preview
GET    /api/conduit/destinations/:destination/objects
GET    /api/conduit/destinations/:destination/objects/:objectType/fields
```

The frontend client wrappers and TypeScript types live in
`artifacts/conduit/src/lib/api.ts`; React Query hooks are in
`artifacts/conduit/src/lib/api-hooks.ts`.

## Governance envelope

The four GovernancePanels (Provenance / Evidence Ledger / Ownership / SLO+Status)
are rendered in `src/components/GovernancePanels.tsx` and remain anchored to
Doctrine V6 values (Λ floor 0.90, 9-axis AND, moral-grounding 0.95, repo
`szl-holdings/amaru`, ORCID `0009-0001-0110-4173`). These are static
payload-grounded constants, not product copy.

## Ingestion primitives (May 2026)

Three ingestion surfaces re-express the AGI-stack KnowledgeExtraction,
SeeingEye, and memnet primitives against Amaru's existing
`conduitConnectionsTable` / `conduitSyncsTable` / `conduitSyncRunsTable`
shape — no new tables, no bolted-on subsystems.

### Unstructured · schema-grounded

- **Source.** `packages/langextract-bridge` (extended) — `groundExtractionAgainstSchema()`
  consumes raw `ExtractionHit[]` from the existing extractor and post-processes
  against a `DocumentSchema`.
- **Doctrine surface.** `gaps[]` (no source span / low confidence /
  type-mismatch) and `conflicts[]` (multiple incompatible spans) are
  first-class outputs — never silently dropped.
- **Provenance.** Every extracted value carries a `SpanProvenance`
  (`packages/langextract-bridge/src/span-provenance.ts`) hashing
  `(documentHash, startByte, endByte, normalisedText)`.
- **Receipt:** `extraction.schema-grounded.v1` — fields: `schemaRef`,
  `documentHash`, `extracted[]`, `gaps[]`, `conflicts[]`, `receiptHash`.

### Visual · SeeingEye

- **Source.** `packages/seeing-eye` (new sibling, mirrors the
  langextract-bridge contract for images).
- **Doctrine surface.** No visual caption without `bbox + frameHash`
  (`UngroundedVisualClaimError`). `notDetected[]` for asked-about-but-absent
  labels is first-class.
- **Provenance.** `frameHash` (SHA-256 of canonical frame bytes) +
  `perceptualHash` (aHash over downsampled luminance, survives JPEG
  re-encoding).
- **Receipt:** `vision.seeing-eye.v1` — fields: `schemaRef`, `frameHash`,
  `perceptualHash`, `detections[]`, `notDetected[]`, `receiptHash`.

### Recall · memnet (episodic mapping recall)

- **Source.** `lib/ai-engine/src/memory/memnet-recall.ts` (new sibling to
  the existing tiered/RL memory stores).
- **Doctrine surface.** Dual-index — content similarity (cosine over the
  episode vector) AND temporal adjacency (exponential decay around the
  query's `now`). The recall **path** (`contentMatches[]`,
  `temporalMatches[]`, `fusionRule`) is part of the returned record — the
  audit trail for *why* a memory surfaced.
- **Receipt:** `memory.recall.v1` — fields: `recallId`, `items[]`,
  `fusionRule: 'sqrt(content*temporal)'`, `receiptHash`. Reused mappings
  cite the source `episodeId`.

### End-to-end demo

`/health-screening` renders a *Deployment Health Screening* commander
dashboard that composes all three primitives over a synthetic pierside
reefer assessment — proving that one unified record can be assembled
from a scanned form (visual), a free-text inspector note (extraction),
and historical mapping decisions (recall), with each pipeline's receipt
attached and replayable.

## Branding

- Display name: **Amaru — The Andean Ouroboros**
- Artifact directory and route slug: `conduit` (kept stable for URL/back-compat)
- API namespace: `/api/conduit/*` (kept stable for back-compat)
- All user-visible copy uses "Amaru"
