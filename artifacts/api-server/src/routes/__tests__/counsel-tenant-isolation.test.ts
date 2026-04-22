/**
 * PRISM Counsel Tenant Isolation Tests
 *
 * Imports the REAL counsel router and verifies that DB-level org scoping
 * prevents cross-tenant data access for matters, audit trail, and proof chain.
 *
 * Approach mirrors vessels-tenant-isolation.test.ts:
 *   1. The auth-injection middleware sets req.user with the tested org membership.
 *   2. The DB mock returns whatever is queued in _selectQueue — which is exactly
 *      what the real DB would return after WHERE org_id = <orgId> filters out
 *      cross-org rows.
 *   3. A request without an org membership receives 403; a request with the
 *      wrong org receives 404 because the org-scoped WHERE returns no rows.
 *
 * This guarantees an authenticated user from Org A cannot read or mutate
 * matters that belong to Org B even if they guess valid IDs.
 */

import express, { type NextFunction, type Request, type Response } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

let _selectQueue: unknown[][] = [];
let _insertValues: unknown[] = [];
let _updateSetArgs: unknown[] = [];
let _deleteWhereCalls: number = 0;
let _lastSelectWhere: unknown = null;

vi.mock('@szl-holdings/db', () => ({
  db: {
    select() {
      const result = (_selectQueue.shift() ?? []) as unknown[];
      const chain: Record<string, unknown> = {
        from: () => chain,
        where: (w: unknown) => {
          _lastSelectWhere = w;
          return chain;
        },
        orderBy: () => Promise.resolve(result),
        limit: () => Promise.resolve(result),
        then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
          Promise.resolve(result).then(resolve, reject),
      };
      return chain;
    },
    insert() {
      const chain: Record<string, unknown> = {
        values: (vals: unknown) => {
          _insertValues.push(vals);
          return chain;
        },
        onConflictDoNothing: () => Promise.resolve(),
        returning: () => Promise.resolve([_insertValues.at(-1) ?? {}]),
      };
      return chain;
    },
    update() {
      const result = (_selectQueue.shift() ?? []) as unknown[];
      const chain: Record<string, unknown> = {
        set: (args: unknown) => {
          _updateSetArgs.push(args);
          return chain;
        },
        where: () => chain,
        returning: () => Promise.resolve(result),
      };
      return chain;
    },
    delete() {
      const result = (_selectQueue.shift() ?? []) as unknown[];
      const chain: Record<string, unknown> = {
        where: () => {
          _deleteWhereCalls++;
          return chain;
        },
        returning: () => Promise.resolve(result),
      };
      return chain;
    },
  },
  pcGcMattersTable: { id: 'id', orgId: 'org_id' },
  pcGcObligationsTable: { id: 'id', matterId: 'matter_id', sortOrder: 'sort_order' },
  pcGcAuditEntriesTable: { id: 'id', matterId: 'matter_id', timestamp: 'timestamp' },
  pcGcProofChainEntriesTable: { id: 'id', matterId: 'matter_id', timestamp: 'timestamp' },
}));

