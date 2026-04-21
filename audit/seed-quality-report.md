# Seed Quality Report — SZL Holdings
**Track:** Zero-Gap Track 4  
**Date:** 2026-04-21  
**Scope:** All seed paths — `packages/demo-seed/`, `scripts/seed-*.ts`, `scripts/seed-*.sh`, `seed-data/`, `artifacts/api-server/src/lib/seed-*.ts`

---

## 1. Seed Architecture Overview

The project uses a layered seed architecture:

| Layer | Location | Mechanism | Purpose |
|-------|----------|-----------|---------|
| **Demo narrative seeds** | `packages/demo-seed/src/` | TypeScript, run via `pnpm --filter @workspace/demo-seed seed:*` | Four branded demo scenarios for investor/customer presentations |
| **API-side seed functions** | `artifacts/api-server/src/lib/seed-vessels.ts`, `terra-seed.ts` | Called from API boot or platform jobs | Populate live domain data |
| **Root seed scripts** | `scripts/seed-*.ts` (20 scripts) | `tsx` — run manually or via CI | Domain-specific seeding (governance, pilot data, atlas twins, etc.) |
| **Static JSON seed files** | `seed-data/lyte/`, `seed-data/vessels/` | JSON — consumed by API routes as fallback | Demo fixture data for Lyte and Vessels surfaces |
| **Canonical demo reset** | `scripts/seed-demo-canonical.sh` | Shell — orchestrates all seed layers | Full reset + reseed for demo environment |
| **Carlota advisory seed** | `packages/demo-seed/src/carlota-advisory-seed.ts` | TypeScript | Carlota Jo private advisory domain |

---

## 2. Domain Seed Coverage

### 2.1 Lyte — Decision Intelligence

| Surface | Seed Coverage | Data Source | Quality |
|---------|--------------|-------------|---------|
| Scenario builder | `seed-data/lyte/` static JSON | JSON fixtures | 🟡 PARTIAL — static only, no live DB write path |
| Command cards | `seed-data/lyte/command-cards.json` | JSON | 🟡 Static fixture |
| Incidents | `seed-data/lyte/incidents.json` | JSON | 🟡 Static fixture |
| Playbooks | `seed-data/lyte/playbooks.json` | JSON | 🟡 Static fixture |
| Recommendations | `seed-data/lyte/recommendations.json` | JSON | 🟡 Static fixture |
| Signals | `seed-data/lyte/signals.json` | JSON | 🟡 Static fixture |
| Narrative (business-revops) | `packages/demo-seed/src/narrative-business-revops.ts` | TypeScript object | ✅ COVERED — narrative seeded to DB via seed:business |
| Live-signal refresh | `scripts/seed-live-signals.ts` | Script | ✅ COVERED — incremental refresh |

**Assessment:** Lyte has reasonable demo coverage through the static JSON layer and the narrative seed. The static JSON layer is by design — it provides a deterministic fallback when a live DB is unavailable. The narrative data is written to the DB by `seed:business`. **No primary surface would look empty in demo.**

### 2.2 Vessels — Maritime Intelligence

| Surface | Seed Coverage | Data Source | Quality |
|---------|--------------|-------------|---------|
| Vessel list | `seed-data/vessels/vessels.json` + `artifacts/api-server/src/lib/seed-vessels.ts` | JSON + DB write | ✅ COVERED |
| Fleet management | `seed-data/vessels/fleets.json` | JSON | 🟡 Static fixture |
| AI briefings | `seed-data/vessels/ai-briefings.json` | JSON | 🟡 Static fixture |
| Compliance certificates | `seed-data/vessels/compliance-certificates.json` | JSON | 🟡 Static fixture |
| Event logs | `seed-data/vessels/event-logs.json` | JSON | 🟡 Static fixture |
| Forecast modules | `seed-data/vessels/forecast-modules.json` | JSON | 🟡 Static fixture |
| Maintenance logs | `seed-data/vessels/maintenance-logs.json` | JSON | 🟡 Static fixture |
| Port state deficiencies | `seed-data/vessels/port-state-deficiencies.json` | JSON | 🟡 Static fixture |
| Predictive maintenance | `seed-data/vessels/predictive-maintenance.json` | JSON | 🟡 Static fixture |
| Shipment records | `seed-data/vessels/shipment-records.json` | JSON | 🟡 Static fixture |
| Marine narrative | `packages/demo-seed/src/narrative-maritime.ts` | TypeScript + DB | ✅ COVERED — narrative seeded via seed:maritime |
| Vessels org scope | `scripts/seed-marine-extended.ts` | Script | ✅ COVERED |

