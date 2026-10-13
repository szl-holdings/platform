# AGENTS — lib/db

**Scope:** Narrows [root AGENTS.md](../../AGENTS.md) for the database schema package.

## What This Is

`@szl-holdings/db` contains all Drizzle ORM schema definitions (799+ tables across 132 schema files), migrations, and seed scripts. This is the single source of truth for the PostgreSQL data model.

## Before You Change Anything

1. Understand the migration strategy: **forward-only**. There are no rollback migrations.
   - **Preferred path: `pnpm --filter @szl-holdings/db migrate`** — first
     performs a read-only checksum preflight for hand-authored migrations,
     then runs `drizzle-kit migrate` against `lib/db/drizzle/`, and finally
     applies the separately tracked hand-authored migrations. It never infers
     that current journal entries were already applied.
   - Some historical environments were populated with `drizzle-kit push`
     before a tracker existed. `migrate:backfill` remains available only as an
     explicit recovery command for a database whose schema and backup were
     independently verified. It computes rows from the current journal and
     can conceal unapplied SQL, so it is not part of normal deploy or CI.
   - Use `pnpm --filter @szl-holdings/db migrate:apply` to apply only the
     Drizzle journal. Use `migrate:manual:dry` to inspect the manual tracker
     and pending files without creating or mutating database objects.
   - If an existing schema lacks `drizzle.__drizzle_migrations`, stop the
     deployment. Establishing the correct fixed legacy baseline remains an
     operator-reviewed reconciliation task; do not auto-seed the current tail.
   - **Legacy path:** `pnpm migrate` from the repo root still wraps
     `drizzle-kit push --force` via `scripts/non-interactive-migrate.mjs`
     for emergencies where you need to push a schema diff without first
     generating a migration. Avoid it for normal changes — push has no
     tracking table, no review trail, and hangs interactively on the
     700+ table schema unless wrapped.
   - In production / CI for the legacy push path, set
     `DB_MIGRATE_FAIL_ON_PROMPT=1` to make the wrapper abort (exit 65)
     instead of silently auto-answering rename-vs-create prompts, so
     unexpected schema diffs get human review.
2. Understand the naming convention: tables are namespaced by domain (e.g. `vessels_*`, `alloy_*`, `auth_*`).
3. Check whether your new table concept is already represented in an existing table before creating a new one. 799 tables means there is a high chance something relevant already exists.

## Critical Rules

- **Never drop or rename a column in a migration.** Forward-only migrations mean a dropped column is permanent data loss. Add a new column and deprecate the old one instead.
- **All new tables must have:** `id` (UUID primary key), `org_id` (FK to orgs), `created_at`, `updated_at`.
- **Idempotent seeds.** Every seed script must use `onConflictDoNothing()` or equivalent. Seed scripts must be safe to run multiple times.
- **No hard-coded org IDs or user IDs in seeds.** Use seed-time lookups or constants from a seed configuration.
- **Schema changes to governance tables require founder review.** Tables in the `proof_chain_*`, `covenant_policy_*`, and `outcome_graph_*` namespaces are governance-critical.

## Domain Table Namespacing

| Prefix | Domain | Example |
|--------|--------|---------|
| `auth_*` | Authentication | `auth_sessions` |
| `alloy_*` | Workflow engine | `alloy_workflow_runs` |
| `vessels_*` | Maritime | `vessels_fleet` |
| `terra_*` | Real estate | `terra_properties` |
| `prism_*` | Security / Counsel | `prism_incidents` |
| `forge_*` | Agent factory | `forge_agents` |
| `atlas_*` | ATLAS state model | `atlas_entities` |
| `memory_*` | Memory fabric | `memory_records` |

## Key Files

| Path | Purpose |
|------|---------|
| `src/schema/` | All Drizzle table definitions (132 files) |
| `src/seed/` | Seed scripts |
| `src/migrations/` | Migration history |
| `src/index.ts` | Schema re-exports |
