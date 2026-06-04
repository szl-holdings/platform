/**
 * Agent Gateway — OPA HTTP Date header handling
 * Phase 11 / Task #4610
 *
 * `policyDecision.evaluatedAt` must come from OPA's HTTP `Date` header so
 * that audit timestamps reflect the policy server's clock. The fallback to
 * the gateway's local clock fires only when OPA omits or returns a
 * malformed Date header. These tests stub `globalThis.fetch` to drive that
 * boundary explicitly without spawning a real OPA process.
 */

import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { evaluatePolicy } from '../src/authz.js';
import type { AgentActionRequest, CallerIdentity } from '../src/types.js';

const REQUEST: AgentActionRequest = {
  correlationId: 'corr-date',
  capability: 'inspect_code',
  model: 'gpt-4o',
  promptHash: 'feedface',
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
  exp: Math.floor(Date.now() / 1000) + 3600,
};

const OPA_BODY = JSON.stringify({
  result: {
    required_approvals: 1,
    required_groups: ['platform-team', 'release-managers'],
    deny: [],
  },
});

function fetchReturning(headers: Record<string, string>) {
  return vi.fn().mockResolvedValue(
    new Response(OPA_BODY, { status: 200, headers }),
  );
}

const ORIGINAL_FETCH = globalThis.fetch;

beforeEach(() => {
  // Each test re-installs its own fetch stub; restore in afterEach.
});

afterEach(() => {
  globalThis.fetch = ORIGINAL_FETCH;
  vi.restoreAllMocks();
});

describe('evaluatePolicy — OPA HTTP Date header handling', () => {
  it('uses the Date header from OPA when present and well-formed', async () => {
    const opaClock = 'Mon, 04 May 2026 12:34:56 GMT';
    globalThis.fetch = fetchReturning({
      'content-type': 'application/json',
      date: opaClock,
    }) as unknown as typeof fetch;

    const decision = await evaluatePolicy(REQUEST, CALLER, 'http://opa.local:8181');

    expect(decision.evaluatedAt).toBe(new Date(opaClock).toISOString());
    expect(decision.requiredApprovals).toBe(1);
  });

  it('falls back to the gateway clock when OPA omits the Date header', async () => {
    globalThis.fetch = fetchReturning({
      'content-type': 'application/json',
    }) as unknown as typeof fetch;

    const before = Date.now();
    const decision = await evaluatePolicy(REQUEST, CALLER, 'http://opa.local:8181');
    const after = Date.now();

    const evaluatedMs = new Date(decision.evaluatedAt).getTime();
    expect(Number.isFinite(evaluatedMs)).toBe(true);
    expect(evaluatedMs).toBeGreaterThanOrEqual(before - 1);
    expect(evaluatedMs).toBeLessThanOrEqual(after + 1);
  });

  it('falls back to the gateway clock when OPA returns a malformed Date header', async () => {
    globalThis.fetch = fetchReturning({
      'content-type': 'application/json',
      date: 'not-a-real-date',
    }) as unknown as typeof fetch;

    const before = Date.now();
    const decision = await evaluatePolicy(REQUEST, CALLER, 'http://opa.local:8181');
    const after = Date.now();

    // `new Date('not-a-real-date').toISOString()` would throw RangeError, so
    // a successful decision here proves the fallback path was taken.
    const evaluatedMs = new Date(decision.evaluatedAt).getTime();
    expect(Number.isFinite(evaluatedMs)).toBe(true);
    expect(evaluatedMs).toBeGreaterThanOrEqual(before - 1);
    expect(evaluatedMs).toBeLessThanOrEqual(after + 1);
  });
});
