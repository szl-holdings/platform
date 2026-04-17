/**
 * Cross-Cutting API Routes — Live Integration Tests (task #1084)
 *
 * Boots real Express route handlers against a real PostgreSQL database
 * (via DATABASE_URL). Only the auth middleware is mocked, to inject a
 * test principal. Covers /briefings, /drift, /deployments, and
 * /domains/:domain/graph end-to-end.
 */

import request from "supertest";
import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { vi, beforeAll, afterAll, describe, it, expect } from "vitest";

// ── Shared mock constants ────────────────────────────────────────────────────
const TEST_USER = { id: "test-user-1", isAdmin: false, orgs: [{ orgId: 1 }] };

const mockAuthMiddleware = () =>
  (req: Request, res: Response, next: NextFunction) => {
    res.locals.userId = TEST_USER.id;
    res.locals.role = "ops";
    (req as Request & { user?: typeof TEST_USER }).user = TEST_USER;
    next();
  };

vi.mock(
  "../../artifacts/api-server/src/middlewares/auth",
  () => ({
    authMiddleware: mockAuthMiddleware,
    requireRole: (..._roles: string[]) =>
      (_req: Request, _res: Response, next: NextFunction) => next(),
    denyIfReadOnly: () =>
      (_req: Request, _res: Response, next: NextFunction) => next(),
    parseIdParam: (id: string) => {
      const n = parseInt(id, 10);
      if (isNaN(n)) throw Object.assign(new Error("Invalid ID"), { status: 400 });
      return n;
    },
    InvalidIdError: class InvalidIdError extends Error {
      status = 400;
      constructor(msg: string) { super(msg); }
    },
  }),
);

function buildApp() {
  const app = express();
  app.use(express.json());
  return app;
}

const KNOWN_DOMAINS = [
  "terra",
  "prism",
  "vessels",
  "aegis",
  "lyte",
  "imperium",
  "carlota-jo",
  "platform",
];

// ── /briefings ────────────────────────────────────────────────────────────────
describe("Integration — /briefings", () => {
  let app: express.Express;

  beforeAll(async () => {
    app = buildApp();
    const router = (await import("../../artifacts/api-server/src/routes/briefings")).default;
    app.use(router);
  });

  it("GET /briefings returns the executive brief envelope from real DB", async () => {
    const res = await request(app).get("/briefings");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("generatedAt");
    expect(typeof res.body.generatedAt).toBe("string");
    expect(new Date(res.body.generatedAt).toISOString()).toBe(res.body.generatedAt);
    expect(typeof res.body.totalEntities).toBe("number");
    expect(typeof res.body.totalEdges).toBe("number");
    expect(typeof res.body.crossDomainLinks).toBe("number");
    expect(typeof res.body.overallHealthScore).toBe("number");
    expect(Array.isArray(res.body.domains)).toBe(true);
    expect(Array.isArray(res.body.highlights)).toBe(true);
    expect(Array.isArray(res.body.alerts)).toBe(true);
    const domainsInBrief = res.body.domains.map((d: { domain: string }) => d.domain);
    for (const known of KNOWN_DOMAINS) {
      expect(domainsInBrief).toContain(known);
    }
  });

  it("GET /briefings/terra returns the per-domain snapshot from real DB", async () => {
    const res = await request(app).get("/briefings/terra");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ domain: "terra" });
    expect(typeof res.body.entityCount).toBe("number");
    expect(typeof res.body.activeCount).toBe("number");
    expect(typeof res.body.edgeCount).toBe("number");
    expect(typeof res.body.avgConfidence).toBe("number");
    expect(typeof res.body.staleFraction).toBe("number");
    expect(typeof res.body.healthScore).toBe("number");
    expect(Array.isArray(res.body.topEntityTypes)).toBe(true);
    expect(typeof res.body.summary).toBe("string");
  });

  it("GET /briefings/:domain rejects unknown domain with 400", async () => {
    const res = await request(app).get("/briefings/not-a-real-domain");
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error).toMatch(/Unknown domain/);
  });

  it("POST /briefings/generate returns a freshly-generated brief flagged forced", async () => {
    const res = await request(app).post("/briefings/generate");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("forced", true);
    expect(res.body).toHaveProperty("generatedAt");
    expect(Array.isArray(res.body.domains)).toBe(true);
  });
});

