#!/usr/bin/env node
/**
 * Non-interactive wrapper around `drizzle-kit push --force` for the
 * `db:migrate` workflow (Task #1050, AF: workflow hangs on prompts).
 *
 * Why this exists
 * ---------------
 * `drizzle-kit push --force` pushes the schema to the live DB without asking
 * for confirmation on data-loss DDL — but it STILL prompts interactively
 * whenever it detects a new table or column that *might* be a rename of an
 * existing one ("Is `foo` a new table or renamed from `bar`?"). With our
 * 700+ table schema those prompts can fire dozens of times. When the
 * command runs in a workflow / CI / any non-TTY context, the prompt
 * blocks forever waiting on stdin and the workflow hangs indefinitely.
 *
 * Schema-hash short-circuit (Task #5025)
 * --------------------------------------
 * Even with prompts handled, `drizzle-kit push` introspects all ~800
 * tables from information_schema on every invocation, which takes ~4
 * minutes and frequently exceeds our wall-clock budget. The vast
 * majority of merges contain no schema change at all.
 *
 * Before invoking drizzle-kit we compute a SHA-256 of every file under
 * `lib/db/src/schema/**` (the only inputs that can affect the diff) and
 * compare it against a marker row in `_szl_schema_marker` on the dev DB.
 * If the hash matches, the schema is provably identical to what was
 * last successfully pushed and we skip the push entirely (~1s instead
 * of ~240s). On any mismatch — or if the marker table is missing — we
 * fall through to a full push and persist the new hash on success.
 *
 * Behaviour knobs
 * ---------------
 *   DB_MIGRATE_TIMEOUT_MS         hard wall-clock timeout (default 8min)
 *   DB_MIGRATE_FAIL_ON_PROMPT     abort instead of auto-answering prompts
 *   DB_MIGRATE_FORCE              skip the hash short-circuit (always push)
 *   DB_MIGRATE_SKIP_MARKER        do not read/write the marker table
 *
 * Long-term we should switch the workflow to `drizzle-kit migrate` against
 * pre-generated SQL files (lib/db/drizzle/*.sql), which is fully
 * non-interactive by design. That migration is tracked separately because
 * the journal (lib/db/drizzle/meta/_journal.json) is currently behind the
 * SQL file tree and needs reconciliation first.
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
const NEWLINE_INTERVAL_MS = 500;
const FAIL_ON_PROMPT = ['1', 'true', 'yes'].includes(
  String(process.env.DB_MIGRATE_FAIL_ON_PROMPT ?? '').toLowerCase(),
);
const FORCE_PUSH = ['1', 'true', 'yes'].includes(
  String(process.env.DB_MIGRATE_FORCE ?? '').toLowerCase(),
);
const SKIP_MARKER = ['1', 'true', 'yes'].includes(
  String(process.env.DB_MIGRATE_SKIP_MARKER ?? '').toLowerCase(),
);

const MARKER_TABLE = '_szl_schema_marker';

const PROMPT_MARKERS = [
  'Is ',
  ' column created',
  ' enum created',
  'renamed from another',
];

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
    // Independent, short connect timeout: the marker check must never
    // hang waiting on a saturated dev DB.
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
    // Create-if-missing is idempotent and cheap.
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
// drizzle-kit push (the slow path)
// ─────────────────────────────────────────────────────────────────────

function runDrizzlePush() {
  return new Promise((resolve) => {
    const child = spawn(
      'node_modules/.bin/drizzle-kit',
      ['push', '--force', '--config', './drizzle.config.ts'],
      {
        cwd: DB_DIR,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: process.env,
      },
    );

    let promptsSeen = 0;
    let stdoutBuf = '';
    let stderrBuf = '';
    let killed = false;
    let closed = false;
    let promptAbort = false;

    function relayChunk(streamName, chunk) {
      const text = chunk.toString();
      process[streamName === 'stderr' ? 'stderr' : 'stdout'].write(text);
      if (streamName === 'stderr') {
        stderrBuf += text;
      } else {
        stdoutBuf += text;
      }
      const buf = streamName === 'stderr' ? stderrBuf : stdoutBuf;
      for (const marker of PROMPT_MARKERS) {
        const idx = buf.lastIndexOf(marker);
        if (
          idx !== -1 &&
          idx > buf.length - text.length - marker.length
        ) {
          promptsSeen += 1;
          if (FAIL_ON_PROMPT) {
            promptAbort = true;
            triggerKill();
            return;
          }
        }
      }
      if (stdoutBuf.length > 1_000_000) stdoutBuf = stdoutBuf.slice(-100_000);
      if (stderrBuf.length > 1_000_000) stderrBuf = stderrBuf.slice(-100_000);
    }

    child.stdout.on('data', (c) => relayChunk('stdout', c));
    child.stderr.on('data', (c) => relayChunk('stderr', c));

    child.stdin.on('error', (err) => {
      if (err && (err.code === 'EPIPE' || err.code === 'ERR_STREAM_DESTROYED')) {
        return;
      }
    });

    const newlineTimer = setInterval(() => {
      if (!child.stdin.destroyed && child.stdin.writable) {
        try {
          child.stdin.write('\n');
        } catch {
          clearInterval(newlineTimer);
        }
      }
    }, NEWLINE_INTERVAL_MS);

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

    const killTimer = setTimeout(() => {
      killed = true;
      triggerKill();
    }, TIMEOUT_MS);

    child.on('error', () => {
      clearInterval(newlineTimer);
      clearTimeout(killTimer);
      resolve({ exitCode: 1, signal: null, promptsSeen, killed, promptAbort });
    });

    child.on('close', (code, signal) => {
      closed = true;
      clearInterval(newlineTimer);
      clearTimeout(killTimer);
      try {
        child.stdin.end();
      } catch {
        /* ignore */
      }
      resolve({ exitCode: code, signal, promptsSeen, killed, promptAbort });
    });
  });
}

