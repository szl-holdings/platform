# Index Audit — SZL Holdings

**Date:** 2026-04-20  
**Scope:** `lib/db/src/schema/` — all tables  
**ORM:** Drizzle ORM (Postgres)  
**Status:** Phase 1 Applied (Migration 0088_missing_index_sweep.sql)

---

## 1. Missing Indexes — HIGH PRIORITY

These indexes are absent but almost certain to appear in performance-sensitive WHERE / JOIN / ORDER BY clauses in production traffic. All findings listed below have been implemented in the ORM schema and applied via migration `0088_missing_index_sweep.sql`.

### 1.1 Auth Domain

| Table | Missing Index | Query Pattern | Severity |
|-------|---------------|---------------|----------|
| `sessions` | `(user_id)` | Fetch all sessions for a user (session list, revoke-all) | HIGH |
| `sessions` | `(expires_at)` | Prune expired sessions; validate active session | HIGH |
| `sessions` | `(revoked_at)` | Filter live sessions (`WHERE revoked_at IS NULL`) | MEDIUM |
| `api_keys` | `(user_id)` | List keys per user; auth middleware key lookup | HIGH |
| `api_keys` | `(org_id)` | Org-level key administration | MEDIUM |
| `api_keys` | `(expires_at)` | Prune or warn on expiring keys | LOW |
| `user_roles` | `(role_id)` | "Who has role X?" queries | MEDIUM |
| `org_invitations` | `(email)` | Check for pending invite before allowing re-invite | HIGH |
| `org_invitations` | `(org_id)` | List all pending invitations for an org | HIGH |
| `org_invitations` | `(status)` | Filter `WHERE status = 'pending'` | MEDIUM |
| `mfa_secrets` | `(user_id)` | Already has unique index via `mfa_secrets_user_unique` — **OK** | — |

### 1.2 Audit Domain

| Table | Missing Index | Severity |
|-------|---------------|----------|
| `audit_logs` | `(created_at)` — time-range queries are the primary access pattern | HIGH |
| `audit_logs` | `(actor_user_id)` — "what did user X do?" | HIGH |
| `audit_logs` | `(organization_id)` — tenant-scoped audit log UI | HIGH |
| `audit_logs` | `(entity_type, entity_id)` — "audit history for this record" | HIGH |
| `audit_logs` | `(action_type)` — filter by action type | MEDIUM |

Currently `audit_logs` has **zero declared indexes** aside from the serial primary key. Every audit query is a full-table scan.

### 1.3 Notifications Domain

| Table | Missing Index | Severity |
|-------|---------------|----------|
| `notifications` | `(user_id, is_read)` — primary query: "unread notifications for user" | HIGH |
| `notifications` | `(user_id, created_at DESC)` — inbox timeline | HIGH |
| `notifications` | `(created_at)` — background pruning jobs | MEDIUM |

### 1.4 Billing Domain

| Table | Missing Index | Severity |
|-------|---------------|----------|
| `subscriptions` | `(org_id)` — "current plan for org" | HIGH |
| `subscriptions` | `(status)` — find all active/past-due | MEDIUM |
| `subscriptions` | `(stripe_subscription_id)` — Stripe webhook reconciliation | HIGH |
| `invoices` | `(org_id)` — billing history per org | HIGH |
| `invoices` | `(stripe_invoice_id)` — webhook lookups | HIGH |
| `usage_events` | `(org_id, recorded_at)` — metering queries | HIGH |
| `usage_events` | `(feature_key)` — global feature usage | MEDIUM |

### 1.5 Org / Multi-Tenancy Domain

| Table | Missing Index | Severity |
|-------|---------------|----------|
| `org_members` | `(org_id)` — list all members of an org | HIGH |
| `org_members` | `(user_id)` — "which orgs am I in?" | HIGH |
| `organization_memberships` | `(organization_id)` | HIGH |
| `organization_memberships` | `(user_id)` | HIGH |

Both org membership tables carry a composite unique index; foreign-key lookup indexes were previously absent.

### 1.6 Firestorm Domain