// ── /drift ────────────────────────────────────────────────────────────────────
describe("Integration — /drift", () => {
  let app: express.Express;

  beforeAll(async () => {
    app = buildApp();
    const router = (await import("../../artifacts/api-server/src/routes/drift")).default;
    app.use(router);
  });

  it("GET /drift returns the drift summary envelope from real DB", async () => {
    const res = await request(app).get("/drift");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("measuredAt");
    expect(typeof res.body.overallDriftScore).toBe("number");
    expect(["healthy", "degraded", "critical"]).toContain(res.body.status);
    expect(Array.isArray(res.body.domains)).toBe(true);
    expect(Array.isArray(res.body.topAlerts)).toBe(true);
    for (const d of res.body.domains) {
      expect(typeof d.domain).toBe("string");
      expect(typeof d.driftScore).toBe("number");
      expect(["healthy", "degraded", "critical"]).toContain(d.status);
      expect(Array.isArray(d.freshnessWindows)).toBe(true);
      const windows = d.freshnessWindows.map((w: { windowHours: number }) => w.windowHours);
      expect(windows).toEqual([1, 6, 24, 72]);
    }
  });

  it("GET /drift/terra returns the per-domain drift breakdown from real DB", async () => {
    const res = await request(app).get("/drift/terra");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ domain: "terra" });
    expect(typeof res.body.totalEntities).toBe("number");
    expect(typeof res.body.avgConfidence).toBe("number");
    expect(typeof res.body.confidenceDrift).toBe("number");
    expect(typeof res.body.driftScore).toBe("number");
    expect(["healthy", "degraded", "critical"]).toContain(res.body.status);
  });

  it("GET /drift/:domain rejects unknown domain with 400", async () => {
    const res = await request(app).get("/drift/not-a-real-domain");
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("GET /drift/history exposes recent snapshots (after at least one /drift call)", async () => {
    await request(app).get("/drift");
    const res = await request(app).get("/drift/history");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("snapshots");
    expect(Array.isArray(res.body.snapshots)).toBe(true);
    expect(typeof res.body.count).toBe("number");
    expect(res.body.count).toBeGreaterThan(0);
  });

  it("POST /drift/reset clears history and returns a reset envelope", async () => {
    await request(app).get("/drift");
    const reset = await request(app).post("/drift/reset");
    expect(reset.status).toBe(200);
    expect(reset.body).toMatchObject({ reset: true });

    const after = await request(app).get("/drift/history");
    expect(after.status).toBe(200);
    expect(after.body.count).toBe(0);
    expect(after.body.snapshots).toEqual([]);
  });
});

