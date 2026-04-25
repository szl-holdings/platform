/**
 * Route-level integration test for Task #1393.
 *
 * Asserts that `POST /approvals` correctly wires
 * `sendPushToOrgApprovers` for high- and critical-priority requests
 * with the Quick-Actions deep-link payload, and skips the helper for
 * low/medium priorities.
 *
 * Mounts the real approvals router under express + supertest with the
 * auth middleware stubbed to inject a fake authenticated user. The
 * helper itself is mocked so we can capture and assert call args
 * without exercising the DB / Expo SDK.
 */

import type { OrgMembership, RoleName } from '@szl-holdings/db';
import express from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthenticatedUser } from '../middlewares/auth';

const TEST_ORG: OrgMembership = {
  orgId: 42,
  orgSlug: 'test-org',
  orgName: 'Test Org',
  role: 'admin',
};

function buildAuthedUser(
  overrides: Partial<AuthenticatedUser> = {},
): AuthenticatedUser {
  const roles: RoleName[] = ['admin'];
  return {
    id: 9001,
    displayName: 'Test Approver',
    email: 'test@example.com',
    roles,
    orgs: [TEST_ORG],
    ...overrides,
  };
}

const sendPushToOrgApproversMock = vi.fn(async () => ({
  targeted: 0,
  sent: 0,
  failed: 0,
}));
const createApprovalRequestMock = vi.fn(
  async (input: Record<string, unknown>) => ({
    id: 1234,
    title: input.title,
    priority: input.priority,
  }),
);

vi.mock('../lib/expo-push.js', () => ({
  sendPushToOrgApprovers: sendPushToOrgApproversMock,
  __esModule: true,
}));

vi.mock('@szl-holdings/covenant-policy', () => ({
  createApprovalRequest: createApprovalRequestMock,
}));

vi.mock('../middlewares/auth', () => ({
  authMiddleware: () => (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    req.user = buildAuthedUser();
    next();
  },
  requireRole: () => (_req: express.Request, _res: express.Response, next: express.NextFunction) =>
    next(),
}));

vi.mock('../lib/guardian-engine', () => ({
  getGuardianEngine: vi.fn(),
  syncGuardianPolicies: vi.fn(),
}));

// Tiny stub so any guardian rule lookups return nothing (route only uses
// guardian on a separate path; harmless here).
vi.mock('@workspace/guardian', () => ({
  POLICY_TIER_DESCRIPTIONS: {},
  TIER_CONTROLS: {},
  TIER_NUMBER: {},
  TIER_RISK_LEVEL: {},
  PolicyTierSchema: { safeParse: () => ({ success: false }) },
}));

async function buildApp() {
  const { default: router } = await import('../routes/approvals');
  const app = express();
  app.use(express.json());
  app.use('/api', router);
  return app;
}

// Helper: yield to the microtask queue so the fire-and-forget
// `void import(...).then(...)` push has a chance to run before assertions.
async function flushMicrotasks() {
  await new Promise((r) => setImmediate(r));
  await new Promise((r) => setImmediate(r));
}

beforeEach(() => {
  sendPushToOrgApproversMock.mockClear();
  createApprovalRequestMock.mockClear();
});

afterEach(() => {
  vi.resetModules();
});

