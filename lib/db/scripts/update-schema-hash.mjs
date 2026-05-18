#!/usr/bin/env node
/**
 * Refresh `drizzle/meta/_schema_hash.json` (task #5057).
 *
 * Wired into `pnpm --filter @szl-holdings/db generate` so every time a
 * developer produces a new SQL migration the marker is updated in lockstep
 * with the journal tip. Safe to invoke manually as well — it is idempotent
 * and only writes when the hash or journal pointer has actually changed.
 *
 * The check-side counterpart is `scripts/check-schema-sync.mjs`. See its
 * header for the failure-mode contract.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import {
  HASH_MARKER_PATH,
  computeSchemaHash,
  readJournalTip,
} from './_schema-hash.mjs';

const { hash, fileCount } = computeSchemaHash();
const tip = readJournalTip();

const next = {
  schemaHash: hash,
  fileCount,
  journalIdx: tip.idx,
  journalTag: tip.tag,
  updatedAt: new Date().toISOString(),
};

let previous = null;
if (existsSync(HASH_MARKER_PATH)) {
  try {
    previous = JSON.parse(readFileSync(HASH_MARKER_PATH, 'utf8'));
  } catch {
    previous = null;
  }
}

if (
  previous &&
  previous.schemaHash === next.schemaHash &&
  previous.journalIdx === next.journalIdx &&
  previous.journalTag === next.journalTag
) {
  process.stdout.write(
    `[db:update-schema-hash] marker already up to date (${hash.slice(0, 12)}, journal #${tip.idx})\n`,
  );
  process.exit(0);
}

writeFileSync(HASH_MARKER_PATH, `${JSON.stringify(next, null, 2)}\n`);
process.stdout.write(
  `[db:update-schema-hash] wrote marker hash=${hash.slice(0, 12)} files=${fileCount} journal=#${tip.idx} ${tip.tag ?? 'n/a'}\n`,
);
