# Seeding Strategy

**Date:** 2026-04-02  
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

## Migration + Seed Workflow

### For local development

```bash
# 1. Apply all pending migrations
pnpm --filter @workspace/db run migrate

# 2. Seed minimal data
pnpm --filter @workspace/scripts run seed

# 3. Optionally add demo data
pnpm --filter @workspace/scripts run seed:demo
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
| CI/CD | Minimal | Run as part of test setup |
| Staging | Minimal + Demo | Refreshed on each deployment if needed |
| Pilot customer | Minimal + Pilot | Per-client setup; never truncate |
| Production | None | Only migrations; no seed data |
