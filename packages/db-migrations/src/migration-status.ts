/**
 * Migration status utilities — check applied vs pending migrations across
 * both tracking systems:
 *   - `__drizzle_migrations`  : Drizzle-kit journal entries (lib/db/drizzle/)
 *   - `__manual_migrations`   : Hand-authored SQL files (lib/db/migrations/)
 */
export const MIGRATION_PATHS = {
  drizzle: 'lib/db/drizzle',
  manual: 'lib/db/migrations',
} as const;

export interface MigrationQueryExecutor {
  execute<T>(query: string): Promise<{ rows: T[] }>;
}

export interface MigrationStatus {
  appliedCount: number;
  latestMigration: string | null;
  appliedAt: Date | null;
  trackerExists: boolean;
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

async function resolveExecutor(executor?: MigrationQueryExecutor): Promise<MigrationQueryExecutor> {
  if (executor) return executor;
  const { db } = await import('@szl-holdings/db');
  return db as unknown as MigrationQueryExecutor;
}

async function trackerExists(
  executor: MigrationQueryExecutor,
  qualifiedName: string,
): Promise<boolean> {
  const result = await executor.execute<{ tracker: string | null }>(
    `SELECT to_regclass('${qualifiedName}')::text AS tracker`,
  );
  return result.rows[0]?.tracker != null;
}

function dateFromEpochMillis(value: string | number | null | undefined): Date | null {
  if (value == null) return null;
  const millis = Number(value);
  if (!Number.isFinite(millis)) return null;
  return new Date(millis);
}

function dateFromTimestamp(value: string | Date | null | undefined): Date | null {
  if (value == null) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function getMigrationStatus(
  queryExecutor?: MigrationQueryExecutor,
): Promise<MigrationStatus> {
  const executor = await resolveExecutor(queryExecutor);
  const exists = await trackerExists(executor, 'drizzle.__drizzle_migrations');
  if (!exists) {
    return {
      appliedCount: 0,
      latestMigration: null,
      appliedAt: null,
      trackerExists: false,
    };
  }

  const latestResult = await executor.execute<{
    hash: string;
    created_at: string | number | null;
  }>(
    'SELECT hash, created_at FROM "drizzle"."__drizzle_migrations" ORDER BY created_at DESC NULLS LAST LIMIT 1',
  );
  const countResult = await executor.execute<{ count: string }>(
    'SELECT COUNT(*)::text AS count FROM "drizzle"."__drizzle_migrations"',
  );
  const latest = latestResult.rows[0];
  return {
    appliedCount: Number(countResult.rows[0]?.count ?? 0),
    latestMigration: latest?.hash ?? null,
    appliedAt: dateFromEpochMillis(latest?.created_at),
    trackerExists: true,
  };
}

export async function getManualMigrationStatus(
  queryExecutor?: MigrationQueryExecutor,
): Promise<ManualMigrationStatus> {
  const executor = await resolveExecutor(queryExecutor);
  const exists = await trackerExists(executor, 'public.__manual_migrations');
  if (!exists) {
    return {
      appliedCount: 0,
      latestFilename: null,
      appliedAt: null,
      trackerExists: false,
    };
  }

  const countResult = await executor.execute<{ count: string }>(
    'SELECT COUNT(*)::text AS count FROM "public"."__manual_migrations"',
  );
  const latestResult = await executor.execute<{
    filename: string;
    applied_at: string | Date;
  }>(
    'SELECT filename, applied_at FROM "public"."__manual_migrations" ORDER BY applied_at DESC, filename DESC LIMIT 1',
  );
  const latest = latestResult.rows[0];
  return {
    appliedCount: Number(countResult.rows[0]?.count ?? 0),
    latestFilename: latest?.filename ?? null,
    appliedAt: dateFromTimestamp(latest?.applied_at),
    trackerExists: true,
  };
}

export async function getUnifiedMigrationStatus(
  queryExecutor?: MigrationQueryExecutor,
): Promise<UnifiedMigrationStatus> {
  const [drizzle, manual] = await Promise.all([
    getMigrationStatus(queryExecutor),
    getManualMigrationStatus(queryExecutor),
  ]);
  return { drizzle, manual };
}
