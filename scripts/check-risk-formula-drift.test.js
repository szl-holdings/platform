/**
 * Smoke test for scripts/check-risk-formula-drift.mjs (task #4983).
 *
 * We can't easily mock the filesystem in a portable way, so we run the
 * real script in two modes:
 *   1) against the current repo (must exit 0 — main branch is clean)
 *   2) against a temp scratch dir seeded with a violation (must exit 1)
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

describe('check-risk-formula-drift', () => {
  it('passes on the current main branch', () => {
    const out = execFileSync('node', [SCRIPT], { cwd: ROOT, encoding: 'utf8' });
    expect(out).toMatch(/clean/);
  });

  it('fails when a new file outside lib/formulas/ reintroduces the formula', () => {
    const scratch = mkdtempSync(join(tmpdir(), 'risk-drift-'));
    // Script computes ROOT as `resolve(__filename, '..', '..')`, so the
    // script file itself must live at `<scratch>/scripts/<name>.mjs` for
    // ROOT to resolve to the scratch dir.
    mkdirSync(join(scratch, 'scripts'), { recursive: true });
    cpSync(SCRIPT, join(scratch, 'scripts', 'check.mjs'));
    const offendingDir = join(scratch, 'artifacts', 'fake', 'src');
    mkdirSync(offendingDir, { recursive: true });
    writeFileSync(
      join(offendingDir, 'bad.ts'),
      'export const r = (s: number, l: number, v: number) => severity * likelihood * v;\n',
    );
    const result = spawnSync('node', ['scripts/check.mjs'], { cwd: scratch, encoding: 'utf8' });
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/drift violation/);
    expect(result.stderr).toMatch(/artifacts\/fake\/src\/bad\.ts/);
  });
});
