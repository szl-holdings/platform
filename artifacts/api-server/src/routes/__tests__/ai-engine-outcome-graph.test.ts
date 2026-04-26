/**
 * Tests verifying that /ai/respond, /ai/triage, and /ai/plan automatically
 * call recordRecommendation() from @szl-holdings/outcome-graph and attach the
 * returned outcomeGraphId to the response.
 */

import express, { type Router as ExpressRouter } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Track recordRecommendation calls
// ---------------------------------------------------------------------------

const recordRecommendationMock = vi.fn(async (params: Record<string, unknown>) => ({
  id: 42,
  domain: params.domain ?? 'general',
  entityType: params.entityType,
  recommendationText: params.recommendationText,
  status: 'pending',
  createdAt: new Date(),
}));

// ---------------------------------------------------------------------------
// Mocks — must be hoisted
// ---------------------------------------------------------------------------

vi.mock('@szl-holdings/outcome-graph', () => ({
  recordRecommendation: recordRecommendationMock,
}));

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
    () => (req: express.Request, _res: express.Response, next: express.NextFunction) => {
      (req as unknown as { user: unknown }).user = {
        id: 1,
        email: 'test@szl-holdings.test',
        displayName: 'Test User',
        roles: ['operator'],
        orgs: [{ orgId: 7, orgSlug: 'acme', orgName: 'Acme Inc', role: 'operator' }],
      };
      next();
    },
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
  ALLOY_EVENTS: {
    WORKFLOW_RUN_UPDATED: 'ALLOY_WORKFLOW_RUN_UPDATED',
    SIGNAL_CREATED: 'ALLOY_SIGNAL_CREATED',
    APPROVAL_REQUIRED: 'ALLOY_APPROVAL_REQUIRED',
    WORKFLOW_STATUS_CHANGED: 'ALLOY_WORKFLOW_STATUS_CHANGED',
  },
}));

vi.mock('../../lib/alloy-decision-store.js', () => ({
  appendAuditEntry: vi.fn(async () => {}),
  getDecision: vi.fn(async () => null),
  insertDecision: vi.fn(async () => {}),
  listAuditEntries: vi.fn(async () => ({ total: 0, entries: [] })),
  listDecisions: vi.fn(async () => ({ total: 0, decisions: [] })),
  updateDecisionStatus: vi.fn(async () => {}),
}));

// Stub the ai-engine package so tests don't need a live HF token
const FAKE_TRACE_ID = 'trace-test-1234';

