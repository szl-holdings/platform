#!/usr/bin/env node
/**
 * Silent-zone guard.
 *
 * Fails CI when a workspace package under packages/* or lib/* has zero test
 * files associated with it.
 *
 * A package is considered "covered" when at least one of these is true:
 *   1. It has a test file inside its own directory tree
 *      (*.test.ts / *.test.tsx / *.spec.ts / *.spec.tsx).
 *   2. There is a baseline smoke test for it at
 *      `tests/silent-zone/<slug>.smoke.test.ts(x)` or a deeper test at
 *      `tests/silent-zone/<slug>.test.ts(x)`, where <slug> derives from the
 *      package name (`@scope/name` → `scope__name`).
 *
 * Usage:
 *   node scripts/check-zero-test-packages.mjs            # human report
 *   node scripts/check-zero-test-packages.mjs --json     # machine output
 *
 * Exits non-zero with a list of offending packages when the guard fails.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SILENT_ZONE_DIR = join(ROOT, 'tests', 'silent-zone');

function walk(dir, depth = 0) {
  const out = [];
  if (depth > 4) return out;
  let entries;
  try { entries = readdirSync(dir); } catch { return out; }
  for (const e of entries) {
    if (e === 'node_modules' || e === 'dist' || e === '.next' || e === 'coverage') continue;
    const p = join(dir, e);
    let s;
    try { s = statSync(p); } catch { continue; }
    if (s.isDirectory()) out.push(...walk(p, depth + 1));
    else out.push(p);
  }
  return out;
}

function countTestsIn(dir) {
  return walk(dir).filter((f) =>
    /\.(test|spec)\.(ts|tsx|js|jsx|mjs)$/.test(f) &&
    !f.includes('/dist/') &&
    !f.includes('/node_modules/')
  ).length;
}

function countSrcIn(dir) {
  const src = join(dir, 'src');
  if (!existsSync(src)) return 0;
  return walk(src).filter((f) =>
    /\.(ts|tsx)$/.test(f) &&
    !/\.(test|spec)\.(ts|tsx)$/.test(f)
  ).length;
}

function slug(name) {
  return name.replace(/^@/, '').replace(/[/]/g, '__').replace(/[^a-z0-9_-]/gi, '-');
}

function listPackages() {
  const out = [];
  for (const base of ['packages', 'lib']) {
    const baseDir = join(ROOT, base);
    if (!existsSync(baseDir)) continue;
    for (const entry of readdirSync(baseDir)) {
      const dir = join(baseDir, entry);
      const pkgPath = join(dir, 'package.json');
      if (!existsSync(pkgPath)) continue;
      let pkg;
      try { pkg = JSON.parse(readFileSync(pkgPath, 'utf8')); } catch { continue; }
      out.push({ dir, name: pkg.name || `${base}/${entry}`, rel: relative(ROOT, dir) });
    }
  }
  return out;
}

function hasCentralizedTest(name) {
  if (!existsSync(SILENT_ZONE_DIR)) return false;
  const s = slug(name);
  for (const ext of ['ts', 'tsx']) {
    if (existsSync(join(SILENT_ZONE_DIR, `${s}.smoke.test.${ext}`))) return true;
    if (existsSync(join(SILENT_ZONE_DIR, `${s}.test.${ext}`))) return true;
  }
  return false;
}

const args = new Set(process.argv.slice(2));
const asJson = args.has('--json');

const packages = listPackages();
const offenders = [];
const covered = [];
for (const p of packages) {
  const srcCount = countSrcIn(p.dir);
  if (srcCount === 0) continue; // empty / not yet implemented — skip
  const internalTests = countTestsIn(p.dir);
  const central = hasCentralizedTest(p.name);
  if (internalTests === 0 && !central) {
    offenders.push({ name: p.name, dir: p.rel, srcCount });
  } else {
    covered.push({ name: p.name, dir: p.rel, internalTests, central });
  }
}

if (asJson) {
  process.stdout.write(
    JSON.stringify(
      {
        ok: offenders.length === 0,
        totalPackages: packages.length,
        coveredPackages: covered.length,
        offendingPackages: offenders.length,
        offenders,
      },
      null,
      2,
    ),
  );
  process.stdout.write('\n');
} else {
  console.log(`silent-zone guard — ${covered.length}/${packages.length} packages covered`);
  if (offenders.length === 0) {
    console.log('  ✓ every workspace package has at least one test.');
  } else {
    console.error(`\n✗ ${offenders.length} package(s) have zero tests:`);
    for (const o of offenders) {
      console.error(`  - ${o.name}  (${o.dir}, ${o.srcCount} source files)`);
    }
    console.error(
      '\nAdd a test inside the package, or create a baseline smoke test at\n' +
        `  tests/silent-zone/<scope__name>.smoke.test.ts\n` +
        'Run `node scripts/gen-silent-zone-smoke-tests.mjs` to regenerate baseline stubs.',
    );
  }
}

process.exit(offenders.length === 0 ? 0 : 1);
