/**
 * @szl-holdings/db-migrations
 *
 * Dedicated migration management package.
 *
 * Migration files live in lib/db/drizzle/ (Drizzle Kit generated) and
 * lib/db/migrations/ (hand-authored for specific operations).
 *
 * Commands:
 *   pnpm --filter @szl-holdings/db-migrations generate  → generate new migration
 *   pnpm --filter @szl-holdings/db-migrations migrate   → apply pending migrations
 *   pnpm --filter @szl-holdings/db-migrations push      → push schema (dev only)
 *
 * Annotation convention for retained raw SQL:
 *   // raw-sql: <reason> — applied before Drizzle was adopted; schema locked
 *   // raw-sql: performance — hand-tuned query not expressible via Drizzle
 *   // raw-sql: migration — one-time data transformation
 *
 * The canonical migration path is lib/db/drizzle/.
 * Hand-authored migrations live in lib/db/migrations/.
 */

export { getMigrationStatus, MIGRATION_PATHS } from './migration-status';
