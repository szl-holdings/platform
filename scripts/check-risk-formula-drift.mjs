#!/usr/bin/env node
/**
 * Shared-formula drift guardrail (task #4983, extended in #5032).
 *
 * The canonical formulas live in `lib/formulas/src/` (see
 * docs/thesis/v10-canonical.md). Every consumer (Sentra, Counsel, Terra,
 * ...) must import them from `@szl-holdings/formulas` rather than
 * re-implementing the math locally.
 *
 * This script fails CI if it finds any of the following drift patterns
 * in a source file outside `lib/formulas/`:
 *
 *   1. risk-score     — `severity * likelihood` (either order, any case)
 *                       canonical: `riskScore` in `lib/formulas/src/risk.ts`
 *   2. autonomy-gate  — the literal `'multi-party'` (autonomy decision tag,
 *                       only emitted by the canonical gate)
 *                       canonical: `autonomyGate` in `lib/formulas/src/governance.ts`
 *   3. drift-score    — `Math.log(<ident>/<ident>)` (KL / JSD style accumulator)
 *                       canonical: `driftScore` in `lib/formulas/src/risk.ts`
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

const SOURCE_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);

/**
 * @typedef {Object} Rule
 * @property {string} id          — short identifier shown in CI output
 * @property {RegExp} pattern     — regex evaluated per line
 * @property {string} canonical   — where the canonical impl lives
 * @property {string} symbol      — import name consumers should use
 * @property {string[]} allowed   — path prefixes (relative to repo root) that
 *                                  may mention the pattern legitimately
 */

/** @type {Rule[]} */
const RULES = [
  {
    id: 'risk-score',
    // Match `severity * likelihood` or `likelihood * severity` as identifiers
    // (word boundaries required, so `someSeverity * likelihoodOf` won't match).
    pattern: /\b(severity\s*\*\s*likelihood|likelihood\s*\*\s*severity)\b/i,
    canonical: 'lib/formulas/src/risk.ts',
    symbol: 'riskScore',
    allowed: [],
  },
  {
    id: 'autonomy-gate',
    // The 'multi-party' decision string is only emitted by autonomyGate; any
    // other file mentioning it is almost certainly re-implementing the gate
    // (the input-side numeric thresholds 0.2/0.6 are too generic to scan on).
    pattern: /(['"`])multi-party\1/,
    canonical: 'lib/formulas/src/governance.ts',
    symbol: 'autonomyGate',
    allowed: [],
  },
  {
    id: 'drift-score',
    // KL / JSD accumulator pattern: `Math.log(<ident> / <ident>)`. Catches
    // both bare KL (`pi * Math.log(pi / qi)`) and Jensen-Shannon variants.
    // Plain `Math.log(x)` or `Math.log(x * y)` is unaffected.
    pattern: /Math\.log\(\s*[A-Za-z_$][\w$]*\s*\/\s*[A-Za-z_$][\w$]*\s*\)/,
    canonical: 'lib/formulas/src/risk.ts',
    symbol: 'driftScore',
    allowed: [
      // Pre-existing Jensen-Shannon variant (not the canonical KL — kept as
      // its own implementation by design; tracked separately for migration).
      `packages${sep}cognitive-runtime${sep}src${sep}drift-detector.ts`,
      // Pre-existing batch KL with different normalisation (divides by n
      // rather than re-normalising distributions); migration to canonical
      // `driftScore` is out of scope for the guardrail itself.
      `packages${sep}anomaly-fabric${sep}src${sep}batch.ts`,
    ],
  },
];

// Files that are always allowed to mention any pattern — the canonical
// source of truth, this script, and its test.
const GLOBAL_ALLOWED_PREFIXES = [
  `lib${sep}formulas${sep}`,
  `scripts${sep}check-risk-formula-drift.mjs`,
  `scripts${sep}check-risk-formula-drift.test`,
];

function isGloballyAllowed(rel) {
  return GLOBAL_ALLOWED_PREFIXES.some((p) => rel === p || rel.startsWith(p));
}

function isAllowedForRule(rel, rule) {
  return rule.allowed.some((p) => rel === p || rel.startsWith(p));
}

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

const violationsByRule = new Map(RULES.map((r) => [r.id, []]));

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
    if (isGloballyAllowed(rel)) continue;
    let content;
    try {
      content = readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    const lines = content.split('\n');
    for (const rule of RULES) {
      if (isAllowedForRule(rel, rule)) continue;
      for (let i = 0; i < lines.length; i++) {
        const m = lines[i].match(rule.pattern);
        if (m) {
          violationsByRule.get(rule.id).push({
            file: rel,
            line: i + 1,
            match: m[0],
            text: lines[i].trim(),
          });
        }
      }
    }
  }
}

let total = 0;
for (const v of violationsByRule.values()) total += v.length;

if (total > 0) {
  console.error(`\nFound ${total} shared-formula drift violation(s).\n`);
  for (const rule of RULES) {
    const vs = violationsByRule.get(rule.id);
    if (vs.length === 0) continue;
    console.error(
      `[${rule.id}] ${vs.length} violation(s). ` +
        `Canonical: ${rule.canonical} — ` +
        `import { ${rule.symbol} } from '@szl-holdings/formulas' ` +
        `instead of re-implementing locally.`,
    );
    for (const v of vs) {
      console.error(`  ${v.file}:${v.line}  [${v.match}]  ${v.text}`);
    }
    console.error('');
  }
  process.exit(1);
}

console.log('check-risk-formula-drift: clean (0 violations)');
