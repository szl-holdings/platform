import express, { type Request, type Response, Router } from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@szl-holdings/db', () => ({
  db: {
    select() {
      const chain: Record<string, unknown> = {
        from: () => chain,
        where: () => chain,
        innerJoin: () => chain,
        then: (resolve: (v: unknown) => unknown) => Promise.resolve([]).then(resolve),
      };
      return chain;
    },
  },
  orgMembersTable: { orgId: 'org_id', userId: 'user_id' },
  organizationsTable: { id: 'id', slug: 'slug', name: 'name' },
}));

vi.mock('drizzle-orm', () => ({
  eq: (col: unknown, val: unknown) => ({ op: 'eq', col, val }),
}));

vi.mock('../../lib/api-response', () => ({
  sendUnauthorized: (res: Response, msg: string) => res.status(401).json({ error: msg }),
}));

vi.mock('../../lib/internal-tokens', () => ({
  verifyInternalHeader: () => null,
  tokenHasScope: () => false,
}));

vi.mock('@szl-holdings/observability', () => ({
  serverTelemetry: { recordAuthFailure: vi.fn() },
}));

import { tenantScope } from '../tenant-scope';

function buildApp(mountPath: string, handlerPath: string) {
  const app = express();
  // Simulate `app.use("/api", router)` at the top.
  const apiRouter = Router();
  apiRouter.use(mountPath, tenantScope({ required: true }));
  apiRouter.get(handlerPath, (_req: Request, res: Response) => {
    res.status(200).json({ ok: true });
  });
  app.use('/api', apiRouter);
  return app;
}

describe('tenantScope honors the global public allowlist', () => {
  it('does NOT 401 an unauthenticated request to an allowlisted path mounted under a tenantScope-gated prefix', async () => {
    const app = buildApp('/federation', '/federation/health');
    const res = await request(app).get('/api/federation/health');
    expect(res.status).toBe(200);
  });

  it('still 401s an unauthenticated request to a non-allowlisted path under the same prefix', async () => {
    const app = buildApp('/federation', '/federation/secret');
    const res = await request(app).get('/api/federation/secret');
    expect(res.status).toBe(401);
  });

  it('matches PUBLIC_PREFIXES entries (e.g. /api/contact/) for sub-paths', async () => {
    const app = buildApp('/contact', '/contact/submit');
    const res = await request(app).post('/api/contact/submit');
    // tenantScope only handles GET-ish flow; POST on a bare get-only handler is 404,
    // but the important thing is we don't 401 from tenantScope.
    expect(res.status).not.toBe(401);
  });
});
