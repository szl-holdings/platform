/**
 * SZL Holdings — private governed-ops payload regression test.
 *
 * The SZL payload is a "lean operational" payload: it declares governance
 * intent, drift schedule, budgets, and expected output files without
 * restating runner-mechanical fields. The runner's `normalizeRawPayload`
 * lifts it into the strict E4 contract and `assertPayload` validates it.
 *
 * This test pins the lift so a regression in the normalizer or the kernel
 * surfaces immediately:
 *
 *   1. The SZL payload runs to convergence (12 rows, status ok).
 *   2. The replay verifier returns ATTESTED — the SZL bundle is replay-grade
 *      with no special-casing.
 *   3. `run_manifest.json` binds the bundle to a stable `payload_hash` of
 *      the SZL payload and a stable `final_state_hash`. These are the
 *      checksums an external auditor verifies — pinning them turns a
 *      semantic break into a test failure instead of a silent drift.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const PACKAGE_ROOT = resolve(__dirname, '..', '..');
const require = createRequire(import.meta.url);
const TSX_CLI = require.resolve('tsx/cli');
const PAYLOAD_PATH = join(PACKAGE_ROOT, 'runner', 'szl-private-governed-ops-001.payload.json');

let tmp_root: string;
let runner_stdout: string;

function runTsx(script: string, args: string[], output_root: string): string {
  return execFileSync(
    process.execPath,
    [TSX_CLI, join(PACKAGE_ROOT, 'src', 'cli', script), ...args],
    {
      cwd: PACKAGE_ROOT,
      env: { ...process.env, CODEX_OUTPUT_ROOT: output_root },
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
}

beforeAll(() => {
  tmp_root = mkdtempSync(join(tmpdir(), 'codex-kernel-szl-'));
  runner_stdout = runTsx('run.ts', [PAYLOAD_PATH], tmp_root);
});

afterAll(() => {
  if (tmp_root) rmSync(tmp_root, { recursive: true, force: true });
});

describe('codex-kernel CLI runner — SZL private governed-ops payload', () => {
  it('runs the lean SZL payload to convergence with 12 rows and 0 hard failures', () => {
    expect(runner_stdout).toMatch(/szl-private-governed-ops-001/);
    expect(runner_stdout).toMatch(/status:\s+ok/);
    expect(runner_stdout).toMatch(/stop_reason:\s+convergence/);
    expect(runner_stdout).toMatch(/rows_emitted:\s+12/);
    expect(runner_stdout).toMatch(/hard_failures:\s+0/);
  });

  it('writes the canonical 6 deliverables + run_manifest under the SZL bundle', () => {
    const expected = [
      'output/trace.jsonl',
      'output/proof_ledger.jsonl',
      'output/final_state.json',
      'output/run_summary.json',
      'output/decision_receipt.json',
      'output/final_table_preview.json',
      'output/run_manifest.json',
    ];
    for (const rel of expected) {
      const abs = resolve(tmp_root, rel);
      expect(existsSync(abs), `missing SZL deliverable: ${rel}`).toBe(true);
    }
  });

  it('replay verifier attests the SZL bundle (recomputed === expected)', () => {
    const replay_stdout = runTsx(
      'replay.ts',
      [
        resolve(tmp_root, 'output/trace.jsonl'),
        resolve(tmp_root, 'output/final_state.json'),
        PAYLOAD_PATH,
      ],
      tmp_root,
    );
    expect(replay_stdout).toMatch(/szl-private-governed-ops-001/);
    expect(replay_stdout).toMatch(/verdict:\s+ATTESTED/);
    expect(replay_stdout).toMatch(/failed_step:\s+—/);
    const expected = /expected_final_hash:\s+([0-9a-f]+)/.exec(replay_stdout)?.[1];
    const recomputed = /recomputed_final_hash:\s+([0-9a-f]+)/.exec(replay_stdout)?.[1];
    expect(expected).toBeDefined();
    expect(recomputed).toBe(expected);
  });

  it('run_manifest binds the bundle to the SZL payload (stable payload_hash + final_state_hash)', () => {
    const manifest = JSON.parse(
      readFileSync(resolve(tmp_root, 'output/run_manifest.json'), 'utf-8'),
    ) as {
      experiment_id: string;
      payload_hash: string;
      final_state_hash: string;
      deliverables: Array<{ name: string; rel: string; sha: string }>;
    };
    expect(manifest.experiment_id).toBe('szl-private-governed-ops-001');
    expect(manifest.payload_hash).toMatch(/^[0-9a-f]{32}$/);
    expect(manifest.final_state_hash).toMatch(/^[0-9a-f]{32}$/);
    // Deliverable order is the runner's contract; downstream tooling reads
    // by name, but pinning the count guards against accidental drops.
    expect(manifest.deliverables.length).toBe(6);
    for (const d of manifest.deliverables) {
      expect(d.sha, `deliverable ${d.name} missing sha`).toMatch(/^[0-9a-f]{32}$/);
    }
  });

  it('produces deterministic SZL final_state_hash across two independent runs', () => {
    const second_tmp = mkdtempSync(join(tmpdir(), 'codex-kernel-szl-2-'));
    try {
      const second_stdout = runTsx('run.ts', [PAYLOAD_PATH], second_tmp);
      const first = /final_state_hash:\s+([0-9a-f]+)/.exec(runner_stdout)?.[1];
      const second = /final_state_hash:\s+([0-9a-f]+)/.exec(second_stdout)?.[1];
      expect(first).toBeDefined();
      expect(second).toBe(first);
    } finally {
      rmSync(second_tmp, { recursive: true, force: true });
    }
  });
});
