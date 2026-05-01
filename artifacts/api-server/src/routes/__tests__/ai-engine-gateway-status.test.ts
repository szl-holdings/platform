/**
 * Tests for GET /ai/gateway/status — exposes getGatewayStatus() routing
 * context plus circuit-breaker summary consistent with /ai/health.
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

const getGatewayStatusMock = vi.fn(() => ({
  availableProviders: [
    {
      provider: 'openai' as const,
      status: 'healthy',
      configured: true,
      avgLatencyMs: 250,
      circuitState: 'closed',
    },
    {
      provider: 'anthropic' as const,
      status: 'degraded',
      configured: true,
      avgLatencyMs: 800,
      circuitState: 'half-open',
    },
  ],
  defaultStrategy: 'fastest' as const,
  supportedStrategies: ['fastest', 'cheapest', 'preferred', 'fallback'] as const,
  taskTypes: ['triage', 'plan', 'extract'],
}));

vi.mock('../../lib/ai-gateway.js', () => ({
  getGatewayStatus: getGatewayStatusMock,
}));

const getCircuitBreakerMetricsMock = vi.fn(() => ({
  openCount: 0,
  halfOpenCount: 1,
  closedCount: 5,
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
      state: 'half-open',
      consecutiveFailures: 3,
      openedAt: 1700000000000,
      lastTestedAt: 1700000060000,
      totalTripped: 2,
    },
  ],
}));

vi.mock('../../lib/ai-model-observability.js', () => ({
  getCircuitBreakerMetrics: getCircuitBreakerMetricsMock,
}));

vi.mock('@szl-holdings/ai-engine', () => ({
  alloyRetrieval: { getStats: vi.fn(() => ({})) },
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
    config: { executionMode: 'propose_only', useStructuredOutputs: false, useFunctionCalling: false, enableStreaming: false, requireApprovalForHighRisk: true },
    models: {},
    routes: {},
  })),
  GOLDEN_SET: [],
  ALLOY_TOOL_DEFINITIONS: [],
  APPROVAL_MATRIX: {},
  routeModel: vi.fn(),
  runEvals: vi.fn(),
  runEvaluatorHooksForTrace: vi.fn(),
  safeFallbackDecision: vi.fn(),
  governedStructuredCall: vi.fn(),
  proofChain: { record: vi.fn(), recordRefusal: vi.fn(), getEntries: vi.fn(() => []), getRefusalIncidents: vi.fn(() => []), getStats: vi.fn(() => ({})) },
  RefusalError: class extends Error {},
  PolicyBlockError: class extends Error {},
  updateTraceStatus: vi.fn(),
}));

const { default: aiEngineRouter } = await import('../ai-engine.js');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/', aiEngineRouter as unknown as ExpressRouter);
  return app;
}

describe('GET /ai/gateway/status', () => {
  it('returns the routing context from getGatewayStatus()', async () => {
    const res = await request(buildApp()).get('/ai/gateway/status');

    expect(res.status).toBe(200);
    expect(getGatewayStatusMock).toHaveBeenCalled();

    expect(res.body.availableProviders).toHaveLength(2);
    expect(res.body.availableProviders[0]).toMatchObject({
      provider: 'openai',
      status: 'healthy',
      configured: true,
      avgLatencyMs: 250,
      circuitState: 'closed',
    });
    expect(res.body.defaultStrategy).toBe('fastest');
    expect(res.body.supportedStrategies).toEqual([
      'fastest',
      'cheapest',
      'preferred',
      'fallback',
    ]);
    expect(res.body.taskTypes).toEqual(['triage', 'plan', 'extract']);
  });

  it('embeds the circuitBreakers field in the same shape as /ai/health', async () => {
    const res = await request(buildApp()).get('/ai/gateway/status');

    expect(res.status).toBe(200);
    expect(res.body.circuitBreakers).toBeDefined();
    expect(res.body.circuitBreakers.summary).toEqual({
      openCount: 0,
      halfOpenCount: 1,
      closedCount: 5,
    });
    expect(res.body.circuitBreakers.providers).toHaveLength(2);
    expect(res.body.circuitBreakers.providers[1]).toMatchObject({
      provider: 'anthropic',
      state: 'half-open',
      consecutiveFailures: 3,
      totalTripped: 2,
    });
    expect(typeof res.body.circuitBreakers.providers[1].openedAt).toBe('string');
    expect(typeof res.body.circuitBreakers.providers[1].lastTestedAt).toBe('string');
    expect(res.body.circuitBreakers.providers[0].openedAt).toBeNull();
  });

  it('includes an updatedAt ISO timestamp', async () => {
    const res = await request(buildApp()).get('/ai/gateway/status');

    expect(res.status).toBe(200);
    expect(typeof res.body.updatedAt).toBe('string');
    expect(() => new Date(res.body.updatedAt as string).toISOString()).not.toThrow();
  });

  it('returns 500 if getGatewayStatus throws', async () => {
    getGatewayStatusMock.mockImplementationOnce(() => {
      throw new Error('boom');
    });

    const res = await request(buildApp()).get('/ai/gateway/status');

    expect(res.status).toBe(500);
    expect(res.body.code).toBe('GATEWAY_STATUS_FAILED');
  });
});
