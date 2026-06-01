# SZL Holdings — Database State

**Audit date:** 2026-04-21  
**Canonical table count:** 915 direct `pgTable(` function calls (table definitions) across 165 schema files  
**Counting methodology:** `grep -r "pgTable(" lib/db/src/schema/ --include="*.ts" | wc -l` = 915. Using `pgTable(` (with open paren) counts only actual table definition calls. The broader `grep "pgTable"` yields 1,078 lines — this includes import statements, type annotations (`InferSelectModel<typeof pgTable...>`), and inference helpers which do NOT define tables.

---

## Canonical Numbers (Resolved)

| Metric | Prior Claims | Canonical (This Audit) | Method |
|--------|-------------|------------------------|--------|
| pgTable definitions | 906 (`platform-facts.md`) | **915** | `grep -r "pgTable(" lib/db/src/schema/ --include="*.ts" \| wc -l` = 915 (direct calls only); `grep "pgTable"` broadly = 1,078 (includes imports/types) |
| Schema files | 163 (`platform-facts.md`) | **165** | `ls lib/db/src/schema/ \| wc -l` |
| Schema domains | 10 (`platform-facts.md`) | **Not machine-enforced** — approximate groupings only | Files cross domain boundaries; no enforced domain attribute |

**Use 915 as the canonical table count in all documentation from this point forward.** (direct `pgTable(` calls; see methodology note above)

---

## Database Engine & ORM

| Attribute | Value | Status |
|-----------|-------|--------|
| Engine | PostgreSQL 16 | VERIFIED — `.replit` modules |
| ORM | Drizzle ORM 0.45.1 | VERIFIED — `pnpm-workspace.yaml` catalog |
| Connection | `DATABASE_URL` env var | VERIFIED — present in Replit Secrets |
| Migration strategy | Forward-only `drizzle-kit push` | VERIFIED — no rollback migrations exist |
| Session store | In-memory (all environments) | VERIFIED — Redis "not yet activated" |
| Seed strategy | Idempotent `onConflictDoNothing()` | PARTIALLY VERIFIED — pattern in seed files; not CI-gated |

---

## Schema File Inventory (Top 20 by Table Count)

| Schema file | pgTable count | Domain |
|-------------|--------------|--------|
| `distribution-os.ts` | 30 | Internal OS operations |
| `prism_counsel_ny.ts` | 28 | Legal (NY) |
| `terra.ts` | 27 | Real estate intelligence |
| `prism_counsel.ts` | 27 | Legal (core) |
| `nuro_mesh.ts` | 25 | AI agent mesh |
| `prism_counsel_omega.ts` | 24 | Legal (Omega variant) |
| `cms.ts` | 24 | Content management |
| `prism_counsel_pilot_one.ts` | 22 | Legal (Pilot 1) |
| `firestorm.ts` | 22 | Security (archived) |
| `forge.ts` | 21 | Workflow forge |
| `fund_ops.ts` | 20 | Fund operations |
| `szl_canonical.ts` | 17 | Platform canonical entities |
| `prism_counsel_s31.ts` | 17 | Legal (S31 variant) |
| `alloy_comms.ts` | 17 | Alloy communications |
| `lyte.ts` | 15 | Lyte platform |
| `cognitive_runtime.ts` | 15 | AI cognitive runtime |
| `alloy_runtime.ts` | 15 | Alloy runtime |
| `prism_counsel_recovery.ts` | 13 | Legal recovery |
| `ownership_control.ts` | 13 | Ownership control |
| `vessels.ts` | 12 | Maritime intelligence |

---

## Schema Health Findings

### Multiple PRISM Counsel Schema Variants (RISK)

Five separate `prism_counsel_*.ts` schema files exist:
- `prism_counsel.ts` (27 tables)
- `prism_counsel_ny.ts` (28 tables)
- `prism_counsel_omega.ts` (24 tables)
- `prism_counsel_pilot_one.ts` (22 tables)
- `prism_counsel_s31.ts` (17 tables)
- `prism_counsel_recovery.ts` (13 tables — seed script broken)

**Combined: 131 tables across 6 variant schemas for one legal module.** This indicates the legal domain was developed iteratively without consolidating variants. Risk: schema drift between variants, unclear which is authoritative, seed script for recovery is broken (Risk #6).

### Firestorm Schema Persists Despite Archival (RISK)

`firestorm.ts` has 22 pgTable definitions. The `artifacts/firestorm/` directory is marked archived and deregistered. The schema file was NOT removed. If the Firestorm tables were migrated to the database they remain as dead schema. Status: UNVERIFIED whether tables exist in the live database.

### `auth.ts` Dual Role System (RISK)

As detailed in `audit/auth-flow-matrix.md`: `usersTable` has a 12-value `platformRole` enum AND there is a separate `rolesTable` with a 4-value enum AND a `userRolesTable` join table. This is two parallel role assignment mechanisms in the same schema.

### `distribution-os.ts` — 30 Tables, Unknown Domain (RISK)

The largest single schema file by table count is `distribution-os.ts` with 30 tables. This does not map to any named artifact or product. The name suggests an internal OS operations domain, but its relationship to the product surface is unclear.

---

## Migration Posture

| Risk | Severity | Notes |
|------|----------|-------|
| No rollback migrations | HIGH | `db:push` strategy — any failed migration requires manual intervention |
| 915 table definitions in a single push surface | MEDIUM | Push strategy becomes riskier at this scale |
| Five legal schema variants not consolidated | MEDIUM | Unclear which is authoritative; risk of conflicting table definitions |
| Firestorm schema not removed with archival | LOW | Dead schema in database if migration ran |
| Prism Counsel recovery seed broken | MEDIUM | Recovery module inoperable without fix |

---

## Seed Scripts

| Script | Status | Notes |
|--------|--------|-------|
| `pnpm seed` | PARTIALLY VERIFIED | Canonical seed; script exists; runtime not confirmed |
| `pnpm seed:all` | PARTIALLY VERIFIED | All seed scripts; runtime not confirmed |
| `pnpm seed:terra` | PARTIALLY VERIFIED | Terra-specific; API server script |
| `pnpm seed:ecosystem` | PARTIALLY VERIFIED | Ecosystem seed; API server script |
| `scripts/seed-bootstrap-admin.ts` | VERIFIED | Created in Phase A; documented and tested |
| Prism Counsel recovery seed | BROKEN | Noted as broken in Risk #6; `artifacts/counsel/` related |

---

## Live Database Health

Because all workflows are NOT STARTED, the following cannot be verified:

- Whether the database is reachable at `DATABASE_URL`
- Whether `drizzle-kit push` has been run against the current schema
- How many tables actually exist in the live PostgreSQL instance
- Whether any data exists beyond bootstrap seed

**Recommended first action:** Start the API server, run `pnpm migrate`, run `pnpm seed`, then verify via `pnpm health:check`.
