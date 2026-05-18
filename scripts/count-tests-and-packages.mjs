#!/usr/bin/env node
/**
 * count-tests-and-packages.mjs
 *
 * Single source of truth for two structural counts that have a habit of
 * drifting across diligence material (thesis README + funding deck):
 *   - workspace package count   (pnpm-workspace globs, resolved on disk)
 *   - test declaration count    (`test(`, `it(`, `bench(` across *.test.* / *.spec.*)
 *
 * Modes:
 *   (default)        Print human-readable counts to stdout.
 *   --json           Print { packages, testDeclarations, testFiles, generatedAt }.
 *   --write          Rewrite AUTOGEN:test-package-counts blocks in target docs.
 *   --check          Fail (exit 1) if target docs have stale numbers.
 *
 * Target docs are listed in TARGET_DOCS below. Each must contain the marker:
 *   <!-- AUTOGEN:test-package-counts START -->
 *   ...managed content...
 *   <!-- AUTOGEN:test-package-counts END -->
 *
 * Wired into CI by .github/workflows/ci.yml as `check:test-package-counts`.
 */

import { readFileSync, writeFileSync, statSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const TARGET_DOCS = [
  'dossier/series-a-operational/SERIES_A_OPERATIONAL_THESIS.md',
  'dossier/series-a-operational/METRICS_SNAPSHOT_2026-05-18.md',
  'dossier/series-a-operational/SERIES_A_GITHUB_AUDIT_2026-05-18.md',
];

const MARKER_START = '<!-- AUTOGEN:test-package-counts START -->';
const MARKER_END = '<!-- AUTOGEN:test-package-counts END -->';

const PACKAGE_GLOB_DIRS = [
  'apps',
  'artifacts',
  'lib',
  'lib/integrations',
  'packages',
  'services',
  'workers',
];
const EXTRA_PACKAGE_PATHS = ['scripts', 'platform/temporal', 'platform/agent-gateway'];
const ARTIFACT_EXCLUDES = new Set(['imperium', 'stephen-site']);

function countPackages() {
  const seen = new Set();
  for (const dir of PACKAGE_GLOB_DIRS) {
    const abs = join(ROOT, dir);
    if (!existsSync(abs)) continue;
    for (const entry of readdirSync(abs)) {
      if (dir === 'artifacts' && ARTIFACT_EXCLUDES.has(entry)) continue;
      const child = join(abs, entry);
      try {
        if (statSync(child).isDirectory() && existsSync(join(child, 'package.json'))) {
          seen.add(child);
        }
      } catch { /* ignore */ }
    }
  }
  for (const p of EXTRA_PACKAGE_PATHS) {
    const abs = join(ROOT, p);
    if (existsSync(join(abs, 'package.json'))) seen.add(abs);
  }
  return seen.size;
}

const TEST_FILE_RE = /\.(?:test|spec)\.(?:m|c)?[jt]sx?$/;
const TEST_DECL_RE = /^\s*(?:test|it|bench)\s*(?:\.\w+)?\s*\(/gm;
const SKIP_DIRS = new Set([
  'node_modules', '.git', '.turbo', 'dist', 'build', 'coverage',
  '.next', '.cache', '.pnpm', 'out', '.vite', 'storybook-static',
]);

function walkTests(dir, out) {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (e.name.startsWith('.git')) continue;
    if (SKIP_DIRS.has(e.name)) continue;
    const full = join(dir, e.name);
    if (e.isDirectory()) walkTests(full, out);
    else if (e.isFile() && TEST_FILE_RE.test(e.name)) out.push(full);
  }
}

function countTests() {
  const files = [];
  walkTests(ROOT, files);
  let decls = 0;
  for (const f of files) {
    try {
      const src = readFileSync(f, 'utf8');
      const matches = src.match(TEST_DECL_RE);
      if (matches) decls += matches.length;
    } catch { /* ignore */ }
  }
  return { testFiles: files.length, testDeclarations: decls };
}

function compute() {
  const { testFiles, testDeclarations } = countTests();
  return {
    packages: countPackages(),
    testFiles,
    testDeclarations,
    generatedAt: new Date().toISOString().split('T')[0],
  };
}

function fmt(n) { return n.toLocaleString('en-US'); }

function renderBlock(counts) {
  return [
    MARKER_START,
    `<!-- Regenerate with: node scripts/count-tests-and-packages.mjs --write -->`,
    `**Platform monorepo:** ${fmt(counts.testDeclarations)} test declarations across ${fmt(counts.testFiles)} test files in ${fmt(counts.packages)} workspace packages. _(measured ${counts.generatedAt})_`,
    MARKER_END,
  ].join('\n');
}

function rewriteDoc(path, counts, { check }) {
  const abs = join(ROOT, path);
  if (!existsSync(abs)) {
    return { path, status: 'missing' };
  }
  const src = readFileSync(abs, 'utf8');
  const block = renderBlock(counts);
  const startIdx = src.indexOf(MARKER_START);
  const endIdx = src.indexOf(MARKER_END);
  let next;
  if (startIdx === -1 || endIdx === -1) {
    // Inject block at end of file.
    next = src.replace(/\s*$/, '') + '\n\n' + block + '\n';
  } else {
    const before = src.slice(0, startIdx);
    const after = src.slice(endIdx + MARKER_END.length);
    next = before + block + after;
  }
  if (next === src) return { path, status: 'unchanged' };
  if (check) return { path, status: 'drift' };
  writeFileSync(abs, next, 'utf8');
  return { path, status: 'written' };
}

const STALE_PATTERNS = [
  /1[,\s]?220\s+tests\s+across\s+76\s+packages/i,
  /1[,\s]?220\s+tests?,?\s+76\s+packages/i,
  /1[,\s]?220\s+tests/i,
];

function findStaleReferences() {
  const hits = [];
  for (const path of TARGET_DOCS) {
    const abs = join(ROOT, path);
    if (!existsSync(abs)) continue;
    const src = readFileSync(abs, 'utf8');
    const lines = src.split('\n');
    lines.forEach((line, i) => {
      // Skip lines inside the managed AUTOGEN block context (rendered with current numbers)
      // and skip lines that are clearly annotating drift itself.
      if (line.includes('AUTOGEN:test-package-counts')) return;
      for (const re of STALE_PATTERNS) {
        if (re.test(line) && !/measured|reality|drift|was correct|too low|claim/i.test(line)) {
          hits.push({ path, line: i + 1, text: line.trim() });
          break;
        }
      }
    });
  }
  return hits;
}

function main() {
  const args = new Set(process.argv.slice(2));
  const counts = compute();

  if (args.has('--json')) {
    process.stdout.write(JSON.stringify(counts, null, 2) + '\n');
    return;
  }

  if (args.has('--write') || args.has('--check')) {
    const results = TARGET_DOCS.map((p) =>
      rewriteDoc(p, counts, { check: args.has('--check') }),
    );
    const stale = findStaleReferences();
    for (const r of results) {
      console.log(`${r.status.padEnd(10)} ${r.path}`);
    }
    if (stale.length) {
      console.error('\nStale hard-coded counts still present:');
      for (const h of stale) console.error(`  ${h.path}:${h.line}  ${h.text}`);
    }
    const drift = results.some((r) => r.status === 'drift');
    if (args.has('--check') && (drift || stale.length)) {
      console.error(
        '\nFAIL: docs are out of sync with measured counts.\n' +
          'Run: node scripts/count-tests-and-packages.mjs --write',
      );
      process.exit(1);
    }
    return;
  }

  console.log(`packages           = ${fmt(counts.packages)}`);
  console.log(`test_files         = ${fmt(counts.testFiles)}`);
  console.log(`test_declarations  = ${fmt(counts.testDeclarations)}`);
  console.log(`generated_at       = ${counts.generatedAt}`);
}

main();
