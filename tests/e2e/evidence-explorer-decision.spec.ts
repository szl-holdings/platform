/**
 * Regression suite — Evidence Explorer recommendation decision flow
 *
 * Companion to `artifacts/api-server/src/__tests__/evidence-graph-decision.test.ts`
 * (which locks in the API contract).  This file exercises the operator UX
 * end-to-end in a real browser: open the Evidence Explorer, select a
 * recommendation, click Approve, and verify the new decision row appears
 * in the audit log inside the drawer.
 *
 * The spec mocks every `/api/evidence-graph/**` endpoint via Playwright's
 * route interception so it does not require a healthy api-server bootstrap
 * to run — only the Command web app needs to be reachable at COMMAND_BASE.
 */

import { expect, type Route, test } from '@playwright/test';

// ---------------------------------------------------------------------------
// Path resolution
// ---------------------------------------------------------------------------
const COMMAND_BASE = (process.env.COMMAND_BASE_PATH ?? '/command').replace(/\/$/, '');
const EVIDENCE_PATH = `${COMMAND_BASE}/intelligence/evidence`;

// ---------------------------------------------------------------------------
// Availability guard — skip the entire suite if the app is not reachable
// (mirrors the pattern used by command.spec.ts and governed-decision-loop.spec.ts).
// ---------------------------------------------------------------------------
let appAvailable = true;

test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  try {
    const resp = await page.goto(EVIDENCE_PATH, {
      timeout: 15000,
      waitUntil: 'domcontentloaded',
    });
    appAvailable = !!resp && resp.status() < 500;
  } catch {
    appAvailable = false;
  }
  await page.close();
});

test.beforeEach(async ({}, testInfo) => {
  if (!appAvailable) testInfo.skip();
});

// ---------------------------------------------------------------------------
// Fixture builders — mirror the shapes the Evidence Explorer expects.
// ---------------------------------------------------------------------------
type PolicyOutcome = 'allow' | 'require-approval' | 'block' | 'pending';
type RecStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'expired'
  | 'executing'
  | 'completed'
  | 'failed';

interface Fixture {
  recId: string;
  title: string;
  policyOutcome: PolicyOutcome;
  status: RecStatus;
}

function buildRecommendation(f: Fixture) {
  return {
    recommendationId: f.recId,
    domain: 'maritime' as const,
    title: f.title,
    summary: 'Mocked recommendation summary used by the Playwright spec.',
    rationale: 'Mocked rationale.',
    suggestedAction: 'reroute',
    confidence: 0.84,
    freshness: 0.9,
    projectedImpactUsd: 250_000,
    projectedRiskReductionPct: 12,
    evidenceIds: ['ev-1', 'ev-2'],
    signalIds: ['sig-1'],
    entityRefs: [
      { entityId: 'ent-1', entityType: 'vessel', displayName: 'MV Test', domain: 'maritime' },
    ],
    status: f.status,
    policyEvaluation: {
      outcome: f.policyOutcome,
      policyIds: ['policy-test'],
      reason: f.policyOutcome === 'block' ? 'Blocked by mock policy.' : undefined,
      evaluatedAt: new Date().toISOString(),
    },
    generatedAt: new Date().toISOString(),
    tags: ['e2e'],
  };
}

function buildChain(f: Fixture) {
  return {
    recommendation: buildRecommendation(f),
    evidenceItems: [],
    entities: [
      {
        entityId: 'ent-1',
        entityType: 'vessel',
        displayName: 'MV Test',
        description: 'Mock entity',
        domain: 'maritime' as const,
        health: 'degraded' as const,
        riskScore: 60,
        opportunityScore: 30,
        activeSignalIds: ['sig-1'],
        activeRecommendationIds: [f.recId],
        snapshotAt: new Date().toISOString(),
      },
    ],
    summary: 'Mock summary explaining why this recommendation matters.',
    confidenceBreakdown: [],
    aggregateConfidence: 0.84,
  };
}

function buildStatus() {
  return {
    status: 'live',
    meshVersion: 'mock-1.0.0',
    counts: { signals: 1, evidenceItems: 2, recommendations: 1, entities: 1 },
    domainBreakdown: { signals: { maritime: 1 }, recommendations: { maritime: 1 } },
  };
}

/**
 * Install all `/api/evidence-graph/**` route handlers for one fixture and
 * return a state object that captures any decisions submitted during the
 * test.  POST .../decision flips the rec status to `accepted` and appends
 * a deterministic decision id so the UI can render the audit-log row.
 */
