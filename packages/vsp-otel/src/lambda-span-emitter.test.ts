import { createHash } from 'node:crypto';
import {
  BasicTracerProvider,
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  LambdaSpanEmitter,
  VSP_LICENSE_ALLOWLIST,
  type VspLicense,
  deriveTraceIdFromReceiptHash,
  recordRhoClosure,
} from './lambda-span-emitter.js';

/**
 * Real OTel SDK harness: BasicTracerProvider + InMemorySpanExporter.
 * This validates actual OTel semantics — spanContext().traceId inheritance
 * from the parent context, and the post-end event-discard contract.
 */
let exporter: InMemorySpanExporter;
let provider: BasicTracerProvider;
let emitter: LambdaSpanEmitter;

beforeEach(() => {
  exporter = new InMemorySpanExporter();
  provider = new BasicTracerProvider({
    spanProcessors: [new SimpleSpanProcessor(exporter)],
  });
  emitter = new LambdaSpanEmitter({ tracer: provider.getTracer('vsp-otel-test') });
});

function fakeHash(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

describe('LambdaSpanEmitter', () => {
  it("span.spanContext().traceId equals receiptHash.slice(0, 32)", () => {
    const hash = fakeHash('receipt-A');
    const span = emitter.emit({ hash, license: 'Apache-2.0' }, { endImmediately: true });

    const expected = hash.slice(0, 32);
    // Verify both the SDK-assigned span context AND the side-channel attr.
    expect(span.spanContext().traceId).toBe(expected);
    expect(emitter.lastTraceId).toBe(expected);
    expect(deriveTraceIdFromReceiptHash(hash)).toBe(expected);

    const finished = exporter.getFinishedSpans();
    expect(finished).toHaveLength(1);
    expect(finished[0].spanContext().traceId).toBe(expected);
    expect(finished[0].attributes['gen_ai.szl.receipt_hash']).toBe(hash);
    expect(finished[0].attributes['gen_ai.szl.trace_id']).toBe(expected);
  });

  it('emits all nine Λ axes as `gen_ai.lambda.<axis>` attributes when present', () => {
    const hash = fakeHash('receipt-B');
    emitter.emit(
      {
        hash,
        license: 'MIT',
        lambdaAxes: {
          cleanliness: 0.95,
          horizon: 0.9,
          resonance: 0.85,
          frustum: 0.88,
          gaussClosure: 0.9,
          invariance: 0.92,
          moralGrounding: 0.85,
          ontologicalGrounding: 0.8,
          measurabilityHonesty: 0.9,
        },
      },
      { endImmediately: true },
    );

    const attrs = exporter.getFinishedSpans()[0]?.attributes ?? {};
    expect(attrs['gen_ai.lambda.cleanliness']).toBe(0.95);
    expect(attrs['gen_ai.lambda.horizon']).toBe(0.9);
    expect(attrs['gen_ai.lambda.resonance']).toBe(0.85);
    expect(attrs['gen_ai.lambda.frustum']).toBe(0.88);
    expect(attrs['gen_ai.lambda.gaussClosure']).toBe(0.9);
    expect(attrs['gen_ai.lambda.invariance']).toBe(0.92);
    expect(attrs['gen_ai.lambda.moralGrounding']).toBe(0.85);
    expect(attrs['gen_ai.lambda.ontologicalGrounding']).toBe(0.8);
    expect(attrs['gen_ai.lambda.measurabilityHonesty']).toBe(0.9);
  });

  it('records a `rho.closure` event with byte_identical + chain_root payload BEFORE span.end()', () => {
    const hash = fakeHash('receipt-C');
    // Do NOT end immediately — attach the rho.closure event, THEN end.
    const span = emitter.emit({ hash, license: 'BSD-3-Clause' });
    recordRhoClosure(span, { byteIdentical: true, chainRoot: '0xdeadbeef' });
    span.end();

    const finished = exporter.getFinishedSpans();
    expect(finished).toHaveLength(1);
    const events = finished[0].events;
    expect(events).toHaveLength(1);
    expect(events[0].name).toBe('rho.closure');
    expect(events[0].attributes).toEqual({
      byte_identical: true,
      chain_root: '0xdeadbeef',
    });
  });

  it('enforces the license allowlist (Apache-2.0 | MIT | BSD-3-Clause | CC-BY-4.0)', () => {
    const hash = fakeHash('receipt-D');

    for (const license of VSP_LICENSE_ALLOWLIST) {
      expect(() =>
        emitter.emit({ hash, license }, { endImmediately: true }),
      ).not.toThrow();
    }

    const offenders: unknown[] = [
      'GPL-3.0',
      'AGPL-3.0',
      'Proprietary',
      'UNLICENSED',
      '',
      undefined,
      null,
      42,
    ];
    for (const bad of offenders) {
      expect(() =>
        emitter.emit(
          { hash, license: bad as VspLicense },
          { endImmediately: true },
        ),
      ).toThrow(/license/);
    }
  });

  it('rejects invalid receipt hashes (too short, non-hex, missing) to lock the trace-id contract', () => {
    // Too short — must be >= 32 hex chars.
    expect(() =>
      emitter.emit({ hash: 'abc123', license: 'Apache-2.0' }, { endImmediately: true }),
    ).toThrow(/hash/);

    // Non-hex characters in the first 32 chars.
    const nonHex = 'zzzz' + 'a'.repeat(60);
    expect(() =>
      emitter.emit({ hash: nonHex, license: 'Apache-2.0' }, { endImmediately: true }),
    ).toThrow(/hexadecimal/);

    // Neither hash nor selfHash provided.
    expect(() =>
      emitter.emit({ license: 'Apache-2.0' }, { endImmediately: true }),
    ).toThrow(/hash/);

    // Wrong type.
    expect(() =>
      emitter.emit(
        { hash: 12345 as unknown as string, license: 'Apache-2.0' },
        { endImmediately: true },
      ),
    ).toThrow(/hash/);
  });

  it('accepts szl-receipts LambdaReceipt shape (selfHash) interchangeably with hash', () => {
    const selfHash = fakeHash('receipt-E');
    const span = emitter.emit(
      { selfHash, license: 'CC-BY-4.0', endpoint: 'POST /v1/foo' },
      { endImmediately: true },
    );

    expect(span.spanContext().traceId).toBe(selfHash.slice(0, 32));
    expect(emitter.lastTraceId).toBe(selfHash.slice(0, 32));
    expect(exporter.getFinishedSpans()[0]?.attributes['gen_ai.szl.receipt_hash']).toBe(
      selfHash,
    );
  });
});