**Assessment:** Vessels has two-layer coverage: static JSON for UI fallback and a DB-seeded maritime narrative. The `seed-vessels.ts` API-side seeder ensures vessel records exist in the DB. **No primary surface would look empty in demo.** AIS data is simulated (no live token); documented in `audit/database-surface.md`.

### 2.3 Terra — Real Estate Intelligence

| Surface | Seed Coverage | Data Source | Quality |
|---------|--------------|-------------|---------|
| Property listings | `artifacts/api-server/src/lib/terra-seed.ts` | DB write | ✅ COVERED |
| Pro Forma / Waterfall | `artifacts/api-server/src/routes/terra.ts` | API routes with seed | ✅ COVERED |
| NYC Open Data integration | Live API | External | ✅ LIVE |
| Terra narrative | `packages/demo-seed/src/narrative-terra-distress.ts` | TypeScript + DB | ✅ COVERED |
| Tenant health scorecards | `scripts/seed-tenant-health-scorecards.ts` | Script | ✅ COVERED |
| 1031 Exchange | No dedicated seed | — | 🔴 THIN — module may show empty without data |
| Lease Abstraction | No dedicated seed | — | 🔴 THIN — module may show empty without data |
| Construction tracking | No dedicated seed | — | 🟡 PARTIAL — relies on terra-seed generic data |

**Assessment:** Core Terra surfaces (Pro Forma, property listings) are well seeded. The 1031 Exchange and Lease Abstraction modules have no dedicated seed data. The mobile detail screens for these modules are noted as thin in domain documentation.

### 2.4 Counsel / PRISM Counsel — Legal Matter Command

| Surface | Seed Coverage | Data Source | Quality |
|---------|--------------|-------------|---------|
| Matter list | `scripts/seed-prism-counsel.ts` | Script | ✅ COVERED |
| Legal narrative | `packages/demo-seed/src/narrative-legal-compliance.ts` + `narrative-counsel-deadline.ts` | TypeScript + DB | ✅ COVERED |
| Pilot data | `scripts/seed-pilot-data.ts`, `scripts/seed-pilot-org.ts` | Scripts | ✅ COVERED |
| PC approval steps / evidence | No dedicated seed | — | 🟡 PARTIAL |
| PC settlement blockers | No dedicated seed | — | 🟡 PARTIAL |
| M365 / Teams integration | No seed (requires live token) | — | 🟡 NOT SEEDED — depends on M365 token |

**Assessment:** Core legal matter surfaces are seeded via the narrative and pilot scripts. Advanced PRISM Counsel sub-features (M365 calendar, Teams messages, settlement blockers) are thin in demo seed — they depend on live M365 tokens that are not available in a local environment.

### 2.5 Sentra — Cyber Resilience / Security SOC

| Surface | Seed Coverage | Data Source | Quality |
|---------|--------------|-------------|---------|
| Security narrative | `packages/demo-seed/src/narrative-security-soc.ts` + `narrative-sentra-ransomware.ts` | TypeScript + DB | ✅ COVERED |
| CISA KEV / NVD CVE | Live APIs (CISA, NVD) | External | ✅ LIVE |
| MITRE ATT&CK v14 | Live data | External | ✅ LIVE |
| AbuseIPDB | Live API | External | ✅ LIVE |
| Firestorm campaigns/leads | No dedicated seed | — | 🟡 PARTIAL — Firestorm UI archived; schema live |

**Assessment:** Sentra has strong live data coverage via CISA/NVD/MITRE feeds. Firestorm-specific tables (`firestorm_campaigns`, `firestorm_leads`) have no dedicated demo seed, but the Firestorm UI is archived so this does not affect visible demo surfaces.

### 2.6 Pulse — AI Executive Briefing

| Surface | Seed Coverage | Data Source | Quality |
|---------|--------------|-------------|---------|
| Daily briefing narrative | `packages/demo-seed/src/narrative-szl-treasury.ts` | TypeScript + DB | ✅ COVERED |
| Briefing generation | `scripts/seed-atlas.ts`, `scripts/seed-atlas-twins.ts` | Scripts | ✅ COVERED |
| Governance data | `scripts/seed-governance.ts` | Script | ✅ COVERED |
| Fund operations | `scripts/seed-holdings-fundops.ts` | Script | ✅ COVERED |

