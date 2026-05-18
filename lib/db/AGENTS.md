# AGENTS — lib/db

**Scope:** Narrows [root AGENTS.md](../../AGENTS.md) for the database schema package.

## What This Is

`@szl-holdings/db` contains all Drizzle ORM schema definitions (799+ tables across 132 schema files), migrations, and seed scripts. This is the single source of truth for the PostgreSQL data model.

## Before You Change Anything

1. Understand the migration strategy: **forward-only**. There are no rollback migrations.
   - **Preferred path: `pnpm --filter @szl-holdings/db migrate`** — runs the
     `scripts/backfill-migrations.mjs` backfill (idempotent, see below) and
     then `drizzle-kit migrate` against the SQL files in `lib/db/drizzle/`.
     This is fully non-interactive and safe for workflows / CI.
   - The historical migrations (every entry in `drizzle/meta/_journal.json`)
     were applied via `drizzle-kit push` long before a tracking table existed.
     The backfill script seeds `drizzle.__drizzle_migrations` with the
     `(sha256(sql), folderMillis)` rows drizzle would have written if those
     migrations had been applied through `drizzle-kit migrate`. Running it
     again is a no-op — it skips any `created_at` already in the table.
   - Use `pnpm --filter @szl-holdings/db migrate:apply` if you want to run
     just `drizzle-kit migrate` (skipping the backfill). Use
     `pnpm --filter @szl-holdings/db migrate:backfill` to run only the
     backfill (e.g. when bootstrapping a fresh database that already has the
     schema from a `pg_dump` restore).
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

## Schema-drift guardrail

Editing anything under `src/schema/**` without producing a matching SQL
migration is treated as drift. The guardrail (task #5057) lives in
`scripts/check-schema-sync.mjs` and runs in CI as part of `pnpm lint:ci`.

- Detect locally: `pnpm --filter @szl-holdings/db check:schema-sync`
- Fix the drift: `pnpm --filter @szl-holdings/db generate` (which also
  refreshes `drizzle/meta/_schema_hash.json` via the `update-schema-hash`
  post-step). Commit the new SQL file, the updated `_journal.json`,
  the snapshot JSON, and the refreshed `_schema_hash.json` together.
- Comment / formatting-only changes that intentionally do not need a SQL
  file: re-stamp the marker with
  `pnpm --filter @szl-holdings/db check:schema-sync:fix` and commit the
  updated `_schema_hash.json`. Do NOT set `SKIP_SCHEMA_SYNC_CHECK=1` in CI.

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
