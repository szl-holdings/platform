# AGENTS — lib/db

**Scope:** Narrows [root AGENTS.md](../../AGENTS.md) for the database schema package.

## What This Is

`@szl-holdings/db` contains all Drizzle ORM schema definitions (799+ tables across 132 schema files), migrations, and seed scripts. This is the single source of truth for the PostgreSQL data model.

## Before You Change Anything

1. Understand the migration strategy: **forward-only** (`drizzle-kit push`). There are no rollback migrations.
   - **Run migrations via `pnpm migrate` from the repo root.** That script invokes `push-non-interactive`, which wraps `drizzle-kit push --force` in a non-TTY-safe runner that auto-answers rename-vs-create prompts (always picks "create new") and enforces a hard wall-clock timeout. See `lib/db/scripts/non-interactive-migrate.mjs`.
   - **Do NOT run `pnpm --filter @szl-holdings/db push-force` directly** in workflows or CI — it will hang forever on the prompts emitted by our 700+ table schema.
   - The package-level `pnpm --filter @szl-holdings/db migrate` script is reserved for the future SQL-file-based path (`drizzle-kit migrate`) and is **not** the same as the root `pnpm migrate` today. Use the root command unless you know exactly why you want the package-level one.
   - In production / CI, set `DB_MIGRATE_FAIL_ON_PROMPT=1` to make the wrapper abort (exit 65) instead of silently auto-answering, so unexpected schema diffs get human review.
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
