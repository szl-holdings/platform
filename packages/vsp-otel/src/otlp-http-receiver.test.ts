/**
 * Smoke test: real OTLP/JSON exporter serializer → HTTP receiver → shared
 * LambdaAxisStream → telemetryPolicyProvider → Λ-gate flip.
 *
 * We use `@opentelemetry/otlp-transformer`'s `JsonTraceSerializer` to
 * produce the exact bytes the OTel collector's `otlphttp/json` exporter
 * would send. POSTing that payload at the receiver and watching the gate
 * transition admit→refuse→admit→stale is the production wiring exercised
 * end-to-end.
 */

import { afterEach, describe, expect, it } from 'vitest';

import { JsonTraceSerializer } from '@opentelemetry/otlp-transformer';
import { hrTime } from '@opentelemetry/core';
import { SpanKind, type SpanContext, type SpanStatus } from '@opentelemetry/api';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { InstrumentationScope } from '@opentelemetry/core';

import {
  createInMemoryLambdaAxisStream,
  telemetryPolicyProvider,
  type PublishableLambdaAxisStream,
} from '@szl-holdings/sdk';

import {
  createLambdaAxisStream,
  type LambdaAxisStreamHandle,
} from './lambda-axis-stream.js';
import {
  extractLambdaAxesFromOtlpAttributes,
  startOtlpHttpReceiver,
  type OtlpHttpReceiver,
  type ReceiverConnectionState,
} from './otlp-http-receiver.js';
import type { LambdaAxes } from './lambda-span-emitter.js';

const openReceivers: OtlpHttpReceiver[] = [];

afterEach(async () => {
  while (openReceivers.length > 0) {
    const r = openReceivers.pop();
    try {
      await r?.close();
    } catch {
      /* ignore */
    }
  }
});

async function startReceiver(
  stream: LambdaAxisStreamHandle,
  opts: Partial<Parameters<typeof startOtlpHttpReceiver>[0]> = {},
): Promise<OtlpHttpReceiver> {
  const r = await startOtlpHttpReceiver({
    stream,
    port: 0,
    host: '127.0.0.1',
    staleCheckIntervalMs: 50,
    ...opts,
  });
  openReceivers.push(r);
  return r;
}

/** Build a minimal `ReadableSpan` good enough for `JsonTraceSerializer`. */
function readableSpanWithAxes(name: string, axes: LambdaAxes) {
  const start = hrTime();
  const end = hrTime();
  const ctx: SpanContext = {
    traceId: '0123456789abcdef0123456789abcdef',
    spanId: '0123456789abcdef',
    traceFlags: 1,
  };
  const status: SpanStatus = { code: 0 };
  const attrs: Record<string, number> = {};
  for (const [k, v] of Object.entries(axes)) {
    if (typeof v === 'number') attrs[`gen_ai.lambda.${k}`] = v;
  }
  const resource = resourceFromAttributes({ 'service.name': 'smoke-test' });
  const scope: InstrumentationScope = { name: 'vsp-otel-smoke' };
  // The serializer only touches a handful of fields; the rest can be
  // stubbed. We assert the shape with `as unknown as` so a type drift
  // in the JS SDK doesn't break the smoke test silently.
  return {
    name,
    kind: SpanKind.INTERNAL,
    spanContext: () => ctx,
    parentSpanContext: undefined,
    startTime: start,
    endTime: end,
    status,
    attributes: attrs,
    links: [],
    events: [],
    duration: hrTime(),
    ended: true,
    resource,
    instrumentationScope: scope,
    instrumentationLibrary: scope,
    droppedAttributesCount: 0,
    droppedEventsCount: 0,
    droppedLinksCount: 0,
  } as unknown as Parameters<typeof JsonTraceSerializer.serializeRequest>[0][number];
}

async function postOtlp(
  url: string,
  axes: LambdaAxes,
  headers: Record<string, string> = {},
): Promise<Response> {
  const span = readableSpanWithAxes('smoke', axes);
  const body = JsonTraceSerializer.serializeRequest([span])!;
  return fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body,
  });
}

describe('extractLambdaAxesFromOtlpAttributes', () => {
  it('returns null when no gen_ai.lambda.* attributes exist', () => {
    expect(extractLambdaAxesFromOtlpAttributes(undefined)).toBeNull();
    expect(extractLambdaAxesFromOtlpAttributes([])).toBeNull();
    expect(
      extractLambdaAxesFromOtlpAttributes([
        { key: 'http.status_code', value: { intValue: '200' } },
      ]),
    ).toBeNull();
  });

  it('coerces doubleValue / intValue / stringValue numerics', () => {
    const axes = extractLambdaAxesFromOtlpAttributes([
      { key: 'gen_ai.lambda.cleanliness', value: { doubleValue: 0.97 } },
      { key: 'gen_ai.lambda.horizon', value: { intValue: '1' } },
      { key: 'gen_ai.lambda.resonance', value: { stringValue: '0.5' } },
      { key: 'gen_ai.lambda.unknown_axis', value: { doubleValue: 0.1 } },
      { key: 'gen_ai.other', value: { doubleValue: 0.9 } },
    ]);
    expect(axes).toEqual({ cleanliness: 0.97, horizon: 1, resonance: 0.5 });
  });
});

