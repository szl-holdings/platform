/**
 * Evidence Graph — Recommendation Decision API tests (Task #2095)
 *
 * Locks in the contract for POST /evidence-graph/recommendations/:id/decision
 * and GET  /evidence-graph/recommendations/:id/decisions:
 *
 *   policy outcome = block               → 403 (operator cannot action here)
 *   approve + outcome = require-approval → 400 without justification (≥4 chars)
 *   approve + outcome = require-approval → 200 with valid justification
 *   approve + outcome = allow            → 200 (no justification required)
 *   second decision on a terminal status → status preserved, decision recorded
 *   GET .../decisions returns every decision recorded for the recommendation
 *
 * It also asserts that every successful decision publishes an outcome Signal
 * to the bus carrying:
 *   provenance.correlationId === recommendationId
 *   source                   === 'human'
 *   rawPayload.sourceSurface === 'evidence-explorer'
 *
 * Without this coverage a refactor could silently drop the policy gates, the
 * justification rule, the terminal-status guard, or the outcome-signal emit.
 */

import express from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@szl-holdings/observability', async () => {
  const m = await import('./helpers/mocks.js');
  return m.createObservabilityMock();
});

vi.mock('../middlewares/sliding-window-limiter', () => ({
  perUserApiSlidingLimiter: (
    _req: express.Request,
    _res: express.Response,
    next: express.NextFunction,
  ) => next(),
}));

vi.mock('../middlewares/auth', () => ({
  authMiddleware:
    () => (req: express.Request, _res: express.Response, next: express.NextFunction) => {
      (req as unknown as { user: unknown }).user = {
        id: 4242,
        email: 'operator@evidence.test',
        displayName: 'Operator Test',
        roles: ['operator'],
        orgs: [{ orgId: 7, orgSlug: 'acme', orgName: 'Acme', role: 'operator' }],
      };
      next();
    },
  parseIdParam:
    () => (_req: express.Request, _res: express.Response, next: express.NextFunction) =>
      next(),
  requireRole:
    () => (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
  InvalidIdError: class extends Error {},
}));

vi.mock('../lib/logger', async () => {
  const m = await import('./helpers/mocks.js');
  return m.createLoggerMock();
});

// ---------------------------------------------------------------------------
// Imports must come AFTER vi.mock calls so the router picks up the mocks.
// ---------------------------------------------------------------------------

const { defaultRecommendationStore } = await import('@szl-holdings/evidence-graph');
const { defaultSignalBus } = await import('@szl-holdings/signal-mesh');
const { createRecommendation } = await import('@workspace/ontology/evidence');
const { default: evidenceGraphRouter } = await import('../routes/evidence-graph.js');

import type { Signal } from '@workspace/ontology/signal';

type PolicyOutcome = 'allow' | 'require-approval' | 'block' | 'pending';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api', evidenceGraphRouter);
  return app;
}

let recCounter = 0;
function seedRecommendation(outcome: PolicyOutcome) {
  recCounter += 1;
  const rec = createRecommendation({
    domain: 'security',
    title: `Test recommendation ${recCounter} (${outcome})`,
    summary: 'Synthetic recommendation seeded for decision-flow tests.',
    rationale: 'Test rationale — exercises the decision route gates.',
    suggestedAction: 'review',
    confidence: 0.8,
    freshness: 0.9,
    projectedImpact: 'Test projected impact.',
    projectedRisk: 'Test projected risk.',
    evidenceIds: [],
    signalIds: [],
    entityRefs: [],
    policyEvaluation: { outcome, policyIds: [`pol-${outcome}`] },
    generatedAt: new Date().toISOString(),
  });
  defaultRecommendationStore.save(rec);
  return rec;
}

interface DecisionResponseBody {
  decision: {
    decisionId: string;
    recommendationId: string;
    decision: 'approve' | 'reject' | 'escalate' | 'defer';
    actorId: string;
    justification?: string;
    policyOutcome: PolicyOutcome;
    previousStatus: string;
    newStatus: string;
    decidedAt: string;
  };
  recommendation: { recommendationId: string; status: string };
  decisions: DecisionResponseBody['decision'][];
}