describe('POST /approvals push notification wiring', () => {
  it('fires sendPushToOrgApprovers for HIGH-priority approvals with the Quick-Actions deep link', async () => {
    const app = await buildApp();
    const resp = await request(app)
      .post('/api/approvals')
      .send({
        resourceType: 'agent_action',
        resourceId: 'act-1',
        title: 'Disable production firewall',
        priority: 'high',
      });

    expect(resp.status).toBe(201);
    await flushMicrotasks();

    expect(createApprovalRequestMock).toHaveBeenCalledTimes(1);
    expect(sendPushToOrgApproversMock).toHaveBeenCalledTimes(1);
    const [orgIdArg, payloadArg, optsArg] = sendPushToOrgApproversMock.mock.calls[0]!;
    expect(orgIdArg).toBe(42);
    expect(payloadArg.title).toBe('High-Priority Approval Pending');
    expect(payloadArg.body).toContain('Disable production firewall');
    expect(payloadArg.data).toMatchObject({
      kind: 'approval_pending',
      severity: 'high',
      screen: '/(shell)/quick-actions',
      deepLink: '/(shell)/quick-actions',
      approvalId: 1234,
    });
    expect(payloadArg.channelId).toBe('critical-alerts');
    expect(optsArg).toMatchObject({ severity: 'high' });
  });

  it('fires sendPushToOrgApprovers for CRITICAL-priority approvals with the critical title variant', async () => {
    const app = await buildApp();
    const resp = await request(app)
      .post('/api/approvals')
      .send({
        resourceType: 'agent_action',
        resourceId: 'act-2',
        title: 'Wipe customer database',
        priority: 'critical',
      });

    expect(resp.status).toBe(201);
    await flushMicrotasks();
    expect(sendPushToOrgApproversMock).toHaveBeenCalledTimes(1);
    const [, payloadArg, optsArg] = sendPushToOrgApproversMock.mock.calls[0]!;
    expect(payloadArg.title).toBe('Critical Approval Pending');
    expect(payloadArg.data?.severity).toBe('critical');
    expect(optsArg).toMatchObject({ severity: 'critical' });
  });

  it('does NOT fire sendPushToOrgApprovers for LOW-priority approvals', async () => {
    const app = await buildApp();
    const resp = await request(app)
      .post('/api/approvals')
      .send({
        resourceType: 'agent_action',
        resourceId: 'act-3',
        title: 'Cosmetic config tweak',
        priority: 'low',
      });

    expect(resp.status).toBe(201);
    await flushMicrotasks();
    expect(createApprovalRequestMock).toHaveBeenCalledTimes(1);
    expect(sendPushToOrgApproversMock).not.toHaveBeenCalled();
  });

  it('does NOT fire sendPushToOrgApprovers for MEDIUM-priority approvals (default)', async () => {
    const app = await buildApp();
    const resp = await request(app)
      .post('/api/approvals')
      .send({
        resourceType: 'agent_action',
        resourceId: 'act-4',
        title: 'Routine refresh',
        // priority omitted -> defaults to medium
      });

    expect(resp.status).toBe(201);
    await flushMicrotasks();
    expect(createApprovalRequestMock).toHaveBeenCalledTimes(1);
    expect(sendPushToOrgApproversMock).not.toHaveBeenCalled();
  });

  it('does NOT propagate push helper errors to the route response (best-effort)', async () => {
    sendPushToOrgApproversMock.mockRejectedValueOnce(new Error('expo down'));

    const app = await buildApp();
    const resp = await request(app)
      .post('/api/approvals')
      .send({
        resourceType: 'agent_action',
        resourceId: 'act-6',
        title: 'High but push will fail',
        priority: 'high',
      });

    expect(resp.status).toBe(201);
    expect(resp.body).toMatchObject({ id: 1234 });
    await flushMicrotasks();
    expect(sendPushToOrgApproversMock).toHaveBeenCalledTimes(1);
  });

  it('does NOT fire sendPushToOrgApprovers when the requesting user has no org context', async () => {
    // Re-mock authMiddleware without orgs. Run this test LAST because
    // vi.doMock persists into subsequent imports.
    vi.resetModules();
    vi.doMock('../middlewares/auth', () => ({
      authMiddleware: () => (req: express.Request, _res: express.Response, next: express.NextFunction) => {
        req.user = buildAuthedUser({
          displayName: 'Orphan User',
          email: null,
          orgs: [],
        });
        next();
      },
      requireRole: () => (_req: express.Request, _res: express.Response, next: express.NextFunction) =>
        next(),
    }));

    const app = await buildApp();
    const resp = await request(app)
      .post('/api/approvals')
      .send({
        resourceType: 'agent_action',
        resourceId: 'act-5',
        title: 'High but no org',
        priority: 'high',
      });

    expect(resp.status).toBe(201);
    await flushMicrotasks();
    expect(createApprovalRequestMock).toHaveBeenCalledTimes(1);
    expect(sendPushToOrgApproversMock).not.toHaveBeenCalled();
  });
});
