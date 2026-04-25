/**
 * Knowledge base public access — integration tests (task #1477)
 *
 * Verifies that:
 *  1. GET /api/support/knowledge (list/search) is accessible without a session
 *  2. GET /api/support/knowledge/:slug (article detail) is accessible without a session
 *  3. The global auth enforcer allowlist covers both routes via the
 *     "/api/support/knowledge" prefix entry
 *  4. Authenticated callers get the same responses (no double-auth penalty)
 *  5. Other support routes (tickets) remain protected by auth
 */

import express, { type NextFunction, type Request, type Response } from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('@szl-holdings/db', () => {
  const chain: Record<string, unknown> = {};
  Object.assign(chain, {
    from: () => chain,
    where: () => chain,
    innerJoin: () => chain,
    leftJoin: () => chain,
    orderBy: () => Promise.resolve([]),
    groupBy: () => chain,
    limit: () => Promise.resolve([]),
    set: () => chain,
    values: () => chain,
    returning: () => Promise.resolve([]),
    then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
      Promise.resolve([]).then(resolve, reject),
  });
  return {
    db: {
      select: () => chain,
      insert: () => chain,
      update: () => chain,
      delete: () => chain,
    },
    pool: { query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }) },
    supportKnowledgeArticlesTable: {
      isPublished: 'is_published',
      category: 'category',
      viewCount: 'view_count',
      slug: 'slug',
      id: 'id',
    },
    supportTicketsTable: {},
    supportTicketCommentsTable: {},
    tenantSettingsTable: {},
    orgMembersTable: { orgId: 'org_id', userId: 'user_id' },
    organizationsTable: { id: 'id', slug: 'slug', name: 'name' },
  };
});

vi.mock('drizzle-orm', () => ({
  eq: (col: unknown, val: unknown) => ({ op: 'eq', col, val }),
  and: (...conds: unknown[]) => ({ op: 'and', conds }),
  or: (...conds: unknown[]) => ({ op: 'or', conds }),
  desc: (_c: unknown) => ({ op: 'desc' }),
  ilike: (_c: unknown, _v: unknown) => ({ op: 'ilike' }),
  inArray: (_c: unknown, _v: unknown) => ({ op: 'inArray' }),
  isNull: (_c: unknown) => ({ op: 'isNull' }),
  sql: (_s: TemplateStringsArray, ..._v: unknown[]) => ({ op: 'sql' }),
}));

vi.mock('../../lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('../../lib/internal-tokens', () => ({
  verifyInternalHeader: () => null,
  tokenHasScope: () => false,
}));

vi.mock('@szl-holdings/observability', () => ({
  serverTelemetry: {
    recordAuthFailure: vi.fn(),
    recordTenantIsolationViolation: vi.fn(),
  },
}));

vi.mock('../../middlewares/auth', () => ({
  authMiddleware: (opts?: { required?: boolean }) => {
    const required = opts?.required ?? true;
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user && required) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      next();
    };
  },
  requireRole: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  requireAnyAuth: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  denyIfReadOnly: () => (_req: Request, _res: Response, next: NextFunction) => next(),
}));

vi.mock('../../lib/validation', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/validation')>();
  return {
    ...actual,
    validateBody: () => (_req: Request, _res: Response, next: NextFunction) => next(),
    validateQuery: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  };
});

vi.mock('../../lib/email', () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true }),
  buildSupportTicketAdminNotificationEmail: vi.fn(() => '<html/>'),
  buildSupportTicketConfirmationEmail: vi.fn(() => '<html/>'),
  buildSupportTicketReplyEmail: vi.fn(() => '<html/>'),
  buildSupportTicketStatusUpdateEmail: vi.fn(() => '<html/>'),
}));

// ---------------------------------------------------------------------------
// App factory — mirrors how the support router is mounted in the real app
// ---------------------------------------------------------------------------

import { globalAuthEnforcer, isAllowlistedPublicPath } from '../../middlewares/global-auth-enforcer';

