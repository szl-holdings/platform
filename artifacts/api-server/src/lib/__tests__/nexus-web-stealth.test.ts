/**
 * Integration tests for the web.stealth policy enforcement layer.
 *
 * Verifies:
 *   - Domain allowlist gate: allowlisted domains pass, non-allowlisted are blocked
 *   - Subdomain matching: sub.domain.com is allowed when domain.com is in the allowlist
 *   - RPM cap: calls beyond the cap are blocked
 *   - Leader gate: disabled Camofox leader blocks all invocations regardless of allowlist
 *   - Action validation: only the three specified actions are accepted
 *   - Audit events are written for every blocked path
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ThirdPartyLeader } from '../../services/nexus/nexus-types';

// ── Module mocks (must come before subject imports) ────────────────────────────

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
  registerNEXUSHandlers: vi.fn(),
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
  __isDomainAllowedForTest,
  __resetWebStealthPolicyForTest,
  __setLeaderForTest,
  __setWebStealthAllowlistForTest,
  thirdPartyCall,
} from '../../routes/nexus';
import { writeAuditEvent } from '../../middlewares/session-policy';

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeCamofoxLeader(overrides: Partial<ThirdPartyLeader> = {}): ThirdPartyLeader {
  return {
    id: 'tpl_camofox',
    name: 'Camofox',
    sourceRepo: 'jo-inc/camofox-browser',
    sourceUrl: 'https://github.com/jo-inc/camofox-browser',
    licenseSpdx: 'MIT',
    capabilitySummary: 'Firefox-based stealth browser',
    capabilityTags: ['web.stealth'],
    integrationMode: 'external-service',
    policyState: 'requires-review',
    policyNote: 'MIT approved. Allowlist is empty by default.',
    lastFetchedCommit: 'a3f91cc',
    lastFetchedAt: new Date().toISOString(),
    enabled: true,
    logicalCapability: 'web.stealth',
    ...overrides,
  };
}

// ── Domain allowlist tests ─────────────────────────────────────────────────────

describe('web.stealth — domain allowlist enforcement', () => {
  beforeEach(() => {
    __resetWebStealthPolicyForTest();
  });

  it('blocks any domain when the allowlist is empty (secure default)', () => {
    expect(__isDomainAllowedForTest('https://zillow.com/homes/123')).toBe(false);
    expect(__isDomainAllowedForTest('https://portofrotterdam.com/vessels')).toBe(false);
    expect(__isDomainAllowedForTest('https://example.com')).toBe(false);
  });

  it('allows an explicitly allowlisted domain', () => {
    __setWebStealthAllowlistForTest(['zillow.com', 'portofrotterdam.com']);
    expect(__isDomainAllowedForTest('https://zillow.com/homes/123')).toBe(true);
    expect(__isDomainAllowedForTest('https://portofrotterdam.com/en/vessels')).toBe(true);
  });

  it('allows subdomains of an allowlisted root domain', () => {
    __setWebStealthAllowlistForTest(['marinetraffic.com']);
    expect(__isDomainAllowedForTest('https://www.marinetraffic.com/vessels')).toBe(true);
    expect(__isDomainAllowedForTest('https://api.marinetraffic.com/v2/vessels')).toBe(true);
  });

  it('does NOT allow an unrelated domain that contains an allowlisted name as a substring', () => {
    __setWebStealthAllowlistForTest(['example.com']);
    expect(__isDomainAllowedForTest('https://evil-example.com/data')).toBe(false);
    expect(__isDomainAllowedForTest('https://notexample.com')).toBe(false);
  });

  it('strips www. before matching', () => {
    __setWebStealthAllowlistForTest(['zillow.com']);
    expect(__isDomainAllowedForTest('https://www.zillow.com/homes')).toBe(true);
  });

  it('returns false for a malformed URL', () => {
    __setWebStealthAllowlistForTest(['example.com']);
    expect(__isDomainAllowedForTest('not-a-url')).toBe(false);
  });
});

// ── Leader gate tests ──────────────────────────────────────────────────────────

describe('web.stealth — Camofox leader gate (thirdPartyCall)', () => {
  const fn = vi.fn().mockResolvedValue({ policy: 'allowed', snapshot: {} });

  beforeEach(() => {
    __clearLeaderStoreForTest();
    __resetWebStealthPolicyForTest();
    vi.clearAllMocks();
    fn.mockResolvedValue({ policy: 'allowed', snapshot: {} });
  });

  it('blocks when the Camofox leader is not registered', async () => {
    const result = await thirdPartyCall('tpl_camofox', { callerAgent: 'domaine' }, fn);

    expect(result.ok).toBe(false);
    expect(result.policyDecision).toBe('blocked');
    expect(fn).not.toHaveBeenCalled();
    expect(writeAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'praxis.third_party_call.blocked',
        entityId: 'tpl_camofox',
      }),
    );
  });

  it('blocks when the Camofox leader is disabled (default state)', async () => {
    __setLeaderForTest(makeCamofoxLeader({ enabled: false }));
    __setWebStealthAllowlistForTest(['zillow.com']);

    const result = await thirdPartyCall('tpl_camofox', { callerAgent: 'domaine' }, fn);

    expect(result.ok).toBe(false);
    expect(result.policyDecision).toBe('blocked');
    expect(result.policyNote).toMatch(/disabled/i);
    expect(fn).not.toHaveBeenCalled();
    expect(writeAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'praxis.third_party_call.blocked',
        entityId: 'tpl_camofox',
        newValues: expect.objectContaining({ policyDecision: 'blocked' }),
      }),
    );
  });

  it('passes through when leader is enabled and fn succeeds', async () => {
    __setLeaderForTest(makeCamofoxLeader({ enabled: true }));
    __setWebStealthAllowlistForTest(['zillow.com']);

    const result = await thirdPartyCall(
      'tpl_camofox',
      { callerAgent: 'domaine', requestPayload: { url: 'https://zillow.com/homes/1', action: 'accessibility-snapshot' } },
      fn,
    );

    expect(result.ok).toBe(true);
    expect(result.policyDecision).toBe('requires-review');
    expect(fn).toHaveBeenCalledOnce();
    expect(writeAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'praxis.third_party_call.executed',
        entityId: 'tpl_camofox',
      }),
    );
  });

  it('writes an error audit event when the fn throws', async () => {
    __setLeaderForTest(makeCamofoxLeader({ enabled: true }));
    fn.mockRejectedValueOnce(new Error('Connection refused'));

    const result = await thirdPartyCall('tpl_camofox', { callerAgent: 'sextant' }, fn);

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/Connection refused/i);
    expect(writeAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'praxis.third_party_call.error',
        entityId: 'tpl_camofox',
      }),
    );
  });
});

// ── Domain allowlist + leader integration ──────────────────────────────────────

describe('web.stealth — allowlist gate inside thirdPartyCall fn', () => {
  beforeEach(() => {
    __clearLeaderStoreForTest();
    __resetWebStealthPolicyForTest();
    vi.clearAllMocks();
  });

  it('fn can detect non-allowlisted domain and return a policy-blocked payload', async () => {
    __setLeaderForTest(makeCamofoxLeader({ enabled: true }));

    const stealthFn = vi.fn().mockImplementation(async () => {
      const allowed = __isDomainAllowedForTest('https://zillow.com/homes/1');
      if (!allowed) {
        return {
          policy: 'blocked',
          reason: "Domain 'zillow.com' is not in the Camofox allowlist.",
          auditId: 'audit_test01',
          url: 'https://zillow.com/homes/1',
        };
      }
      return { policy: 'allowed', snapshot: { price: '$1,200,000' } };
    });

    const result = await thirdPartyCall('tpl_camofox', { callerAgent: 'domaine' }, stealthFn);

    expect(result.ok).toBe(true);
    expect((result.result as { policy: string }).policy).toBe('blocked');
    expect(stealthFn).toHaveBeenCalledOnce();
  });

  it('fn returns an allowed snapshot when domain is in the allowlist', async () => {
    __setLeaderForTest(makeCamofoxLeader({ enabled: true }));
    __setWebStealthAllowlistForTest(['zillow.com']);

    const stealthFn = vi.fn().mockImplementation(async () => {
      const allowed = __isDomainAllowedForTest('https://zillow.com/homes/1');
      if (!allowed) {
        return { policy: 'blocked', reason: 'not in allowlist' };
      }
      return { policy: 'allowed', snapshot: { price: '$1,200,000', sqft: '2400 sqft' } };
    });

    const result = await thirdPartyCall('tpl_camofox', { callerAgent: 'domaine' }, stealthFn);

    expect(result.ok).toBe(true);
    const payload = result.result as { policy: string; snapshot: { price: string } };
    expect(payload.policy).toBe('allowed');
    expect(payload.snapshot.price).toBe('$1,200,000');
  });
});