// ─────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────

async function main() {
  const started = Date.now();
  const { hash, fileCount } = computeSchemaHash();
  log(`schema hash=${hash.slice(0, 12)} files=${fileCount}`);

  let marker = null;
  if (!SKIP_MARKER && !FORCE_PUSH) {
    try {
      marker = await readMarker();
    } catch (err) {
      log(
        `marker read failed (${err?.code ?? err?.message ?? 'unknown'}); falling back to full push`,
      );
    }
  }

  if (marker && marker.schema_hash === hash) {
    const elapsed = ((Date.now() - started) / 1000).toFixed(1);
    log(
      `schema unchanged since ${marker.updated_at?.toISOString?.() ?? marker.updated_at} — skipping drizzle-kit push (${elapsed}s)`,
    );
    process.exitCode = 0;
    return;
  }

  if (marker) {
    log(
      `schema hash changed (was ${String(marker.schema_hash).slice(0, 12)}); running drizzle-kit push`,
    );
  } else if (FORCE_PUSH) {
    log('DB_MIGRATE_FORCE set — running drizzle-kit push unconditionally');
  } else if (SKIP_MARKER) {
    log('DB_MIGRATE_SKIP_MARKER set — running drizzle-kit push without marker');
  } else {
    log('no schema marker found — running drizzle-kit push (first run)');
  }

  const result = await runDrizzlePush();
  const elapsed = ((Date.now() - started) / 1000).toFixed(1);
  log(
    `drizzle-kit exited code=${result.exitCode} signal=${result.signal} promptsSeen=${result.promptsSeen} hardTimeout=${result.killed} promptAbort=${result.promptAbort} elapsed=${elapsed}s`,
  );

  if (result.killed) {
    process.exitCode = 124;
    return;
  }
  if (result.promptAbort) {
    process.exitCode = 65;
    return;
  }
  if (result.exitCode !== 0) {
    process.exitCode = result.exitCode ?? 1;
    return;
  }

  // Push succeeded — persist the new marker so future runs short-circuit.
  if (!SKIP_MARKER) {
    try {
      await writeMarker(hash, fileCount);
      log(`marker updated to hash=${hash.slice(0, 12)}`);
    } catch (err) {
      log(
        `marker write failed (${err?.code ?? err?.message ?? 'unknown'}) — next run will re-push`,
      );
    }
  }

  process.exitCode = 0;
}

main().catch((err) => {
  log(`fatal: ${err?.stack ?? err}`);
  process.exitCode = 1;
});
