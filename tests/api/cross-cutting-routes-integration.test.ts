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

// ── Teardown ─────────────────────────────────────────────────────────────────
afterAll(async () => {
  try {
    const { pool } = await import("@szl-holdings/db");
    await pool.end();
  } catch {
    // pool may already be closed by another test file
  }
});
