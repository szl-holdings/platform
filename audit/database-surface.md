# SZL Holdings — Database Surface Map

**Generated:** 2026-04-21  
**Track:** Zero-Gap Track 1

---

## Database Summary

| Attribute | Value |
|-----------|-------|
| Engine | PostgreSQL 16 |
| ORM | Drizzle ORM 0.45.2 |
| Schema location | `lib/db/src/schema/` (primary) + `packages/db-schema/src/domains/` (supplementary) |
| Migration location | `lib/db/drizzle/` |
| Schema file count | 165 `.ts` files in `lib/db/src/schema/` |
| Table definitions (pgTable) | ~1,078 (grep count, 2026-04-21) |
| Migration files | 115 SQL files (0000–0094 range; some parallel-branched sequences) |
| Rollback scripts | 5 (in `scripts/rollback/`) |

---

## Schema Domains

### Primary Schema (`lib/db/src/schema/`)

165 schema files covering all platform domains. Key domain groupings (by filename prefix):

| Domain Prefix | Coverage |
|--------------|---------|
| `a2a`, `agent_*` | Agent mesh, agent OS, agent skills, agent training |
| `ai_evals`, `alloy_*` | Alloy execution fabric, AI decisions, autonomy modes, chat, comms, policy, runtime |
| `analytics`, `activity` | Analytics engine, activity tracking |
| `approvals` | Approval workflow state |
| `firestorm` | Aegis defense domain (archived UI; schema live) |
| `lyte_*` | Lyte decision intelligence surfaces |
| `terra_*` | Real estate domain |
| `vessels_*` | Maritime intelligence domain |
| `carlota_*` | Private advisory domain |
| `pulse_*` | Executive briefing domain |
| `prism_counsel_*` | Legal matter domain (archived UI; schema live) |
| `mcp_*` | MCP gateway persistence |
| `memory_*` | Memory fabric |
| `substrate_*` | Sovereign Execution Substrate journal |

### Supplementary Schema (`packages/db-schema/src/domains/`)

8 domain files providing supplementary definitions:

| File | Domain |
|------|--------|
| `ai.ts` | AI evaluation and inference |
| `alloy.ts` | Alloy execution fabric |
| `audit.ts` | Audit trail |
| `auth.ts` | Authentication and sessions |
| `firestorm.ts` | Aegis / Firestorm defense |
| `platform.ts` | Platform-level entities |
| `terra.ts` | Real estate |
| `vessels.ts` | Maritime |

---

## Migration Inventory

| Location | Count | Status |
|----------|-------|--------|
| `lib/db/drizzle/` | 115 SQL files | Primary migration set; sequence numbers 0000–0094; several parallel branches (e.g., two `0028_*`, `0053_*`, `0060_*`, `0044_*`, `0045_*`, `0046_*`, `0065_*`, `0068_*`) |
| `packages/db-migrations/` | 0 SQL files | Package scaffolded; no migrations written |
| `scripts/rollback/` | 5 SQL files | Emergency rollback scripts (0004–0008) |

**Note on parallel-branched sequences:** Multiple migration files share the same sequence prefix (e.g., three `0028_*` files). This indicates the migration set was developed across parallel branches and merged without renaming. Drizzle applies them by filename alphabetically within a prefix. Recommend a migration audit in Track 3 (Backend/DB hardening).

---

## Seed Data

| Location | Purpose |
|---------|---------|
| `packages/demo-seed/` | Demo data seeding package |
| `scripts/seed-demo-canonical.sh` | Canonical demo seed script |
| Various `seed:atlas:*` scripts | Domain-specific ATLAS seed scripts |

---

## Active Data Sources (External)

| Source | Domain | Status |
|--------|--------|--------|
| NYC Open Data | Terra | Live |
| Census / BLS / FEMA / SEC EDGAR | Terra | Live |
| NOAA / Open-Meteo Marine | Vessels | Live |
| MarineTraffic / AISHub / Digitraffic | Vessels | AIS simulated (no live token) |
| CISA KEV / NVD CVE / MITRE ATT&CK v14 | Aegis / Sentra | Live |
| AbuseIPDB | Aegis | Live |
| AlienVault OTX / MISP / OFAC / UN/EU sanctions | Aegis | Configured |
| STIX/TAXII | Aegis | Protocol layer active |
| CourtListener REST API | PRISM Counsel | Configured (archived UI) |
| World Bank / BLS / HBR | Carlota Jo | Live |
| Mapbox GL JS | Terra | Needs token (`MAPBOX_TOKEN`) |

---

## Operational Status

| Component | Status | Notes |
|-----------|--------|-------|
| Schema definition | Boots (code compiles) | Drizzle schema is TypeScript-compiled |
| Migrations applied | Unverified | Requires live PostgreSQL connection; last apply date unknown |
| Seed data | Unverified | `pnpm seed` available; requires DB connection |
| External data feeds | Mixed — see table above | Several live; AIS and Mapbox need credentials |
