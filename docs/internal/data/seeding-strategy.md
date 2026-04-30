# Seeding Strategy

**Date:** 2026-04-15  
**Author:** Engineering  
**Status:** Active

---

## Overview

The SZL Platform uses three distinct seed packs to address different operational needs:

| Seed Pack | Script | Purpose | Truncates? |
|---|---|---|---|
| Local-dev minimal | `scripts/src/seed.ts` | Minimal viable state for local development | Yes — full truncate |
| Demo | `scripts/seed-demo-*` | Rich demo data for sales demos and external showcases | Additive (no-conflict) |
| Pilot | `scripts/seed-pilot-*` | Realistic pilot customer data for onboarding a new client org | Additive (no-conflict) |
| Domain packs | `scripts/src/seed-*.ts` | Expanded seed data for specific product domains (PRISM, Vessels, Governance, etc.) | Additive (idempotency guard) |

---

## 1. Local-Dev Minimal Seed

**Script:** `scripts/src/seed.ts`  
**Run command:** `pnpm --filter @workspace/scripts run seed`

### What it does

1. Truncates all public schema tables using `CASCADE`.
2. Seeds exactly the minimum data required for all features to function:
   - 6 users (1 super_admin, 1 operator, 1 analyst, 1 seller, 1 creative, 1 client)
   - 1 organization (SZL Holdings)
   - Core roles, org membership, billing plans, feature flags
   - Representative data for vessels, firestorm, lyte, carlota, holdings, stephen-site
3. Does **not** seed large volumes of historical data.

### When to use

- After `pnpm --filter @workspace/db run migrate` on a fresh local DB.
- When you want a fully clean, reproducible baseline.
- In CI pipelines that run integration tests.

### Idempotency

Not idempotent — uses full truncate first. Running twice is safe but wipes data between runs.

---

## 2. Demo Seed Pack

**Scripts:** `scripts/seed-demo-data.ts`, `scripts/seed-audit-logs.ts`, `scripts/src/seed-szl-canonical.ts`  
**Composite runner:** `scripts/seed-demo-canonical.sh`

### What it does

Adds high-fidelity demo content on top of the minimal seed:
- 20+ realistic signals (critical, high, medium, low) across Lyte, Vessels, and Terra
- 15+ lyte actions with role-visibility metadata
- 10+ vessels with real port references and active voyages
- Full audit log history (20 activity entries + 10 audit events)
- SCIM provisioned users and tenant branding for demo Azure AD tenant
- Firestorm assets and workflow actions

### When to use

- Before a sales demo or external showcase.
- When QA needs a fully populated environment.
- Before recording product screenshots or videos.

### Idempotency

Uses `onConflictDoNothing()` throughout — safe to run multiple times. Running on top of a fresh minimal seed is the recommended pattern.

---

## 3. Pilot Seed Pack

**Scripts:** `scripts/seed-pilot-org.ts`, `scripts/seed-pilot-data.ts`  
**Purpose:** Onboarding a new pilot customer organization

### What it does

Creates a complete, isolated pilot organization:
- 1 new organization with `org_type: pilot`
- 3–5 pilot users (1 admin, 1 ops, 1 analyst, 1 viewer)
- Org membership and role assignment
- Sample signals, actions, and workflow templates relevant to the pilot use case
- Feature flags scoped to the pilot org

### When to use

- Before kickoff with a new pilot customer.
- When setting up a staging environment for a specific client.

### Idempotency

Uses `onConflictDoNothing()` — safe to re-run. Will skip existing pilot org if slug already exists.

---

## 4. Domain-Specific Seed Packs

Domain packs were added in April 2026 to cover product domains that had schema coverage but thin seed data. All domain packs are additive and idempotent — they check for existing data and skip if already seeded.

**Composite runner:** `scripts/seed-demo-canonical.sh` (steps 6–12)

