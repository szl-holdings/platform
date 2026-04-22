/**
 * Prism Counsel Path Parameter Validation Tests
 *
 * Verifies that invalid (non-numeric, non-positive) path params like :id,
 * :matterId, and :userId are rejected with HTTP 400 before the request
 * reaches the database — across all three Prism Counsel route files.
 *
 * Approach:
 *  - authMiddleware and tenantScope are stubbed so every request appears
 *    authenticated with orgId=1.
 *  - validateBody and validateQuery are bypassed so body/query issues
 *    never interfere with the param-only assertions.
 *  - validateParams is NOT mocked — the real Zod coercion runs so that
 *    the 400 response is produced by the actual guard logic.
 *  - The DB mock returns [] for every query, so positive-path tests get
 *    a 404 (not found) rather than 400 (bad param).
 */

import express, { type NextFunction, type Request, type Response } from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@szl-holdings/db', () => ({
  db: {
    select() {
      const chain: Record<string, unknown> = {
        from: () => chain,
        where: () => chain,
        orderBy: () => chain,
        limit: () => Promise.resolve([]),
        then: (resolve: (v: unknown[]) => unknown) => Promise.resolve([]).then(resolve),
      };
      return chain;
    },
    insert() {
      const chain: Record<string, unknown> = {
        values: () => chain,
        returning: () => Promise.resolve([]),
        onConflictDoNothing: () => Promise.resolve(),
      };
      return chain;
    },
    update() {
      const chain: Record<string, unknown> = {
        set: () => chain,
        where: () => chain,
        returning: () => Promise.resolve([]),
      };
      return chain;
    },
    delete() {
      const chain: Record<string, unknown> = {
        where: () => chain,
        returning: () => Promise.resolve([]),
      };
      return chain;
    },
  },
  pcManagedReviewItemsTable: {},
  pcManagedReviewNotesTable: {},
  pcManagedReviewAssignmentsTable: {},
  pcReviewAuditEventsTable: {},
  pcMattersTable: {},
  pcReviewItemsTable: {},
  pcSignoffQueueTable: {},
  pcChangeEventsTable: {},
  pcDeadlinesTable: {},
  pcNextActionsTable: {},
  pcQuietRisksTable: {},
  pcForecastsTable: {},
  pcWordExportsTable: {},
  pcConnectorAccountsTable: {},
  pcIngestionJobsTable: {},
  pcMatterDeskSnapshotsTable: {},
  pcMovementRecommendationsTable: {},
  pcInsurerPressureSnapshotsTable: {},
  pcSettlementFrictionSnapshotsTable: {},
  pcPortfolioBenchmarkSnapshotsTable: {},
  pcPortfolioActionEffectivenessTable: {},
  pcPortfolioMatterCohortsTable: {},
  pcPortfolioTeamLagMetricsTable: {},
  pcCarrierBehaviorPatternsTable: {},
  pcCarrierSilenceWindowsTable: {},
  pcWorldlineCountyProfilesTable: {},
  pcWorldlineRecoveryMarkersTable: {},
  pcWorldlineRegulatoryEventsTable: {},
  pcWorldlineSignalOverlaysTable: {},
  pcWorldlineWeatherEventsTable: {},
  pcQuietRiskSnapshotsTable: {},
}));

vi.mock('drizzle-orm', async (importOriginal) => {
  const actual = await importOriginal<typeof import('drizzle-orm')>();
  return {
    ...actual,
    eq: () => ({}),
    and: () => ({}),
    or: () => ({}),
    desc: () => ({}),
    not: () => ({}),
    isNull: () => ({}),
    gte: () => ({}),
    sql: (..._args: unknown[]) => ({}),
  };
});

vi.mock('../../middlewares/auth', () => ({
  authMiddleware: () => (req: Request, _res: Response, next: NextFunction) => {
    (req as any).user = {
      id: 1,
      displayName: 'Test',
      email: 'test@example.com',
      roles: ['admin'],
      orgs: [{ orgId: 1, orgSlug: 'test', orgName: 'Test Org', role: 'admin' }],
    };
    next();
  },
  requireRole: () => (_req: Request, _res: Response, next: NextFunction) => next(),
}));

