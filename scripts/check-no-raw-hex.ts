#!/usr/bin/env tsx
/**
 * check-no-raw-hex.ts
 *
 * Enforces the design token contract: no raw hex colour literals may appear
 * outside designated token files. Any file that sets a colour MUST reference
 * a design-token variable, not an inline hex string.
 *
 * Allowed locations for hex values:
 *   - packages/design-system/src/tokens/**
 *   - Any *.test.ts / *.spec.ts file (test snapshots are exempt)
 *
 * Usage:
 *   tsx scripts/check-no-raw-hex.ts
 *   pnpm design:check-hex
 *
 * Exit 0 → clean.  Exit 1 → violations found.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname ?? process.cwd(), '..');

const ALLOWED_PATHS: string[] = [
  'packages/design-system/src/tokens',
  'packages/domain-profiles/src/tokens.ts',
];

const EXEMPT_SUFFIXES = ['.test.ts', '.spec.ts', '.test.tsx', '.spec.tsx', '.snap'];

const HEX_RE = /#([0-9a-fA-F]{3,8})\b/g;

/**
 * Scope: AEEP packages only — the 8 new runtime packages + design-system + domain-profiles.
 * Pre-existing packages (brand-registry, config, ui-command, substrate, demo-seed, etc.)
 * carry legacy hex values and are exempt until a tracked token-migration is completed.
 * See docs/known-gaps.md for the migration work item.
 *
 * To expand scope: add package paths to SCAN_DIRS below.
 */
const SCAN_DIRS = [
  'packages/design-system',
  'packages/domain-profiles',
  'packages/shared-contracts',
  'packages/agent-core',
  'packages/retrieval-core',
  'packages/memory-core',
  'packages/evidence-ledger',
  'packages/policy-guard',
  'packages/workflow-runtime',
  'packages/platform-metrics-registry',
];
const SCAN_EXTS = new Set(['.ts', '.tsx', '.css', '.scss', '.less']);

function isAllowed(absPath: string): boolean {
  const rel = relative(ROOT, absPath);
  if (EXEMPT_SUFFIXES.some((s) => rel.endsWith(s))) return true;
  if (ALLOWED_PATHS.some((p) => rel.startsWith(p))) return true;
  if (rel.includes('node_modules')) return true;
  return false;
}

function* walk(dir: string): Generator<string> {
  if (!statSync(dir, { throwIfNoEntry: false })?.isDirectory()) return;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full, { throwIfNoEntry: false });
    if (!stat) continue;
    if (stat.isDirectory()) {
      if (entry === 'node_modules' || entry === '.git' || entry === 'dist' || entry === '.turbo')
        continue;
      yield* walk(full);
    } else if (stat.isFile() && SCAN_EXTS.has(full.slice(full.lastIndexOf('.')))) {
      yield full;
    }
  }
}

const violations: { file: string; line: number; col: number; match: string }[] = [];

for (const dir of SCAN_DIRS) {
  for (const file of walk(join(ROOT, dir))) {
    if (isAllowed(file)) continue;
    const lines = readFileSync(file, 'utf-8').split('\n');
    lines.forEach((lineText, idx) => {
      let m: RegExpExecArray | null;
      HEX_RE.lastIndex = 0;
      while ((m = HEX_RE.exec(lineText)) !== null) {
        violations.push({
          file: relative(ROOT, file),
          line: idx + 1,
          col: m.index + 1,
          match: m[0],
        });
      }
    });
  }
}

if (violations.length === 0) {
  console.log('✓ No raw hex values found outside token files.');
  process.exit(0);
} else {
  console.error(`✗ ${violations.length} raw hex value(s) found outside token files:\n`);
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}:${v.col}  ${v.match}`);
  }
  console.error(
    '\nMove colour values into packages/design-system/src/tokens/ and reference the token variable.',
  );
  process.exit(1);
}
