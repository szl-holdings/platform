import {
  BasicTracerProvider,
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base';
import { beforeEach, describe, expect, it } from 'vitest';

import { LambdaSpanEmitter } from './lambda-span-emitter.js';
import { verifyVspSpan } from './verifier.js';
import {
  _resetVspCoverageForTests,
  getVspCoverageSnapshot,
  recordOtlpExportHealth,
} from './coverage.js';

beforeEach(() => {
  _resetVspCoverageForTests();
});

describe('VSP coverage + end-to-end trace identity', () => {
  it('emits → exports → verifies a span end-to-end with the rho.closure event', async () => {
    const exporter = new InMemorySpanExporter();
    const provider = new BasicTracerProvider({
      spanProcessors: [new SimpleSpanProcessor(exporter)],
    });
    const emitter = new LambdaSpanEmitter({
      tracer: provider.getTracer('e2e'),
    });
    const hash = 'a'.repeat(32) + 'b'.repeat(32);
    const span = emitter.emit(
      {
        hash,
        license: 'Apache-2.0',
        lambdaAxes: { cleanliness: 0.99, horizon: 0.8, gaussClosure: 1 },
      },
      { endImmediately: false },
    );
    span.addEvent('rho.closure', {
      byte_identical: true,
      chain_root: 'c'.repeat(64),
    });
    span.end();
    await provider.forceFlush();

    const exported = exporter.getFinishedSpans();
    expect(exported).toHaveLength(1);
    const sp = exported[0]!;
    expect(sp.spanContext().traceId).toBe(hash.slice(0, 32));
    expect(sp.attributes['gen_ai.szl.receipt_hash']).toBe(hash);
    expect(sp.attributes['gen_ai.lambda.cleanliness']).toBe(0.99);
    expect(sp.attributes['gen_ai.lambda.gaussClosure']).toBe(1);
    const rho = sp.events.find((e) => e.name === 'rho.closure');
    expect(rho).toBeDefined();
    expect(rho?.attributes?.['byte_identical']).toBe(true);
    expect(rho?.attributes?.['chain_root']).toBe('c'.repeat(64));

    const verdict = await verifyVspSpan(sp);
    expect(verdict.ok).toBe(true);
    expect(verdict.status).toBe('verified');
  });

  it('tracks success / failure counts on the coverage snapshot', async () => {
    const provider = new BasicTracerProvider();
    const emitter = new LambdaSpanEmitter({
      tracer: provider.getTracer('coverage'),
    });
    emitter.emit({ hash: '1'.repeat(64), license: 'Apache-2.0' }, { endImmediately: true });
    emitter.emit({ hash: '2'.repeat(64), license: 'MIT' }, { endImmediately: true });
    expect(() =>
      emitter.emit({ hash: 'short', license: 'Apache-2.0' }, { endImmediately: true }),
    ).toThrow();

    const snap = getVspCoverageSnapshot();
    expect(snap.spansEmitted).toBe(2);
    expect(snap.spansFailed).toBe(1);
    expect(snap.spansEmittedLastHour).toBe(2);
    expect(snap.spansFailedLastHour).toBe(1);
    expect(snap.coveragePercentLastHour).toBeCloseTo((2 / 3) * 100, 1);
    expect(snap.lastEmittedAt).not.toBeNull();
    expect(snap.lastFailedAt).not.toBeNull();
    expect(snap.lastError).toContain('hex chars');
  });

  it('reports OTLP export health when recorded externally', () => {
    recordOtlpExportHealth('degraded');
    expect(getVspCoverageSnapshot().otlpExportHealth).toBe('degraded');
    recordOtlpExportHealth('healthy');
    expect(getVspCoverageSnapshot().otlpExportHealth).toBe('healthy');
  });
});
