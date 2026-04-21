# Residual Risk Register — SZL Holdings
**Track:** Zero-Gap Track 4  
**Date:** 2026-04-21  
**Purpose:** Items not fixed in this track, deferred drift, thin seeds, and forward-only migrations requiring ongoing attention.

---

## Register

| ID | Category | Item | Severity | Owner | Status |
|----|----------|------|----------|-------|--------|
| RR-01 | Missing FK | 22 tables missing FK constraints (see `schema-drift-report.md §2.1`) | HIGH | DB Platform | OPEN — deferred to next hardening sprint |
| RR-02 | JSONB weak refs | 6 JSONB-array relationship sites in Firestorm (`firestorm_cases`, `firestorm_incidents`, `firestorm_mitre_detections`) | MEDIUM | DB Platform | OPEN — requires join table creation |
| RR-03 | Orphaned tables | 115 tables with no direct api-server reference (see `docs/schema-audit-2025-04.md`) | MEDIUM | Engineering | OPEN — cross-package audit required before any deletion |
| RR-04 | Dual entity | `org_members` + `organization_memberships` duplicate membership tables | HIGH | Platform Auth | OPEN — requires human sign-off before consolidation |
| RR-05 | Dual entity | `alloy_skills` + `agent_skills` duplicate skill registry tables | MEDIUM | Agent Platform | OPEN — architectural decision required |
| RR-06 | Soft-delete | Three incompatible soft-delete patterns with no standard | MEDIUM | Engineering | OPEN — needs RFC; deferred |
| RR-07 | Column type | `alloy_decisions.reviewed_by`, `firestorm_assessments.assessor_name`, `firestorm_incidents.assigned_analyst` use `text` instead of integer FK to `users.id` | MEDIUM | DB Platform | OPEN — type migration required |
| RR-08 | Column type | `pc_gc_matters.org_id` uses `text` while `organizations.id` is `integer` | MEDIUM | Counsel | OPEN — architectural decision required |
| RR-09 | Model mismatch | `simulation_sessions` model may reference v1 column names; v2 schema applied via `0025_simulation_persistence` | MEDIUM | Agent Platform | OPEN — model review required |
| RR-10 | Naming | camelCase/snake_case mixing in schema exports; `_table` suffix inconsistency; `szl_` prefix overlap | LOW | Engineering | OPEN — low priority cosmetic |
| RR-11 | Forward-only | Migrations idx 9–94 (58 migrations) have no rollback scripts | MEDIUM | DB Platform | ACCEPTED — forward-only is standard Drizzle practice; manual SQL required for any rollback |
| RR-12 | Hand-authored tracker | 24 hand-authored migrations in `lib/db/migrations/` tracked separately with no unified `__drizzle_migrations` record | MEDIUM | DB Platform | OPEN — need separate tracker or registration in Drizzle journal |
| RR-13 | Duplicate prefix | `lib/db/migrations/` has 4 pairs of duplicate-prefixed files (`0004_*`, `0008_*`, `0015_*`, `0016_*`) — apply order ambiguity | MEDIUM | DB Platform | OPEN — review idempotency of each pair |
| RR-14 | Thin seed | Terra 1031 Exchange and Lease Abstraction modules have no dedicated seed data | MEDIUM | Terra Team | OPEN — surfaces may appear empty in demo |
| RR-15 | Thin seed | PRISM Counsel `pc_approval_steps` and `pc_settlement_blockers` have no dedicated seed | LOW | Counsel | OPEN — advanced feature surfaces only |
| RR-16 | Thin seed | `artifacts/szl-holdings/src/data/insights.ts` uses hardcoded TS data; no DB path | LOW | Platform | OPEN — low priority |
| RR-17 | Journal gaps | 31 sequence numbers unaccounted for in Drizzle journal (idx 47–53, 55–57, 59, 61–62, gaps to 88) | LOW | DB Platform | ACCEPTED — gaps result from squash/resequencing; journal is self-consistent; no operational impact |
| RR-18 | No tenant scope | `terra_covenants` has no `org_id` or tenant scope column | HIGH | Terra Team | OPEN — data isolation risk; add `org_id` + FK in next Terra migration |
| RR-19 | Session integrity | `sessions.replaced_by_session_id` has no FK back to `sessions.id` | LOW | Auth Platform | OPEN — dangling pointer risk on session deletion |
| RR-20 | Supplemental migration | `packages/db/migrations/0021_phase_b_missing_indexes.sql` not registered in Drizzle journal; must be applied manually | LOW | DB Platform | PARTIALLY RESOLVED — applied against live dev DB (2026-04-21); add to boot script and document as manual step |
| RR-21 | Hand-authored migration drift | `lib/db/migrations/0003_skill_library_tables.sql` produces errors on column references (`category`, `enabled`) against live schema — confirms column mismatch between hand-authored migration and `drizzle push`-created `skills` table | MEDIUM | DB Platform | NEW (2026-04-21) — fix by adding `IF NOT EXISTS` column guards or aligning migration to live schema |
| RR-22 | Rollback script BEGIN/COMMIT | All 5 rollback scripts (`scripts/rollback/001–005`) contain embedded `BEGIN/COMMIT` blocks. This means (a) dry-run via transaction wrapper is impossible, and (b) rollback execution against a live DB is irreversible without a backup. Verified live: `001_rollback_0004_terra_broker_schema.sql` executed and committed all 36 DROP statements; tables restored via forward migration `0007_terra_broker_schema.sql`. | MEDIUM | DB Platform | NEW (2026-04-21) — remove embedded BEGIN/COMMIT from rollback scripts; ensure callers wrap in explicit transaction |

---

## Severity Definitions

| Level | Meaning |
|-------|---------|
| HIGH | Data integrity risk or security risk; address within 2 sprints |
| MEDIUM | Functional risk or technical debt; address within next quarter |
| LOW | Cosmetic or low-impact; address in backlog |

---

## Items Closed This Track

| ID | Item | Resolution |
|----|------|-----------|
| CLOSED-01 | Orphaned migration `0010_szl_saas_layer_tables.sql` | Registered as idx 91 with `IF NOT EXISTS` guards |
| CLOSED-02 | Orphaned migration `0028_crdt_change_events.sql` | Registered as idx 92 with `IF NOT EXISTS` guards |
| CLOSED-03 | Orphaned migration `0028_multi_channel_notifications.sql` | Registered as idx 93 with `IF NOT EXISTS` guards |
| CLOSED-04 | 40+ missing indexes across auth, audit, Terra, Vessels, Counsel, billing | Applied via migration `0088_missing_index_sweep` |
| CLOSED-05 | 2 duplicate unique index definitions | Dropped via migration `0089_drop_duplicate_indexes` |
| CLOSED-06 | All public table-count claims verified | Source-of-truth.json counts match re-verified grep counts; no correction needed |

---

## Next Actions

1. **RR-01 (HIGH):** Assign to next DB hardening sprint. Use `NOT VALID` + `VALIDATE CONSTRAINT` pattern to avoid table locks.
2. **RR-04 (HIGH):** Requires engineering leadership decision before any consolidation work begins.
3. **RR-18 (HIGH):** Add `org_id` column to `terra_covenants` in next Terra migration cycle.
4. **RR-12/RR-13 (MEDIUM):** Standardize hand-authored migration tracking — either register in Drizzle journal or maintain a separate apply log.
5. **RR-14 (MEDIUM):** Add Terra 1031 and Lease Abstraction seeds before next investor demo.