describe('startOtlpHttpReceiver — end-to-end through the Λ-gate', () => {
  it('flips a refuse-by-default gate to admit when real OTLP JSON arrives', async () => {
    const stream = createLambdaAxisStream();
    const receiver = await startReceiver(stream);
    const provider = telemetryPolicyProvider({
      stream,
      buildEvaluationRequest: (action) => ({
        action,
        subject: { roles: ['operator'] },
        resource: { type: action },
      }),
      staleAfterMs: 200,
    });

    // Pre-export: refuse-by-default.
    expect(provider.state().kind).toBe('no-telemetry');
    expect(await provider.evaluate('webhooks.delete')).toBe(0);

    const res = await postOtlp(receiver.url(), {
      cleanliness: 1,
      horizon: 1,
      resonance: 1,
      frustum: 1,
    });
    expect(res.status).toBe(200);

    expect(provider.state().kind).toBe('live');
    expect(await provider.evaluate('webhooks.delete')).toBeGreaterThan(0);
    expect(receiver.connectionState()).toBe('receiving');
    provider.dispose();
  });

  it('rejects requests missing the configured bearer token', async () => {
    const stream = createLambdaAxisStream();
    const receiver = await startReceiver(stream, { authToken: 'sekrit' });
    const noAuth = await postOtlp(receiver.url(), { cleanliness: 1 });
    expect(noAuth.status).toBe(401);
    const wrong = await postOtlp(receiver.url(), { cleanliness: 1 }, {
      authorization: 'Bearer nope',
    });
    expect(wrong.status).toBe(401);
    const ok = await postOtlp(receiver.url(), { cleanliness: 1 }, {
      authorization: 'Bearer sekrit',
    });
    expect(ok.status).toBe(200);
  });

  it('applies backpressure with 413 on oversize bodies and 415 on protobuf', async () => {
    const stream = createLambdaAxisStream();
    const receiver = await startReceiver(stream, { maxBodyBytes: 256 });
    const big = await fetch(receiver.url(), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: 'x'.repeat(512),
    });
    expect(big.status).toBe(413);

    const proto = await fetch(receiver.url(), {
      method: 'POST',
      headers: { 'content-type': 'application/x-protobuf' },
      body: Buffer.from([0, 1, 2, 3]),
    });
    expect(proto.status).toBe(415);
  });

  it('flips connectionState to stale within staleAfterMs of the last export', async () => {
    const stream = createLambdaAxisStream();
    const states: ReceiverConnectionState[] = [];
    const receiver = await startReceiver(stream, {
      staleAfterMs: 80,
      staleCheckIntervalMs: 20,
      onConnectionState: (s) => states.push(s),
    });

    await postOtlp(receiver.url(), { cleanliness: 1 });
    expect(receiver.connectionState()).toBe('receiving');

    await new Promise((r) => setTimeout(r, 200));
    receiver.checkFreshness();
    expect(receiver.connectionState()).toBe('stale');
    expect(states).toContain('receiving');
    expect(states).toContain('stale');
  });

  it('restart() reopens the listener on the same bound port', async () => {
    const stream = createLambdaAxisStream();
    const receiver = await startReceiver(stream);
    const portBefore = receiver.port();

    await postOtlp(receiver.url(), { cleanliness: 1 });
    await receiver.restart();
    expect(receiver.port()).toBe(portBefore);
    const res = await postOtlp(receiver.url(), { cleanliness: 1 });
    expect(res.status).toBe(200);
  });

  it('also works with the SDK in-memory stream when callers prefer to own it', async () => {
    const stream: PublishableLambdaAxisStream = createInMemoryLambdaAxisStream();
    // The HTTP receiver only needs `.publish(axes, observedAt)`; the
    // SDK's in-memory stream satisfies that, so production wirings can
    // choose either implementation.
    const adapter: LambdaAxisStreamHandle = {
      subscribe: stream.subscribe.bind(stream),
      publish: stream.publish.bind(stream),
      publishFromReceipt: () => {
        /* unused by the receiver */
      },
      latest: stream.latest.bind(stream),
      tap: () => {
        /* unused by the receiver */
      },
    };
    const receiver = await startReceiver(adapter);
    await postOtlp(receiver.url(), { cleanliness: 0.8, horizon: 0.8 });
    expect(stream.latest()?.axes).toEqual({ cleanliness: 0.8, horizon: 0.8 });
  });
});
