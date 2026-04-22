/**
 * Verifies that the cross-platform correlation detector surfaces correlations
 * to the Command Inbox (via prism-bus) and to the Approvals queue (via
 * covenant-policy) according to the documented thresholds:
 *
 *   - Inbox emission fires when strength ≥ 0.85 OR outcome === "escalated"
 *   - Approval emission fires whenever the correlation involves an unresolved
 *     policy breach (guardrail outcome "block" or "require-approval")
 *
 * Also verifies that re-running the detector against the same trace-graph
 * state does NOT spam the inbox / approvals — the in-memory dedup sets keyed
 * by correlationId must suppress duplicate emissions on the second poll.
 */

import { prismBus } from '@szl-holdings/prism-bus';
import { defaultQueryEngine, defaultTraceStore, type TraceRecord } from '@workspace/trace-graph';
import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock covenant-policy because cross-platform.ts dynamically imports it to
// create approval rows in the Postgres-backed approval store. We capture the
// calls in-process so we can assert on them without requiring a live DB.
const createApprovalRequestMock = vi.fn(async (params: Record<string, unknown>) => ({
  id: Math.floor(Math.random() * 1e9),
  ...params,
}));
const listApprovalsByResourceMock = vi.fn(
  async (_resourceType: string, _resourceId: string) =>
    [] as Array<{
      orgId: number | null;
      status: string;
    }>,
);

vi.mock('@szl-holdings/covenant-policy', () => ({
  createApprovalRequest: (params: Record<string, unknown>) => createApprovalRequestMock(params),
  listApprovalsByResource: (resourceType: string, resourceId: string) =>
    listApprovalsByResourceMock(resourceType, resourceId),
}));

import crossPlatformRouter from '../cross-platform';

type GuardrailOutcome = 'pass' | 'block' | 'warn' | 'require-approval';

function makeTrace(opts: {
  traceId: string;
  domain: string;
  startedAt: string;
  guardrailOutcome?: GuardrailOutcome;
}): TraceRecord {
  return {
    traceId: opts.traceId,
    requestId: opts.traceId,
    sessionId: null,
    workflowId: null,
    parentTraceId: null,
    agentId: `${opts.domain}-agent`,
    runId: opts.traceId,
    userId: null,
    status: 'completed',
    startedAt: opts.startedAt,
    completedAt: opts.startedAt,
    latencyMs: 100,
    totalTokens: 0,
    promptTokens: 0,
    completionTokens: 0,
    model: null,
    provider: null,
    temperature: null,
    inputs: null,
    outputs: null,
    metadata: { domain: opts.domain },
    toolCalls: [],
    guardrailResults: opts.guardrailOutcome
      ? [
          {
            guardId: `g-${opts.traceId}`,
            tier: 'action',
            outcome: opts.guardrailOutcome,
            reason: 'test',
          },
        ]
      : [],
    verifierDecisions: [],
    errors: [],
    events: [],
    tags: [],
    cost: null,
  } as unknown as TraceRecord;
}

function buildApp(): express.Express {
  const app = express();
  app.use('/api', crossPlatformRouter);
  return app;
}

function clearTraceStore(): void {
  for (const t of defaultTraceStore.list()) {
    defaultTraceStore.delete(t.traceId);
  }
}

