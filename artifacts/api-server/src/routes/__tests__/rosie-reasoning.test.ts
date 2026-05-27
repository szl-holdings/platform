/**
 * Integration tests for the ROSIE Reasoning API surface
 * (artifacts/api-server/src/routes/rosie-reasoning.ts).
 *
 * Mounts the router on a bare express app with the auth / tenant / guardian
 * middlewares stubbed pass-through, but lets the pure reasoning packages
 * (@workspace/planner, @workspace/forecast-fabric, @workspace/agents-evals,
 * @szl-holdings/ai-engine, @szl-holdings/evidence-ledger) and the in-process
 * approvals-inbox run for real. That way we are exercising the actual
 * Λ-receipt chain linking and the fail-closed HITL contract, not their mocks.
 */

import express, { type Router as ExpressRouter } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/logger.js', async () => {
  const m = await import('../../__tests__/helpers/mocks.js');
  return m.createLoggerMock();
});

vi.mock('../../middlewares/auth.js', () => ({
  authMiddleware:
    () => (_req: express.Request, _res: express.Response, next: express.NextFunction) =>
      next(),
  requireAnyAuth:
    () => (_req: express.Request, _res: express.Response, next: express.NextFunction) =>
      next(),
  requireRole:
    () => (_req: express.Request, _res: express.Response, next: express.NextFunction) =>
      next(),
}));

vi.mock('../../middlewares/tenant-scope.js', () => ({
  tenantScope:
    () => (_req: express.Request, _res: express.Response, next: express.NextFunction) =>
      next(),
  recordTenantIsolationViolation: vi.fn(),
  getEffectiveOrgIds: vi.fn(() => null),
  assertTenantAccess: vi.fn(),
  getUserOrgIds: vi.fn(() => null),
}));

vi.mock('../../middlewares/guardian-policy.js', () => ({
  guardianPolicyCheck:
    () => (_req: express.Request, _res: express.Response, next: express.NextFunction) =>
      next(),
}));

// Approvals-inbox is mocked so we can drive both success and failure paths
// of the fail-closed HITL contract from the test.
const submitPendingApprovalRequestMock = vi.fn();
vi.mock('@workspace/approvals-inbox', () => ({
  submitPendingApprovalRequest: (...args: unknown[]) => submitPendingApprovalRequestMock(...args),
}));

const { default: reasoningRouter } = await import('../rosie-reasoning.js');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api', reasoningRouter as unknown as ExpressRouter);
  return app;
}

beforeEach(() => {
  submitPendingApprovalRequestMock.mockReset();
  submitPendingApprovalRequestMock.mockImplementation(({ runId }: { runId: string }) => ({
    id: `${runId}::request-hitl`,
    runId,
    stepId: 'request-hitl',
    stepName: 'mock',
    action: 'mock',
    justification: 'mock',
    projectedImpact: 'mock',
    projectedRisk: 'mock',
    requestedBy: 'mock',
    domain: 'rosie',
    surface: 'reasoning',
    submittedAt: 1700000000000,
    expiresAt: 1700000300000,
    status: 'pending',
  }));
});

