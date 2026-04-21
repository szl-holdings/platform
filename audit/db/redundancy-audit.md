# Redundancy Audit — SZL Holdings
**Date:** 2026-04-20  
**Scope:** `lib/db/src/schema/` — all 140+ schema files  
**Focus:** Duplicate/overlapping entities, tables that should be merged, repeated reference data

---

## 1. Duplicate Entity: Org Membership — HIGH SEVERITY

Two tables serve nearly identical purposes: tracking which users belong to which organization and with what role.

### `org_members` (in `organizations.ts`)
```
id, org_id → organizations, user_id → users,
role ENUM('owner','admin','member','viewer'),
joined_at TIMESTAMP
```

### `organization_memberships` (in `organizations.ts`)
```
id, organization_id → organizations, user_id → users,
role ENUM('public','authenticated','member','client','editor','admin','super_admin'),
status ENUM('active','invited','suspended'),
created_at, updated_at
```

**Overlap:** Both tables represent `(org, user, role)` triples. `org_members` uses a 4-value role enum and a single timestamp. `organization_memberships` uses a 7-value CMS-style role enum, a status field, and `created_at`/`updated_at`.

**Root cause:** `org_members` was created for the platform auth layer; `organization_memberships` was added later when CMS content-gating was introduced. Both are actively used — `authRepo` reads from `org_members`; CMS/content middleware reads from `organization_memberships`.

**Recommendation:** Consolidate into a single `org_members` table. Extend the role enum to cover all necessary values, and add a `status` column. Treat `organization_memberships` as deprecated; backfill `org_members` from it; then drop. Flag as requiring human approval before destructive drop step.

---

## 2. Duplicate Entity: Skill Registry — HIGH SEVERITY

Two separate skill registry tables exist with overlapping schemas:

### `alloy_skills` (in `alloy.ts`)
```
id, name, slug, version, category, description, approval_class,
is_internal, is_enabled, dry_run_supported, input_schema, output_schema,
tags, usage_count, last_used_at, deprecated_at, metadata,
created_at, updated_at
```

### `skill_library` (dead code, deliberately excluded from `index.ts`)
The `index.ts` barrel comment reads:
> `./skill_library` is intentionally NOT re-exported: its `skill_runs` table duplicates the canonical one in `./cognitive_runtime` and produces a "duplicated index name across public schema" warning from drizzle-kit. The file is kept for reference but is dead code.

**Action:** Delete `lib/db/src/schema/skill_library.ts`. The file is already excluded from the schema barrel and can only cause confusion or accidental re-import.

---

## 3. Duplicate Entity: Simulation Sessions — HIGH SEVERITY

Two simulation tables exist for what appears to be the same domain-generic simulation concept:

### `simulation_sessions` / `simulation_snapshots` / `simulation_results` (in `simulation.ts`)
Domain-generic table with `domain` discriminator. Created by manual migrations 0021 and 0025 (same name, different content — see Migration Drift report).

### `firestorm_simulation_runs` (in `firestorm.ts`)
Firestorm-specific simulation table with `assessmentId`, `scenarioId`, parameters, results.

### `vessels_simulations` (in `vessels.ts`)
Vessels-specific simulation table with `routeId`, `vesselId`, `simulationType`.

**Analysis:** The generic `simulation_sessions` table was clearly intended to replace the domain-specific tables by adding a `domain` discriminator. However, the domain-specific tables were not removed. The result is:
- Firestorm may write to `firestorm_simulation_runs` (old) or `simulation_sessions` (new)
- The migration history shows 0021 and 0025 both named `simulation_persistence`, suggesting a failed consolidation attempt

**Recommendation:** Designate `simulation_sessions` as the canonical table. Add a migration that:
1. Migrates data from `firestorm_simulation_runs` into `simulation_sessions` with `domain='firestorm'`
2. Migrates data from `vessels_simulations` into `simulation_sessions` with `domain='vessels'`
3. Drops the domain-specific tables (REQUIRES HUMAN APPROVAL)