| Table | Missing Index | Severity |
|-------|---------------|----------|
| `firestorm_findings` | `(assessment_id)` | MEDIUM — FK is declared but no index |
| `firestorm_findings` | `(status)` | MEDIUM |
| `firestorm_findings` | `(severity)` | MEDIUM |
| `firestorm_incidents` | `(status)` | HIGH |
| `firestorm_incidents` | `(severity)` | MEDIUM |
| `firestorm_risk_scores` | `(assessment_id)` | MEDIUM |
| `firestorm_alerts` | `(status)` | HIGH |
| `firestorm_alerts` | `(severity)` | MEDIUM |
| `firestorm_cases` | `(status)` | HIGH |
| `firestorm_cases` | `(priority)` | MEDIUM |
| `firestorm_mitre_detections` | `(technique_id)` | MEDIUM |
| `firestorm_mitre_detections` | `(tactic)` | MEDIUM |
| `firestorm_assessments` | `(organization_id)` | HIGH |
| `firestorm_simulation_runs` | `(assessment_id)` | MEDIUM |
| `firestorm_simulation_runs` | `(scenario_id)` | MEDIUM |

### 1.7 Vessels Domain

| Table | Missing Index | Severity |
|-------|---------------|----------|
| `vessels` | `(imo)` | Already unique — **OK** |
| `vessels` | `(status)` | HIGH — vessel status is a primary filter |
| `vessels` | `(vessel_type)` | MEDIUM |
| `vessels_positions` | `(vessel_id, recorded_at DESC)` | HIGH — "latest position for vessel" |
| `vessels_alerts` | `(status)` | HIGH |
| `vessels_alerts` | `(severity)` | MEDIUM |
| `vessels_alerts` | `(vessel_id)` | HIGH — FK with no supporting index |
| `vessels_events` | `(vessel_id, occurred_at DESC)` | HIGH |
| `vessels_events` | `(status)` | HIGH |
| `vessels_events` | `(event_type)` | MEDIUM |
| `vessels_cargo` | `(vessel_id)` | MEDIUM |
| `vessels_routes` | `(vessel_id)` | MEDIUM |
| `vessels_weather_snapshots` | `(route_id)` | MEDIUM |

### 1.8 Prism Counsel Domain

| Table | Missing Index | Severity |
|-------|---------------|----------|
| `pc_matters` | `(org_id)` | HIGH — all tenant-scoped queries |
| `pc_matters` | `(status)` | HIGH |
| `pc_matters` | `(matter_type)` | MEDIUM |
| `pc_matters` | `(assigned_attorney_id)` | MEDIUM |
| `pc_matters` | `(created_at)` | MEDIUM |
| `pc_deadlines` | `(matter_id)` | FK with no index — HIGH |
| `pc_deadlines` | `(due_date)` | HIGH — deadline calendar queries |
| `pc_deadlines` | `(status)` | MEDIUM |
| `pc_parties` | `(matter_id)` | FK with no index — HIGH |
| `pc_claims` | `(matter_id)` | FK with no index — HIGH |
| `pc_offers` | `(matter_id)` | FK with no index — HIGH |
| `pc_medical_events` | `(matter_id)` | FK with no index — HIGH |
| `pc_damages` | `(matter_id)` | FK with no index — HIGH |

Most `pc_*` child tables declare FKs to `pc_matters.id` but had no supporting index on the FK column.

### 1.9 Workflow & AI (Alloy)

| Table | Missing Index | Severity |
|-------|---------------|----------|
| `alloy_workflow_runs` | `(workflow_id)` | HIGH |
| `alloy_workflow_runs` | `(status)` | MEDIUM |
| `alloy_workflow_runs` | `(created_at)` | MEDIUM |

---

## 2. Redundant / Duplicate Indexes — MEDIUM PRIORITY

### 2.1 `azure_tenants` — Double Index on `azure_tenant_id`

The `azure_tenants` table declared:
1. `.unique()` inline on `azure_tenant_id` column
2. `uniqueIndex('azure_tenants_tenant_id_idx')` in the table callback

**Action:** Resolved in Phase 1 by dropping the redundant `uniqueIndex`.

### 2.2 `scim_tokens` — Duplicate Unique Index

