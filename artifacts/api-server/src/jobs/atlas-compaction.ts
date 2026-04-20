import { auditEventsTable, db } from '@szl-holdings/db';
import { sql } from 'drizzle-orm';
import { logger } from '../lib/logger';

export interface CompactionResult {
  dryRun: boolean;
  hourlyCompacted: number;
  monthlyCompacted: number;
  protectedSkipped: number;
  durationMs: number;
}

/**
 * Run ATLAS snapshot compaction.
 *
 * Retention policy (from atlas-spatial-runtime.md):
 *   - < 72 h   → full resolution, untouched
 *   - 72 h – 30 d → compact to one record per (slug, UTC-hour)
 *   - > 30 d   → compact to one record per (slug, UTC-month)
 *
 * Protected records are NEVER deleted regardless of age:
 *   - proof_chain_id IS NOT NULL  (proof chain entries)
 *   - approved_at IS NOT NULL     (approved branch records)
 *   - is_latest = true            (current head of a version chain)
 *
 * Set COMPACTION_DRY_RUN=true to count affected rows without deleting them.
 */
export async function runAtlasCompaction(): Promise<CompactionResult> {
  const dryRun = process.env['COMPACTION_DRY_RUN'] === 'true';
  const start = Date.now();

  logger.info({ dryRun }, '[atlas-compaction] Starting ATLAS snapshot compaction');

  const hourlyResult = await compactHourly(dryRun);
  const monthlyResult = await compactMonthly(dryRun);
  const protectedSkipped = await countProtected();

  const durationMs = Date.now() - start;

  const summary: CompactionResult = {
    dryRun,
    hourlyCompacted: hourlyResult,
    monthlyCompacted: monthlyResult,
    protectedSkipped,
    durationMs,
  };

  logger.info(summary, '[atlas-compaction] Compaction complete');

  await writeAuditEntry(summary);

  return summary;
}

/**
 * For snapshots between 72h and 30d old: keep one per (slug, UTC-hour), delete the rest.
 * Returns the count of rows deleted (or that would be deleted in dry-run).
 */
async function compactHourly(dryRun: boolean): Promise<number> {
  const countResult = await db.execute(sql`
    SELECT COUNT(*) AS count
    FROM atlas_artifacts
    WHERE created_at < NOW() AT TIME ZONE 'UTC' - INTERVAL '72 hours'
      AND created_at >= NOW() AT TIME ZONE 'UTC' - INTERVAL '30 days'
      AND proof_chain_id IS NULL
      AND approved_at IS NULL
      AND is_latest = false
      AND id NOT IN (
        SELECT DISTINCT ON (slug, DATE_TRUNC('hour', created_at AT TIME ZONE 'UTC')) id
        FROM atlas_artifacts
        WHERE created_at < NOW() AT TIME ZONE 'UTC' - INTERVAL '72 hours'
          AND created_at >= NOW() AT TIME ZONE 'UTC' - INTERVAL '30 days'
          AND proof_chain_id IS NULL
          AND approved_at IS NULL
          AND is_latest = false
        ORDER BY slug, DATE_TRUNC('hour', created_at AT TIME ZONE 'UTC'), id DESC
      )
  `);

  const count = Number((countResult.rows[0] as { count: string } | undefined)?.count ?? 0);

  if (count === 0) {
    logger.info('[atlas-compaction] No hourly compaction candidates found');
    return 0;
  }

  if (dryRun) {
    logger.info({ count }, '[atlas-compaction] DRY RUN — would compact hourly candidates');
    return count;
  }

  await db.execute(sql`
    DELETE FROM atlas_artifacts
    WHERE created_at < NOW() AT TIME ZONE 'UTC' - INTERVAL '72 hours'
      AND created_at >= NOW() AT TIME ZONE 'UTC' - INTERVAL '30 days'
      AND proof_chain_id IS NULL
      AND approved_at IS NULL
      AND is_latest = false
      AND id NOT IN (
        SELECT DISTINCT ON (slug, DATE_TRUNC('hour', created_at AT TIME ZONE 'UTC')) id
        FROM atlas_artifacts
        WHERE created_at < NOW() AT TIME ZONE 'UTC' - INTERVAL '72 hours'
          AND created_at >= NOW() AT TIME ZONE 'UTC' - INTERVAL '30 days'
          AND proof_chain_id IS NULL
          AND approved_at IS NULL
          AND is_latest = false
        ORDER BY slug, DATE_TRUNC('hour', created_at AT TIME ZONE 'UTC'), id DESC
      )
  `);

  logger.info({ count }, '[atlas-compaction] Hourly compaction complete');
  return count;
}

