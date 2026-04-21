# Database Schema Audit

Generated: 2026-04-20  
Phase: B (Code Quality & Database Audit)

Schema location: `lib/db/src/schema/` (168 files, ~24,163 lines total)  
ORM: Drizzle ORM (`drizzle-orm` v0.45.2)

---

## 1. Duplicate / Overlapping Tables

### 1.1 Organization Membership — Two Tables

**File:** `lib/db/src/schema/organizations.ts`

| Table | SQL Name | Role Enum | Has `status`? | Has `updatedAt`? |
|-------|----------|-----------|---------------|-----------------|
| `orgMembersTable` | `org_members` | owner, admin, member, viewer | No | No (joinedAt only) |
| `organizationMembershipsTable` | `organization_memberships` | public, authenticated, member, client, editor, admin, super_admin | Yes | Yes |

Both tables join `organizations` and `users`. Having two membership tables creates ambiguity about which is authoritative for permission checks.

**Recommendation (destructive — human approval required):** Merge into `org_members`. Add `status` and `updatedAt` to `org_members`. The CMS role set on `organization_memberships` should be handled by a separate CMS permission layer. Write a migration to copy rows from `organization_memberships` to `org_members` before dropping.

---

### 1.2 Alloy Signal Tables — Two Tables

| Table | SQL Name | File |
|-------|----------|------|
| `alloySignals` | `alloy_signals` | `alloy.ts` |
| `alloySignalsTable` | `platform_signals` | `alloy_platform.ts` |

Both represent inbound signals driving the Alloy workflow engine. Both have `source`, `severity`, `status`, `metadata`, `createdAt`.

**Recommendation (destructive):** Determine canonical table. If `platform_signals` is the intended migration target, deprecate `alloy_signals` and write a data migration. Flag for human approval.

---

### 1.3 Alloy Workflow Tables — Three Tables

| Table | SQL Name | File |
|-------|----------|------|
| `alloyWorkflows` | `alloy_workflows` | `alloy.ts` |
| `alloyWorkflowsTable` | `platform_workflows` | `alloy_platform.ts` |
| `alloyRuntimeWorkflowsTable` | `alloy_runtime_workflows` | `alloy_runtime.ts` |

`alloy_workflows` and `platform_workflows` likely overlap. `alloy_runtime_workflows` may be legitimately a runtime execution record separate from the workflow definition.

**Recommendation:** Clarify domain boundary. If `platform_workflows` supersedes `alloy_workflows`, consolidate (destructive). Document the definition/runtime split.

---

### 1.4 Alloy Audit Log — Two Domain-Specific Tables Plus Global

| Table | SQL Name | File |
|-------|----------|------|
| `alloyAuditLog` | `alloy_audit_log` | `alloy.ts` |
| `alloyAuditLogTable` | `platform_audit_log` | `alloy_platform.ts` |
| `auditLogsTable` | `audit_logs` | `audit_logs.ts` |

The global `audit_logs` table is the platform-wide append-only trail. The Alloy-specific tables duplicate this concern for a single domain.

**Recommendation:** Route Alloy audit events through `audit_logs` with `entity_type = "alloy_workflow" | "alloy_signal"`. Remove domain-specific audit tables. Destructive — flag for human approval.

---

## 2. Nullable Fields That Should Not Be Nullable

### 2.1 `users.platformRole` — No DEFAULT, Nullable

```ts
platformRole: text("platform_role", { enum: [...] }),  // nullable, no default
```

Every user should have a platform role. Nullable with no default means a user inserted without a role is invisible to role-based guards.

**Recommendation:** Add `NOT NULL DEFAULT 'operator'` or a similar safe default. Write a data migration to backfill NULL rows before adding the constraint.

---

### 2.2 `audit_logs.organizationId` — Nullable

The `audit_logs.organization_id` references `organizations` but is nullable (`onDelete: "set null"`). For multi-tenant audit integrity, every log entry should be scoped to an organization or have a explicit "platform" sentinel.

**Recommendation:** Add a `siteId`-like identifier to distinguish platform-level logs from org-scoped logs, rather than relying on NULL to mean "platform".

---

### 2.3 `vessels_fleets.orgId` — Nullable Integer, No FK

```ts
orgId: integer("org_id"),  // nullable, no FK reference
```

Fleet records are not scoped to an organization via a proper FK. Same pattern exists on `vessels.orgId`, `vessels_alert_rules.orgId`.

**Recommendation:** Add a FK reference to `organizationsTable` and enforce NOT NULL for multi-tenant isolation. This is a behavioral change — flag for human approval.

---

### 2.4 `firestorm_scenarios` — No `orgId` at All

`firestorm_scenarios`, `firestorm_assessments`, `firestorm_findings` have no `orgId`/`organizationId` column. These records are globally shared rather than tenant-scoped.

**Recommendation:** Add `orgId integer REFERENCES organizations(id)` to tenant-scope security scenarios. Destructive if existing data lacks org context.

---

## 3. Naming and Enum Drift

### 3.1 Column Name Inconsistency for Organization Reference

Different tables use different column names for the same FK:

| Column Name | Example Tables |
|-------------|---------------|
| `org_id` | vessels_*, firestorm_*, alloy_*, platform_* |
| `organization_id` | audit_logs, organization_memberships |
| `orgId` (no column) | prism_counsel tables use `orgId: integer("org_id").notNull()` |