async function buildApp(user?: { id: number; email: string; roles: string[]; orgs: unknown[] }) {
  const { default: supportRouter } = await import('../support');

  const app = express();
  app.use(express.json());

  if (user) {
    app.use((req: Request, _res: Response, next: NextFunction) => {
      (req as unknown as { user: typeof user }).user = user;
      next();
    });
  }

  app.use(globalAuthEnforcer);
  app.use('/api', supportRouter);
  return app;
}

// ---------------------------------------------------------------------------
// Tests: isAllowlistedPublicPath
// ---------------------------------------------------------------------------

describe('Knowledge base — global auth enforcer allowlist', () => {
  it('allows /api/support/knowledge (list endpoint) as a public path', () => {
    expect(isAllowlistedPublicPath('/api/support/knowledge')).toBe(true);
  });

  it('allows /api/support/knowledge/:slug (article detail) as a public path', () => {
    expect(isAllowlistedPublicPath('/api/support/knowledge/getting-started')).toBe(true);
    expect(isAllowlistedPublicPath('/api/support/knowledge/how-to-reset-password')).toBe(true);
  });

  it('does NOT allow /api/support/tickets (protected route)', () => {
    expect(isAllowlistedPublicPath('/api/support/tickets')).toBe(false);
  });

  it('does NOT allow /api/support/tickets/:id (protected route)', () => {
    expect(isAllowlistedPublicPath('/api/support/tickets/42')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Tests: unauthenticated HTTP access
// ---------------------------------------------------------------------------

describe('Knowledge base — unauthenticated GET access (task #1477)', () => {
  it('GET /api/support/knowledge returns 200 (not 401) without a session', async () => {
    const app = await buildApp();
    const res = await request(app).get('/api/support/knowledge');
    expect(res.status).not.toBe(401);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('articles');
    expect(Array.isArray(res.body.articles)).toBe(true);
  });

  it('GET /api/support/knowledge?q=billing returns 200 without a session', async () => {
    const app = await buildApp();
    const res = await request(app).get('/api/support/knowledge?q=billing');
    expect(res.status).not.toBe(401);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('articles');
  });

  it('GET /api/support/knowledge?category=technical returns 200 without a session', async () => {
    const app = await buildApp();
    const res = await request(app).get('/api/support/knowledge?category=technical');
    expect(res.status).not.toBe(401);
    expect(res.status).toBe(200);
  });

  it('GET /api/support/knowledge/:slug returns 404 (not 401) when article absent, without session', async () => {
    const app = await buildApp();
    const res = await request(app).get('/api/support/knowledge/nonexistent-slug');
    expect(res.status).not.toBe(401);
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// Tests: authenticated users get the same responses (no double-auth penalty)
// ---------------------------------------------------------------------------

describe('Knowledge base — authenticated users get identical responses', () => {
  const authedUser = {
    id: 1,
    email: 'alice@example.com',
    roles: ['member'],
    orgs: [{ orgId: 1, orgSlug: 'org-a', orgName: 'Org A', role: 'member' }],
  };

  it('GET /api/support/knowledge returns 200 for authenticated users', async () => {
    const app = await buildApp(authedUser);
    const res = await request(app).get('/api/support/knowledge');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('articles');
  });

  it('GET /api/support/knowledge/:slug returns 404 (not 401) for authenticated users when absent', async () => {
    const app = await buildApp(authedUser);
    const res = await request(app).get('/api/support/knowledge/some-slug');
    expect(res.status).not.toBe(401);
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// Tests: protected support routes remain inaccessible without auth
// ---------------------------------------------------------------------------

describe('Support tickets — remain protected (regression guard)', () => {
  it('GET /api/support/tickets returns 401 without a session', async () => {
    const app = await buildApp();
    const res = await request(app).get('/api/support/tickets');
    expect(res.status).toBe(401);
  });

  it('POST /api/support/tickets returns 401 without a session', async () => {
    const app = await buildApp();
    const res = await request(app)
      .post('/api/support/tickets')
      .send({ subject: 'Help', description: 'I need help with my account', submitterName: 'Alice', submitterEmail: 'alice@example.com' });
    expect(res.status).toBe(401);
  });
});
