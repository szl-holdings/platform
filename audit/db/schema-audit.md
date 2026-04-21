# Schema Audit — SZL Holdings
**Date:** 2026-04-20  
**Scope:** `lib/db/src/schema/` (140+ files), `packages/db-schema/`, `packages/db-repository/`  
**ORM:** Drizzle ORM (PostgreSQL via `drizzle-orm/pg-core`)

---

## 1. Foreign-Key Integrity

### 1.1 Missing Foreign Keys — HIGH SEVERITY

| Table | Column | References (conceptual) | Status |
|-------|--------|------------------------|--------|
| `pc_matters` | `org_id` (integer) | `organizations.id` | **No FK declared** |
| `pc_matters` | `assigned_attorney_id` (integer) | `users.id` | **No FK declared** |
| `pc_matters` | `assigned_paralegal_id` (integer) | `users.id` | **No FK declared** |
| `pc_matters` | `created_by`, `updated_by` (integer) | `users.id` | **No FK declared** |
| `pc_audit_events` | `actor_id`, `matter_id` | `users.id`, `pc_matters.id` | Partial — `matter_id` references declared but many integer columns are bare |
| `vessels_fleets` | `org_id` (integer) | `organizations.id` | **No FK declared** |
| `vessels` | `org_id` (integer) | `organizations.id` | **No FK declared** |
| `vessels_alert_rules` | `org_id` (integer) | `organizations.id` | **No FK declared** |
| `dataverse_connections` | `azure_tenant_id` (text) | `azure_tenants.azure_tenant_id` | **Text reference, no FK constraint** |
| `terra_leads` | `owner_user_id` (integer) | `users.id` | **No FK declared** |
| `terra_deals` | `owner_user_id` (integer) | `users.id` | **No FK declared** |
| `terra_deals` | `linked_deal_id` (integer) | `terra_deals.id` | **Self-referential, no FK** |
| `terra_diligence_matters` | `owner_user_id` | `users.id` | No FK |
| `terra_diligence_evidence` | `reviewed_by_user_id` | `users.id` | No FK |
| `terra_covenants` | (no orgId/tenantId at all) | — | **No tenant scope** |
| `terra_waterfall_structures` | `owner_user_id` | `users.id` | No FK |
| `terra_construction_projects` | `owner_user_id` | `users.id` | No FK |
| `alloy_decisions` | `reviewed_by` (text) | — | Should reference `users.id` but is bare text |
| `firestorm_assessments` | `assessor_name` (text) | — | Should be user FK |
| `firestorm_incidents` | `assigned_analyst` (text) | — | Should be user FK |
| `firestorm_alerts` | `related_incident_id` (integer) | `firestorm_incidents.id` | **No FK declared** |
| `firestorm_cases` | references incident/finding IDs in JSONB arrays | — | No relational integrity possible |
| `pc_gc_matters` | `org_id` (text, not integer) | — | Uses text PK pattern; incompatible with integer org FK |

### 1.2 Weak References via JSONB Arrays — MEDIUM SEVERITY

Many tables store related IDs in JSONB arrays rather than proper junction tables. This breaks referential integrity at the database level:

- `firestorm_cases.related_incident_ids` (JSONB `number[]`)
- `firestorm_cases.related_finding_ids` (JSONB `number[]`)
- `firestorm_incidents.related_finding_ids` (JSONB `number[]`)
- `firestorm_mitre_detections.related_incident_ids` / `related_finding_ids`
- `firestorm_hardening_controls.linked_assets` (JSONB `string[]`)
- `terra_leads.desired_areas`, `terra_leads.tags` (JSONB arrays)

**Recommendation:** Convert junction relationships to explicit join tables where query patterns require filtering by the related entity.

### 1.3 `replaced_by_session_id` Without FK — LOW SEVERITY

`sessions.replaced_by_session_id` (integer) has no FK back to `sessions.id`. If a session is deleted, the replacement pointer becomes a dangling integer.

---

## 2. Soft-Delete Behavior

### 2.1 No Consistent Soft-Delete Strategy

The codebase uses **three incompatible soft-delete patterns** with no single convention:

| Pattern | Tables Using It |
|---------|-----------------|
| `is_active BOOLEAN DEFAULT true` | `users`, `organizations`, `firestorm_scenarios`, `firestorm_assets`, `terra_leads`, `terra_deals`, `terra_covenants`, `terra_diligence_matters`, `vessels_alert_rules`, `alloy_skills`, `kgEntities`, `embeddingModelRegistry` |
| `revoked_at TIMESTAMP` | `sessions` (soft-revoke only) |
| `archived_at TIMESTAMP` | `alloy_artifacts` |
| **No soft-delete at all** | `audit_logs`, `roles`, `user_roles`, `org_members`, `organization_memberships`, `billing_plans`, `subscriptions`, `invoices`, `pc_matters`, `pc_parties`, `pc_claims`, `firestorm_incidents`, `firestorm_findings`, `vessels`, `vessels_fleets` |

### 2.2 Missing `deleted_at` Timestamp Pattern

No table uses the idiomatic `deleted_at TIMESTAMPTZ` pattern, which would allow:
- Partial indexes (`WHERE deleted_at IS NULL`) for live-record performance
- Point-in-time recovery queries
- Consistent tooling for bulk deletion/restoration

### 2.3 Status Enum as Proxy for Soft Delete — RISKY

Several tables use status enums that contain an `'archived'` or `'canceled'` value as a proxy for deletion. This pattern prevents accidental hard-deletes but means rows are never removed from hot tables:

- `alloy_workflows.status` includes `'cancelled'`
- `firestorm_assessments.status` includes `'canceled'`
- `firestorm_campaigns.status` includes `'archived'`
- `vessels_simulations.status` includes `'failed'` / `'completed'` (but never removed)

**Recommendation:** Adopt a single `deleted_at TIMESTAMPTZ DEFAULT NULL` column across all mutable domain tables. Add a partial index `WHERE deleted_at IS NULL` on primary lookup paths. Remove `is_active` where `deleted_at` covers the same intent (single source of truth).

---

## 3. Audit Trail Coverage

### 3.1 Five Parallel Audit Trail Mechanisms — HIGH SEVERITY

The codebase has five distinct, non-interoperable audit systems:

| Table | Domain | Structure | Limitation |
|-------|--------|-----------|------------|
| `audit_logs` | Platform-wide | `(org_id, actor_user_id, action_type, entity_type, entity_id, payload_json)` | No index on `created_at` or `actor_user_id`; `site_id` is bare integer with no FK |
| `alloy_audit_log` | Alloy workflow engine | `(entity_type enum, entity_id, action, actor_user_id, prev_state, new_state, diff)` | Well-indexed; but duplicates `audit_logs` purpose |
| `firestorm_tool_audit_log` | Security tool calls | `(tool_name, called_by, execution_mode, approval_status, result, arguments, output)` | No FK to `users`; `called_by` and `tenantId` are text only |
| `firestorm_tradecraft_validation_audit` | AI output validation | `(decision_type, validation_errors, raw_output, raw_payload)` | Narrowly scoped; not a general audit |
| `pc_audit_events` | Prism Counsel matters | `(matter_id, org_id, actor_id, action, entity_type, entity_id, details)` | No FK on `actor_id`, `assigned_to` |

### 3.2 Domains with No Audit Trail

- **Terra real estate**: No audit on property, deal, or lead mutations
- **Vessels maritime**: No audit on vessel, cargo, or route changes
- **Billing**: No audit on subscription changes or invoice mutations
- **Auth/Sessions**: Sessions are revoked but revocation reason is stored on the session — no separate audit row when role is changed
- **Organizations**: No audit on membership changes (org_members inserts/deletes)

### 3.3 JSONB Embedded Audit Trails — ANTI-PATTERN

Several tables embed an `audit_trail JSONB` column that stores a flat list of `{action, user, at}` objects inline. This cannot be queried efficiently, grows unboundedly, and bypasses the relational audit system:

- `firestorm_findings.audit_trail`
- `firestorm_hardening_controls.audit_trail`
- `firestorm_compliance_controls.audit_trail`
- `firestorm_cases.audit_trail`
- `firestorm_case_memory.change_log`

**Recommendation:** Extend `alloy_audit_log` to be the single platform audit table, adding `domain` and `tenant_id` columns. Deprecate domain-specific audit tables over two migration cycles. Replace JSONB embedded audit trails with references to the central audit table.

---

## 4. Enum Drift

### 4.1 `real_estate_ops_user` Missing from Database Column — HIGH SEVERITY

