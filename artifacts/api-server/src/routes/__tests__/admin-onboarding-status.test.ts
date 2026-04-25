/**
 * Admin Onboarding Status Endpoint
 *
 * GET /admin/onboarding-status
 *
 * Verifies:
 *   (a) Super-admin can list all orgs with onboarding wizard state.
 *   (b) Plain admin (admin role) is allowed; only non-admin roles are denied.
 *   (c) Pagination params (limit, offset) are respected.
 *   (d) status filter: "complete", "in_progress", "not_started" narrow results correctly.
 *   (e) Invalid status filter returns 400.
 *   (f) Org with no wizard row appears as "not_started" with 0% progress.
 *   (g) Totals reflect the full (unfiltered) org count across all statuses.
 */

import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const mockOrgs = [
  {
    id: 1,
    name: 'Alpha Corp',
    slug: 'alpha-corp',
    plan: 'starter',
    status: 'active',
    createdAt: new Date('2025-01-01'),
  },
  {
    id: 2,
    name: 'Beta Ltd',
    slug: 'beta-ltd',
    plan: 'free',
    status: 'active',
    createdAt: new Date('2025-02-01'),
  },
  {
    id: 3,
    name: 'Gamma Inc',
    slug: 'gamma-inc',
    plan: 'enterprise',
    status: 'active',
    createdAt: new Date('2025-03-01'),
  },
];

// org 1 = complete, org 2 = in_progress, org 3 = no row (not_started)
const mockWizardRows = [
  {
    org_id: 1,
    current_step: 'complete',
    completed_steps: ['profile', 'team', 'notifications', 'integrations'],
    completed_at: '2025-01-10T12:00:00Z',
    updated_at: '2025-01-10T12:00:00Z',
  },
  {
    org_id: 2,
    current_step: 'notifications',
    completed_steps: ['profile', 'team'],
    completed_at: null,
    updated_at: '2025-02-05T09:00:00Z',
  },
];

// ─── Module mocks ──────────────────────────────────────────────────────────────

function makeSelectChain(results: unknown[]) {
  const p = Promise.resolve(results);
  const thennable = {
    then: (r: (v: unknown) => unknown, rj?: (e: unknown) => unknown) => p.then(r, rj),
    where: () => thennable,
  };
  return thennable;
}

const organizationsTable = { __t: 'organizationsTable' };

vi.mock('@szl-holdings/db', () => ({
  db: {
    select: () => ({
      from: () => ({
        $dynamic: () => makeSelectChain(mockOrgs),
      }),
    }),
  },
  organizationsTable,
  pool: {
    query: vi.fn(async (_sql: string, params: unknown[]) => {
      const ids = (params as [number[]])[0];
      return { rows: mockWizardRows.filter((r) => (ids as number[]).includes(r.org_id)) };
    }),
  },
}));

vi.mock('drizzle-orm', () => {
  const noop = (..._a: unknown[]) => ({});
  return { and: noop, or: noop, ilike: noop, eq: noop, sql: Object.assign(noop, { raw: noop }) };
});

vi.mock('../../middlewares/rate-limiters.js', () => ({
  readLimiter: (_req: unknown, _res: unknown, next: () => void) => next(),
  writeLimiter: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

// ─── App factory ──────────────────────────────────────────────────────────────

async function buildApp(roles: string[]) {
  const { register } = await import('../../routes/admin/onboarding.js');
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as express.Request & { user: unknown }).user = { id: 1, roles };
    next();
  });
  const router = express.Router();
  register(router);
  app.use(router);
  return app;
}

let superApp: express.Express;
let plainAdminApp: express.Express;
let noRoleApp: express.Express;

beforeEach(async () => {
  superApp = await buildApp(['super_admin', 'admin']);
  plainAdminApp = await buildApp(['admin']);
  noRoleApp = await buildApp(['member']);
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('GET /admin/onboarding-status', () => {
  it('(a) super-admin receives 200 with rows and correct totals', async () => {
    const res = await request(superApp).get('/admin/onboarding-status');
    expect(res.status).toBe(200);
    const { rows, totals } = res.body as {
      rows: unknown[];
      totals: { orgs: number; complete: number; inProgress: number; notStarted: number };
    };
    expect(rows).toHaveLength(3);
    expect(totals.orgs).toBe(3);
    expect(totals.complete).toBe(1);
    expect(totals.inProgress).toBe(1);
    expect(totals.notStarted).toBe(1);
  });

  it('(b) plain admin (admin role only) is allowed and receives 200', async () => {
    const res = await request(plainAdminApp).get('/admin/onboarding-status');
    expect(res.status).toBe(200);
    expect(res.body.rows).toHaveLength(3);
  });

  it('(b2) non-admin user (member role only) is denied with 403', async () => {
    const res = await request(noRoleApp).get('/admin/onboarding-status');
    expect(res.status).toBe(403);
  });

  it('(c) limit=1 paginates to 1 row', async () => {
    const res = await request(superApp).get('/admin/onboarding-status?limit=1&offset=0');
    expect(res.status).toBe(200);
    expect(res.body.rows).toHaveLength(1);
    expect(res.body.pagination.hasMore).toBe(true);
  });

  it('(d) status=complete returns only complete orgs', async () => {
    const res = await request(superApp).get('/admin/onboarding-status?status=complete');
    expect(res.status).toBe(200);
    const rows = res.body.rows as Array<{ onboarding: { status: string } }>;
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.onboarding.status === 'complete')).toBe(true);
  });

  it('(d) status=in_progress returns only in-progress orgs', async () => {
    const res = await request(superApp).get('/admin/onboarding-status?status=in_progress');
    expect(res.status).toBe(200);
    const rows = res.body.rows as Array<{ onboarding: { status: string } }>;
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.onboarding.status === 'in_progress')).toBe(true);
  });

  it('(d) status=not_started returns only not-started orgs', async () => {
    const res = await request(superApp).get('/admin/onboarding-status?status=not_started');
    expect(res.status).toBe(200);
    const rows = res.body.rows as Array<{ onboarding: { status: string } }>;
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.onboarding.status === 'not_started')).toBe(true);
  });

  it('(e) invalid status filter returns 400', async () => {
    const res = await request(superApp).get('/admin/onboarding-status?status=banana');
    expect(res.status).toBe(400);
  });

  it('(f) org with no wizard row is not_started with 0% progress', async () => {
    const res = await request(superApp).get('/admin/onboarding-status');
    expect(res.status).toBe(200);
    const rows = res.body.rows as Array<{
      orgId: number;
      onboarding: { status: string; progress: number; completedSteps: string[] };
    }>;
    const gamma = rows.find((r) => r.orgId === 3);
    expect(gamma).toBeDefined();
    expect(gamma!.onboarding.status).toBe('not_started');
    expect(gamma!.onboarding.progress).toBe(0);
    expect(gamma!.onboarding.completedSteps).toHaveLength(0);
  });

  it('(g) totals always reflect all orgs regardless of status filter', async () => {
    const res = await request(superApp).get('/admin/onboarding-status?status=complete');
    expect(res.status).toBe(200);
    const { totals } = res.body as {
      totals: { orgs: number; complete: number; inProgress: number; notStarted: number };
    };
    expect(totals.orgs).toBe(3);
    expect(totals.complete).toBe(1);
    expect(totals.inProgress).toBe(1);
    expect(totals.notStarted).toBe(1);
  });
});

