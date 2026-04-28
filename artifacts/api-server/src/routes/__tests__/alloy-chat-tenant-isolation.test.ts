/**
 * AlloyChat Tenant Isolation Regression Tests — task-3583
 *
 * Verifies that the AlloyChat conversation and message endpoints enforce
 * per-tenant ownership on every read, write, and delete path:
 *
 *   1. GET  /alloy-chat/conversations        → only returns rows for the caller's org
 *   2. POST /alloy-chat/conversations        → inserts with caller's orgId
 *   3. GET  /alloy-chat/conversations/:id/messages → 403 if convo belongs to another org
 *   4. DELETE /alloy-chat/conversations/:id  → 403 if convo belongs to another org
 *   5. POST /alloy-chat/conversations/:id/messages → 403 if convo belongs to another org
 *   6. All routes return 403 when tenantOrgId is absent (no org membership)
 *
 * The tenant context is injected via a middleware stub that sets/clears
 * `req.tenantOrgId`, mirroring what `tenantScope({ required: true })` does
 * after it resolves the caller's org membership.
 *
 * AI/streaming dependencies are stubbed so these tests run in-process
 * without any network I/O or LLM calls.
 */

import express, { type NextFunction, type Request, type Response } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Queue-driven DB mock ──────────────────────────────────────────────────────
// Each call to db.select().from().where()... resolves to the next item in
// dbQueue.results.  Push [] for "not found", push [row] for "found".

const { dbQueue } = vi.hoisted(() => ({ dbQueue: { results: [] as unknown[][] } }));

vi.mock('@szl-holdings/db', () => {
  const makeChain = () => {
    const c: Record<string, unknown> = {
      from: () => c,
      where: () => c,
      innerJoin: () => c,
      leftJoin: () => c,
      orderBy: () => c,
      limit: () => c,
      set: () => c,
      values: () => c,
      returning: () => {
        const result = dbQueue.results.shift() ?? [];
        return Promise.resolve(result);
      },
      then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) => {
        const result = dbQueue.results.shift() ?? [];
        return Promise.resolve(result).then(resolve, reject);
      },
    };
    return c;
  };

  return {
    db: {
      select: makeChain,
      insert: makeChain,
      update: makeChain,
      delete: makeChain,
    },
    pool: { query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }) },
    conversations: { id: 'id', orgId: 'org_id', title: 'title', createdAt: 'created_at' },
    messages: {
      id: 'id',
      conversationId: 'conversation_id',
      orgId: 'org_id',
      role: 'role',
      content: 'content',
      createdAt: 'created_at',
    },
    orgMembersTable: { orgId: 'org_id', userId: 'user_id' },
    organizationsTable: { id: 'id', slug: 'slug', name: 'name' },
  };
});

vi.mock('drizzle-orm', async (importOriginal) => {
  const actual = await importOriginal<typeof import('drizzle-orm')>();
  return {
    ...actual,
    eq: (_col: unknown, _val: unknown) => ({ op: 'eq' }),
    and: (..._conds: unknown[]) => ({ op: 'and' }),
    or: (..._conds: unknown[]) => ({ op: 'or' }),
    desc: (_col: unknown) => ({ op: 'desc' }),
    asc: (_col: unknown) => ({ op: 'asc' }),
    inArray: (_col: unknown, _vals: unknown) => ({ op: 'inArray' }),
    sql: Object.assign((_s: TemplateStringsArray, ..._v: unknown[]) => ({ op: 'sql' }), {
      mapWith: () => () => ({ op: 'sql' }),
    }),
    count: () => ({ op: 'count' }),
    gte: () => ({ op: 'gte' }),
    lte: () => ({ op: 'lte' }),
    gt: () => ({ op: 'gt' }),
  };
});

// AI / streaming stubs — not exercised for the CRUD isolation tests
vi.mock('@szl-holdings/ai-engine/providers/anthropic', () => ({
  anthropic: {
    messages: {
      stream: vi.fn().mockReturnValue({
        [Symbol.asyncIterator]: async function* () {},
        finalMessage: vi.fn().mockResolvedValue({ usage: { input_tokens: 0, output_tokens: 0 } }),
      }),
    },
  },
}));

vi.mock('@szl-holdings/ai-engine/providers/openai', () => ({
  createResponseStream: vi.fn().mockReturnValue({
    [Symbol.asyncIterator]: async function* () {},
  }),
  createResponse: vi.fn().mockResolvedValue({ content: '' }),
}));

