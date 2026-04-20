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

import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');
const STRICT = process.argv.includes('--strict');
const JSON_MODE = process.argv.includes('--json');

const SCORECARD_PATH = join(ROOT, 'launch/FINAL_ABILITY_SCORECARD.csv');

let csvLines;
try {
  csvLines = readFileSync(SCORECARD_PATH, 'utf-8').trim().split('\n');
} catch (e) {
  console.error(`[verify:claims] Could not read ${SCORECARD_PATH}: ${e.message}`);
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
  console.log(JSON.stringify({ summary, broken, mock: mocked, partial, dormant }, null, 2));
} else {
  console.log('\n══════════════════════════════════════════════════════');
  console.log('  SZL Holdings — Claims Verification');
  console.log('══════════════════════════════════════════════════════\n');

  if (broken.length > 0) {
    console.log(`── BROKEN (${broken.length}) — visible but non-functional ──────────`);
    for (const r of broken) {
      console.log(`  ❌  [${r.product}] ${r.capability}`);
      if (r.blocker) console.log(`       Blocker: ${r.blocker}`);
      if (r.recommended_action) console.log(`       Fix: ${r.recommended_action}`);
    }
    console.log();
  }

  if (mocked.length > 0) {
    console.log(`── MOCK/DEMO (${mocked.length}) — data or source is simulated ─────`);
    for (const r of mocked) {
      console.log(`  ⚠️   [${r.product}] ${r.capability}`);
      if (r.blocker) console.log(`       Blocker: ${r.blocker}`);
    }
    console.log();
  }

  if (partial.length > 0) {
    console.log(`── PARTIAL (${partial.length}) — capability exists but incomplete ─`);
    for (const r of partial) {
      console.log(`  🟡  [${r.product}] ${r.capability}`);
      if (r.blocker) console.log(`       Blocker: ${r.blocker}`);
    }
    console.log();
  }

  console.log('── WORKING ────────────────────────────────────────────');
  for (const r of working) {
    console.log(`  ✅  [${r.product}] ${r.capability}`);
  }

  console.log('\n══════════════════════════════════════════════════════');
  console.log(`  Total capabilities: ${summary.total}`);
  console.log(`  Working: ${summary.working} (${summary.working_pct}%)`);
  console.log(`  Partial: ${summary.partial}`);
  console.log(`  Mock/Demo: ${summary.mock}`);
  console.log(`  Dormant: ${summary.dormant}`);
  console.log(`  Broken: ${summary.broken}`);
  console.log(`  With blocker notes: ${summary.claims_with_blockers}`);
  console.log('══════════════════════════════════════════════════════\n');
}

const nonLaunchable = broken.length + mocked.length;
const shouldFail = STRICT && nonLaunchable > 0;
if (!JSON_MODE) {
  if (nonLaunchable > 0) {
    const detail = [
      broken.length > 0 ? `${broken.length} broken` : null,
      mocked.length > 0 ? `${mocked.length} mock/demo` : null,
    ]
      .filter(Boolean)
      .join(', ');
    console.log(
      `⚠️  ${nonLaunchable} non-launchable claim(s) found (${detail}). ${STRICT ? 'Exiting 1 (--strict mode).' : 'Run with --strict to fail CI.'}`,
    );
  } else {
    console.log('✅ No broken or mock claims found — GO gate is clear.');
  }
}
process.exit(shouldFail ? 1 : 0);
