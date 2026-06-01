# Schema Drift Report — SZL Holdings
**Track:** Zero-Gap Track 4  
**Date:** 2026-04-21  
**Inputs:** `audit/db/schema-audit.md`, `audit/db/migration-drift.md`, `audit/db/redundancy-audit.md`, `audit/db/index-audit.md`, `audit/db/consolidation-plan.md`  
**Scope:** Code models vs. applied schema, orphaned tables, dead models, naming inconsistencies

---

## Executive Summary

The schema is in **managed drift** — the primary issues were identified in Track 1 / prior audit cycles and remediation has begun. This report consolidates all findings, documents what has been resolved, and calls out what remains open.

| Category | Finding Count | Resolved | Open |
|----------|--------------|----------|------|
| Orphaned migration files | 3 | 3 (idx 91–93) | 0 |
| Journal sequence gaps | 13 seq gaps | Not resolvable without history | Documented |
| Missing FK constraints | 22 tables | 0 | 22 |
| JSONB weak references | 6 locations | 0 | 6 |
| Duplicate entity tables | 2 pairs | 0 | 2 |
| Soft-delete inconsistency | 3 patterns | 0 | 3 |
| Missing indexes | 40+ | 40+ (migration 0088) | 0 |
| Duplicate index definitions | 2 | 2 (migration 0089) | 0 |
| Model/schema column mismatches | 5 known | 0 | 5 |
| Naming inconsistencies | 3 | 0 | 3 (flagged) |

---

## 1. Resolved Drift Items

### 1.1 Orphaned Migration Files — RESOLVED

Three SQL files existed on disk with sequence prefixes already claimed by a registered migration. They have been registered in the Drizzle journal as idx 91, 92, 93 with `CREATE TABLE IF NOT EXISTS` guards:

| idx | Tag | Tables Covered |
|-----|-----|---------------|
| 91 | `0091_register_szl_saas_layer_tables` | `onboarding_wizard_state`, `org_notification_settings` |
| 92 | `0092_register_crdt_change_events` | `change_events` (CRDT) |
| 93 | `0093_register_multi_channel_notifications` | `web_push`, `push_tokens` |

**Recommended action:** None — resolved.

### 1.2 Missing Indexes — RESOLVED

Migration `0088_missing_index_sweep` applied ~40 missing indexes across the Auth, Audit, Terra, Vessels, PRISM Counsel, and subscription billing domains. Migration `0089_drop_duplicate_indexes` removed two redundant unique index definitions.

---

## 2. Open Drift Items

### 2.1 Missing Foreign-Key Constraints — HIGH SEVERITY

The following tables have conceptual foreign-key relationships (evident from column naming and usage) but no declared Drizzle FK constraints. This means referential integrity is not enforced at the database level.

| Table | Column(s) | Conceptual Reference | Recommended Action |
|-------|-----------|---------------------|-------------------|
| `pc_matters` | `org_id`, `assigned_attorney_id`, `assigned_paralegal_id`, `created_by`, `updated_by` | `organizations.id`, `users.id` | Add FK constraints via migration |
| `pc_audit_events` | `actor_id` (many bare integer cols) | `users.id` | Align bare integer to FK |
| `vessels_fleets` | `org_id` | `organizations.id` | Add FK constraint |
| `vessels` | `org_id` | `organizations.id` | Add FK constraint |
| `vessels_alert_rules` | `org_id` | `organizations.id` | Add FK constraint |
| `dataverse_connections` | `azure_tenant_id` (text) | `azure_tenants.azure_tenant_id` | Text ref; migrate to integer FK or add check constraint |
| `terra_leads` | `owner_user_id` | `users.id` | Add FK constraint |
| `terra_deals` | `owner_user_id`, `linked_deal_id` | `users.id`, `terra_deals.id` | Add FK + self-ref FK |
| `terra_diligence_matters` | `owner_user_id` | `users.id` | Add FK constraint |
| `terra_diligence_evidence` | `reviewed_by_user_id` | `users.id` | Add FK constraint |
| `terra_covenants` | *(no org/tenant scope at all)* | — | Add `org_id` column + FK |
| `terra_waterfall_structures` | `owner_user_id` | `users.id` | Add FK constraint |
| `terra_construction_projects` | `owner_user_id` | `users.id` | Add FK constraint |
| `alloy_decisions` | `reviewed_by` (text) | `users.id` | Change type to integer, add FK |
| `firestorm_assessments` | `assessor_name` (text) | `users.id` | Change type to integer, add FK |
| `firestorm_incidents` | `assigned_analyst` (text) | `users.id` | Change type to integer, add FK |
| `firestorm_alerts` | `related_incident_id` | `firestorm_incidents.id` | Add FK constraint |
| `firestorm_cases` | `related_incident_ids`, `related_finding_ids` (JSONB arrays) | — | See §2.2 |
| `pc_gc_matters` | `org_id` (text, not integer) | — | Incompatible type; align to integer or document isolation |
| `sessions` | `replaced_by_session_id` | `sessions.id` | Add self-ref FK with ON DELETE SET NULL |

