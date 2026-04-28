/**
 * CORTEX entity-graph snapshot endpoints — integration test
 *
 * Covers the trio that the dashboard now wires:
 *   POST /cortex/entity-graph/snapshot
 *   GET  /cortex/entity-graph/snapshots
 *   GET  /cortex/entity-graph/snapshot/:uuid
 *
 * Snapshot capture is delegated to the captureGraphSnapshot service, which we
 * mock here so the test does not need a live ontology engine or DB.
 */

import express, { type NextFunction, type Request, type Response } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

let _currentUser: {
  id: number;
  displayName: string;
  email: string;
  roles: string[];
  orgs: Array<{ orgId: number; orgSlug: string; orgName: string; role: string }>;
} = {
  id: 1,
  displayName: 'Alice',
  email: 'alice@org1.example',
  roles: ['member'],
  orgs: [{ orgId: 42, orgSlug: 'org42', orgName: 'Org 42', role: 'member' }],
};

let _selectQueue: unknown[][] = [];

const captureGraphSnapshotMock = vi.fn();

vi.mock('../../services/cortex-graph-snapshot', () => ({
  captureGraphSnapshot: (...args: unknown[]) => captureGraphSnapshotMock(...args),
}));

vi.mock('@szl-holdings/db', () => {
  const col = (name: string) => ({ _colName: name });
  return {
    db: {
      select() {
        const result = (_selectQueue.shift() ?? []) as unknown[];
        const chain: Record<string, unknown> = {
          from: () => chain,
          where: () => chain,
          orderBy: () => chain,
          limit: () => chain,
          offset: () => Promise.resolve(result),
          then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
            Promise.resolve(result).then(resolve, reject),
        };
        return chain;
      },
      insert() {
        return { values: () => ({ returning: () => Promise.resolve([]) }) };
      },
      update() {
        return {
          set: () => ({ where: () => ({ returning: () => Promise.resolve([]) }) }),
        };
      },
      delete() {
        return { where: () => Promise.resolve([]) };
      },
    },
    cortexGraphSnapshotsTable: {
      id: col('id'),
      orgId: col('org_id'),
      snapshotUuid: col('snapshot_uuid'),
      snapshotAt: col('snapshot_at'),
      expiresAt: col('expires_at'),
      retentionDays: col('retention_days'),
      label: col('label'),
      meta: col('meta'),
      nodes: col('nodes'),
      edges: col('edges'),
    },
    cortexActionDraftsTable: {},
    dailyBriefingsTable: {},
    alloyAuditLogTable: {},
  };
});

vi.mock('drizzle-orm', () => ({
  eq: (col: unknown, val: unknown) => ({ op: 'eq', col, val }),
  and: (...conds: unknown[]) => ({ op: 'and', conds }),
  inArray: (col: unknown, vals: unknown) => ({ op: 'inArray', col, vals }),
  desc: (col: unknown) => ({ op: 'desc', col }),
  sql: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) => ({ op: 'sql', strings, values }),
    { raw: (s: string) => s },
  ),
  gt: (col: unknown, val: unknown) => ({ op: 'gt', col, val }),
  gte: (col: unknown, val: unknown) => ({ op: 'gte', col, val }),
  lte: (col: unknown, val: unknown) => ({ op: 'lte', col, val }),
  relations: (..._a: unknown[]) => ({}),
}));

vi.mock('../../middlewares/auth', () => ({
  authMiddleware:
    (_opts?: unknown) => (req: Request, _res: Response, next: NextFunction) => {
      (req as unknown as { user: typeof _currentUser }).user = _currentUser;
      next();
    },
  requireRole: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  requireAnyAuth: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  denyIfReadOnly: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  InvalidIdError: class InvalidIdError extends Error {},
}));

vi.mock('../../middlewares/sliding-window-limiter', () => ({
  perUserWriteSlidingLimiter: (_req: Request, _res: Response, next: NextFunction) => next(),
  perUserApiSlidingLimiter: (_req: Request, _res: Response, next: NextFunction) => next(),
}));