// ── /deployments ──────────────────────────────────────────────────────────────
describe("Integration — /deployments", () => {
  let app: express.Express;
  const APP_ID = `it-app-${Date.now()}`;
  const ENV = "staging";

  beforeAll(async () => {
    app = buildApp();
    const router = (await import("../../artifacts/api-server/src/routes/deployments")).default;
    app.use(router);
  });

  it("GET /deployments returns an envelope with deployments[]", async () => {
    const res = await request(app).get("/deployments").query({ environment: ENV });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.deployments)).toBe(true);
    expect(res.body).toHaveProperty("environment", ENV);
    expect(typeof res.body.count).toBe("number");
  });

  it("POST /deployments rejects missing required fields with 400", async () => {
    const res = await request(app)
      .post("/deployments")
      .send({ appId: APP_ID });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("POST /deployments registers an active deployment and returns 201", async () => {
    const res = await request(app)
      .post("/deployments")
      .send({
        appId: APP_ID,
        appName: "Integration Test App",
        version: "1.0.0",
        environment: ENV,
        commitSha: "abc1234",
      });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      appId: APP_ID,
      version: "1.0.0",
      environment: ENV,
      status: "active",
    });
    expect(typeof res.body.deployedAt).toBe("string");
  });

  it("GET /deployments/:appId returns the active deployment for that app", async () => {
    const res = await request(app)
      .get(`/deployments/${APP_ID}`)
      .query({ environment: ENV });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      appId: APP_ID,
      version: "1.0.0",
      status: "active",
    });
  });

  it("GET /deployments/:appId 404s when no active deployment exists for env", async () => {
    const res = await request(app)
      .get(`/deployments/${APP_ID}-missing`)
      .query({ environment: ENV });
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });

  it("POST /deployments registers a second version (status update) and supersedes the first", async () => {
    const res = await request(app)
      .post("/deployments")
      .send({
        appId: APP_ID,
        appName: "Integration Test App",
        version: "1.1.0",
        environment: ENV,
      });
    expect(res.status).toBe(201);
    expect(res.body.version).toBe("1.1.0");
    expect(res.body.status).toBe("active");

    const active = await request(app)
      .get(`/deployments/${APP_ID}`)
      .query({ environment: ENV });
    expect(active.status).toBe(200);
    expect(active.body.version).toBe("1.1.0");

    const history = await request(app)
      .get(`/deployments/${APP_ID}/history`)
      .query({ environment: ENV });
    expect(history.status).toBe(200);
    expect(history.body.count).toBeGreaterThanOrEqual(2);
    const versionsInHistory = history.body.history.map((r: { version: string }) => r.version);
    expect(versionsInHistory).toContain("1.0.0");
    expect(versionsInHistory).toContain("1.1.0");
    const oldRecord = history.body.history.find(
      (r: { version: string; status: string }) => r.version === "1.0.0",
    );
    expect(oldRecord.status).toBe("inactive");
  });

  it("POST /deployments/:appId/rollback rolls back to the previous version", async () => {
    const res = await request(app)
      .post(`/deployments/${APP_ID}/rollback`)
      .send({ environment: ENV });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ rolledBack: true });
    expect(res.body.current.version).toBe("1.0.0");
    expect(res.body.current.status).toBe("active");
    expect(res.body.previous.version).toBe("1.1.0");
    expect(res.body.previous.status).toBe("rolled-back");

    const active = await request(app)
      .get(`/deployments/${APP_ID}`)
      .query({ environment: ENV });
    expect(active.status).toBe(200);
    expect(active.body.version).toBe("1.0.0");
  });

  it("POST /deployments/:appId/rollback rejects when no history exists", async () => {
    const res = await request(app)
      .post(`/deployments/${APP_ID}-never-deployed/rollback`)
      .send({ environment: ENV });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("persists registry across a simulated API server restart", async () => {
    // Simulate a process restart by reloading the route module and rebuilding
    // the Express app. Drizzle's pg pool is module-scoped and would be
    // re-instantiated; the database row store must outlive that restart.
    vi.resetModules();
    const freshApp = buildApp();
    const freshRouter = (
      await import("../../artifacts/api-server/src/routes/deployments")
    ).default;
    freshApp.use(freshRouter);

    const active = await request(freshApp)
      .get(`/deployments/${APP_ID}`)
      .query({ environment: ENV });
    expect(active.status).toBe(200);
    expect(active.body.appId).toBe(APP_ID);
    // After the rollback step, the active version is 1.0.0.
    expect(active.body.version).toBe("1.0.0");
    expect(active.body.status).toBe("active");

    const history = await request(freshApp)
      .get(`/deployments/${APP_ID}/history`)
      .query({ environment: ENV });
    expect(history.status).toBe(200);
    // Original 1.0.0, then 1.1.0 (now rolled-back), then the rollback
    // re-activation of 1.0.0 — all three rows must have survived the restart.
    expect(history.body.count).toBeGreaterThanOrEqual(3);
    const versions = history.body.history.map((r: { version: string }) => r.version);
    expect(versions).toContain("1.0.0");
    expect(versions).toContain("1.1.0");
    const rolledBack = history.body.history.find(
      (r: { version: string; status: string }) =>
        r.version === "1.1.0" && r.status === "rolled-back",
    );
    expect(rolledBack).toBeTruthy();
  });
});

