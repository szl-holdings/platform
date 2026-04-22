/**
 * HTTP-layer integration tests for POST /:domain/atlas/evaluation-hooks/replay
 *
 * The route handler in `routes/domain-atlas-execution.ts` has guards that are
 * not reachable from the engine-level tests:
 *   - `hookId` required          → 400
 *   - hook not found             → 404
 *   - hook in different domain   → 403
 *   - hook not replayable        → 422
 *   - happy path                 → 201 with benchmarkComparison metrics
 *
 * These tests mount the real Express router and stub the underlying engine
 * functions so we exercise the route's request/response contract without
 * touching the database.
 */

import express, { type IRouter } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const mockGetEvaluationHookById = vi.fn();
const mockIngestSignal = vi.fn();
const mockExecutedomainWorkflow = vi.fn();
const mockRegisterEvaluationHook = vi.fn();

vi.mock('../lib/atlas-execution-engine.js', () => {
  return {
    initializeAtlasExecutionEngine: vi.fn(),
    ingestSignal: (...args: unknown[]) => mockIngestSignal(...args),
    getSignals: vi.fn().mockResolvedValue([]),
    updateSignalStatus: vi.fn().mockResolvedValue(true),
    captureEvidence: vi.fn().mockResolvedValue({}),
    getEvidence: vi.fn().mockResolvedValue([]),
    recordOutcome: vi.fn().mockResolvedValue({}),
    getOutcomes: vi.fn().mockResolvedValue([]),
    getEvaluationHooks: vi.fn().mockResolvedValue([]),
    getEvaluationHookById: (...args: unknown[]) => mockGetEvaluationHookById(...args),
    registerEvaluationHook: (...args: unknown[]) => mockRegisterEvaluationHook(...args),
    evaluateSignalsForDomain: vi.fn().mockResolvedValue([]),
    checkDomainPolicy: vi.fn().mockReturnValue({ allowed: true, effect: 'allow' }),
    executedomainWorkflow: (...args: unknown[]) => mockExecutedomainWorkflow(...args),
    DOMAIN_WORKFLOWS: {
      'aegis-incident-response': {
        id: 'aegis-incident-response',
        name: 'Aegis Security Incident Response',
        domain: 'aegis',
        steps: [],
      },
      'vessels-voyage-risk': {
        id: 'vessels-voyage-risk',
        name: 'Vessels Voyage Risk',
        domain: 'vessels',
        steps: [],
      },
    },
  };
});

vi.mock('../lib/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('../lib/decisioning-store.js', () => ({
  dbListRuns: vi.fn().mockResolvedValue({ runs: [], total: 0 }),
  dbGetRunById: vi.fn().mockResolvedValue(null),
  dbCancelRun: vi.fn().mockResolvedValue(false),
  dbApproveRun: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../middlewares/auth.js', () => ({
  authMiddleware:
    (_opts?: unknown) => (req: Record<string, unknown>, _res: unknown, next: () => void) => {
      req.isInternalAgent = true;
      next();
    },
}));

