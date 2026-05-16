#!/usr/bin/env node
/**
 * Forbidden-pattern guardrail (task #4940).
 *
 * Scans artifacts/*\/src and docs/ for the doctrine's forbidden patterns
 * (Jr., AlloyScape, Glass Wing, Glasswing, Mythos, Stephen Paul,
 *  Perplexity Computer, anonymous).
 *
 * Pulls the live pattern list from @szl-holdings/payload so the script can
 * never drift from THESIS_LINEAGE.forbiddenPatterns.
 *
 * Exit codes: 0 = clean, 1 = at least one violation.
 *
 * Author: Stephen P. Lutar — SZL Holdings — ORCID 0009-0001-0110-4173
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const ROOT = resolve(__filename, '..', '..');

// Load forbidden patterns from the canonical raw payload (NOT from the typed
// package — this script must run before pnpm install in CI bootstrap).
const thesisRaw = JSON.parse(
  readFileSync(join(ROOT, 'packages/payload/raw/dev1_thesis/thesis_payload.json'), 'utf8'),
);
const PATTERNS = thesisRaw.doctrine.forbidden_patterns;

// Self-references in *this* file (and the briefing/scan reports) name the
// patterns in order to define them. We allowlist by file path.
const SELF_REFERENCE_ALLOWLIST = new Set([
  'scripts/check-forbidden-patterns.mjs',
  'packages/payload/raw/dev1_thesis/thesis_payload.json',
  'packages/payload/raw/payload.json',
  'docs/audit/agent-briefing.md',
  'docs/audit/github-deep-scan.md',
  'docs/audit/github-deep-scan.json',
]);

// Pre-existing legacy violations in docs/ from prior commits. New violations
// fail; baselined ones do not. Update the baseline by re-running with
// `--update-baseline`. Matches the same approach as
// scripts/banned-brand-strings.baseline.json.
const BASELINE_PATH = join(ROOT, 'scripts/check-forbidden-patterns.baseline.json');
let baselineSet = new Set();
try {
  const baselineRaw = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
  baselineSet = new Set(baselineRaw.map((b) => `${b.file}::${b.pattern}`));
} catch {
  // No baseline yet — every violation will be reported.
}
const updateBaseline = process.argv.includes('--update-baseline');

// Scopes the guard fires on. The strict zones (`STRICT_FILES`) must always be
// zero. The soft zones (legacy docs, A11oy product-internal terminology) are
// baselined; new hits there fail CI but already-grandfathered hits don't.
//
// Why split? Some forbidden patterns ("Mythos", "Glasswing") are also legitimate
// internal product names that predate this guard inside `artifacts/a11oy/src/`.
// We can't rename A11oy's product features in a thesis-lineage task, so we
// require new code to be clean (via STRICT_FILES) while letting the baseline
// capture grandfathered hits in soft zones.
const SCAN_ROOTS = [
  'artifacts',
  'docs',
  'packages/payload/proofs',
  'scripts',
];

// Globs (prefix-matched) that MUST be zero — no baseline masking allowed.
// Edits to these files in this task must be free of every forbidden pattern.
const STRICT_PREFIXES = [
  'packages/payload/proofs/lean_th8/',
  'docs/audit/github-deep-scan.',
  'docs/audit/agent-briefing.',
  // Every thesis surface file across the 7 shipped artifacts (canonical chrome):
  'artifacts/conduit/src/pages/thesis.tsx',
  'artifacts/sentra/src/pages/thesis.tsx',
  'artifacts/a11oy/src/pages/Thesis.tsx',
];
// Strict regex matchers: full chrome (GovernancePanels.tsx) across all 7 shipped
// artifacts must be zero-hit regardless of which artifact dir.
const STRICT_REGEXES = [
  /^artifacts\/(conduit|a11oy|sentra|terra|vessels|counsel|carlota-jo)\/src\/components\/GovernancePanels\.tsx$/,
];
function isStrict(rel) {
  if (STRICT_PREFIXES.some((p) => rel === p || rel.startsWith(p))) return true;
  return STRICT_REGEXES.some((r) => r.test(rel));
}

const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  '.next',
  'build',
  '.turbo',
  '.git',
  'coverage',
  'raw', // raw payload is canonical and byte-locked; allow self-defs there
]);

const TEXT_EXTS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.md', '.mdx',
  '.json', '.yaml', '.yml',
  '.lean',
  '.html', '.css',
]);

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    let st;
    try { st = statSync(full); } catch { continue; }
    if (st.isDirectory()) {
      yield* walk(full);
    } else if (st.isFile()) {
      const ext = full.slice(full.lastIndexOf('.'));
      if (TEXT_EXTS.has(ext)) yield full;
    }
  }
}

const violations = [];

for (const root of SCAN_ROOTS) {
  const full = join(ROOT, root);
  try { statSync(full); } catch { continue; }
  for (const file of walk(full)) {
    const rel = relative(ROOT, file);
    if (SELF_REFERENCE_ALLOWLIST.has(rel)) continue;
    const text = readFileSync(file, 'utf8');
    for (const pattern of PATTERNS) {
      // Word-ish boundary so "anonymous" doesn't catch "anonymousFunction"
      // when the pattern is a single bare lowercase word; for multi-word
      // patterns we use case-insensitive substring.
      const idx = text.toLowerCase().indexOf(pattern.toLowerCase());
      if (idx === -1) continue;
      // Skip standard JS idioms for the bare "anonymous" token.
      if (pattern.toLowerCase() === 'anonymous') {
        // Surrounding char check: must not be preceded/followed by a word char
        const before = idx === 0 ? ' ' : text[idx - 1];
        const after = text[idx + pattern.length] ?? ' ';
        if (/\w/.test(before) || /\w/.test(after)) continue;
      }
      // Line number
      const upTo = text.slice(0, idx);
      const line = upTo.split('\n').length;
      violations.push({ file: rel, line, pattern });
    }
  }
}

if (updateBaseline) {
  const { writeFileSync } = await import('node:fs');
  const dedup = Array.from(
    new Map(violations.map((v) => [`${v.file}::${v.pattern}`, { file: v.file, pattern: v.pattern }])).values(),
  ).sort((a, b) => a.file.localeCompare(b.file) || a.pattern.localeCompare(b.pattern));
  writeFileSync(BASELINE_PATH, JSON.stringify(dedup, null, 2) + '\n');
  console.log(`✓ baseline updated — ${dedup.length} legacy (file, pattern) pairs recorded at ${relative(ROOT, BASELINE_PATH)}`);
  process.exit(0);
}

// Strict-zone violations NEVER get baselined.
const strictViolations = violations.filter((v) => isStrict(v.file));
const softViolations = violations.filter((v) => !isStrict(v.file));
const newSoftViolations = softViolations.filter(
  (v) => !baselineSet.has(`${v.file}::${v.pattern}`),
);

if (strictViolations.length === 0 && newSoftViolations.length === 0) {
  console.log(
    `✓ forbidden-pattern guard PASS — 0 strict, 0 new soft (${softViolations.length} soft baselined)`,
  );
  console.log(`  patterns checked: ${PATTERNS.map((p) => JSON.stringify(p)).join(', ')}`);
  process.exit(0);
}

if (strictViolations.length > 0) {
  console.error(`✗ STRICT-zone violations — ${strictViolations.length} (NEVER baselined):`);
  for (const v of strictViolations) {
    console.error(`  ${v.file}:${v.line}  pattern=${JSON.stringify(v.pattern)}`);
  }
}
if (newSoftViolations.length > 0) {
  console.error(`✗ new soft-zone violations — ${newSoftViolations.length} (baseline: ${baselineSet.size}):`);
  for (const v of newSoftViolations) {
    console.error(`  ${v.file}:${v.line}  pattern=${JSON.stringify(v.pattern)}`);
  }
  console.error(`\nIf these are intentional/legacy, re-run with --update-baseline.`);
}
process.exit(1);