vi.mock('@szl-holdings/ai-engine', () => ({
  alloyRetrieval: {
    getStats: vi.fn(() => ({})),
    retrieveKeyword: vi.fn(() => []),
    retrieveFromDb: vi.fn(async () => ({ chunks: [], query: '', method: 'semantic', totalIndexed: 0, latencyMs: 0 })),
    tenantIndexedCount: vi.fn(() => 0),
    toEvidenceItems: vi.fn(() => []),
    ingest: vi.fn(() => []),
  },
  autoEnqueueTrace: vi.fn(),
  captureTrace: vi.fn(() => ({
    traceId: FAKE_TRACE_ID,
    domain: 'alloy',
    requiresReview: false,
  })),
  chatCompletionWithFallback: vi.fn(async () => ({
    content: 'This is the AI response.',
    model: 'test-model',
    provider: 'test-provider',
    usage: { promptTokens: 10, completionTokens: 20 },
    latencyMs: 100,
    finishReason: 'stop',
  })),
  checkToolPolicy: vi.fn(() => ({ allowed: true, requiresApproval: false, reason: '' })),
  createAlloyDecision: vi.fn((p: Record<string, unknown>) => ({ ...p, decisionId: 'dec-1', approvalRequired: false, status: 'proposed' })),
  enqueueForReview: vi.fn(),
  executeToolCall: vi.fn(async () => ({ success: true, auditEntry: {} })),
  getApprovalPolicy: vi.fn(() => ({ requiresApproval: false, approverRole: 'operator', sla: '24h' })),
  getModelSlots: vi.fn(() => ({})),
  getRouteConfig: vi.fn(() => ({
    config: { executionMode: 'propose_only', useStructuredOutputs: false, useFunctionCalling: false, enableStreaming: false, requireApprovalForHighRisk: true },
    models: {},
    routes: {},
  })),
  GOLDEN_SET: [],
  ALLOY_TOOL_DEFINITIONS: [],
  APPROVAL_MATRIX: {},
  logGuardrailIfTriggered: vi.fn(),
  routeModel: vi.fn(() => ({ model: 'test-model', maxTokens: 512 })),
  runEvals: vi.fn(async () => ({ passed: 0, failed: 0, results: [] })),
  runEvaluatorHooksForTrace: vi.fn(async () => []),
  safeFallbackDecision: vi.fn((msg: string) => ({ error: msg })),
  governedStructuredCall: vi.fn(async () => ({
    result: {
      // triage / plan shared shape
      priority: 'P2',
      urgency: 'standard',
      category: 'security',
      subcategory: null,
      routeTo: 'operations',
      routeReason: 'default',
      summary: 'Security issue detected',
      keyEntities: [],
      suggestedActions: [],
      requiresHumanReview: false,
      confidence: 0.8,
      action: 'Escalate to ops team',
      actionType: 'escalate',
      evidence: [],
      impactedOwner: null,
      approvalRequired: false,
      approvalLevel: 'none',
      deadline: null,
      sla: null,
      reasoning: 'High confidence escalation required',
      alternatives: [],
      // extract shape
      entities: [],
      relationships: [],
    },
    runId: 'gsc_test-run-1',
    provenance: {
      runId: 'gsc_test-run-1',
      agentId: 'alloy',
      domain: 'alloy',
      model: 'test-model',
      provider: 'test-provider',
      promptHash: 'abc123',
      promptTokens: 10,
      completionTokens: 20,
      totalTokens: 30,
      latencyMs: 100,
      governanceVerdict: 'allowed',
      covenantFailures: [],
      generatedAt: new Date().toISOString(),
    },
    completion: {
      content: '{}',
      model: 'test-model',
      provider: 'test-provider',
      usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      latencyMs: 100,
      finishReason: 'stop',
      toolCalls: [],
      raw: {},
    },
  })),
  proofChain: {
    record: vi.fn(),
    recordRefusal: vi.fn(),
    getEntries: vi.fn(() => []),
    getRefusalIncidents: vi.fn(() => []),
    getStats: vi.fn(() => ({
      totalCalls: 0,
      schemaAdherenceRate: 100,
      refusalCount: 0,
      refusalRate: 0,
      policyBlockCount: 0,
      policyBlockRate: 0,
      avgConfidence: null,
      byDomain: {},
      recentOutputs: [],
      openRefusalIncidents: 0,
      generatedAt: new Date().toISOString(),
    })),
  },
  RefusalError: class RefusalError extends Error {
    runId = 'test';
    incidentId = 'test';
    domain = 'test';
    constructor(msg: string) { super(msg); this.name = 'RefusalError'; }
  },
  PolicyBlockError: class PolicyBlockError extends Error {
    runId = 'test';
    failedRules: string[] = [];
    constructor(msg: string) { super(msg); this.name = 'PolicyBlockError'; }
  },
  updateTraceStatus: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Import router after mocks
// ---------------------------------------------------------------------------

const { default: aiEngineRouter } = await import('../ai-engine.js');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/', aiEngineRouter as unknown as ExpressRouter);
  return app;
}

beforeEach(() => {
  recordRecommendationMock.mockClear();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AI engine auto-tracks recommendations via outcome-graph', () => {
  describe('POST /ai/respond', () => {
    it('calls recordRecommendation and returns outcomeGraphId in the response', async () => {
      const res = await request(buildApp())
        .post('/ai/respond')
        .send({ messages: [{ role: 'user', content: 'Hello AI' }] });

      expect(res.status).toBe(200);
      expect(res.body.outcomeGraphId).toBe(42);

      expect(recordRecommendationMock).toHaveBeenCalledTimes(1);
      const call = recordRecommendationMock.mock.calls[0]?.[0] as Record<string, unknown>;
      expect(call.domain).toBe('general');
      expect(call.entityType).toBe('chat_response');
      expect(call.agentId).toBe('alloy');
      expect(call.correlationId).toBe(FAKE_TRACE_ID);
      expect(typeof call.recommendationText).toBe('string');
      expect((call.recommendationText as string).length).toBeGreaterThan(0);
    });

    it('still returns a valid response if recordRecommendation throws', async () => {
      recordRecommendationMock.mockRejectedValueOnce(new Error('DB unavailable'));

      const res = await request(buildApp())
        .post('/ai/respond')
        .send({ messages: [{ role: 'user', content: 'Hello AI' }] });

      expect(res.status).toBe(200);
      expect(res.body.content).toBeDefined();
      expect(res.body.outcomeGraphId).toBeNull();
    });

    it('returns 400 when messages are missing, without calling recordRecommendation', async () => {
      const res = await request(buildApp()).post('/ai/respond').send({});

      expect(res.status).toBe(400);
      expect(recordRecommendationMock).not.toHaveBeenCalled();
    });
  });

  describe('POST /ai/triage', () => {
    it('calls recordRecommendation and returns outcomeGraphId in the response', async () => {
      const res = await request(buildApp())
        .post('/ai/triage')
        .send({ input: 'Suspicious login from unusual location', context: 'User account' });

      expect(res.status).toBe(200);
      expect(res.body.outcomeGraphId).toBe(42);

      expect(recordRecommendationMock).toHaveBeenCalledTimes(1);
      const call = recordRecommendationMock.mock.calls[0]?.[0] as Record<string, unknown>;
      expect(call.domain).toBe('general');
      expect(call.entityType).toBe('triage_decision');
      expect(call.agentId).toBe('alloy');
      expect(call.correlationId).toBe(FAKE_TRACE_ID);
      expect(call.confidence).toBe(0.8);
      expect(call.recommendationAction).toBe('operations');
    });

    it('still returns a valid response if recordRecommendation throws', async () => {
      recordRecommendationMock.mockRejectedValueOnce(new Error('DB unavailable'));

      const res = await request(buildApp())
        .post('/ai/triage')
        .send({ input: 'Suspicious login' });

      expect(res.status).toBe(200);
      expect(res.body.decision).toBeDefined();
      expect(res.body.outcomeGraphId).toBeNull();
    });

    it('returns 400 when input is missing, without calling recordRecommendation', async () => {
      const res = await request(buildApp()).post('/ai/triage').send({});

      expect(res.status).toBe(400);
      expect(recordRecommendationMock).not.toHaveBeenCalled();
    });
  });

  describe('POST /ai/plan', () => {
    it('calls recordRecommendation and returns outcomeGraphId in the response', async () => {
      const res = await request(buildApp())
        .post('/ai/plan')
        .send({ objective: 'Reduce infrastructure costs by 20%', context: 'Q4 budget review' });

      expect(res.status).toBe(200);
      expect(res.body.outcomeGraphId).toBe(42);

      expect(recordRecommendationMock).toHaveBeenCalledTimes(1);
      const call = recordRecommendationMock.mock.calls[0]?.[0] as Record<string, unknown>;
      expect(call.domain).toBe('general');
      expect(call.entityType).toBe('action_plan');
      expect(call.agentId).toBe('alloy');
      expect(call.correlationId).toBe(FAKE_TRACE_ID);
      expect(call.confidence).toBe(0.8);
      expect(call.recommendationAction).toBe('escalate');
    });

    it('still returns a valid response if recordRecommendation throws', async () => {
      recordRecommendationMock.mockRejectedValueOnce(new Error('DB unavailable'));

      const res = await request(buildApp())
        .post('/ai/plan')
        .send({ objective: 'Reduce costs' });

      expect(res.status).toBe(200);
      expect(res.body.plan).toBeDefined();
      expect(res.body.outcomeGraphId).toBeNull();
    });

    it('returns 400 when objective is missing, without calling recordRecommendation', async () => {
      const res = await request(buildApp()).post('/ai/plan').send({});

      expect(res.status).toBe(400);
      expect(recordRecommendationMock).not.toHaveBeenCalled();
    });
  });
});
