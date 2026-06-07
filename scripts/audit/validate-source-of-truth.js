#!/usr/bin/env node
/**
 * scripts/audit/validate-source-of-truth.js
 *
 * Phase 1: Validates that the key counts in audit/source-of-truth.json match
 * the current filesystem state.
 *
 * Phase 2: Validates that the quick-reference table in audit/README.md is
 * consistent with audit/source-of-truth.json (cross-document consistency).
 *
 * Run from workspace root:
 *   node scripts/audit/validate-source-of-truth.js
 *
 * Exit codes:
 *   0 — all checks passed
 *   1 — one or more checks failed (details printed to stdout)
 */

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..');

function run(cmd) {
  try {
    return parseInt(execSync(cmd, { cwd: ROOT, encoding: 'utf8' }).trim(), 10);
  } catch {
    return -1;
  }
}

const truth = JSON.parse(
  readFileSync(resolve(ROOT, 'audit', 'source-of-truth.json'), 'utf8')
);

// ─── Phase 1: Filesystem counts vs source-of-truth.json ──────────────────────

const fsChecks = [
  {
    name: 'Registered artifacts (artifact.toml)',
    expected: truth.artifacts.registered.count,
    actual: run("find artifacts -name artifact.toml | wc -l"),
  },
  {
    name: 'Total artifact directories',
    expected: truth.artifacts.total_on_disk.count,
    actual: run("ls artifacts/ | wc -l"),
  },
  {
    name: 'Domain packages (packages/)',
    expected: truth.packages.domain_packages_dir.count,
    actual: run("ls packages/ | wc -l"),
  },
  {
    name: 'Shared library packages (lib/)',
    expected: truth.packages.shared_lib_packages.count,
    actual: run("ls lib/ | wc -l"),
  },
  {
    name: 'Apps (apps/)',
    expected: truth.packages.apps.count,
    actual: run("ls apps/ | wc -l"),
  },
  {
    name: 'Services (services/)',
    expected: truth.packages.services.count,
    actual: run("ls services/ | wc -l"),
  },
  {
    name: 'Workers (workers/)',
    expected: truth.packages.workers.count,
    actual: run("ls workers/ | wc -l"),
  },
  {
    name: 'DB schema files (lib/db/src/schema)',
    expected: truth.database.schema_files.count,
    actual: run("find lib/db/src/schema -name '*.ts' | wc -l"),
  },
  {
    name: 'DB migration files (lib/db/drizzle/)',
    expected: truth.database.migration_files.count,
    actual: run("ls lib/db/drizzle/ | grep -v '^meta$' | wc -l"),
  },
  {
    name: 'API route files',
    expected: truth.api.route_files.count,
    actual: run("find artifacts/api-server/src/routes -name '*.ts' ! -name '*.test.ts' ! -name '*.spec.ts' | wc -l"),
  },
  {
    name: 'API route groups (top-level, excl. __tests__)',
    expected: truth.api.route_groups_top_level.count,
    actual: run("find artifacts/api-server/src/routes -mindepth 1 -maxdepth 1 -type d | grep -v '__tests__' | wc -l"),
  },
  {
    name: 'CI workflows (.github/workflows/)',
    expected: truth.ci.workflows.count,
    actual: run("ls .github/workflows/ | wc -l"),
  },
  {
    name: 'Environment variables (.env.example)',
    expected: truth.env.declared_vars.count,
    actual: run("grep -cE '^[A-Z_]+=' .env.example"),
  },
];

// ─── Phase 2: Cross-document consistency (audit/README.md vs source-of-truth) ─

/**
 * Parse the quick-reference table in audit/README.md and extract numeric values.
 * Returns a Map of metric-label → number.
 */
function parseReadmeQuickRef() {
  const readmePath = resolve(ROOT, 'audit', 'README.md');
  const text = readFileSync(readmePath, 'utf8');
  const map = new Map();
  const tableRowRe = /^\|([^|]+)\|([^|]+)\|([^|]+)\|/;
  let inTable = false;
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (line.includes('Verified Count')) { inTable = true; continue; }
    if (inTable && line.startsWith('|---')) continue;
    if (inTable && !line.startsWith('|')) { inTable = false; continue; }
    if (!inTable) continue;
    const m = tableRowRe.exec(line);
    if (!m) continue;
    const label = m[1].trim();
    const rawVal = m[2].trim();
    const numMatch = /^(\d+)/.exec(rawVal);
    if (numMatch) map.set(label, parseInt(numMatch[1], 10));
  }
  return map;
}

