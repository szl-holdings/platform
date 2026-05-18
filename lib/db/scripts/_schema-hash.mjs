/**
 * Shared schema-hash helper.
 *
 * Computes a deterministic SHA-256 over every TypeScript schema file in
 * `lib/db/src/schema/**`. The hash is used by:
 *   - `scripts/non-interactive-migrate.mjs` (runtime short-circuit against
 *     `_szl_schema_marker` in the dev DB)
 *   - `scripts/check-schema-sync.mjs` (author-time guardrail — task #5057)
 *   - `scripts/update-schema-hash.mjs` (post-`drizzle-kit generate` hook)
 *
 * The algorithm here MUST stay byte-for-byte identical to the one in
 * `non-interactive-migrate.mjs` so the marker file in
 * `lib/db/drizzle/meta/_schema_hash.json` and the live-DB marker row stay
 * comparable. If you change one, change both.
 */

import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DB_DIR = path.resolve(__dirname, '..');
export const SCHEMA_DIR = path.resolve(DB_DIR, 'src/schema');
export const JOURNAL_PATH = path.resolve(
  DB_DIR,
  'drizzle/meta/_journal.json',
);
export const HASH_MARKER_PATH = path.resolve(
  DB_DIR,
  'drizzle/meta/_schema_hash.json',
);

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

export function computeSchemaHash() {
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

export function readJournalTip() {
  const raw = JSON.parse(readFileSync(JOURNAL_PATH, 'utf8'));
  const entries = Array.isArray(raw.entries) ? raw.entries : [];
  if (entries.length === 0) {
    return { idx: -1, tag: null, when: 0 };
  }
  const last = entries.reduce((acc, e) =>
    typeof e.idx === 'number' && e.idx > acc.idx ? e : acc,
  entries[0]);
  return { idx: last.idx, tag: last.tag, when: last.when };
}
