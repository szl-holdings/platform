# SZL Holdings — Indexing & Query Risk Audit

**Date:** 2026-04-21  
**Auditor:** Enterprise Rehaul — Task #2841  
**Scope:** Query patterns, index coverage, performance risk, pagination discipline

---

## Summary

| Risk Level | Item Count | Notes |
|---|---|---|
| High | 3 | Missing indexes on high-frequency query patterns |
| Medium | 5 | Pagination gaps, oversized JSON blobs, nullable FK risks |
| Low | 4 | Consolidation opportunities, minor naming inconsistencies |

---

## High Risk Items

### HR-001: `rag_knowledge_chunks` — tenant_id + search vector queries

**Risk:** Full table scans possible if composite index on `(tenant_id, embedding_vector)` is missing.  
**Context:** RAG retrieval is a hot path for all AI-assisted recommendations. Without a proper index on `tenant_id`, cross-tenant query isolation becomes slow at scale.  
**Status:** The `tenant_id` column was added in the April 2026 hardening sprint (migration `0001_add_tenant_id_to_rag_knowledge_chunks.sql`). Confirm composite index exists.  
**Recommended action:** `CREATE INDEX CONCURRENTLY ON rag_knowledge_chunks (tenant_id, id)` if not already present.

### HR-002: `audit_logs` and `audit_chain_events` — time-range queries without covering index

**Risk:** Audit log queries are typically date-range filtered (`WHERE created_at BETWEEN ...`). Without a `created_at` index, large audit tables will table-scan.  
**Evidence:** Migration `0011_atlas_retention_indexes.sql` suggests retention/indexing has been addressed for Atlas tables, but audit log tables may not be covered.  
**Recommended action:** Verify `CREATE INDEX ON audit_logs (created_at DESC)` and `CREATE INDEX ON audit_chain_events (created_at DESC, org_id)`.

### HR-003: `alloy_runs` — org_id + status filtering without composite index

**Risk:** Alloy workflow run queries typically filter by `(org_id, status, created_at)`. Without a composite index, operator dashboard queries will degrade at scale.  
**Recommended action:** `CREATE INDEX CONCURRENTLY ON alloy_runs (org_id, status, created_at DESC)`.

---

## Medium Risk Items

### MR-001: Pagination not enforced on all list endpoints

**Evidence:** API server has 268 routes; not all list endpoints enforce `LIMIT` clauses. Routes with potential unbounded results should use cursor-based or offset pagination.  
**Recommended action:** Add `DEFAULT_PAGE_SIZE = 50` enforcement in the route layer for all paginated list endpoints. The `idempotency` middleware doesn't address this.

### MR-002: Oversized JSON blobs in `alloy_ai_decisions`

**Risk:** AI decision payloads (prompt, completion, evidence chain) can be large. Storing full payloads in JSONB columns without size enforcement creates row bloat.  
**Recommended action:** Enforce a max payload size at the application layer; consider storing large AI output in object storage with a DB reference.

### MR-003: Nullable foreign keys on `vessels_trading_orders`

**Risk:** New vessels trading module tables may have nullable FKs on `vessel_id` or `org_id` that create orphaned records.  
**Recommended action:** Audit `vessels_trading.ts` schema for nullable required FK columns; add NOT NULL constraints where appropriate.

### MR-004: `prism_counsel_*` tables — 11 domain files, potential denormalization

**Risk:** 11 separate schema files for PRISM Counsel (now archived) suggests significant denormalization or incremental schema growth. Tables may have overlapping columns.  
**Recommended action:** Since PRISM Counsel is archived, no immediate action required. If data is retained for compliance, document retention policy and add a deletion date.

### MR-005: Missing org_id on `analytics_events`

**Risk:** Analytics events may not be scoped to org, creating cross-tenant analytics exposure.  
**Recommended action:** Confirm `analytics.ts` schema includes `org_id` column with NOT NULL constraint and appropriate index.

---

## Low Risk Items

### LR-001: `stephen.ts` and `stephen_site.ts` — legacy tables

These schema files appear to be personal/legacy tables unrelated to the SZL Holdings platform. If they reference actual data, they create dead schema weight.  
**Recommended action:** Verify no active queries reference these tables; remove schema files and create a migration to drop the tables.

### LR-002: Index naming inconsistency

Drizzle-generated indexes use default naming; some hand-authored migrations use custom names. No functional risk but creates operational inconsistency.  
**Recommended action:** Low priority; address in next schema consolidation pass.

### LR-003: `job_queue` table without dead-letter queue

Background job failures may silently drop without a dead-letter queue mechanism.  
**Recommended action:** Verify job retry + dead-letter behavior in `job_queue.ts` schema.

### LR-004: Missing `updated_at` on some tables

Several tables may lack `updated_at` timestamps needed for cache invalidation and audit trail.  
**Recommended action:** Add Drizzle `updatedAt` column to all domain entity tables.

---

## Retention Policy Assessment

| Table Group | Retention Policy | Status |
|---|---|---|
| `audit_logs` | No explicit retention defined | ⚠️ Define policy |
| `audit_chain_events` | Migration 0011 adds retention indexes | ✅ Partially addressed |
| `analytics_events` | No explicit retention defined | ⚠️ Define policy |
| `job_queue` | No explicit TTL defined | ⚠️ Define policy |
| `alloy_ai_decisions` | No explicit retention defined | ⚠️ Define policy |
| `proof_chain_events` | Immutable by design — no deletion | ✅ Correct |

---

## DB Pooling Configuration

From `@szl-holdings/env`:
- `DB_POOL_MIN` — default 1
- `DB_POOL_MAX` — default 100
- `DB_CONNECT_TIMEOUT_MS` — default 90,000ms
- `DB_IDLE_TIMEOUT_MS` — default 60,000ms
- `DB_STATEMENT_TIMEOUT_MS` — default 60,000ms
- `SLOW_QUERY_THRESHOLD_MS` — default 500ms
- `DB_CHECKOUT_WARN_THRESHOLD_MS` — default 30,000ms

Pool max of 100 is appropriate for a single-node deployment. With multiple workers, confirm the total pool across all processes doesn't exceed PostgreSQL's `max_connections`.

---

*Schema files: `audit/db/schema-inventory.md`*