The TypeScript `CanonicalRole` type (in `auth.ts`) includes `'real_estate_ops_user'`, and `CANONICAL_TO_LEGACY` maps it to `'ops'`. However:

- `users.platform_role` column enum does NOT include `'real_estate_ops_user'`
- `PLATFORM_ROLE_HIERARCHY` does NOT include `'real_estate_ops_user'`
- `PLATFORM_ROLES` array does NOT include `'real_estate_ops_user'`

Any attempt to write `real_estate_ops_user` into the `users.platform_role` column will fail at the database layer. The type system silently hides this.

**Action:** Add `'real_estate_ops_user'` to the `platform_role` enum via a migration, or remove it from `CanonicalRole`.

### 4.2 Three Parallel Role Systems — HIGH SEVERITY

| System | Location | Values | Usage |
|--------|----------|--------|-------|
| `platformRole` (DB enum) | `users.platform_role` | 11 values | Auth middleware |
| `RoleName` (DB table) | `roles` + `user_roles` tables | 16 values | Legacy CMS/content gate |
| `CanonicalRole` (TS type) | `auth.ts` | 12 values | API contracts |
| `CmsRole` (TS type) | `organizations.ts` | 7 values | `organization_memberships.role` |
| `SzlRole` (TS const) | `szl_canonical.ts` | 11 values | Duplicate of platform roles |
| `org_members.role` (DB enum) | `organizations.ts` | 4 values (owner/admin/member/viewer) | Org membership |
| `org_invitations.role` (DB enum) | `invitations.ts` | 3 values (admin/member/viewer) | Invitation grant |

**The `LEGACY_TO_CANONICAL` and `CANONICAL_TO_LEGACY` mapping tables are the only bridge**, but they are defined in TypeScript, not enforced by the database. The `roles` table could accumulate rows that have no canonical equivalent.

### 4.3 Inconsistent Severity Enums Across Domains

All three major domains define their own `severity` enum independently, with slightly different members:

| Domain | Enum Values |
|--------|-------------|
| Firestorm (findings, incidents, assets) | `low, medium, high, critical` |
| Firestorm (findings severity) | `info, low, medium, high, critical` (adds `info`) |
| Vessels (events) | `watch, warning, critical` (completely different vocabulary) |
| Vessels (alerts, alert_rules) | `low, medium, high, critical` |
| Alloy (signals, workflows, actions) | `info, low, medium, high, critical` |
| Terra (deals risk) | `low, medium, high, critical` |

This prevents cross-domain severity aggregation without explicit mapping.

---

## 5. Naming Consistency

### 5.1 Inconsistent Primary Key Column Type

| Pattern | Tables |
|---------|--------|
| `serial('id')` (integer sequence) | Most core tables: `users`, `organizations`, `sessions`, `alloy_*`, `firestorm_*`, `vessels_*` |
| `uuid('id').defaultRandom()` | `kg_entities`, `kg_relationships`, `embedding_tasks`, `kgCrossDomainLinks`, `embeddingModelRegistry` |
| `text('id').primaryKey()` | `pc_gc_matters`, `terra_diligence_matters`, `terra_diligence_evidence`, `rag_knowledge_chunks`, `rag_knowledge_documents` |
| Composite PK | `pc_gc_obligations` (primaryKey) |

Three PK type systems coexist. UUID keys cannot be reliably joined with serial integer FKs.

### 5.2 Inconsistent Timestamp Column Naming

| Pattern | Example |
|---------|---------|
| `created_at` without timezone | Most tables using `timestamp()` |
| `created_at` with timezone (`withTimezone: true`) | `knowledge_graph`, `rag_knowledge_chunks`, `mfa_secrets`, `firestorm_tradecraft_*` |

Mixing timezone-aware and timezone-naive timestamps creates comparison bugs when Postgres returns UTC offsets for one and local time for the other.

### 5.3 Inconsistent FK Naming Convention

FKs to organizations use three column names:
- `org_id` (most tables)
- `organization_id` (subscriptions, azure_tenants)
- `orgId` (text, in pc_gc_matters and some JSONB scoping)

---

## 6. Nullable Column Misuse

### 6.1 Columns That Should Be NOT NULL

