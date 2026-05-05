/**
 * Counsel Knowledge — org resolution + auth-gate behaviour
 *
 * Verifies that mutating routes use the canonical AuthenticatedUser shape
 * (req.user.orgs[].orgId) and never silently fall back to demo-org for
 * authenticated sessions.
 */

import express, { type Request, type Response, type NextFunction } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@szl-holdings/db', () => {
  const chain = (): Record<string, unknown> => {
    const c: Record<string, unknown> = {};
    c.from = () => c;
    c.where = () => c;
    c.orderBy = () => c;
    c.limit = () => Promise.resolve([]);
    c.values = () => c;
    c.set = () => c;
    c.returning = () => Promise.resolve([{ id: 1 }]);
    c.onConflictDoNothing = () => Promise.resolve();
    c.then = (r: (v: unknown[]) => unknown) => Promise.resolve([]).then(r);
    return c;
  };
  return {
    db: { select: chain, insert: chain, update: chain, delete: chain },
    pool: {},
    counselKnowledgeDocumentsTable: { id: 'id', matterId: 'matter_id', orgId: 'org_id' },
    counselKnowledgeChunksTable: { id: 'id', documentId: 'document_id' },
    counselKnowledgeEntitiesTable: { id: 'id' },
    counselKnowledgeRelationsTable: { id: 'id' },
    counselKnowledgeQueriesTable: { id: 'id' },
  };
});

vi.mock('drizzle-orm', () => ({
  eq: (col: unknown, val: unknown) => ({ op: 'eq', col, val }),
  and: (...conds: unknown[]) => ({ op: 'and', conds }),
  desc: (_col: unknown) => ({ op: 'desc' }),
  asc: (_col: unknown) => ({ op: 'asc' }),
  inArray: (_col: unknown, _vals: unknown) => ({ op: 'inArray' }),
  sql: (s: TemplateStringsArray) => ({ raw: s[0] }),
}));

vi.mock('../counsel-feeds', () => ({
  fetchAllFeeds: vi.fn().mockResolvedValue({
    courtListener: [], edgar: [], federalRegister: [], uspto: [], stateAg: [],
  }),
}));

vi.mock('@szl-holdings/ai-engine/providers/openai', () => ({
  createResponse: vi.fn().mockResolvedValue({ output_text: '' }),
}));

vi.mock('../../services/ai/call-model', () => ({
  callModel: vi.fn().mockResolvedValue({ text: '' }),
}));

type TestUser = { id: number; orgs: Array<{ orgId: string; orgSlug?: string; orgName?: string; role?: string }> } | null;

function injectUser(user: TestUser) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (user) (req as unknown as { user: unknown }).user = user;
    next();
  };
}

async function buildApp(user: TestUser) {
  const mod = await import('../counsel-knowledge');
  const app = express();
  app.use(express.json());
  app.use(injectUser(user));
  app.use('/api', mod.default);
  return app;
}

describe('counsel-knowledge — org-scope and auth gating', () => {
  beforeEach(() => { vi.resetModules(); });

  it('anonymous DELETE returns 401 AUTH_REQUIRED', async () => {
    const app = await buildApp(null);
    const res = await request(app).delete('/api/counsel-knowledge/m-001/documents/1');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('AUTH_REQUIRED');
  });

  it('anonymous SEED returns 401 AUTH_REQUIRED', async () => {
    const app = await buildApp(null);
    const res = await request(app).post('/api/counsel-knowledge/m-001/seed').send({});
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('AUTH_REQUIRED');
  });

  it('authenticated user with empty orgs[] is rejected with 401 (no silent demo-org demotion)', async () => {
    const app = await buildApp({ id: 99, orgs: [] });
    const res = await request(app).post('/api/counsel-knowledge/m-001/seed').send({});
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('AUTH_REQUIRED');
  });

  it('authenticated user with canonical orgs[].orgId passes the auth gate', async () => {
    const app = await buildApp({ id: 7, orgs: [{ orgId: 'org-real-tenant', orgSlug: 'real', orgName: 'Real', role: 'member' }] });
    const res = await request(app).post('/api/counsel-knowledge/m-001/seed').send({});
    expect(res.status).not.toBe(401);
  });

  it('READ /documents for authenticated user with empty orgs[] → 403 ORG_MEMBERSHIP_REQUIRED (no demo-org fallback)', async () => {
    const app = await buildApp({ id: 99, orgs: [] });
    const res = await request(app).get('/api/counsel-knowledge/m-001/documents');
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('ORG_MEMBERSHIP_REQUIRED');
  });

  it('QUERY for authenticated user with empty orgs[] → 403 ORG_MEMBERSHIP_REQUIRED (no demo-org fallback)', async () => {
    const app = await buildApp({ id: 99, orgs: [] });
    const res = await request(app).post('/api/counsel-knowledge/m-001/query').send({ query: 'test query string' });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('ORG_MEMBERSHIP_REQUIRED');
  });

  it('READ /documents anonymous (no req.user) → not 403 (demo-org path stays open)', async () => {
    const app = await buildApp(null);
    const res = await request(app).get('/api/counsel-knowledge/m-001/documents');
    expect(res.status).not.toBe(403);
  });
});
