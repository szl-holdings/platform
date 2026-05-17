/**
 * Task #5053 — Wire orchestration proofs into Λ-receipt span emission.
 *
 * Verifies the full `appendProof` → VSP span path: every proof that flows
 * through the orchestration store produces exactly one OTel span whose
 * traceId is the SHA-256-derived receipt traceId, and whose attributes
 * carry the proof identity plus any Λ-axis scores supplied in the payload.
 *
 * Uses a real OTel SDK in-memory harness (BasicTracerProvider +
 * InMemorySpanExporter) registered globally so the orchestration-store
 * module — which builds its tracer at module load via
 * `trace.getTracer('a11oy-orchestration')` — picks it up.
 */

import { createHash } from 'node:crypto';
import { trace } from '@opentelemetry/api';
import {
  BasicTracerProvider,
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { LambdaSpanEmitter } from '@szl-holdings/vsp-otel';
import { logger } from '../../lib/logger';

let exporter: InMemorySpanExporter;
let provider: BasicTracerProvider;

beforeAll(() => {
  exporter = new InMemorySpanExporter();
  provider = new BasicTracerProvider({
    spanProcessors: [new SimpleSpanProcessor(exporter)],
  });
  // Register globally so that `trace.getTracer('a11oy-orchestration')` —
  // invoked at orchestration-store module load — resolves to this provider.
  trace.setGlobalTracerProvider(provider);
});

beforeEach(() => {
  exporter.reset();
});

afterEach(async () => {
  const { __resetForTests } = await import('../orchestration-store');
  __resetForTests();
});

function canonicalReceiptHash(entry: {
  id: string;
  product: string;
  kind: string;
  summary: string;
  deepLink?: string;
  relatedProduct?: string;
  ts: string;
}, modelUsed: string | undefined): string {
  const canonical = JSON.stringify({
    id: entry.id,
    product: entry.product,
    kind: entry.kind,
    summary: entry.summary,
    deepLink: entry.deepLink ?? null,
    relatedProduct: entry.relatedProduct ?? null,
    modelUsed: modelUsed ?? null,
    ts: entry.ts,
  });
  return createHash('sha256').update(canonical).digest('hex');
}

describe('orchestration-store → VSP span bridge', () => {
  it('emits exactly one span per appendProof, with the receipt-derived traceId', async () => {
    const { appendProof } = await import('../orchestration-store');

    const entry = appendProof({
      product: 'sentra',
      kind: 'recommendation_emitted',
      summary: 'block egress from compromised host',
    });

    const finished = exporter.getFinishedSpans();
    expect(finished).toHaveLength(1);
    const span = finished[0];

    const expectedHash = canonicalReceiptHash(entry, undefined);
    const expectedTraceId = expectedHash.slice(0, 32);
    expect(span.spanContext().traceId).toBe(expectedTraceId);
    expect(span.name).toBe('a11oy.proof.recommendation_emitted');

    expect(span.attributes['gen_ai.szl.receipt_hash']).toBe(expectedHash);
    expect(span.attributes['gen_ai.szl.trace_id']).toBe(expectedTraceId);
    expect(span.attributes['gen_ai.szl.license']).toBe('Apache-2.0');
    expect(span.attributes['a11oy.proof.id']).toBe(entry.id);
    expect(span.attributes['a11oy.product']).toBe('sentra');
    expect(span.attributes['a11oy.proof.kind']).toBe('recommendation_emitted');
    expect(span.attributes['a11oy.proof.summary']).toBe(
      'block egress from compromised host',
    );
  });

  it('stamps related_product, deep_link, model_used and Λ-axis attributes when present', async () => {
    const { appendProof } = await import('../orchestration-store');

    const entry = appendProof({
      product: 'counsel',
      kind: 'cross_product_handoff',
      summary: 'route NDA breach to Sentra forensics',
      deepLink: '/counsel/matters/m-42',
      relatedProduct: 'sentra',
      modelUsed: 'claude-sonnet-4-5',
      payload: {
        lambdaAxes: {
          cleanliness: 0.93,
          horizon: 0.81,
          moralGrounding: 0.97,
          // ignored — not a finite number:
          invariance: Number.NaN,
          // ignored — not on the axis allowlist:
          bogus: 0.5,
        },
      },
    });

    const finished = exporter.getFinishedSpans();
    expect(finished).toHaveLength(1);
    const attrs = finished[0].attributes;

    expect(attrs['a11oy.proof.id']).toBe(entry.id);
    expect(attrs['a11oy.related_product']).toBe('sentra');
    expect(attrs['a11oy.deep_link']).toBe('/counsel/matters/m-42');
    expect(attrs['a11oy.model_used']).toBe('claude-sonnet-4-5');

    expect(attrs['gen_ai.lambda.cleanliness']).toBe(0.93);
    expect(attrs['gen_ai.lambda.horizon']).toBe(0.81);
    expect(attrs['gen_ai.lambda.moralGrounding']).toBe(0.97);
    expect(attrs['gen_ai.lambda.invariance']).toBeUndefined();
    expect(attrs['gen_ai.lambda.bogus']).toBeUndefined();
  });

  it('never throws from the hot path when span emission fails (fire-and-forget)', async () => {
    const { appendProof } = await import('../orchestration-store');

    // A receipt whose `lambdaAxes` payload is malformed shouldn't break
    // anything — the emitter just skips axes and continues. Likewise,
    // emitProofSpan's try/catch must guarantee appendProof returns the
    // entry even if the OTel pipeline misbehaves.
    expect(() =>
      appendProof({
        product: 'amaru',
        kind: 'action_executed',
        summary: 'rotate vault token',
        payload: { lambdaAxes: 'not-an-object' as unknown as Record<string, number> },
      }),
    ).not.toThrow();

    const finished = exporter.getFinishedSpans();
    expect(finished).toHaveLength(1);
    expect(finished[0].attributes['gen_ai.szl.license']).toBe('Apache-2.0');
  });

  it('swallows + logs hard emitter failures so appendProof still returns the entry', async () => {
    const { appendProof } = await import('../orchestration-store');

    // Force the underlying emitter to throw on every emit. The
    // orchestration store's try/catch must catch this, log a warning,
    // and let appendProof return the entry normally.
    const emitSpy = vi
      .spyOn(LambdaSpanEmitter.prototype, 'emit')
      .mockImplementation(() => {
        throw new Error('synthetic emitter failure');
      });
    const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});

    try {
      const entry = appendProof({
        product: 'vessels',
        kind: 'signal_ingested',
        summary: 'AIS gap detected',
      });

      expect(entry.id).toMatch(/^pf-/);
      expect(entry.product).toBe('vessels');
      // No spans should have reached the exporter, because emit threw.
      expect(exporter.getFinishedSpans()).toHaveLength(0);

      // The swallowed failure must surface as a warning so operators can
      // see emission going dark instead of silently disappearing.
      expect(warnSpy).toHaveBeenCalled();
      const warnPayloads = warnSpy.mock.calls.map((c) => c[0]);
      expect(
        warnPayloads.some(
          (p) =>
            p &&
            typeof p === 'object' &&
            (p as { proofId?: string }).proofId === entry.id,
        ),
      ).toBe(true);
    } finally {
      emitSpy.mockRestore();
      warnSpy.mockRestore();
    }
  });

  it('produces one span per proof across a multi-proof handoff chain', async () => {
    const { appendProof } = await import('../orchestration-store');

    appendProof({ product: 'sentra', kind: 'signal_ingested', summary: 's1' });
    appendProof({ product: 'sentra', kind: 'recommendation_emitted', summary: 's2' });
    appendProof({
      product: 'counsel',
      kind: 'cross_product_handoff',
      summary: 's3',
      relatedProduct: 'amaru',
    });
    appendProof({ product: 'amaru', kind: 'action_executed', summary: 's4' });

    const finished = exporter.getFinishedSpans();
    expect(finished).toHaveLength(4);

    const products = finished.map((s) => s.attributes['a11oy.product']);
    expect(products).toEqual(['sentra', 'sentra', 'counsel', 'amaru']);

    // Every span must carry a non-empty, distinct traceId derived from its
    // own receipt hash.
    const traceIds = new Set(finished.map((s) => s.spanContext().traceId));
    expect(traceIds.size).toBe(4);
    for (const id of traceIds) {
      expect(id).toMatch(/^[0-9a-f]{32}$/);
    }
  });
});
