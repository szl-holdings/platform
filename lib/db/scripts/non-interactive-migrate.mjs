#!/usr/bin/env node
/**
 * Schema sync wrapper used by `scripts/post-merge.sh`.
 *
 * What it does
 * ------------
 * 1. Hashes every file under `lib/db/src/schema/**` and compares against a
 *    marker row in `_szl_schema_marker` on the dev DB. If the hash matches,
 *    the schema is provably identical to what was last successfully synced
 *    and we exit immediately (~1s instead of multi-minute introspection).
 * 2. On a hash mismatch (or first run), runs the lib/db `migrate` pipeline:
 *    `backfill-migrations.mjs` → `drizzle-kit migrate` → `apply-manual-migrations.mjs`.
 *    `drizzle-kit migrate` replays only journaled SQL files from
 *    `lib/db/drizzle/` that are newer than the latest entry in
 *    `drizzle.__drizzle_migrations`, which is dramatically faster than the
 *    old `drizzle-kit push` introspection diff (Task #5056).
 * 3. On success, persists the new hash to the marker so the next merge
 *    short-circuits again.
 *
 * Why we switched from `push` to `migrate` (Task #5056)
 * -----------------------------------------------------
 * `drizzle-kit push --force` had two problems:
 *   • It introspects every table in information_schema on every invocation
 *     (~4 minutes against our 800-table schema) even when only one table
 *     changed.
 *   • It prompts interactively on suspected renames ("Is `foo` a new table
 *     or renamed from `bar`?"), which required a newline-injection /
 *     prompt-detection wrapper to keep CI from hanging.
 * `migrate` replays journaled SQL files in order and is fully non-
 * interactive by design — no prompt handling needed, and the cost is
 * proportional to the number of *new* migrations, not the total schema
 * size.
 *
 * Behaviour knobs
 * ---------------
 *   DB_MIGRATE_TIMEOUT_MS   hard wall-clock timeout (default 8min)
 *   DB_MIGRATE_FORCE        skip the hash short-circuit (always migrate)
 *   DB_MIGRATE_SKIP_MARKER  do not read/write the marker table
 */

import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_DIR = path.resolve(__dirname, '..');
const SCHEMA_DIR = path.resolve(DB_DIR, 'src/schema');

const TIMEOUT_MS = Number(process.env.DB_MIGRATE_TIMEOUT_MS ?? 8 * 60 * 1000);
const FORCE = ['1', 'true', 'yes'].includes(
  String(process.env.DB_MIGRATE_FORCE ?? '').toLowerCase(),
);
const SKIP_MARKER = ['1', 'true', 'yes'].includes(
  String(process.env.DB_MIGRATE_SKIP_MARKER ?? '').toLowerCase(),
);

const MARKER_TABLE = '_szl_schema_marker';

function ts() {
  return new Date().toISOString();
}

function log(msg) {
  process.stdout.write(`[${ts()}] [db:migrate] ${msg}\n`);
}

// ─────────────────────────────────────────────────────────────────────
// Schema hashing
// ─────────────────────────────────────────────────────────────────────

function collectSchemaFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      out.push(...collectSchemaFiles(full));
    } else if (st.isFile() && /\.(ts|mts|cts)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

function computeSchemaHash() {
  const files = collectSchemaFiles(SCHEMA_DIR).sort();
  const hash = createHash('sha256');
  for (const f of files) {
    const rel = path.relative(SCHEMA_DIR, f);
    hash.update(rel);
    hash.update('\0');
    hash.update(readFileSync(f));
    hash.update('\0');
  }
  return { hash: hash.digest('hex'), fileCount: files.length };
}

// ─────────────────────────────────────────────────────────────────────
// Marker table I/O
// ─────────────────────────────────────────────────────────────────────

async function loadEnv() {
  const mod = await import('@szl-holdings/env');
  return mod.getEnv();
}

async function withClient(fn) {
  const env = await loadEnv();
  if (!env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }
  const pg = (await import('pg')).default;
  const client = new pg.Client({
    connectionString: env.DATABASE_URL,
    connectionTimeoutMillis: 10_000,
    statement_timeout: 15_000,
  });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    try {
      await client.end();
    } catch {
      /* ignore */
    }
  }
}

async function readMarker() {
  return withClient(async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${MARKER_TABLE} (
        id INTEGER PRIMARY KEY,
        schema_hash TEXT NOT NULL,
        file_count INTEGER NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    const res = await client.query(
      `SELECT schema_hash, file_count, updated_at FROM ${MARKER_TABLE} WHERE id = 1`,
    );
    return res.rows[0] ?? null;
  });
}

async function writeMarker(hash, fileCount) {
  return withClient(async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${MARKER_TABLE} (
        id INTEGER PRIMARY KEY,
        schema_hash TEXT NOT NULL,
        file_count INTEGER NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await client.query(
      `
      INSERT INTO ${MARKER_TABLE} (id, schema_hash, file_count, updated_at)
      VALUES (1, $1, $2, NOW())
      ON CONFLICT (id) DO UPDATE
        SET schema_hash = EXCLUDED.schema_hash,
            file_count = EXCLUDED.file_count,
            updated_at = NOW()
    `,
      [hash, fileCount],
    );
  });
}

