import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthzError, evaluatePolicy, probeOpaDecision } from '../src/authz.js';
import type { AgentActionRequest, CallerIdentity } from '../src/types.js';

const REQUEST: AgentActionRequest = {
  correlationId: 'opa-contract-test',
  capability: 'inspect_code',
  model: 'test-model',
  promptHash: 'abc123',
  target: 'api-server',
  targetEnvironment: 'production',
  domain: 'platform',
  parameters: {},
  requestedAt: new Date().toISOString(),
};

const CALLER: CallerIdentity = {
  sub: 'eng@szl.io',
  role: 'platform-engineer',
  groups: ['platform-team'],
  orgId: 'szl-holdings',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3_600,
};

const VALID_DECISION = {
  result: {
    allowed: true,
    required_approvals: 1,
    required_groups: ['platform-team', 'release-managers'],
    deny: [],
  },
};

const originalFetch = globalThis.fetch;

function mockDecision(body: unknown): ReturnType<typeof vi.fn> {
  const mocked = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { date: 'Wed, 07 Oct 2026 11:00:00 GMT' },
    }),
  );
  globalThis.fetch = mocked;
  return mocked;
}

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe('remote OPA decision contract', () => {
  it('accepts only the explicit decision endpoint and exact valid result', async () => {
    const mocked = mockDecision(VALID_DECISION);
    const decision = await evaluatePolicy(REQUEST, CALLER, 'https://opa.example.test/');

    expect(mocked).toHaveBeenCalledWith(
      'https://opa.example.test/v1/data/szl/approval/decision',
      expect.objectContaining({ method: 'POST', signal: expect.any(AbortSignal) }),
    );
    const requestOptions = mocked.mock.calls[0]?.[1] as RequestInit;
    const requestBody = JSON.parse(String(requestOptions.body)) as {
      input: { org_id?: string };
    };
    expect(requestBody.input.org_id).toBe(CALLER.orgId);
    expect(decision).toMatchObject({
      allowed: true,
      requiredApprovals: 1,
      requiredGroups: ['platform-team', 'release-managers'],
      reasons: [],
    });
  });

  it.each([
    ['missing result', {}],
    ['null result', { result: null }],
    ['array result', { result: [] }],
    ['extra top-level field', { ...VALID_DECISION, metrics: {} }],
    ['missing allowed', { result: { ...VALID_DECISION.result, allowed: undefined } }],
    ['string allowed', { result: { ...VALID_DECISION.result, allowed: 'true' } }],
    ['extra result field', { result: { ...VALID_DECISION.result, debug: true } }],
    ['negative approvals', { result: { ...VALID_DECISION.result, required_approvals: -1 } }],
    ['fractional approvals', { result: { ...VALID_DECISION.result, required_approvals: 0.5 } }],
    [
      'string approval groups',
      { result: { ...VALID_DECISION.result, required_groups: 'platform-team' } },
    ],
    [
      'duplicate approval groups',
      { result: { ...VALID_DECISION.result, required_groups: ['platform-team', 'platform-team'] } },
    ],
    ['non-string deny reasons', { result: { ...VALID_DECISION.result, deny: [false] } }],
    [
      'approval groups with zero approvals',
      {
        result: { ...VALID_DECISION.result, required_approvals: 0 },
      },
    ],
    [
      'missing groups with required approval',
      {
        result: { ...VALID_DECISION.result, required_groups: [] },
      },
    ],
    [
      'allowed with deny reason',
      {
        result: { ...VALID_DECISION.result, deny: ['must not be ignored'] },
      },
    ],
  ])('fails closed for %s', async (_name, body) => {
    mockDecision(body);
    await expect(
      evaluatePolicy(REQUEST, CALLER, 'https://opa.example.test'),
    ).rejects.toBeInstanceOf(AuthzError);
  });

  it('fails closed when OPA explicitly returns allowed=false', async () => {
    mockDecision({
      result: {
        allowed: false,
        required_approvals: 0,
        required_groups: [],
        deny: ['environment is outside the closed policy contract'],
      },
    });
    await expect(evaluatePolicy(REQUEST, CALLER, 'https://opa.example.test')).rejects.toMatchObject(
      {
        reasons: ['environment is outside the closed policy contract'],
      },
    );
  });

  it('fails closed on malformed response JSON', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response('{"result":', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    await expect(evaluatePolicy(REQUEST, CALLER, 'https://opa.example.test')).rejects.toThrow(
      /malformed JSON/,
    );
  });

  it('readiness proves the exact production decision rather than OPA process health', async () => {
    mockDecision(VALID_DECISION);
    await expect(probeOpaDecision('https://opa.example.test')).resolves.toBe(true);

    mockDecision({ result: {} });
    await expect(probeOpaDecision('https://opa.example.test')).resolves.toBe(false);

    mockDecision({
      result: {
        ...VALID_DECISION.result,
        required_groups: ['wrong-policy-group'],
      },
    });
    await expect(probeOpaDecision('https://opa.example.test')).resolves.toBe(false);
  });
});
