/**
 * Agent Gateway — End-to-End Test (task #4848)
 *
 * Exercises the *actually-running* gateway HTTP server (not the in-process
 * createServer() handler used by server-smoke.test.ts). A real Node child
 * process is spawned that runs src/server.ts on an ephemeral port, then the
 * test issues a real JWT and hits the deployed routes over real TCP:
 *
 *   GET  /health
 *   GET  /v1/capabilities
 *   POST /v1/agent/action
 *
 * After the POST, the test asserts that a new line was appended to the
 * configured audit log (the same NDJSON file the deployed sidecar writes to,
 * /tmp/agent-gateway-audit.ndjson by default — the test uses an isolated path
 * so it does not pollute the real one).
 *
 * If GATEWAY_E2E_URL is set (e.g. https://$REPLIT_DEV_DOMAIN/agent-gateway or
 * http://localhost:80/agent-gateway), the test will hit that URL instead of
 * spawning its own server. This lets the same suite verify the live deployed
 * gateway through the proxy without code changes.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn, type ChildProcess } from 'child_process';
import { mkdtempSync, readFileSync, statSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { createServer } from 'net';
import { issueToken } from '../src/auth.js';

const E2E_URL = process.env['GATEWAY_E2E_URL']?.replace(/\/$/, '');
const JWT_SECRET = process.env['GATEWAY_E2E_JWT_SECRET'] ?? 'gateway-e2e-test-secret';

// When the test owns the server, it picks an isolated audit log path so it can
// reliably observe the tail growing. When pointed at a deployed gateway via
// GATEWAY_E2E_URL the audit file is owned by that server — fall back to the
// default path the sidecar uses.
const tmpDir = mkdtempSync(join(tmpdir(), 'agent-gateway-e2e-'));
const AUDIT_LOG_PATH = E2E_URL
  ? process.env['GATEWAY_E2E_AUDIT_LOG'] ?? '/tmp/agent-gateway-audit.ndjson'
  : join(tmpDir, 'audit.ndjson');

let baseUrl: string;
let child: ChildProcess | undefined;

async function getEphemeralPort(): Promise<number> {
  return new Promise((res, rej) => {
    const srv = createServer();
    srv.unref();
    srv.on('error', rej);
    srv.listen(0, '127.0.0.1', () => {
      const addr = srv.address();
      if (typeof addr === 'object' && addr) {
        const port = addr.port;
        srv.close(() => res(port));
      } else {
        rej(new Error('Could not get ephemeral port'));
      }
    });
  });
}

async function waitForHealth(url: string, timeoutMs = 15_000): Promise<void> {
  const start = Date.now();
  let lastErr: unknown = null;
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${url}/health`);
      if (res.status === 200) return;
      lastErr = new Error(`status ${res.status}`);
    } catch (err) {
      lastErr = err;
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(
    `Gateway did not become healthy at ${url}/health within ${timeoutMs}ms: ${String(lastErr)}`,
  );
}

beforeAll(async () => {
  if (E2E_URL) {
    baseUrl = E2E_URL;
    await waitForHealth(baseUrl);
    return;
  }

  const port = await getEphemeralPort();
  baseUrl = `http://127.0.0.1:${port}`;
  const serverEntry = resolve(__dirname, '../src/server.ts');
  const tsxBin = resolve(__dirname, '../node_modules/.bin/tsx');

  child = spawn(tsxBin, [serverEntry], {
    env: {
      ...process.env,
      NODE_ENV: 'production', // server.ts only auto-listens when NODE_ENV !== 'test'
      PORT: String(port),
      JWT_SECRET,
      AUDIT_LOG_PATH,
      OPA_ENDPOINT: 'local',
      TEMPORAL_ENDPOINT: 'local',
      OPENAI_API_KEY: 'local',
      BASE_PATH: '',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  child.stdout?.on('data', (b: Buffer) => process.stdout.write(`[gateway-e2e] ${b}`));
  child.stderr?.on('data', (b: Buffer) => process.stderr.write(`[gateway-e2e!] ${b}`));

  await waitForHealth(baseUrl);
}, 30_000);

afterAll(async () => {
  if (child && !child.killed) {
    child.kill('SIGTERM');
    await new Promise<void>((res) => {
      const t = setTimeout(() => {
        child?.kill('SIGKILL');
        res();
      }, 3000);
      child?.on('exit', () => {
        clearTimeout(t);
        res();
      });
    });
  }
});

describe('Agent Gateway — end-to-end against running HTTP server', () => {
  it('GET /health returns ok over real HTTP', async () => {
    const res = await fetch(`${baseUrl}/health`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string; service: string; timestamp: string };
    expect(body.status).toBe('ok');
    expect(body.service).toBe('agent-gateway');
    expect(typeof body.timestamp).toBe('string');
    expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false);
  });

  it('GET /v1/capabilities returns allowed and forbidden lists', async () => {
    const res = await fetch(`${baseUrl}/v1/capabilities`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { allowed: string[]; forbidden: string[] };
    expect(Array.isArray(body.allowed)).toBe(true);
    expect(Array.isArray(body.forbidden)).toBe(true);
    expect(body.allowed).toContain('inspect_code');
    expect(body.forbidden).toContain('direct_prod_change');
  });

  it('POST /v1/agent/action with a real JWT succeeds and appends to audit log', async () => {
    // Capture the audit-log size *before* the action so we can assert the
    // tail grew by at least one line. When pointed at the deployed sidecar,
    // the file may not exist yet on a fresh deploy — treat missing as size 0.
    const beforeSize = existsSync(AUDIT_LOG_PATH) ? statSync(AUDIT_LOG_PATH).size : 0;

    const token = issueToken(
      {
        sub: 'e2e-test@szl.io',
        role: 'platform-engineer',
        groups: ['platform-team'],
        orgId: 'szl-holdings',
      },
      JWT_SECRET,
    );

    const correlationId = `e2e-${Date.now()}`;
    const res = await fetch(`${baseUrl}/v1/agent/action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-correlation-id': correlationId,
      },
      body: JSON.stringify({
        capability: 'inspect_code',
        target: 'api-server',
        domain: 'platform',
        targetEnvironment: 'development',
        parameters: { prompt: 'e2e smoke: inspect auth module' },
      }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      status: string;
      auditId?: string;
      correlationId?: string;
    };
    expect(body.status).toBe('success');
    expect(body.auditId).toMatch(/^[0-9a-f-]{36}$/);
    expect(body.correlationId).toBe(correlationId);

    // The gateway writes audit asynchronously; poll for a record that matches
    // *our* correlationId so the assertion holds even on a busy shared log
    // (deployed-mode case). Falls back to size-growth detection only as a
    // sanity check.
    let matched: Record<string, unknown> | undefined;
    let grew = false;
    for (let i = 0; i < 30; i++) {
      if (existsSync(AUDIT_LOG_PATH)) {
        const size = statSync(AUDIT_LOG_PATH).size;
        if (size > beforeSize) {
          grew = true;
          // Read only the new tail (since beforeSize) to avoid loading large
          // shared audit files in deployed mode.
          const fd = readFileSync(AUDIT_LOG_PATH);
          const tail = fd.slice(beforeSize).toString('utf8');
          for (const line of tail.split('\n')) {
            if (!line.trim()) continue;
            try {
              const parsed = JSON.parse(line) as Record<string, unknown>;
              if (parsed['correlationId'] === correlationId) {
                matched = parsed;
                break;
              }
            } catch {
              // ignore malformed line — not ours
            }
          }
          if (matched) break;
        }
      }
      await new Promise((r) => setTimeout(r, 100));
    }
    expect(grew, `audit log ${AUDIT_LOG_PATH} did not grow after action`).toBe(true);
    expect(
      matched,
      `no audit record with correlationId=${correlationId} found in ${AUDIT_LOG_PATH}`,
    ).toBeTruthy();
    expect(matched!['capability']).toBe('inspect_code');
    expect(matched!['target']).toBe('api-server');
    expect(matched!['status']).toBe('completed');
  });

  it('POST /v1/agent/action without Authorization is rejected with 401', async () => {
    const res = await fetch(`${baseUrl}/v1/agent/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        capability: 'inspect_code',
        target: 'api-server',
        domain: 'platform',
      }),
    });
    expect(res.status).toBe(401);
    const body = (await res.json()) as { status: string };
    expect(body.status).toBe('auth_failed');
  });
});
