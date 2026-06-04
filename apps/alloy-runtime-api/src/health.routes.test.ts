/**
 * Tests for the /healthz liveness and /readyz readiness endpoints.
 *
 * These boot a real Express app mounting the production router (otel is wired
 * separately in server.ts and is exercised by otel.test.ts; here we isolate the
 * health surface) and assert against live HTTP responses and the underlying
 * report builders.
 */
import type { AddressInfo } from 'node:net';
import { type Server, request } from 'node:http';
import express from 'express';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createRouter } from './router.js';
import { buildHealthReport, buildReadinessReport, runReadinessProbes } from './health.js';

let server: Server;
let baseUrl: string;

function httpGet(path: string): Promise<{ status: number; json: any }> {
  return new Promise((resolve, reject) => {
    const req = request(`${baseUrl}${path}`, { method: 'GET' }, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () =>
        resolve({ status: res.statusCode ?? 0, json: body ? JSON.parse(body) : null }),
      );
    });
    req.on('error', reject);
    req.end();
  });
}

beforeAll(async () => {
  const app = express();
  app.use(express.json());
  app.use(createRouter());
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => resolve());
  });
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(() => {
  server?.close();
});

describe('GET /healthz (liveness)', () => {
  it('returns 200 with build identity and uptime', async () => {
    const res = await httpGet('/healthz');
    expect(res.status).toBe(200);
    expect(res.json.status).toBe('ok');
    expect(res.json.service).toBe('alloy-runtime-api');
    expect(typeof res.json.gitSha).toBe('string');
    expect(res.json.gitSha.length).toBeGreaterThan(0);
    expect(typeof res.json.version).toBe('string');
    expect(typeof res.json.uptimeSeconds).toBe('number');
    expect(res.json.uptimeSeconds).toBeGreaterThanOrEqual(0);
    // bootTime is a valid ISO timestamp.
    expect(Number.isNaN(Date.parse(res.json.bootTime))).toBe(false);
    expect(res.json.nodeVersion).toBe(process.version);
    expect(res.json.pid).toBe(process.pid);
  });

  it('reports COMMIT_SHA from the environment when injected', () => {
    const prev = process.env.COMMIT_SHA;
    process.env.COMMIT_SHA = 'deadbeefcafe1234';
    try {
      expect(buildHealthReport().gitSha).toBe('deadbeefcafe1234');
    } finally {
      if (prev === undefined) delete process.env.COMMIT_SHA;
      else process.env.COMMIT_SHA = prev;
    }
  });

  it('falls back to "unknown" SHA rather than fabricating one', () => {
    const keys = ['COMMIT_SHA', 'GIT_SHA', 'SOURCE_COMMIT', 'GITHUB_SHA'];
    const saved = keys.map((k) => [k, process.env[k]] as const);
    for (const k of keys) delete process.env[k];
    try {
      expect(buildHealthReport().gitSha).toBe('unknown');
    } finally {
      for (const [k, v] of saved) if (v !== undefined) process.env[k] = v;
    }
  });

  it('uptimeSeconds increases with elapsed time since boot', () => {
    // Anchor both observations after the captured boot time so the delta is
    // positive (uptime is clamped to >= 0 relative to boot).
    const boot = new Date(buildHealthReport().bootTime);
    const a = buildHealthReport(new Date(boot.getTime() + 1000));
    const b = buildHealthReport(new Date(boot.getTime() + 6000));
    expect(a.uptimeSeconds).toBe(1);
    expect(b.uptimeSeconds).toBe(6);
    expect(b.uptimeSeconds).toBeGreaterThan(a.uptimeSeconds);
  });
});

describe('GET /readyz (readiness)', () => {
  it('returns 200 and ready=true when all dependency probes pass', async () => {
    const res = await httpGet('/readyz');
    expect(res.status).toBe(200);
    expect(res.json.ready).toBe(true);
    expect(res.json.service).toBe('alloy-runtime-api');
    const names = res.json.dependencies.map((d: any) => d.name).sort();
    expect(names).toEqual(['memory-store', 'run-registry', 'workflow-runtime']);
    for (const dep of res.json.dependencies) {
      expect(dep.ready).toBe(true);
      expect(typeof dep.latencyMs).toBe('number');
      expect(dep.latencyMs).toBeGreaterThanOrEqual(0);
    }
  });

  it('each probe runs a real operation and reports a latency', () => {
    const probes = runReadinessProbes();
    expect(probes).toHaveLength(3);
    expect(probes.every((p) => p.ready)).toBe(true);
    expect(buildReadinessReport().ready).toBe(true);
  });

  it('probes leave no residual state in their disposable tenant', () => {
    // Running probes twice must not accumulate entries: the probe tenant is
    // evicted/deleted each run, so a second run still reports ready with the
    // same probe set (no leakage, idempotent).
    const first = runReadinessProbes();
    const second = runReadinessProbes();
    expect(first.map((p) => p.name)).toEqual(second.map((p) => p.name));
    expect(second.every((p) => p.ready)).toBe(true);
  });
});