describe('POST /api/rosie/plan', () => {
  it('returns a DAG with a chain-linked Λ-receipt', async () => {
    const res = await request(buildApp())
      .post('/api/rosie/plan')
      .send({
        goal: ['done'],
        initialState: ['ready'],
        actions: [
          { id: 'a', title: 'A', preconditions: ['ready'], effects: ['done'] },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.dag.executionOrder).toEqual(['a']);
    expect(res.body.receipt.kind).toBe('plan.dag.v1');
    expect(res.body.receipt.governance).toMatchObject({
      standard: 'doctrine-v6',
      pillar: 'governed-autonomy',
      authority: 'graph-planner',
    });
    expect(typeof res.body.receipt.prevHash).toBe('string');
    expect(typeof res.body.receipt.receiptHash).toBe('string');
    expect(res.body.receipt.receiptHash).not.toBe(res.body.receipt.prevHash);
  });

  it('rejects an unreachable goal with 422 PLAN_REJECTED', async () => {
    const res = await request(buildApp())
      .post('/api/rosie/plan')
      .send({
        goal: ['unreachable'],
        initialState: [],
        actions: [{ id: 'noop', title: 'noop', preconditions: [], effects: ['nothing'] }],
      });
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('PLAN_REJECTED');
  });
});

describe('POST /api/rosie/ctm', () => {
  it('runs the CTM loop and seals a broadcast receipt', async () => {
    const res = await request(buildApp())
      .post('/api/rosie/ctm')
      .send({ input: 'monitor drone for breaches', ticks: 3, seed: 11 });
    expect(res.status).toBe(200);
    expect(res.body.result.ticks).toHaveLength(3);
    expect(res.body.receipt.kind).toBe('consciousness.broadcast.v1');
    expect(res.body.receipt.governance.authority).toBe('ctm-loop');
  });
});

describe('GET /api/rosie/ctm/stream', () => {
  it('emits hello → tick* → done SSE frames', async () => {
    const res = await request(buildApp())
      .get('/api/rosie/ctm/stream?input=test&ticks=2&seed=3');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/event-stream/);
    expect(res.text).toContain('event: hello');
    expect(res.text).toContain('event: tick');
    expect(res.text).toContain('event: done');
  });
});

describe('POST /api/rosie/temporal', () => {
  it('scores a monotonic series and seals a time-r1 receipt', async () => {
    const t0 = Date.now();
    const series = Array.from({ length: 20 }, (_, i) => ({ t: t0 + i * 60_000, v: i % 5 }));
    const res = await request(buildApp())
      .post('/api/rosie/temporal')
      .send({ seriesId: 'unit', series });
    expect(res.status).toBe(200);
    expect(res.body.forecast.seriesId).toBe('unit');
    expect(res.body.receipt.kind).toBe('anomaly.time-r1.v1');
    expect(res.body.receipt.governance.pillar).toBe('evidence-first');
  });

  it('rejects non-monotonic series with 422 CAUSAL_PRIOR_VIOLATION', async () => {
    const t0 = Date.now();
    const series = [
      { t: t0, v: 1 },
      { t: t0 - 1_000, v: 2 },
      { t: t0 + 10_000, v: 3 },
    ];
    const res = await request(buildApp())
      .post('/api/rosie/temporal')
      .send({ series });
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('CAUSAL_PRIOR_VIOLATION');
  });

  it('accepts non-monotonic series when allowNonMonotonic=true', async () => {
    const t0 = Date.now();
    const series = [
      { t: t0, v: 1 },
      { t: t0 - 1_000, v: 2 },
      { t: t0 + 10_000, v: 3 },
      { t: t0 + 20_000, v: 4 },
    ];
    const res = await request(buildApp())
      .post('/api/rosie/temporal')
      .send({ series, allowNonMonotonic: true });
    expect(res.status).toBe(200);
  });
});

describe('GET /api/rosie/marble/scenarios + POST /api/rosie/marble/run', () => {
  it('lists scenarios and runs one with a chain-linked receipt', async () => {
    const list = await request(buildApp()).get('/api/rosie/marble/scenarios');
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body.scenarios)).toBe(true);
    expect(list.body.scenarios.length).toBeGreaterThan(0);
    const scenarioId = list.body.scenarios[0].scenarioId;

    const run = await request(buildApp())
      .post('/api/rosie/marble/run')
      .send({ scenarioId, seed: 1 });
    expect(run.status).toBe(200);
    expect(run.body.result.scenarioId).toBe(scenarioId);
    expect(run.body.receipt.kind).toBe('bench.marble.v1');
    expect(run.body.receipt.governance.authority).toBe('marble-bench');
  });

  it('returns 404 for an unknown scenario id', async () => {
    const res = await request(buildApp())
      .post('/api/rosie/marble/run')
      .send({ scenarioId: 'does-not-exist' });
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
  });
});