vi.mock('../../lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('@szl-holdings/ai-engine', () => ({
  fusionCortex: { getAlerts: () => [], getStats: () => ({}) },
  ontologyEngine: {
    getDomainEntities: async () => [],
    getEntityConnections: async () => ({ outgoing: [], incoming: [] }),
    getGraphStats: async () => ({ totalEntities: 0, totalRelationships: 0 }),
  },
}));

vi.mock('../../lib/multi-agent-orchestrator', () => ({
  orchestrate: async () => ({}),
}));

vi.mock('@szl-holdings/observability', () => ({
  serverTelemetry: { recordAuthFailure: vi.fn(), recordRequest: vi.fn() },
}));

vi.mock('../../lib/export-service', () => ({ runExport: vi.fn() }));

let _app: express.Application | null = null;
async function getApp(): Promise<express.Application> {
  if (_app) return _app;
  const { default: cortexRouter } = await import('../cortex.js');
  _app = express();
  _app.use(express.json());
  _app.use(cortexRouter);
  return _app;
}

beforeEach(() => {
  _selectQueue = [];
  captureGraphSnapshotMock.mockReset();
});

describe('POST /cortex/entity-graph/snapshot', () => {
  it('captures a snapshot for the caller org and echoes the persisted record', async () => {
    const fakeUuid = 'aaaa-bbbb-cccc-dddd';
    const snapshotAt = new Date('2026-04-22T01:00:00Z');
    const expiresAt = new Date('2026-05-22T01:00:00Z');
    captureGraphSnapshotMock.mockResolvedValueOnce({
      snapshotUuid: fakeUuid,
      orgId: 42,
      label: 'Manual capture · Apr 22',
      snapshotAt,
      expiresAt,
      nodeCount: 3,
      edgeCount: 2,
    });
    _selectQueue.push([
      {
        snapshotUuid: fakeUuid,
        label: 'Manual capture · Apr 22',
        snapshotAt,
        expiresAt,
        retentionDays: 30,
        meta: { domain: 'all' },
      },
    ]);

    const app = await getApp();
    const res = await request(app)
      .post('/cortex/entity-graph/snapshot')
      .send({ label: 'Manual capture · Apr 22' });

    expect(res.status).toBe(200);
    expect(res.body.snapshot.id).toBe(fakeUuid);
    expect(res.body.snapshot.label).toBe('Manual capture · Apr 22');
    expect(res.body.snapshot.retentionDays).toBe(30);
    expect(captureGraphSnapshotMock).toHaveBeenCalledTimes(1);
    expect(captureGraphSnapshotMock.mock.calls[0]?.[0]).toMatchObject({
      orgId: 42,
      label: 'Manual capture · Apr 22',
      source: 'manual',
    });
  });

  it('rejects capture with 403 when the caller has no org context', async () => {
    const previousUser = _currentUser;
    _currentUser = { ...previousUser, orgs: [] };
    try {
      const app = await getApp();
      const res = await request(app).post('/cortex/entity-graph/snapshot').send({});
      expect(res.status).toBe(403);
      expect(captureGraphSnapshotMock).not.toHaveBeenCalled();
    } finally {
      _currentUser = previousUser;
    }
  });
});

describe('GET /cortex/entity-graph/snapshots', () => {
  it('returns the org-scoped snapshot list with total count', async () => {
    _selectQueue.push([{ count: 2 }]);
    _selectQueue.push([
      {
        id: 'uuid-1',
        label: 'Yesterday',
        snapshotAt: new Date('2026-04-21T01:00:00Z'),
        expiresAt: new Date('2026-05-21T01:00:00Z'),
        retentionDays: 30,
        meta: null,
      },
      {
        id: 'uuid-2',
        label: 'Two days ago',
        snapshotAt: new Date('2026-04-20T01:00:00Z'),
        expiresAt: new Date('2026-05-20T01:00:00Z'),
        retentionDays: 30,
        meta: null,
      },
    ]);

    const app = await getApp();
    const res = await request(app).get('/cortex/entity-graph/snapshots');
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.snapshots).toHaveLength(2);
    expect(res.body.snapshots[0].id).toBe('uuid-1');
  });

  it('returns 403 when the caller has no org context', async () => {
    const previousUser = _currentUser;
    _currentUser = { ...previousUser, orgs: [] };
    try {
      const app = await getApp();
      const res = await request(app).get('/cortex/entity-graph/snapshots');
      expect(res.status).toBe(403);
    } finally {
      _currentUser = previousUser;
    }
  });
});