| Table | Column | Issue |
|-------|--------|-------|
| `users` | `platform_role` | Nullable — should have a default (`'operator'` or `'anonymous_visitor'`) |
| `users` | `email` | Nullable — allows accounts with no email address or replitId, making deduplication impossible |
| `vessels` | `mmsi` | Nullable with no uniqueness constraint — duplicate MMSIs are possible |
| `alloy_decisions` | `confidence` (integer) | Nullable and uses integer 0-100; other tables use `real` 0.0-1.0 — inconsistent type |
| `terra_covenants` | `last_status` (text) | Nullable with no enum constraint |
| `firestorm_campaigns` | `budget`, `spent` | `spent` defaults `'0'` but `budget` is fully nullable — permits spend > budget checks to fail |

### 6.2 Columns That Are Incorrectly NOT NULL

| Table | Column | Issue |
|-------|--------|-------|
| `audit_logs` | `action_type`, `entity_type` | Both NOT NULL but `entity_id` is nullable — an audit row with no entity ID is incomplete for most uses |
| `terra_leads` | `first_name`, `last_name` | NOT NULL — prevents lead capture when only a company name is known |

---

## 7. Tenant Boundary Integrity

### 7.1 Inconsistent Multi-Tenancy Model — HIGH SEVERITY

The schema uses two incompatible multi-tenancy models simultaneously:

**Model A — Integer org_id** (older tables):  
`users`, `organizations`, `org_members`, `audit_logs`, `api_keys`, `subscriptions`, `billing_plans`, `vessels_*`, `pc_matters`, `pc_*`

**Model B — Text tenant_id** (newer AI/KG tables):  
`rag_knowledge_chunks`, `kg_entities`, `firestorm_tradecraft_decisions`, `firestorm_tool_audit_log`, `firestorm_tradecraft_validation_audit`, `azure_tenants` (via `azure_tenant_id` text)

These two models cannot be joined without a mapping table. There is no canonical mapping from `text tenant_id` to `integer org_id`.

### 7.2 Tables with No Tenant Scope

The following tables have no `org_id` or `tenant_id` and therefore represent shared/global state:

- `users` (global — no org scoping at the row level)
- `roles` (global role registry)
- `billing_plans` (global plan catalog)
- `firestorm_scenarios` (global scenario library — not org-scoped)
- `firestorm_hardening_controls` (control catalog — not org-scoped)
- `alloy_skills` (global skill registry)
- `embedding_model_registry` (global)
- `terra_portfolio_modules` (global seed data)

For a multi-tenant SaaS platform, the absence of org scoping on `firestorm_scenarios` and `firestorm_hardening_controls` means all tenants share the same scenario/control catalog with no ability to customize per-tenant.

### 7.3 Azure SCIM Tables — Correct but Isolated

`scim_tokens`, `scim_groups`, `scim_provisioned_users`, `scim_sync_logs` all FK to `azure_tenants.id` (integer). This is the correct Model A pattern, but `azure_tenants` itself links to `organizations` via nullable `organization_id` — making the bridge between Azure tenants and SZL organizations a soft association that isn't enforced.

---

## 8. Summary Risk Matrix

| Finding | Severity | Safe to Auto-Fix | Requires Human Approval |
|---------|----------|-----------------|------------------------|
| `real_estate_ops_user` missing from DB enum | HIGH | Yes — add migration | No |
| Three parallel role systems | HIGH | No | Yes |
| Inconsistent multi-tenancy model (int vs text) | HIGH | No | Yes |
| 13 missing FK constraints on integer org/user cols | HIGH | Partial (nullable FKs) | For NOT NULL |
| Five parallel audit trail mechanisms | HIGH | No | Yes |
| No consistent soft-delete pattern | MEDIUM | No | Yes |
| JSONB embedded audit_trail arrays | MEDIUM | No (read data first) | Yes |
| Timezone-naive vs timezone-aware timestamps | MEDIUM | No | Yes |
| Severity enum fragmentation | MEDIUM | No | Yes |
| `sessions.replaced_by_session_id` dangling ref | LOW | Yes | No |
| Missing `updated_at` on volatile tables | LOW | Yes | No |
| `vessels.mmsi` uniqueness | LOW | Yes | No |

---

## 12. Appendix — Phase B Cross-Reference

Findings from the parallel Phase B audit that complement the analysis above. Several overlap with sections 1–11; this section captures additional Alloy-specific table redundancies and timestamp consistency findings not covered above.

### 12.1 Alloy Domain — Duplicate Entity Tables

