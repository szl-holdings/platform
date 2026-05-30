/**
 * Integration test for the OTEL exporter wiring (P1-A / KG009).
 *
 * Boots the real instrumented Express app, sends a live HTTP request, and
 * asserts that a span is emitted by the OpenTelemetry pipeline. The SDK enables
 * an in-memory span exporter in non-production, which lets this test verify the
 * full path — middleware → tracer → span processor → exporter — without a
 * network collector. It also verifies the env-driven OTLP header parsing used
 * to authenticate against Grafana Cloud / Azure Monitor at deploy time.
 */
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { request } from 'node:http';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { flushInMemorySpans, getInMemorySpans } from '@szl-holdings/observability';
import { parseOtlpKeyValueList } from '@szl-holdings/observability';
import { resetEnvCache } from '@szl-holdings/env';
import { createApp } from './server.js';

let server: Server;
let baseUrl: string;

function httpGet(url: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = request(url, { method: 'GET' }, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => resolve({ status: res.statusCode ?? 0, body }));
    });
    req.on('error', reject);
    req.end();
  });
}

beforeAll(async () => {
  // In-memory exporter is enabled because NODE_ENV !== 'production'.
  process.env.NODE_ENV = 'test';
  process.env.OTEL_SERVICE_NAME = 'alloy-runtime-api-test';
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

describe('OTEL exporter wiring (P1-A / KG009)', () => {
  it('emits a span for an incoming request', async () => {
    const before = getInMemorySpans().length;
    const res = await httpGet(`${baseUrl}/health`);
    expect(res.status).toBe(200);

    // Span export is synchronous via SimpleSpanProcessor for the in-memory
    // exporter, but the response `finish` handler ends the span just after the
    // body flushes — poll briefly to avoid a race on slower CI.
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

  it('parses OTLP auth headers from the env wire format', () => {
    // Grafana Cloud style basic-auth token: value contains base64 padding (=).
    const headers = parseOtlpKeyValueList('Authorization=Basic dXNlcjpwYXNz=,x-tenant=acme');
    expect(headers.Authorization).toBe('Basic dXNlcjpwYXNz=');
    expect(headers['x-tenant']).toBe('acme');
    // Empty / malformed segments are skipped.
    expect(Object.keys(parseOtlpKeyValueList(',,=novalue,')).length).toBe(0);
    expect(parseOtlpKeyValueList(undefined)).toEqual({});
  });
});
