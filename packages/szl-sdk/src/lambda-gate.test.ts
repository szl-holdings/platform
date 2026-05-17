import { afterEach, describe, expect, it, vi } from 'vitest';

import { SZLClient } from './client.js';
import { defaultPolicyProvider, DEFAULT_SDK_AXES } from './default-policy-provider.js';
import { type HttpRequestRecord } from './http.js';
import {
  LambdaGate,
  SZLPolicyError,
  constantProvider,
  type LambdaInvariantProvider,
} from './lambda-gate.js';

const origFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = origFetch;
});

function mockNoContent() {
  return vi.fn(async () => new Response(null, { status: 204 }));
}

function mockOk(body: unknown = { ok: true }) {
  return vi.fn(
    async () =>
      new Response(JSON.stringify({ data: body }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
  );
}

describe('LambdaGate', () => {
  it('refuses when invariant is below threshold and no approvalToken is supplied', async () => {
    const gate = new LambdaGate({ threshold: 0.6, provider: constantProvider(0.4) });
    await expect(gate.check('webhooks.delete')).rejects.toBeInstanceOf(SZLPolicyError);
  });

  it('admits when invariant meets threshold', async () => {
    const gate = new LambdaGate({ threshold: 0.5, provider: constantProvider(0.7) });
    const decision = await gate.check('apiKeys.revoke');
    expect(decision.bypassed).toBe(false);
    expect(decision.invariant).toBe(0.7);
    expect(decision.threshold).toBe(0.5);
  });

  it('admits with bypass=true when approvalToken is supplied even if invariant is low', async () => {
    const gate = new LambdaGate({ threshold: 0.9, provider: constantProvider(0.1) });
    const decision = await gate.check('treasury.transfer', { approvalToken: 'op-12345' });
    expect(decision.bypassed).toBe(true);
    expect(decision.approvalToken).toBe('op-12345');
  });

  it('rejects out-of-range thresholds and provider outputs', async () => {
    expect(() => new LambdaGate({ threshold: 1.5, provider: constantProvider(0.5) })).toThrow();
    const bad = new LambdaGate({ threshold: 0.5, provider: { evaluate: () => 2 } });
    await expect(bad.check('webhooks.delete')).rejects.toThrow(/invalid invariant/);
  });

  it('SZLPolicyError carries action, invariant, threshold for auditing', async () => {
    const gate = new LambdaGate({ threshold: 0.5, provider: constantProvider(0.2) });
    try {
      await gate.check('esignature.send');
      throw new Error('expected refusal');
    } catch (err) {
      expect(err).toBeInstanceOf(SZLPolicyError);
      const e = err as SZLPolicyError;
      expect(e.action).toBe('esignature.send');
      expect(e.invariant).toBe(0.2);
      expect(e.threshold).toBe(0.5);
      expect(e.code).toBe('SZL_POLICY_BLOCKED');
    }
  });
});

describe('SZLClient gated destructive endpoints', () => {
  function makeClient(invariant: number, threshold = 0.5) {
    const provider: LambdaInvariantProvider = { evaluate: () => invariant };
    return new SZLClient({
      apiKey: 'szl_test',
      baseUrl: 'https://example.test/api',
      lambdaGate: { threshold, provider },
    });
  }

  it('webhooks.delete refuses with SZLPolicyError when Λ < threshold and no token', async () => {
    const fetchMock = mockNoContent();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const client = makeClient(0.2);
    await expect(client.webhooks.delete('ep_1')).rejects.toBeInstanceOf(SZLPolicyError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('webhooks.delete proceeds with approvalToken even when Λ is low', async () => {
    const fetchMock = mockNoContent();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const client = makeClient(0.1);
    await expect(client.webhooks.delete('ep_1', { approvalToken: 'tok_a' })).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('apiKeys.revoke refuses when Λ is low and proceeds when Λ meets threshold', async () => {
    const fetchMock = mockNoContent();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const blocked = makeClient(0.1);
    await expect(blocked.apiKeys.revoke(7)).rejects.toBeInstanceOf(SZLPolicyError);
    expect(fetchMock).not.toHaveBeenCalled();

    const ok = makeClient(0.9);
    await expect(ok.apiKeys.revoke(7)).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('treasury.transfer is gated and refuses without approval', async () => {
    const fetchMock = mockOk({ id: 't1', status: 'pending' });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const client = makeClient(0.1);
    await expect(
      client.treasury.transfer({
        fromAccountId: 1,
        toAccountId: 2,
        amount: '100.00',
        currency: 'USD',
      }),
    ).rejects.toBeInstanceOf(SZLPolicyError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('esignature.send is gated and refuses without approval', async () => {
    const fetchMock = mockOk({ id: 'es1' });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const client = makeClient(0.1);
    await expect(
      client.esignature.send({
        documentTitle: 'NDA',
        signatories: [{ email: 'a@b.com', name: 'A' }],
      }),
    ).rejects.toBeInstanceOf(SZLPolicyError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('records gate decision provenance on receipts (bypass path preserves approvalToken)', async () => {
    const fetchMock = mockNoContent();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const audited = new SZLClient({
      apiKey: 'szl_test',
      baseUrl: 'https://example.test/api',
      lambdaGate: { threshold: 0.5, provider: constantProvider(0.1) },
      receipts: { enabled: true, operatorId: 'op@test' },
    });
    await audited.webhooks.delete('ep_x', { approvalToken: 'tok_provenance' });
    const all = await audited.receipts.readAll();
    expect(all).toHaveLength(1);
    expect(all[0]!.endpoint).toBe('/webhooks/endpoints/ep_x');
    const meta = all[0]!.metadata as Record<string, unknown>;
    expect(meta).toBeDefined();
    const gd = meta.gateDecision as Record<string, unknown> | undefined;
    expect(gd).toBeDefined();
    expect(gd!.action).toBe('webhooks.delete');
    expect(gd!.bypassed).toBe(true);
    expect(gd!.approvalToken).toBe('tok_provenance');
    expect(gd!.invariant).toBe(0.1);
    expect(gd!.threshold).toBe(0.5);
  });

  it('records non-bypass gate decisions on receipts too (no approvalToken field)', async () => {
    const fetchMock = mockNoContent();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const audited = new SZLClient({
      apiKey: 'szl_test',
      baseUrl: 'https://example.test/api',
      lambdaGate: { threshold: 0.5, provider: constantProvider(0.9) },
      receipts: { enabled: true, operatorId: 'op@test' },
    });
    await audited.apiKeys.revoke(42);
    const all = await audited.receipts.readAll();
    expect(all).toHaveLength(1);
    const gd = (all[0]!.metadata as Record<string, unknown>).gateDecision as
      | Record<string, unknown>
      | undefined;
    expect(gd).toBeDefined();
    expect(gd!.bypassed).toBe(false);
    expect(gd!.approvalToken).toBeUndefined();
    expect(gd!.action).toBe('apiKeys.revoke');
  });

  it('threads gateDecision through to the http observer', async () => {
    const fetchMock = mockNoContent();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const client = makeClient(0.9);
    const records: HttpRequestRecord[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (client as any).http.setObserver((r: HttpRequestRecord) => {
      records.push(r);
    });
    await client.webhooks.delete('ep_q');
    expect(records).toHaveLength(1);
    expect(records[0]!.gateDecision).toBeDefined();
    expect(records[0]!.gateDecision!.action).toBe('webhooks.delete');
    expect(records[0]!.gateDecision!.bypassed).toBe(false);
    expect(records[0]!.gateDecision!.invariant).toBe(0.9);
  });

  it('is a no-op for ungated methods (e.g. webhooks.list, webhooks.create)', async () => {
    const fetchMock = mockOk({ data: [] });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const client = makeClient(0.0); // would block everything if applied
    await expect(client.webhooks.list()).resolves.toBeDefined();
    expect(fetchMock).toHaveBeenCalled();
  });

  it('refuses destructive calls by default (gate is opt-out, not opt-in)', async () => {
    const fetchMock = mockNoContent();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const client = new SZLClient({ apiKey: 'szl_test', baseUrl: 'https://example.test/api' });
    await expect(client.webhooks.delete('ep_z')).rejects.toBeInstanceOf(SZLPolicyError);
    expect(fetchMock).not.toHaveBeenCalled();
    // The default gate still admits when caller supplies an approvalToken.
    await expect(
      client.webhooks.delete('ep_z', { approvalToken: 'tok_default_bypass' }),
    ).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('default gate (no caller config) routes through policy-engine + ouroboros-invariant', async () => {
    const fetchMock = mockNoContent();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    // No lambdaGate provided -> client installs builtInDefaultProvider, which
    // uses checkAction + lutarInvariant against DEFAULT_SDK_AXES. Two of those
    // axes are zero, so the Lutar invariant zero-pins to 0 and the gate
    // refuses every destructive call without an approval token.
    const client = new SZLClient({ apiKey: 'szl_test', baseUrl: 'https://example.test/api' });
    await expect(client.webhooks.delete('ep_a')).rejects.toBeInstanceOf(SZLPolicyError);
    await expect(client.apiKeys.revoke(1)).rejects.toBeInstanceOf(SZLPolicyError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('defaultPolicyProvider yields lutarInvariant(getAxes()) when policy-engine does not block', async () => {
    const provider = defaultPolicyProvider({
      getAxes: () => ({ cleanliness: 1, horizon: 1, resonance: 1, frustum: 1 }),
      buildEvaluationRequest: (action) => ({
        action,
        subject: { roles: ['operator'] },
        resource: { type: action },
      }),
    });
    // All axes = 1 -> Λ = 1 (weighted geometric mean of ones).
    const v = await provider.evaluate('webhooks.delete');
    expect(v).toBe(1);
  });

  it('defaultPolicyProvider zero-pins Λ for non-admit policy effects (require_approval, escalate, block) even when axes are full', async () => {
    const fullAxes = () => ({ cleanliness: 1, horizon: 1, resonance: 1, frustum: 1 });
    const { registerPolicy, unregisterPolicy } = await import('@szl-holdings/policy-engine');
    const effects: Array<'allow' | 'audit_only' | 'require_approval' | 'escalate' | 'block'> = [
      'allow',
      'audit_only',
      'require_approval',
      'escalate',
      'block',
    ];
    for (const effect of effects) {
      const policyId = `test.policy.${effect}`;
      registerPolicy({
        id: policyId,
        name: `test ${effect}`,
        scope: 'action',
        actionTypes: [`test.action.${effect}`],
        rules: [{ id: 'r1', name: 'r1', effect, priority: 100 }],
        isActive: true,
        priority: 100,
        createdAt: 0,
        updatedAt: 0,
      });
      const provider = defaultPolicyProvider({
        getAxes: fullAxes,
        buildEvaluationRequest: (action) => ({
          action,
          subject: { roles: [] },
          resource: { type: action },
        }),
      });
      const v = await provider.evaluate(`test.action.${effect}`);
      if (effect === 'allow' || effect === 'audit_only') {
        expect(v, `effect=${effect} should admit and yield Λ=1`).toBe(1);
      } else {
        expect(v, `effect=${effect} should zero-pin Λ to 0 (cannot bypass approval with high axes)`).toBe(0);
      }
      unregisterPolicy(policyId);
    }
  });

  it('defaultPolicyProvider zero-pins Λ to 0 when DEFAULT_SDK_AXES are used (proves wiring to ouroboros-invariant)', async () => {
    const provider = defaultPolicyProvider({
      getAxes: () => DEFAULT_SDK_AXES,
      buildEvaluationRequest: (action) => ({
        action,
        subject: { roles: [] },
        resource: { type: action },
      }),
    });
    const v = await provider.evaluate('apiKeys.revoke');
    expect(v).toBe(0);
  });

  it('lambdaGate: false fully disables governance', async () => {
    const fetchMock = mockNoContent();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const client = new SZLClient({
      apiKey: 'szl_test',
      baseUrl: 'https://example.test/api',
      lambdaGate: false,
    });
    await expect(client.webhooks.delete('ep_z')).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