In addition to the org-membership duplication called out in `redundancy-audit.md §1`, the Alloy domain has at least three duplicated entity surfaces:

| Pair | Tables | Files | Note |
|------|--------|-------|------|
| Signals | `alloy_signals` vs `platform_signals` | `alloy.ts`, `alloy_platform.ts` | Both expose `source/severity/status/metadata/createdAt`. Determine canonical table, write migration to consolidate (destructive — gated). |
| Workflow definitions | `alloy_workflows` vs `platform_workflows` vs `alloy_runtime_workflows` | `alloy.ts`, `alloy_platform.ts`, `alloy_runtime.ts` | Definition vs runtime split is legitimate but unclear. Document the boundary. |
| Audit log | `alloy_audit_log` vs `platform_audit_log` vs global `audit_logs` | `alloy.ts`, `alloy_platform.ts`, `audit_logs.ts` | See §3 — five parallel audit mechanisms total. |

### 12.2 Severity Enum Member Order Inconsistency

The `platform_signals.severity` enum lists members in descending order (`critical, high, medium, low, info`) while every other severity enum lists ascending. Cosmetic in PostgreSQL but confusing for developers reading the schema. Standardize to ascending order in a Phase 2 enum-rewrite migration.

### 12.3 Timestamp Column Coverage Gaps

Tables missing `updatedAt` or with non-standard timestamp coverage:

| Table | Issue |
|-------|-------|
| `vessels_positions` | Has `recordedAt` but no `createdAt` |
| `vessels_cargo` | `createdAt` only |
| `vessels_routes` | `createdAt` only |
| `firestorm_simulation_runs` | Has `createdAt`, `startedAt`, `completedAt` but no `updatedAt` |
| `org_members` | Has `joinedAt` but no `createdAt`/`updatedAt` |

**Recommendation:** Additive migration adding `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()` to the affected tables. Non-destructive — eligible for Phase 1 if prioritized in a future sweep.

### 12.4 Tenant Boundary Gaps Beyond §7.1

Tables with no organization scoping at all:

- `firestorm_scenarios`, `firestorm_assessments`, `firestorm_findings` — currently global; needs `org_id REFERENCES organizations(id)` for tenant isolation. Destructive — requires backfill of org context for existing rows. Gated.
- `projects`, `comments` — verified missing `org_id`.
- `roles` — global by design (acceptable).

### 12.5 `mfa_secrets` Table Provenance

`lib/db/src/schema/auth.ts` exports `mfaSecretsTable` (`mfa_secrets`), but no migration creates it. Likely applied via `drizzle-kit push`. See `migration-drift.md §9.3` for a list of similar untracked tables and §9.2 for the recommended `migrate` switch.

---

## 13. Phase 1 Status — Applied in this Audit

| Finding | Status | Reference |
|---------|--------|-----------|
| `'real_estate_ops_user'` enum drift (§4.1) | **APPLIED** | Migration `0090_add_real_estate_ops_role`; ORM `platformRole` enum + `PLATFORM_ROLES` + `PLATFORM_ROLE_HIERARCHY` updated in `auth.ts` |
| Missing FK-backing indexes across pc_*, vessels_*, audit_logs, sessions, api_keys, notifications, billing (§1) | **APPLIED** | Migration `0088_missing_index_sweep`; mirrored in 9 ORM schema files via `index(...)` declarations — see `index-audit.md` |
| Redundant indexes (`azure_tenants_tenant_id_idx`, `scim_tokens_hash_idx`) | **APPLIED** | Migration `0089_drop_duplicate_indexes`; ORM `uniqueIndex` declarations removed |
| Soft-delete unification (§2) | **GATED** | Phase 2 — requires `deleted_at` migration, partial indexes, code paths updated |
| Audit-trail consolidation (§3) | **GATED** | Phase 2 — destructive consolidation of `alloy_audit_log` / `pc_audit_events` / `firestorm_*_audit_log` into `audit_logs` |
| Multi-tenancy unification (§7) | **GATED** | Phase 3 — requires mapping table between `text tenant_id` and `integer org_id` before any consolidation |
| Three parallel role systems (§4.2) | **GATED** | Phase 3 — touches auth middleware, API contracts, CMS layer |

See `consolidation-plan.md` for full Phase 2/3 sequencing and human-approval gates.
