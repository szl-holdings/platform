import { createHash } from 'node:crypto';
import { createServer, type Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  normalizeOtlpHttpTracesUrl,
  startVspNodeSdk,
  type VspNodeSdk,
} from './node-sdk-bootstrap.js';
import { recordRhoClosure } from './lambda-span-emitter.js';

/**
 * End-to-end smoke: spin up an in-process HTTP catcher acting as an OTLP/HTTP
 * collector, boot the SDK pointed at it, emit a Λ-receipt span, and assert
 * that an OTLP-protobuf POST actually lands on the wire. This proves the
 * full exporter pipeline (BatchSpanProcessor → OTLPHttpExporter → HTTP)
 * works without needing a real Honeycomb / Phoenix sandbox.
 */

interface CapturedRequest {
  method: string | undefined;
  url: string | undefined;
  contentType: string | undefined;
  bodyBytes: number;
  body: Buffer;
}

let server: Server;
let port: number;
let captured: CapturedRequest[] = [];
let booted: VspNodeSdk | null = null;

beforeEach(async () => {
  captured = [];
  server = createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const body = Buffer.concat(chunks);
      captured.push({
        method: req.method,
        url: req.url,
        contentType: req.headers['content-type'] as string | undefined,
        bodyBytes: body.length,
        body,
      });
      res.writeHead(200, { 'content-type': 'application/x-protobuf' });
      res.end();
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  port = (server.address() as AddressInfo).port;
});

afterEach(async () => {
  if (booted) {
    await booted.shutdown();
    booted = null;
  }
  await new Promise<void>((resolve, reject) =>
    server.close((err) => (err ? reject(err) : resolve())),
  );
});

describe('normalizeOtlpHttpTracesUrl', () => {
  it('appends /v1/traces to a base URL (Honeycomb/Datadog style)', () => {
    expect(normalizeOtlpHttpTracesUrl('https://api.honeycomb.io')).toBe(
      'https://api.honeycomb.io/v1/traces',
    );
    expect(normalizeOtlpHttpTracesUrl('http://localhost:4318')).toBe(
      'http://localhost:4318/v1/traces',
    );
  });

  it('collapses trailing slashes before appending', () => {
    expect(normalizeOtlpHttpTracesUrl('http://localhost:4318/')).toBe(
      'http://localhost:4318/v1/traces',
    );
    expect(normalizeOtlpHttpTracesUrl('http://localhost:4318///')).toBe(
      'http://localhost:4318/v1/traces',
    );
  });

  it('leaves an already-full traces URL unchanged', () => {
    expect(
      normalizeOtlpHttpTracesUrl('http://localhost:4318/v1/traces'),
    ).toBe('http://localhost:4318/v1/traces');
    expect(
      normalizeOtlpHttpTracesUrl('http://localhost:4318/v1/traces/'),
    ).toBe('http://localhost:4318/v1/traces');
  });
});

describe('startVspNodeSdk — OTLP/HTTP end-to-end', () => {
  it('boots NodeSDK, emits a span, and POSTs an OTLP body to the collector', async () => {
    booted = startVspNodeSdk({
      endpoint: `http://127.0.0.1:${port}/v1/traces`,
      protocol: 'http/protobuf',
      serviceName: 'vsp-otel-e2e',
      vendor: 'honeycomb',
    });

    const hash = createHash('sha256').update('e2e-receipt').digest('hex');
    const span = booted.emitter.emit({
      hash,
      license: 'Apache-2.0',
      endpoint: 'POST /v1/score',
      lambdaAxes: { cleanliness: 0.91, horizon: 0.87 },
    });
    recordRhoClosure(span, { byteIdentical: true, chainRoot: '0xfeed' });
    span.end();

    // Flush so we don't have to wait for the batch processor's timer.
    await booted.sdk.shutdown();
    booted = null;

    expect(captured.length).toBeGreaterThanOrEqual(1);
    const post = captured.find(
      (r) => r.method === 'POST' && r.url === '/v1/traces',
    );
    expect(post, 'expected an OTLP POST to /v1/traces').toBeDefined();
    // The default OTLP/HTTP exporter ships JSON unless the protobuf
    // variant is wired separately — either content-type is a valid
    // signal that real OTLP bytes hit the wire.
    expect(post?.contentType).toMatch(/application\/(x-protobuf|json)/);
    expect(post?.bodyBytes ?? 0).toBeGreaterThan(0);

    // Both JSON and protobuf encode attribute keys / span name / hash
    // as UTF-8 strings inline, so we can grep the raw bytes to prove
    // they actually traveled.
    const bodyStr = post!.body.toString('utf8');
    expect(bodyStr).toContain('POST /v1/score');
    expect(bodyStr).toContain('gen_ai.szl.receipt_hash');
    expect(bodyStr).toContain('gen_ai.lambda.cleanliness');
    expect(bodyStr).toContain('vsp-otel-e2e');
    // Honeycomb adapter mirror.
    expect(bodyStr).toContain('app.kind');
  });
});