vi.mock('../middlewares/sliding-window-limiter.js', () => ({
  perUserApiSlidingLimiter: (_req: unknown, _res: unknown, next: () => void) => next(),
  perUserWriteSlidingLimiter: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

// ---------------------------------------------------------------------------
// Router import (after mocks)
// ---------------------------------------------------------------------------

const domainAtlasRouter = (await import('../routes/domain-atlas-execution.js')).default;

function buildApp(): express.Application {
  const app = express();
  app.use(express.json());
  const router = express.Router() as IRouter;
  router.use(domainAtlasRouter);
  app.use(router);
  return app;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeHook(overrides: Record<string, unknown> = {}) {
  return {
    id: 'hook-aegis-1',
    domain: 'aegis',
    workflowId: 'run-original-1',
    workflowName: 'Aegis Security Incident Response',
    triggerSignalId: 'sig-1',
    replayable: true,
    snapshotAt: Date.now(),
    benchmarkMetrics: {
      latencyMs: 420,
      stepsCompleted: 5,
      stepsFailed: 0,
    },
    signalSnapshot: [
      {
        id: 'sig-1',
        domain: 'aegis',
        signalType: 'security-incident',
        severity: 'high',
        title: 'Lateral movement',
        description: '',
        confidence: 0.9,
        source: 'siem',
        payload: {},
        status: 'raw',
        tenantId: 't1',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ],
    runSnapshot: {
      runId: 'run-original-1',
      workflowId: 'aegis-incident-response',
      workflowName: 'Aegis Security Incident Response',
      executionMode: 'semi_auto',
      isDryRun: false,
      isSimulation: false,
      status: 'completed',
      currentStepIndex: 0,
      steps: [],
      approvalState: 'none',
      auditTrail: [],
      startedAt: Date.now() - 1000,
      completedAt: Date.now(),
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /:domain/atlas/evaluation-hooks/replay — HTTP guards', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();
    mockIngestSignal.mockResolvedValue({ id: 'sig-replayed' });
    mockRegisterEvaluationHook.mockResolvedValue({ id: 'replay-hook-1' });
    app = buildApp();
  });

  it('returns 400 when hookId is missing from the request body', async () => {
    const res = await request(app).post('/aegis/atlas/evaluation-hooks/replay').send({});

    expect(res.status).toBe(400);
    expect(mockGetEvaluationHookById).not.toHaveBeenCalled();
  });

  it('returns 404 when the hookId does not match any stored hook', async () => {
    mockGetEvaluationHookById.mockResolvedValueOnce(undefined);

    const res = await request(app)
      .post('/aegis/atlas/evaluation-hooks/replay')
      .send({ hookId: 'missing-hook' });

    expect(res.status).toBe(404);
    expect(mockGetEvaluationHookById).toHaveBeenCalledWith('missing-hook', undefined);
    expect(mockExecutedomainWorkflow).not.toHaveBeenCalled();
  });

  it('returns 403 when the hook belongs to a different domain than the URL', async () => {
    mockGetEvaluationHookById.mockResolvedValueOnce(makeHook({ domain: 'vessels' }));

    const res = await request(app)
      .post('/aegis/atlas/evaluation-hooks/replay')
      .send({ hookId: 'hook-vessels-1' });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/different domain/i);
    expect(mockExecutedomainWorkflow).not.toHaveBeenCalled();
  });

  it('returns 422 when the hook is not marked as replayable', async () => {
    mockGetEvaluationHookById.mockResolvedValueOnce(makeHook({ replayable: false }));

    const res = await request(app)
      .post('/aegis/atlas/evaluation-hooks/replay')
      .send({ hookId: 'hook-aegis-1' });

    expect(res.status).toBe(422);
    expect(res.body.error).toMatch(/not.*replayable/i);
    expect(mockExecutedomainWorkflow).not.toHaveBeenCalled();
  });

  it('returns 201 with benchmark metrics in the response body on a valid replay', async () => {
    mockGetEvaluationHookById.mockResolvedValueOnce(makeHook());
    mockExecutedomainWorkflow.mockResolvedValueOnce({
      run: {
        runId: 'run-replay-1',
        workflowId: 'aegis-incident-response',
        workflowName: 'Aegis Security Incident Response',
        executionMode: 'semi_auto',
        isDryRun: true,
        isSimulation: false,
        status: 'completed',
        currentStepIndex: 0,
        steps: [
          { stepId: 's1', stepName: 'Step 1', status: 'completed' },
          { stepId: 's2', stepName: 'Step 2', status: 'completed' },
          { stepId: 's3', stepName: 'Step 3', status: 'failed' },
        ],
        approvalState: 'none',
        auditTrail: [],
        startedAt: Date.now() - 50,
        completedAt: Date.now(),
      },
      requiresApproval: false,
      dryRunSummary: 'Replay completed',
    });

    const res = await request(app)
      .post('/aegis/atlas/evaluation-hooks/replay')
      .send({ hookId: 'hook-aegis-1', isDryRun: true });

    expect(res.status).toBe(201);

    const body = res.body as Record<string, unknown>;
    expect(body.domain).toBe('aegis');
    expect(body.replayedHookId).toBe('hook-aegis-1');
    expect(body.replayHookId).toBe('replay-hook-1');
    expect(typeof body.latencyMs).toBe('number');

    const bc = body.benchmarkComparison as Record<string, unknown>;
    expect(bc).toBeDefined();
    expect(bc.originalLatencyMs).toBe(420);
    expect(bc.originalStepsCompleted).toBe(5);
    expect(typeof bc.replayLatencyMs).toBe('number');
    expect(bc.replayStepsCompleted).toBe(2);

    // The replay endpoint must register a new hook capturing benchmark metrics
    expect(mockRegisterEvaluationHook).toHaveBeenCalledOnce();
    const registered = mockRegisterEvaluationHook.mock.calls[0][0] as {
      replayable: boolean;
      benchmarkMetrics: { latencyMs: number; stepsCompleted: number; stepsFailed: number };
      workflowName: string;
    };
    expect(registered.replayable).toBe(false);
    expect(registered.workflowName).toMatch(/\[REPLAY\]/);
    expect(registered.benchmarkMetrics.stepsCompleted).toBe(2);
    expect(registered.benchmarkMetrics.stepsFailed).toBe(1);
    expect(typeof registered.benchmarkMetrics.latencyMs).toBe('number');
  });
});