async function installApiMocks(
  page: import('@playwright/test').Page,
  initial: Fixture,
): Promise<{
  state: {
    fixture: Fixture;
    decisions: Array<{
      decisionId: string;
      recommendationId: string;
      decision: 'approve' | 'reject' | 'escalate' | 'defer';
      actorId: string;
      decidedAt: string;
      justification?: string;
      policyOutcome: PolicyOutcome;
      previousStatus: RecStatus;
      newStatus: RecStatus;
    }>;
    capturedPosts: Array<{ decision: string; justification?: string }>;
  };
}> {
  const state = {
    fixture: { ...initial },
    decisions: [] as Array<{
      decisionId: string;
      recommendationId: string;
      decision: 'approve' | 'reject' | 'escalate' | 'defer';
      actorId: string;
      decidedAt: string;
      justification?: string;
      policyOutcome: PolicyOutcome;
      previousStatus: RecStatus;
      newStatus: RecStatus;
    }>,
    capturedPosts: [] as Array<{ decision: string; justification?: string }>,
  };

  const fulfillJson = (route: Route, data: unknown) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data }),
    });

  await page.route('**/api/evidence-graph/status', (route) => fulfillJson(route, buildStatus()));

  // SSE endpoint — return an empty event stream so the EventSource opens but
  // never delivers messages.  The polling fallbacks remain in effect.
  await page.route('**/api/evidence-graph/stream**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      headers: { 'cache-control': 'no-cache', connection: 'keep-alive' },
      body: '',
    }),
  );

  await page.route('**/api/evidence-graph/signals**', (route) =>
    fulfillJson(route, { signals: [], total: 0, busCount: 0 }),
  );

  await page.route('**/api/evidence-graph/recommendations?**', (route) =>
    fulfillJson(route, {
      recommendations: [buildRecommendation(state.fixture)],
      total: 1,
    }),
  );

  await page.route(
    `**/api/evidence-graph/recommendations/${state.fixture.recId}`,
    (route) => fulfillJson(route, { chain: buildChain(state.fixture) }),
  );

  await page.route(
    `**/api/evidence-graph/recommendations/${state.fixture.recId}/decisions`,
    (route) => fulfillJson(route, { decisions: state.decisions }),
  );

  await page.route(
    `**/api/evidence-graph/recommendations/${state.fixture.recId}/decision`,
    async (route) => {
      const raw = route.request().postData() ?? '{}';
      let body: { decision?: string; justification?: string } = {};
      try {
        body = JSON.parse(raw);
      } catch {
        body = {};
      }
      state.capturedPosts.push({
        decision: String(body.decision ?? ''),
        justification: body.justification,
      });
      const decision = (body.decision ?? 'approve') as
        | 'approve'
        | 'reject'
        | 'escalate'
        | 'defer';
      const previousStatus = state.fixture.status;
      const newStatus: RecStatus =
        decision === 'approve'
          ? 'accepted'
          : decision === 'reject'
            ? 'rejected'
            : previousStatus;
      state.fixture.status = newStatus;
      const dec = {
        decisionId: `DEC-MOCK-${state.decisions.length + 1}`,
        recommendationId: state.fixture.recId,
        decision,
        actorId: 'tester@evidence-explorer-spec',
        decidedAt: new Date().toISOString(),
        justification: body.justification,
        policyOutcome: state.fixture.policyOutcome,
        previousStatus,
        newStatus,
      };
      state.decisions.push(dec);
      await fulfillJson(route, {
        chain: buildChain(state.fixture),
        decision: dec,
        decisions: state.decisions,
      });
    },
  );

  return { state };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Evidence Explorer — operator decision flow', () => {
  test('approves an allow-policy recommendation and shows it in the audit log', async ({
    page,
  }) => {
    const fixture: Fixture = {
      recId: 'REC-E2E-ALLOW-1',
      title: 'E2E reroute MV Test (allow policy)',
      policyOutcome: 'allow',
      status: 'pending',
    };
    const { state } = await installApiMocks(page, fixture);

    await page.goto(EVIDENCE_PATH, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    // The recommendation card renders the title text; clicking it opens the
    // Evidence Chain drawer where the decision buttons live.
    const card = page.locator('button', { hasText: fixture.title }).first();
    await expect(card).toBeVisible({ timeout: 15000 });
    await card.click();

    const approveBtn = page.locator('[data-testid="button-decision-approve"]');
    await expect(approveBtn).toBeVisible({ timeout: 10000 });
    await approveBtn.click();

    // The mocked POST returns a decision with id DEC-MOCK-1; the drawer
    // should render a row with the matching data-testid.
    const decisionRow = page.locator('[data-testid="decision-record-DEC-MOCK-1"]');
    await expect(decisionRow).toBeVisible({ timeout: 10000 });

    // The mocked POST should have been called exactly once with decision="approve"
    // and (since policy was "allow") with no justification.
    expect(state.capturedPosts.length).toBe(1);
    expect(state.capturedPosts[0]?.decision).toBe('approve');
    expect(state.capturedPosts[0]?.justification).toBeUndefined();
  });

  test('require-approval policy opens the justification modal before posting', async ({
    page,
  }) => {
    const fixture: Fixture = {
      recId: 'REC-E2E-ALLOW-1', // re-use mocked id so handlers stay simple
      title: 'E2E sanction screen (require-approval)',
      policyOutcome: 'require-approval',
      status: 'pending',
    };
    const { state } = await installApiMocks(page, fixture);

    await page.goto(EVIDENCE_PATH, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    const card = page.locator('button', { hasText: fixture.title }).first();
    await expect(card).toBeVisible({ timeout: 15000 });
    await card.click();

    const approveBtn = page.locator('[data-testid="button-decision-approve"]');
    await expect(approveBtn).toBeVisible({ timeout: 10000 });
    await approveBtn.click();

    // Justification modal should appear; no POST yet.
    const modalHeading = page.locator('text=Justification required');
    await expect(modalHeading).toBeVisible({ timeout: 5000 });
    expect(state.capturedPosts.length).toBe(0);

    const textarea = page.locator('textarea');
    await textarea.fill('Approved per board memo 2026-04 review.');
    await page.locator('button', { hasText: /Submit & Approve/i }).click();

    // POST is now sent with justification and audit-log row appears.
    const decisionRow = page.locator('[data-testid="decision-record-DEC-MOCK-1"]');
    await expect(decisionRow).toBeVisible({ timeout: 10000 });
    expect(state.capturedPosts.length).toBe(1);
    expect(state.capturedPosts[0]?.justification).toContain('board memo');
  });
});
