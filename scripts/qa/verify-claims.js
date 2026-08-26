#!/usr/bin/env node
/**
 * verify:claims — SZL Holdings Platform
 * Cross-references public marketing claims against the ability matrix
 * (launch/FINAL_ABILITY_SCORECARD.csv) to flag broken or unsupported claims.
 *
 * Usage:
 *   node scripts/qa/verify-claims.js
 *   node scripts/qa/verify-claims.js --strict  (exit 1 if any broken OR mock claim)
 *   node scripts/qa/verify-claims.js --json    (emit structured JSON)
 *
 * Exit semantics:
 *   0  — no broken or mock claims (in strict mode)
 *   1  — one or more claims have status: broken or mock (in --strict mode)
 *
 * Non-launchable statuses (strict mode fails on these): broken, mock
 * Warn-only statuses (logged but not CI-failing): partial, dormant
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');
const STRICT = process.argv.includes('--strict');
const JSON_MODE = process.argv.includes('--json');

const SCORECARD_PATH = join(ROOT, 'audit/launch/FINAL_ABILITY_SCORECARD.csv');

let csvLines;
try {
  csvLines = readFileSync(SCORECARD_PATH, 'utf-8').trim().split('\n');
} catch (error) {
  const detail = error instanceof Error ? error.message : String(error);
  process.stderr.write(`[verify:claims] unable to read ${SCORECARD_PATH}: ${detail}\n`);
  process.exit(1);
}

const headers = csvLines[0].split(',');
const rows = csvLines.slice(1).map((line) => {
  const cols = line.split(',');
  const row = {};
  headers.forEach((h, i) => {
    row[h.trim()] = (cols[i] || '').trim();
  });
  return row;
});

const broken = rows.filter((r) => r.current_status === 'broken');
const mocked = rows.filter((r) => r.current_status === 'mock');
const partial = rows.filter((r) => r.current_status === 'partial');
const dormant = rows.filter((r) => r.current_status === 'dormant');
const working = rows.filter((r) => r.current_status === 'working');

const summary = {
  total: rows.length,
  working: working.length,
  partial: partial.length,
  mock: mocked.length,
  dormant: dormant.length,
  broken: broken.length,
  working_pct: Math.round((working.length / rows.length) * 100),
  claims_with_blockers: rows.filter((r) => r.blocker && r.blocker !== 'null').length,
};

if (JSON_MODE) {
  process.stdout.write(
    `${JSON.stringify(
      {
        summary,
        non_launchable: [...broken, ...mocked],
        warn_only: [...partial, ...dormant],
      },
      null,
      2,
    )}\n`,
  );
} else {
  process.stdout.write(
    `[verify:claims] ${summary.working}/${summary.total} working; ` +
      `${summary.partial} partial; ${summary.dormant} dormant; ` +
      `${summary.mock} mock; ${summary.broken} broken\n`,
  );
  for (const row of [...broken, ...mocked]) {
    process.stdout.write(
      `[verify:claims] ${row.current_status}: ${row.product} / ${row.capability}` +
        `${row.blocker ? ` — ${row.blocker}` : ''}\n`,
    );
  }
}

const nonLaunchable = broken.length + mocked.length;
const shouldFail = STRICT && nonLaunchable > 0;
if (!JSON_MODE && shouldFail) {
  process.stderr.write(
    `[verify:claims] strict gate failed: ${nonLaunchable} non-launchable claim row(s)\n`,
  );
}
process.exit(shouldFail ? 1 : 0);