describe('POST /evidence-graph/recommendations/:id/decision — gating + audit', () => {
  let publishedOutcomeSignals: Signal[] = [];
  let unsub: { unsubscribe(): void } | null = null;

  beforeEach(() => {
    publishedOutcomeSignals = [];
    unsub = defaultSignalBus.on('outcome', (s) => {
      publishedOutcomeSignals.push(s);
    });
  });

  afterEach(() => {
    unsub?.unsubscribe();
  });

  it('returns 403 when the recommendation policy outcome is "block"', async () => {
    const rec = seedRecommendation('block');
    const res = await request(buildApp())
      .post(`/api/evidence-graph/recommendations/${rec.recommendationId}/decision`)
      .send({ decision: 'approve', justification: 'override attempt' });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
    // Status must remain pending; no decision recorded.
    expect(defaultRecommendationStore.get(rec.recommendationId)?.status).toBe('pending');
    expect(defaultRecommendationStore.listDecisions(rec.recommendationId)).toHaveLength(0);
    expect(publishedOutcomeSignals).toHaveLength(0);
  });

  it('returns 400 when require-approval policy is approved without a justification', async () => {
    const rec = seedRecommendation('require-approval');
    const res = await request(buildApp())
      .post(`/api/evidence-graph/recommendations/${rec.recommendationId}/decision`)
      .send({ decision: 'approve' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('BAD_REQUEST');
    expect(res.body.error).toMatch(/justification/i);
    expect(defaultRecommendationStore.get(rec.recommendationId)?.status).toBe('pending');
    expect(defaultRecommendationStore.listDecisions(rec.recommendationId)).toHaveLength(0);
    expect(publishedOutcomeSignals).toHaveLength(0);
  });

  it('returns 400 when require-approval justification is too short (<4 chars)', async () => {
    const rec = seedRecommendation('require-approval');
    const res = await request(buildApp())
      .post(`/api/evidence-graph/recommendations/${rec.recommendationId}/decision`)
      .send({ decision: 'approve', justification: 'ok' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('BAD_REQUEST');
  });

  it('returns 200 for approve on require-approval with a valid justification', async () => {
    const rec = seedRecommendation('require-approval');
    const justification = 'Reviewed evidence chain and operator approves remediation.';
    const res = await request(buildApp())
      .post(`/api/evidence-graph/recommendations/${rec.recommendationId}/decision`)
      .send({ decision: 'approve', justification });

    expect(res.status).toBe(200);
    const body = res.body as DecisionResponseBody;
    expect(body.decision.decision).toBe('approve');
    expect(body.decision.justification).toBe(justification);
    expect(body.decision.policyOutcome).toBe('require-approval');
    expect(body.decision.previousStatus).toBe('pending');
    expect(body.decision.newStatus).toBe('accepted');
    expect(body.recommendation.status).toBe('accepted');

    // Decision was persisted.
    expect(defaultRecommendationStore.get(rec.recommendationId)?.status).toBe('accepted');
    expect(defaultRecommendationStore.listDecisions(rec.recommendationId)).toHaveLength(1);

    // Outcome signal emitted with the required correlation/source markers.
    expect(publishedOutcomeSignals).toHaveLength(1);
    const sig = publishedOutcomeSignals[0]!;
    expect(sig.type).toBe('outcome');
    expect(sig.source).toBe('human');
    expect(sig.provenance?.correlationId).toBe(rec.recommendationId);
    const payload = sig.rawPayload as Record<string, unknown>;
    expect(payload.sourceSurface).toBe('evidence-explorer');
    expect(payload.recommendationId).toBe(rec.recommendationId);
    expect(payload.decision).toBe('approve');
  });

  it('returns 200 for approve on policy outcome "allow" without justification', async () => {
    const rec = seedRecommendation('allow');
    const res = await request(buildApp())
      .post(`/api/evidence-graph/recommendations/${rec.recommendationId}/decision`)
      .send({ decision: 'approve' });

    expect(res.status).toBe(200);
    const body = res.body as DecisionResponseBody;
    expect(body.decision.policyOutcome).toBe('allow');
    expect(body.decision.newStatus).toBe('accepted');
    expect(defaultRecommendationStore.get(rec.recommendationId)?.status).toBe('accepted');

    expect(publishedOutcomeSignals).toHaveLength(1);
    const sig = publishedOutcomeSignals[0]!;
    expect(sig.source).toBe('human');
    expect(sig.provenance?.correlationId).toBe(rec.recommendationId);
    expect((sig.rawPayload as Record<string, unknown>).sourceSurface).toBe('evidence-explorer');
  });

  it('preserves a terminal status on a second decision but still records the new decision', async () => {
    const rec = seedRecommendation('allow');
    const app = buildApp();

    // First decision flips status to "accepted" (terminal).
    const first = await request(app)
      .post(`/api/evidence-graph/recommendations/${rec.recommendationId}/decision`)
      .send({ decision: 'approve' });
    expect(first.status).toBe(200);
    expect(defaultRecommendationStore.get(rec.recommendationId)?.status).toBe('accepted');

    // Second decision — operator tries to reject. Status must NOT flip back.
    const second = await request(app)
      .post(`/api/evidence-graph/recommendations/${rec.recommendationId}/decision`)
      .send({ decision: 'reject' });
    expect(second.status).toBe(200);

    const body = second.body as DecisionResponseBody;
    expect(body.decision.decision).toBe('reject');
    expect(body.decision.previousStatus).toBe('accepted');
    expect(body.decision.newStatus).toBe('accepted'); // terminal preserved
    expect(body.recommendation.status).toBe('accepted');
    expect(defaultRecommendationStore.get(rec.recommendationId)?.status).toBe('accepted');

    // Both decisions remain in the audit log.
    expect(defaultRecommendationStore.listDecisions(rec.recommendationId)).toHaveLength(2);

    // Both decisions emitted outcome signals (one per POST).
    expect(publishedOutcomeSignals).toHaveLength(2);
  });

  it('GET /decisions returns every decision recorded for the recommendation', async () => {
    const rec = seedRecommendation('allow');
    const app = buildApp();

    await request(app)
      .post(`/api/evidence-graph/recommendations/${rec.recommendationId}/decision`)
      .send({ decision: 'defer' });
    await request(app)
      .post(`/api/evidence-graph/recommendations/${rec.recommendationId}/decision`)
      .send({ decision: 'escalate' });

    const res = await request(app).get(
      `/api/evidence-graph/recommendations/${rec.recommendationId}/decisions`,
    );
    expect(res.status).toBe(200);
    const body = res.body as { decisions: DecisionResponseBody['decision'][] };
    expect(body.decisions).toHaveLength(2);
    const kinds = body.decisions.map((d) => d.decision);
    expect(kinds).toEqual(['defer', 'escalate']);
    for (const d of body.decisions) {
      expect(d.recommendationId).toBe(rec.recommendationId);
      expect(d.actorId).toBe('4242');
    }
  });
});