// Wait for the fire-and-forget post-response emission to drain.
async function waitForEmissionFlush(): Promise<void> {
  for (let i = 0; i < 10; i++) {
    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
}

describe('cross-platform correlations: inbox + approvals emission', () => {
  beforeEach(() => {
    clearTraceStore();
    createApprovalRequestMock.mockClear();
    listApprovalsByResourceMock.mockClear();
    listApprovalsByResourceMock.mockResolvedValue([]);
  });

  it('high-strength entity-overlap correlation reaches the Inbox; escalated breach reaches Approvals; second poll does not duplicate', async () => {
    // ── Correlation A: high-strength entity-overlap ─────────────────────
    // 5 distinct product domains share entityId "ENT-HIGH-1".
    // Expected strength = min(0.6 + (5 - 2) * 0.12, 0.98) = 0.96 ≥ 0.85.
    // Outcome = "informational" (no guardrail block), but inbox emits on
    // high strength alone.
    const ENT_HIGH = 'ENT-HIGH-1';
    const highTraces: TraceRecord[] = [
      makeTrace({ traceId: 'tr-high-lyte', domain: 'lyte', startedAt: '2026-04-01T08:00:00Z' }),
      makeTrace({
        traceId: 'tr-high-vessels',
        domain: 'vessels',
        startedAt: '2026-04-01T08:01:00Z',
      }),
      makeTrace({ traceId: 'tr-high-terra', domain: 'terra', startedAt: '2026-04-01T08:02:00Z' }),
      makeTrace({ traceId: 'tr-high-aegis', domain: 'aegis', startedAt: '2026-04-01T08:03:00Z' }),
      makeTrace({ traceId: 'tr-high-prism', domain: 'prism', startedAt: '2026-04-01T08:04:00Z' }),
    ];
    for (const t of highTraces) {
      defaultTraceStore.save(t);
      defaultQueryEngine.linkEntityToTrace(t.traceId, ENT_HIGH);
    }

    // ── Correlation B: escalated entity-overlap with guardrail block ────
    // 2 product domains share "ENT-BREACH-1" and the lyte trace carries a
    // "block" guardrail outcome → outcome = "escalated" AND
    // hasUnresolvedPolicyBreach = true → inbox + approval emission.
    const ENT_BREACH = 'ENT-BREACH-1';
    const breachTraces: TraceRecord[] = [
      makeTrace({
        traceId: 'tr-breach-lyte',
        domain: 'lyte',
        startedAt: '2026-04-01T09:00:00Z',
        guardrailOutcome: 'block',
      }),
      makeTrace({
        traceId: 'tr-breach-vessels',
        domain: 'vessels',
        startedAt: '2026-04-01T09:01:00Z',
      }),
    ];
    for (const t of breachTraces) {
      defaultTraceStore.save(t);
      defaultQueryEngine.linkEntityToTrace(t.traceId, ENT_BREACH);
    }

    const app = buildApp();
    const sinceTimestamp = Date.now();

    // ── First poll ──────────────────────────────────────────────────────
    const res1 = await request(app).get('/api/cross-platform/correlations');
    expect(res1.status).toBe(200);

    const corrHigh = res1.body.correlations.find((c: { entityIds: string[] }) =>
      c.entityIds.includes(ENT_HIGH),
    );
    const corrBreach = res1.body.correlations.find((c: { entityIds: string[] }) =>
      c.entityIds.includes(ENT_BREACH),
    );
    expect(corrHigh).toBeDefined();
    expect(corrBreach).toBeDefined();
    expect(corrHigh.strength).toBeGreaterThanOrEqual(0.85);
    expect(corrHigh.rule).toBe('entity-overlap');
    expect(corrBreach.outcome).toBe('escalated');
    expect(corrBreach.rule).toBe('entity-overlap');

    // Wait for the post-response emission to flush.
    await waitForEmissionFlush();

    // Inbox: prism-bus history must include cross_domain_correlation events
    // for both the high-strength and the escalated-breach correlations.
    const highEvents = prismBus.getHistory({
      type: 'cross_domain_correlation',
      correlationId: corrHigh.correlationId,
      since: sinceTimestamp,
    });
    const breachEvents = prismBus.getHistory({
      type: 'cross_domain_correlation',
      correlationId: corrBreach.correlationId,
      since: sinceTimestamp,
    });
    expect(highEvents).toHaveLength(1);
    expect(highEvents[0].severity).toBe('high'); // strength ≥ 0.85, not escalated
    expect(highEvents[0].sourceId).toBe('cross-platform-correlation-detector');
    expect((highEvents[0].payload as { rule: string }).rule).toBe('entity-overlap');

    expect(breachEvents).toHaveLength(1);
    expect(breachEvents[0].severity).toBe('critical'); // outcome === "escalated"

    // Approvals: only the breach correlation should mint an approval row.
    const approvalCalls = createApprovalRequestMock.mock.calls.map(
      (c) => c[0] as Record<string, unknown>,
    );
    const breachApprovals = approvalCalls.filter(
      (p) =>
        p.resourceType === 'cross-platform-correlation' &&
        p.resourceId === corrBreach.correlationId,
    );
    const highApprovals = approvalCalls.filter(
      (p) =>
        p.resourceType === 'cross-platform-correlation' &&
        p.resourceId === corrHigh.correlationId,
    );
    expect(breachApprovals).toHaveLength(1);
    expect(breachApprovals[0].actionClass).toBe('policy-review');
    expect(breachApprovals[0].priority).toBe('critical');
    expect(breachApprovals[0].requiredApproverRole).toBe('compliance');
    expect(breachApprovals[0].correlationId).toBe(corrBreach.correlationId);
    // High-strength correlation has no unresolved policy breach → no approval.
    expect(highApprovals).toHaveLength(0);

    // ── Second poll: dedup must suppress duplicate emissions ────────────
    const inboxBefore = prismBus.getHistory({
      type: 'cross_domain_correlation',
      since: sinceTimestamp,
      limit: 1000,
    }).length;
    const approvalsBefore = createApprovalRequestMock.mock.calls.length;

    // Make the listApprovalsByResource lookup return the previously created
    // approval so even if the dedup set were bypassed, the
    // "open approval already exists" check would still suppress duplicates.
    listApprovalsByResourceMock.mockImplementation(async (resourceType, resourceId) => {
      if (
        resourceType === 'cross-platform-correlation' &&
        resourceId === corrBreach.correlationId
      ) {
        return [{ orgId: null, status: 'pending' }];
      }
      return [];
    });

    const res2 = await request(app).get('/api/cross-platform/correlations');
    expect(res2.status).toBe(200);
    await waitForEmissionFlush();

    const inboxAfter = prismBus.getHistory({
      type: 'cross_domain_correlation',
      since: sinceTimestamp,
      limit: 1000,
    }).length;
    const approvalsAfter = createApprovalRequestMock.mock.calls.length;

    expect(inboxAfter).toBe(inboxBefore);
    expect(approvalsAfter).toBe(approvalsBefore);

    // And there is still exactly one prism-bus event per correlationId.
    expect(
      prismBus.getHistory({
        type: 'cross_domain_correlation',
        correlationId: corrHigh.correlationId,
        since: sinceTimestamp,
      }),
    ).toHaveLength(1);
    expect(
      prismBus.getHistory({
        type: 'cross_domain_correlation',
        correlationId: corrBreach.correlationId,
        since: sinceTimestamp,
      }),
    ).toHaveLength(1);
  });
});
