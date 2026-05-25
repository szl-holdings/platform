/**
 * Integration test: prove the proof-chain → VSP emitter → SDK exporter →
 * verifier round-trip works end-to-end without touching the database.
 *
 * Exercises the wiring an api-server / MCP gateway uses at boot:
 *   1. install a `LambdaSpanEmitter` via `setVspProofEmitter`
 *   2. call `emitVspProofSpan(receipt)` (the same call `tagAIContent` makes)
 *   3. assert: span is exported, traceId == receipt_hash[:32], ρ-closure
 *      event present, verifier returns ok=true, coverage snapshot
 *      incremented.
 */

import { createHash } from 'node:crypto';
import {
  BasicTracerProvider,
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base';
import {
  emitVspProofSpan,
  setVspProofEmitter,
} from '@szl-holdings/proof-chain';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { LambdaSpanEmitter } from './lambda-span-emitter.js';
import { verifyVspSpan } from './verifier.js';
import {
  _resetVspCoverageForTests,
  getVspCoverageSnapshot,
} from './coverage.js';

let exporter: InMemorySpanExporter;
let provider: BasicTracerProvider;
let emitter: LambdaSpanEmitter;

beforeEach(() => {
  _resetVspCoverageForTests();
  exporter = new InMemorySpanExporter();
  provider = new BasicTracerProvider({
    spanProcessors: [new SimpleSpanProcessor(exporter)],
  });
  emitter = new LambdaSpanEmitter({
    tracer: provider.getTracer('proof-chain-integration'),
  });
  setVspProofEmitter(emitter);
});

afterEach(() => {
  setVspProofEmitter(null);
});

describe('proof-chain → VSP integration', () => {
  it('emits a verifiable span for a receipt and increments coverage', async () => {
    const hash = createHash('sha256').update('integration-receipt-1').digest('hex');
    const emitted = emitVspProofSpan({
      hash,
      license: 'Apache-2.0',
      name: 'lambda_gate.test',
      endpoint: 'lambda_gate.test',
      lambdaAxes: {
        cleanliness: 0.97,
        horizon: 0.81,
        gaussClosure: 1,
        invariance: 0.92,
      },
      rhoClosure: { byteIdentical: true, chainRoot: 'd'.repeat(64) },
    });
    expect(emitted).toBe(true);

    await provider.forceFlush();
    const spans = exporter.getFinishedSpans();
    expect(spans).toHaveLength(1);
    const sp = spans[0]!;

    // Trace identity contract: traceId === receipt_hash[:32]
    expect(sp.spanContext().traceId).toBe(hash.slice(0, 32));
    expect(sp.attributes['gen_ai.szl.receipt_hash']).toBe(hash);
    expect(sp.attributes['gen_ai.szl.license']).toBe('Apache-2.0');

    // 9-axis attributes
    expect(sp.attributes['gen_ai.lambda.cleanliness']).toBe(0.97);
    expect(sp.attributes['gen_ai.lambda.invariance']).toBe(0.92);

    // ρ-closure span event
    const rho = sp.events.find((e) => e.name === 'rho.closure');
    expect(rho).toBeDefined();
    expect(rho?.attributes?.['byte_identical']).toBe(true);
    expect(rho?.attributes?.['chain_root']).toBe('d'.repeat(64));

    // Verifier accepts the span
    const verdict = await verifyVspSpan(sp);
    expect(verdict.ok).toBe(true);
    expect(verdict.status).toBe('verified');
    expect(verdict.traceId).toBe(hash.slice(0, 32));

    // Coverage snapshot incremented
    const snap = getVspCoverageSnapshot();
    expect(snap.spansEmitted).toBe(1);
    expect(snap.spansEmittedLastHour).toBe(1);
    expect(snap.coveragePercentLastHour).toBe(100);
  });

  it('returns false (no-op) when no emitter is installed', () => {
    setVspProofEmitter(null);
    const ok = emitVspProofSpan({
      hash: 'e'.repeat(64),
      license: 'Apache-2.0',
    });
    expect(ok).toBe(false);
  });

  it('counts emitter failures in the coverage snapshot', () => {
    const ok = emitVspProofSpan({
      hash: 'short',
      license: 'Apache-2.0',
    });
    // emitVspProofSpan swallows the emitter's throw and returns false
    expect(ok).toBe(false);
    const snap = getVspCoverageSnapshot();
    expect(snap.spansFailed).toBe(1);
    expect(snap.lastError).toContain('hex chars');
  });
});
