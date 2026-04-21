# SZL Holdings — Verified Schema Summary

**Audit date:** 2026-04-21  
**This document resolves all contradictory table/entity/model counts to one canonical number.**

---

## Canonical Resolution

| Metric | Canonical Value | Basis | Audit Status |
|--------|----------------|-------|--------------|
| pgTable definitions | **915** | `grep -r "pgTable(" lib/db/src/schema/ --include="*.ts" \| wc -l` = 915 (direct calls only); `grep "pgTable"` broadly = 1,078 lines incl. imports/type refs | **VERIFIED** |
| Schema files | **165** | `find lib/db/src/schema -name "*.ts" \| wc -l` = 165 | **VERIFIED** |
| Schema location | `lib/db/src/schema/` | Filesystem inspection | **VERIFIED** |
| ORM | Drizzle ORM 0.45.1 | `pnpm-workspace.yaml` catalog | **VERIFIED** |

**All other numbers (906, 163, 182 route files, etc.) are BROKEN and must be updated.**

**Counting methodology:** Using `pgTable(` (with open parenthesis) as the grep pattern counts only actual Drizzle ORM table definition calls. A broader `grep "pgTable"` returns 1,078 lines because TypeScript files import the `pgTable` function, reference it in type annotations like `InferSelectModel<typeof tableName>`, and use it in inference helpers — none of which define new tables.

---

## Domain Schema Map

The 165 schema files are grouped below by observed domain affinity. Domain boundaries are approximate — files are not tagged by domain in code.

### Core Platform (Alloy + Auth + System)

| File | Tables | Purpose |
|------|--------|---------|
| `auth.ts` | ~8 | Users, roles, user_roles, session state |
| `alloy.ts` | ~12 | Alloy workflow entities |
| `alloy_runtime.ts` | 15 | Workflow runtime state |
| `alloy_comms.ts` | 17 | Alloy communications |
| `alloy_platform.ts` | ~10 | Platform-level Alloy entities |
| `alloy_ai_decisions.ts` | ~8 | AI decision records |
| `alloy_autonomy_modes.ts` | ~5 | Autonomy configuration |
| `alloy_chat.ts` | ~6 | Alloy chat entities |
| `alloy_policy_versions.ts` | ~5 | Policy versioning |
| `alloy_run_notifications.ts` | ~4 | Run notifications |
| `approvals.ts` | ~8 | Human-in-the-loop approval records |
| `audit_chain_events.ts` | ~5 | Immutable audit chain |
| `audit_logs.ts` | ~4 | General audit log |
| `apps_registry.ts` | ~6 | Application registry |
| `szl_canonical.ts` | 17 | Canonical platform entities |

### AI / Agent Infrastructure

| File | Tables | Purpose |
|------|--------|---------|
| `cognitive_runtime.ts` | 15 | Cognitive loop state |
| `nuro_mesh.ts` | 25 | AI agent mesh |
| `agent_mesh.ts` | ~10 | Agent mesh entities |
| `agent_os.ts` | ~8 | Agent OS |
| `agent_skills.ts` | ~6 | Agent capability declarations |
| `agent_training.ts` | ~7 | Training records |
| `ai_evals.ts` | ~8 | Model evaluation records |
| `aef_profiles.ts` | ~7 | AEF domain profiles |

### Maritime Domain (Vessels)

| File | Tables | Purpose |
|------|--------|---------|
| `vessels.ts` | 12 | Core maritime entities |
| (Additional vessel sub-schemas) | ~20 | Route-specific maritime tables |

### Real Estate Domain (Terra)

| File | Tables | Purpose |
|------|--------|---------|
| `terra.ts` | 27 | Core real estate entities (largest domain file) |

### Legal Domain (PRISM Counsel)

| File | Tables | Purpose |
|------|--------|---------|
| `prism_counsel.ts` | 27 | Core legal entities |
| `prism_counsel_ny.ts` | 28 | NY-specific legal |
| `prism_counsel_omega.ts` | 24 | Omega variant |
| `prism_counsel_pilot_one.ts` | 22 | Pilot 1 variant |
| `prism_counsel_s31.ts` | 17 | S31 variant |
| `prism_counsel_recovery.ts` | 13 | Recovery module (seed BROKEN) |
| **Legal subtotal** | **131** | Largest domain by table count |

### Security Domain (Aegis / Firestorm)

| File | Tables | Purpose |
|------|--------|---------|
| `aegis_modules.ts` | ~10 | Aegis module state |
| `firestorm.ts` | 22 | Firestorm (ARCHIVED artifact — tables may still exist in DB) |

### Operations / Internal

| File | Tables | Purpose |
|------|--------|---------|
| `distribution-os.ts` | 30 | Internal operations (largest file; unclear domain) |
| `fund_ops.ts` | 20 | Fund operations |
| `ownership_control.ts` | 13 | Ownership control |
| `forge.ts` | 21 | Workflow forge |
| `cms.ts` | 24 | Content management |

### Other Domains

`analytics.ts`, `api_keys.ts`, `atlas_artifacts.ts`, `atlas_runs.ts`, `atlas_spatial_runtime.ts`, `azure_tenants.ts`, `billing.ts`, `activity.ts`, `a2a.ts`, and 80+ additional files covering: billing, API keys, notifications, atlas spatial runtime, Azure tenant management, and platform telemetry.

---

## Known Schema Risks

| Risk | Tables Affected | Severity |
|------|----------------|----------|
| 6 PRISM Counsel variants — no consolidation | 131 | HIGH |
| Firestorm schema not removed with artifact archival | 22 | LOW |
| Dual role system (auth.ts) | 3 tables | HIGH |
| `distribution-os.ts` — 30 tables, unclear domain ownership | 30 | MEDIUM |
| No rollback migrations | All 915 table definitions | HIGH |

---

## What "915 Table Definitions" Means for an Investor Conversation

Do not present this number to investors as a marketing metric. Present it as evidence of:

1. **Real data model depth** — the platform has 915 real, schema-defined entities across all domains, not just UI mocks
2. **Multi-tenant, multi-domain architecture** — schemas reflect actual isolation between Terra, Vessels, Aegis, Lyte, Counsel, and the Alloy execution fabric
3. **Audit-grade data layer** — `audit_chain_events`, `approvals`, `alloy_run_notifications`, `alloy_ai_decisions` tables demonstrate the governance layer is schema-enforced, not aspirational

Say: "Our data model has over 900 schema-defined entities across 10+ domains, enforcing governance at the database level." Do not say "906 tables" (that was wrong) or claim "1,000+" (not supported by the canonical count).