const readmeCounts = parseReadmeQuickRef();

// Map README labels → source-of-truth values
const crossChecks = [
  {
    name: 'README ↔ JSON: Registered artifacts',
    readmeKey: 'Registered artifacts (with artifact.toml)',
    expected: truth.artifacts.registered.count,
  },
  {
    name: 'README ↔ JSON: Total artifact directories',
    readmeKey: 'Total artifact directories on disk',
    expected: truth.artifacts.total_on_disk.count,
  },
  {
    name: 'README ↔ JSON: Domain packages',
    readmeKey: 'Domain packages (`packages/`)',
    expected: truth.packages.domain_packages_dir.count,
  },
  {
    name: 'README ↔ JSON: Shared library packages',
    readmeKey: 'Shared library packages (`lib/`)',
    expected: truth.packages.shared_lib_packages.count,
  },
  {
    name: 'README ↔ JSON: Apps',
    readmeKey: 'Apps (`apps/`)',
    expected: truth.packages.apps.count,
  },
  {
    name: 'README ↔ JSON: Services',
    readmeKey: 'Services (`services/`)',
    expected: truth.packages.services.count,
  },
  {
    name: 'README ↔ JSON: Workers',
    readmeKey: 'Workers (`workers/`)',
    expected: truth.packages.workers.count,
  },
  {
    name: 'README ↔ JSON: DB schema files',
    readmeKey: 'DB schema files',
    expected: truth.database.schema_files.count,
  },
  {
    name: 'README ↔ JSON: DB tables (raw grep)',
    readmeKey: 'DB tables (raw grep, pgTable declarations)',
    expected: truth.database.table_definitions_raw_grep.count,
  },
  {
    name: 'README ↔ JSON: DB migrations',
    readmeKey: 'DB migrations (SQL files)',
    expected: truth.database.migration_files.count,
  },
  {
    name: 'README ↔ JSON: API route files',
    readmeKey: 'API route files',
    expected: truth.api.route_files.count,
  },
  {
    name: 'README ↔ JSON: API route groups',
    readmeKey: 'API route groups (top-level, excl. __tests__)',
    expected: truth.api.route_groups_top_level.count,
  },
  {
    name: 'README ↔ JSON: CI workflows',
    readmeKey: 'CI workflows',
    expected: truth.ci.workflows.count,
  },
  {
    name: 'README ↔ JSON: Environment variables',
    readmeKey: 'Environment variables (in .env.example)',
    expected: truth.env.declared_vars.count,
  },
].map(c => ({
  ...c,
  actual: readmeCounts.has(c.readmeKey) ? readmeCounts.get(c.readmeKey) : -1,
}));

// ─── Output ───────────────────────────────────────────────────────────────────

let failures = 0;

function printChecks(title, checks) {
  console.log(`\n── ${title} ──`);
  for (const { name, expected, actual } of checks) {
    const ok = expected === actual;
    if (!ok) failures++;
    const status = ok ? '✓ PASS' : '✗ FAIL';
    const detail = ok ? `${actual}` : `expected=${expected} actual=${actual}`;
    console.log(`  ${status}  ${name}: ${detail}`);
  }
}

console.log(`Source-of-truth validation — ${new Date().toISOString()}`);
console.log(`SOT version: ${truth.meta.version}  generated: ${truth.meta.generated}`);

printChecks('Phase 1: Filesystem vs source-of-truth.json', fsChecks);
printChecks('Phase 2: audit/README.md vs source-of-truth.json', crossChecks);

console.log(`\n── Result ──`);
if (failures > 0) {
  console.log(`  ✗ FAILED — ${failures} check(s) failed`);
  process.exit(1);
} else {
  console.log(`  ✓ ALL PASS — ${fsChecks.length + crossChecks.length} checks passed`);
  process.exit(0);
}
