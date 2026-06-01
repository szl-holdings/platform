/**
 * AEF Ingestion Orchestrator — HTTP server integration test.
 *
 * Boots the real instrumented Express app (createApp), sends live HTTP requests
 * over a loopback listener, and asserts:
 *   - the three probe endpoints (/healthz, /readyz, /health) return 200 + shape
 *   - the OTEL span middleware sets a correlatable x-request-id response header
 *   - an http.server span is emitted through the OpenTelemetry pipeline
 *     (middleware → tracer → SimpleSpanProcessor → in-memory exporter), which
 *     the SDK enables in non-production, so no network collector is required.
 *
 * It also covers the OTLP header wire-format parser used to carry backend auth
 * (Grafana Cloud / Azure Monitor) at deploy time.
 */
import { request } from 'node:http';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { resetEnvCache } from '@szl-holdings/env';
import {
  flushInMemorySpans,
  getInMemorySpans,
  parseOtlpKeyValueList,
} from '@szl-holdings/observability';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../server.js';

let server: Server;
let baseUrl: string;

function httpGet(
  path: string,
): Promise<{ status: number; body: string; headers: Record<string, string | string[] | undefined> }> {
  return new Promise((resolve, reject) => {
    const req = request(`${baseUrl}${path}`, { method: 'GET' }, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () =>
        resolve({ status: res.statusCode ?? 0, body, headers: res.headers }),
      );
    });
    req.on('error', reject);
    req.end();
  });
}

beforeAll(async () => {
  // In-memory exporter is enabled because NODE_ENV !== 'production'.
  process.env.NODE_ENV = 'test';
  process.env.OTEL_SERVICE_NAME = 'alloy-ingestion-orchestrator-test';
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
    expect(JSON.parse(res.body)).toEqual({ ready: true });
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