| Pack | Script | Command | Tables Covered |
|---|---|---|---|
| Counsel | `seed-prism-counsel.ts` | `seed:prism-counsel` | `pc_matters`, `pc_parties`, `pc_claims`, `pc_offers`, `pc_medical_events`, `pc_damages`, `pc_liens`, `pc_deadlines`, `pc_discovery`, `pc_depositions`, `pc_forecasts`, `pc_readiness_scores`, `pc_communications`, `pc_ai_recommendations`, `pc_witnesses`, `pc_document_chunks`, `pc_playbooks`, `pc_connector_accounts`, `pc_ny_rule_profiles`, `pc_matter_clocks`, `pc_clock_events`, `pc_no_fault_claims`, `pc_disclaimers`, `pc_coverage_positions`, `pc_medical_bill_cycles`, `pc_verification_requests`, `pc_denials`, `pc_offer_movements` |
| Holdings & Fund Ops | `seed-holdings-fundops.ts` | `seed:holdings-fundops` | `holdings_ventures`, `holdings_milestones`, `holdings_metrics`, `holdings_leadership`, `holdings_inquiries`, `fund_portfolio_financials`, `fund_portfolio_kpis`, `capital_artifacts`, `lender_packets`, `lender_packet_deliverables`, `investor_packets`, `investor_packet_deliverables`, `fundraising_milestones`, `financial_models`, `use_of_funds_versions`, `diligence_checklists`, `diligence_checklist_items`, `cap_table_placeholders` |
| Carlota Jo Clients | `seed-carlota-clients.ts` | `seed:carlota-clients` | `carlota_services`, `carlota_client_profiles`, `carlota_inquiries`, `carlota_reservations`, `client_accounts`, `client_documents`, `client_updates`, `client_messages` |
| Governance & Compliance | `seed-governance.ts` | `seed:governance` | `alloy_policies`, `model_routing_policies`, `cost_budgets`, `cost_events`, `governance_incidents`, `compliance_suitability`, `compliance_archival`, `compliance_supervision_queue`, `compliance_calendar`, `compliance_risk_scores` |
| Marine Insurance, Trading & Intelligence | `seed-marine-extended.ts` | `seed:marine-extended` | `marine_insurance_quotes`, `marine_insurance_policies`, `marine_insurance_claims`, `commodity_trading_instruments`, `commodity_trading_orders`, `commodity_trading_positions`, `fleet_exceptions`, `vessel_maintenance`, `vessel_sanctions_screening` |
| Agent OS, A2A & Fine-Tuning | `seed-agent-os.ts` | `seed:agent-os` | `a2a_agent_cards`, `a2a_delegation_tasks`, `a2a_agent_heartbeats`, `a2a_discovery_queries`, `alloy_skill_registry`, `alloy_decision_outcomes`, `alloy_agent_performance_snapshots`, `alloy_confidence_alerts`, `agent_knowledge`, `agent_runs`, `agent_training_pairs`, `agent_behavior_prefs`, `agent_feedback`, `advisory_audit`, `fine_tuning_datasets`, `fine_tuning_jobs`, `fine_tuned_model_registry` |
| Distribution OS | `seed-distribution-os.ts` | `seed:distribution-os` | `dos_editorial_pillars`, `dos_author_profiles`, `dos_site_settings`, `dos_articles`, `dos_newsletters`, `dos_carousel_projects`, `dos_carousel_slides`, `dos_x_posts`, `dos_campaigns`, `dos_campaign_links`, `dos_leads`, `dos_distribution_targets`, `dos_content_calendar_items`, `dos_cta_blocks` |

### Idempotency Pattern

All domain pack scripts use a **hybrid two-layer idempotency** approach:

**Layer 1 — Fast-path existence check (pack-level guard):** If the sentinel table for the pack already has rows, skip the entire script immediately. This avoids unnecessary DB round-trips on re-runs.

```ts
const existing = await db.select({ id: targetTable.id }).from(targetTable).limit(1);
if (existing.length > 0) {
  console.log("[seed-xxx] Data already seeded, skipping.");
  return { skipped: true };
}
```

**Layer 2 — Per-insert conflict safety (table-level guard):** For all tables with a database-level unique constraint on a business key (e.g., `slug`, `quoteRef`, `policyNumber`, `agentId`, `skillId`, `ruleId`), inserts use `.onConflictDoNothing()`. This ensures partial reruns (e.g., after a mid-script crash) can fill in missing rows without error.

```ts
await db.insert(someTable).values([...]).onConflictDoNothing();
// or when the result is needed:
const rows = await db.insert(someTable).values([...]).onConflictDoNothing().returning();
```

