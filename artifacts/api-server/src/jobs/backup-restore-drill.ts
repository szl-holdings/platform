import fs from 'node:fs';
import path from 'node:path';
import { execSync, spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { db, pool, platformJobRunsTable, auditEventsTable } from '@szl-holdings/db';
import { eq, desc } from 'drizzle-orm';
import { logger } from '../lib/logger';
import { sendEmail } from '../lib/email';

const WORKSPACE_ROOT = path.resolve(process.cwd(), '../../');
const BACKUP_DIR = process.env.BACKUP_DIR ?? path.resolve(WORKSPACE_ROOT, 'backups');
const INTERNAL_EMAIL = process.env.SZL_INTERNAL_EMAIL ?? 'team@szlholdings.com';

export const DRILL_JOB_TYPE = 'backup_restore_drill';

/**
 * Domain-specific smoke checks — count + a sample row read per domain table.
 * Tables without pgvector columns are preferred; sample queries are kept
 * narrow (no SELECT * to avoid binary type issues over the plain psql channel).
 */
const SMOKE_CHECKS: Array<{
  table: string;
  domain: string;
  sampleSql: string;
}> = [
  {
    table: 'users',
    domain: 'platform',
    sampleSql: 'SELECT id, email, platform_role FROM users LIMIT 3',
  },
  {
    table: 'organizations',
    domain: 'platform',
    sampleSql: 'SELECT id, name FROM organizations LIMIT 3',
  },
  {
    table: 'audit_events',
    domain: 'platform',
    sampleSql: 'SELECT id, action, entity_type FROM audit_events LIMIT 3',
  },
  {
    table: 'feature_flags',
    domain: 'platform',
    sampleSql: 'SELECT key, name, is_enabled, rollout_percentage FROM feature_flags LIMIT 3',
  },
  {
    table: 'vessels',
    domain: 'vessels',
    sampleSql: 'SELECT id, name, vessel_type FROM vessels LIMIT 3',
  },
  {
    table: 'lyte_signals',
    domain: 'lyte',
    sampleSql: 'SELECT id, severity, title, status FROM lyte_signals LIMIT 3',
  },
  {
    table: 'alloy_signals',
    domain: 'alloy',
    sampleSql: 'SELECT id, source, domain, severity, status FROM alloy_signals LIMIT 3',
  },
  {
    table: 'terra_properties',
    domain: 'terra',
    sampleSql: 'SELECT id, address, city, property_type FROM terra_properties LIMIT 3',
  },
];

export interface DrillSmokeResult {
  table: string;
  domain: string;
  rowCount: number;
  sampleRows: number;
  status: 'pass' | 'fail';
  error?: string;
}

export interface DrillResult {
  runId: string;
  ranAt: string;
  durationMs: number;
  status: 'pass' | 'fail';
  backupFile: string | null;
  backupSizeBytes: number | null;
  gzipIntegrityOk: boolean | null;
  scratchDbName: string | null;
  restoreMethod: 'full-database' | 'schema-fallback' | null;
  smokeChecks: DrillSmokeResult[];
  smokeChecksPassed: number;
  smokeChecksFailed: number;
  error: string | null;
}

function findLatestBackup(): { filename: string; fullPath: string; sizeBytes: number } | null {
  try {
    if (!fs.existsSync(BACKUP_DIR)) return null;
    const files = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.sql.gz'));
    if (files.length === 0) return null;
    const sorted = files
      .map(f => {
        const fullPath = path.join(BACKUP_DIR, f);
        return { filename: f, fullPath, stat: fs.statSync(fullPath) };
      })
      .sort((a, b) => b.stat.mtime.getTime() - a.stat.mtime.getTime());
    const latest = sorted[0];
    if (!latest) return null;
    return { filename: latest.filename, fullPath: latest.fullPath, sizeBytes: latest.stat.size };
  } catch {
    return null;
  }
}

function verifyGzipIntegrity(fullPath: string): boolean {
  try {
    execSync(`gunzip -t "${fullPath}"`, { timeout: 30_000, stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Build a PostgreSQL connection URL for a scratch database by replacing the
 * database name in DATABASE_URL.
 */
function buildScratchDbUrl(mainUrl: string, dbName: string): string {
  const u = new URL(mainUrl);
  u.pathname = `/${dbName}`;
  return u.href;
}

/**
 * Restore the gzip-compressed pg_dump into the scratch database using psql.
 * Uses ON_ERROR_STOP=off so non-critical errors (CREATE EXTENSION if exists,
 * existing public schema, etc.) do not abort the restore.
 *
 * Returns { ok, errorLines } — ok=true means psql exited 0.
 */
function restoreFullDump(
  backupPath: string,
  scratchDbUrl: string,
): { ok: boolean; errorLines: string[] } {
  const cmd = `gunzip -c "${backupPath}" | psql "${scratchDbUrl}" -v ON_ERROR_STOP=off --quiet 2>&1`;
  const result = spawnSync('bash', ['-c', cmd], {
    timeout: 600_000, // 10 min max for large backups
    encoding: 'utf-8',
    stdio: 'pipe',
  });
  const stderr = (result.stdout ?? '') + (result.stderr ?? '');
  const errorLines = stderr
    .split('\n')
    .filter(l => l.startsWith('ERROR:') || l.startsWith('FATAL:'))
    .slice(0, 20);
  return { ok: result.status === 0, errorLines };
}

/**
 * Run a single SQL query against the scratch database using the psql CLI.
 * Returns { ok, stdout } — ok=true when psql exits 0.
 */
function psqlQuery(
  scratchDbUrl: string,
  sql: string,
): { ok: boolean; stdout: string; error?: string } {
  const result = spawnSync('psql', [scratchDbUrl, '-tAc', sql], {
    timeout: 30_000,
    encoding: 'utf-8',
    stdio: 'pipe',
  });
  if (result.status !== 0) {
    return {
      ok: false,
      stdout: '',
      error: (result.stderr?.trim() ?? '') || `psql exited with code ${result.status}`,
    };
  }
  return { ok: true, stdout: result.stdout ?? '' };
}

/**
 * Run domain-specific smoke checks against the restored scratch database.
 *
 * Each check performs:
 *   1. COUNT(*) — proves table is present and queryable
 *   2. Domain-specific sample SELECT — proves per-domain reads work
 *
 * A check FAILS only if the table is missing or a query returns an error.
 * Row count of 0 is a PASS (table may have been empty at backup time).
 */
function runSmokeChecks(scratchDbUrl: string): DrillSmokeResult[] {
  const results: DrillSmokeResult[] = [];

  for (const { table, domain, sampleSql } of SMOKE_CHECKS) {
    let rowCount = 0;
    let sampleRows = 0;
    let status: 'pass' | 'fail' = 'fail';
    let error: string | undefined;

    const tableExistsResult = psqlQuery(
      scratchDbUrl,
      `SELECT EXISTS (
         SELECT 1 FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name = '${table}'
       )`,
    );

    if (!tableExistsResult.ok) {
      error = `Table existence check failed: ${tableExistsResult.error}`;
      results.push({ table, domain, rowCount: 0, sampleRows: 0, status: 'fail', error });
      continue;
    }

    const tableExists = tableExistsResult.stdout.trim() === 't';
    if (!tableExists) {
      error = `Table ${table} not found in restored schema — backup may not include this table`;
      results.push({ table, domain, rowCount: 0, sampleRows: 0, status: 'fail', error });
      continue;
    }

    const countResult = psqlQuery(scratchDbUrl, `SELECT COUNT(*)::text FROM public."${table}"`);
    if (!countResult.ok) {
      error = `COUNT query failed: ${countResult.error}`;
      results.push({ table, domain, rowCount: 0, sampleRows: 0, status: 'fail', error });
      continue;
    }
    rowCount = parseInt(countResult.stdout.trim(), 10) || 0;

    const sampleResult = psqlQuery(scratchDbUrl, sampleSql);
    if (!sampleResult.ok) {
      error = `Sample query failed: ${sampleResult.error}`;
      results.push({ table, domain, rowCount, sampleRows: 0, status: 'fail', error });
      continue;
    }
    sampleRows = sampleResult.stdout.trim().split('\n').filter(Boolean).length;
    status = 'pass';

    results.push({ table, domain, rowCount, sampleRows, status, error });
  }

  return results;
}

/**
 * Create an ephemeral scratch database, restore the full backup dump into it,
 * run smoke checks against the restored data, then drop the scratch database.
 *
 * Isolation: a real separate PostgreSQL database — not a side schema.
 * Restore: replays the actual pg_dump SQL from the backup file verbatim using
 *   `gunzip -c backup.sql.gz | psql --set ON_ERROR_STOP=off`
 *   (ON_ERROR_STOP=off allows non-critical preamble errors such as
 *    "schema public already exists" to be skipped without aborting.)
 * All database operations use the psql CLI to avoid bundling the pg driver.
 */
async function runFullDatabaseDrill(
  backupPath: string,
  mainDbUrl: string,
): Promise<{ scratchDbName: string; smokeChecks: DrillSmokeResult[]; restoreErrors: string[] }> {
  const scratchDbName = `dr_drill_${Date.now()}`;
  const scratchDbUrl = buildScratchDbUrl(mainDbUrl, scratchDbName);

  let smokeChecks: DrillSmokeResult[] = [];
  let restoreErrors: string[] = [];

  const createResult = spawnSync('psql', [mainDbUrl, '-c', `CREATE DATABASE "${scratchDbName}"`], {
    timeout: 30_000,
    encoding: 'utf-8',
    stdio: 'pipe',
  });
  if (createResult.status !== 0) {
    throw new Error(
      `Failed to create scratch database: ${createResult.stderr?.trim() ?? 'unknown'}`,
    );
  }
  logger.info({ scratchDbName }, '[backup-drill] Created ephemeral scratch database');

  try {
    logger.info({ scratchDbName, backupPath }, '[backup-drill] Restoring full dump into scratch DB');
    const restore = restoreFullDump(backupPath, scratchDbUrl);
    restoreErrors = restore.errorLines;

    if (!restore.ok) {
      throw new Error(
        `Restore process exited non-zero. First errors: ${restoreErrors.slice(0, 3).join(' | ') || 'unknown'}`,
      );
    }

    const fatalErrors = restoreErrors.filter(
      e => !e.includes('already exists') && !e.includes('does not exist'),
    );
    if (fatalErrors.length > 0) {
      logger.warn(
        { scratchDbName, fatalErrors: fatalErrors.slice(0, 5) },
        '[backup-drill] Unexpected restore errors detected',
      );
    }

    logger.info({ scratchDbName }, '[backup-drill] Running domain smoke checks');
    smokeChecks = runSmokeChecks(scratchDbUrl);
  } finally {
    const dropResult = spawnSync(
      'psql',
      [mainDbUrl, '-c', `DROP DATABASE IF EXISTS "${scratchDbName}"`],
      { timeout: 30_000, encoding: 'utf-8', stdio: 'pipe' },
    );
    if (dropResult.status === 0) {
      logger.info({ scratchDbName }, '[backup-drill] Dropped scratch database');
    } else {
      logger.warn(
        { scratchDbName, err: dropResult.stderr?.trim() },
        '[backup-drill] Failed to drop scratch DB (manual cleanup may be needed)',
      );
    }
  }

  return { scratchDbName, smokeChecks, restoreErrors };
}

async function sendFailureAlert(result: DrillResult): Promise<void> {
  const to = INTERNAL_EMAIL;
  const subject = `[ACTION REQUIRED] Weekly backup restore drill FAILED — ${new Date(result.ranAt).toDateString()}`;
  const html = `
    <h2>Backup Restore Drill — FAILED</h2>
    <p>The weekly automated backup restore drill completed with status <strong>FAIL</strong>.</p>
    <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-family:monospace;font-size:13px;">
      <tr><td><strong>Run ID</strong></td><td>${result.runId}</td></tr>
      <tr><td><strong>Ran At</strong></td><td>${result.ranAt}</td></tr>
      <tr><td><strong>Duration</strong></td><td>${(result.durationMs / 1000).toFixed(1)}s</td></tr>
      <tr><td><strong>Backup File</strong></td><td>${result.backupFile ?? '(none found)'}</td></tr>
      <tr><td><strong>Gzip Integrity</strong></td><td>${result.gzipIntegrityOk === null ? 'n/a' : result.gzipIntegrityOk ? 'PASS' : 'FAIL'}</td></tr>
      <tr><td><strong>Restore Method</strong></td><td>${result.restoreMethod ?? 'n/a'}</td></tr>
      <tr><td><strong>Scratch DB</strong></td><td>${result.scratchDbName ?? 'n/a'}</td></tr>
      <tr><td><strong>Smoke Checks</strong></td><td>${result.smokeChecksPassed} passed / ${result.smokeChecksFailed} failed</td></tr>
      ${result.error ? `<tr><td><strong>Error</strong></td><td style="color:red">${result.error}</td></tr>` : ''}
    </table>
    ${result.smokeChecksFailed > 0 ? `
    <h3>Failed Smoke Checks</h3>
    <ul>
      ${result.smokeChecks.filter(c => c.status === 'fail').map(c =>
        `<li><strong>${c.table}</strong> (${c.domain}): ${c.error ?? 'unknown'}</li>`
      ).join('')}
    </ul>` : ''}
    <hr/>
    <p>Refer to the manual restore runbook: <code>docs/operations/runbook-manual-restore.md</code></p>
    <p>This alert was generated automatically by the platform backup restore drill job.</p>
  `;
  const text = [
    'Backup Restore Drill FAILED',
    '',
    `Run ID: ${result.runId}`,
    `Ran At: ${result.ranAt}`,
    `Duration: ${(result.durationMs / 1000).toFixed(1)}s`,
    `Backup File: ${result.backupFile ?? '(none found)'}`,
    `Gzip Integrity: ${result.gzipIntegrityOk === null ? 'n/a' : result.gzipIntegrityOk ? 'PASS' : 'FAIL'}`,
    `Restore Method: ${result.restoreMethod ?? 'n/a'}`,
    `Smoke Checks: ${result.smokeChecksPassed} passed / ${result.smokeChecksFailed} failed`,
    result.error ? `Error: ${result.error}` : '',
    '',
    'Refer to docs/operations/runbook-manual-restore.md for remediation steps.',
  ].filter(Boolean).join('\n');

  try {
    await sendEmail({ to, subject, html, text });
    logger.info({ to, runId: result.runId }, '[backup-drill] Failure alert email sent');
  } catch (err) {
    logger.error({ err, runId: result.runId }, '[backup-drill] Failed to send alert email');
  }
}

async function writeAuditEntry(result: DrillResult): Promise<void> {
  try {
    await db.insert(auditEventsTable).values({
      action: 'backup_restore_drill',
      entityType: 'backup',
      entityId: null,
      newValues: {
        runId: result.runId,
        status: result.status,
        durationMs: result.durationMs,
        backupFile: result.backupFile,
        gzipIntegrityOk: result.gzipIntegrityOk,
        restoreMethod: result.restoreMethod,
        scratchDbName: result.scratchDbName,
        smokeChecksPassed: result.smokeChecksPassed,
        smokeChecksFailed: result.smokeChecksFailed,
        error: result.error,
        ranAt: result.ranAt,
      },
    });
  } catch (err) {
    logger.warn({ err }, '[backup-drill] Failed to write audit entry (non-fatal)');
  }
}

async function persistDrillRun(result: DrillResult): Promise<void> {
  try {
    await db
      .insert(platformJobRunsTable)
      .values({
        runId: result.runId,
        workflowType: DRILL_JOB_TYPE,
        status: result.status === 'pass' ? 'completed' : 'failed',
        domain: 'platform',
        triggeredBy: 'scheduler',
        triggeredByUserId: null,
        payload: {},
        result: {
          backupFile: result.backupFile,
          backupSizeBytes: result.backupSizeBytes,
          gzipIntegrityOk: result.gzipIntegrityOk,
          restoreMethod: result.restoreMethod,
          scratchDbName: result.scratchDbName,
          smokeChecksPassed: result.smokeChecksPassed,
          smokeChecksFailed: result.smokeChecksFailed,
          smokeChecks: result.smokeChecks,
          durationMs: result.durationMs,
        } as Record<string, unknown>,
        error: result.error ?? undefined,
        correlationId: result.runId,
        workflowRunId: result.runId,
        startedAt: new Date(result.ranAt),
        completedAt: new Date(),
      })
      .onConflictDoNothing();
  } catch (err) {
    logger.warn({ err }, '[backup-drill] Failed to persist drill run record (non-fatal)');
  }
}

export async function runBackupRestoreDrill(): Promise<DrillResult> {
  const runId = `drill_${randomUUID()}`;
  const ranAt = new Date().toISOString();
  const start = Date.now();

  logger.info({ runId }, '[backup-drill] Starting weekly backup restore drill');

  let backupFile: string | null = null;
  let backupSizeBytes: number | null = null;
  let gzipIntegrityOk: boolean | null = null;
  let scratchDbName: string | null = null;
  let restoreMethod: 'full-database' | 'schema-fallback' | null = null;
  let overallError: string | null = null;
  let smokeChecks: DrillSmokeResult[] = [];

  const databaseUrl = process.env.DATABASE_URL;

  try {
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not configured — cannot run restore drill');
    }

    const latest = findLatestBackup();
    if (!latest) {
      overallError = 'No backup file found in BACKUP_DIR — run backup-db.sh first';
      logger.error({ runId, BACKUP_DIR }, '[backup-drill] No backup file found');
    } else {
      backupFile = latest.filename;
      backupSizeBytes = latest.sizeBytes;
      logger.info({ runId, backupFile, backupSizeBytes }, '[backup-drill] Found latest backup');

      gzipIntegrityOk = verifyGzipIntegrity(latest.fullPath);
      if (!gzipIntegrityOk) {
        overallError = `Gzip integrity check failed for ${backupFile}`;
        logger.error({ runId, backupFile }, '[backup-drill] Gzip integrity check FAILED');
      } else {
        logger.info({ runId, backupFile }, '[backup-drill] Gzip integrity OK — starting full-database restore drill');
        restoreMethod = 'full-database';

        const drillResult = await runFullDatabaseDrill(latest.fullPath, databaseUrl);
        scratchDbName = drillResult.scratchDbName;
        smokeChecks = drillResult.smokeChecks;

        logger.info(
          {
            runId,
            passed: smokeChecks.filter(c => c.status === 'pass').length,
            failed: smokeChecks.filter(c => c.status === 'fail').length,
            restoreErrors: drillResult.restoreErrors.length,
          },
          '[backup-drill] Restore + smoke checks complete',
        );
      }
    }
  } catch (err) {
    overallError = err instanceof Error ? err.message : String(err);
    logger.error({ err, runId }, '[backup-drill] Unexpected error during drill');
  }

  const smokeChecksPassed = smokeChecks.filter(c => c.status === 'pass').length;
  const smokeChecksFailed = smokeChecks.filter(c => c.status === 'fail').length;

  const status: 'pass' | 'fail' =
    overallError !== null ||
    gzipIntegrityOk === false ||
    smokeChecksFailed > 0
      ? 'fail'
      : 'pass';

  const durationMs = Date.now() - start;

  const result: DrillResult = {
    runId,
    ranAt,
    durationMs,
    status,
    backupFile,
    backupSizeBytes,
    gzipIntegrityOk,
    scratchDbName,
    restoreMethod,
    smokeChecks,
    smokeChecksPassed,
    smokeChecksFailed,
    error: overallError,
  };

  logger.info({ runId, status, durationMs }, '[backup-drill] Drill complete');

  await Promise.allSettled([
    persistDrillRun(result),
    writeAuditEntry(result),
    status === 'fail' ? sendFailureAlert(result) : Promise.resolve(),
  ]);

  return result;
}

export async function getLastDrillRuns(limit = 10): Promise<{
  runs: Array<{
    runId: string;
    status: string;
    ranAt: string;
    durationMs: number | null;
    backupFile: string | null;
    gzipIntegrityOk: boolean | null;
    restoreMethod: string | null;
    scratchDbName: string | null;
    smokeChecksPassed: number | null;
    smokeChecksFailed: number | null;
    error: string | null;
  }>;
  lastSuccessAt: string | null;
}> {
  try {
    const rows = await db
      .select()
      .from(platformJobRunsTable)
      .where(eq(platformJobRunsTable.workflowType, DRILL_JOB_TYPE))
      .orderBy(desc(platformJobRunsTable.startedAt))
      .limit(limit);

    const runs = rows.map(r => {
      const res = (r.result ?? {}) as Record<string, unknown>;
      return {
        runId: r.runId,
        status: r.status,
        ranAt: r.startedAt?.toISOString() ?? r.createdAt.toISOString(),
        durationMs: typeof res.durationMs === 'number' ? res.durationMs : null,
        backupFile: typeof res.backupFile === 'string' ? res.backupFile : null,
        gzipIntegrityOk: typeof res.gzipIntegrityOk === 'boolean' ? res.gzipIntegrityOk : null,
        restoreMethod: typeof res.restoreMethod === 'string' ? res.restoreMethod : null,
        scratchDbName: typeof res.scratchDbName === 'string' ? res.scratchDbName : null,
        smokeChecksPassed: typeof res.smokeChecksPassed === 'number' ? res.smokeChecksPassed : null,
        smokeChecksFailed: typeof res.smokeChecksFailed === 'number' ? res.smokeChecksFailed : null,
        error: r.error ?? null,
      };
    });

    const lastSuccess = runs.find(r => r.status === 'completed');
    return { runs, lastSuccessAt: lastSuccess?.ranAt ?? null };
  } catch (err) {
    logger.warn({ err }, '[backup-drill] Failed to query drill run history');
    return { runs: [], lastSuccessAt: null };
  }
}
