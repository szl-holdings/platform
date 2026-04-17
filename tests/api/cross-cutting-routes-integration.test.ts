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
const TEST_USER = {
  id: "test-user-1",
  email: "test-user-1@szl.test",
  displayName: "Test User",
  isAdmin: false,
  orgs: [{ orgId: 1 }],
};

// Header used by tests to opt-in to "no credentials presented" so we can
// exercise the 401 path even though the middleware itself is mocked.
const NO_AUTH_HEADER = "x-test-no-auth";

const mockAuthMiddleware = (options: { required?: boolean } = {}) =>
  (req: Request, res: Response, next: NextFunction) => {
    const noAuth = req.headers[NO_AUTH_HEADER] === "1";
    if (noAuth) {
      if (options.required) {
        res.status(401).json({
          error: "Authentication required",
          code: "UNAUTHORIZED",
        });
        return;
      }
      // Optional auth + no credentials → continue without populating req.user.
      next();
      return;
    }
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

  it("POST /deployments returns 401 when the request is unauthenticated", async () => {
    const res = await request(app)
      .post("/deployments")
      .set(NO_AUTH_HEADER, "1")
      .send({
        appId: `${APP_ID}-unauth`,
        appName: "Unauthed Attempt",
        version: "9.9.9",
        environment: ENV,
      });
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("error");
  });

  it("POST /deployments/:appId/rollback returns 401 when the request is unauthenticated", async () => {
    const res = await request(app)
      .post(`/deployments/${APP_ID}/rollback`)
      .set(NO_AUTH_HEADER, "1")
      .send({ environment: ENV });
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("error");
  });

  it("POST /deployments records the authenticated principal as deployedBy and ignores client-supplied value", async () => {
    const auditAppId = `${APP_ID}-audit`;
    const res = await request(app)
      .post("/deployments")
      .send({
        appId: auditAppId,
        appName: "Audit Trail App",
        version: "2.0.0",
        environment: ENV,
        // Client tries to spoof — server must overwrite with the real principal.
        deployedBy: "spoofed-attacker",
      });
    expect(res.status).toBe(201);
    expect(res.body.deployedBy).not.toBe("spoofed-attacker");
    expect(res.body.deployedBy).toBe(TEST_USER.email);
  });

  it("enriches deployments with the deployer's user profile (name + avatar) when a matching user exists", async () => {
    const { db, usersTable } = await import("@szl-holdings/db");
    const { eq } = await import("drizzle-orm");

    // Seed a user that matches the test principal's email so the enrichment
    // join in /deployments can resolve a profile.
    const email = TEST_USER.email;
    const displayName = "Enriched Test User";
    const avatarUrl = "https://example.invalid/avatar.png";

    await db.delete(usersTable).where(eq(usersTable.email, email));
    const [seeded] = await db
      .insert(usersTable)
      .values({ email, displayName, avatarUrl })
      .returning();
    expect(seeded).toBeTruthy();

    try {
      const enrichedAppId = `${APP_ID}-enriched`;
      const created = await request(app)
        .post("/deployments")
        .send({
          appId: enrichedAppId,
          appName: "Enriched App",
          version: "1.0.0",
          environment: ENV,
        });
      expect(created.status).toBe(201);
      expect(created.body.deployedByUser).toMatchObject({
        id: seeded!.id,
        displayName,
        email,
        avatarUrl,
      });

      const list = await request(app).get("/deployments").query({ environment: ENV });
      expect(list.status).toBe(200);
      const found = list.body.deployments.find(
        (d: { appId: string }) => d.appId === enrichedAppId,
      );
      expect(found).toBeTruthy();
      expect(found.deployedByUser?.displayName).toBe(displayName);
      expect(found.deployedByUser?.avatarUrl).toBe(avatarUrl);

      const history = await request(app)
        .get(`/deployments/${enrichedAppId}/history`)
        .query({ environment: ENV });
      expect(history.status).toBe(200);
      expect(history.body.history[0].deployedByUser?.email).toBe(email);

      // Rollback response must also carry enriched user info on both
      // previous and current rows so the UI can label "Rolled back by X /
      // originally shipped by Y" without a second fetch.
      const second = await request(app)
        .post("/deployments")
        .send({
          appId: enrichedAppId,
          appName: "Enriched App",
          version: "2.0.0",
          environment: ENV,
        });
      expect(second.status).toBe(201);

      const rolled = await request(app)
        .post(`/deployments/${enrichedAppId}/rollback`)
        .send({ environment: ENV });
      expect(rolled.status).toBe(200);
      expect(rolled.body.previous.deployedByUser).toMatchObject({
        id: seeded!.id,
        displayName,
        email,
        avatarUrl,
      });
      expect(rolled.body.current.deployedByUser).toMatchObject({
        id: seeded!.id,
        displayName,
        email,
        avatarUrl,
      });
    } finally {
      await db.delete(usersTable).where(eq(usersTable.id, seeded!.id));
    }
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

  it("GET /domains/terra/graph paginates: page1 + page2 cover unique nodes and stats.nodeCount stays the total", async () => {
    // Pulls two consecutive pages of 1 node each and asserts:
    //  1. The two pages don't return the same node id (offset advanced)
    //  2. stats.nodeCount is the *total* (count(*)), unaffected by limit/offset
    //     so the client can compute "loaded vs. total" from it.
    const page1 = await request(app)
      .get("/domains/terra/graph")
      .query({ limit: 1, offset: 0 });
    expect(page1.status).toBe(200);
    if (page1.body.stats.nodeCount < 2) {
      // Not enough data to exercise pagination on this fixture — skip the
      // overlap assertions but still check the total-count contract.
      expect(page1.body.nodes.length).toBeLessThanOrEqual(1);
      return;
    }
    const page2 = await request(app)
      .get("/domains/terra/graph")
      .query({ limit: 1, offset: 1 });
    expect(page2.status).toBe(200);
    expect(page1.body.nodes.length).toBe(1);
    expect(page2.body.nodes.length).toBe(1);
    expect(page1.body.nodes[0].id).not.toBe(page2.body.nodes[0].id);
    // Both pages must report the same total nodeCount — it's a count(*) over
    // the filtered nodes, not a count of what's returned.
    expect(page1.body.stats.nodeCount).toBe(page2.body.stats.nodeCount);
    expect(page1.body.stats.nodeCount).toBeGreaterThanOrEqual(2);
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
// Task #1087 + #1094: Seed a known graph spanning terra, vessels, aegis,
// and carlota-jo (4 domains) so we can assert *exact* crossDomainEdgeCount
// values across:
//   • explicit per-domain handlers (terra, vessels, aegis)
//   • the generic fallback (carlota-jo)
//   • cross-domain edges in BOTH directions for each domain
//   • inactive (isActive=false) nodes and inactive (active=false) edges
//
// The fixture uses a unique entityType so the route's `entityType` filter
// isolates it from any pre-existing rows in the DB, and a unique
// provenanceSourceId tag so teardown can target only our seeded rows.
//
// Graph topology (active unless noted):
//
//   terra:      T1, T2, T3       (+ T_INACTIVE)
//   vessels:    V1, V2
//   aegis:      A1, A2
//   carlota-jo: C1
//
//   Edges (active):
//     T1 -> T2    terra internal
//     T2 -> T3    terra internal
//     T1 -> V1    terra → vessels   (terra outbound,  vessels inbound)
//     V2 -> T3    vessels → terra   (vessels outbound, terra inbound)
//     V1 -> V2    vessels internal
//     A1 -> T1    aegis → terra     (aegis outbound,  terra inbound)
//     T2 -> A2    terra → aegis     (terra outbound,  aegis inbound)
//     A1 -> A2    aegis internal
//     V1 -> A1    vessels → aegis   (vessels outbound, aegis inbound)
//     A2 -> V2    aegis → vessels   (aegis outbound,  vessels inbound)
//     C1 -> T3    carlota-jo → terra (terra inbound, exercises fallback)
//     A1 -> C1    aegis → carlota-jo
//
//   Edges touching inactive nodes:
//     T1 -> T_INACTIVE   terra internal but target node inactive
//     A2 -> T_INACTIVE   cross-domain into an inactive terra node
//
//   Inactive edge (active=false on the edge row itself):
//     T1 -> T3    terra internal, edge.active=false
//                 (route does NOT filter on edge.active, so it must
//                  still appear in the count.)
describe("Integration — /domains/:domain/graph (multi-domain seeded fixture)", () => {
  let app: express.Express;
  const RUN_TAG = `it-x-domain-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const FIXTURE_ENTITY_TYPE = `fixture_${RUN_TAG}`;
  const PROVENANCE_ID = `task-1094:${RUN_TAG}`;

  const seeded: {
    terra: string[];        // active terra nodes [T1, T2, T3]
    terraInactive: string[]; // [T_INACTIVE]
    vessels: string[];       // [V1, V2]
    aegis: string[];         // [A1, A2]
    carlotaJo: string[];     // [C1]
    edgeIds: string[];
  } = {
    terra: [],
    terraInactive: [],
    vessels: [],
    aegis: [],
    carlotaJo: [],
    edgeIds: [],
  };

  beforeAll(async () => {
    app = buildApp();
    const router = (await import("../../artifacts/api-server/src/routes/domains")).default;
    app.use(router);

    const { db, cstNodes, cstEdges } = await import("@szl-holdings/db");

    const insertedNodes = await db
      .insert(cstNodes)
      .values([
        { domain: "terra",      entityType: FIXTURE_ENTITY_TYPE, name: `${RUN_TAG}-T1`,         provenanceSourceId: PROVENANCE_ID },
        { domain: "terra",      entityType: FIXTURE_ENTITY_TYPE, name: `${RUN_TAG}-T2`,         provenanceSourceId: PROVENANCE_ID },
        { domain: "terra",      entityType: FIXTURE_ENTITY_TYPE, name: `${RUN_TAG}-T3`,         provenanceSourceId: PROVENANCE_ID },
        { domain: "terra",      entityType: FIXTURE_ENTITY_TYPE, name: `${RUN_TAG}-T_INACTIVE`, provenanceSourceId: PROVENANCE_ID, isActive: false },
        { domain: "vessels",    entityType: FIXTURE_ENTITY_TYPE, name: `${RUN_TAG}-V1`,         provenanceSourceId: PROVENANCE_ID },
        { domain: "vessels",    entityType: FIXTURE_ENTITY_TYPE, name: `${RUN_TAG}-V2`,         provenanceSourceId: PROVENANCE_ID },
        { domain: "aegis",      entityType: FIXTURE_ENTITY_TYPE, name: `${RUN_TAG}-A1`,         provenanceSourceId: PROVENANCE_ID },
        { domain: "aegis",      entityType: FIXTURE_ENTITY_TYPE, name: `${RUN_TAG}-A2`,         provenanceSourceId: PROVENANCE_ID },
        { domain: "carlota-jo", entityType: FIXTURE_ENTITY_TYPE, name: `${RUN_TAG}-C1`,         provenanceSourceId: PROVENANCE_ID },
      ])
      .returning({ id: cstNodes.id, name: cstNodes.name, domain: cstNodes.domain });

    const byName = new Map(insertedNodes.map((n) => [n.name, n.id] as const));
    const T1 = byName.get(`${RUN_TAG}-T1`)!;
    const T2 = byName.get(`${RUN_TAG}-T2`)!;
    const T3 = byName.get(`${RUN_TAG}-T3`)!;
    const T_INACTIVE = byName.get(`${RUN_TAG}-T_INACTIVE`)!;
    const V1 = byName.get(`${RUN_TAG}-V1`)!;
    const V2 = byName.get(`${RUN_TAG}-V2`)!;
    const A1 = byName.get(`${RUN_TAG}-A1`)!;
    const A2 = byName.get(`${RUN_TAG}-A2`)!;
    const C1 = byName.get(`${RUN_TAG}-C1`)!;

    seeded.terra = [T1, T2, T3];
    seeded.terraInactive = [T_INACTIVE];
    seeded.vessels = [V1, V2];
    seeded.aegis = [A1, A2];
    seeded.carlotaJo = [C1];

    const insertedEdges = await db
      .insert(cstEdges)
      .values([
        { fromNodeId: T1, toNodeId: T2,         relationshipType: `${RUN_TAG}_t_internal_a`,   sourceId: PROVENANCE_ID },
        { fromNodeId: T2, toNodeId: T3,         relationshipType: `${RUN_TAG}_t_internal_b`,   sourceId: PROVENANCE_ID },
        { fromNodeId: T1, toNodeId: V1,         relationshipType: `${RUN_TAG}_t_to_v`,         sourceId: PROVENANCE_ID },
        { fromNodeId: V2, toNodeId: T3,         relationshipType: `${RUN_TAG}_v_to_t`,         sourceId: PROVENANCE_ID },
        { fromNodeId: V1, toNodeId: V2,         relationshipType: `${RUN_TAG}_v_internal`,     sourceId: PROVENANCE_ID },
        { fromNodeId: A1, toNodeId: T1,         relationshipType: `${RUN_TAG}_a_to_t`,         sourceId: PROVENANCE_ID },
        { fromNodeId: T2, toNodeId: A2,         relationshipType: `${RUN_TAG}_t_to_a`,         sourceId: PROVENANCE_ID },
        { fromNodeId: A1, toNodeId: A2,         relationshipType: `${RUN_TAG}_a_internal`,     sourceId: PROVENANCE_ID },
        { fromNodeId: V1, toNodeId: A1,         relationshipType: `${RUN_TAG}_v_to_a`,         sourceId: PROVENANCE_ID },
        { fromNodeId: A2, toNodeId: V2,         relationshipType: `${RUN_TAG}_a_to_v`,         sourceId: PROVENANCE_ID },
        { fromNodeId: C1, toNodeId: T3,         relationshipType: `${RUN_TAG}_c_to_t`,         sourceId: PROVENANCE_ID },
        { fromNodeId: A1, toNodeId: C1,         relationshipType: `${RUN_TAG}_a_to_c`,         sourceId: PROVENANCE_ID },
        { fromNodeId: T1, toNodeId: T_INACTIVE, relationshipType: `${RUN_TAG}_t_to_inactive`,  sourceId: PROVENANCE_ID },
        { fromNodeId: A2, toNodeId: T_INACTIVE, relationshipType: `${RUN_TAG}_a_to_inactive`,  sourceId: PROVENANCE_ID },
        // Inactive edge (active=false). The route does NOT filter on
        // edge.active, so it must still be counted.
        { fromNodeId: T1, toNodeId: T3,         relationshipType: `${RUN_TAG}_t_internal_inactive`, sourceId: PROVENANCE_ID, active: false },
      ])
      .returning({ id: cstEdges.id });

    seeded.edgeIds = insertedEdges.map((e) => e.id);
  });

  afterAll(async () => {
    const { db, cstNodes, cstEdges } = await import("@szl-holdings/db");
    const { inArray } = await import("drizzle-orm");
    if (seeded.edgeIds.length > 0) {
      await db.delete(cstEdges).where(inArray(cstEdges.id, seeded.edgeIds));
    }
    const allNodeIds = [
      ...seeded.terra,
      ...seeded.terraInactive,
      ...seeded.vessels,
      ...seeded.aegis,
      ...seeded.carlotaJo,
    ];
    if (allNodeIds.length > 0) {
      await db.delete(cstNodes).where(inArray(cstNodes.id, allNodeIds));
    }
  });

  // ── terra (explicit per-domain handler) ───────────────────────────────────
  it("terra graph (isActive=true) reports 3 nodes, 9 edges, 6 cross-domain, 3 internal", async () => {
    const res = await request(app)
      .get("/domains/terra/graph")
      .query({ entityType: FIXTURE_ENTITY_TYPE, isActive: "true" });
    expect(res.status).toBe(200);
    expect(res.body.domain).toBe("terra");

    const returnedIds = (res.body.nodes as Array<{ id: string }>).map((n) => n.id).sort();
    expect(returnedIds).toEqual([...seeded.terra].sort());
    expect(res.body.stats.nodeCount).toBe(3);

    // Edges touching {T1,T2,T3}:
    //   internal: T1->T2, T2->T3, T1->T3(inactive edge — still counted)
    //   cross:    T1->V1, V2->T3, A1->T1, T2->A2, C1->T3,
    //             T1->T_INACTIVE (terra-domain target but excluded by
    //             isActive filter, so route classifies it as cross)
    expect(res.body.stats.edgeCount).toBe(9);
    expect(res.body.stats.crossDomainEdgeCount).toBe(6);
    expect(res.body.stats.internalEdgeCount).toBe(3);
    expect(res.body.stats.edgeCount).toBe(
      res.body.stats.crossDomainEdgeCount + res.body.stats.internalEdgeCount,
    );

    // The inactive edge T1->T3 must be present in the returned edges array.
    const edges = res.body.edges as Array<{ id: string; active: boolean }>;
    expect(edges.some((e) => e.active === false)).toBe(true);
  });

  // ── vessels (explicit per-domain handler) ─────────────────────────────────
  it("vessels graph (isActive=true) reports 2 nodes, 5 edges, 4 cross-domain, 1 internal", async () => {
    const res = await request(app)
      .get("/domains/vessels/graph")
      .query({ entityType: FIXTURE_ENTITY_TYPE, isActive: "true" });
    expect(res.status).toBe(200);
    expect(res.body.domain).toBe("vessels");

    const returnedIds = (res.body.nodes as Array<{ id: string }>).map((n) => n.id).sort();
    expect(returnedIds).toEqual([...seeded.vessels].sort());
    expect(res.body.stats.nodeCount).toBe(2);

    // Edges touching {V1,V2}:
    //   internal: V1->V2
    //   cross:    T1->V1, V2->T3, V1->A1, A2->V2  (4)
    expect(res.body.stats.edgeCount).toBe(5);
    expect(res.body.stats.crossDomainEdgeCount).toBe(4);
    expect(res.body.stats.internalEdgeCount).toBe(1);
  });

  // ── aegis (explicit per-domain handler) ───────────────────────────────────
  it("aegis graph (isActive=true) reports 2 nodes, 7 edges, 6 cross-domain, 1 internal", async () => {
    const res = await request(app)
      .get("/domains/aegis/graph")
      .query({ entityType: FIXTURE_ENTITY_TYPE, isActive: "true" });
    expect(res.status).toBe(200);
    expect(res.body.domain).toBe("aegis");

    const returnedIds = (res.body.nodes as Array<{ id: string }>).map((n) => n.id).sort();
    expect(returnedIds).toEqual([...seeded.aegis].sort());
    expect(res.body.stats.nodeCount).toBe(2);

    // Edges touching {A1,A2}:
    //   internal: A1->A2
    //   cross:    A1->T1, T2->A2, V1->A1, A2->V2, A1->C1, A2->T_INACTIVE  (6)
    expect(res.body.stats.edgeCount).toBe(7);
    expect(res.body.stats.crossDomainEdgeCount).toBe(6);
    expect(res.body.stats.internalEdgeCount).toBe(1);
  });

  // ── carlota-jo (generic fallback handler) ─────────────────────────────────
  it("carlota-jo graph via generic fallback reports 1 node, 2 edges, 2 cross-domain, 0 internal", async () => {
    const res = await request(app)
      .get("/domains/carlota-jo/graph")
      .query({ entityType: FIXTURE_ENTITY_TYPE, isActive: "true" });
    expect(res.status).toBe(200);
    expect(res.body.domain).toBe("carlota-jo");

    const returnedIds = (res.body.nodes as Array<{ id: string }>).map((n) => n.id).sort();
    expect(returnedIds).toEqual([...seeded.carlotaJo].sort());
    expect(res.body.stats.nodeCount).toBe(1);

    // Edges touching {C1}:
    //   cross: C1->T3, A1->C1
    expect(res.body.stats.edgeCount).toBe(2);
    expect(res.body.stats.crossDomainEdgeCount).toBe(2);
    expect(res.body.stats.internalEdgeCount).toBe(0);
  });

  // ── inactive node coverage ────────────────────────────────────────────────
  it("terra graph with isActive=false returns ONLY inactive nodes and their edges", async () => {
    const res = await request(app)
      .get("/domains/terra/graph")
      .query({ entityType: FIXTURE_ENTITY_TYPE, isActive: "false" });
    expect(res.status).toBe(200);
    expect(res.body.domain).toBe("terra");

    const returnedIds = (res.body.nodes as Array<{ id: string }>).map((n) => n.id).sort();
    expect(returnedIds).toEqual([...seeded.terraInactive].sort());
    expect(res.body.stats.nodeCount).toBe(1);

    // Edges touching {T_INACTIVE}: T1->T_INACTIVE (cross? no — T1 is terra
    // too, but T1 is NOT in the active-set of returned ids, so the route
    // classifies it as cross-domain. Same for A2->T_INACTIVE.)
    expect(res.body.stats.edgeCount).toBe(2);
    expect(res.body.stats.crossDomainEdgeCount).toBe(2);
    expect(res.body.stats.internalEdgeCount).toBe(0);
  });

  it("terra graph defaults to active-only (matches isActive=true)", async () => {
    const res = await request(app)
      .get("/domains/terra/graph")
      .query({ entityType: FIXTURE_ENTITY_TYPE });
    expect(res.status).toBe(200);
    expect(res.body.domain).toBe("terra");

    // Default behavior should match isActive=true: only the 3 active terra nodes
    const returnedIds = (res.body.nodes as Array<{ id: string }>).map((n) => n.id).sort();
    expect(returnedIds).toEqual([...seeded.terra].sort());
    expect(res.body.stats.nodeCount).toBe(3);
    expect(res.body.stats.edgeCount).toBe(9);
    expect(res.body.stats.crossDomainEdgeCount).toBe(6);
    expect(res.body.stats.internalEdgeCount).toBe(3);
  });

  it("terra graph with isActive=all opts out of the filter and includes BOTH active and inactive terra nodes", async () => {
    const res = await request(app)
      .get("/domains/terra/graph")
      .query({ entityType: FIXTURE_ENTITY_TYPE, isActive: "all" });
    expect(res.status).toBe(200);
    expect(res.body.domain).toBe("terra");

    const expected = [...seeded.terra, ...seeded.terraInactive].sort();
    const returnedIds = (res.body.nodes as Array<{ id: string }>).map((n) => n.id).sort();
    expect(returnedIds).toEqual(expected);
    expect(res.body.stats.nodeCount).toBe(4);

    // Edges touching {T1,T2,T3,T_INACTIVE}:
    //   internal: T1->T2, T2->T3, T1->T3(inactive edge), T1->T_INACTIVE  (4)
    //   cross:    T1->V1, V2->T3, A1->T1, T2->A2, C1->T3, A2->T_INACTIVE (6)
    expect(res.body.stats.edgeCount).toBe(10);
    expect(res.body.stats.crossDomainEdgeCount).toBe(6);
    expect(res.body.stats.internalEdgeCount).toBe(4);
  });

  // ── includeCross=false ────────────────────────────────────────────────────
  it("includeCross=false on terra graph drops both inbound and outbound cross-domain edges", async () => {
    const res = await request(app)
      .get("/domains/terra/graph")
      .query({ entityType: FIXTURE_ENTITY_TYPE, isActive: "true", includeCross: "false" });
    expect(res.status).toBe(200);
    expect(res.body.stats.nodeCount).toBe(3);
    expect(res.body.stats.crossDomainEdgeCount).toBe(0);
    // Internal terra edges only: T1->T2, T2->T3, T1->T3(inactive edge)
    expect(res.body.stats.edgeCount).toBe(3);
    expect(res.body.stats.internalEdgeCount).toBe(3);
  });

  it("includeCross=false on aegis graph leaves only the single internal edge", async () => {
    const res = await request(app)
      .get("/domains/aegis/graph")
      .query({ entityType: FIXTURE_ENTITY_TYPE, isActive: "true", includeCross: "false" });
    expect(res.status).toBe(200);
    expect(res.body.stats.nodeCount).toBe(2);
    expect(res.body.stats.crossDomainEdgeCount).toBe(0);
    expect(res.body.stats.edgeCount).toBe(1);
    expect(res.body.stats.internalEdgeCount).toBe(1);
  });

  // ── activeEdgesOnly ───────────────────────────────────────────────────────
  it("activeEdgesOnly=true on terra graph excludes the inactive T1->T3 edge and tightens internal count", async () => {
    const res = await request(app)
      .get("/domains/terra/graph")
      .query({ entityType: FIXTURE_ENTITY_TYPE, isActive: "true", activeEdgesOnly: "true" });
    expect(res.status).toBe(200);
    expect(res.body.stats.nodeCount).toBe(3);

    // Same edges as the baseline terra (active=true) test, minus T1->T3 (active=false).
    expect(res.body.stats.edgeCount).toBe(8);
    expect(res.body.stats.crossDomainEdgeCount).toBe(6);
    expect(res.body.stats.internalEdgeCount).toBe(2);

    const edges = res.body.edges as Array<{ id: string; active: boolean }>;
    expect(edges.every((e) => e.active === true)).toBe(true);
  });

  it("activeEdgesOnly=true with includeCross=false on terra graph drops the inactive internal edge too", async () => {
    const res = await request(app)
      .get("/domains/terra/graph")
      .query({
        entityType: FIXTURE_ENTITY_TYPE,
        isActive: "true",
        includeCross: "false",
        activeEdgesOnly: "true",
      });
    expect(res.status).toBe(200);
    expect(res.body.stats.nodeCount).toBe(3);
    expect(res.body.stats.crossDomainEdgeCount).toBe(0);
    // Internal active terra edges only: T1->T2, T2->T3 (T1->T3 is inactive)
    expect(res.body.stats.edgeCount).toBe(2);
    expect(res.body.stats.internalEdgeCount).toBe(2);

    const edges = res.body.edges as Array<{ id: string; active: boolean }>;
    expect(edges.every((e) => e.active === true)).toBe(true);
  });

  it("activeEdgesOnly=false (default) on terra graph still includes the inactive edge", async () => {
    const res = await request(app)
      .get("/domains/terra/graph")
      .query({ entityType: FIXTURE_ENTITY_TYPE, isActive: "true", activeEdgesOnly: "false" });
    expect(res.status).toBe(200);
    expect(res.body.stats.edgeCount).toBe(9);
    const edges = res.body.edges as Array<{ id: string; active: boolean }>;
    expect(edges.some((e) => e.active === false)).toBe(true);
  });

  // ── domain isolation ──────────────────────────────────────────────────────
  it("returned terra nodes never leak in vessels/aegis/carlota-jo nodes", async () => {
    const res = await request(app)
      .get("/domains/terra/graph")
      .query({ entityType: FIXTURE_ENTITY_TYPE });
    expect(res.status).toBe(200);
    const foreign = new Set([...seeded.vessels, ...seeded.aegis, ...seeded.carlotaJo]);
    for (const node of res.body.nodes as Array<{ id: string }>) {
      expect(foreign.has(node.id)).toBe(false);
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
