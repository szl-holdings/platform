/**
 * ATLAS Run Persistence Test (Task #1800)
 *
 * Proves that ATLAS workflow runs produced by POST /:domain/atlas/execute are
 * durably persisted to PostgreSQL (szl_decisioning_runs) and survive an
 * in-process server restart, so the timeline panel on each Execute page shows
 * historical runs across sessions.
 *
 * Phases:
 *   1. Bootstrap a fresh app, POST /execute (dry-run) for each of the four
 *      domains exposed by the Execute pages (vessels, terra, carlota-jo,
 *      aegis), capturing every returned runId.
 *   2. Restart in-process by resetting the Vitest module cache.
 *   3. Bootstrap a brand-new app and GET /:domain/atlas/runs for each domain;
 *      assert each runId is returned.
 *
 * Skipped if no DATABASE_URL is configured.
 */

import { randomUUID } from 'node:crypto';
import express, { type NextFunction, type Request, type Response } from 'express';
import request from 'supertest';
import { afterAll, describe, expect, it, vi } from 'vitest';

const HAS_DB = Boolean(process.env.DATABASE_URL);
const d = HAS_DB ? describe : describe.skip;

// Mock auth so unauthenticated test calls reach the handlers as a
// super-admin user with no tenant. The /:domain/atlas/runs route
// reads tenantId from req.user?.orgs?.[0]?.orgId — leaving orgs empty
// makes dbListRuns query for tenant_id IS NULL, which matches runs we
// create here (also created without a tenant).
const mockAuthUser = {
  id: 0,
  email: 'atlas-run-persistence@example.com',
  roles: ['super_admin'],
  orgs: [] as Array<{ orgId: number; orgSlug: string; orgName: string; role: string }>,
  isInternalAgent: true,
};

vi.mock('../middlewares/auth.js', () => ({
  authMiddleware: (_opts?: unknown) => (req: Request, _res: Response, next: NextFunction) => {
    (req as unknown as { user: typeof mockAuthUser; isInternalAgent: boolean }).user = mockAuthUser;
    (req as unknown as { isInternalAgent: boolean }).isInternalAgent = true;
    next();
  },
  requireRole: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  requireAnyAuth: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  denyIfReadOnly: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  requireOrgMembership: () => (_req: Request, _res: Response, next: NextFunction) => next(),
}));

async function bootApp() {
  const { default: atlasRouter } = await import('../routes/domain-atlas-execution.js');
  const app = express();
  app.use(express.json());
  app.use(atlasRouter);
  return app;
}

const DOMAIN_WORKFLOWS: Array<{ domain: string; workflowKey: string }> = [
  { domain: 'vessels', workflowKey: 'vessels-voyage-risk' },
  { domain: 'terra', workflowKey: 'terra-deal-underwriting' },
  { domain: 'carlota-jo', workflowKey: 'carlota-concierge-workflow' },
  { domain: 'aegis', workflowKey: 'aegis-incident-response' },
];

d(
  'ATLAS workflow runs persist across an in-process server restart (#1800)',
  { timeout: 30_000 },
  () => {
    const runMarker = randomUUID();
    const createdRunIds: Array<{ domain: string; runId: string }> = [];

    afterAll(async () => {
      if (!HAS_DB) return;
      const { pool } = await import('@szl-holdings/db');
      for (const { runId } of createdRunIds) {
        await pool.query(`DELETE FROM szl_decisioning_runs WHERE run_id = $1`, [runId]);
      }
    });

    it('Phase 1 — POST /:domain/atlas/execute (dry-run) for each domain creates a persisted run', async () => {
      const app = await bootApp();
      for (const { domain, workflowKey } of DOMAIN_WORKFLOWS) {
        const res = await request(app)
          .post(`/${domain}/atlas/execute`)
          .send({ workflowKey, isDryRun: true, metadata: { runMarker } });
        expect(res.status).toBe(201);
        expect(res.body?.run?.runId).toBeTruthy();
        createdRunIds.push({ domain, runId: res.body.run.runId });
      }
      expect(createdRunIds).toHaveLength(DOMAIN_WORKFLOWS.length);

      // Direct DB read confirms each run was written to szl_decisioning_runs
      // with the correct domain.
      const { pool } = await import('@szl-holdings/db');
      for (const { domain, runId } of createdRunIds) {
        const dbRes = await pool.query<{ domain: string; run_id: string }>(
          `SELECT domain, run_id FROM szl_decisioning_runs WHERE run_id = $1`,
          [runId],
        );
        expect(dbRes.rows[0]?.run_id).toBe(runId);
        expect(dbRes.rows[0]?.domain).toBe(domain);
      }
    });

    it('Restart in-process — drops the module cache so the next import is fresh', async () => {
      vi.resetModules();
      const router = await import('../routes/domain-atlas-execution.js');
      expect(router.default).toBeDefined();
    });

    it('Phase 2 — fresh app reads every persisted run via GET /:domain/atlas/runs', async () => {
      const app = await bootApp();
      for (const { domain, runId } of createdRunIds) {
        const res = await request(app).get(`/${domain}/atlas/runs?limit=200`);
        expect(res.status).toBe(200);
        const runs = (res.body?.runs ?? []) as Array<{ runId: string }>;
        const found = runs.find((r) => r.runId === runId);
        expect(found, `run ${runId} should be returned for domain ${domain}`).toBeDefined();
      }
    });

    it('Phase 3 — GET /:domain/atlas/runs/:runId returns each persisted run by id', async () => {
      const app = await bootApp();
      for (const { domain, runId } of createdRunIds) {
        const res = await request(app).get(`/${domain}/atlas/runs/${runId}`);
        expect(res.status).toBe(200);
        expect(res.body?.run?.runId).toBe(runId);
      }
    });
  },
);