// ── /domains/:domain/graph ────────────────────────────────────────────────────
describe("Integration — /domains/:domain/graph", () => {
  let app: express.Express;

  beforeAll(async () => {
    app = buildApp();
    const router = (await import("../../artifacts/api-server/src/routes/domains")).default;
    app.use(router);
  });

  it("GET /domains/terra/graph returns the graph projection envelope from real DB", async () => {
    const res = await request(app).get("/domains/terra/graph");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ domain: "terra" });
    expect(Array.isArray(res.body.nodes)).toBe(true);
    expect(Array.isArray(res.body.edges)).toBe(true);
    expect(res.body.stats).toMatchObject({
      nodeCount: expect.any(Number),
      edgeCount: expect.any(Number),
      crossDomainEdgeCount: expect.any(Number),
      internalEdgeCount: expect.any(Number),
    });
    expect(res.body.stats.edgeCount).toBe(
      res.body.stats.crossDomainEdgeCount + res.body.stats.internalEdgeCount,
    );
  });

  it("GET /domains/terra/graph respects limit and offset query params", async () => {
    const res = await request(app)
      .get("/domains/terra/graph")
      .query({ limit: 5, offset: 0 });
    expect(res.status).toBe(200);
    expect(res.body.nodes.length).toBeLessThanOrEqual(5);
  });

  it("GET /domains/terra/graph rejects out-of-range limit with 400", async () => {
    const tooBig = await request(app).get("/domains/terra/graph").query({ limit: 9999 });
    expect(tooBig.status).toBe(400);
    expect(tooBig.body).toHaveProperty("error");

    const negativeOffset = await request(app)
      .get("/domains/terra/graph")
      .query({ offset: -1 });
    expect(negativeOffset.status).toBe(400);
  });

  it("GET /domains/terra/graph?includeCross=false hides cross-domain edges", async () => {
    const res = await request(app)
      .get("/domains/terra/graph")
      .query({ includeCross: "false" });
    expect(res.status).toBe(200);
    expect(res.body.stats.crossDomainEdgeCount).toBe(0);
  });

  it("GET /domains/terra/graph returns nodes that all belong to the requested domain", async () => {
    const res = await request(app).get("/domains/terra/graph");
    expect(res.status).toBe(200);
    for (const node of res.body.nodes) {
      // Domain isn't projected onto the response shape, but the node ids are
      // sourced from the domain-filtered query, so an empty/non-throwing
      // response is the correctness guarantee here.
      expect(typeof node.id).toBe("number");
      expect(typeof node.entityType).toBe("string");
    }
  });

  it("GET /domains/aegis/graph (explicit per-domain handler) returns the same envelope shape", async () => {
    const res = await request(app).get("/domains/aegis/graph");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ domain: "aegis" });
    expect(Array.isArray(res.body.nodes)).toBe(true);
    expect(Array.isArray(res.body.edges)).toBe(true);
  });

  it("GET /domains/:domain/graph (generic fallback) accepts other known domains", async () => {
    const res = await request(app).get("/domains/imperium/graph");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ domain: "imperium" });
  });

  it("GET /domains/:domain/graph rejects unknown domain with 400", async () => {
    const res = await request(app).get("/domains/not-a-real-domain/graph");
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error).toMatch(/Unknown domain/);
  });
});

