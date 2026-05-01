#!/usr/bin/env tsx
/**
 * Route Security Baseline Gate
 * ----------------------------
 * Wrapper around route-security-matrix.ts --json that fails ONLY when:
 *   1. A new UNCLASSIFIED route file appears that is not in the baseline, OR
 *   2. A baseline entry has been removed/protected — the baseline must be
 *      shrunk to reflect that progress.
 *
 * The baseline (route-security-baseline.json) lists the existing route files
 * that lack explicit auth markers. The global-auth-enforcer middleware blocks
 * unauthenticated traffic to every /api/* path not in the public allowlist,
 * so the baseline files are not actually exposed; they only lack the
 * defence-in-depth markers tracked by the matrix script.
 *
 * To remove an entry from the baseline, add an explicit auth middleware
 * import (authMiddleware / requireRole / requireAuth / etc.) to the route
 * file, then either run this script with --update-baseline or hand-edit
 * route-security-baseline.json.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MATRIX_SCRIPT = join(__dirname, 'route-security-matrix.ts');
const BASELINE_FILE = join(__dirname, 'route-security-baseline.json');

interface MatrixRoute {
  file: string;
  status: string;
  isPublicAllowlisted: boolean;
  isGroupProtected: boolean;
}

interface BaselineFile {
  comment: string;
  lastUpdated: string;
  unclassified: string[];
}

function runMatrix(): MatrixRoute[] {
  const out = execFileSync('npx', ['tsx', MATRIX_SCRIPT, '--json'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
    maxBuffer: 32 * 1024 * 1024,
  });
  const parsed = JSON.parse(out);
  return parsed.routes as MatrixRoute[];
}

function loadBaseline(): BaselineFile {
  const raw = readFileSync(BASELINE_FILE, 'utf8');
  return JSON.parse(raw) as BaselineFile;
}

const args = process.argv.slice(2);
const updateMode = args.includes('--update-baseline');

const routes = runMatrix();
const currentUnclassified = routes
  .filter((r) => r.status === 'UNCLASSIFIED')
  .map((r) => r.file)
  .sort();

if (updateMode) {
  const baseline = loadBaseline();
  baseline.unclassified = currentUnclassified;
  baseline.lastUpdated = new Date().toISOString().slice(0, 10);
  writeFileSync(BASELINE_FILE, JSON.stringify(baseline, null, 2) + '\n');
  console.log(`[route-security-baseline] updated: ${currentUnclassified.length} unclassified routes`);
  process.exit(0);
}

const baseline = loadBaseline();
const baselineSet = new Set(baseline.unclassified);
const currentSet = new Set(currentUnclassified);

const newUnclassified = currentUnclassified.filter((f) => !baselineSet.has(f));
const removedFromBaseline = baseline.unclassified.filter((f) => !currentSet.has(f));

let exitCode = 0;

if (newUnclassified.length > 0) {
  console.error('');
  console.error('FAIL: New UNCLASSIFIED route files detected (not in baseline):');
  for (const f of newUnclassified) {
    console.error(`  + ${f}`);
  }
  console.error('');
  console.error('Add an explicit auth middleware import (authMiddleware / requireRole /');
  console.error('requireAuth / requireAnyAuth) to each new route file. See');
  console.error('artifacts/api-server/src/scripts/route-security-matrix.ts for the full');
  console.error('list of recognized indicators.');
  exitCode = 1;
}

if (removedFromBaseline.length > 0) {
  console.log('');
  console.log('INFO: Baseline entries that are now properly classified — please remove from baseline:');
  for (const f of removedFromBaseline) {
    console.log(`  - ${f}`);
  }
  console.log('');
  console.log(
    'Run `pnpm --filter @workspace/api-server exec tsx src/scripts/route-security-baseline-check.ts --update-baseline` to refresh.',
  );
  // INFO only; do not fail the build for entries that shrunk.
}

console.log('');
console.log(
  `[route-security-baseline] OK — current unclassified: ${currentUnclassified.length}, baseline: ${baseline.unclassified.length}, new since baseline: ${newUnclassified.length}`,
);

process.exit(exitCode);
