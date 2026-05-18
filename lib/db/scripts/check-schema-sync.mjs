#!/usr/bin/env node
/**
 * Author-time schema-drift guardrail (task #5057).
 *
 * The runtime wrapper in `non-interactive-migrate.mjs` will happily reconcile
 * a hash mismatch by invoking `drizzle-kit push` — but that only happens at
 * merge time, by which point the dev DB has been mutated without a SQL
 * migration in `lib/db/drizzle/` to record what changed. Migrations stop being
 * the source of truth.
 *
 * This check runs locally (and in CI) and fails if the current schema hash
 * does not match the hash recorded the last time `drizzle-kit generate`
 * produced a migration (stored in `drizzle/meta/_schema_hash.json`).
 *
 * To resolve a failure:
 *   1. `pnpm --filter @szl-holdings/db generate` — produces a new SQL file in
 *      `lib/db/drizzle/` and updates `_schema_hash.json` automatically.
 *   2. Commit the new SQL file, the updated `_journal.json`, the snapshot
 *      JSON, and the refreshed `_schema_hash.json`.
 *
 * If you intentionally need to bypass the check (rare — typically only when
 * editing comments / formatting in a schema file), re-run `generate` to
 * refresh the marker, or set SKIP_SCHEMA_SYNC_CHECK=1 to skip locally. Do
 * not set the bypass in CI.
 *
 * Exit codes: 0 = in sync, 1 = drift detected, 2 = marker missing.
 */

import { existsSync, readFileSync } from 'node:fs';
import {
  HASH_MARKER_PATH,
  computeSchemaHash,
  readJournalTip,
} from './_schema-hash.mjs';

const SKIP = ['1', 'true', 'yes'].includes(
  String(process.env.SKIP_SCHEMA_SYNC_CHECK ?? '').toLowerCase(),
);

function log(msg) {
  process.stdout.write(`[db:check:schema-sync] ${msg}\n`);
}

function fail(msg) {
  process.stderr.write(`[db:check:schema-sync] ERROR: ${msg}\n`);
}

if (SKIP) {
  log('SKIP_SCHEMA_SYNC_CHECK set — skipping');
  process.exit(0);
}

const { hash, fileCount } = computeSchemaHash();
const tip = readJournalTip();

if (!existsSync(HASH_MARKER_PATH)) {
  fail(
    `marker file is missing at lib/db/drizzle/meta/_schema_hash.json.\n` +
      `Run: pnpm --filter @szl-holdings/db generate\n` +
      `(or, if no schema change is intended, ` +
      `pnpm --filter @szl-holdings/db exec node ./scripts/update-schema-hash.mjs ` +
      `to seed the marker against the current schema and the latest journal tip)`,
  );
  process.exit(2);
}

let marker;
try {
  marker = JSON.parse(readFileSync(HASH_MARKER_PATH, 'utf8'));
} catch (err) {
  fail(`could not parse marker file: ${err?.message ?? err}`);
  process.exit(2);
}

if (marker.schemaHash === hash) {
  log(
    `ok — schema hash matches marker (${hash.slice(0, 12)}, ` +
      `${fileCount} files, journal tip #${tip.idx} ${tip.tag ?? 'n/a'})`,
  );
  process.exit(0);
}

fail(
  `schema files have changed since the last generated migration.\n` +
    `  current hash : ${hash.slice(0, 12)} (${fileCount} files)\n` +
    `  marker hash  : ${String(marker.schemaHash ?? '').slice(0, 12)} ` +
    `(${marker.fileCount ?? '?'} files)\n` +
    `  marker tag   : ${marker.journalTag ?? 'n/a'} (idx ${marker.journalIdx ?? '?'})\n` +
    `  journal tip  : ${tip.tag ?? 'n/a'} (idx ${tip.idx})\n` +
    '\n' +
    'You edited lib/db/src/schema/** but did not generate a SQL migration.\n' +
    'Migrations are the source of truth for the data model — fix with:\n' +
    '\n' +
    '    pnpm --filter @szl-holdings/db generate\n' +
    '\n' +
    'Then commit the new SQL file in lib/db/drizzle/, the updated\n' +
    '_journal.json, the new snapshot, and the refreshed _schema_hash.json.\n',
);
process.exit(1);
