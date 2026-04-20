/**
 * Verifies the cross-platform endpoints attach an authoritative owning product
 * per entity, computed from the trace store (originating product = earliest
 * trace's domain). The Command UI consumes these fields to deep-link entities
 * to the correct product without relying on string-prefix heuristics.
 */

import { defaultQueryEngine, defaultTraceStore, type TraceRecord } from '@workspace/trace-graph';
import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import crossPlatformRouter from '../cross-platform';

function makeTrace(opts: {
  traceId: string;
  domain: string;
  startedAt: string;
  entityIds: string[];
  agentId?: string;
}): TraceRecord {
  return {
    traceId: opts.traceId,
    requestId: opts.traceId,
    sessionId: null,
    workflowId: null,
    parentTraceId: null,
    agentId: opts.agentId ?? `${opts.domain}-agent`,
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
    guardrailResults: [],
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
  // The query engine maintains an internal entity index; reset by re-linking
  // is not exposed, so we rely on a fresh process per test file. For repeat
  // safety, drop entries by re-walking links via known entity ids in tests.
}

describe('cross-platform endpoints expose authoritative entity owner', () => {
  beforeEach(() => {
    clearTraceStore();
  });

  it('correlations: entityOwners maps entity → originating (earliest) product', async () => {
    const earlyVesselsTrace = makeTrace({
      traceId: 'tr-vessels-early',
      domain: 'vessels',
      startedAt: '2026-04-01T10:00:00Z',
      entityIds: ['IMO-9999001'],
    });
    const laterTerraTrace = makeTrace({
      traceId: 'tr-terra-later',
      domain: 'terra',
      startedAt: '2026-04-01T11:00:00Z',
      entityIds: ['IMO-9999001'],
    });

    defaultTraceStore.save(earlyVesselsTrace);
    defaultTraceStore.save(laterTerraTrace);
    defaultQueryEngine.linkEntityToTrace('tr-vessels-early', 'IMO-9999001');
    defaultQueryEngine.linkEntityToTrace('tr-terra-later', 'IMO-9999001');

    const app = buildApp();
    const res = await request(app).get('/api/cross-platform/correlations');

    expect(res.status).toBe(200);
    const corr = res.body.correlations.find((c: { entityIds: string[] }) =>
      c.entityIds.includes('IMO-9999001'),
    );
    expect(corr).toBeDefined();
    // Authoritative owner is the earliest recorder = vessels, even though
    // terra also recorded the entity later.
    expect(corr.entityOwners).toEqual({ 'IMO-9999001': 'vessels' });
  });

  it('correlations: omits entityOwners entry when no authoritative owner exists', async () => {
    // Two traces with non-product domains record the same entity. Owner
    // cannot be authoritatively assigned; entityOwners must NOT include the
    // entity (UI falls back to its local heuristic).
    const traceA = makeTrace({
      traceId: 'tr-unknown-a',
      domain: 'unknown-a',
      startedAt: '2026-04-03T10:00:00Z',
      entityIds: ['MYSTERY-1'],
    });
    const traceB = makeTrace({
      traceId: 'tr-unknown-b',
      domain: 'unknown-b',
      startedAt: '2026-04-03T11:00:00Z',
      entityIds: ['MYSTERY-1'],
    });
    defaultTraceStore.save(traceA);
    defaultTraceStore.save(traceB);
    defaultQueryEngine.linkEntityToTrace('tr-unknown-a', 'MYSTERY-1');
    defaultQueryEngine.linkEntityToTrace('tr-unknown-b', 'MYSTERY-1');

    const app = buildApp();
    const res = await request(app).get('/api/cross-platform/correlations');

    expect(res.status).toBe(200);
    const corr = res.body.correlations.find((c: { entityIds: string[] }) =>
      c.entityIds.includes('MYSTERY-1'),
    );
    if (corr) {
      // If a correlation surfaced for these non-product domains, the owner
      // must not be guessed.
      expect(corr.entityOwners?.['MYSTERY-1']).toBeUndefined();
    }
  });

  it('evidence: each node carries entityOwner from the trace store', async () => {
    const lyteTrace = makeTrace({
      traceId: 'tr-lyte-1',
      domain: 'lyte',
      startedAt: '2026-04-02T09:00:00Z',
      entityIds: ['INC-42'],
    });
    // Mention from a Vessels trace later — must not flip ownership.
    const vesselsTrace = makeTrace({
      traceId: 'tr-vessels-1',
      domain: 'vessels',
      startedAt: '2026-04-02T10:00:00Z',
      entityIds: ['INC-42'],
    });

    defaultTraceStore.save(lyteTrace);
    defaultTraceStore.save(vesselsTrace);
    defaultQueryEngine.linkEntityToTrace('tr-lyte-1', 'INC-42');
    defaultQueryEngine.linkEntityToTrace('tr-vessels-1', 'INC-42');

    const app = buildApp();
    const res = await request(app).get('/api/cross-platform/evidence');

    expect(res.status).toBe(200);
    const nodes = res.body.nodes as Array<{
      traceId: string;
      entityId: string;
      entityOwner: string;
    }>;
    const lyteRunNode = nodes.find((n) => n.traceId === 'tr-lyte-1' && n.entityId === 'INC-42');
    const vesselsRunNode = nodes.find(
      (n) => n.traceId === 'tr-vessels-1' && n.entityId === 'INC-42',
    );
    expect(lyteRunNode?.entityOwner).toBe('lyte');
    // Even on the Vessels-domain evidence node, the entity owner is the
    // originating product (lyte), not the trace's product.
    expect(vesselsRunNode?.entityOwner).toBe('lyte');
  });
});