---

## 4. Fragmented Entity: Prism Counsel Domain — HIGH SEVERITY

The Prism Counsel (PRISM) legal domain has exploded into 13 separate schema files, each defining overlapping tables:

| File | Key Tables |
|------|------------|
| `prism_counsel.ts` | `pc_matters`, `pc_parties`, `pc_claims`, `pc_offers`, `pc_medical_events`, `pc_damages`, `pc_liens`, `pc_deadlines`, `pc_discovery`, `pc_depositions`, `pc_forecasts`, `pc_readiness_scores`, `pc_communications`, `pc_ai_recommendations`, `pc_approval_requests`, `pc_audit_events`, `pc_witnesses`, `pc_document_chunks`, `pc_privilege_flags`, `pc_inconsistency_flags`, `pc_exports`, `pc_matter_tags`, `pc_connector_accounts`, `pc_connector_sync_runs`, `pc_playbooks`, `pc_tasks` |
| `prism_counsel_ny.ts` | `pc_matter_clocks`, `pc_no_fault_claims`, + NY-specific tables |
| `prism_counsel_gc.ts` | `pc_gc_matters`, `pc_gc_obligations`, + GC-specific tables |
| `prism_counsel_omega.ts` | Additional OMEGA-module tables |
| `prism_counsel_ops.ts` | Ops-specific tables |
| `prism_counsel_pilot.ts` | Pilot customer tables |
| `prism_counsel_pilot_one.ts` | Pilot 1 tables |
| `prism_counsel_purview.ts` | Purview-specific tables |
| `prism_counsel_recovery.ts` | Recovery-module tables |
| `prism_counsel_review.ts` | Review-specific tables |
| `prism_counsel_s31.ts` | S31 module |
| `prism_counsel_p2.ts` | Phase 2 tables |
| `prism_counsel_p2_graphql_subgraph.ts` | GraphQL subgraph type mirrors |

**Key finding:** `pc_gc_matters` (in `prism_counsel_gc.ts`) is a near-duplicate of `pc_matters` (in `prism_counsel.ts`) but uses a text primary key, a text `org_id`, and lacks proper FKs. It appears to be a prototype that was never merged into the canonical matter table.

**Recommendation:** Consolidate using a jurisdiction/module discriminator column on `pc_matters` rather than separate tables. See consolidation plan.

---

## 5. Denormalized / Computed Fields (Phase B Audit)

### 5.1 `vessels_fleets.vesselCount` — Denormalized Count
`vessel_count` on the `vessels_fleets` table is a denormalized count of vessels in a fleet. Authoritative source: `COUNT(*) FROM vessels WHERE fleet_id = ?`.
**Recommendation:** Remove and compute on demand.

### 5.2 `terra_agents` & `terra_brokerages` — Denormalized Metrics
Aggregate metrics (`activeListings`, `closedDealsLtm`, `headCount`, etc.) stored on agent/brokerage rows.
**Recommendation:** Move to computed views or materialized summary tables for production.

### 5.3 `alloy_workflows` — `runCount` Denormalized
`runCount` column on workflow tables. Authoritative source: `COUNT(*) FROM alloy_workflow_runs WHERE workflow_id = ?`.
**Recommendation:** Remove or maintain via DB trigger.

---

## 6. Redundant JSONB Fields & Unbounded Columns

### 6.1 Unbounded JSONB Audit/State Logs
Multiple tables embed JSONB columns that grow without limit and are not queryable efficiently:
- `firestorm_findings.auditTrail`: Duplicates `audit_logs` purpose.
- `alloy_workflow_runs.stateHistory`: Should be a relational `alloy_workflow_run_events` table.
- `alloy_workflow_runs.input` / `output`: Unbounded data storage.