**Recommended action:** Create a new migration `0095_add_missing_fk_constraints` adding FK declarations. Use `ALTER TABLE … ADD CONSTRAINT … FOREIGN KEY … NOT VALID` first, then validate separately, to avoid locking during migration on large tables.

### 2.2 Weak References via JSONB Arrays — MEDIUM SEVERITY

Six locations store related entity IDs in JSONB arrays, bypassing relational integrity:

| Table | Column | Conceptual Relationship |
|-------|--------|------------------------|
| `firestorm_cases` | `related_incident_ids` (JSONB `number[]`) | `firestorm_incidents.id` |
| `firestorm_cases` | `related_finding_ids` (JSONB `number[]`) | `firestorm_findings.id` |
| `firestorm_incidents` | `related_finding_ids` (JSONB `number[]`) | `firestorm_findings.id` |
| `firestorm_mitre_detections` | `related_incident_ids`, `related_finding_ids` | Same as above |
| `firestorm_hardening_controls` | `linked_assets` (JSONB `string[]`) | `firestorm_assets.id` |
| `terra_leads` | `desired_areas`, `tags` (JSONB arrays) | No FK needed; metadata only |

**Recommended action:** For `firestorm_cases`, `firestorm_incidents`, and `firestorm_mitre_detections` — create explicit join tables (`firestorm_case_incidents`, `firestorm_case_findings`, `firestorm_incident_findings`) in a future migration. `terra_leads.desired_areas` and `terra_leads.tags` are metadata; defer.

### 2.3 Duplicate Entity Tables — HIGH SEVERITY

#### Org Membership Duplication

Two tables represent `(org, user, role)` triples:

| Table | Role Enum | Has Status? | Used By |
|-------|-----------|-------------|---------|
| `org_members` | `owner`, `admin`, `member`, `viewer` (4-value) | No | Auth repo (`authRepo`) |
| `organization_memberships` | `public`, `authenticated`, `member`, `client`, `editor`, `admin`, `super_admin` (7-value) | Yes (`active`, `invited`, `suspended`) | CMS/content middleware |

**Recommended action (REVIEW — requires human sign-off):** Consolidate into `org_members`. Extend role enum; add `status` column; backfill from `organization_memberships`; deprecate and eventually drop `organization_memberships`. Do not drop without a full usage audit of content middleware.

#### Skill Registry Duplication

Two skill registry tables with overlapping schemas:

| Table | Purpose | Used By |
|-------|---------|---------|
| `alloy_skills` | Alloy execution fabric skills | Alloy runtime |
| `agent_skills` | Agent OS skills | Agent kernel |

**Recommended action (REVIEW):** Determine if Alloy skills and Agent OS skills are the same concept. If yes, merge into a single registry with a `domain` discriminator. If no, document the distinction explicitly in schema comments.

### 2.4 Soft-Delete Inconsistency — MEDIUM SEVERITY

Three incompatible soft-delete patterns coexist:

| Pattern | Tables |
|---------|--------|
| `is_active BOOLEAN DEFAULT true` | `users`, `organizations`, `firestorm_scenarios`, `firestorm_assets`, `terra_leads`, `terra_deals`, `terra_covenants`, `terra_diligence_matters`, `vessels_alert_rules`, `alloy_skills`, `kgEntities`, `embeddingModelRegistry` |
| `revoked_at TIMESTAMP` | `sessions` (soft-revoke only) |
| `archived_at TIMESTAMP` | `alloy_artifacts` |
| No soft-delete | `audit_logs`, `roles`, `user_roles`, `org_members`, `billing_plans`, `subscriptions`, `invoices`, `pc_matters`, `firestorm_incidents`, `firestorm_findings`, `vessels`, `vessels_fleets` |

