/**
 * Integration tests for GET /graph/entities/:id/neighbors  (task #1102)
 *
 * Boots the real Express graph route handlers against a real PostgreSQL
 * database. Only the auth middleware is mocked (to inject a test principal).
 * The `cst_nodes`/`cst_edges` rows used by these tests are seeded in
 * beforeAll and removed in afterAll, so the suite is self-contained and
 * idempotent against repeated runs.
 *
 * Topology of the seeded fixture (all rows tagged with PROVENANCE_ID for
 * targeted teardown, all using the unique FIXTURE_ENTITY_TYPE):
 *
 *   N_HUB (terra)          ← the "subject" node we expand around
 *   ├── N_OUT_1 (terra)    edge: HUB -> OUT_1   (outbound, internal)
 *   ├── N_OUT_2 (vessels)  edge: HUB -> OUT_2   (outbound, cross-domain)
 *   ├── N_IN_1  (aegis)    edge: IN_1 -> HUB    (inbound,  cross-domain)
 *   └── N_IN_2  (terra)    edge: IN_2 -> HUB    (inbound,  internal,
 *                                                edge.active = false)
 *
 *   N_ISLAND (terra)        ← node with NO edges (zero-neighbor case)
 *
 * The contract under test:
 *   • 200 + `{ node, neighbors[], edges[], stats }` for a real id
 *   • neighbors are deduplicated and never include the subject itself
 *   • both inbound and outbound edges are included
 *   • inactive edges are still returned (route does not filter on edge.active)
 *   • zero-neighbor nodes still return a 200 with empty arrays
 *   • 404 for a syntactically-valid but unknown UUID
 *   • 400 for `limit` outside the [1,200] range or non-numeric
 *   • `limit=N` caps the number of edges returned
 */

import express, { type NextFunction, type Request, type Response } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const TEST_USER = { id: 'test-user-1', isAdmin: false, orgs: [{ orgId: 1 }] };

const mockAuthMiddleware = () => (req: Request, res: Response, next: NextFunction) => {
  res.locals.userId = TEST_USER.id;
  res.locals.role = 'ops';
  (req as Request & { user?: typeof TEST_USER }).user = TEST_USER;
  next();
};

vi.mock('../../artifacts/api-server/src/middlewares/auth', () => ({
  authMiddleware: mockAuthMiddleware,
  requireRole:
    (..._roles: string[]) =>
    (_req: Request, _res: Response, next: NextFunction) =>
      next(),
  denyIfReadOnly: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  parseIdParam: (id: string) => {
    const n = parseInt(id, 10);
    if (isNaN(n)) throw Object.assign(new Error('Invalid ID'), { status: 400 });
    return n;
  },
  InvalidIdError: class InvalidIdError extends Error {
    status = 400;
    constructor(msg: string) {
      super(msg);
    }
  },
}));

function buildApp() {
  const app = express();
  app.use(express.json());
  return app;
}

