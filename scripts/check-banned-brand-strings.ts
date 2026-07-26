#!/usr/bin/env tsx
/**
 * Banned Brand-String Validation
 *
 * Scans .ts and .tsx source files for trademark-conflicting brand names that
 * were renamed during the originality audit (see ORIGINALITY_REPORT.md).
 *
 * Configuration is loaded from `scripts/banned-brand-strings.json`. New banned
 * strings, file allowlist entries, and per-line exemptions can be added there
 * without modifying this script.
 *
 * Detection rules:
 *   - Match the banned term with word boundaries.
 *   - Skip lines that are clearly imports, file paths, or URL slugs (the audit
 *     intentionally preserved old slugs for stable inbound links).
 *   - Skip lines / files listed in the allowlist.
 *
 * Exit codes:
 *   0  — no banned strings found
 *   1  — banned strings found (all violations are printed with file:line:col)
 *
 * Usage:
 *   pnpm brand:strings
 *   tsx scripts/check-banned-brand-strings.ts --verbose
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { normalizePortablePath, portableRelativePath } from './brand-paths.ts';

const ROOT = resolve(import.meta.dirname ?? process.cwd(), '..');
const VERBOSE = process.argv.includes('--verbose');
const UPDATE_BASELINE = process.argv.includes('--update-baseline');
const changedFromIndex = process.argv.indexOf('--changed-from');
const CHANGED_FROM = changedFromIndex >= 0 ? process.argv[changedFromIndex + 1]?.trim() : undefined;

if (changedFromIndex >= 0 && !CHANGED_FROM) {
  throw new Error('--changed-from requires a Git revision');
}

interface BannedString {
  term: string;
  replacement: string;
  reason: string;
  caseSensitive?: boolean;
}

interface LineAllow {
  file: string;
  line: number;
  term: string;
  reason: string;
}

interface Config {
  bannedStrings: BannedString[];
  fileAllowlist: string[];
  lineAllowlist: LineAllow[];
}

const CONFIG_PATH = join(ROOT, 'scripts/banned-brand-strings.json');
const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf8')) as Config;

const SCAN_EXTENSIONS = new Set(['.ts', '.tsx']);
// Source roots derived from pnpm-workspace.yaml (apps, artifacts, lib,
// lib/integrations, packages, services, workers) plus tests and scripts.
// `scripts/` is intentionally included so tooling source is also covered;
// the script itself + the JSON config are exempted via fileAllowlist.
const SCAN_ROOTS = [
  'apps',
  'artifacts',
  'lib',
  'packages',
  'services',
  'workers',
  'tests',
  'scripts',
];
function isFileAllowlisted(rel: string): boolean {
  for (const entry of config.fileAllowlist) {
    if (entry.endsWith('/')) {
      if (rel === entry.slice(0, -1) || rel.startsWith(entry)) return true;
    } else if (rel === entry) {
      return true;
    }
  }
  return false;
}

function isLineAllowlisted(rel: string, lineNum: number, term: string): boolean {
  return config.lineAllowlist.some((a) => a.file === rel && a.line === lineNum && a.term === term);
}

function makeTermRegex(term: string, caseSensitive: boolean): RegExp {
  // Strict boundaries: the term must NOT be adjacent to a word character,
  // hyphen, or underscore. This prevents matching kebab-case identifiers
  // (e.g. `animate-pulse`, `aegis-deck-sync`) and snake_case names.
  // For multi-word terms ("PRISM Counsel"), the boundary applies to the outer edges only.
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?<![\\w\\-/:.])${escaped}(?![\\w\\-/:.])`, caseSensitive ? 'g' : 'gi');
}

interface Violation {
  file: string;
  line: number;
  col: number;
  term: string;
  replacement: string;
  reason: string;
  snippet: string;
}

function scanFile(absPath: string): Violation[] {
  const rel = portableRelativePath(ROOT, absPath);
  if (isFileAllowlisted(rel)) return [];

  let content: string;
  try {
    content = readFileSync(absPath, 'utf8');
  } catch {
    return [];
  }

  const lines = content.split('\n');
  const violations: Violation[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    // Skip pure comment lines (single-line). Block comments aren't tracked precisely
    // here; that's an acceptable trade-off for a fast lint.
    if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue;

    for (const banned of config.bannedStrings) {
      const re = makeTermRegex(banned.term, banned.caseSensitive ?? true);
      let m: RegExpExecArray | null;
      while ((m = re.exec(line)) !== null) {
        if (isLineAllowlisted(rel, i + 1, banned.term)) continue;
        violations.push({
          file: rel,
          line: i + 1,
          col: m.index + 1,
          term: banned.term,
          replacement: banned.replacement,
          reason: banned.reason,
          snippet: line.trim().slice(0, 160),
        });
      }
    }
  }

  return violations;
}

function trackedSourceFiles(): string[] {
  const gitArgs = CHANGED_FROM
    ? [
        'diff',
        '--name-only',
        '-z',
        '--diff-filter=ACMR',
        `${CHANGED_FROM}...HEAD`,
        '--',
        ...SCAN_ROOTS,
      ]
    : ['ls-files', '-z', '--', ...SCAN_ROOTS];
  const result = spawnSync('git', gitArgs, {
    cwd: ROOT,
    encoding: 'utf8',
    windowsHide: true,
  });
  if (result.error) {
    throw new Error(`Unable to enumerate tracked source files with Git: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(
      `Unable to enumerate tracked source files with Git (exit ${result.status}): ${result.stderr.trim()}`,
    );
  }

  return result.stdout
    .split('\0')
    .filter(Boolean)
    .map(normalizePortablePath)
    .filter((rel) => SCAN_EXTENSIONS.has(extname(rel)))
    .filter((rel) => !isFileAllowlisted(rel))
    .map((rel) => join(ROOT, rel));
}

const allFiles = trackedSourceFiles();
const allViolations: Violation[] = [];
for (const f of allFiles) {
  allViolations.push(...scanFile(f));
}

if (VERBOSE) {
  console.error(
    `[brand-strings] scanned ${allFiles.length} ${CHANGED_FROM ? `changed files since ${CHANGED_FROM}` : 'tracked files'}; raw matches: ${allViolations.length}`,
  );
}

// ---------------------------------------------------------------------------
// Baseline handling
// ---------------------------------------------------------------------------
// The repo has a known set of legacy occurrences that the originality audit
// intentionally left in place (internal identifiers, mock data, archived demo
// content). These are recorded in `scripts/banned-brand-strings.baseline.json`
// as a {file -> {term -> count}} map. The check passes if and only if no NEW
// occurrences have been added beyond the baseline.
//
// To regenerate the baseline after a deliberate cleanup run:
//   tsx scripts/check-banned-brand-strings.ts --update-baseline
const BASELINE_PATH = join(ROOT, 'scripts/banned-brand-strings.baseline.json');

type BaselineMap = Record<string, Record<string, number>>;

function buildCounts(violations: Violation[]): BaselineMap {
  const out: BaselineMap = {};
  for (const v of violations) {
    out[v.file] ??= {};
    out[v.file][v.term] = (out[v.file][v.term] ?? 0) + 1;
  }
  return out;
}

const currentCounts = buildCounts(allViolations);

if (UPDATE_BASELINE) {
  writeFileSync(BASELINE_PATH, `${JSON.stringify(currentCounts, null, 2)}\n`);
  process.exit(0);
}

const baseline: BaselineMap = existsSync(BASELINE_PATH)
  ? (JSON.parse(readFileSync(BASELINE_PATH, 'utf8')) as BaselineMap)
  : {};

// Find NEW violations: any (file, term) where current count exceeds baseline count.
// Bucket by (file, term) and emit overflow occurrences.
const newViolations: Violation[] = [];
const seen = new Map<string, number>();
for (const v of allViolations) {
  const key = `${v.file}\u0000${v.term}`;
  const idx = (seen.get(key) ?? 0) + 1;
  seen.set(key, idx);
  const allowed = baseline[v.file]?.[v.term] ?? 0;
  if (idx > allowed) newViolations.push(v);
}

if (VERBOSE) {
  console.error(`[brand-strings] new violations beyond baseline: ${newViolations.length}`);
}

if (newViolations.length === 0) {
  console.log(
    `✓  Banned brand-string check passed — scanned ${allFiles.length} files, no new violations beyond the audit baseline.`,
  );
  // Warn about stale baseline entries (file/term in baseline but no current matches).
  let stale = 0;
  for (const [file, terms] of Object.entries(baseline)) {
    for (const [term, count] of Object.entries(terms)) {
      const cur = currentCounts[file]?.[term] ?? 0;
      if (cur < count) stale += count - cur;
    }
  }
  if (!CHANGED_FROM && stale > 0) {
    console.log(
      `   (note: ${stale} stale baseline entr${stale === 1 ? 'y' : 'ies'} — consider running with --update-baseline to refresh)`,
    );
  }
  process.exit(0);
}

const byFile = new Map<string, Violation[]>();
for (const v of newViolations) {
  const arr = byFile.get(v.file) ?? [];
  arr.push(v);
  byFile.set(v.file, arr);
}

console.error(
  `\n❌  Banned brand-string check FAILED — ${newViolations.length} NEW violation(s) introduced beyond the audit baseline.\n`,
);

for (const [file, vs] of byFile) {
  console.error(`  ${file}`);
  for (const v of vs) {
    console.error(`    ${v.line}:${v.col}  "${v.term}" → use "${v.replacement}"  (${v.reason})`);
    console.error(`      ${v.snippet}`);
  }
}

console.error(`\nFix by replacing the banned term with its canonical replacement.`);
console.error(`Legitimate occurrences (e.g. external entity name, citation) can be added to`);
console.error(`scripts/banned-brand-strings.json under "lineAllowlist" or "fileAllowlist".`);
console.error(`If a deliberate refactor introduced these and they are intentional, regenerate`);
console.error(`the baseline with: tsx scripts/check-banned-brand-strings.ts --update-baseline\n`);

process.exit(1);
