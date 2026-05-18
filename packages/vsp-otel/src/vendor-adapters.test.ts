import { createHash } from 'node:crypto';
import {
  BasicTracerProvider,
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base';
import { beforeEach, describe, expect, it } from 'vitest';

import { LambdaSpanEmitter } from './lambda-span-emitter.js';
import { type VspVendor } from './vendor-adapters.js';

function fakeHash(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

function buildHarness(vendor: VspVendor) {
  const exporter = new InMemorySpanExporter();
  const provider = new BasicTracerProvider({
    spanProcessors: [new SimpleSpanProcessor(exporter)],
  });
  const emitter = new LambdaSpanEmitter({
    tracer: provider.getTracer('vsp-otel-test'),
    vendor,
  });
  return { exporter, emitter };
}

describe('applyVendorAttributes (via LambdaSpanEmitter)', () => {
  // Regression guard for the auto-mirror contract: once `vendor` is set on
  // the emitter, a single `emit()` call MUST produce the vendor-shaped
  // mirror attributes. No caller-side `mirrorLambdaAxesFor*` step exists
  // or is required — forgetting one used to silently degrade Datadog APM /
  // Phoenix evaluator views, so we pin the behaviour here.
  it('auto-mirrors Λ-axes for datadog on emit() with zero post-emit calls', () => {
    const { exporter, emitter } = buildHarness('datadog');
    const span = emitter.emit(
      {
        hash: fakeHash('dd-auto'),
        license: 'Apache-2.0',
        endpoint: 'POST /v1/auto',
        lambdaAxes: { cleanliness: 0.91, invariance: 0.77 },
      },
      { endImmediately: true },
    );
    // Sanity: emit() returned the span — caller did nothing else.
    expect(span).toBeDefined();
    const attrs = exporter.getFinishedSpans()[0]?.attributes ?? {};
    expect(attrs['dd.lambda.cleanliness']).toBe(0.91);
    expect(attrs['dd.lambda.invariance']).toBe(0.77);
    expect(attrs['operation.name']).toBe('POST /v1/auto');
  });

  it('auto-mirrors Λ-axes for phoenix on emit() with zero post-emit calls', () => {
    const { exporter, emitter } = buildHarness('phoenix');
    emitter.emit(
      {
        hash: fakeHash('phx-auto'),
        license: 'MIT',
        lambdaAxes: { horizon: 0.82, resonance: 0.6 },
      },
      { endImmediately: true },
    );
    const attrs = exporter.getFinishedSpans()[0]?.attributes ?? {};
    expect(attrs['llm.evaluation.horizon.score']).toBe(0.82);
    expect(attrs['llm.evaluation.resonance.score']).toBe(0.6);
    expect(attrs['openinference.span.kind']).toBe('LLM');
  });

  it('honeycomb adapter stamps app.span_name + app.kind without dropping gen_ai.*', () => {
    const { exporter, emitter } = buildHarness('honeycomb');
    emitter.emit(
      {
        hash: fakeHash('hc-1'),
        license: 'Apache-2.0',
        endpoint: 'POST /v1/score',
        lambdaAxes: { cleanliness: 0.9 },
      },
      { endImmediately: true },
    );
    const attrs = exporter.getFinishedSpans()[0]?.attributes ?? {};
    expect(attrs['app.span_name']).toBe('POST /v1/score');
    expect(attrs['app.kind']).toBe('vsp.lambda_receipt');
    expect(attrs['gen_ai.lambda.cleanliness']).toBe(0.9);
    expect(attrs['gen_ai.szl.license']).toBe('Apache-2.0');
  });

  it('datadog adapter mirrors span name + per-axis scores to dd.*', () => {
    const { exporter, emitter } = buildHarness('datadog');
    emitter.emit(
      {
        hash: fakeHash('dd-1'),
        license: 'MIT',
        endpoint: 'POST /v1/infer',
        lambdaAxes: { horizon: 0.8, resonance: 0.7 },
      },
      { endImmediately: true },
    );
    const attrs = exporter.getFinishedSpans()[0]?.attributes ?? {};
    expect(attrs['operation.name']).toBe('POST /v1/infer');
    expect(attrs['resource.name']).toBe('POST /v1/infer');
    expect(attrs['dd.span_type']).toBe('vsp.lambda_receipt');
    expect(attrs['dd.lambda.horizon']).toBe(0.8);
    expect(attrs['dd.lambda.resonance']).toBe(0.7);
    expect(attrs['gen_ai.lambda.horizon']).toBe(0.8);
  });

  it('phoenix adapter sets openinference.span.kind=LLM + evaluator mirrors', () => {
    const { exporter, emitter } = buildHarness('phoenix');
    emitter.emit(
      {
        hash: fakeHash('phx-1'),
        license: 'BSD-3-Clause',
        lambdaAxes: { invariance: 0.95, measurabilityHonesty: 0.88 },
      },
      { endImmediately: true },
    );
    const attrs = exporter.getFinishedSpans()[0]?.attributes ?? {};
    expect(attrs['openinference.span.kind']).toBe('LLM');
    expect(attrs['openinference.metadata.namespace']).toBe('gen_ai.lambda');
    expect(attrs['llm.evaluation.invariance.score']).toBe(0.95);
    expect(attrs['llm.evaluation.invariance.label']).toBe('invariance');
    expect(attrs['llm.evaluation.measurabilityHonesty.score']).toBe(0.88);
  });

  it('none vendor is a passthrough — only gen_ai.* attributes are present', () => {
    const { exporter, emitter } = buildHarness('none');
    emitter.emit(
      { hash: fakeHash('none-1'), license: 'CC-BY-4.0' },
      { endImmediately: true },
    );
    const attrs = exporter.getFinishedSpans()[0]?.attributes ?? {};
    expect(attrs['app.kind']).toBeUndefined();
    expect(attrs['operation.name']).toBeUndefined();
    expect(attrs['openinference.span.kind']).toBeUndefined();
    expect(attrs['gen_ai.szl.license']).toBe('CC-BY-4.0');
  });
});