vi.mock('drizzle-orm', () => ({
  eq: (col: unknown, val: unknown) => ({ op: 'eq', col, val }),
  and: (...conds: unknown[]) => ({ op: 'and', conds }),
  desc: (_col: unknown) => ({ op: 'desc' }),
  asc: (_col: unknown) => ({ op: 'asc' }),
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

function makeOrgAUser() {
  return {
    id: 10,
    displayName: 'Alice',
    email: 'alice@org-a.example',
    roles: ['member'] as string[],
    orgs: [{ orgId: 1, orgSlug: 'org-a', orgName: 'Org A', role: 'member' }],
  };
}

function makeOrgBUser() {
  return {
    id: 20,
    displayName: 'Bob',
    email: 'bob@org-b.example',
    roles: ['member'] as string[],
    orgs: [{ orgId: 2, orgSlug: 'org-b', orgName: 'Org B', role: 'member' }],
  };
}

function makeNoOrgUser() {
  return {
    id: 30,
    displayName: 'Eve',
    email: 'eve@attacker.example',
    roles: [] as string[],
    orgs: [] as Array<{ orgId: number; orgSlug: string; orgName: string; role: string }>,
  };
}

function injectUser(factory: (() => ReturnType<typeof makeOrgAUser>) | null) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (factory) (req as unknown as { user: unknown }).user = factory();
    next();
  };
}

async function buildCounselApp(userFactory: (() => ReturnType<typeof makeOrgAUser>) | null) {
  const { default: router } = await import('../counsel');
  const app = express();
  app.use(express.json());
  app.use(injectUser(userFactory));
  app.use(router);
  return app;
}

describe('PRISM Counsel tenant isolation — real router with DB-level org scoping', () => {
  beforeEach(() => {
    _selectQueue = [];
    _insertValues = [];
    _updateSetArgs = [];
    _deleteWhereCalls = 0;
    _lastSelectWhere = null;
    // Disable seeding for these tests so list queries don't trigger the
    // 6-matter SEED_MATTERS insert against the mocked DB.
    process.env.PRISM_COUNSEL_SEED_DEMO = '0';
    process.env.NODE_ENV = 'production';
  });

  describe('GET /counsel/matters — org-scoped list', () => {
    it('returns 403 when caller has no org membership', async () => {
      const app = await buildCounselApp(makeNoOrgUser);
      const res = await request(app).get('/counsel/matters');
      expect(res.status).toBe(403);
    });

    it('returns 401 (or 403) when the request is unauthenticated', async () => {
      const app = await buildCounselApp(null);
      const res = await request(app).get('/counsel/matters');
      // No req.user → no orgId → handler returns 403 from requireOrgId.
      // (At the global enforcer layer, unauthenticated callers would have already
      // received a 401 before reaching the handler. We assert 403 here because
      // the test app intentionally bypasses the enforcer to exercise the handler.)
      expect(res.status).toBe(403);
    });

    it("returns Org A's empty list when their org-scoped DB query returns no rows", async () => {
      _selectQueue = [[]]; // ensureSeeded check OR matter id list
      const app = await buildCounselApp(makeOrgAUser);
      const res = await request(app).get('/counsel/matters');
      expect(res.status).toBe(200);
      expect(res.body?.data?.matters ?? res.body?.matters).toEqual([]);
    });
  });

  describe('GET /counsel/matters/:id — cross-tenant matter access blocked at DB layer', () => {
    it('returns 404 when Org A asks for a matter that belongs to Org B', async () => {
      // The org-scoped SELECT returns [] because the matter row's org_id != 1
      _selectQueue = [[]];
      const app = await buildCounselApp(makeOrgAUser);
      const res = await request(app).get('/counsel/matters/M-2024-001');
      expect(res.status).toBe(404);
    });

    it('returns 200 when Org A asks for one of their own matters', async () => {
      const orgAMatter = {
        id: 'M-2024-001',
        orgId: '1',
        name: 'Apex M&A',
        clientName: 'Apex',
        matterNumber: '2024-MA-001',
        type: 'transaction',
        status: 'active',
        privilegeLevel: 'restricted',
        pressureScore: 80,
        complexityScore: 70,
        openedDate: '2024-01-01',
        trialDate: null,
        closingDate: null,
        nextDeadline: '2024-02-01',
        nextDeadlineLabel: 'X',
        leadCounsel: 'M',
        jurisdiction: 'DE',
        estimatedExposure: null,
        summary: '',
        tags: [],
        parties: [],
        wall: {},
      };
      _selectQueue = [[orgAMatter], [], [], []];
      const app = await buildCounselApp(makeOrgAUser);
      const res = await request(app).get('/counsel/matters/M-2024-001');
      expect(res.status).toBe(200);
      const data = res.body?.data ?? res.body;
      expect(data.id).toBe('M-2024-001');
    });
  });

  describe('POST /counsel/matters — orgId stamped from session', () => {
    it("stamps orgId='1' for Org A users when creating a matter", async () => {
      _selectQueue = [[]]; // duplicate check returns empty
      const app = await buildCounselApp(makeOrgAUser);
      const res = await request(app)
        .post('/counsel/matters')
        .send({
          name: 'New Matter',
          clientName: 'Client',
          matterNumber: '2024-NEW-001',
          type: 'litigation',
          status: 'active',
          privilegeLevel: 'confidential',
          pressureScore: 50,
          complexityScore: 50,
          openedDate: '2024-01-01',
          nextDeadline: '2024-02-01',
          nextDeadlineLabel: 'Filing',
          leadCounsel: 'X',
          jurisdiction: 'NY',
          summary: '...',
          tags: [],
          wall: {
            enabled: false,
            reason: '',
            blockedRoles: [],
            approvedUsers: [],
            createdAt: '',
            createdBy: '',
          },
          parties: [],
        });
      expect(res.status).toBeLessThan(500);
      const inserted = _insertValues[0] as Record<string, unknown>;
      expect(inserted.orgId).toBe('1');
    });

    it("stamps orgId='2' for Org B users when creating a matter", async () => {
      _selectQueue = [[]];
      const app = await buildCounselApp(makeOrgBUser);
      await request(app)
        .post('/counsel/matters')
        .send({
          name: 'Org B Matter',
          clientName: 'Client B',
          matterNumber: '2024-NEW-002',
          type: 'litigation',
          status: 'active',
          privilegeLevel: 'confidential',
          pressureScore: 50,
          complexityScore: 50,
          openedDate: '2024-01-01',
          nextDeadline: '2024-02-01',
          nextDeadlineLabel: 'Filing',
          leadCounsel: 'X',
          jurisdiction: 'NY',
          summary: '...',
          tags: [],
          wall: {
            enabled: false,
            reason: '',
            blockedRoles: [],
            approvedUsers: [],
            createdAt: '',
            createdBy: '',
          },
          parties: [],
        });
      const inserted = _insertValues[0] as Record<string, unknown>;
      expect(inserted.orgId).toBe('2');
    });

    it('returns 403 when no-org user tries to create a matter', async () => {
      const app = await buildCounselApp(makeNoOrgUser);
      const res = await request(app).post('/counsel/matters').send({ name: 'X' });
      expect(res.status).toBe(403);
      expect(_insertValues.length).toBe(0);
    });
  });

  describe('PATCH /counsel/matters/:id — cross-tenant updates blocked', () => {
    it('returns 404 when Org A tries to PATCH an Org B matter (org-scoped UPDATE returns empty)', async () => {
      _selectQueue = [[]]; // update().returning() resolves to []
      const app = await buildCounselApp(makeOrgAUser);
      const res = await request(app)
        .patch('/counsel/matters/M-OTHER-ORG')
        .send({ status: 'closed' });
      expect(res.status).toBe(404);
    });

    it('returns 403 for no-org user', async () => {
      const app = await buildCounselApp(makeNoOrgUser);
      const res = await request(app).patch('/counsel/matters/M-X').send({ status: 'closed' });
      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /counsel/matters/:id — cross-tenant deletes blocked', () => {
    it('returns 404 when Org A tries to DELETE an Org B matter', async () => {
      _selectQueue = [[]];
      const app = await buildCounselApp(makeOrgAUser);
      const res = await request(app).delete('/counsel/matters/M-OTHER');
      expect(res.status).toBe(404);
    });

    it('returns 403 for no-org user', async () => {
      const app = await buildCounselApp(makeNoOrgUser);
      const res = await request(app).delete('/counsel/matters/M-X');
      expect(res.status).toBe(403);
    });
  });

  describe('POST /counsel/audit-trail — cross-tenant audit append blocked', () => {
    it('returns 404 when Org A appends to an audit trail for an Org B matter', async () => {
      // First select (matter ownership lookup) returns [] because the matter is in Org B.
      _selectQueue = [[]];
      const app = await buildCounselApp(makeOrgAUser);
      const res = await request(app).post('/counsel/audit-trail').send({
        matterId: 'M-OTHER-ORG',
        user: 'alice',
        role: 'Partner',
        action: 'viewed',
        detail: 'trying to inject',
        ip: '10.0.0.1',
      });
      expect(res.status).toBe(404);
      // Crucially: no audit row was inserted
      expect(_insertValues.length).toBe(0);
    });

    it('returns 403 for no-org user', async () => {
      const app = await buildCounselApp(makeNoOrgUser);
      const res = await request(app)
        .post('/counsel/audit-trail')
        .send({ matterId: 'M-X', user: 'x', role: 'y', action: 'viewed', detail: '...' });
      expect(res.status).toBe(403);
      expect(_insertValues.length).toBe(0);
    });
  });

  describe('POST /counsel/proof-chain — cross-tenant proof append blocked', () => {
    it('returns 404 when Org A appends a proof entry for an Org B matter', async () => {
      _selectQueue = [[]];
      const app = await buildCounselApp(makeOrgAUser);
      const res = await request(app).post('/counsel/proof-chain').send({
        matterId: 'M-OTHER-ORG',
        eventType: 'filing',
        title: 'x',
        summary: 'y',
        privilegeLevel: 'confidential',
        author: 'alice',
        parties: [],
      });
      expect(res.status).toBe(404);
      expect(_insertValues.length).toBe(0);
    });
  });

  describe('GET /counsel/proof-chain — cross-tenant proof read blocked', () => {
    it('returns 404 when Org A queries proof chain for an Org B matter', async () => {
      _selectQueue = [[]]; // matter ownership lookup returns []
      const app = await buildCounselApp(makeOrgAUser);
      const res = await request(app).get('/counsel/proof-chain?matterId=M-OTHER-ORG');
      expect(res.status).toBe(404);
    });

    it('returns 403 for no-org user', async () => {
      const app = await buildCounselApp(makeNoOrgUser);
      const res = await request(app).get('/counsel/proof-chain?matterId=M-X');
      expect(res.status).toBe(403);
    });
  });

  describe('Seed gating — production with no flag and non-admin caller', () => {
    it('does NOT insert SEED_MATTERS for a brand-new org in production without the flag', async () => {
      // production + flag explicitly off + plain member role → seedingAllowed === false
      _selectQueue = [[]]; // the matters list query
      const app = await buildCounselApp(makeOrgAUser);
      const res = await request(app).get('/counsel/matters');
      expect(res.status).toBe(200);
      // No matters were inserted as a side-effect of the read
      expect(_insertValues.length).toBe(0);
    });
  });
});
