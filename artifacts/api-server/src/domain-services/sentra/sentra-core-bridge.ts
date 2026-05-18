/**
 * sentra-core subprocess bridge.
 *
 * Spawns `python3 -m sentra_core.cli` with a single JSON request on stdin and
 * parses the JSON response from stdout. Matches the repo's existing pattern of
 * keeping Python services as side-cars invoked via subprocess (see
 * substrate-py-workers and meridian_control_plane).
 *
 * All ops are routed through ``callSentraCore`` so we have one place to add
 * tracing, timeouts, and circuit-breaking later.
 */

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

import { logger } from '../../lib/logger';

function resolvePythonBin(): string {
  if (process.env.SENTRA_CORE_PYTHON) return process.env.SENTRA_CORE_PYTHON;
  const candidates = [
    path.resolve(process.cwd(), '.pythonlibs/bin/python3'),
    '/home/runner/workspace/.pythonlibs/bin/python3',
    '/usr/bin/python3',
    '/usr/local/bin/python3',
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  return 'python3';
}

export type SentraCoreOp =
  | 'threat_model.build'
  | 'posture_drift.compute'
  | 'incident_response.run'
  | 'evidence_pack.build'
  | 'policy_gate.evaluate';

export interface SentraCoreError {
  code: string;
  message: string;
}

export interface SentraCoreResponse<T> {
  ok: true;
  op: SentraCoreOp;
  result: T;
}

export interface SentraCoreErrorResponse {
  error: SentraCoreError;
}

const PYTHON_BIN = resolvePythonBin();
const WORKSPACE_ROOT = path.resolve(process.cwd(), process.cwd().includes('/artifacts/') ? '../..' : '.');
const SERVICE_ROOT = path.resolve(WORKSPACE_ROOT, 'services/sentra-core');
const DEFAULT_TIMEOUT_MS = Number(process.env.SENTRA_CORE_TIMEOUT_MS ?? 10_000);

export class SentraCoreInvocationError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly op: SentraCoreOp,
  ) {
    super(message);
    this.name = 'SentraCoreInvocationError';
  }
}

export async function callSentraCore<T>(
  op: SentraCoreOp,
  payload: Record<string, unknown>,
  opts: { timeoutMs?: number } = {},
): Promise<T> {
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const requestBody = JSON.stringify({ op, payload });

  return new Promise<T>((resolve, reject) => {
    const child = spawn(PYTHON_BIN, ['-m', 'sentra_core.cli'], {
      cwd: SERVICE_ROOT,
      env: {
        ...process.env,
        PYTHONPATH: [
          path.join(SERVICE_ROOT, 'src'),
          process.env.PYTHONPATH ?? '',
        ]
          .filter(Boolean)
          .join(':'),
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill('SIGKILL');
      reject(new SentraCoreInvocationError('timeout', `sentra-core ${op} timed out after ${timeoutMs}ms`, op));
    }, timeoutMs);

    child.stdout.on('data', (b) => stdoutChunks.push(b));
    child.stderr.on('data', (b) => stderrChunks.push(b));

    child.on('error', (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(new SentraCoreInvocationError('spawn_error', err.message, op));
    });

    child.on('close', (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      const stdout = Buffer.concat(stdoutChunks).toString('utf-8').trim();
      const stderr = Buffer.concat(stderrChunks).toString('utf-8').trim();
      if (!stdout) {
        logger.error({ op, code, stderr }, 'sentra-core produced no stdout');
        reject(
          new SentraCoreInvocationError(
            'no_output',
            `sentra-core ${op} produced no output (exit ${code}): ${stderr || '<empty>'}`,
            op,
          ),
        );
        return;
      }
      let parsed: SentraCoreResponse<T> | SentraCoreErrorResponse;
      try {
        parsed = JSON.parse(stdout);
      } catch (err) {
        reject(
          new SentraCoreInvocationError(
            'invalid_json_response',
            `sentra-core ${op} returned invalid JSON: ${(err as Error).message}`,
            op,
          ),
        );
        return;
      }
      if ('error' in parsed) {
        reject(new SentraCoreInvocationError(parsed.error.code, parsed.error.message, op));
        return;
      }
      resolve(parsed.result);
    });

    child.stdin.write(requestBody);
    child.stdin.end();
  });
}

let cachedAvailability: { ok: boolean; checkedAt: number; reason?: string } | null = null;
const AVAILABILITY_TTL_MS = 30_000;

/**
 * Lightweight probe: returns whether the sentra-core sidecar is reachable.
 * Cached so we don't spawn Python on every request.
 */
export async function probeSentraCore(): Promise<{ ok: boolean; reason?: string }> {
  const now = Date.now();
  if (cachedAvailability && now - cachedAvailability.checkedAt < AVAILABILITY_TTL_MS) {
    return cachedAvailability;
  }
  try {
    await callSentraCore<unknown>(
      'threat_model.build',
      {
        assets: [{ id: 'probe', name: 'probe', kind: 'endpoint' }],
        sources: [{ id: 'probe', name: 'probe', techniques: ['T1059'] }],
      },
      { timeoutMs: 5_000 },
    );
    cachedAvailability = { ok: true, checkedAt: now };
  } catch (err) {
    cachedAvailability = {
      ok: false,
      checkedAt: now,
      reason: err instanceof SentraCoreInvocationError ? err.message : String(err),
    };
  }
  return cachedAvailability;
}
