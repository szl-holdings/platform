/**
 * Migration status utilities — check applied vs pending migrations.
 */
import { db } from '@szl-holdings/db';

export const MIGRATION_PATHS = {
  drizzle: 'lib/db/drizzle',
  manual: 'lib/db/migrations',
  scripts: 'scripts/migrations',
} as const;

export interface MigrationStatus {
  appliedCount: number;
  latestMigration: string | null;
  appliedAt: Date | null;
}

export async function getMigrationStatus(): Promise<MigrationStatus> {
  try {
    const result = await db.execute<{
      id: string;
      hash: string;
      created_at: string;
    }>('SELECT id, hash, created_at FROM __drizzle_migrations ORDER BY created_at DESC LIMIT 1');
    const latest = result.rows[0];
    const countResult = await db.execute<{ count: string }>(
      'SELECT COUNT(*) AS count FROM __drizzle_migrations',
    );
    return {
      appliedCount: Number(countResult.rows[0]?.count ?? 0),
      latestMigration: latest?.id ?? null,
      appliedAt: latest?.created_at ? new Date(latest.created_at) : null,
    };
  } catch {
    return { appliedCount: 0, latestMigration: null, appliedAt: null };
  }
}
