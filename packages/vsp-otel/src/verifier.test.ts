import { createHash } from 'node:crypto';
import {
  BasicTracerProvider,
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base';
import { beforeEach, describe, expect, it } from 'vitest';

import { LambdaSpanEmitter } from './lambda-span-emitter.js';
import { verifyVspSpan } from './verifier.js';

let exporter: InMemorySpanExporter;
let provider: BasicTracerProvider;
let emitter: LambdaSpanEmitter;

beforeEach(() => {
  exporter = new InMemorySpanExporter();
  provider = new BasicTracerProvider({
    spanProcessors: [new SimpleSpanProcessor(exporter)],
  });
  emitter = new LambdaSpanEmitter({ tracer: provider.getTracer('vsp-verifier-test') });
});

function fakeHash(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

describe('verifyVspSpan', () => {
  it('returns ok=true for a well-formed emitted span (no remote API)', async () => {
    const hash = fakeHash('verifier-A');
    const span = emitter.emit({ hash, license: 'Apache-2.0' }, { endImmediately: true });
    const verdict = await verifyVspSpan(span);
    expect(verdict.ok).toBe(true);
    expect(verdict.status).toBe('verified');
    expect(verdict.receiptHash).toBe(hash);
    expect(verdict.traceId).toBe(hash.slice(0, 32));
    expect(verdict.expectedTraceId).toBe(hash.slice(0, 32));
    expect(verdict.license).toBe('Apache-2.0');
  });

  it('flags trace_id_mismatch when traceId does not match the receipt', async () => {
    const hash = fakeHash('verifier-B');
    const verdict = await verifyVspSpan({
      spanContext: () => ({ traceId: '0'.repeat(31) + '1' }),
      attributes: {
        'gen_ai.szl.receipt_hash': hash,
        'gen_ai.szl.license': 'Apache-2.0',
      },
    });
    expect(verdict.ok).toBe(false);
    expect(verdict.status).toBe('trace_id_mismatch');
  });

  it('flags missing_receipt_hash when the span is empty', async () => {
    const verdict = await verifyVspSpan({
      spanContext: () => ({ traceId: '0'.repeat(32) }),
      attributes: {},
    });
    expect(verdict.ok).toBe(false);
    expect(verdict.status).toBe('missing_receipt_hash');
  });

  it('accepts OTLP/JSON record shape with KeyValue attributes', async () => {
    const hash = fakeHash('verifier-C');
    const verdict = await verifyVspSpan({
      traceId: hash.slice(0, 32),
      attributes: [
        { key: 'gen_ai.szl.receipt_hash', value: { stringValue: hash } },
        { key: 'gen_ai.szl.license', value: { stringValue: 'MIT' } },
      ],
    });
    expect(verdict.ok).toBe(true);
    expect(verdict.license).toBe('MIT');
  });

  it('flags license_not_allowlisted when an unknown license is stamped', async () => {
    const hash = fakeHash('verifier-D');
    const verdict = await verifyVspSpan({
      traceId: hash.slice(0, 32),
      attributes: {
        'gen_ai.szl.receipt_hash': hash,
        'gen_ai.szl.license': 'GPL-3.0',
      },
    });
    expect(verdict.ok).toBe(false);
    expect(verdict.status).toBe('license_not_allowlisted');
  });

  it('calls the remote verifyApi when supplied and merges its verdict', async () => {
    const hash = fakeHash('verifier-E');
    const span = emitter.emit({ hash, license: 'Apache-2.0' }, { endImmediately: true });
    const fetchImpl = (async () => ({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, details: { chainRoot: '0xabc' } }),
    })) as unknown as typeof fetch;
    const verdict = await verifyVspSpan(span, {
      verifyApi: 'https://example.test/proof/verify',
      fetchImpl,
    });
    expect(verdict.ok).toBe(true);
    expect(verdict.remote?.ok).toBe(true);
    expect(verdict.remote?.details).toEqual({ chainRoot: '0xabc' });
  });

  it('reports remote_verification_failed on HTTP errors', async () => {
    const hash = fakeHash('verifier-F');
    const span = emitter.emit({ hash, license: 'Apache-2.0' }, { endImmediately: true });
    const fetchImpl = (async () => ({
      ok: false,
      status: 503,
      json: async () => ({}),
    })) as unknown as typeof fetch;
    const verdict = await verifyVspSpan(span, {
      verifyApi: 'https://example.test/proof/verify',
      fetchImpl,
    });
    expect(verdict.ok).toBe(false);
    expect(verdict.status).toBe('remote_verification_failed');
    expect(verdict.remote?.details).toEqual({ httpStatus: 503 });
  });
});