/**
 * For snapshots older than 30d: keep one per (slug, UTC-month), delete the rest.
 * Returns the count of rows deleted (or that would be deleted in dry-run).
 */
async function compactMonthly(dryRun: boolean): Promise<number> {
  const countResult = await db.execute(sql`
    SELECT COUNT(*) AS count
    FROM atlas_artifacts
    WHERE created_at < NOW() AT TIME ZONE 'UTC' - INTERVAL '30 days'
      AND proof_chain_id IS NULL
      AND approved_at IS NULL
      AND is_latest = false
      AND id NOT IN (
        SELECT DISTINCT ON (slug, DATE_TRUNC('month', created_at AT TIME ZONE 'UTC')) id
        FROM atlas_artifacts
        WHERE created_at < NOW() AT TIME ZONE 'UTC' - INTERVAL '30 days'
          AND proof_chain_id IS NULL
          AND approved_at IS NULL
          AND is_latest = false
        ORDER BY slug, DATE_TRUNC('month', created_at AT TIME ZONE 'UTC'), id DESC
      )
  `);

  const count = Number((countResult.rows[0] as { count: string } | undefined)?.count ?? 0);

  if (count === 0) {
    logger.info('[atlas-compaction] No monthly compaction candidates found');
    return 0;
  }

  if (dryRun) {
    logger.info({ count }, '[atlas-compaction] DRY RUN — would compact monthly candidates');
    return count;
  }

  await db.execute(sql`
    DELETE FROM atlas_artifacts
    WHERE created_at < NOW() AT TIME ZONE 'UTC' - INTERVAL '30 days'
      AND proof_chain_id IS NULL
      AND approved_at IS NULL
      AND is_latest = false
      AND id NOT IN (
        SELECT DISTINCT ON (slug, DATE_TRUNC('month', created_at AT TIME ZONE 'UTC')) id
        FROM atlas_artifacts
        WHERE created_at < NOW() AT TIME ZONE 'UTC' - INTERVAL '30 days'
          AND proof_chain_id IS NULL
          AND approved_at IS NULL
          AND is_latest = false
        ORDER BY slug, DATE_TRUNC('month', created_at AT TIME ZONE 'UTC'), id DESC
      )
  `);

  logger.info({ count }, '[atlas-compaction] Monthly compaction complete');
  return count;
}

/**
 * Count the number of protected records that are beyond the 72h window
 * but will never be compacted. Informational only.
 */
async function countProtected(): Promise<number> {
  const result = await db.execute(sql`
    SELECT COUNT(*) AS count
    FROM atlas_artifacts
    WHERE created_at < NOW() AT TIME ZONE 'UTC' - INTERVAL '72 hours'
      AND (proof_chain_id IS NOT NULL OR approved_at IS NOT NULL OR is_latest = true)
  `);
  return Number((result.rows[0] as { count: string } | undefined)?.count ?? 0);
}

async function writeAuditEntry(summary: CompactionResult): Promise<void> {
  try {
    await db.insert(auditEventsTable).values({
      action: 'atlas_snapshot_compaction',
      entityType: 'atlas_artifacts',
      entityId: null,
      newValues: {
        dryRun: summary.dryRun,
        hourlyCompacted: summary.hourlyCompacted,
        monthlyCompacted: summary.monthlyCompacted,
        protectedSkipped: summary.protectedSkipped,
        durationMs: summary.durationMs,
        ranAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    logger.warn({ err }, '[atlas-compaction] Failed to write audit entry (non-fatal)');
  }
}