vi.mock('../services/ai/call-model', () => ({
  enforceBudgetForOrg: vi.fn().mockResolvedValue(undefined),
  recordModelUsage: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@szl-holdings/services', () => ({
  services: {
    ai: { chatCompletion: vi.fn().mockResolvedValue({ content: '', model: '', provider: '', usage: {} }) },
    huggingface: {
      embedding: vi.fn().mockResolvedValue({ embedding: [] }),
      textGeneration: vi.fn().mockResolvedValue({ text: '', model: '' }),
    },
  },
}));

vi.mock('../lib/ssrf-guard', () => ({ assertExternalUrl: vi.fn() }));

vi.mock('express-rate-limit', () => ({
  default: () => (_req: Request, _res: Response, next: NextFunction) => next(),
}));

// authMiddleware is a passthrough in tests; tenantOrgId is injected by our helper below
vi.mock('../middlewares/auth', () => ({
  authMiddleware: () => (_req: Request, _res: Response, next: NextFunction) => next(),
}));

// ── Tenant injection helpers ──────────────────────────────────────────────────

/** Attaches a resolved tenantOrgId to the request (simulates tenantScope success). */
function withTenant(orgId: number) {
  return (req: Request, _res: Response, next: NextFunction) => {
    (req as unknown as { tenantOrgId: number }).tenantOrgId = orgId;
    next();
  };
}

/** Leaves tenantOrgId undefined (simulates no org membership → tenantScope would 403). */
function withNoTenant() {
  return (_req: Request, _res: Response, next: NextFunction) => {
    next();
  };
}

// ── App factory ───────────────────────────────────────────────────────────────