**Recommended action (REVIEW):** Standardize on `deleted_at TIMESTAMPTZ` with partial indexes `WHERE deleted_at IS NULL`. This is a multi-migration effort; prioritize high-traffic tables (`pc_matters`, `vessels`). Keep as open item until a soft-delete migration standard is agreed.

### 2.5 Model/Schema Column Mismatches — MEDIUM SEVERITY

Five known locations where the Drizzle ORM model definition does not match the inferred applied schema:

| Table | Column | Model Type | Inferred DB Type | Drift Source |
|-------|--------|-----------|-----------------|-------------|
| `alloy_decisions` | `reviewed_by` | `text` | Should be `integer` (FK to `users.id`) | Model uses string username; DB has no FK |
| `firestorm_assessments` | `assessor_name` | `text` | Should be `integer` (FK to `users.id`) | Same pattern |
| `firestorm_incidents` | `assigned_analyst` | `text` | Should be `integer` (FK to `users.id`) | Same pattern |
| `pc_gc_matters` | `org_id` | `text` | `organizations.id` is `integer` | GC matters use text PKs; org FK is type-incompatible |
| `simulation_sessions` | entire definition | v1 (from `0021`) → v2 (from `0025`) | v2 applied via IF NOT EXISTS | Schema has v2 columns; ORM model may reference v1 column names |

**Recommended action:** Align `reviewed_by`/`assessor_name`/`assigned_analyst` to integer FKs in a future migration. `pc_gc_matters.org_id` needs architectural decision (keep text isolation or align to integer). `simulation_sessions` needs a model review to confirm v2 column names match the ORM.

### 2.6 Naming Inconsistencies — LOW SEVERITY

| Inconsistency | Examples | Recommended Action |
|--------------|---------|-------------------|
| Mix of `camelCase` and `snake_case` table variable names | `a2aAgentCards` (camelCase in schema export) vs. `audit_logs` (snake_case) | Standardize export names to `camelCase` (Drizzle convention) — non-breaking |
| `_table` suffix inconsistency | Some exports end in `Table` (e.g., `agentRunsTable`), others do not (e.g., `vessels`) | Adopt `<domain><Entity>Table` convention consistently |
| `szl_` prefix on canonical tables mixed with domain prefixes | `szlActionsTable`, `szlVesselsTable` coexist with `vessels` and `vessels_fleets` | Document `szl_` as the legacy canonical prefix; new tables should use domain prefix |

---

## 3. Orphaned Tables (No API-Server Reference)

The prior `docs/schema-audit-2025-04.md` identified 115 tables with no direct reference in `artifacts/api-server/src/`. These are **not confirmed dead** — they may be used via:
- GraphQL subgraph layer (PRISM Counsel `pc_*` tables)
- Agent kernel / Alloy runtime (agent and A2A tables)
- Frontend direct queries (via lib packages)
- Platform monitoring (`szl_*` canonical tables)

**Recommended action:** Do not delete. Schedule a cross-package usage audit (see `audit/residual-risk-register.md` item RR-03).

---

## 4. Tables in `packages/db/migrations/` (Supplemental)

`packages/db/migrations/` contains one file:

| File | Content |
|------|---------|
| `0021_phase_b_missing_indexes.sql` | Phase B index sweep (supplemental to lib/db `0088_missing_index_sweep`) |

This migration is not registered in the Drizzle journal and must be applied manually or via the `packages/db-migrations` apply command. It is safe (index-only; `CREATE INDEX IF NOT EXISTS`).

---

## 5. Recommendations Summary

| Priority | Action | Effort | Risk |
|----------|--------|--------|------|
| HIGH | Add FK constraints to 22 tables (`0095_add_missing_fk_constraints`) | Large | Medium (use NOT VALID) |
| HIGH | Resolve `simulation_sessions` v1/v2 model mismatch | Small | Low |
| MEDIUM | Create join tables for JSONB array relations in firestorm | Medium | Low |
| MEDIUM | Consolidate `org_members` / `organization_memberships` | Large | High — requires human sign-off |
| MEDIUM | Consolidate skill registry tables | Medium | Medium |
| MEDIUM | Standardize soft-delete pattern | Large | High — requires human sign-off |
| LOW | Fix naming inconsistencies | Small | Low |
| LOW | Apply `packages/db/migrations/0021_phase_b_missing_indexes.sql` | Trivial | None |