All should standardize on `org_id` (snake_case, consistent with the table name `organizations`).

---

### 3.2 Severity Enum Inconsistency

`severity` values vary across tables:

| Tables | Severity Values |
|--------|----------------|
| `firestorm_findings` | `"info", "low", "medium", "high", "critical"` |
| `vessels_alerts`, `vessels_alert_rules` | `"low", "medium", "high", "critical"` |
| `alloy_signals` | `"info", "low", "medium", "high", "critical"` |
| `platform_signals` | `"critical", "high", "medium", "low", "info"` (reversed order) |

The `platform_signals` severity enum lists values in descending order while others list ascending. This is cosmetic in PostgreSQL but confusing.

**Recommendation:** Standardize to `"info", "low", "medium", "high", "critical"` order and consider a shared `pgEnum`.

---

### 3.3 Status Enum Variations for "Canceled"

| Tables | Value Used |
|--------|-----------|
| `vessels_routes` | `"canceled"` |
| `firestorm_assessments` | `"canceled"` |
| `alloy_workflow_runs` | `"canceled"` |

Consistent. No "cancelled" variant found — good.

---

## 4. Audit Trail Coverage

The `audit_logs` table provides global coverage with `actionType`, `entityType`, `entityId`, `actorUserId`. However:

| Domain | Audit Log Coverage |
|---------|--------------------|
| Auth (login/logout, password change) | Unknown — not confirmed in auth route handlers |
| Alloy workflow runs | Has domain-specific `alloy_audit_log` — not unified |
| Terra property mutations | No dedicated audit table; global `audit_logs` if routes call it |
| Firestorm findings | `findings.auditTrail` is a JSONB column (inline, not relational) |
| Vessels alert triggers | No dedicated audit trail |
| PRISM Counsel matters | Has `pc_matters.updatedBy` but no append-only event log |

**Recommendation:** Establish a consistent `audit_logs` write pattern in the API server middleware so every mutating endpoint produces an audit record automatically, rather than relying on individual route implementations.

---

## 5. Tenant Boundary Enforcement

**Tables with NO tenant (org) scoping:**
- `firestorm_scenarios` — global scenarios
- `firestorm_assessments` — global assessments  
- `roles` — global role definitions (appropriate)
- `projects` — no `orgId`
- `files` — check for org scoping
- `comments` — no `orgId` confirmed

**Risk:** Without tenant isolation on domain data tables, a query without a `WHERE org_id = ?` clause will return data across all tenants.

**Recommendation:** Add `orgId NOT NULL REFERENCES organizations(id)` to all domain data tables that represent tenant-owned resources. Generate a migration for each. These are additive (adding a column with a default or backfilling from context) — medium risk.

---

## 6. Foreign Key Integrity

### Missing FK References (Nullable FKs That Reference Nothing)

| Table | Column | Issue |
|-------|--------|-------|
| `vessels_fleets` | `org_id` | No FK reference declared |
| `vessels` | `org_id` | No FK reference declared |
| `vessels_alert_rules` | `org_id` | No FK reference declared |
| `prism_counsel_*.orgId` | Various | Declared as `notNull()` but no FK reference to `organizations` |
| `audit_logs.siteId` | `site_id` | Integer with no FK — what table does it reference? |

**Recommendation:** Add FK declarations for all `org_id` columns that reference `organizations(id)`. The `siteId` on `audit_logs` is ambiguous — clarify or remove.

---

## 7. Soft-Delete Consistency

Only **2 files** contain `deletedAt`/`deleted_at` or `isDeleted`/`is_deleted` patterns across all schema files.

Most tables use `status` enums (e.g., `"active"/"inactive"/"archived"`) as a logical delete signal rather than a dedicated soft-delete column. This is acceptable but inconsistent:

- Some tables can represent "deleted" state via status
- Others have no inactive/archived state at all
- Cascaded hard-deletes are used (`onDelete: "cascade"`) in most child tables

**Recommendation:** Define a monorepo-wide soft-delete policy. If soft-delete is required for compliance (audit trails, recovery), add `deleted_at TIMESTAMPTZ` to all tenant-owned domain tables. If hard-delete is acceptable, document this explicitly in the schema conventions file.

---

## 8. Timestamp Consistency

Most tables have `createdAt` + `updatedAt` with `defaultNow()` and `notNull()`. Exceptions:

| Table | Issue |
|-------|-------|
| `vessels_positions` | Has `recordedAt` but no `createdAt` |
| `vessels_cargo` | Has `createdAt` but no `updatedAt` |
| `vessels_routes` | Has `createdAt` but no `updatedAt` |
| `firestorm_simulation_runs` | Has `createdAt`, `startedAt`, `completedAt` but no `updatedAt` |
| `org_members` | Has `joinedAt` but no `createdAt`/`updatedAt` |

**Recommendation:** Add `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()` to all tables missing it. This requires a non-destructive additive migration.

---

## 9. MFA Secrets Table — Not in Migration History

`lib/db/src/schema/auth.ts` exports `mfaSecretsTable` (`mfa_secrets`). Cross-referencing migration files, no migration creates this table. It either:
1. Was dropped from migration history
2. Was applied via schema push (`drizzle-kit push`) without generating a migration

**Recommendation:** Generate a Drizzle migration for this table if it belongs in production. See `migration-drift.md` for full drift analysis.