describe('Integration — GET /graph/entities/:id/neighbors', () => {
  let app: express.Express;
  const RUN_TAG = `it-graph-neighbors-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const FIXTURE_ENTITY_TYPE = `fixture_${RUN_TAG}`;
  const PROVENANCE_ID = `task-1102:${RUN_TAG}`;

  const seeded = {
    hub: '',
    out1: '',
    out2: '',
    in1: '',
    in2: '',
    island: '',
    edgeIds: [] as string[],
  };

  beforeAll(async () => {
    app = buildApp();
    const router = (await import('../../artifacts/api-server/src/routes/graph')).default;
    app.use(router);

    const { db, cstNodes, cstEdges } = await import('@szl-holdings/db');

    const insertedNodes = await db
      .insert(cstNodes)
      .values([
        {
          domain: 'terra',
          entityType: FIXTURE_ENTITY_TYPE,
          name: `${RUN_TAG}-HUB`,
          provenanceSourceId: PROVENANCE_ID,
        },
        {
          domain: 'terra',
          entityType: FIXTURE_ENTITY_TYPE,
          name: `${RUN_TAG}-OUT_1`,
          provenanceSourceId: PROVENANCE_ID,
        },
        {
          domain: 'vessels',
          entityType: FIXTURE_ENTITY_TYPE,
          name: `${RUN_TAG}-OUT_2`,
          provenanceSourceId: PROVENANCE_ID,
        },
        {
          domain: 'aegis',
          entityType: FIXTURE_ENTITY_TYPE,
          name: `${RUN_TAG}-IN_1`,
          provenanceSourceId: PROVENANCE_ID,
        },
        {
          domain: 'terra',
          entityType: FIXTURE_ENTITY_TYPE,
          name: `${RUN_TAG}-IN_2`,
          provenanceSourceId: PROVENANCE_ID,
        },
        {
          domain: 'terra',
          entityType: FIXTURE_ENTITY_TYPE,
          name: `${RUN_TAG}-ISLAND`,
          provenanceSourceId: PROVENANCE_ID,
        },
      ])
      .returning({ id: cstNodes.id, name: cstNodes.name });

    const byName = new Map(insertedNodes.map((n) => [n.name, n.id] as const));
    seeded.hub = byName.get(`${RUN_TAG}-HUB`)!;
    seeded.out1 = byName.get(`${RUN_TAG}-OUT_1`)!;
    seeded.out2 = byName.get(`${RUN_TAG}-OUT_2`)!;
    seeded.in1 = byName.get(`${RUN_TAG}-IN_1`)!;
    seeded.in2 = byName.get(`${RUN_TAG}-IN_2`)!;
    seeded.island = byName.get(`${RUN_TAG}-ISLAND`)!;

    const insertedEdges = await db
      .insert(cstEdges)
      .values([
        {
          fromNodeId: seeded.hub,
          toNodeId: seeded.out1,
          relationshipType: `${RUN_TAG}_hub_to_out1`,
          sourceId: PROVENANCE_ID,
        },
        {
          fromNodeId: seeded.hub,
          toNodeId: seeded.out2,
          relationshipType: `${RUN_TAG}_hub_to_out2`,
          sourceId: PROVENANCE_ID,
        },
        {
          fromNodeId: seeded.in1,
          toNodeId: seeded.hub,
          relationshipType: `${RUN_TAG}_in1_to_hub`,
          sourceId: PROVENANCE_ID,
        },
        // Inactive edge — route must still surface it.
        {
          fromNodeId: seeded.in2,
          toNodeId: seeded.hub,
          relationshipType: `${RUN_TAG}_in2_to_hub`,
          sourceId: PROVENANCE_ID,
          active: false,
        },
      ])
      .returning({ id: cstEdges.id });

    seeded.edgeIds = insertedEdges.map((e) => e.id);
  });

  afterAll(async () => {
    const { db, cstNodes, cstEdges } = await import('@szl-holdings/db');
    const { inArray } = await import('drizzle-orm');
    if (seeded.edgeIds.length > 0) {
      await db.delete(cstEdges).where(inArray(cstEdges.id, seeded.edgeIds));
    }
    const allNodeIds = [
      seeded.hub,
      seeded.out1,
      seeded.out2,
      seeded.in1,
      seeded.in2,
      seeded.island,
    ].filter(Boolean);
    if (allNodeIds.length > 0) {
      await db.delete(cstNodes).where(inArray(cstNodes.id, allNodeIds));
    }
  });

  it('returns 200 with the subject node, all 4 neighbors, all 4 edges, and stats', async () => {
    const res = await request(app).get(`/graph/entities/${seeded.hub}/neighbors`);
    expect(res.status).toBe(200);

    const payload = res.body.data ?? res.body;
    expect(payload.node).toBeTruthy();
    expect(payload.node.id).toBe(seeded.hub);

    const neighborIds = (payload.neighbors as Array<{ id: string }>).map((n) => n.id).sort();
    expect(neighborIds).toEqual([seeded.out1, seeded.out2, seeded.in1, seeded.in2].sort());

    // Subject must NEVER appear in its own neighbor list.
    expect(neighborIds.includes(seeded.hub)).toBe(false);

    const edgeIds = (payload.edges as Array<{ id: string }>).map((e) => e.id).sort();
    expect(edgeIds).toEqual([...seeded.edgeIds].sort());

    expect(payload.stats).toMatchObject({ neighborCount: 4, edgeCount: 4 });
  });

  it('includes both inbound and outbound edges relative to the subject', async () => {
    const res = await request(app).get(`/graph/entities/${seeded.hub}/neighbors`);
    expect(res.status).toBe(200);

    const payload = res.body.data ?? res.body;
    const edges = payload.edges as Array<{ fromNodeId: string; toNodeId: string }>;

    const outbound = edges.filter((e) => e.fromNodeId === seeded.hub);
    const inbound = edges.filter((e) => e.toNodeId === seeded.hub);

    expect(outbound.length).toBe(2);
    expect(inbound.length).toBe(2);
  });

  it('includes inactive edges (route does not filter on edge.active)', async () => {
    const res = await request(app).get(`/graph/entities/${seeded.hub}/neighbors`);
    expect(res.status).toBe(200);

    const payload = res.body.data ?? res.body;
    const edges = payload.edges as Array<{ active: boolean }>;
    expect(edges.some((e) => e.active === false)).toBe(true);
  });

  it('returns each neighbor exactly once even when reachable through multiple edges', async () => {
    const res = await request(app).get(`/graph/entities/${seeded.hub}/neighbors`);
    expect(res.status).toBe(200);

    const payload = res.body.data ?? res.body;
    const neighborIds = (payload.neighbors as Array<{ id: string }>).map((n) => n.id);
    const unique = new Set(neighborIds);
    expect(unique.size).toBe(neighborIds.length);
  });

  it('returns hydrated neighbor entities with domain/entityType/name fields', async () => {
    const res = await request(app).get(`/graph/entities/${seeded.hub}/neighbors`);
    expect(res.status).toBe(200);

    const payload = res.body.data ?? res.body;
    const neighbors = payload.neighbors as Array<{
      id: string;
      domain: string;
      entityType: string;
      name: string;
    }>;

    const out2 = neighbors.find((n) => n.id === seeded.out2);
    expect(out2).toBeTruthy();
    expect(out2!.domain).toBe('vessels');
    expect(out2!.entityType).toBe(FIXTURE_ENTITY_TYPE);
    expect(out2!.name).toBe(`${RUN_TAG}-OUT_2`);

    const in1 = neighbors.find((n) => n.id === seeded.in1);
    expect(in1).toBeTruthy();
    expect(in1!.domain).toBe('aegis');
  });

  it('returns 200 with empty neighbors/edges for an isolated node (zero edges)', async () => {
    const res = await request(app).get(`/graph/entities/${seeded.island}/neighbors`);
    expect(res.status).toBe(200);

    const payload = res.body.data ?? res.body;
    expect(payload.node.id).toBe(seeded.island);
    expect(Array.isArray(payload.neighbors)).toBe(true);
    expect(payload.neighbors.length).toBe(0);
    expect(payload.edges.length).toBe(0);
    expect(payload.stats).toMatchObject({ neighborCount: 0, edgeCount: 0 });
  });

  it('respects limit query param by capping the number of returned edges', async () => {
    const res = await request(app)
      .get(`/graph/entities/${seeded.hub}/neighbors`)
      .query({ limit: 2 });
    expect(res.status).toBe(200);

    const payload = res.body.data ?? res.body;
    expect(payload.edges.length).toBe(2);
    // Neighbors derive from the (limited) edges, so they cannot exceed the cap.
    expect(payload.neighbors.length).toBeLessThanOrEqual(2);
  });

  it('returns 404 for a syntactically valid UUID that does not exist', async () => {
    const fakeUuid = '00000000-0000-0000-0000-000000000000';
    const res = await request(app).get(`/graph/entities/${fakeUuid}/neighbors`);
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 400 when limit is below the allowed range', async () => {
    const res = await request(app)
      .get(`/graph/entities/${seeded.hub}/neighbors`)
      .query({ limit: 0 });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 400 when limit is above the allowed range', async () => {
    const res = await request(app)
      .get(`/graph/entities/${seeded.hub}/neighbors`)
      .query({ limit: 9999 });
    expect(res.status).toBe(400);
  });

  it('returns 400 when limit is non-numeric', async () => {
    const res = await request(app)
      .get(`/graph/entities/${seeded.hub}/neighbors`)
      .query({ limit: 'not-a-number' });
    expect(res.status).toBe(400);
  });
});

afterAll(async () => {
  try {
    const { pool } = await import('@szl-holdings/db');
    await pool.end();
  } catch {
    // pool may already be closed by a sibling test file
  }
});