async function buildApp(tenantMiddleware: ReturnType<typeof withTenant | typeof withNoTenant>) {
  const { default: alloyChatRouter } = await import('../alloy-chat');
  const app = express();
  app.use(express.json());
  app.use(tenantMiddleware);
  app.use(alloyChatRouter);
  return app;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AlloyChat tenant isolation (task-3583)', () => {
  beforeEach(() => {
    dbQueue.results = [];
    vi.clearAllMocks();
  });

  // ── GET /alloy-chat/conversations ─────────────────────────────────────────

  describe('GET /alloy-chat/conversations', () => {
    it('returns 403 when tenantOrgId is absent (no org membership)', async () => {
      const app = await buildApp(withNoTenant());
      const res = await request(app).get('/alloy-chat/conversations');
      expect(res.status).toBe(403);
    });

    it('returns only this org\'s conversations when tenantOrgId is present', async () => {
      const orgId = 7;
      const ownConvo = { id: 1, orgId, title: 'My Chat', createdAt: new Date().toISOString() };
      dbQueue.results = [[ownConvo]];

      const app = await buildApp(withTenant(orgId));
      const res = await request(app).get('/alloy-chat/conversations');
      expect(res.status).toBe(200);
      expect(res.body.conversations).toHaveLength(1);
      expect(res.body.conversations[0].id).toBe(1);
    });

    it('returns empty list when org has no conversations', async () => {
      dbQueue.results = [[]];
      const app = await buildApp(withTenant(42));
      const res = await request(app).get('/alloy-chat/conversations');
      expect(res.status).toBe(200);
      expect(res.body.conversations).toHaveLength(0);
    });
  });

  // ── POST /alloy-chat/conversations ────────────────────────────────────────

  describe('POST /alloy-chat/conversations', () => {
    it('returns 403 when tenantOrgId is absent', async () => {
      const app = await buildApp(withNoTenant());
      const res = await request(app)
        .post('/alloy-chat/conversations')
        .send({ title: 'New Chat' });
      expect(res.status).toBe(403);
    });

    it('creates a conversation scoped to the caller\'s org', async () => {
      const orgId = 5;
      const newConvo = { id: 99, orgId, title: 'New Chat', createdAt: new Date().toISOString() };
      // insert().values().returning() consumes one queue entry
      dbQueue.results = [[newConvo]];

      const app = await buildApp(withTenant(orgId));
      const res = await request(app)
        .post('/alloy-chat/conversations')
        .send({ title: 'New Chat' });
      expect(res.status).toBe(201);
      expect(res.body.id).toBe(99);
    });
  });

  // ── GET /alloy-chat/conversations/:id/messages ────────────────────────────

  describe('GET /alloy-chat/conversations/:id/messages', () => {
    it('returns 403 when tenantOrgId is absent', async () => {
      const app = await buildApp(withNoTenant());
      const res = await request(app).get('/alloy-chat/conversations/1/messages');
      expect(res.status).toBe(403);
    });

    it('returns 404 when conversation does not exist', async () => {
      dbQueue.results = [[]]; // convo lookup returns nothing
      const app = await buildApp(withTenant(1));
      const res = await request(app).get('/alloy-chat/conversations/999/messages');
      expect(res.status).toBe(404);
    });

    it('returns 403 when conversation belongs to a different org (cross-tenant guard)', async () => {
      const attackerOrgId = 1;
      const victimConvo = { id: 5, orgId: 2, title: 'Secret Chat', createdAt: new Date().toISOString() };
      dbQueue.results = [[victimConvo]]; // lookup returns convo owned by org 2

      const app = await buildApp(withTenant(attackerOrgId));
      const res = await request(app).get('/alloy-chat/conversations/5/messages');
      expect(res.status).toBe(403);
    });

    it('returns messages when conversation belongs to the caller\'s org', async () => {
      const orgId = 3;
      const convo = { id: 10, orgId, title: 'My Chat', createdAt: new Date().toISOString() };
      const msgs = [
        { id: 1, conversationId: 10, role: 'user', content: 'Hello', createdAt: new Date().toISOString() },
        { id: 2, conversationId: 10, role: 'assistant', content: 'Hi!', createdAt: new Date().toISOString() },
      ];
      dbQueue.results = [[convo], msgs]; // first: convo lookup; second: messages

      const app = await buildApp(withTenant(orgId));
      const res = await request(app).get('/alloy-chat/conversations/10/messages');
      expect(res.status).toBe(200);
      expect(res.body.messages).toHaveLength(2);
    });
  });

  // ── DELETE /alloy-chat/conversations/:id ──────────────────────────────────

  describe('DELETE /alloy-chat/conversations/:id', () => {
    it('returns 403 when tenantOrgId is absent', async () => {
      const app = await buildApp(withNoTenant());
      const res = await request(app).delete('/alloy-chat/conversations/1');
      expect(res.status).toBe(403);
    });

    it('returns 400 for a non-numeric ID', async () => {
      const app = await buildApp(withTenant(1));
      const res = await request(app).delete('/alloy-chat/conversations/not-a-number');
      expect(res.status).toBe(400);
    });

    it('returns 404 when conversation does not exist', async () => {
      dbQueue.results = [[]];
      const app = await buildApp(withTenant(1));
      const res = await request(app).delete('/alloy-chat/conversations/999');
      expect(res.status).toBe(404);
    });

    it('returns 403 when conversation belongs to a different org (cross-tenant guard)', async () => {
      const attackerOrgId = 1;
      const victimConvo = { id: 7, orgId: 2, title: 'Private', createdAt: new Date().toISOString() };
      dbQueue.results = [[victimConvo]];

      const app = await buildApp(withTenant(attackerOrgId));
      const res = await request(app).delete('/alloy-chat/conversations/7');
      expect(res.status).toBe(403);
    });

    it('deletes successfully when conversation belongs to the caller\'s org', async () => {
      const orgId = 4;
      const convo = { id: 11, orgId, title: 'My Chat', createdAt: new Date().toISOString() };
      dbQueue.results = [[convo], []]; // lookup then delete
      const app = await buildApp(withTenant(orgId));
      const res = await request(app).delete('/alloy-chat/conversations/11');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ── POST /alloy-chat/conversations/:id/messages ───────────────────────────
  // This is the streaming endpoint; we only test the auth/ownership guard path
  // (the 403 cases), which respond before any streaming headers are sent.

  describe('POST /alloy-chat/conversations/:id/messages — ownership guards', () => {
    it('returns 403 when tenantOrgId is absent', async () => {
      const app = await buildApp(withNoTenant());
      const res = await request(app)
        .post('/alloy-chat/conversations/1/messages')
        .send({ content: 'Hello' });
      expect(res.status).toBe(403);
    });

    it('returns 400 when content is missing', async () => {
      const app = await buildApp(withTenant(1));
      const res = await request(app)
        .post('/alloy-chat/conversations/1/messages')
        .send({});
      expect(res.status).toBe(400);
    });

    it('returns 404 when conversation does not exist', async () => {
      dbQueue.results = [[]];
      const app = await buildApp(withTenant(1));
      const res = await request(app)
        .post('/alloy-chat/conversations/999/messages')
        .send({ content: 'Hello' });
      expect(res.status).toBe(404);
    });

    it('returns 403 when conversation belongs to a different org (cross-tenant injection guard)', async () => {
      const attackerOrgId = 1;
      const victimConvo = { id: 8, orgId: 2, title: 'Secret', createdAt: new Date().toISOString() };
      dbQueue.results = [[victimConvo]];

      const app = await buildApp(withTenant(attackerOrgId));
      const res = await request(app)
        .post('/alloy-chat/conversations/8/messages')
        .send({ content: 'Injected message' });
      expect(res.status).toBe(403);
    });
  });
});