describe('POST /api/rosie/demos/drone-oversight (composed flow)', () => {
  it('seals four Λ-receipts and queues a pending approval on requires-hitl', async () => {
    const res = await request(buildApp())
      .post('/api/rosie/demos/drone-oversight')
      .send({ seed: 7 });
    expect(res.status).toBe(200);
    expect(res.body.verdict).toBe('requires-hitl');
    expect(Object.keys(res.body.receipts)).toEqual(['plan', 'temporal', 'ctm', 'oversight']);
    // Chain links: oversight.prevHash must equal one of the earlier hashes
    // (specifically the most recent one — ctm).
    expect(res.body.receipts.oversight.prevHash).toBe(res.body.receipts.ctm.receiptHash);
    expect(submitPendingApprovalRequestMock).toHaveBeenCalledTimes(1);
    expect(res.body.pendingApproval).not.toBeNull();
    expect(res.body.pendingApproval.id).toContain('::request-hitl');
  });

  it('fails CLOSED with 503 when the approvals-inbox throws', async () => {
    submitPendingApprovalRequestMock.mockImplementationOnce(() => {
      throw new Error('inbox down');
    });
    const res = await request(buildApp())
      .post('/api/rosie/demos/drone-oversight')
      .send({ seed: 7 });
    expect(res.status).toBe(503);
    expect(res.body.code).toBe('HITL_INBOX_UNAVAILABLE');
    expect(res.body.details?.receiptId).toMatch(/^lr_/);
  });

  it('fails CLOSED with 503 when the approvals-inbox returns no record', async () => {
    submitPendingApprovalRequestMock.mockImplementationOnce(
      () => undefined as unknown as { id: string; submittedAt: number },
    );
    const res = await request(buildApp())
      .post('/api/rosie/demos/drone-oversight')
      .send({ seed: 7 });
    expect(res.status).toBe(503);
    expect(res.body.code).toBe('HITL_INBOX_EMPTY_RESPONSE');
  });

  it('namespaces every approvals-inbox write to the rosie-demo domain', async () => {
    await request(buildApp())
      .post('/api/rosie/demos/drone-oversight')
      .send({ seed: 7 });
    const lastCall = submitPendingApprovalRequestMock.mock.calls.at(-1)?.[0] as
      | { domain?: string; surface?: string }
      | undefined;
    expect(lastCall?.domain).toBe('rosie-demo');
    expect(lastCall?.surface).toBe('reasoning-demo');
  });

  it('rate-limits anonymous demo traffic with 429 DEMO_RATE_LIMITED', async () => {
    const app = buildApp();
    // Drive the bucket past DEMO_RL_PER_MINUTE (=6) — supertest always opens
    // sockets from the same loopback peer, so req.ip is stable across requests
    // (matching the production guarantee that XFF is not trusted by default).
    let lastStatus = 0;
    let lastCode: string | undefined;
    for (let i = 0; i < 10; i++) {
      const res = await request(app).post('/api/rosie/demos/drone-oversight').send({ seed: 7 });
      lastStatus = res.status;
      lastCode = res.body.code;
      if (res.status === 429) break;
    }
    expect(lastStatus).toBe(429);
    expect(lastCode).toBe('DEMO_RATE_LIMITED');
  });

  it('ignores client-supplied X-Forwarded-For when DEMO_RL_TRUST_XFF is unset', async () => {
    const app = buildApp();
    // Even with a unique XFF on every call, the limiter must key on the real
    // socket peer and still 429 the same anonymous client.
    let lastStatus = 0;
    for (let i = 0; i < 12; i++) {
      const res = await request(app)
        .post('/api/rosie/demos/drone-oversight')
        .set('x-forwarded-for', `198.51.100.${i + 1}`)
        .send({ seed: 7 });
      lastStatus = res.status;
      if (res.status === 429) break;
    }
    expect(lastStatus).toBe(429);
  });
});

describe('GET /api/rosie/reasoning/receipts', () => {
  it('walks the chain in reverse-chronological order with monotonically linked hashes', async () => {
    // Drive some receipts first so the chain is non-empty.
    await request(buildApp())
      .post('/api/rosie/plan')
      .send({
        goal: ['done'],
        initialState: ['ready'],
        actions: [{ id: 'a', title: 'A', preconditions: ['ready'], effects: ['done'] }],
      });
    await request(buildApp())
      .post('/api/rosie/ctm')
      .send({ input: 'ping', ticks: 2, seed: 1 });

    const res = await request(buildApp()).get('/api/rosie/reasoning/receipts?limit=10');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.receipts)).toBe(true);
    expect(res.body.receipts.length).toBeGreaterThanOrEqual(2);
    expect(typeof res.body.chainHead).toBe('string');
    // Newest-first ordering: the first item's receiptHash equals chainHead.
    expect(res.body.receipts[0].receiptHash).toBe(res.body.chainHead);
    // Each older entry's receiptHash must equal the next-newer entry's prevHash.
    for (let i = 0; i < res.body.receipts.length - 1; i++) {
      expect(res.body.receipts[i].prevHash).toBe(res.body.receipts[i + 1].receiptHash);
    }
  });

  it('returns 404 for an unknown receipt id', async () => {
    const res = await request(buildApp()).get('/api/rosie/reasoning/receipts/lr_missing');
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
  });
});
