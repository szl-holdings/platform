/**
 * CLI runner regression test.
 *
 * Spawns `tsx src/cli/run.ts` against `runner/payload.json` into an isolated
 * tmp dir, then spawns `tsx src/cli/replay.ts` against those outputs and
 * asserts:
 *
 *   1. All six declared output files exist.
 *   2. The runner reports `status: ok`, `stop_reason: convergence`,
 *      and emits exactly `target_rows` rows.
 *   3. The replay verifier returns `verdict: ATTESTED` against the
 *      written trace + final_state hashes.
 *   4. The trace is JSONL (one parseable JSON object per non-empty line)
 *      and the proof ledger digest in the run summary matches the one
 *      reported on stdout.
 *
 * This is the deterministic contract that lets us promise replay-grade.
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
const PAYLOAD_PATH = join(PACKAGE_ROOT, 'runner', 'payload.json');
const PAYLOAD = JSON.parse(readFileSync(PAYLOAD_PATH, 'utf-8')) as {
  goal: { target_rows: number };
  platform: { output_paths: Record<string, string> };
};
const TARGET_ROWS = PAYLOAD.goal.target_rows;

let tmp_root: string;
let runner_stdout: string;
let outputs: Record<keyof typeof PAYLOAD.platform.output_paths, string>;

function runTsx(script: string, args: string[], output_root: string): string {
  // tsx is symlinked into the package via pnpm — reuse it so we don't depend
  // on a global install. CODEX_OUTPUT_ROOT confines all writes to the sandbox.
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
  tmp_root = mkdtempSync(join(tmpdir(), 'codex-kernel-cli-'));
  // CODEX_OUTPUT_ROOT redirects the runner's output_root to the sandbox so
  // the six declared output_paths (./output/*.json) land under tmp_root
  // instead of the repo. Pass the absolute payload path so payload resolution
  // doesn't depend on cwd.
  runner_stdout = runTsx('run.ts', [PAYLOAD_PATH], tmp_root);
  outputs = Object.fromEntries(
    Object.entries(PAYLOAD.platform.output_paths).map(([k, rel]) => [k, resolve(tmp_root, rel)]),
  ) as typeof outputs;
});

afterAll(() => {
  if (tmp_root) rmSync(tmp_root, { recursive: true, force: true });
});

describe('codex-kernel CLI runner', () => {
  it('writes all six declared output files', () => {
    for (const path of Object.values(outputs)) {
      expect(existsSync(path), `missing output: ${path}`).toBe(true);
    }
  });

  it('reports status=ok, stop_reason=convergence, and emits target_rows', () => {
    expect(runner_stdout).toMatch(/status:\s+ok/);
    expect(runner_stdout).toMatch(/stop_reason:\s+convergence/);
    expect(runner_stdout).toMatch(new RegExp(`rows_emitted:\\s+${TARGET_ROWS}`));
    expect(runner_stdout).toMatch(/hard_failures:\s+0/);
  });

  it('writes a parseable JSONL trace, one event per non-empty line', () => {
    const trace_text = readFileSync(outputs.trace_jsonl, 'utf-8');
    const lines = trace_text.split('\n').filter((l) => l.trim().length > 0);
    expect(lines.length).toBeGreaterThan(0);
    for (const line of lines) {
      const evt = JSON.parse(line) as { step: number; state_next_hash: string };
      expect(evt).toHaveProperty('step');
      expect(evt).toHaveProperty('state_next_hash');
    }
  });

  it('records a ledger digest that matches the run summary', () => {
    const summary = JSON.parse(readFileSync(outputs.run_summary, 'utf-8')) as {
      ledger_digest: string;
    };
    const stdout_digest = /ledger_digest:\s+([0-9a-f]+)/.exec(runner_stdout)?.[1];
    expect(stdout_digest).toBeDefined();
    expect(summary.ledger_digest).toBe(stdout_digest);
  });

  it('replay verifier attests the recorded trace against the final hash', () => {
    const replay_stdout = runTsx(
      'replay.ts',
      [outputs.trace_jsonl, outputs.final_state, PAYLOAD_PATH],
      tmp_root,
    );
    expect(replay_stdout).toMatch(/verdict:\s+ATTESTED/);
    expect(replay_stdout).toMatch(/failed_step:\s+—/);
    const expected = /expected_final_hash:\s+([0-9a-f]+)/.exec(replay_stdout)?.[1];
    const recomputed = /recomputed_final_hash:\s+([0-9a-f]+)/.exec(replay_stdout)?.[1];
    expect(expected).toBeDefined();
    expect(recomputed).toBe(expected);
  });

  it('produces deterministic final_state_hash across two independent runs', () => {
    const second_tmp = mkdtempSync(join(tmpdir(), 'codex-kernel-cli-2-'));
    try {
      const second_stdout = runTsx('run.ts', [PAYLOAD_PATH], second_tmp);
      const first_hash = /final_state_hash:\s+([0-9a-f]+)/.exec(runner_stdout)?.[1];
      const second_hash = /final_state_hash:\s+([0-9a-f]+)/.exec(second_stdout)?.[1];
      expect(first_hash).toBeDefined();
      expect(second_hash).toBe(first_hash);
    } finally {
      rmSync(second_tmp, { recursive: true, force: true });
    }
  });
});