vi.mock('../../middlewares/tenant-scope', () => ({
  tenantScope: () => (req: Request, _res: Response, next: NextFunction) => {
    (req as any).tenantOrgId = 1;
    next();
  },
}));

vi.mock('../../lib/validation', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/validation')>();
  return {
    ...actual,
    validateBody: (_schema: unknown) => (_req: Request, _res: Response, next: NextFunction) =>
      next(),
    validateQuery: (_schema: unknown) => (_req: Request, _res: Response, next: NextFunction) =>
      next(),
  };
});

vi.mock('@szl-holdings/contracts/common', () => ({
  bodyShape: () => ({}),
}));

vi.mock('../../services/prism-pilot-change-tracker', () => ({
  pilotChangeTracker: {
    completeAction: vi.fn().mockResolvedValue([{}]),
    getChanges: vi.fn().mockResolvedValue([]),
    markRead: vi.fn().mockResolvedValue(undefined),
    getLatestBrief: vi.fn().mockResolvedValue(null),
    generateMorningBrief: vi.fn().mockResolvedValue(null),
    getQuietRisks: vi.fn().mockResolvedValue([]),
    detectQuietRisks: vi.fn().mockResolvedValue([]),
    getNextActions: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../../services/prism-pilot-review', () => ({
  pilotReview: {
    getReviews: vi.fn().mockResolvedValue([]),
    getReview: vi.fn().mockResolvedValue(null),
    createReview: vi.fn().mockResolvedValue({}),
    updateReviewState: vi.fn().mockResolvedValue({}),
    submitForSignoff: vi.fn().mockResolvedValue({}),
  },
  pilotSignoff: {
    getAll: vi.fn().mockResolvedValue([]),
    getPending: vi.fn().mockResolvedValue([]),
    resolve: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('../../services/prism-pilot-export', () => ({
  pilotExport: {
    getExports: vi.fn().mockResolvedValue([]),
    generateExport: vi.fn().mockResolvedValue({}),
    getExport: vi.fn().mockResolvedValue(null),
    logAccess: vi.fn().mockResolvedValue(undefined),
    buildDocxContent: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('../../services/prism-pilot-ingestion', () => ({
  pilotIngestion: {
    ingestEmail: vi.fn().mockResolvedValue({}),
    ingestFile: vi.fn().mockResolvedValue({}),
    getJobs: vi.fn().mockResolvedValue([]),
    getJobStats: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('../../services/prism-insurer-pressure', () => ({
  insurerPressureEngine: {
    compute: vi.fn().mockResolvedValue({ snapshotId: 1, analysis: {} }),
    getLatestSnapshot: vi.fn().mockResolvedValue(null),
    getPortfolioPressureView: vi.fn().mockResolvedValue([]),
    getCarrierPatterns: vi.fn().mockResolvedValue([]),
    getSilenceWindows: vi.fn().mockResolvedValue([]),
    recordCarrierEvent: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../services/prism-settlement-friction', () => ({
  settlementFrictionEngine: {
    compute: vi.fn().mockResolvedValue({ snapshotId: 1, analysis: {} }),
    getLatestSnapshot: vi.fn().mockResolvedValue(null),
    getPortfolioFrictionView: vi.fn().mockResolvedValue([]),
    getMovementRecommendations: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../../services/prism-forecast-expanded', () => ({
  forecastExpanded: {
    runForecastCycle: vi.fn().mockResolvedValue([]),
    getForecastDiffView: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('../../services/prism-portfolio-learning', () => ({
  portfolioLearning: {
    runFullPortfolioLearning: vi.fn().mockResolvedValue(undefined),
    getBenchmarks: vi.fn().mockResolvedValue([]),
    getActionEffectiveness: vi.fn().mockResolvedValue([]),
    getMatterCohorts: vi.fn().mockResolvedValue([]),
    getManagerWatchlist: vi.fn().mockResolvedValue([]),
    getBestNext30Minutes: vi.fn().mockResolvedValue([]),
    detectQuietRisk: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('../../services/prism-copilot-pilot-one', () => ({
  copilotPilotOne: {
    getAvailableCards: vi.fn().mockReturnValue([]),
    executeActionCard: vi.fn().mockResolvedValue({}),
  },
}));

async function buildReviewApp() {
  const { default: router } = await import('../prism-counsel-review');
  const app = express();
  app.use(express.json());
  app.use(router);
  return app;
}

async function buildPilotApp() {
  const { prismCounselPilotRouter: router } = await import('../prism-counsel-pilot');
  const app = express();
  app.use(express.json());
  app.use(router);
  return app;
}

async function buildPilotOneApp() {
  const { prismCounselPilotOneRouter: router } = await import('../prism-counsel-pilot-one');
  const app = express();
  app.use(express.json());
  app.use(router);
  return app;
}

describe('prism-counsel-review — :id path parameter validation', () => {
  it('GET /review-desk/items/:id — rejects non-numeric id (abc) with 400', async () => {
    const app = await buildReviewApp();
    const res = await request(app).get('/review-desk/items/abc');
    expect(res.status).toBe(400);
  });

  it('GET /review-desk/items/:id — rejects negative id with 400', async () => {
    const app = await buildReviewApp();
    const res = await request(app).get('/review-desk/items/-1');
    expect(res.status).toBe(400);
  });

  it('GET /review-desk/items/:id — rejects zero id with 400', async () => {
    const app = await buildReviewApp();
    const res = await request(app).get('/review-desk/items/0');
    expect(res.status).toBe(400);
  });

  it('GET /review-desk/items/:id — valid id reaches handler (not 400)', async () => {
    const app = await buildReviewApp();
    const res = await request(app).get('/review-desk/items/42');
    expect(res.status).not.toBe(400);
  });

  it('POST /review-desk/items/:id/transition — rejects non-numeric id with 400', async () => {
    const app = await buildReviewApp();
    const res = await request(app).post('/review-desk/items/nope/transition').send({});
    expect(res.status).toBe(400);
  });

  it('POST /review-desk/items/:id/actions/approve — rejects non-numeric id with 400', async () => {
    const app = await buildReviewApp();
    const res = await request(app).post('/review-desk/items/xyz/actions/approve').send({});
    expect(res.status).toBe(400);
  });

  it('POST /review-desk/items/:id/actions/approve — rejects zero id with 400', async () => {
    const app = await buildReviewApp();
    const res = await request(app).post('/review-desk/items/0/actions/approve').send({});
    expect(res.status).toBe(400);
  });

  it('POST /review-desk/items/:id/actions/approve — valid id reaches handler (not 400)', async () => {
    const app = await buildReviewApp();
    const res = await request(app).post('/review-desk/items/1/actions/approve').send({});
    expect(res.status).not.toBe(400);
  });

  it('POST /review-desk/items/:id/actions/reject — rejects non-numeric id with 400', async () => {
    const app = await buildReviewApp();
    const res = await request(app).post('/review-desk/items/bad/actions/reject').send({});
    expect(res.status).toBe(400);
  });

  it('POST /review-desk/items/:id/actions/revise — rejects non-numeric id with 400', async () => {
    const app = await buildReviewApp();
    const res = await request(app).post('/review-desk/items/bad/actions/revise').send({});
    expect(res.status).toBe(400);
  });

  it('POST /review-desk/items/:id/actions/escalate — rejects non-numeric id with 400', async () => {
    const app = await buildReviewApp();
    const res = await request(app).post('/review-desk/items/bad/actions/escalate').send({});
    expect(res.status).toBe(400);
  });

  it('POST /review-desk/items/:id/actions/assign — rejects negative id with 400', async () => {
    const app = await buildReviewApp();
    const res = await request(app).post('/review-desk/items/-5/actions/assign').send({});
    expect(res.status).toBe(400);
  });

  it('POST /review-desk/items/:id/actions/block — rejects non-numeric id with 400', async () => {
    const app = await buildReviewApp();
    const res = await request(app).post('/review-desk/items/bad/actions/block').send({});
    expect(res.status).toBe(400);
  });

  it('POST /review-desk/items/:id/actions/request-support — rejects non-numeric id with 400', async () => {
    const app = await buildReviewApp();
    const res = await request(app)
      .post('/review-desk/items/bad/actions/request-support')
      .send({});
    expect(res.status).toBe(400);
  });

  it('POST /review-desk/items/:id/actions/generate-review-packet — rejects non-numeric id with 400', async () => {
    const app = await buildReviewApp();
    const res = await request(app)
      .post('/review-desk/items/bad/actions/generate-review-packet')
      .send({});
    expect(res.status).toBe(400);
  });

  it('POST /review-desk/items/:id/actions/export-packet — rejects zero id with 400', async () => {
    const app = await buildReviewApp();
    const res = await request(app).post('/review-desk/items/0/actions/export-packet').send({});
    expect(res.status).toBe(400);
  });

  it('POST /review-desk/items/:id/notes — rejects non-numeric id with 400', async () => {
    const app = await buildReviewApp();
    const res = await request(app).post('/review-desk/items/nope/notes').send({});
    expect(res.status).toBe(400);
  });

  it('POST /review-desk/items/:id/notes — valid id reaches handler (not 400)', async () => {
    const app = await buildReviewApp();
    const res = await request(app).post('/review-desk/items/7/notes').send({});
    expect(res.status).not.toBe(400);
  });
});

describe('prism-counsel-pilot — :id and :matterId path parameter validation', () => {
  it('POST /today/next-actions/:id/complete — rejects non-numeric id with 400', async () => {
    const app = await buildPilotApp();
    const res = await request(app).post('/today/next-actions/abc/complete').send({});
    expect(res.status).toBe(400);
  });

  it('POST /today/next-actions/:id/complete — rejects negative id with 400', async () => {
    const app = await buildPilotApp();
    const res = await request(app).post('/today/next-actions/-5/complete').send({});
    expect(res.status).toBe(400);
  });

  it('POST /today/next-actions/:id/complete — rejects zero id with 400', async () => {
    const app = await buildPilotApp();
    const res = await request(app).post('/today/next-actions/0/complete').send({});
    expect(res.status).toBe(400);
  });

  it('POST /today/next-actions/:id/complete — valid id reaches handler (not 400)', async () => {
    const app = await buildPilotApp();
    const res = await request(app).post('/today/next-actions/1/complete').send({});
    expect(res.status).not.toBe(400);
  });

  it('GET /matter-desk/:id — rejects non-numeric id with 400', async () => {
    const app = await buildPilotApp();
    const res = await request(app).get('/matter-desk/bad');
    expect(res.status).toBe(400);
  });

  it('GET /matter-desk/:id — rejects zero id with 400', async () => {
    const app = await buildPilotApp();
    const res = await request(app).get('/matter-desk/0');
    expect(res.status).toBe(400);
  });

  it('GET /matter-desk/:id — valid id reaches handler (not 400)', async () => {
    const app = await buildPilotApp();
    const res = await request(app).get('/matter-desk/99');
    expect(res.status).not.toBe(400);
  });

  it('GET /reviews/:id — rejects non-numeric id with 400', async () => {
    const app = await buildPilotApp();
    const res = await request(app).get('/reviews/abc');
    expect(res.status).toBe(400);
  });

  it('PATCH /reviews/:id/state — rejects non-numeric id with 400', async () => {
    const app = await buildPilotApp();
    const res = await request(app).patch('/reviews/bad/state').send({});
    expect(res.status).toBe(400);
  });

  it('POST /reviews/:id/submit-signoff — rejects negative id with 400', async () => {
    const app = await buildPilotApp();
    const res = await request(app).post('/reviews/-1/submit-signoff').send({});
    expect(res.status).toBe(400);
  });

  it('POST /signoffs/:id/resolve — rejects non-numeric id with 400', async () => {
    const app = await buildPilotApp();
    const res = await request(app).post('/signoffs/xyz/resolve').send({});
    expect(res.status).toBe(400);
  });

  it('POST /signoffs/:id/resolve — valid id reaches handler (not 400)', async () => {
    const app = await buildPilotApp();
    const res = await request(app).post('/signoffs/1/resolve').send({});
    expect(res.status).not.toBe(400);
  });

  it('GET /exports/:id — rejects non-numeric id with 400', async () => {
    const app = await buildPilotApp();
    const res = await request(app).get('/exports/notanumber');
    expect(res.status).toBe(400);
  });

  it('GET /exports/:id — valid id reaches handler (not 400)', async () => {
    const app = await buildPilotApp();
    const res = await request(app).get('/exports/1');
    expect(res.status).not.toBe(400);
  });

  it('GET /exports/:id/content — rejects non-numeric id with 400', async () => {
    const app = await buildPilotApp();
    const res = await request(app).get('/exports/bad/content');
    expect(res.status).toBe(400);
  });

  it('GET /forecasts/:matterId — rejects non-numeric matterId with 400', async () => {
    const app = await buildPilotApp();
    const res = await request(app).get('/forecasts/abc');
    expect(res.status).toBe(400);
  });

  it('GET /forecasts/:matterId — rejects negative matterId with 400', async () => {
    const app = await buildPilotApp();
    const res = await request(app).get('/forecasts/-3');
    expect(res.status).toBe(400);
  });

  it('GET /forecasts/:matterId — rejects zero matterId with 400', async () => {
    const app = await buildPilotApp();
    const res = await request(app).get('/forecasts/0');
    expect(res.status).toBe(400);
  });
});

describe('prism-counsel-pilot-one — :matterId, :id, and :userId path parameter validation', () => {
  it('POST /pressure/:matterId/compute — rejects non-numeric matterId with 400', async () => {
    const app = await buildPilotOneApp();
    const res = await request(app).post('/pressure/abc/compute').send({});
    expect(res.status).toBe(400);
  });

  it('POST /pressure/:matterId/compute — rejects negative matterId with 400', async () => {
    const app = await buildPilotOneApp();
    const res = await request(app).post('/pressure/-1/compute').send({});
    expect(res.status).toBe(400);
  });

  it('POST /pressure/:matterId/compute — rejects zero matterId with 400', async () => {
    const app = await buildPilotOneApp();
    const res = await request(app).post('/pressure/0/compute').send({});
    expect(res.status).toBe(400);
  });

  it('POST /pressure/:matterId/compute — valid matterId reaches handler (not 400)', async () => {
    const app = await buildPilotOneApp();
    const res = await request(app).post('/pressure/1/compute').send({});
    expect(res.status).not.toBe(400);
  });

  it('GET /pressure/:matterId — rejects non-numeric matterId with 400', async () => {
    const app = await buildPilotOneApp();
    const res = await request(app).get('/pressure/abc');
    expect(res.status).toBe(400);
  });

  it('GET /pressure/:matterId — valid matterId reaches handler (not 400)', async () => {
    const app = await buildPilotOneApp();
    const res = await request(app).get('/pressure/5');
    expect(res.status).not.toBe(400);
  });

  it('POST /pressure/:matterId/events — rejects non-numeric matterId with 400', async () => {
    const app = await buildPilotOneApp();
    const res = await request(app).post('/pressure/bad/events').send({});
    expect(res.status).toBe(400);
  });

  it('POST /friction/:matterId/compute — rejects non-numeric matterId with 400', async () => {
    const app = await buildPilotOneApp();
    const res = await request(app).post('/friction/bad/compute').send({});
    expect(res.status).toBe(400);
  });

  it('GET /friction/:matterId — rejects non-numeric matterId with 400', async () => {
    const app = await buildPilotOneApp();
    const res = await request(app).get('/friction/bad');
    expect(res.status).toBe(400);
  });

  it('GET /friction/:matterId — rejects zero matterId with 400', async () => {
    const app = await buildPilotOneApp();
    const res = await request(app).get('/friction/0');
    expect(res.status).toBe(400);
  });

  it('GET /friction/:matterId — valid matterId reaches handler (not 400)', async () => {
    const app = await buildPilotOneApp();
    const res = await request(app).get('/friction/5');
    expect(res.status).not.toBe(400);
  });

  it('GET /friction/:matterId/recommendations — rejects non-numeric matterId with 400', async () => {
    const app = await buildPilotOneApp();
    const res = await request(app).get('/friction/bad/recommendations');
    expect(res.status).toBe(400);
  });

  it('POST /friction/recommendations/:id/accept — rejects non-numeric id with 400', async () => {
    const app = await buildPilotOneApp();
    const res = await request(app).post('/friction/recommendations/abc/accept').send({});
    expect(res.status).toBe(400);
  });

  it('POST /friction/recommendations/:id/accept — rejects zero id with 400', async () => {
    const app = await buildPilotOneApp();
    const res = await request(app).post('/friction/recommendations/0/accept').send({});
    expect(res.status).toBe(400);
  });

  it('POST /friction/recommendations/:id/accept — valid id reaches handler (not 400)', async () => {
    const app = await buildPilotOneApp();
    const res = await request(app).post('/friction/recommendations/3/accept').send({});
    expect(res.status).not.toBe(400);
  });

  it('POST /forecasts/pilot-one/:matterId/compute — rejects non-numeric matterId with 400', async () => {
    const app = await buildPilotOneApp();
    const res = await request(app).post('/forecasts/pilot-one/bad/compute').send({});
    expect(res.status).toBe(400);
  });

  it('GET /forecasts/pilot-one/:matterId/diff-view — rejects non-numeric matterId with 400', async () => {
    const app = await buildPilotOneApp();
    const res = await request(app).get('/forecasts/pilot-one/bad/diff-view');
    expect(res.status).toBe(400);
  });

  it('GET /forecasts/pilot-one/:matterId/diff-view — valid matterId reaches handler (not 400)', async () => {
    const app = await buildPilotOneApp();
    const res = await request(app).get('/forecasts/pilot-one/1/diff-view');
    expect(res.status).not.toBe(400);
  });

  it('GET /portfolio/best-next-30/:userId — rejects non-numeric userId with 400', async () => {
    const app = await buildPilotOneApp();
    const res = await request(app).get('/portfolio/best-next-30/abc');
    expect(res.status).toBe(400);
  });

  it('GET /portfolio/best-next-30/:userId — rejects negative userId with 400', async () => {
    const app = await buildPilotOneApp();
    const res = await request(app).get('/portfolio/best-next-30/-1');
    expect(res.status).toBe(400);
  });

  it('GET /portfolio/best-next-30/:userId — rejects zero userId with 400', async () => {
    const app = await buildPilotOneApp();
    const res = await request(app).get('/portfolio/best-next-30/0');
    expect(res.status).toBe(400);
  });

  it('GET /portfolio/best-next-30/:userId — valid userId reaches handler (not 400)', async () => {
    const app = await buildPilotOneApp();
    const res = await request(app).get('/portfolio/best-next-30/1');
    expect(res.status).not.toBe(400);
  });

  it('POST /portfolio/quiet-risk/:matterId — rejects non-numeric matterId with 400', async () => {
    const app = await buildPilotOneApp();
    const res = await request(app).post('/portfolio/quiet-risk/bad').send({});
    expect(res.status).toBe(400);
  });

  it('POST /portfolio/quiet-risk/:matterId — rejects negative matterId with 400', async () => {
    const app = await buildPilotOneApp();
    const res = await request(app).post('/portfolio/quiet-risk/-2').send({});
    expect(res.status).toBe(400);
  });

  it('POST /portfolio/quiet-risk/:matterId — valid matterId reaches handler (not 400)', async () => {
    const app = await buildPilotOneApp();
    const res = await request(app).post('/portfolio/quiet-risk/10').send({});
    expect(res.status).not.toBe(400);
  });
});
