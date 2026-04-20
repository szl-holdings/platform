import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../middlewares/auth.js', () => ({
  authMiddleware: () => (req: Record<string, unknown>, _res: unknown, next: () => void) => {
    req.user = {
      id: 1,
      roles: ['ops'],
      orgs: [{ orgId: 7 }],
    };
    next();
  },
  requireRole: () => (_req: unknown, _res: unknown, next: () => void) => next(),
  isElevatedUser: () => false,
}));

vi.mock('../../lib/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('../../lib/validation', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('../../lib/validation');
  return {
    ...actual,
    validateBody: () => (_req: unknown, _res: unknown, next: () => void) => next(),
  };
});

vi.mock('../../lib/guardian-engine', () => ({
  getGuardianEngine: () => ({ getRules: () => [] }),
  syncGuardianPolicies: vi.fn(),
}));

vi.mock('../../lib/alloy-run-manager-singleton', () => ({
  getAlloyRunManager: () => ({ recordApprovalDecision: vi.fn() }),
}));

const approvals = new Map<
  number,
  {
    id: number;
    orgId: number | null;
    status: string;
    payload: Record<string, unknown> | null;
    correlationId?: string;
  }
>();

vi.mock('@szl-holdings/covenant-policy', () => ({
  getApprovalById: async (id: number) => approvals.get(id) ?? null,
  reviewApproval: async ({ approvalId, decision }: { approvalId: number; decision: string }) => {
    const a = approvals.get(approvalId);
    if (a) a.status = decision;
    return a;
  },
  ApprovalAccessDeniedError: class ApprovalAccessDeniedError extends Error {},
  createApprovalRequest: vi.fn(),
  listApprovals: vi.fn(),
  listPendingApprovals: vi.fn(),
}));

import type { PlanGraph } from '@workspace/planner';
import { defaultPlanStore } from '@workspace/planner';
import approvalsRouter from '../approvals';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api', approvalsRouter);
  return app;
}

function planFixture(planId: string, orgId: string): PlanGraph {
  const now = Date.now();
  return {
    planId,
    rank: 0,
    title: 'T',
    objective: 'obj',
    status: 'executing',
    steps: [
      {
        stepId: 's1',
        index: 0,
        title: 'Gated',
        description: '',
        dependsOn: [],
        status: 'blocked',
        route: {
          modelProvider: 'openai',
          model: 'gpt-5',
          routeClass: 'reasoning',
          estimatedCostUsd: 0.01,
          selectedBy: 'priority',
          fallbackChain: [],
        },
        estimatedValue: 0.5,
        estimatedRisk: 0.5,
        riskLevel: 'high',
        requiredEvidence: [],
        requiredApproval: true,
        rollbackPoints: [],
        inputs: {},
        metadata: {},
      },
    ],
    executionOrder: ['s1'],
    estimatedCostUsd: 0.01,
    estimatedValue: 0.5,
    estimatedRisk: 0.5,
    riskLevel: 'high',
    confidence: 0.7,
    fallbacks: [],
    context: { orgId },
    metadata: {},
    createdAt: now,
    updatedAt: now,
  };
}

describe('approval review → plan step flip tenant guard', () => {
  beforeEach(async () => {
    approvals.clear();
    const all = await defaultPlanStore.list({ limit: 1000 });
    for (const p of all.items) await defaultPlanStore.delete(p.planId);
  });

  it('flips the gated step when approval and plan share the same org', async () => {
    await defaultPlanStore.put(planFixture('plan-same-org', '7'));
    approvals.set(100, {
      id: 100,
      orgId: 7,
      status: 'pending',
      payload: { planId: 'plan-same-org', stepId: 's1' },
    });

    const app = buildApp();
    await request(app)
      .post('/api/approvals/100/review')
      .send({ decision: 'approved', note: 'ok' })
      .expect(200);

    const updated = await defaultPlanStore.get('plan-same-org');
    const step = updated!.steps.find((s) => s.stepId === 's1')!;
    expect(step.status).toBe('ready');
  });

  it('does NOT flip the step when approval payload references a plan in a different org', async () => {
    await defaultPlanStore.put(planFixture('plan-other-org', '99'));
    approvals.set(101, {
      id: 101,
      orgId: 7,
      status: 'pending',
      payload: { planId: 'plan-other-org', stepId: 's1' },
    });

    const app = buildApp();
    await request(app)
      .post('/api/approvals/101/review')
      .send({ decision: 'approved', note: 'trying to cross-tenant' })
      .expect(200);

    const untouched = await defaultPlanStore.get('plan-other-org');
    const step = untouched!.steps.find((s) => s.stepId === 's1')!;
    // Step must remain blocked — cross-tenant flip blocked by guard.
    expect(step.status).toBe('blocked');
  });
});
