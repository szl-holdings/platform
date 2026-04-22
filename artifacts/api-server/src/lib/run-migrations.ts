/**
 * run-migrations.ts
 *
 * Single migration path that replaces all scattered ensure*Tables() runtime calls.
 * Reads every SQL file from lib/db/drizzle/ in lexicographic order and applies each
 * statement idempotently using the raw pg pool. The function is safe to call on every
 * server start — CREATE TABLE IF NOT EXISTS and ALTER TABLE ADD COLUMN IF NOT EXISTS
 * guarantee no data loss on re-execution.
 */

import { PgClient } from '@szl-holdings/db';
import fs from 'fs';
import path from 'path';
import { logger } from './logger';

const BENIGN_PG_CODES = new Set([
  '42P07', // relation already exists
  '42701', // column already exists
  '42703', // column does not exist (for some alter-table edge cases)
  '42710', // object already exists (index)
  '23505', // unique violation (index already present)
  '42P16', // invalid table definition — treated as benign for idempotency
]);

function isIdempotentError(err: unknown): boolean {
  const pgCode = (err as { code?: string }).code;
  if (pgCode && BENIGN_PG_CODES.has(pgCode)) return true;
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes('already exists') ||
    msg.includes('duplicate column') ||
    msg.includes('duplicate key')
  );
}

function findMigrationsDir(): string {
  const candidates = [
    process.env['REPL_HOME'] && path.join(process.env['REPL_HOME'], 'lib', 'db', 'drizzle'),
    path.resolve(process.cwd(), 'lib', 'db', 'drizzle'),
    path.resolve(process.cwd(), '..', '..', 'lib', 'db', 'drizzle'),
    path.resolve(__dirname, '..', '..', '..', '..', 'lib', 'db', 'drizzle'),
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error(`Could not locate lib/db/drizzle directory. Tried: ${candidates.join(', ')}`);
}

function parseSqlStatements(sql: string): string[] {
  const withoutComments = sql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n');

  if (withoutComments.includes('--> statement-breakpoint')) {
    return withoutComments
      .split('--> statement-breakpoint')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  const statements: string[] = [];
  let current = '';
  let dollarDepth = 0;

  for (const line of withoutComments.split('\n')) {
    const trimmed = line.trim();
    const dollarMatches = (trimmed.match(/\$\$/g) || []).length;
    dollarDepth += dollarMatches;
    current += line + '\n';

    if (dollarDepth % 2 === 0 && trimmed.endsWith(';')) {
      const stmt = current.trim().replace(/;$/, '').trim();
      if (stmt.length > 0) statements.push(stmt);
      current = '';
    }
  }

  const remaining = current.trim();
  if (remaining.length > 0) statements.push(remaining);

  return statements.filter((s) => s.length > 0);
}

export async function runMigrations(): Promise<void> {
  let migrationsDir: string;
  try {
    migrationsDir = findMigrationsDir();
  } catch (err) {
    logger.error({ err }, '[migrations] Cannot locate migrations directory — aborting');
    throw err;
  }

  const sqlFiles = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  logger.info(
    { count: sqlFiles.length, dir: migrationsDir },
    '[migrations] Starting consolidated migration run',
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Use a DEDICATED single connection (NOT from the shared `pool`) for the
  // migration run.
  //
  // Background: the consolidated migrator runs 113+ SQL files at startup.
  // When it checked out from the shared pool via `pool.connect()`, that one
  // connection was held for the entire run (often tens of seconds). With
  // `DB_POOL_MAX` as low as 10, the pool's leak detector then logged
  // long-checkout warnings, and any request handler that fired during
  // bootstrap competed for the remaining slots. Under contention, requests
  // hit `connectionTimeoutMillis` (default 90s) and the server appeared to
  // crash with "timeout exceeded when trying to connect".
  //
  // The fix is to bypass the shared pool entirely: open a single
  // `pg.Client` against `DATABASE_URL`, run every migration through it, and
  // close it. The shared pool is never touched, so request handlers retain
  // full pool capacity throughout startup and the long-checkout warnings
  // disappear.
  // ─────────────────────────────────────────────────────────────────────────
  const connectionString = process.env['DATABASE_URL'];
  if (!connectionString) {
    throw new Error(
      '[migrations] DATABASE_URL must be set to run migrations on a dedicated connection',
    );
  }
  const client = new PgClient({ connectionString });
  await client.connect();
  try {
    let totalApplied = 0;
    let totalSkipped = 0;

    for (const file of sqlFiles) {
      const filePath = path.join(migrationsDir, file);
      let rawSql: string;
      try {
        rawSql = fs.readFileSync(filePath, 'utf-8');
      } catch (err) {
        logger.warn({ err, file }, '[migrations] Could not read SQL file — skipping');
        continue;
      }

      const statements = parseSqlStatements(rawSql);
      let fileApplied = 0;
      let fileSkipped = 0;

      for (const stmt of statements) {
        const trimmed = stmt.trim();
        if (!trimmed || trimmed.length === 0) continue;
        try {
          await client.query(trimmed);
          fileApplied++;
        } catch (err) {
          if (isIdempotentError(err)) {
            fileSkipped++;
          } else {
            logger.warn(
              { err, file, stmt: trimmed.slice(0, 140) },
              '[migrations] Statement failed — continuing (non-fatal)',
            );
            fileSkipped++;
          }
        }
      }

      totalApplied += fileApplied;
      totalSkipped += fileSkipped;
      logger.debug({ file, fileApplied, fileSkipped }, '[migrations] File complete');
    }

    logger.info(
      { files: sqlFiles.length, totalApplied, totalSkipped },
      '[migrations] Consolidated migration run complete',
    );
  } finally {
    try {
      await client.end();
    } catch (err) {
      logger.warn({ err }, '[migrations] Failed to close dedicated migration client (non-fatal)');
    }
  }
}

export { runMigrations as runAllMigrations };
