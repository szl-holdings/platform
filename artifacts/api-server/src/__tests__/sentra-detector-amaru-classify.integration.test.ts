/**
 * Route-level test for the Amaru cortex classification hook inside
 * `POST /api/sentra/detectors/:id/run`.
 *
 * Asserts:
 *   1. Findings are classified BEFORE persistence (the row written to
 *      `sentra_findings` carries the post-classification severity and
 *      the `amaru_*` override columns).
 *   2. A11oy handoff fires on the POST-classification severity (a
 *      detector-emitted `medium` that the cortex bumps to `high`
 *      triggers `crossProductHandoff`; without the bump it would not).
 */
import express from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@szl-holdings/db', async () => {
  const m = await import('./helpers/mocks.js');
  return m.createDbMock();
});
vi.mock('drizzle-orm', async () => {
  const m = await import('./helpers/mocks.js');
  return m.createDrizzleOrmMock();
});
vi.mock('../lib/logger.js', async () => {
  const m = await import('./helpers/mocks.js');
  return m.createLoggerMock();
});
vi.mock('../middlewares/auth.js', async () => {
  const m = await import('./helpers/mocks.js');
  return m.createAuthMiddlewareMock();
});

// Capture inserted finding rows for assertion.
const insertedFindings: Array<Record<string, unknown>[]> = [];
vi.mock('@szl-holdings/db', async () => {
  const helpers = await import('./helpers/mocks.js');
  const base = helpers.createDbMock();
  // Override insert() so we can inspect what the route persists.
  (base as { db: Record<string, unknown> }).db.insert = (table: unknown) => ({
    values: (rows: unknown) => {
      // The detector-runs insert and the findings insert both pass
      // through here; we only capture findings-shaped rows (have
      // `severity` + `runId`).
      const arr = Array.isArray(rows) ? rows : [rows];
      const looksLikeFinding = arr.every(
        (r) =>
          r &&
          typeof r === 'object' &&
          'severity' in (r as Record<string, unknown>) &&
          'runId' in (r as Record<string, unknown>),
      );
      if (looksLikeFinding) insertedFindings.push(arr as Record<string, unknown>[]);
      return {
        returning: () => Promise.resolve([]),
        onConflictDoNothing: () => ({ returning: () => Promise.resolve([]) }),
      };
    },
    onConflictDoUpdate: () => Promise.resolve([]),
  });
  // GET single detector row used by the run route — return our TS detector.
  const tableProxy = new Proxy({}, { get: () => () => ({}) });
  (base as { db: Record<string, unknown> }).db.select = () => ({
    from: () => ({
      where: () => ({
        limit: () =>
          Promise.resolve([
            {
              id: 'ts/test-bumpable',
              label: 'test bumpable',
              description: 'd',
              kind: 'heuristic',
              runtime: 'ts',
              inputs: [],
              costClass: 'free',
              governanceClass: 'advisory',
              attackTechniques: ['T1046'],
              version: null,
              sidecarBaseUrl: null,
              chainReceiptId: null,
              enabled: 'true',
              registeredAt: new Date(),
              lastSeenAt: new Date(),
            },
          ]),
      }),
    }),
    _table: tableProxy,
  });
  return base;
});

// Capture handoff calls.
const handoffMock = vi.fn(async () => undefined);
vi.mock('@workspace/a11oy-orchestration/client', () => ({
  crossProductHandoff: (...args: unknown[]) => handoffMock(...args),
}));

// Mock the classifier so we can deterministically force a 'medium' →
// 'high' bump without standing up the Amaru sidecar.
vi.mock('../lib/sentra-amaru-classifier.ts', async () => {
  const actual = await import('../lib/sentra-amaru-classifier.js');
  return {
    ...actual,
    classifyFindings: async (
      findings: import('@szl-holdings/sentra-detector-sdk').Finding[],
    ) =>
      findings.map((f) => ({
        finding: { ...f, severity: 'high' as const, score: 0.8 },
        classifiedAt: '2026-05-18T00:00:00.000Z',
        originalSeverity: f.severity,
        originalScoreBps: Math.round(f.score * 10_000),
        classification: {
          mode: 'amaru-cortex' as const,
          reason: 'forced bump for test',
          bumpedSteps: 1,
          adversaryTags: ['apt-test'],
        },
      })),
  };
});

beforeEach(async () => {
  insertedFindings.length = 0;
  handoffMock.mockClear();
  const { sentraDetectorRegistry } = await import(
    '../lib/sentra-detector-registry.js'
  );
  sentraDetectorRegistry.clear();
  sentraDetectorRegistry.register({
    manifest: {
      id: 'ts/test-bumpable',
      label: 'test bumpable',
      description: 'd',
      kind: 'heuristic',
      runtime: 'ts',
      inputs: [],
      costClass: 'free',
      governanceClass: 'advisory',
      attackTechniques: ['T1046'],
    },
    // Emits a single `medium` finding; the classifier mock bumps it to `high`.
    evaluate: async (ctx) => [
      {
        id: `${ctx.detectorId}#${ctx.runId}#0`,
        detectorId: ctx.detectorId,
        runId: ctx.runId,
        severity: 'medium',
        score: 0.4,
        title: 'demo',
        summary: 'demo',
        attackTechniques: ['T1046'],
        affectedAssets: [],
        evidence: {},
        governanceClass: 'advisory',
        emittedAt: new Date().toISOString(),
      },
    ],
  });
});

async function buildApp() {
  const mod = await import('../routes/sentra-detector-framework.js');
  const app = express();
  app.use(express.json());
  app.use('/api', mod.default);
  return app;
}

describe('POST /api/sentra/detectors/:id/run — Amaru classification hook', () => {
  it('persists the post-classification severity + records the override on the finding', async () => {
    const app = await buildApp();
    const { default: request } = await import('supertest');
    const res = await request(app)
      .post('/api/sentra/detectors/ts%2Ftest-bumpable/run')
      .send({ triggeredBy: 'test' });
    expect(res.status).toBe(201);

    // Findings in the response reflect the post-classification view.
    expect(res.body.findings).toHaveLength(1);
    expect(res.body.findings[0].severity).toBe('high');

    // Per-finding amaru block is surfaced.
    expect(res.body.amaruClassifications).toHaveLength(1);
    expect(res.body.amaruClassifications[0].originalSeverity).toBe('medium');
    expect(res.body.amaruClassifications[0].severity).toBe('high');

    // Persisted row carries post-classification severity AND the override
    // columns so reviewers can see what the detector originally emitted.
    expect(insertedFindings).toHaveLength(1);
    const row = insertedFindings[0]![0]!;
    expect(row.severity).toBe('high');
    expect(row.amaruOriginalSeverity).toBe('medium');
    expect(row.amaruOriginalScore).toBe(4000);
    expect(
      (row.amaruClassification as { mode: string }).mode,
    ).toBe('amaru-cortex');
    expect(row.amaruClassifiedAt).toBeInstanceOf(Date);
  });

  it('fires the A11oy handoff on the post-classification severity', async () => {
    const app = await buildApp();
    const { default: request } = await import('supertest');
    await request(app)
      .post('/api/sentra/detectors/ts%2Ftest-bumpable/run')
      .send({ triggeredBy: 'test' });

    // The detector emitted `medium` (below the `high` handoff threshold);
    // the classifier bumped it to `high`, so the handoff MUST fire.
    expect(handoffMock).toHaveBeenCalledTimes(1);
    const payload = handoffMock.mock.calls[0]![0] as { payload: { severity: string } };
    expect(payload.payload.severity).toBe('high');
  });
});
