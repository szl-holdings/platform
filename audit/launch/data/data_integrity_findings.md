# Data Integrity Findings
**Phase:** 4  
**Date:** April 19, 2026  
**Auditor:** Series A Launch Readiness Program (Task #2068)

---

## DI001 — Cross-Tenant RAG Chunk Isolation (Resolved)

| Finding | `rag_knowledge_chunks` table lacked `tenant_id` column |
|---|---|
| Severity | P0 — Critical |
| Resolution | `tenant_id` column added; index created; all queries use strict predicate |
| Date | Apr-2026 (Task #1034) |
| Status | ✅ Resolved |

---

## DI002 — Missing Demo Seed Tables

| Finding | `platform_settings`, `eval_forge_suites`, `eval_forge_runs` not in current dev DB |
|---|---|
| Severity | P2 (non-fatal; WARN on startup) |
| Impact | Platform settings features and Eval Forge show empty/error states |
| Resolution | Run `pnpm db:migrate && pnpm seed:all` |
| Status | ⚠️ Open — pending operator action |

---

## DI003 — Autopilot Stats Hardcoded on Corporate Dashboard

| Finding | Metrics shown as live intelligence are hardcoded constants |
|---|---|
| Severity | P2 — misleading in investor demo context |
| Impact | May erode trust if investor asks for source |
| Resolution | Add "Illustrative" label OR wire to real aggregation query |
| Status | ⚠️ Open |

---

## DI004 — AIS Position Data (Seeded, Not Live)

| Finding | Vessel positions use seeded demo data; not pulling from MarineTraffic |
|---|---|
| Severity | P2 (acceptable for demo phase; documented) |
| Impact | AIS tracking appears live but is static |
| Resolution | Add "(Demo)" label; activate live AIS when `MARINETRAFFIC_API_KEY` set |
| Status | ⚠️ Open — pending label fix |

---

## DI005 — Proof Chain Append-Only Integrity

| Finding | Proof chain entries are append-only by design |
|---|---|
| Severity | Informational |
| Impact | Immutability is the trust guarantee |
| Status | ✅ Confirmed healthy |

---

## DI006 — Tenant Scoping on All Domain Queries

| Finding | All domain pack queries verified to include `tenant_id` predicate |
|---|---|
| Severity | Informational |
| Status | ✅ Confirmed healthy |

---

## DI007 — PRISM Counsel Seed Script Broken

| Finding | `scripts/seed-prism-counsel.ts` fails for some PRISM recovery tables |
|---|---|
| Severity | P2 (dev environment; does not affect main demo seed) |
| Impact | Full PRISM Counsel data may be incomplete after `seed:all` |
| Resolution | Fix seed script for PRISM recovery table schema match |
| Status | ⚠️ Open (TD-002) |

---

## DI008 — CISA KEV and NVD CVE Feeds Not Actively Polled

| Finding | Feed adapters exist in `lib/intelligence-feeds`; polling schedule not active |
|---|---|
| Severity | P3 |
| Impact | Aegis vulnerability data shows seeded CVEs; not refreshing from live feeds |
| Resolution | Enable polling schedule in production env |
| Status | ⚠️ Open (GAP-013, GAP-014) |

---

## Data Integrity Summary

| Status | Count |
|---|---|
| ✅ Resolved critical integrity issues | 1 (DI001) |
| ✅ Confirmed healthy | 2 (DI005, DI006) |
| ⚠️ Open — operator action needed | 3 (DI002, DI004, DI008) |
| ⚠️ Open — code fix needed | 2 (DI003, DI007) |