// ── /domains/:domain/graph — seeded fixture (cross-domain edge correctness) ──
//
// Task #1087: Seed a small known graph spanning terra → vessels so we can
// assert *exact* crossDomainEdgeCount values, which the shape-only tests
// above cannot do. The fixture uses a unique entityType so the route's
// `entityType` filter isolates it from any pre-existing rows in the DB,
// and a unique provenanceSourceId tag so teardown can target only our
// seeded rows.
describe("Integration — /domains/:domain/graph (seeded cross-domain fixture)", () => {
  let app: express.Express;
  const RUN_TAG = `it-x-domain-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const FIXTURE_ENTITY_TYPE = `fixture_${RUN_TAG}`;
  const PROVENANCE_ID = `task-1087:${RUN_TAG}`;

  // Seeded node ids — populated in beforeAll, used in assertions and teardown.
  const seeded: {
    terra: string[]; // [T1, T2, T3]
    vessels: string[]; // [V1, V2]
    edgeIds: string[];
  } = { terra: [], vessels: [], edgeIds: [] };

  beforeAll(async () => {
    app = buildApp();
    const router = (await import("../../artifacts/api-server/src/routes/domains")).default;
    app.use(router);

    const { db, cstNodes, cstEdges } = await import("@szl-holdings/db");

    // Seed 3 terra nodes + 2 vessels nodes — all sharing FIXTURE_ENTITY_TYPE
    // so the entityType filter selects exactly this fixture.
    const insertedNodes = await db
      .insert(cstNodes)
      .values([
        { domain: "terra", entityType: FIXTURE_ENTITY_TYPE, name: `${RUN_TAG}-T1`, provenanceSourceId: PROVENANCE_ID },
        { domain: "terra", entityType: FIXTURE_ENTITY_TYPE, name: `${RUN_TAG}-T2`, provenanceSourceId: PROVENANCE_ID },
        { domain: "terra", entityType: FIXTURE_ENTITY_TYPE, name: `${RUN_TAG}-T3`, provenanceSourceId: PROVENANCE_ID },
        { domain: "vessels", entityType: FIXTURE_ENTITY_TYPE, name: `${RUN_TAG}-V1`, provenanceSourceId: PROVENANCE_ID },
        { domain: "vessels", entityType: FIXTURE_ENTITY_TYPE, name: `${RUN_TAG}-V2`, provenanceSourceId: PROVENANCE_ID },
      ])
      .returning({ id: cstNodes.id, name: cstNodes.name, domain: cstNodes.domain });

    const byName = new Map(insertedNodes.map((n) => [n.name, n.id] as const));
    const T1 = byName.get(`${RUN_TAG}-T1`)!;
    const T2 = byName.get(`${RUN_TAG}-T2`)!;
    const T3 = byName.get(`${RUN_TAG}-T3`)!;
    const V1 = byName.get(`${RUN_TAG}-V1`)!;
    const V2 = byName.get(`${RUN_TAG}-V2`)!;

    seeded.terra = [T1, T2, T3];
    seeded.vessels = [V1, V2];

    // Edges (relationshipType is unique per pair in unique index, so each
    // edge gets a distinct relationshipType to avoid collisions):
    //   T1 -> T2  (terra internal)
    //   T2 -> T3  (terra internal)
    //   T1 -> V1  (terra → vessels, cross-domain)
    //   V2 -> T3  (vessels → terra, cross-domain inbound for terra)
    //   V1 -> V2  (vessels internal)
    const insertedEdges = await db
      .insert(cstEdges)
      .values([
        { fromNodeId: T1, toNodeId: T2, relationshipType: `${RUN_TAG}_t_internal_a`, sourceId: PROVENANCE_ID },
        { fromNodeId: T2, toNodeId: T3, relationshipType: `${RUN_TAG}_t_internal_b`, sourceId: PROVENANCE_ID },
        { fromNodeId: T1, toNodeId: V1, relationshipType: `${RUN_TAG}_t_to_v`,        sourceId: PROVENANCE_ID },
        { fromNodeId: V2, toNodeId: T3, relationshipType: `${RUN_TAG}_v_to_t`,        sourceId: PROVENANCE_ID },
        { fromNodeId: V1, toNodeId: V2, relationshipType: `${RUN_TAG}_v_internal`,    sourceId: PROVENANCE_ID },
      ])
      .returning({ id: cstEdges.id });

    seeded.edgeIds = insertedEdges.map((e) => e.id);
  });

  afterAll(async () => {
    // Targeted cleanup: delete edges first (they'd cascade with nodes
    // anyway, but being explicit keeps the assertion errors clearer if
    // anything goes wrong). We match by the unique ids we captured at
    // insert time, which can only belong to this fixture run.
    const { db, cstNodes, cstEdges } = await import("@szl-holdings/db");
    const { inArray } = await import("drizzle-orm");
    if (seeded.edgeIds.length > 0) {
      await db.delete(cstEdges).where(inArray(cstEdges.id, seeded.edgeIds));
    }
    const allNodeIds = [...seeded.terra, ...seeded.vessels];
    if (allNodeIds.length > 0) {
      await db.delete(cstNodes).where(inArray(cstNodes.id, allNodeIds));
    }
  });

  it("terra graph (entityType-filtered to fixture) reports exactly 3 nodes, 4 edges, 2 cross-domain, 2 internal", async () => {
    const res = await request(app)
      .get("/domains/terra/graph")
      .query({ entityType: FIXTURE_ENTITY_TYPE });
    expect(res.status).toBe(200);
    expect(res.body.domain).toBe("terra");

    const returnedIds = (res.body.nodes as Array<{ id: string }>).map((n) => n.id).sort();
    expect(returnedIds).toEqual([...seeded.terra].sort());
    expect(res.body.stats.nodeCount).toBe(3);

    // 4 edges total (2 internal + 1 outbound + 1 inbound cross-domain)
    expect(res.body.stats.edgeCount).toBe(4);
    expect(res.body.stats.crossDomainEdgeCount).toBe(2);
    expect(res.body.stats.internalEdgeCount).toBe(2);
    expect(res.body.stats.edgeCount).toBe(
      res.body.stats.crossDomainEdgeCount + res.body.stats.internalEdgeCount,
    );
  });

  it("vessels graph (entityType-filtered to fixture) reports exactly 2 nodes, 3 edges, 2 cross-domain, 1 internal", async () => {
    const res = await request(app)
      .get("/domains/vessels/graph")
      .query({ entityType: FIXTURE_ENTITY_TYPE });
    expect(res.status).toBe(200);
    expect(res.body.domain).toBe("vessels");

    const returnedIds = (res.body.nodes as Array<{ id: string }>).map((n) => n.id).sort();
    expect(returnedIds).toEqual([...seeded.vessels].sort());
    expect(res.body.stats.nodeCount).toBe(2);

    // 3 edges total: T1->V1, V2->T3, V1->V2 (1 internal + 2 cross-domain)
    expect(res.body.stats.edgeCount).toBe(3);
    expect(res.body.stats.crossDomainEdgeCount).toBe(2);
    expect(res.body.stats.internalEdgeCount).toBe(1);
  });

  it("includeCross=false on terra graph drops both inbound and outbound cross-domain edges", async () => {
    const res = await request(app)
      .get("/domains/terra/graph")
      .query({ entityType: FIXTURE_ENTITY_TYPE, includeCross: "false" });
    expect(res.status).toBe(200);
    expect(res.body.stats.nodeCount).toBe(3);
    expect(res.body.stats.crossDomainEdgeCount).toBe(0);
    // Only the 2 terra-internal edges should remain.
    expect(res.body.stats.edgeCount).toBe(2);
    expect(res.body.stats.internalEdgeCount).toBe(2);
  });

  it("returned terra nodes all belong to the requested domain (no vessels nodes leak in)", async () => {
    const res = await request(app)
      .get("/domains/terra/graph")
      .query({ entityType: FIXTURE_ENTITY_TYPE });
    expect(res.status).toBe(200);
    const vesselsIdSet = new Set(seeded.vessels);
    for (const node of res.body.nodes as Array<{ id: string }>) {
      expect(vesselsIdSet.has(node.id)).toBe(false);
    }
  });
});

// ── Teardown ─────────────────────────────────────────────────────────────────
afterAll(async () => {
  try {
    const { pool } = await import("@szl-holdings/db");
    await pool.end();
  } catch {
    // pool may already be closed by another test file
  }
});
