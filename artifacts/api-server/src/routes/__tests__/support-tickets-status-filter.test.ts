/**
 * Support tickets ?status=open — integration tests (task #1454)
 *
 * Contract that the Command Center nav badge depends on.
 */

import express, { type NextFunction, type Request, type Response } from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

function parseOpenTicketCount(data: unknown): number {
  if (!data || typeof data !== 'object') return 0;
  const tickets = (data as { tickets?: unknown }).tickets;
  return Array.isArray(tickets) ? tickets.length : 0;
}

// ---------------------------------------------------------------------------
// Configurable mock state — read by the @szl-holdings/db mock below
// ---------------------------------------------------------------------------

let _ticketsResult: Array<Record<string, unknown>> = [];

vi.mock('@szl-holdings/db', () => {
  const ticketsChain = (): Record<string, unknown> => {
    const chain: Record<string, unknown> = {};
    Object.assign(chain, {
      from: () => chain,
      where: () => chain,
      orderBy: () => chain,
      limit: () => Promise.resolve(_ticketsResult),
      then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
        Promise.resolve(_ticketsResult).then(resolve, reject),
    });
    return chain;
  };

  const stub = (): Record<string, unknown> => {
    const chain: Record<string, unknown> = {};
    Object.assign(chain, {
      from: () => chain,
      where: () => chain,
      innerJoin: () => chain,
      leftJoin: () => chain,
      orderBy: () => chain,
      groupBy: () => chain,
      limit: () => Promise.resolve([]),
      set: () => chain,
      values: () => chain,
      returning: () => Promise.resolve([]),
      then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
        Promise.resolve([]).then(resolve, reject),
    });
    return chain;
  };

  let _selectCallCount = 0;
  return {
    db: {
      // First select() in /support/tickets handler is the tickets query
      select: () => {
        _selectCallCount += 1;
        return _selectCallCount === 1 ? ticketsChain() : stub();
      },
      insert: () => stub(),
      update: () => stub(),
      delete: () => stub(),
    },
    pool: { query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }) },
    supportTicketsTable: {
      orgId: 'org_id',
      userId: 'user_id',
      status: 'status',
      category: 'category',
      createdAt: 'created_at',
    },
    supportTicketCommentsTable: {},
    supportKnowledgeArticlesTable: {},
    tenantSettingsTable: {},
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
// App factory
// ---------------------------------------------------------------------------

interface AuthedUser {
  id: number;
  email: string;
  roles: string[];
  orgs: Array<{ orgId: number; orgSlug: string; orgName: string; role: string }>;
}

async function buildApp(user?: AuthedUser) {
  const { default: supportRouter } = await import('../support');
  const app = express();
  app.use(express.json());
  if (user) {
    app.use((req: Request, _res: Response, next: NextFunction) => {
      (req as unknown as { user: AuthedUser }).user = user;
      next();
    });
  }
  app.use('/api', supportRouter);
  return app;
}

const ADMIN_USER: AuthedUser = {
  id: 1,
  email: 'admin@szlholdings.com',
  roles: ['admin'],
  orgs: [{ orgId: 1, orgSlug: 'org-a', orgName: 'Org A', role: 'admin' }],
};

// ---------------------------------------------------------------------------
// Pure parser tests — drives the badge count
// ---------------------------------------------------------------------------

describe('parseOpenTicketCount — badge data parser', () => {
  it('returns the length of the tickets array', () => {
    expect(parseOpenTicketCount({ tickets: [{}, {}, {}] })).toBe(3);
  });

  it('returns 0 for an empty tickets array', () => {
    expect(parseOpenTicketCount({ tickets: [] })).toBe(0);
  });

  it('returns 0 when tickets is missing from the payload', () => {
    expect(parseOpenTicketCount({})).toBe(0);
  });

  it('returns 0 when tickets is not an array', () => {
    expect(parseOpenTicketCount({ tickets: 'oops' })).toBe(0);
  });

  it('returns 0 for null / undefined / non-object input', () => {
    expect(parseOpenTicketCount(null)).toBe(0);
    expect(parseOpenTicketCount(undefined)).toBe(0);
    expect(parseOpenTicketCount('error')).toBe(0);
    expect(parseOpenTicketCount(42)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// API contract tests — Command Center nav badge depends on these
// ---------------------------------------------------------------------------

describe('GET /api/support/tickets?status=open — Command Center nav badge contract', () => {
  it('returns 401 without a session (badge silently shows nothing)', async () => {
    const app = await buildApp();
    const res = await request(app).get('/api/support/tickets?status=open');
    expect(res.status).toBe(401);
  });

  it('accepts ?status=open for an authenticated admin and returns { tickets: [...] }', async () => {
    _ticketsResult = [
      { id: 1, status: 'open', subject: 'A' },
      { id: 2, status: 'open', subject: 'B' },
    ];
    const app = await buildApp(ADMIN_USER);
    const res = await request(app).get('/api/support/tickets?status=open');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('tickets');
    expect(Array.isArray(res.body.tickets)).toBe(true);
    expect(parseOpenTicketCount(res.body)).toBe(2);
  });

  it('returns 200 with an empty array when no open tickets exist (badge hides)', async () => {
    _ticketsResult = [];
    const app = await buildApp(ADMIN_USER);
    const res = await request(app).get('/api/support/tickets?status=open');
    expect(res.status).toBe(200);
    expect(res.body.tickets).toEqual([]);
    expect(parseOpenTicketCount(res.body)).toBe(0);
  });

  it('silently ignores unknown status values (no 4xx)', async () => {
    _ticketsResult = [];
    const app = await buildApp(ADMIN_USER);
    const res = await request(app).get('/api/support/tickets?status=bogus');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('tickets');
  });
});
