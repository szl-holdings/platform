/**
 * Agent Gateway — HTTP server smoke test.
 *
 * Spins up the real Node http server on an ephemeral port, makes real
 * HTTP requests, and verifies all four endpoints behave correctly.
 *
 * This is the deployment readiness test for #4606: it proves the gateway
 * is a runnable HTTP service without depending on a workflow runner.
 */

import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { issueToken } from '../src/auth.js';
import { createServer } from '../src/server.js';
import type { GatewayConfig } from '../src/types.js';

let server: ReturnType<typeof createServer>;
let baseUrl: string;
const config: GatewayConfig = {
  jwt: { algorithm: 'HS256', secret: 'smoke-test-secret-do-not-use' },
  opaEndpoint: 'local',
  temporalEndpoint: 'local',
  openAiApiKey: 'local',
  approvalWorkflow: null,
  evidenceLedger: null,
  auditLogPath: '/tmp/agent-gateway-smoke-audit.ndjson',
  approvalTimeoutMs: 5000,
};

beforeAll(async () => {
  server = createServer(config);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const addr = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${addr.port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe('Agent Gateway HTTP server — deployment smoke test', () => {
  it('GET /health returns 200 with status ok', async () => {
    const res = await fetch(`${baseUrl}/health`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ status: 'ok', service: 'agent-gateway' });
    expect(body.timestamp).toBeTruthy();
  });

  it('GET /ready returns 200 with status ready', async () => {
    const res = await fetch(`${baseUrl}/ready`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ready');
  });

  it('GET /ready fails closed when a live dependency is unreachable', async () => {
    const degradedServer = createServer({
      ...config,
      temporalEndpoint: '127.0.0.1:0',
    });
    await new Promise<void>((resolve) => degradedServer.listen(0, '127.0.0.1', resolve));
    const address = degradedServer.address() as AddressInfo;
    try {
      const res = await fetch(`http://127.0.0.1:${address.port}/ready`);
      expect(res.status).toBe(503);
      const body = await res.json();
      expect(body).toMatchObject({
        status: 'not_ready',
        mode: 'live',
        dependencies: { opa: true, temporal: false },
      });
    } finally {
      await new Promise<void>((resolve) => degradedServer.close(() => resolve()));
    }
  });

  it('GET /v1/capabilities returns allowed and forbidden lists', async () => {
    const res = await fetch(`${baseUrl}/v1/capabilities`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.allowed)).toBe(true);
    expect(Array.isArray(body.forbidden)).toBe(true);
    expect(body.allowed).toContain('inspect_code');
    expect(body.forbidden).toContain('direct_prod_change');
  });

  it('POST /v1/agent/action returns 400 when required fields are missing', async () => {
    const res = await fetch(`${baseUrl}/v1/agent/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.message).toMatch(/Missing required fields/);
  });

  it('POST /v1/agent/action never defaults a missing targetEnvironment', async () => {
    const res = await fetch(`${baseUrl}/v1/agent/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        capability: 'inspect_code',
        target: 'api-server',
        domain: 'vessels',
      }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.message).toMatch(/targetEnvironment/);
  });

  it('POST /v1/agent/action rejects an unknown targetEnvironment', async () => {
    const res = await fetch(`${baseUrl}/v1/agent/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        capability: 'inspect_code',
        target: 'api-server',
        domain: 'vessels',
        targetEnvironment: 'qa',
      }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.message).toMatch(/development, staging, or production/);
  });

  it('POST /v1/agent/action returns 403 forbidden for direct_prod_change before auth runs', async () => {
    const res = await fetch(`${baseUrl}/v1/agent/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        capability: 'direct_prod_change',
        target: 'prod-db',
        domain: 'vessels',
        targetEnvironment: 'production',
      }),
    });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.status).toBe('forbidden');
  });

  it('POST /v1/agent/action returns 401 auth_failed when Authorization header missing', async () => {
    const res = await fetch(`${baseUrl}/v1/agent/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        capability: 'inspect_code',
        target: 'api-server',
        domain: 'vessels',
        targetEnvironment: 'development',
      }),
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.status).toBe('auth_failed');
  });

  it('POST /v1/agent/action returns 200 success on happy path with valid token', async () => {
    const token = await issueToken(
      {
        sub: 'eng@szl.io',
        role: 'platform-engineer',
        groups: ['platform-team'],
        orgId: 'szl-holdings',
      },
      config.jwt.algorithm === 'HS256' ? config.jwt.secret : '',
    );
    const res = await fetch(`${baseUrl}/v1/agent/action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        capability: 'inspect_code',
        target: 'api-server',
        domain: 'vessels',
        targetEnvironment: 'development',
      }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('success');
    expect(body.auditId).toBeTruthy();
    expect(body.correlationId).toBeTruthy();
  });

  it('GET /unknown returns 404', async () => {
    const res = await fetch(`${baseUrl}/this-route-does-not-exist`);
    expect(res.status).toBe(404);
  });

  it('correlation-id from request header is preserved in response', async () => {
    const correlationId = '11111111-2222-3333-4444-555555555555';
    const res = await fetch(`${baseUrl}/v1/agent/action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-correlation-id': correlationId,
      },
      body: JSON.stringify({
        capability: 'direct_prod_change',
        target: 'db',
        domain: 'vessels',
        targetEnvironment: 'production',
      }),
    });
    const body = await res.json();
    expect(body.correlationId).toBe(correlationId);
  });
});