Tables without database-unique constraints on business keys (e.g., serial-PK-only tables with child rows) rely exclusively on the pack-level guard.

This two-layer approach is safe to run multiple times: it skips cleanly in the common case, and handles partial seed failures by filling gaps rather than erroring.

### Dependency Order

Domain packs must run **after** the minimal seed (`seed.ts`) which establishes org ID 1 and the base user/org structure that domain packs reference.

---

## Migration + Seed Workflow

### For local development

```bash
# 1. Apply all pending migrations
pnpm --filter @workspace/db run migrate

# 2. Seed minimal data
pnpm --filter @workspace/scripts run seed

# 3. Optionally add demo data
pnpm --filter @workspace/scripts run seed:demo

# 4. Optionally run all domain packs for a fully populated environment
./scripts/seed-demo-canonical.sh
```

### For a new staging/pilot environment

```bash
# 1. Ensure schema is current
pnpm --filter @workspace/db run migrate

# 2. Seed minimal baseline
pnpm --filter @workspace/scripts run seed

# 3. Add pilot org
pnpm --filter @workspace/scripts run seed:pilot

# 4. Optionally add demo data for cross-org demos
pnpm --filter @workspace/scripts run seed:demo
```

### For a fully loaded demo environment (all domains)

```bash
# 1. Ensure schema is current
pnpm --filter @workspace/db run migrate

# 2. Seed minimal baseline
pnpm --filter @workspace/scripts run seed

# 3. Run all domain seed packs via composite runner
./scripts/seed-demo-canonical.sh
```

### Running individual domain packs

```bash
# Counsel — legal matters, parties, AI forecasts
pnpm --filter @workspace/scripts run seed:prism-counsel

# Holdings ventures & fund financial reporting
pnpm --filter @workspace/scripts run seed:holdings-fundops

# Carlota Jo services, client profiles, reservations
pnpm --filter @workspace/scripts run seed:carlota-clients

# Governance policies, compliance, suitability, archival
pnpm --filter @workspace/scripts run seed:governance

# Marine insurance quotes/policies, trading instruments, fleet exceptions
pnpm --filter @workspace/scripts run seed:marine-extended

# A2A agent cards, skill registry, fine-tuning, agent knowledge
pnpm --filter @workspace/scripts run seed:agent-os

# Distribution OS — editorial pillars, articles, newsletters, campaigns, leads
pnpm --filter @workspace/scripts run seed:distribution-os
```

---

## Migration Workflow & Drift Prevention

### Rule 1 — Drizzle is the single source of truth

All schema changes MUST go through Drizzle migrations. Never run raw `ALTER TABLE` on the database directly.

### Rule 2 — Always generate and commit migrations

```bash
# After editing a schema file in lib/db/src/schema/
pnpm --filter @workspace/db run generate

# Review the generated SQL in lib/db/drizzle/
# Commit both the schema file change AND the migration file
```

### Rule 3 — Migrations are forward-only in production

Migrations are never modified after being applied to staging or production. Fixes require a new migration.

### Rule 4 — Rollback scripts stay current

For every migration file created, a corresponding rollback script is added to `scripts/rollback/`. See `scripts/rollback/README.md` for the rollback procedure.

### Rule 5 — No orphaned seeds

Seed scripts must only reference tables and columns that exist in the current schema. Before running a seed, verify the schema is current with `pnpm --filter @workspace/db run migrate`.

### Drift Detection

```bash
# Check for schema drift (generated SQL should be empty if no drift)
pnpm --filter @workspace/db run generate -- --check
```

If `generate --check` produces a non-empty diff, schema drift exists and must be resolved with a new migration.

---

## Environment-Specific Notes

| Environment | Seed Pack | Notes |
|---|---|---|
| Local dev | Minimal | Full truncate + minimal data |
| Local dev (full demo) | Minimal + Demo + Domain packs | Run `seed-demo-canonical.sh` after minimal seed |
| CI/CD | Minimal | Run as part of test setup |
| Staging | Minimal + Demo + Domain packs | Refreshed on each deployment if needed |
| Pilot customer | Minimal + Pilot | Per-client setup; never truncate |
| Production | None | Only migrations; no seed data |
