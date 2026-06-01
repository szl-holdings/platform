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

const SCORECARD_PATH = join(ROOT, 'launch/FINAL_ABILITY_SCORECARD.csv');

let csvLines;
try {
  csvLines = readFileSync(SCORECARD_PATH, 'utf-8').trim().split('\n');
} catch (_e) {
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

const _summary = {
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
} else {

  if (broken.length > 0) {
    for (const r of broken) {
      if (r.blocker) {}
      if (r.recommended_action) {}
    }
  }

  if (mocked.length > 0) {
    for (const r of mocked) {
      if (r.blocker) {}
    }
  }

  if (partial.length > 0) {
    for (const r of partial) {
      if (r.blocker) {}
    }
  }
  for (const _r of working) {
  }
}

const nonLaunchable = broken.length + mocked.length;
const shouldFail = STRICT && nonLaunchable > 0;
if (!JSON_MODE) {
  if (nonLaunchable > 0) {
    const _detail = [
      broken.length > 0 ? `${broken.length} broken` : null,
      mocked.length > 0 ? `${mocked.length} mock/demo` : null,
    ]
      .filter(Boolean)
      .join(', ');
  } else {
  }
}
process.exit(shouldFail ? 1 : 0);