describe('GET /cortex/entity-graph/snapshot/:uuid', () => {
  it('returns nodes/edges for an org-owned, unexpired snapshot', async () => {
    const future = new Date(Date.now() + 7 * 24 * 3600 * 1000);
    _selectQueue.push([
      {
        snapshotUuid: 'uuid-1',
        orgId: 42,
        label: 'Yesterday',
        snapshotAt: new Date('2026-04-21T01:00:00Z'),
        expiresAt: future,
        retentionDays: 30,
        nodes: [{ id: 'n1', label: 'Node 1' }],
        edges: [{ source: 'n1', target: 'n2', type: 'rel' }],
        meta: { domain: 'all' },
      },
    ]);

    const app = await getApp();
    const res = await request(app).get('/cortex/entity-graph/snapshot/uuid-1');
    expect(res.status).toBe(200);
    expect(res.body.snapshot.id).toBe('uuid-1');
    expect(res.body.snapshot.nodes).toHaveLength(1);
    expect(res.body.snapshot.edges).toHaveLength(1);
  });

  it('returns 404 when the snapshot belongs to a different org', async () => {
    const future = new Date(Date.now() + 7 * 24 * 3600 * 1000);
    _selectQueue.push([
      {
        snapshotUuid: 'uuid-other',
        orgId: 999,
        label: 'Other org',
        snapshotAt: new Date(),
        expiresAt: future,
        retentionDays: 30,
        nodes: [],
        edges: [],
        meta: null,
      },
    ]);

    const app = await getApp();
    const res = await request(app).get('/cortex/entity-graph/snapshot/uuid-other');
    expect(res.status).toBe(404);
  });

  it('returns 404 when the snapshot has expired', async () => {
    _selectQueue.push([
      {
        snapshotUuid: 'uuid-stale',
        orgId: 42,
        label: 'Stale',
        snapshotAt: new Date('2025-01-01T00:00:00Z'),
        expiresAt: new Date('2025-02-01T00:00:00Z'),
        retentionDays: 30,
        nodes: [],
        edges: [],
        meta: null,
      },
    ]);

    const app = await getApp();
    const res = await request(app).get('/cortex/entity-graph/snapshot/uuid-stale');
    expect(res.status).toBe(404);
  });

  it('returns 403 when the caller has no org context', async () => {
    const previousUser = _currentUser;
    _currentUser = { ...previousUser, orgs: [] };
    try {
      const app = await getApp();
      const res = await request(app).get('/cortex/entity-graph/snapshot/uuid-1');
      expect(res.status).toBe(403);
    } finally {
      _currentUser = previousUser;
    }
  });
});

describe('DELETE /cortex/entity-graph/snapshot/:uuid', () => {
  it('deletes an org-owned snapshot and returns success', async () => {
    _selectQueue.push([{ id: 1, orgId: 42 }]);

    const app = await getApp();
    const res = await request(app).delete('/cortex/entity-graph/snapshot/uuid-1');
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
  });

  it('returns 404 when the snapshot belongs to a different org', async () => {
    _selectQueue.push([{ id: 2, orgId: 999 }]);

    const app = await getApp();
    const res = await request(app).delete('/cortex/entity-graph/snapshot/uuid-other');
    expect(res.status).toBe(404);
  });

  it('returns 404 when no matching snapshot is found', async () => {
    _selectQueue.push([]);

    const app = await getApp();
    const res = await request(app).delete('/cortex/entity-graph/snapshot/uuid-missing');
    expect(res.status).toBe(404);
  });

  it('returns 403 when the caller has no org context', async () => {
    const previousUser = _currentUser;
    _currentUser = { ...previousUser, orgs: [] };
    try {
      const app = await getApp();
      const res = await request(app).delete('/cortex/entity-graph/snapshot/uuid-1');
      expect(res.status).toBe(403);
    } finally {
      _currentUser = previousUser;
    }
  });
});
