/**
 * Governance editor attribution (Task #2102)
 *
 * Verifies that the governance admin endpoints surface the editor's
 * display name on each row so the Governance Tiers and Guardrail
 * Configurations admin UIs can show "Updated by … on …" / "Created by
 * … on …" inline.
 *
 *   1. PATCH /policies/tiers/:tier  → row's updatedById is recorded
 *   2. GET   /policies/tiers        → row carries `updatedAt` + `updatedBy`
 *   3. POST  /guardrail-configs     → row's createdById is recorded
 *   4. GET   /guardrail-configs     → row carries `createdAt`,
 *                                     `updatedAt`, and `createdBy`
 *
 * Skipped when DATABASE_URL is not configured.
 */

import { randomUUID } from 'node:crypto';
import express, { type NextFunction, type Request, type Response } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const HAS_DB = Boolean(process.env.DATABASE_URL);
const d = HAS_DB ? describe : describe.skip;

const TEST_ORG_ID = 1;
const RUN_ID = randomUUID().slice(0, 8);
const EDITOR_DISPLAY_NAME = `Audit Editor ${RUN_ID}`;
const EDITOR_EMAIL = `audit-editor-${RUN_ID}@example.com`;

const mockAuthUser = {
  id: undefined as number | undefined,
  email: EDITOR_EMAIL,
  roles: ['super_admin'],
  orgs: [
    {
      orgId: TEST_ORG_ID,
      orgSlug: 'persistence-test',
      orgName: 'Persistence Test',
      role: 'super_admin',
    },
  ],
};

vi.mock('../middlewares/auth.js', () => ({
  authMiddleware: (_opts?: unknown) => (req: Request, _res: Response, next: NextFunction) => {
    (req as unknown as { user: typeof mockAuthUser }).user = mockAuthUser;
    next();
  },
  requireRole: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  requireAnyAuth: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  denyIfReadOnly: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  requireOrgMembership: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  parseIdParam: (paramName: string) => (req: Request, res: Response, next: NextFunction) => {
    const val = req.params[paramName];
    if (!val || Number.isNaN(Number(val))) {
      res.status(400).json({ error: 'Invalid ID' });
      return;
    }
    next();
  },
  InvalidIdError: class extends Error {},
}));

async function bootApp() {
  const { default: guardianRouter } = await import('../routes/guardian.js');
  const app = express();
  app.use(express.json());
  app.use('/api/guardian', guardianRouter);
  return app;
}

d('Governance editor attribution surfaces in admin endpoints (#2102)', () => {
  let editorUserId: number | null = null;
  let tierDbId: number | null = null;
  let guardrailDbId: number | null = null;
  const guardrailKey = `audit-guardrail-${RUN_ID}`;

  beforeAll(async () => {
    const { db, organizationsTable, usersTable } = await import('@szl-holdings/db');
    const { eq } = await import('drizzle-orm');

    const [existingOrg] = await db
      .select()
      .from(organizationsTable)
      .where(eq(organizationsTable.id, TEST_ORG_ID))
      .limit(1);
    if (!existingOrg) {
      await db
        .insert(organizationsTable)
        .values({ id: TEST_ORG_ID, name: 'Persistence Test Org', slug: 'persistence-test' })
        .onConflictDoNothing();
    }

    const [user] = await db
      .insert(usersTable)
      .values({
        email: EDITOR_EMAIL,
        displayName: EDITOR_DISPLAY_NAME,
      })
      .returning();
    editorUserId = user?.id;
    mockAuthUser.id = editorUserId;
  });

  afterAll(async () => {
    const { db, guardianTiersTable, guardrailConfigsTable, usersTable } = await import(
      '@szl-holdings/db'
    );
    const { eq } = await import('drizzle-orm');
    if (guardrailDbId !== null)
      await db.delete(guardrailConfigsTable).where(eq(guardrailConfigsTable.id, guardrailDbId));
    if (tierDbId !== null)
      await db.delete(guardianTiersTable).where(eq(guardianTiersTable.id, tierDbId));
    if (editorUserId !== null)
      await db.delete(usersTable).where(eq(usersTable.id, editorUserId));
  });

  it('GET /policies/tiers reports the editor that last PATCHed each tier', async () => {
    const app = await bootApp();

    const patchRes = await request(app)
      .patch('/api/guardian/policies/tiers/supervised')
      .send({
        description: `Audit attribution test ${RUN_ID}`,
        riskLevel: 2,
        controls: { auditRunId: RUN_ID },
        tierNumber: 1,
      });
    expect([200, 201]).toContain(patchRes.status);
    expect(patchRes.body?.updatedById).toBe(editorUserId);
    tierDbId = patchRes.body.id;

    const listRes = await request(app).get('/api/guardian/policies/tiers');
    expect(listRes.status).toBe(200);
    const rows = listRes.body as Array<{
      tier: string;
      updatedAt: string | null;
      updatedBy: { id: number; displayName: string; email: string | null } | null;
    }>;
    const supervised = rows.find((r) => r.tier === 'supervised');
    expect(supervised).toBeDefined();
    expect(supervised?.updatedAt).toBeTruthy();
    expect(supervised?.updatedBy).not.toBeNull();
    expect(supervised?.updatedBy?.id).toBe(editorUserId);
    expect(supervised?.updatedBy?.displayName).toBe(EDITOR_DISPLAY_NAME);
    expect(supervised?.updatedBy?.email).toBe(EDITOR_EMAIL);
  });

  it('GET /guardrail-configs reports the editor that POSTed each guardrail', async () => {
    const app = await bootApp();

    const createRes = await request(app)
      .post('/api/guardian/guardrail-configs')
      .send({
        guardrailId: guardrailKey,
        name: `Audit guardrail ${RUN_ID}`,
        description: 'Editor attribution smoke test',
        guardrailType: 'rate_limit',
        config: { limit: 50, windowSec: 60 },
        enforcement: 'enforce',
      });
    expect(createRes.status).toBe(201);
    expect(createRes.body?.createdById).toBe(editorUserId);
    expect(createRes.body?.createdBy?.id).toBe(editorUserId);
    expect(createRes.body?.createdBy?.displayName).toBe(EDITOR_DISPLAY_NAME);
    guardrailDbId = createRes.body.id;

    const listRes = await request(app).get(
      `/api/guardian/guardrail-configs?guardrailType=rate_limit&limit=100`,
    );
    expect(listRes.status).toBe(200);
    const list = (listRes.body?.data ?? listRes.body) as Array<{
      id: number;
      guardrailId: string;
      createdAt: string | null;
      updatedAt: string | null;
      createdBy: { id: number; displayName: string; email: string | null } | null;
    }>;
    const ours = list.find((r) => r.guardrailId === guardrailKey);
    expect(ours).toBeDefined();
    expect(ours?.createdAt).toBeTruthy();
    expect(ours?.updatedAt).toBeTruthy();
    expect(ours?.createdBy).not.toBeNull();
    expect(ours?.createdBy?.id).toBe(editorUserId);
    expect(ours?.createdBy?.displayName).toBe(EDITOR_DISPLAY_NAME);
    expect(ours?.createdBy?.email).toBe(EDITOR_EMAIL);

    const singleRes = await request(app).get(`/api/guardian/guardrail-configs/${guardrailDbId}`);
    expect(singleRes.status).toBe(200);
    expect(singleRes.body?.createdBy?.displayName).toBe(EDITOR_DISPLAY_NAME);
  });
});
