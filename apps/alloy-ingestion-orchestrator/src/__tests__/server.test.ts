/**
 * AEF Ingestion Orchestrator — HTTP server integration test.
 *
 * Boots the real instrumented Express app (createApp), sends live HTTP requests
 * over a loopback listener, and asserts:
 *   - the three probe endpoints expose liveness and development admission state
 *   - the OTEL span middleware sets a correlatable x-request-id response header
 *   - an http.server span is emitted through the OpenTelemetry pipeline
 *     (middleware → tracer → SimpleSpanProcessor → in-memory exporter), which
 *     the SDK enables in non-production, so no network collector is required.
 *
 * It also covers the OTLP header wire-format parser used to carry backend auth
 * (Grafana Cloud / Azure Monitor) at deploy time.
 */
import { type RequestOptions, request, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { resetEnvCache } from '@szl-holdings/env';
import {
  flushInMemorySpans,
  getInMemorySpans,
  parseOtlpKeyValueList,
} from '@szl-holdings/observability';
import {
  clearApprovalInbox,
  clearPendingApprovalRequests,
  getApprovalForRecommendation,
} from '@workspace/approvals-inbox';
import express from 'express';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { defaultAuditEmitter } from '../audit.js';
import { createOrchestratorRouter } from '../router.js';
import { defaultRunStore } from '../run-store.js';
import { createBearerAuthentication } from '../security.js';
import { createApp } from '../server.js';

let server: Server;
let baseUrl: string;
const API_TOKEN = 'orchestrator-integration-test-only-token';
const ALLOWED_ORIGIN = 'https://console.example.test';

function httpRequest(
  path: string,
  options: {
    method?: string;
    headers?: RequestOptions['headers'];
    body?: unknown;
    targetBaseUrl?: string;
  } = {},
): Promise<{
  status: number;
  body: string;
  headers: Record<string, string | string[] | undefined>;
}> {
  return new Promise((resolve, reject) => {
    const encodedBody = options.body === undefined ? undefined : JSON.stringify(options.body);
    const req = request(
      `${options.targetBaseUrl ?? baseUrl}${path}`,
      {
        method: options.method ?? 'GET',
        headers: {
          ...(encodedBody
            ? {
                'content-type': 'application/json',
                'content-length': Buffer.byteLength(encodedBody),
              }
            : {}),
          ...options.headers,
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => resolve({ status: res.statusCode ?? 0, body, headers: res.headers }));
      },
    );
    req.on('error', reject);
    if (encodedBody) req.write(encodedBody);
    req.end();
  });
}

function httpGet(path: string, headers?: RequestOptions['headers']) {
  return httpRequest(path, { headers });
}

function authenticatedHeaders(tenantId?: string): RequestOptions['headers'] {
  return {
    authorization: `Bearer ${API_TOKEN}`,
    ...(tenantId ? { 'x-tenant-id': tenantId } : {}),
  };
}

beforeAll(async () => {
  // In-memory exporter is enabled because NODE_ENV !== 'production'.
  process.env.NODE_ENV = 'test';
  process.env.OTEL_SERVICE_NAME = 'alloy-ingestion-orchestrator-test';
  process.env.ORCHESTRATOR_API_TOKEN = API_TOKEN;
  process.env.ORCHESTRATOR_AUTH_BYPASS = 'false';
  process.env.ORCHESTRATOR_CORS_ALLOWED_ORIGINS = ALLOWED_ORIGIN;
  process.env.ORCHESTRATOR_API_ACTOR_ID = 'test-operator';
  process.env.ORCHESTRATOR_API_ROLES = 'operator';
  resetEnvCache();
  const app = await createApp();
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => resolve());
  });
  const addr = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${addr.port}`;
});

afterAll(() => {
  server?.close();
});

beforeEach(() => {
  flushInMemorySpans();
  defaultRunStore.clear();
  defaultAuditEmitter.clear();
  clearPendingApprovalRequests();
  clearApprovalInbox();
});

describe('health + readiness probes', () => {
  it('/healthz returns 200 ok', async () => {
    const res = await httpGet('/healthz');
    expect(res.status).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ status: 'ok' });
  });

  it('/readyz returns 200 ready', async () => {
    const res = await httpGet('/readyz');
    expect(res.status).toBe(200);
    expect(JSON.parse(res.body)).toMatchObject({
      ready: true,
      durableState: false,
      promotionState: 'DEVELOPMENT',
    });
  });

  it('/health returns 200 with the service name', async () => {
    const res = await httpGet('/health');
    expect(res.status).toBe(200);
    expect(JSON.parse(res.body)).toEqual({
      status: 'ok',
      service: 'alloy-ingestion-orchestrator',
    });
  });
});

describe('OTEL request instrumentation', () => {
  it('sets a correlatable x-request-id response header', async () => {
    const res = await httpGet('/healthz');
    const id = res.headers['x-request-id'];
    expect(typeof id).toBe('string');
    expect((id as string).length).toBeGreaterThan(0);
  });

  it('emits an http.server span for an incoming request', async () => {
    const before = getInMemorySpans().length;
    const res = await httpGet('/health');
    expect(res.status).toBe(200);

    // Span ends in the response `finish` handler just after the body flushes;
    // poll briefly to avoid a race on slower CI.
    let spans = getInMemorySpans();
    for (let i = 0; i < 20 && spans.length <= before; i += 1) {
      await new Promise((r) => setTimeout(r, 25));
      spans = getInMemorySpans();
    }

    expect(spans.length).toBeGreaterThan(before);
    const httpSpan = spans.find((s) => s.name.startsWith('http.server'));
    expect(httpSpan).toBeDefined();
    expect(httpSpan?.attributes['http.request.method']).toBe('GET');
    expect(httpSpan?.attributes['http.response.status_code']).toBe(200);
    expect(httpSpan?.attributes['url.path']).toBe('/health');
  });
});

describe('OTLP auth header wire-format parsing', () => {
  it('parses comma-separated key=value pairs, preserving base64 padding', () => {
    const headers = parseOtlpKeyValueList('Authorization=Basic dXNlcjpwYXNz=,x-tenant=acme');
    expect(headers.Authorization).toBe('Basic dXNlcjpwYXNz=');
    expect(headers['x-tenant']).toBe('acme');
  });

  it('skips empty / malformed segments', () => {
    expect(Object.keys(parseOtlpKeyValueList(',,=novalue,')).length).toBe(0);
    expect(parseOtlpKeyValueList(undefined)).toEqual({});
  });
});

describe('operational route security', () => {
  it('rejects missing and arbitrary bearer credentials without accepting a tenant', async () => {
    const missing = await httpGet('/orchestrator/v1/runs', { 'x-tenant-id': 'tenant-a' });
    const arbitrary = await httpGet('/orchestrator/v1/runs', {
      authorization: 'Bearer attacker-selected-token',
      'x-tenant-id': 'tenant-a',
    });

    expect(missing.status).toBe(401);
    expect(arbitrary.status).toBe(401);
    expect(JSON.parse(missing.body)).toEqual({
      error: 'Unauthorized',
      code: 'INVALID_BEARER_TOKEN',
    });
    expect(JSON.parse(arbitrary.body)).toEqual(JSON.parse(missing.body));
  });

  it('requires a non-empty tenant header after authentication', async () => {
    const missing = await httpGet('/orchestrator/v1/runs', authenticatedHeaders());
    const blank = await httpGet('/orchestrator/v1/runs', authenticatedHeaders('   '));

    expect(missing.status).toBe(400);
    expect(blank.status).toBe(400);
    expect(JSON.parse(missing.body).code).toBe('TENANT_REQUIRED');
    expect(JSON.parse(blank.body).code).toBe('TENANT_REQUIRED');
  });

  it('uses the advertised path and rejects a body/header tenant mismatch', async () => {
    const mismatch = await httpRequest('/orchestrator/v1/runs', {
      method: 'POST',
      headers: authenticatedHeaders('tenant-a'),
      body: {
        workflowId: 'verify_index_health',
        tenantId: 'tenant-b',
        profileId: 'default',
        input: {},
      },
    });
    expect(mismatch.status).toBe(403);
    expect(JSON.parse(mismatch.body).code).toBe('TENANT_SCOPE_MISMATCH');

    const submitted = await httpRequest('/orchestrator/v1/runs', {
      method: 'POST',
      headers: authenticatedHeaders('tenant-a'),
      body: {
        workflowId: 'verify_index_health',
        tenantId: 'tenant-a',
        profileId: 'default',
        input: {},
      },
    });
    expect(submitted.status).toBe(202);
    const run = JSON.parse(submitted.body) as { runId: string; statusUrl: string };
    expect(run.statusUrl).toBe(`/orchestrator/v1/runs/${run.runId}`);

    const read = await httpGet(run.statusUrl, authenticatedHeaders('tenant-a'));
    const oldDoubledPath = await httpGet(
      `/orchestrator/v1/runs/runs/${run.runId}`,
      authenticatedHeaders('tenant-a'),
    );
    expect(read.status).toBe(200);
    expect(oldDoubledPath.status).toBe(404);
  });

  it('scopes list/read/cancel/approval to the authenticated tenant without existence leaks', async () => {
    const submitted = await httpRequest('/orchestrator/v1/runs', {
      method: 'POST',
      headers: authenticatedHeaders('tenant-a'),
      body: {
        workflowId: 'verify_index_health',
        tenantId: 'tenant-a',
        profileId: 'default',
        input: {},
      },
    });
    const { runId } = JSON.parse(submitted.body) as { runId: string };

    const unknown = await httpGet(
      '/orchestrator/v1/runs/00000000-0000-0000-0000-000000000000',
      authenticatedHeaders('tenant-b'),
    );
    const crossTenantRead = await httpGet(
      `/orchestrator/v1/runs/${runId}`,
      authenticatedHeaders('tenant-b'),
    );
    const crossTenantCancel = await httpRequest(`/orchestrator/v1/runs/${runId}`, {
      method: 'DELETE',
      headers: authenticatedHeaders('tenant-b'),
    });
    const crossTenantApproval = await httpRequest(`/orchestrator/v1/runs/${runId}/approve`, {
      method: 'POST',
      headers: authenticatedHeaders('tenant-b'),
      body: { decision: 'approved' },
    });
    const tenantBList = await httpGet('/orchestrator/v1/runs', authenticatedHeaders('tenant-b'));
    const mismatchedList = await httpGet(
      '/orchestrator/v1/runs?tenantId=tenant-a',
      authenticatedHeaders('tenant-b'),
    );
    const tenantAList = await httpGet('/orchestrator/v1/runs', authenticatedHeaders('tenant-a'));

    expect(unknown.status).toBe(404);
    expect(crossTenantRead.status).toBe(404);
    expect(crossTenantCancel.status).toBe(404);
    expect(crossTenantApproval.status).toBe(404);
    expect(JSON.parse(crossTenantRead.body)).toEqual(JSON.parse(unknown.body));
    expect(JSON.parse(crossTenantCancel.body)).toEqual(JSON.parse(unknown.body));
    expect(JSON.parse(crossTenantApproval.body)).toEqual(JSON.parse(unknown.body));
    expect(JSON.parse(tenantBList.body)).toEqual({ runs: [], total: 0 });
    expect(mismatchedList.status).toBe(403);
    expect(JSON.parse(tenantAList.body).runs).toHaveLength(1);
  });

  it('denies unlisted origins and emits CORS headers only for an allowed origin', async () => {
    const denied = await httpGet('/health', { origin: 'https://attacker.example' });
    const allowed = await httpGet('/health', { origin: ALLOWED_ORIGIN });
    const sameOrigin = await httpGet('/health');

    expect(denied.status).toBe(403);
    expect(denied.headers['access-control-allow-origin']).toBeUndefined();
    expect(allowed.status).toBe(200);
    expect(allowed.headers['access-control-allow-origin']).toBe(ALLOWED_ORIGIN);
    expect(sameOrigin.status).toBe(200);
    expect(sameOrigin.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('binds approvals to the pending request and verified operator identity', async () => {
    const submitted = await httpRequest('/orchestrator/v1/runs', {
      method: 'POST',
      headers: authenticatedHeaders('tenant-a'),
      body: {
        workflowId: 'rebuild_index',
        tenantId: 'tenant-a',
        profileId: 'default',
        input: {},
      },
    });
    expect(submitted.status).toBe(202);
    const pending = JSON.parse(submitted.body) as {
      runId: string;
      approvalRequestId: string;
    };

    const spoof = await httpRequest(`/orchestrator/v1/runs/${pending.runId}/approve`, {
      method: 'POST',
      headers: authenticatedHeaders('tenant-a'),
      body: {
        approvalRequestId: pending.approvalRequestId,
        decision: 'approved',
        actorId: 'spoofed-executive',
      },
    });
    expect(spoof.status).toBe(400);

    const wrongRequest = await httpRequest(`/orchestrator/v1/runs/${pending.runId}/approve`, {
      method: 'POST',
      headers: authenticatedHeaders('tenant-a'),
      body: { approvalRequestId: 'wrong-request', decision: 'approved' },
    });
    expect(wrongRequest.status).toBe(404);
    expect(JSON.parse(wrongRequest.body).code).toBe('APPROVAL_NOT_FOUND');

    const serviceApp = express();
    serviceApp.use(
      '/orchestrator',
      createOrchestratorRouter({
        authenticate: createBearerAuthentication({
          apiToken: 'service-role-test-only-token',
          authorizedTenantId: 'tenant-a',
          principal: { actorId: 'test-service', roles: ['service'] },
          bypass: false,
        }),
      }),
    );
    const serviceServer = await new Promise<Server>((resolve) => {
      const listening = serviceApp.listen(0, () => resolve(listening));
    });
    try {
      const address = serviceServer.address() as AddressInfo;
      const unauthorizedRole = await httpRequest(`/orchestrator/v1/runs/${pending.runId}/approve`, {
        method: 'POST',
        targetBaseUrl: `http://127.0.0.1:${address.port}`,
        headers: {
          authorization: 'Bearer service-role-test-only-token',
          'x-tenant-id': 'tenant-a',
        },
        body: {
          approvalRequestId: pending.approvalRequestId,
          decision: 'approved',
        },
      });
      expect(unauthorizedRole.status).toBe(403);
      expect(JSON.parse(unauthorizedRole.body).code).toBe('APPROVAL_ROLE_REQUIRED');
    } finally {
      await new Promise<void>((resolve, reject) => {
        serviceServer.close((error) => (error ? reject(error) : resolve()));
      });
    }

    const approved = await httpRequest(`/orchestrator/v1/runs/${pending.runId}/approve`, {
      method: 'POST',
      headers: authenticatedHeaders('tenant-a'),
      body: {
        approvalRequestId: pending.approvalRequestId,
        decision: 'approved',
        note: 'verified operator decision',
      },
    });
    expect(approved.status).toBe(200);
    expect(JSON.parse(approved.body)).toMatchObject({
      runId: pending.runId,
      approvalRequestId: pending.approvalRequestId,
      status: 'completed',
    });
    expect(getApprovalForRecommendation(pending.approvalRequestId)?.actor).toBe('test-operator');
    expect(
      defaultAuditEmitter.list(pending.runId).find((event) => event.kind === 'approval.granted')
        ?.payload.actorId,
    ).toBe('test-operator');
  });
});
