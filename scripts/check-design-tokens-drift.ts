#!/usr/bin/env tsx
/**
 * check-design-tokens-drift.ts
 *
 * Portfolio-wide drift detector for the @workspace/tokens contract.
 *
 * For every registered artifact it walks the source tree and counts:
 *   - lines (denominator)
 *   - raw hex literals      (#abc, #aabbcc, #aabbccdd) outside test files
 *   - inline rgb()/rgba()/hsl()/hsla() literals
 *   - imports of design-system tokens from anywhere other than @workspace/tokens
 *
 * NOTE: Tailwind palette-utility detection (bg-red-500 etc.) is intentionally
 * NOT performed here — the AEEP design language ships its own utility layer
 * via the `gi-` CSS variables and adding a Tailwind audit would produce false
 * positives across legacy shadcn imports. Track that as a separate work item.
 *
 * It then emits a compliance score in [0, 100]:
 *   score = clamp(100 - (violations / lines) * 10000, 0, 100)
 *
 * Output: scripts/design-tokens-drift.report.json
 *   {
 *     generatedAt, totalArtifacts, averageScore,
 *     artifacts: [{ id, dir, score, lines, violations, top: [{file, count, examples}] }]
 *   }
 *
 * Usage:
 *   tsx scripts/check-design-tokens-drift.ts            # write report
 *   tsx scripts/check-design-tokens-drift.ts --check    # exit 1 if avg score < threshold
 *
 * NOTE: this is the *governance* detector. The legacy scripts/check-no-raw-hex.ts
 * remains the strict gate for AEEP runtime packages and is unaffected.
 */

import { appendFileSync, existsSync, readdirSync, readFileSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

import { TOKEN_GOVERNED_ARTIFACTS } from '../packages/tokens/src/manifest.ts';

const ROOT = resolve(import.meta.dirname ?? process.cwd(), '..');
const OUT_PATH = join(ROOT, 'scripts/design-tokens-drift.report.json');
const HISTORY_PATH = join(ROOT, 'scripts/design-tokens-drift.history.json');
const AUDIT_JSONL_PATH = join(ROOT, 'audit/design-token-history.jsonl');
const PUBLISH_PATH = join(
  ROOT,
  'artifacts/mockup-sandbox/src/data/design-tokens-drift.generated.json',
);
const HISTORY_PUBLISH_PATH = join(
  ROOT,
  'artifacts/mockup-sandbox/src/data/design-tokens-drift-history.generated.json',
);
const SZL_HOLDINGS_PUBLISH_PATH = join(
  ROOT,
  'artifacts/szl-holdings/src/data/design-tokens-drift.generated.json',
);
const SZL_HOLDINGS_HISTORY_PUBLISH_PATH = join(
  ROOT,
  'artifacts/szl-holdings/src/data/design-tokens-drift-history.generated.json',
);
const HISTORY_LIMIT = 60;

const SCAN_EXTS = new Set(['.ts', '.tsx', '.css']);
const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  '.turbo',
  '.next',
  '.expo',
  'ios',
  'android',
  '.cache',
  'coverage',
  '__generated__',
]);
const EXEMPT_SUFFIXES = ['.test.ts', '.spec.ts', '.test.tsx', '.spec.tsx', '.snap', '.generated.ts', '.generated.tsx'];

const HEX_RE = /#([0-9a-fA-F]{3,8})\b/g;
const RGB_RE = /\b(rgb|rgba|hsl|hsla)\(/g;
const NON_TOKEN_IMPORT_RE = /from\s+['"]@szl-holdings\/design-system\/tokens['"]/g;

interface FileFinding {
  file: string;
  count: number;
  examples: string[];
}

interface ArtifactReport {
  id: string;
  dir: string;
  title: string;
  kind: string;
  lines: number;
  files: number;
  violations: number;
  score: number;
  top: FileFinding[];
}

function* walk(dir: string): Generator<string> {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const stat = statSync(full, { throwIfNoEntry: false });
    if (!stat) continue;
    if (stat.isDirectory()) {
      yield* walk(full);
    } else if (stat.isFile()) {
      const ext = full.slice(full.lastIndexOf('.'));
      if (SCAN_EXTS.has(ext)) yield full;
    }
  }
}

function isExempt(rel: string): boolean {
  return EXEMPT_SUFFIXES.some((s) => rel.endsWith(s));
}

function scanArtifact(descriptor: (typeof TOKEN_GOVERNED_ARTIFACTS)[number]): ArtifactReport {
  const absDir = join(ROOT, descriptor.dir);
  const findings = new Map<string, FileFinding>();
  let totalLines = 0;
  let totalFiles = 0;
  let totalViolations = 0;

  for (const file of walk(absDir)) {
    const rel = relative(ROOT, file);
    if (isExempt(rel)) continue;
    let content: string;
    try {
      content = readFileSync(file, 'utf-8');
    } catch {
      continue;
    }
    const lineCount = content.split('\n').length;
    totalLines += lineCount;
    totalFiles += 1;

    let count = 0;
    const examples: string[] = [];

    HEX_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = HEX_RE.exec(content)) !== null) {
      count += 1;
      if (examples.length < 3) examples.push(m[0]);
    }
    RGB_RE.lastIndex = 0;
    while ((m = RGB_RE.exec(content)) !== null) {
      count += 1;
      if (examples.length < 3) examples.push(`${m[1]}(...)`);
    }
    NON_TOKEN_IMPORT_RE.lastIndex = 0;
    while ((m = NON_TOKEN_IMPORT_RE.exec(content)) !== null) {
      count += 1;
      if (examples.length < 3) examples.push('non-aliased-tokens-import');
    }

    if (count > 0) {
      findings.set(rel, { file: rel, count, examples });
      totalViolations += count;
    }
  }

  const violationsPerKLoc = totalLines === 0 ? 0 : (totalViolations / totalLines) * 1000;
  const score = Math.max(0, Math.min(100, Math.round(100 - violationsPerKLoc)));
  const top = [...findings.values()].sort((a, b) => b.count - a.count).slice(0, 10);

  return {
    id: descriptor.id,
    dir: descriptor.dir,
    title: descriptor.title,
    kind: descriptor.kind,
    lines: totalLines,
    files: totalFiles,
    violations: totalViolations,
    score,
    top,
  };
}

