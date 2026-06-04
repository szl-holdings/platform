/**
 * Migration status utilities — check applied vs pending migrations across
 * both tracking systems:
 *   - `__drizzle_migrations`  : Drizzle-kit journal entries (lib/db/drizzle/)
 *   - `__manual_migrations`   : Hand-authored SQL files (lib/db/migrations/)
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

export interface ManualMigrationStatus {
  appliedCount: number;
  latestFilename: string | null;
  appliedAt: Date | null;
  trackerExists: boolean;
}

export interface UnifiedMigrationStatus {
  drizzle: MigrationStatus;
  manual: ManualMigrationStatus;
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

export async function getManualMigrationStatus(): Promise<ManualMigrationStatus> {
  try {
    const countResult = await db.execute<{ count: string }>(
      'SELECT COUNT(*) AS count FROM __manual_migrations',
    );
    const latestResult = await db.execute<{
      filename: string;
      applied_at: string;
    }>(
      'SELECT filename, applied_at FROM __manual_migrations ORDER BY applied_at DESC, filename DESC LIMIT 1',
    );
    const latest = latestResult.rows[0];
    return {
      appliedCount: Number(countResult.rows[0]?.count ?? 0),
      latestFilename: latest?.filename ?? null,
      appliedAt: latest?.applied_at ? new Date(latest.applied_at) : null,
      trackerExists: true,
    };
  } catch {
    return {
      appliedCount: 0,
      latestFilename: null,
      appliedAt: null,
      trackerExists: false,
    };
  }
}

export async function getUnifiedMigrationStatus(): Promise<UnifiedMigrationStatus> {
  const [drizzle, manual] = await Promise.all([
    getMigrationStatus(),
    getManualMigrationStatus(),
  ]);
  return { drizzle, manual };
}
