import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../middlewares/auth.js', () => ({
  authMiddleware: () => (req: Record<string, unknown>, _res: unknown, next: () => void) => {
    req.user = {
      id: 42,
      roles: ['admin'],
      orgs: [{ orgId: 7 }],
    };
    next();
  },
  isElevatedUser: (u: { roles?: string[] }) =>
    Boolean(u?.roles?.some((r) => r === 'super_admin' || r === 'admin')),
}));

vi.mock('../../lib/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { type PlanGraph, defaultPlanStore } from '@workspace/planner';
import plansRouter from '../plans';

function makePlan(overrides: Partial<PlanGraph> = {}): PlanGraph {
  const now = Date.now();
  return {
    planId: 'plan-test-1',
    rank: 0,
    title: 'Test Plan',
    objective: 'test',
    status: 'draft',
    steps: [
      {
        stepId: 's1',
        index: 0,
        title: 'Risky step',
        description: 'needs approval',
        dependsOn: [],
        status: 'pending',
        route: {
          modelProvider: 'openai',
          model: 'gpt-5',
          routeClass: 'reasoning',
          estimatedCostUsd: 0.05,
          selectedBy: 'priority',
          fallbackChain: [],
        },
        estimatedValue: 0.7,
        estimatedRisk: 0.8,
        riskLevel: 'high',
        requiredEvidence: [],
        requiredApproval: true,
        approvalReason: 'high risk reasoning',
        rollbackPoints: [],
        inputs: {},
        metadata: {},
      },
      {
        stepId: 's2',
        index: 1,
        title: 'Safe step',
        description: 'no approval needed',
        dependsOn: ['s1'],
        status: 'pending',
        route: {
          modelProvider: 'openai',
          model: 'gpt-5',
          routeClass: 'summarization',
          estimatedCostUsd: 0.01,
          selectedBy: 'cost',
          fallbackChain: [],
        },
        estimatedValue: 0.5,
        estimatedRisk: 0.1,
        riskLevel: 'low',
        requiredEvidence: [],
        requiredApproval: false,
        rollbackPoints: [],
        inputs: {},
        metadata: {},
      },
    ],
    executionOrder: ['s1', 's2'],
    estimatedCostUsd: 0.06,
    estimatedValue: 0.6,
    estimatedRisk: 0.45,
    riskLevel: 'medium',
    confidence: 0.7,
    fallbacks: [],
    context: { orgId: '7' },
    metadata: {},
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api', plansRouter);
  return app;
}

describe('plans step approval routes', () => {
  beforeEach(async () => {
    // Reset store between tests
    const all = await defaultPlanStore.list({ limit: 1000 });
    for (const p of all.items) await defaultPlanStore.delete(p.planId);
  });

  it('approves a gated step and clears the approval flag', async () => {
    await defaultPlanStore.put(makePlan());
    const app = buildApp();

    const res = await request(app)
      .post('/api/plans/plan-test-1/steps/s1/approve')
      .send({ note: 'looks fine' })
      .expect(200);

    const data = res.body.data ?? res.body;
    const s1 = data.steps.find((s: { stepId: string }) => s.stepId === 's1');
    expect(s1.requiredApproval).toBe(false);
    expect(s1.status).toBe('ready');
    expect(s1.metadata.approvalDecision.decision).toBe('approved');
    expect(s1.metadata.approvalDecision.note).toBe('looks fine');
    expect(data.metadata.stepDecisions.s1.decision).toBe('approved');
  });

  it('denies a gated step and marks it skipped', async () => {
    await defaultPlanStore.put(makePlan());
    const app = buildApp();

    const res = await request(app)
      .post('/api/plans/plan-test-1/steps/s1/deny')
      .send({ note: 'too risky' })
      .expect(200);

    const data = res.body.data ?? res.body;
    const s1 = data.steps.find((s: { stepId: string }) => s.stepId === 's1');
    expect(s1.status).toBe('skipped');
    expect(s1.requiredApproval).toBe(true); // flag stays so audit trail is clear
    expect(s1.metadata.approvalDecision.decision).toBe('denied');
  });

  it('rejects a gated step via the /reject alias', async () => {
    await defaultPlanStore.put(makePlan());
    const app = buildApp();

    const res = await request(app)
      .post('/api/plans/plan-test-1/steps/s1/reject')
      .send({ note: 'nope' })
      .expect(200);

    const data = res.body.data ?? res.body;
    const s1 = data.steps.find((s: { stepId: string }) => s.stepId === 's1');
    expect(s1.status).toBe('skipped');
    expect(s1.metadata.approvalDecision.decision).toBe('denied');
  });

  it('rejects approval on a step that is not gated', async () => {
    await defaultPlanStore.put(makePlan());
    const app = buildApp();

    await request(app).post('/api/plans/plan-test-1/steps/s2/approve').send({}).expect(400);
  });

  it('returns 404 for unknown plans and steps', async () => {
    await defaultPlanStore.put(makePlan());
    const app = buildApp();

    await request(app).post('/api/plans/missing/steps/s1/approve').send({}).expect(404);

    await request(app).post('/api/plans/plan-test-1/steps/missing/approve').send({}).expect(404);
  });

  it('lists fallbacks for a plan', async () => {
    const fb = makePlan({
      planId: 'plan-test-fb',
      rank: 1,
      title: 'Fallback A',
      fallbackOf: 'plan-test-1',
    });
    await defaultPlanStore.put(fb);
    await defaultPlanStore.put(makePlan({ fallbacks: ['plan-test-fb'] }));
    const app = buildApp();

    const res = await request(app).get('/api/plans/plan-test-1/fallbacks').expect(200);

    const data = res.body.data ?? res.body;
    expect(data.items).toHaveLength(1);
    expect(data.items[0].planId).toBe('plan-test-fb');
  });
});
