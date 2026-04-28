/**
 * Unit tests for the PRAXIS thirdPartyCall() wrapper.
 *
 * Verifies that the policy / enabled gate fires correctly for every
 * leader state variant:
 *   - unknown leader → blocked
 *   - known leader, disabled → blocked (audit written, fn never called)
 *   - known leader, policy=blocked → blocked (fn never called)
 *   - known leader, enabled, policy=allowed → ok, fn invoked
 *   - known leader, enabled, policy=requires-review → ok (review-flagged)
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ThirdPartyLeader } from '../../services/nexus/nexus-types';

// ── Module mocks (must come before the subject import) ─────────────────────────

vi.mock('@szl-holdings/db', () => ({
  db: {
    insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([]) }),
        }),
        limit: vi.fn().mockResolvedValue([]),
      }),
    }),
  },
  nexusSkillsTable: {},
  nexusProtocolToolsTable: {},
  nexusMemoryTable: {},
  nexusOrchestrationPlansTable: {},
  nexusIngestJobsTable: {},
  auditEventsTable: {},
  alloyAuditLog: {},
}));

vi.mock('../logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('../../middlewares/session-policy', () => ({
  writeAuditEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../ai-gateway', () => ({
  gatewayInfer: vi.fn(),
}));

vi.mock('@workspace/tool-mesh', () => ({
  defaultCatalogSearch: {
    indexTools: vi.fn(),
    indexSkills: vi.fn(),
    search: vi.fn().mockReturnValue({ hits: [], total: 0 }),
    count: vi.fn().mockReturnValue({ skills: 0, tools: 0 }),
  },
  defaultToolRegistry: {
    getAll: vi.fn().mockReturnValue([]),
    list: vi.fn().mockReturnValue([]),
  },
  registerPRAXISHandlers: vi.fn(),
}));

vi.mock('@szl-holdings/forge-runtime', () => ({
  forgeEvidenceStore: { get: vi.fn(), set: vi.fn() },
  forgeRuntime: {
    registerHandler: vi.fn(),
    submit: vi.fn().mockResolvedValue({ id: 'exec_mock', status: 'pending' }),
    getHistory: vi.fn().mockReturnValue([]),
    getExecution: vi.fn().mockReturnValue(null),
  },
  forgeTimeline: vi.fn(),
  runCodeHandler: vi.fn(),
}));

vi.mock('@szl-holdings/contracts/common', () => ({
  bodyShape: vi.fn().mockReturnValue({}),
}));

vi.mock('../validation', () => ({
  listQuerySchema: {},
  validateBody: () => (_req: unknown, _res: unknown, next: () => void) => next(),
  validateQuery: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

vi.mock('../../middlewares/auth', () => ({
  authMiddleware: () => (_req: unknown, _res: unknown, next: () => void) => next(),
  requireRole: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

vi.mock('../../middlewares/sliding-window-limiter', () => ({
  perUserApiSlidingLimiter: (_req: unknown, _res: unknown, next: () => void) => next(),
  perUserWriteSlidingLimiter: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

vi.mock('../alloy-orchestration', () => ({
  writeAuditLog: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../activity-logger', () => ({
  logActivity: vi.fn().mockResolvedValue(undefined),
}));

// ── Subject imports ─────────────────────────────────────────────────────────────

import {
  __clearLeaderStoreForTest,
  __setLeaderForTest,
  thirdPartyCall,
} from '../../routes/nexus';
import { writeAuditEvent } from '../../middlewares/session-policy';

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeLeader(overrides: Partial<ThirdPartyLeader> = {}): ThirdPartyLeader {
  return {
    id: 'tpl_test',
    name: 'Test Leader',
    sourceRepo: 'test/leader',
    sourceUrl: 'https://example.com',
    licenseSpdx: 'MIT',
    capabilitySummary: 'Test leader capability',
    capabilityTags: ['test'],
    integrationMode: 'in-process',
    policyState: 'allowed',
    policyNote: 'All good',
    lastFetchedCommit: 'abc1234',
    lastFetchedAt: new Date().toISOString(),
    enabled: true,
    ...overrides,
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('thirdPartyCall() — policy/enabled gating', () => {
  const fn = vi.fn().mockResolvedValue({ done: true });

  beforeEach(() => {
    __clearLeaderStoreForTest();
    vi.clearAllMocks();
    fn.mockResolvedValue({ done: true });
  });

  it('blocks when leader is not registered', async () => {
    const result = await thirdPartyCall('tpl_unknown', { callerAgent: 'test' }, fn);

    expect(result.ok).toBe(false);
    expect(result.policyDecision).toBe('blocked');
    expect(result.policyNote).toMatch(/not found|not registered/i);
    expect(fn).not.toHaveBeenCalled();
    expect(writeAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'praxis.third_party_call.blocked',
        entityType: 'nexus_leader',
        entityId: 'tpl_unknown',
      }),
    );
  });

  it('blocks when leader is disabled', async () => {
    __setLeaderForTest(makeLeader({ id: 'tpl_disabled', enabled: false }));

    const result = await thirdPartyCall('tpl_disabled', { callerAgent: 'test' }, fn);

    expect(result.ok).toBe(false);
    expect(result.policyDecision).toBe('blocked');
    expect(result.policyNote).toMatch(/disabled/i);
    expect(fn).not.toHaveBeenCalled();
    expect(writeAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'praxis.third_party_call.blocked',
        entityType: 'nexus_leader',
        entityId: 'tpl_disabled',
        newValues: expect.objectContaining({ policyDecision: 'blocked' }),
      }),
    );
  });

  it('blocks when leader policyState is blocked', async () => {
    __setLeaderForTest(makeLeader({ id: 'tpl_blocked', policyState: 'blocked', enabled: true }));

    const result = await thirdPartyCall('tpl_blocked', { callerAgent: 'test' }, fn);

    expect(result.ok).toBe(false);
    expect(result.policyDecision).toBe('blocked');
    expect(fn).not.toHaveBeenCalled();
    expect(writeAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'praxis.third_party_call.policy_blocked',
        entityType: 'nexus_leader',
      }),
    );
  });

  it('invokes fn and returns ok when leader is enabled and policy=allowed', async () => {
    __setLeaderForTest(makeLeader({ id: 'tpl_ok', enabled: true, policyState: 'allowed' }));

    const result = await thirdPartyCall('tpl_ok', { callerAgent: 'test' }, fn);

    expect(result.ok).toBe(true);
    expect(result.policyDecision).toBe('allowed');
    expect(fn).toHaveBeenCalledOnce();
    expect(writeAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'praxis.third_party_call.executed',
        entityType: 'nexus_leader',
        entityId: 'tpl_ok',
        newValues: expect.objectContaining({ ok: true }),
      }),
    );
  });

  it('invokes fn and returns ok when leader policy=requires-review', async () => {
    __setLeaderForTest(
      makeLeader({ id: 'tpl_review', enabled: true, policyState: 'requires-review' }),
    );

    const result = await thirdPartyCall('tpl_review', { callerAgent: 'test' }, fn);

    expect(result.ok).toBe(true);
    expect(result.policyDecision).toBe('requires-review');
    expect(fn).toHaveBeenCalledOnce();
  });

  it('includes requestHash, tokensEstimate, costEstimateUsd in every result', async () => {
    __setLeaderForTest(makeLeader({ id: 'tpl_metrics', enabled: true }));

    const result = await thirdPartyCall(
      'tpl_metrics',
      { callerAgent: 'metrics-agent', requestPayload: { query: 'hello world' } },
      fn,
    );

    expect(typeof result.requestHash).toBe('string');
    expect(result.requestHash.length).toBeGreaterThan(0);
    expect(typeof result.tokensEstimate).toBe('number');
    expect(typeof result.costEstimateUsd).toBe('number');
  });
});