function main(): void {
  const args = process.argv.slice(2);
  const checkMode = args.includes('--check');
  const thresholdArg = args.find((a) => a.startsWith('--threshold='));
  const threshold = thresholdArg ? Number(thresholdArg.split('=')[1]) : 50;

  const reports = TOKEN_GOVERNED_ARTIFACTS.map(scanArtifact);
  const averageScore =
    reports.length === 0
      ? 100
      : Math.round(reports.reduce((a, r) => a + r.score, 0) / reports.length);

  const payload = {
    generatedAt: new Date().toISOString(),
    threshold,
    averageScore,
    totalArtifacts: reports.length,
    artifacts: reports,
  };

  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(payload, null, 2) + '\n', 'utf-8');
  mkdirSync(dirname(PUBLISH_PATH), { recursive: true });
  writeFileSync(PUBLISH_PATH, JSON.stringify(payload, null, 2) + '\n', 'utf-8');
  mkdirSync(dirname(SZL_HOLDINGS_PUBLISH_PATH), { recursive: true });
  writeFileSync(SZL_HOLDINGS_PUBLISH_PATH, JSON.stringify(payload, null, 2) + '\n', 'utf-8');

  // ---------------------------------------------------------------------------
  // Trend / history append. Stored as a rolling window of {ts, average, perArtifact}
  // so the governance dashboard can render a sparkline over time without
  // needing a backend.
  // ---------------------------------------------------------------------------
  type HistoryEntry = {
    ts: string;
    averageScore: number;
    perArtifact: Record<string, number>;
  };
  const history: HistoryEntry[] = existsSync(HISTORY_PATH)
    ? (JSON.parse(readFileSync(HISTORY_PATH, 'utf-8')) as HistoryEntry[])
    : [];
  const perArtifact: Record<string, number> = {};
  for (const r of reports) perArtifact[r.id] = r.score;
  const historyEntry: HistoryEntry = { ts: payload.generatedAt, averageScore, perArtifact };
  history.push(historyEntry);
  while (history.length > HISTORY_LIMIT) history.shift();
  writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2) + '\n', 'utf-8');
  writeFileSync(HISTORY_PUBLISH_PATH, JSON.stringify(history, null, 2) + '\n', 'utf-8');
  writeFileSync(SZL_HOLDINGS_HISTORY_PUBLISH_PATH, JSON.stringify(history, null, 2) + '\n', 'utf-8');

  // Append single-line JSONL entry to the committed audit trail.
  mkdirSync(dirname(AUDIT_JSONL_PATH), { recursive: true });
  appendFileSync(AUDIT_JSONL_PATH, JSON.stringify(historyEntry) + '\n', 'utf-8');

  console.log(
    `\nNEXUS tokens-as-code drift report — average score ${averageScore}/100 across ${reports.length} artifacts`,
  );
  for (const r of reports) {
    const bar = '█'.repeat(Math.round(r.score / 5)).padEnd(20, '░');
    console.log(`  ${bar}  ${String(r.score).padStart(3)}  ${r.id.padEnd(22)}  ${r.violations} hits / ${r.lines} lines`);
  }
  console.log(`\nReport: ${relative(ROOT, OUT_PATH)}`);
  console.log(`Published to NEXUS: ${relative(ROOT, PUBLISH_PATH)}`);
  console.log(`Published to SZL Holdings: ${relative(ROOT, SZL_HOLDINGS_PUBLISH_PATH)}`);
  console.log(`Audit trail: ${relative(ROOT, AUDIT_JSONL_PATH)}\n`);

  if (checkMode && averageScore < threshold) {
    console.error(`FAIL: average compliance ${averageScore} < threshold ${threshold}`);
    process.exit(1);
  }
}

main();
