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

const executePlanMock = vi.fn();
vi.mock('@workspace/alloy/plan-orchestrator', () => ({
  executePlan: (...args: unknown[]) => executePlanMock(...args),
  approvePlanStep: vi.fn(),
}));

import type { PlanGraph } from '@workspace/planner';
import { defaultPlanStore } from '@workspace/planner';
import plansRouter from '../plans';

function makePlan(): PlanGraph {
  const now = Date.now();
  return {
    planId: 'plan-fb-1',
    rank: 0,
    title: 'Primary',
    objective: 'test',
    status: 'draft',
    steps: [
      {
        stepId: 's1',
        index: 0,
        title: 'Act',
        description: '',
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
        estimatedValue: 0.5,
        estimatedRisk: 0.2,
        riskLevel: 'low',
        requiredEvidence: [],
        requiredApproval: false,
        rollbackPoints: [],
        inputs: {},
        metadata: {},
      },
    ],
    executionOrder: ['s1'],
    estimatedCostUsd: 0.05,
    estimatedValue: 0.5,
    estimatedRisk: 0.2,
    riskLevel: 'low',
    confidence: 0.7,
    fallbacks: ['plan-fb-2'],
    context: { orgId: '7' },
    metadata: {},
    createdAt: now,
    updatedAt: now,
  };
}

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api', plansRouter);
  return app;
}

describe('POST /api/plans/:id/execute — fallback failover', () => {
  beforeEach(async () => {
    executePlanMock.mockReset();
    const all = await defaultPlanStore.list({ limit: 1000 });
    for (const p of all.items) await defaultPlanStore.delete(p.planId);
  });

  it('surfaces a successful failover run from the orchestrator (rootPlanId + fallbacksUsed)', async () => {
    await defaultPlanStore.put(makePlan());
    executePlanMock.mockResolvedValueOnce({
      runId: 'run-1',
      planId: 'plan-fb-2',
      rootPlanId: 'plan-fb-1',
      status: 'completed',
      executedSteps: [
        { stepId: 's1', status: 'failed', error: 'boom', durationMs: 5 },
        { stepId: 's1', status: 'completed', durationMs: 3 },
      ],
      fallbacksUsed: ['plan-fb-2'],
    });

    const app = buildApp();
    const res = await request(app).post('/api/plans/plan-fb-1/execute').send({}).expect(200);

    const data = res.body.data ?? res.body;
    expect(data.run.status).toBe('completed');
    expect(data.run.rootPlanId).toBe('plan-fb-1');
    expect(data.run.planId).toBe('plan-fb-2');
    expect(data.run.fallbacksUsed).toEqual(['plan-fb-2']);
  });

  it('surfaces awaiting-approval shape from the orchestrator', async () => {
    await defaultPlanStore.put(makePlan());
    executePlanMock.mockResolvedValueOnce({
      runId: 'run-2',
      planId: 'plan-fb-1',
      rootPlanId: 'plan-fb-1',
      status: 'awaiting-approval',
      executedSteps: [],
      awaitingApproval: { planId: 'plan-fb-1', stepId: 's1', reason: 'high risk' },
      fallbacksUsed: [],
    });

    const app = buildApp();
    const res = await request(app).post('/api/plans/plan-fb-1/execute').send({}).expect(200);

    const data = res.body.data ?? res.body;
    expect(data.run.status).toBe('awaiting-approval');
    expect(data.run.awaitingApproval.stepId).toBe('s1');
  });
});
