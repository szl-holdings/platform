/**
 * Tests for GET /ai/health — asserts the structured response shape, in
 * particular the `circuitBreakers` block consumed by the operator dashboard
 * and external monitoring. Guards against silent regressions in the
 * provider-health contract.
 */

import express, { type Router as ExpressRouter } from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@szl-holdings/observability', async () => {
  const m = await import('../../__tests__/helpers/mocks.js');
  return m.createObservabilityMock();
});

vi.mock('@szl-holdings/db', async () => {
  const m = await import('../../__tests__/helpers/mocks.js');
  return m.createDbMock();
});

vi.mock('drizzle-orm', async () => {
  const m = await import('../../__tests__/helpers/mocks.js');
  return m.createDrizzleOrmMock();
});

vi.mock('../../lib/logger.js', async () => {
  const m = await import('../../__tests__/helpers/mocks.js');
  return m.createLoggerMock();
});

vi.mock('../../middlewares/auth.js', () => ({
  authMiddleware:
    () => (_req: express.Request, _res: express.Response, next: express.NextFunction) =>
      next(),
  requireRole:
    () => (_req: express.Request, _res: express.Response, next: express.NextFunction) =>
      next(),
}));

vi.mock('../../middlewares/telemetry.js', () => ({
  withDbSpan: (_req: unknown, fn: () => unknown) => fn(),
}));

vi.mock('../../middlewares/platform-auth.js', () => ({
  platformAuth:
    () => (_req: express.Request, _res: express.Response, next: express.NextFunction) =>
      next(),
  logPlatformEvent: vi.fn(),
}));

vi.mock('../../lib/platform-flags.js', () => ({
  isFlagEnabled: vi.fn(async () => false),
}));

vi.mock('../../lib/pubsub-bridge.js', () => ({
  broadcastWs: vi.fn(),
  pubsub: { publish: vi.fn() },
  ALLOY_EVENTS: {},
}));

vi.mock('../../lib/alloy-decision-store.js', () => ({
  appendAuditEntry: vi.fn(async () => {}),
  getDecision: vi.fn(async () => null),
  insertDecision: vi.fn(async () => {}),
  listAuditEntries: vi.fn(async () => ({ total: 0, entries: [] })),
  listDecisions: vi.fn(async () => ({ total: 0, decisions: [] })),
  updateDecisionStatus: vi.fn(async () => {}),
}));

vi.mock('../../lib/ai-gateway.js', () => ({
  getGatewayStatus: vi.fn(() => ({
    availableProviders: [],
    defaultStrategy: 'fastest',
    supportedStrategies: [],
    taskTypes: [],
  })),
}));

const getCircuitBreakerMetricsMock = vi.fn(() => ({
  openCount: 1,
  halfOpenCount: 1,
  closedCount: 3,
  circuits: [
    {
      provider: 'openai',
      state: 'closed',
      consecutiveFailures: 0,
      openedAt: null,
      lastTestedAt: null,
      totalTripped: 0,
    },
    {
      provider: 'anthropic',
      state: 'open',
      consecutiveFailures: 5,
      openedAt: 1700000000000,
      lastTestedAt: 1700000060000,
      totalTripped: 4,
    },
    {
      provider: 'huggingface',
      state: 'half-open',
      consecutiveFailures: 2,
      openedAt: 1700000020000,
      lastTestedAt: 1700000080000,
      totalTripped: 1,
    },
  ],
}));

vi.mock('../../lib/ai-model-observability.js', () => ({
  getCircuitBreakerMetrics: getCircuitBreakerMetricsMock,
}));

vi.mock('@szl-holdings/ai-engine', () => ({
  alloyRetrieval: { getStats: vi.fn(() => ({ docs: 0 })) },
  autoEnqueueTrace: vi.fn(),
  captureTrace: vi.fn(),
  chatCompletionWithFallback: vi.fn(),
  checkToolPolicy: vi.fn(),
  createAlloyDecision: vi.fn(),
  enqueueForReview: vi.fn(),
  executeToolCall: vi.fn(),
  getApprovalPolicy: vi.fn(),
  getModelSlots: vi.fn(() => ({})),
  getRouteConfig: vi.fn(() => ({
    config: {
      executionMode: 'propose_only',
      useStructuredOutputs: true,
      useFunctionCalling: false,
      enableStreaming: true,
      requireApprovalForHighRisk: true,
    },
    models: { triage: 'gpt-4o-mini', plan: 'gpt-4o' },
    routes: { triage: {}, plan: {}, extract: {} },
  })),
  GOLDEN_SET: [],
  ALLOY_TOOL_DEFINITIONS: [],
  APPROVAL_MATRIX: {},
  routeModel: vi.fn(),
  runEvals: vi.fn(),
  runEvaluatorHooksForTrace: vi.fn(),
  safeFallbackDecision: vi.fn(),
  governedStructuredCall: vi.fn(),
  proofChain: {
    record: vi.fn(),
    recordRefusal: vi.fn(),
    getEntries: vi.fn(() => []),
    getRefusalIncidents: vi.fn(() => []),
    getStats: vi.fn(() => ({})),
  },
  RefusalError: class extends Error {},
  PolicyBlockError: class extends Error {},
  updateTraceStatus: vi.fn(),
}));

const { default: aiEngineRouter } = await import('../ai-engine.js');
const { circuitBreakerResponseSchema } = await import('../../lib/circuit-breaker-contract.js');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/', aiEngineRouter as unknown as ExpressRouter);
  return app;
}

describe('GET /ai/health', () => {
  it('returns the high-level configuration block', async () => {
    const res = await request(buildApp()).get('/ai/health');

    expect(res.status).toBe(200);
    expect(typeof res.body.status).toBe('string');
    expect(['configured', 'no_token']).toContain(res.body.status);
    expect(res.body.provider).toBe('propose_only');
    expect(Array.isArray(res.body.routes)).toBe(true);
    expect(res.body.routes).toEqual(expect.arrayContaining(['triage', 'plan', 'extract']));
    expect(res.body.config).toMatchObject({
      structuredOutputs: true,
      functionCalling: false,
      streaming: true,
      executionMode: 'propose_only',
      approvalForHighRisk: true,
    });
    expect(typeof res.body.auditLogSize).toBe('number');
  });

  it('exposes a circuitBreakers block that conforms to the shared schema', async () => {
    const res = await request(buildApp()).get('/ai/health');

    expect(res.status).toBe(200);
    expect(getCircuitBreakerMetricsMock).toHaveBeenCalled();

    const parsed = circuitBreakerResponseSchema.parse(res.body.circuitBreakers);

    expect(parsed.summary).toEqual({
      openCount: 1,
      halfOpenCount: 1,
      closedCount: 3,
    });
    expect(parsed.providers).toHaveLength(3);

    const closed = parsed.providers.find((p) => p.provider === 'openai');
    expect(closed).toMatchObject({
      state: 'closed',
      consecutiveFailures: 0,
      openedAt: null,
    });

    const opened = parsed.providers.find((p) => p.provider === 'anthropic');
    expect(opened).toMatchObject({
      state: 'open',
      consecutiveFailures: 5,
    });
    expect(typeof opened?.openedAt).toBe('string');
  });
});
