/**
 * Smoke test for scripts/check-risk-formula-drift.mjs (task #4983, #5032).
 *
 * We can't easily mock the filesystem in a portable way, so we run the
 * real script in multiple modes:
 *   1) against the current repo (must exit 0 — main branch is clean)
 *   2) against a temp scratch dir seeded with each rule's violation
 *      (must exit 1, with the matching rule id in stderr)
 */
import { describe, expect, it } from 'vitest';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const ROOT = resolve(__filename, '..', '..');
const SCRIPT = join(ROOT, 'scripts', 'check-risk-formula-drift.mjs');

function seedScratch() {
  const scratch = mkdtempSync(join(tmpdir(), 'formula-drift-'));
  // Script computes ROOT as `resolve(__filename, '..', '..')`, so the
  // script file itself must live at `<scratch>/scripts/<name>.mjs` for
  // ROOT to resolve to the scratch dir.
  mkdirSync(join(scratch, 'scripts'), { recursive: true });
  // Preserve the canonical filename so the script's own GLOBAL_ALLOWED_PREFIXES
  // entry exempts its source (which has to mention each pattern by name).
  cpSync(SCRIPT, join(scratch, 'scripts', 'check-risk-formula-drift.mjs'));
  return scratch;
}

function runIn(scratch) {
  return spawnSync('node', ['scripts/check-risk-formula-drift.mjs'], {
    cwd: scratch,
    encoding: 'utf8',
  });
}

describe('check-risk-formula-drift', () => {
  it('passes on the current main branch', () => {
    const out = execFileSync('node', [SCRIPT], { cwd: ROOT, encoding: 'utf8' });
    expect(out).toMatch(/clean/);
  });

  it('fails when a new file outside lib/formulas/ reintroduces severity * likelihood', () => {
    const scratch = seedScratch();
    const offendingDir = join(scratch, 'artifacts', 'fake', 'src');
    mkdirSync(offendingDir, { recursive: true });
    writeFileSync(
      join(offendingDir, 'bad.ts'),
      'export const r = (s: number, l: number, v: number) => severity * likelihood * v;\n',
    );
    const result = runIn(scratch);
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/\[risk-score\]/);
    expect(result.stderr).toMatch(/artifacts\/fake\/src\/bad\.ts/);
  });

  it('fails when a new file outside lib/formulas/ reimplements the autonomy gate', () => {
    const scratch = seedScratch();
    const offendingDir = join(scratch, 'artifacts', 'fake', 'src');
    mkdirSync(offendingDir, { recursive: true });
    writeFileSync(
      join(offendingDir, 'gate.ts'),
      "export function gate(r: number) {\n" +
        "  if (r < 0.2) return 'auto';\n" +
        "  if (r < 0.6) return 'approve';\n" +
        "  return 'multi-party';\n" +
        '}\n',
    );
    const result = runIn(scratch);
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/\[autonomy-gate\]/);
    expect(result.stderr).toMatch(/artifacts\/fake\/src\/gate\.ts/);
  });

  it('fails when a new file outside lib/formulas/ reimplements KL drift', () => {
    const scratch = seedScratch();
    const offendingDir = join(scratch, 'packages', 'fake', 'src');
    mkdirSync(offendingDir, { recursive: true });
    writeFileSync(
      join(offendingDir, 'drift.ts'),
      'export function kl(p: number[], q: number[]) {\n' +
        '  let s = 0;\n' +
        '  for (let i = 0; i < p.length; i++) {\n' +
        '    const pi = p[i] + 1e-9;\n' +
        '    const qi = q[i] + 1e-9;\n' +
        '    s += pi * Math.log(pi / qi);\n' +
        '  }\n' +
        '  return s;\n' +
        '}\n',
    );
    const result = runIn(scratch);
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/\[drift-score\]/);
    expect(result.stderr).toMatch(/packages\/fake\/src\/drift\.ts/);
  });

  it('does not flag innocuous Math.log usage', () => {
    const scratch = seedScratch();
    const dir = join(scratch, 'artifacts', 'ok', 'src');
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      join(dir, 'ok.ts'),
      'export const f = (x: number) => Math.log(x) + Math.log(x * 2);\n',
    );
    const result = runIn(scratch);
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/clean/);
  });
});
