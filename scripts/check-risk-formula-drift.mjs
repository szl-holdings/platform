#!/usr/bin/env node
/**
 * Risk-formula drift guardrail (task #4983).
 *
 * The canonical risk score lives in `lib/formulas/src/risk.ts` (see
 * docs/thesis/v10-canonical.md §5.2). Every consumer (Sentra, Counsel,
 * Terra, ...) must import `riskScore` from `@szl-holdings/formulas` rather
 * than re-implementing `severity * likelihood` locally.
 *
 * This script fails CI if it finds the canonical-formula pattern
 * (`severity * likelihood` or `likelihood * severity`, in either order
 * and with arbitrary whitespace) in any source file outside `lib/formulas/`.
 *
 * Exit codes: 0 = clean, 1 = at least one violation.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const ROOT = resolve(__filename, '..', '..');

const SCAN_ROOTS = ['artifacts', 'lib', 'packages', 'scripts', 'apps', 'src'];

const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  '.next',
  'build',
  '.turbo',
  '.git',
  'coverage',
  '.cache',
  '.vite',
  'out',
]);

const SOURCE_EXTS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
]);

// Files allowed to define / mention the canonical formula directly.
// `lib/formulas/` is the single source of truth; this script and its test
// have to name the pattern in order to look for it.
const ALLOWED_PREFIXES = [
  `lib${sep}formulas${sep}`,
  `scripts${sep}check-risk-formula-drift.mjs`,
  `scripts${sep}check-risk-formula-drift.test`,
];

function isAllowed(rel) {
  return ALLOWED_PREFIXES.some((p) => rel === p || rel.startsWith(p));
}

// Match `severity * likelihood` or `likelihood * severity` with arbitrary
// whitespace, as identifiers (so `someSeverity * likelihoodOf` does NOT match
// — word boundaries are required).
const FORMULA_RE = /\b(severity\s*\*\s*likelihood|likelihood\s*\*\s*severity)\b/i;

function* walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      yield* walk(full);
    } else if (st.isFile()) {
      const dot = name.lastIndexOf('.');
      const ext = dot >= 0 ? name.slice(dot) : '';
      if (SOURCE_EXTS.has(ext)) yield full;
    }
  }
}

const violations = [];
for (const root of SCAN_ROOTS) {
  const abs = join(ROOT, root);
  let exists = true;
  try {
    statSync(abs);
  } catch {
    exists = false;
  }
  if (!exists) continue;
  for (const file of walk(abs)) {
    const rel = relative(ROOT, file);
    if (isAllowed(rel)) continue;
    let content;
    try {
      content = readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(FORMULA_RE);
      if (m) violations.push({ file: rel, line: i + 1, match: m[0], text: lines[i].trim() });
    }
  }
}

if (violations.length > 0) {
  console.error(
    `\nFound ${violations.length} risk-formula drift violation(s).\n` +
      `The canonical risk score lives in lib/formulas/src/risk.ts.\n` +
      `Import { riskScore } from '@szl-holdings/formulas' instead of\n` +
      `re-implementing severity * likelihood locally.\n`,
  );
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  [${v.match}]  ${v.text}`);
  }
  process.exit(1);
}

console.log('check-risk-formula-drift: clean (0 violations)');
