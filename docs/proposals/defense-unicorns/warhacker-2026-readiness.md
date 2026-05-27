# Warhacker 2026 — readiness checklist

Every lane is marked **operational** below. Each row pins:
- the live route the operator hits,
- the backend dependency,
- a real receipt sample captured from a live run of the
  `Run This Demo` button on the hub.

Hub: [`/rosie/warhacker`](https://example.invalid/rosie/warhacker)
API: see `artifacts/api-server/src/routes/warhacker.ts`

---

## Lane 1 — Fragmented Satellite Ground Software

- **Status:** OPERATIONAL ✅
- **Hub route:** `/rosie/warhacker` (Lane 1 card)
- **Backend:** `POST /api/warhacker/lane/1/bundle-compose`
- **Bundles:** `rosie-uds` + `sentra-uds` + `amaru-uds` + `a11oy-uds`
- **Sample receipt (entry 2 of 3):**

```json
{
  "index": 2,
  "receiptClass": "observability.plane.v1",
  "subject": "observability:warhacker:loki+prometheus",
  "summary": "Unified Loki + Prometheus plane with one tenant gateway and per-bundle labels.",
  "pillar": "operational-ontology"
}
```

## Lane 2 — Military Deployment Health Screening

- **Status:** OPERATIONAL ✅
- **Hub route:** `/rosie/warhacker` (Lane 2 card) · evidence link: `/conduit/health-screening`
- **Backend:** `POST /api/warhacker/lane/2/health-screening`
- **Receipts emitted per run:** `extraction.schema-grounded.v1` →
  `memory.recall.v1` → `unit.readiness.v1`
- **Sample receipt (entry 2 of 3):**

```json
{
  "index": 2,
  "receiptClass": "unit.readiness.v1",
  "subject": "readiness:unit:7-30-CAV-A-CO",
  "summary": "Readiness rollup: screened=110, deferred=6, failed=2, ratio=0.932.",
  "pillar": "governed-autonomy"
}
```

## Lane 3 — AI Oversight for Autonomous Drones

- **Status:** OPERATIONAL ✅
- **Hub route:** `/rosie/warhacker` (Lane 3 card) · approvals inbox: `/rosie/proof`
- **Backend:** `POST /api/warhacker/lane/3/drone-oversight`
- **Receipts emitted per run:** `graph.plan.v1` → `ctm.tick.v1` →
  `time-r1.window.v1` → `lambda.invariant.v1`
- **Sample receipt (entry 3 of 4):**

```json
{
  "index": 3,
  "receiptClass": "lambda.invariant.v1",
  "subject": "lambda:drone:swarm-A:tail-07",
  "summary": "Λ-9 invariant HELD (min axis 0.91 vs floor 0.90).",
  "pillar": "governed-autonomy"
}
```

## Lane 4 — Trajectory Data Visualization

- **Status:** OPERATIONAL ✅
- **Hub route:** `/rosie/warhacker` (Lane 4 card) · evidence link: `/vessels/`
- **Backend:** `POST /api/warhacker/lane/4/trajectory`
- **Receipts emitted per run:** `pipeline.stage.v1` (ingest) →
  `pipeline.stage.v1` (fuse) → `time-r1.window.v1` → `context.card.v1`
- **Sample receipt (entry 3 of 4):**

```json
{
  "index": 3,
  "receiptClass": "context.card.v1",
  "subject": "context:orbit:LEO:hull-09",
  "summary": "Operational context card composed: approach geometry, conjunction risk, recommended action.",
  "pillar": "governed-autonomy"
}
```

## Lane 5 — AI at the Tactical Edge

- **Status:** OPERATIONAL ✅
- **Hub route:** `/rosie/warhacker` (Lane 5 card) · evidence link: `/sentra/`
- **Backend:** `POST /api/warhacker/lane/5/edge-drill`
- **Bundles:** `rosie-uds` + `sentra-uds`
- **Receipts emitted per run:** `edge.drill.v1` → `peak.detection.v1` → `antivenom.catch.v1`
- **Sample receipt (entry 2 of 3):**

```json
{
  "index": 2,
  "receiptClass": "antivenom.catch.v1",
  "subject": "antivenom:edge:fwd-op:node-3",
  "summary": "Antivenom classifier caught 29 of 29 poisoned inputs at the edge before any downstream agent saw them.",
  "pillar": "policy-aware-actions"
}
```

---

## Cross-artifact funnel — confirmed in code

- `artifacts/a11oy/src/pages/HomePage.tsx` — Warhacker tile → Lane 1.
- `artifacts/sentra/src/pages/sentra-landing.tsx` — Warhacker tile → Lane 5.
- `artifacts/conduit/src/pages/conduit-landing.tsx` — Warhacker tile → Lane 2.

## Reproducing the samples

1. Start the api-server and the rosie web artifact.
2. Open `/rosie/warhacker` in the preview.
3. Click **Run This Demo** on each lane card.
4. Expand the receipt chain drawer; the `payloadSha256` for any given
   input is deterministic, the `entryHash` is content-addressed, and
   the chain links via `prevHash` back to the genesis (64 × `0`).