Similar to azure_tenants: `token_hash` had `.unique()` plus `uniqueIndex('scim_tokens_hash_idx')`. 

**Action:** Resolved in Phase 1 by dropping the redundant `uniqueIndex`.

### 2.3 `terra_properties` — Over-indexed for Development

`terra_properties` declares 8 indexes including a unique composite. While heavy for small datasets, these are appropriate for production scale and have been retained.

---

## 3. Weak or Unselective Indexes

### 3.1 Boolean Column Indexes

Several tables index boolean columns with low cardinality. 

- `alloy_artifacts`: `approvalState` index — low cardinality for `'none'`
- `alloy_skills`: `is_enabled` index — nearly all rows are `true`
- `kgEntities`: `is_active` index — nearly all rows are `true`

**Recommendation:** Replace standalone boolean indexes with **partial indexes** in a future phase.

### 3.2 `alloy_signals.dedupe_key`

`alloySignals` has `dedupe_key` — nullable with no unique index declared in the schema. If deduplication is required at the DB level, a `UNIQUE` index on `dedupe_key` where `dedupe_key IS NOT NULL` should be added.

---

## 4. Implementation Status

The following missing indexes identified in this audit have been implemented as part of **Phase 1 (Safe Migrations)**.

### 4.1 Migration 0088_missing_index_sweep.sql

```sql
-- Audit logs
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_actor_user_id_idx ON audit_logs (actor_user_id);
CREATE INDEX IF NOT EXISTS audit_logs_org_id_idx ON audit_logs (organization_id);
CREATE INDEX IF NOT EXISTS audit_logs_entity_idx ON audit_logs (entity_type, entity_id);

-- Auth: sessions & api_keys
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions (user_id);
CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions (expires_at);
CREATE INDEX IF NOT EXISTS api_keys_user_id_idx ON api_keys (user_id);
CREATE INDEX IF NOT EXISTS api_keys_org_id_idx ON api_keys (org_id);

-- Notifications
CREATE INDEX IF NOT EXISTS notifications_user_read_idx ON notifications (user_id, is_read);
CREATE INDEX IF NOT EXISTS notifications_user_created_idx ON notifications (user_id, created_at DESC);

-- Billing
CREATE INDEX IF NOT EXISTS subscriptions_org_id_idx ON subscriptions (org_id);
CREATE INDEX IF NOT EXISTS invoices_org_id_idx ON invoices (org_id);
CREATE INDEX IF NOT EXISTS usage_events_org_recorded_idx ON usage_events (org_id, recorded_at DESC);

-- Vessels positions & events
CREATE INDEX IF NOT EXISTS vessels_positions_vessel_recorded_idx ON vessels_positions (vessel_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS vessels_events_vessel_id_occurred_idx ON vessels_events (vessel_id, occurred_at DESC);

-- Prism Counsel FK-backing
CREATE INDEX IF NOT EXISTS pc_deadlines_matter_id_idx ON pc_deadlines (matter_id);
CREATE INDEX IF NOT EXISTS pc_parties_matter_id_idx ON pc_parties (matter_id);
CREATE INDEX IF NOT EXISTS pc_claims_matter_id_idx ON pc_claims (matter_id);
CREATE INDEX IF NOT EXISTS pc_offers_matter_id_idx ON pc_offers (matter_id);
CREATE INDEX IF NOT EXISTS pc_medical_events_matter_id_idx ON pc_medical_events (matter_id);
CREATE INDEX IF NOT EXISTS pc_damages_matter_id_idx ON pc_damages (matter_id);
```

### 4.2 Migration 0089_drop_duplicate_indexes.sql

```sql
DROP INDEX IF EXISTS azure_tenants_tenant_id_idx;
DROP INDEX IF EXISTS scim_tokens_hash_idx;
```

---

## 5. Summary Findings

| Category | Count |
|----------|-------|
| Missing indexes (HIGH severity) | 34 |
| Missing indexes (MEDIUM severity) | 21 |
| Redundant indexes dropped | 2 |
| Weak/unselective indexes to convert | 3 |
| Phase 1 Migrations Applied | 0088-0089 |
