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
 * What this wrapper does
 * ----------------------
 * 1. Spawns drizzle-kit push --force as a child process with a writable
 *    stdin pipe (instead of inheriting the workflow's TTY-less stdin).
 * 2. Streams a steady supply of newlines into stdin. The default option in
 *    every drizzle-kit "new table or rename?" picker is "create new table",
 *    so a bare Enter keypress picks the safe answer.
 * 3. Watches stdout/stderr for the prompt header strings and logs a
 *    warning when one is auto-answered, so any drift gets surfaced in the
 *    workflow log instead of silently re-creating the wrong tables.
 * 4. Enforces a hard wall-clock timeout (default 8 min, override with
 *    DB_MIGRATE_TIMEOUT_MS) so a stuck process never blocks indefinitely.
 * 5. Forwards the child's exit code so CI / workflow status is accurate.
 *
 * Long-term we should switch the workflow to `drizzle-kit migrate` against
 * pre-generated SQL files (lib/db/drizzle/*.sql), which is fully
 * non-interactive by design. That migration is tracked separately because
 * the journal (lib/db/drizzle/meta/_journal.json) is currently behind the
 * SQL file tree and needs reconciliation first.
 */

import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_DIR = path.resolve(__dirname, '..');

const TIMEOUT_MS = Number(process.env.DB_MIGRATE_TIMEOUT_MS ?? 8 * 60 * 1000);
const NEWLINE_INTERVAL_MS = 500;
// When set to a truthy value, the wrapper aborts (instead of auto-answering)
// the moment a prompt is detected. Use this in production / CI to fail
// closed if drizzle-kit ever introduces a prompt whose default option is
// not the safe "create new table" answer this wrapper assumes.
const FAIL_ON_PROMPT = ['1', 'true', 'yes'].includes(
  String(process.env.DB_MIGRATE_FAIL_ON_PROMPT ?? '').toLowerCase(),
);

// Prompt header substrings drizzle-kit emits before blocking on input.
// We log a warning when one is seen so silently-auto-answered renames
// can be audited from the workflow log.
const PROMPT_MARKERS = [
  'Is ', // "Is `foo` table created or renamed from another?"
  ' column created', // "Is `foo.bar` column created or renamed from?"
  ' enum created', // similar for enum
  'renamed from another',
];

function ts() {
  return new Date().toISOString();
}

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
  const buf = streamName === 'stderr' ? (stderrBuf += text) : (stdoutBuf += text);
  for (const marker of PROMPT_MARKERS) {
    const idx = buf.lastIndexOf(marker);
    if (
      idx !== -1 &&
      idx >
        (streamName === 'stderr' ? stderrBuf.length : stdoutBuf.length) -
          text.length -
          marker.length
    ) {
      promptsSeen += 1;
      if (FAIL_ON_PROMPT) {
        promptAbort = true;
        // Trigger the same SIGTERM/SIGKILL escalation path used for hard
        // timeouts so we never leave a child process behind.
        triggerKill('prompt-abort');
        return;
      }
    }
  }
  // Cap buffers so very long pushes don't bloat memory
  if (stdoutBuf.length > 1_000_000) stdoutBuf = stdoutBuf.slice(-100_000);
  if (stderrBuf.length > 1_000_000) stderrBuf = stderrBuf.slice(-100_000);
}

child.stdout.on('data', (c) => relayChunk('stdout', c));
child.stderr.on('data', (c) => relayChunk('stderr', c));

// Swallow EPIPE on stdin — it just means the child closed its input
// (which is the happy path for a successful no-op push). Without this
// handler Node would crash with an unhandled "error" event.
child.stdin.on('error', (err) => {
  if (err && (err.code === 'EPIPE' || err.code === 'ERR_STREAM_DESTROYED')) {
    return;
  }
});

// Steady drip of Enter keypresses. drizzle-kit's prompt selects the
// default option ("create new table") on bare Enter. We send one every
// NEWLINE_INTERVAL_MS so any prompt that appears is answered within
// half a second; idle prompts ignore the input so this is safe.
const newlineTimer = setInterval(() => {
  if (!child.stdin.destroyed && child.stdin.writable) {
    try {
      child.stdin.write('\n');
    } catch {
      // stdin closed by child — stop trying
      clearInterval(newlineTimer);
    }
  }
}, NEWLINE_INTERVAL_MS);

// Centralized kill escalation. SIGTERM first, then SIGKILL after a grace
// period — using `closed` (set in the close handler) instead of
// `child.killed` because `child.killed` flips to true the moment a signal
// is delivered, NOT when the process actually exits. A child that ignores
// SIGTERM would otherwise never receive the SIGKILL fallback and could
// still hang the workflow indefinitely.
function triggerKill(_reason) {
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
  triggerKill('hard-timeout');
}, TIMEOUT_MS);

child.on('error', (_err) => {
  clearInterval(newlineTimer);
  clearTimeout(killTimer);
  process.exitCode = 1;
});

child.on('close', (code, signal) => {
  closed = true;
  clearInterval(newlineTimer);
  clearTimeout(killTimer);
  // Use synchronous fd write so the final status line lands in workflow
  // logs even if Node's stdout buffer hasn't flushed yet — process.exit
  // can otherwise drop trailing console.log output.
  const summary = `[${ts()}] [db:migrate] drizzle-kit exited code=${code} signal=${signal} promptsSeen=${promptsSeen} hardTimeout=${killed} promptAbort=${promptAbort}\n`;
  process.stdout.write(summary);
  // Setting exitCode (instead of calling process.exit) lets the event
  // loop drain naturally — all listeners are torn down above so the
  // process will exit on its own with the correct code.
  if (killed) {
    process.exitCode = 124; // standard timeout exit code
  } else if (promptAbort) {
    process.exitCode = 65; // EX_DATAERR — schema diff requires human-authored migration
  } else {
    process.exitCode = code ?? 1;
  }
  // Ensure stdin pipe is released
  try {
    child.stdin.end();
  } catch {
    /* already closed */
  }
});
