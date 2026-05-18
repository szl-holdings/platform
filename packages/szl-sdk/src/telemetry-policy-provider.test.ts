/**
 * Integration test: vsp-otel-shaped stream → telemetry policy provider →
 * Λ-gate decision. Asserts the end-to-end refusal/admit transitions a
 * funder would see when live telemetry arrives, goes stale, or never
 * shows up at all.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

import { SZLClient } from './client.js';
import { LambdaGate, SZLPolicyError } from './lambda-gate.js';
import {
  createInMemoryLambdaAxisStream,
  telemetryPolicyProvider,
} from './telemetry-policy-provider.js';

const origFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = origFetch;
});

function mockNoContent() {
  return vi.fn(async () => new Response(null, { status: 204 }));
}

function buildAdmitRequest(action: string) {
  return {
    action,
    subject: { roles: ['operator'] },
    resource: { type: action },
  };
}

describe('telemetryPolicyProvider — vsp-otel stream → Λ-gate', () => {
  it('fails closed (Λ=0, state=no-telemetry) when no samples have arrived', async () => {
    const stream = createInMemoryLambdaAxisStream();
    const provider = telemetryPolicyProvider({
      stream,
      buildEvaluationRequest: buildAdmitRequest,
    });
    const v = await provider.evaluate('webhooks.delete');
    expect(v).toBe(0);
    expect(provider.state().kind).toBe('no-telemetry');
    expect(provider.state().reason).toMatch(/no Λ-axis samples/);
    provider.dispose();
  });

  it('reads Λ from the live stream once a synthetic telemetry event is published', async () => {
    const stream = createInMemoryLambdaAxisStream();
    const provider = telemetryPolicyProvider({
      stream,
      buildEvaluationRequest: buildAdmitRequest,
    });

    // Simulate a vsp-otel emitter publishing a Λ-axis sample.
    stream.publish({ cleanliness: 1, horizon: 1, resonance: 1, frustum: 1 });
    const v = await provider.evaluate('webhooks.delete');
    expect(v).toBe(1);
    expect(provider.state().kind).toBe('live');
    expect(provider.state().axes).toEqual({
      cleanliness: 1,
      horizon: 1,
      resonance: 1,
      frustum: 1,
    });
    provider.dispose();
  });

  it('moves Λ in response to subsequent telemetry events without re-seeding', async () => {
    const stream = createInMemoryLambdaAxisStream();
    const provider = telemetryPolicyProvider({
      stream,
      buildEvaluationRequest: buildAdmitRequest,
    });
    stream.publish({ cleanliness: 1, horizon: 1, resonance: 1, frustum: 1 });
    expect(await provider.evaluate('apiKeys.revoke')).toBe(1);

    // A degraded axis arrives — Λ should drop without manual reseeding.
    stream.publish({ cleanliness: 0.5, horizon: 0.5, resonance: 0.5, frustum: 0.5 });
    const v2 = await provider.evaluate('apiKeys.revoke');
    expect(v2).toBeCloseTo(0.5, 6);
    provider.dispose();
  });

  it('fails closed when the most recent sample is older than staleAfterMs', async () => {
    const stream = createInMemoryLambdaAxisStream();
    let clock = 1_000_000;
    const provider = telemetryPolicyProvider({
      stream,
      buildEvaluationRequest: buildAdmitRequest,
      staleAfterMs: 5_000,
      now: () => clock,
    });
    stream.publish({ cleanliness: 1, horizon: 1, resonance: 1, frustum: 1 }, clock);
    expect(await provider.evaluate('webhooks.delete')).toBe(1);
    expect(provider.state().kind).toBe('live');

    clock += 10_000; // advance past the freshness window
    const v = await provider.evaluate('webhooks.delete');
    expect(v).toBe(0);
    expect(provider.state().kind).toBe('stale');
    expect(provider.state().reason).toMatch(/stale|fails closed/);
    provider.dispose();
  });

  it('end-to-end: telemetry event flips an SZLClient call from refuse to admit', async () => {
    const fetchMock = mockNoContent();
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const stream = createInMemoryLambdaAxisStream();
    const provider = telemetryPolicyProvider({
      stream,
      buildEvaluationRequest: buildAdmitRequest,
    });
    const client = new SZLClient({
      apiKey: 'szl_test',
      baseUrl: 'https://example.test/api',
      lambdaGate: { threshold: 0.5, provider },
    });

    // No telemetry yet → gate refuses with SZLPolicyError, no HTTP fired.
    await expect(client.webhooks.delete('ep_1')).rejects.toBeInstanceOf(SZLPolicyError);
    expect(fetchMock).not.toHaveBeenCalled();

    // Publish a synthetic Λ-receipt sample → gate now admits and HTTP fires.
    stream.publish({ cleanliness: 1, horizon: 1, resonance: 1, frustum: 1 });
    await expect(client.webhooks.delete('ep_1')).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    provider.dispose();
  });

  it('onState fires when telemetry first arrives and when it goes stale', async () => {
    const stream = createInMemoryLambdaAxisStream();
    let clock = 1_000_000;
    const states: string[] = [];
    const provider = telemetryPolicyProvider({
      stream,
      buildEvaluationRequest: buildAdmitRequest,
      staleAfterMs: 1_000,
      now: () => clock,
      onState: (s) => states.push(s.kind),
    });
    stream.publish({ cleanliness: 1, horizon: 1, resonance: 1, frustum: 1 }, clock);
    expect(states).toContain('live');
    clock += 5_000;
    // Touch state() to force a freshness re-check.
    expect(provider.state().kind).toBe('stale');
    expect(states).toContain('stale');
    provider.dispose();
  });

  it('zero-pins to 0 when policy-engine returns require_approval even with live high axes', async () => {
    const stream = createInMemoryLambdaAxisStream();
    const { registerPolicy, unregisterPolicy } = await import('@szl-holdings/policy-engine');
    registerPolicy({
      id: 'test.policy.require_approval.telemetry',
      name: 'requires approval',
      scope: 'action',
      actionTypes: ['test.telemetry.require_approval'],
      rules: [{ id: 'r1', name: 'r1', effect: 'require_approval', priority: 100 }],
      isActive: true,
      priority: 100,
      createdAt: 0,
      updatedAt: 0,
    });
    const provider = telemetryPolicyProvider({
      stream,
      buildEvaluationRequest: buildAdmitRequest,
    });
    stream.publish({ cleanliness: 1, horizon: 1, resonance: 1, frustum: 1 });
    const v = await provider.evaluate('test.telemetry.require_approval');
    expect(v).toBe(0);
    unregisterPolicy('test.policy.require_approval.telemetry');
    provider.dispose();
  });

  it('LambdaGate refuses by default until telemetry arrives, then admits', async () => {
    const stream = createInMemoryLambdaAxisStream();
    const provider = telemetryPolicyProvider({
      stream,
      buildEvaluationRequest: buildAdmitRequest,
    });
    const gate = new LambdaGate({ threshold: 0.5, provider });
    await expect(gate.check('treasury.transfer')).rejects.toBeInstanceOf(SZLPolicyError);
    stream.publish({ cleanliness: 0.9, horizon: 0.9, resonance: 0.9, frustum: 0.9 });
    const decision = await gate.check('treasury.transfer');
    expect(decision.bypassed).toBe(false);
    expect(decision.invariant).toBeCloseTo(0.9, 6);
    provider.dispose();
  });
});