// ─────────────────────────────────────────────────────────────────────
// drizzle-kit migrate (the slow path — but now proportional to deltas)
// ─────────────────────────────────────────────────────────────────────

function runStep(cmd, args, deadline) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      cwd: DB_DIR,
      // stdin is /dev/null upstream; migrate never prompts so no need
      // for prompt-detection / newline-injection wrappers.
      stdio: ['ignore', 'inherit', 'inherit'],
      env: process.env,
    });

    let killed = false;
    let closed = false;

    function triggerKill() {
      if (closed) return;
      try {
        child.kill('SIGTERM');
      } catch {
        /* already exited */
      }
      setTimeout(() => {
        if (!closed) {
          try {
            child.kill('SIGKILL');
          } catch {
            /* already exited */
          }
        }
      }, 5_000).unref();
    }

    const remaining = Math.max(1_000, deadline - Date.now());
    const killTimer = setTimeout(() => {
      killed = true;
      triggerKill();
    }, remaining);

    child.on('error', () => {
      clearTimeout(killTimer);
      resolve({ exitCode: 1, signal: null, killed });
    });

    child.on('close', (code, signal) => {
      closed = true;
      clearTimeout(killTimer);
      resolve({ exitCode: code, signal, killed });
    });
  });
}

async function runMigratePipeline(deadline) {
  // Post-merge runs `backfill → drizzle-kit migrate` only. The hand-authored
  // SQL files under `lib/db/migrations/` (applied via apply-manual-migrations.mjs)
  // are NOT part of the post-merge path — they are run separately via
  // `pnpm --filter @szl-holdings/db migrate:manual`. Some of those manual
  // migrations ALTER tables that may not yet exist on every dev DB (a
  // pre-existing journal/schema gap that `drizzle-kit push` papered over),
  // and running them here would fail the post-merge for unrelated drift.
  const steps = [
    { name: 'backfill', cmd: 'node', args: ['./scripts/backfill-migrations.mjs'] },
    {
      name: 'drizzle-kit migrate',
      cmd: 'node_modules/.bin/drizzle-kit',
      args: ['migrate', '--config', './drizzle.config.ts'],
    },
  ];

  for (const step of steps) {
    log(`running ${step.name}…`);
    const r = await runStep(step.cmd, step.args, deadline);
    if (r.killed) {
      log(`${step.name} timed out (hardTimeout)`);
      return { exitCode: 124, step: step.name };
    }
    if (r.exitCode !== 0) {
      log(`${step.name} exited code=${r.exitCode} signal=${r.signal}`);
      return { exitCode: r.exitCode ?? 1, step: step.name };
    }
  }
  return { exitCode: 0, step: null };
}

// ─────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────

async function main() {
  const started = Date.now();
  const deadline = started + TIMEOUT_MS;
  const { hash, fileCount } = computeSchemaHash();
  log(`schema hash=${hash.slice(0, 12)} files=${fileCount}`);

  let marker = null;
  if (!SKIP_MARKER && !FORCE) {
    try {
      marker = await readMarker();
    } catch (err) {
      log(
        `marker read failed (${err?.code ?? err?.message ?? 'unknown'}); falling back to full migrate`,
      );
    }
  }

  if (marker && marker.schema_hash === hash) {
    const elapsed = ((Date.now() - started) / 1000).toFixed(1);
    log(
      `schema unchanged since ${marker.updated_at?.toISOString?.() ?? marker.updated_at} — skipping drizzle-kit migrate (${elapsed}s)`,
    );
    process.exitCode = 0;
    return;
  }

  if (marker) {
    log(
      `schema hash changed (was ${String(marker.schema_hash).slice(0, 12)}); running drizzle-kit migrate`,
    );
  } else if (FORCE) {
    log('DB_MIGRATE_FORCE set — running drizzle-kit migrate unconditionally');
  } else if (SKIP_MARKER) {
    log('DB_MIGRATE_SKIP_MARKER set — running drizzle-kit migrate without marker');
  } else {
    log('no schema marker found — running drizzle-kit migrate (first run)');
  }

  const result = await runMigratePipeline(deadline);
  const elapsed = ((Date.now() - started) / 1000).toFixed(1);
  log(
    `migrate pipeline exited code=${result.exitCode} failedStep=${result.step ?? 'none'} elapsed=${elapsed}s`,
  );

  if (result.exitCode !== 0) {
    process.exitCode = result.exitCode;
    return;
  }

  // Migrate succeeded — persist the new marker so future runs short-circuit.
  if (!SKIP_MARKER) {
    try {
      await writeMarker(hash, fileCount);
      log(`marker updated to hash=${hash.slice(0, 12)}`);
    } catch (err) {
      log(
        `marker write failed (${err?.code ?? err?.message ?? 'unknown'}) — next run will re-migrate`,
      );
    }
  }

  process.exitCode = 0;
}

main().catch((err) => {
  log(`fatal: ${err?.stack ?? err}`);
  process.exitCode = 1;
});