### 6.2 Catch-all Columns
- `terra_properties.rawData`: JSONB catch-all that likely saves unused storage.
- `vessels_routes.waypoints`: Geographic data (GeoJSON) is appropriate, but review for size.

**Recommendation:** Route audit events to relational tables and review `rawData` usage.

---

## 7. Repeated Reference Data: Severity Enums

Five domains independently define severity-level enums with overlapping but incompatible values:

| Domain | Values |
|--------|--------|
| Firestorm findings | `info, low, medium, high, critical` |
| Firestorm incidents/alerts | `low, medium, high, critical` |
| Vessels events | `watch, warning, critical` |
| Vessels alerts | `low, medium, high, critical` |
| Alloy signals | `info, low, medium, high, critical` |
| Terra deals | `low, medium, high, critical` |

**Recommendation:** Define a single Postgres enum type `szl_severity` and use it across all domains.

---

## 8. Repeated Reference Data: Status State Machines

Each domain redefines status lifecycle enums that follow the same pattern (`draft → active → completed/closed`):

| Domain | Status Values |
|--------|---------------|
| Alloy workflows | `draft, pending, running, waiting_approval, approved, rejected, completed, failed, cancelled` |
| Firestorm assessments | `draft, scheduled, in_progress, completed, canceled` |
| Terra deals | `lead, qualified, showing, offer, negotiation, accepted, inspection, financing, under-contract, clear-to-close, closed, lost` |
| Vessels simulations | `pending, running, completed, failed` |
| Durable jobs | `pending, running, completed, failed, dead_letter, cancelled, waiting` |
| PC matters | `intake, investigation, discovery, pre_trial, trial, settlement, closed, archived` |

---

## 9. Repeated Cross-Domain Model: Audit Trail JSONB Pattern

Seven tables embed an `audit_trail JSONB` column with the same `{action, user, at}` structure:
- `firestorm_findings.audit_trail`, `firestorm_hardening_controls.audit_trail`, `firestorm_compliance_controls.audit_trail`, `firestorm_cases.audit_trail`, `firestorm_case_memory.change_log`.
**Action:** Migrate to `alloy_audit_log` or shared `domain_audit_events`.

---

## 10. Repeated Cross-Domain Model: Comments/Notes on Entities

Multiple tables add an inline `notes TEXT` field. No domain uses the existing `comments.ts` structured primitive.
**Tables with bare `notes TEXT`:** `vessels_command_workflows`, `alloy_approvals`, `firestorm_assessments`, `firestorm_findings`, `firestorm_incidents`, `firestorm_cases`, `pc_matters`, `terra_leads`, `terra_deals`, `terra_diligence_matters`.

---

## 11. Redundant Org Scoping on `vessels_*` Tables

`vessels_fleets.org_id`, `vessels.org_id`, and `vessels_alert_rules.org_id` lack FKs to `organizations`. Potential overlap between `vessels.ts`, `vessels_product.ts`, and `vessels_intelligence.ts`.

---

## 12. Summary: Tables Recommended for Consolidation

| Current Tables | Merge Into | Action Required |
|---------------|------------|-----------------|
| `org_members` + `organization_memberships` | `org_members` (extended) | Backfill + drop `organization_memberships` — HUMAN APPROVAL |
| `skill_library.ts` (dead code) | `alloy_skills` (already canonical) | Delete dead file — SAFE |
| `firestorm_simulation_runs` + `vessels_simulations` + `simulation_sessions` | `simulation_sessions` | Data migration + drop originals — HUMAN APPROVAL |
| `pc_gc_matters` → `pc_matters` | `pc_matters` + `jurisdiction` discriminator | Complex migration — HUMAN APPROVAL |
| JSONB audit trails (7 tables) → `alloy_audit_log` | `alloy_audit_log` | Multi-phase — HUMAN APPROVAL |
| 13 `prism_counsel_*.ts` files | Single domain schema + feature flags | Long-term consolidation — HUMAN APPROVAL |