**Assessment:** Pulse has strong seed coverage across all primary surfaces. **No primary surface would look empty in demo.**

### 2.7 Carlota Jo — Private Advisory

| Surface | Seed Coverage | Data Source | Quality |
|---------|--------------|-------------|---------|
| Client profiles | `packages/demo-seed/src/carlota-advisory-seed.ts` | TypeScript + DB | ✅ COVERED |
| Client narrative | `packages/demo-seed/src/narrative-carlota-jo-estate.ts` | TypeScript + DB | ✅ COVERED |
| Carlota billing | `scripts/seed-carlota-clients.ts` | Script | ✅ COVERED |

**Assessment:** Carlota Jo is well seeded. **No primary surface would look empty in demo.**

### 2.8 Agent / AI Infrastructure

| Surface | Seed Coverage | Data Source | Quality |
|---------|--------------|-------------|---------|
| Agent OS | `scripts/seed-agent-os.ts` | Script | ✅ COVERED |
| Signal mesh | `packages/demo-seed/src/seed-signal-mesh.ts` | TypeScript + DB | ✅ COVERED |
| Constellation views | `packages/demo-seed/src/seed-constellation.ts` | TypeScript + DB | ✅ COVERED |
| Forge / eval data | `scripts/seed-forge.ts` | Script | ✅ COVERED |
| Distribution OS | `scripts/seed-distribution-os.ts` | Script | ✅ COVERED |
| Atlas audit logs | `scripts/seed-audit-logs.ts` | Script | ✅ COVERED |
| Deployments | `scripts/seed-deployments.ts` | Script | ✅ COVERED |

**Assessment:** Agent infrastructure seed is comprehensive.

---

## 3. Surfaces That Depend Solely on Fake/Static Data

The following surfaces serve only from static JSON files or hardcoded arrays with no DB write path. They will look correct in demo but do not verify a working DB connection:

| Surface | File | Risk Level |
|---------|------|-----------|
| Lyte command cards | `seed-data/lyte/command-cards.json` | LOW — by design; narrative data also in DB |
| Lyte incidents | `seed-data/lyte/incidents.json` | LOW — by design |
| Vessels fleets | `seed-data/vessels/fleets.json` | LOW — DB also has fleet records via seed-vessels |
| Vessels AI briefings | `seed-data/vessels/ai-briefings.json` | LOW — narrative also in DB |
| SZL Holdings insights | `artifacts/szl-holdings/src/data/insights.ts` | MEDIUM — no DB path; hardcoded TS data |

---

## 4. Seed Completeness Rating by Domain

| Domain | DB Seed | Static Fallback | Live Feeds | Overall |
|--------|---------|----------------|-----------|---------|
| Lyte | ✅ narrative | ✅ JSON layer | — | 🟢 GOOD |
| Vessels | ✅ seed-vessels + narrative | ✅ JSON layer | ✅ AIS simulated | 🟢 GOOD |
| Terra | ✅ terra-seed + narrative | — | ✅ NYC Open Data | 🟡 PARTIAL (1031/Lease thin) |
| Counsel | ✅ pilot + narrative | — | — | 🟡 PARTIAL (M365 thin) |
| Sentra | ✅ narrative | — | ✅ CISA/NVD/MITRE | 🟢 GOOD |
| Pulse | ✅ atlas + narrative | — | — | 🟢 GOOD |
| Carlota Jo | ✅ advisory + billing | — | — | 🟢 GOOD |
| Agent/AI infra | ✅ agent-os + forge | — | — | 🟢 GOOD |

---

## 5. Recommendations

| Priority | Action | Domain | Effort |
|----------|--------|--------|--------|
| HIGH | Add dedicated seed for Terra 1031 Exchange and Lease Abstraction modules | Terra | Small |
| MEDIUM | Add seed for `pc_approval_steps` and `pc_settlement_blockers` | Counsel | Small |
| LOW | Move `artifacts/szl-holdings/src/data/insights.ts` to a DB-backed seed | SZL Holdings | Medium |
| LOW | Document that Firestorm campaign/lead tables are intentionally unseeded (UI archived) | Sentra | Trivial |
