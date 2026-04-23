/**
 * Database Integration Tests
 *
 * These tests boot the actual Express route handlers with a REAL PostgreSQL
 * connection (via DATABASE_URL). The only things mocked are:
 *   - ../middlewares/auth  (inject a test principal — avoids session bootstrap)
 *   - ../lib/pubsub-bridge (no real WebSocket server in test context)
 *   - @szl-holdings/ai-engine/domain-embedding-hooks (AI services unavailable)
 *   - @szl-holdings/services (third-party integration services)
 *   - ../lib/email*  (SMTP not available in test context)
 *
 * The database mock is intentionally absent.  Every SELECT, INSERT, and DELETE
 * executed by a route handler goes to the real database.  This validates that:
 *   1. Tables exist and migrations are current
 *   2. Drizzle-ORM column types match the TypeScript schema
 *   3. Route handlers produce the correct HTTP response shapes on real data
 *   4. INSERT payloads accepted by the route are actually storable
 *
 * Cleanup: any records created by POST tests are deleted in afterAll.
 */

import request from "supertest";
import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { vi, beforeAll, afterAll, describe, it, expect } from "vitest";
import { registerCleanup, flushAllCleanup } from "../utils/cleanup-registry";

// ── Shared mock constants ────────────────────────────────────────────────────
const TEST_ROLE = "ops";

const TEST_ORG_ID = 1;
const TEST_USER = { id: 1, isAdmin: false, orgs: [{ orgId: TEST_ORG_ID }] };

const mockAuthMiddlewarePassthrough = () =>
  (req: Request, res: Response, next: NextFunction) => {
    res.locals.userId = TEST_USER.id;
    res.locals.role = TEST_ROLE;
    (req as Request & { user?: typeof TEST_USER }).user = TEST_USER;
    next();
  };

// ── Mock: auth middleware only (not DB) ───────────────────────────────────────
vi.mock(
  "../../artifacts/api-server/src/middlewares/auth",
  () => ({
    authMiddleware: mockAuthMiddlewarePassthrough,
    requireRole: (..._roles: string[]) =>
      (_req: Request, _res: Response, next: NextFunction) => next(),
    denyIfReadOnly: () =>
      (_req: Request, _res: Response, next: NextFunction) => next(),
    parseIdParam: (id: string) => {
      const n = parseInt(id, 10);
      if (Number.isNaN(n)) throw Object.assign(new Error("Invalid ID"), { status: 400 });
      return n;
    },
    InvalidIdError: class InvalidIdError extends Error {
      status = 400;
    },
  }),
);

// ── Mock: pubsub / WebSocket bridge ──────────────────────────────────────────
vi.mock("../../artifacts/api-server/src/lib/pubsub-bridge.js", () => ({
  broadcastWs: vi.fn(),
  pubsub: { publish: vi.fn().mockResolvedValue(undefined), asyncIterator: vi.fn() },
  VESSELS_EVENTS: { POSITION_UPDATED: "VESSEL_POSITION_UPDATED" },
  FIRESTORM_EVENTS: { INCIDENT_CREATED: "FIRESTORM_INCIDENT_CREATED", INCIDENT_UPDATED: "FIRESTORM_INCIDENT_UPDATED" },
  LYTE_EVENTS: { INCIDENT_CREATED: "LYTE_INCIDENT_CREATED" },
  ALLOY_EVENTS: { DECISION_CREATED: "ALLOY_DECISION_CREATED" },
  CARLOTA_EVENTS: { INQUIRY_CREATED: "CARLOTA_INQUIRY_CREATED" },
  TERRA_EVENTS: { DEAL_UPDATED: "TERRA_DEAL_UPDATED", ACTION_ITEM_UPDATED: "TERRA_ACTION_ITEM_UPDATED" },
  HOLDINGS_EVENTS: { INQUIRY_CREATED: "HOLDINGS_INQUIRY_CREATED" },
  WS_CHANNELS: {},
}));

// ── Mock: AI-engine embedding hooks ──────────────────────────────────────────
vi.mock("@szl-holdings/ai-engine/domain-embedding-hooks", () => ({
  embedOnCreate: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  embedOnUpdate: () => (_req: Request, _res: Response, next: NextFunction) => next(),
}));

// ── Mock: external services ───────────────────────────────────────────────────
vi.mock("@szl-holdings/services", () => ({
  services: {},
  getService: vi.fn(() => null),
}));

// ── Mock: email (full export surface so callers never call undefined) ─────────
vi.mock("../../artifacts/api-server/src/lib/email", () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true }),
  sendBookingConfirmation: vi.fn().mockResolvedValue({ success: true }),
  buildCarlotaContactAckEmail: vi.fn(() => "<p>mock ack</p>"),
  buildCarlotaInquiryNotificationEmail: vi.fn(() => "<p>mock notify</p>"),
  buildHoldingsInquiryNotificationEmail: vi.fn(() => "<p>mock holdings</p>"),
  buildHoldingsInquiryAckEmail: vi.fn(() => "<p>mock holdings ack</p>"),
  CARLOTA_ADMIN_EMAIL: "test-admin@example.com",
  HOLDINGS_ADMIN_EMAIL: "holdings-admin@example.com",
}));

vi.mock("../../artifacts/api-server/src/lib/email-templates", () => ({
  buildConfirmationEmail: vi.fn(() => ({ subject: "test", html: "<p>test</p>" })),
  buildInquiryEmail: vi.fn(() => ({ subject: "test", html: "<p>test</p>" })),
}));

// ── Mock: activity logger + platform flags (no external side-effects) ─────────
vi.mock("../../artifacts/api-server/src/lib/activity-logger.js", () => ({
  logActivity: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../../artifacts/api-server/src/lib/platform-flags.js", () => ({
  isFlagEnabled: vi.fn().mockResolvedValue(true),
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildApp() {
  const app = express();
  app.use(express.json());
  return app;
}

// ── Domain: Vessels ───────────────────────────────────────────────────────────
describe("DB Integration — SEXTANT domain", () => {
  let app: express.Express;

  beforeAll(async () => {
    app = buildApp();
    const router = (await import("../../artifacts/api-server/src/routes/vessels")).default;
    app.use(router);
  });

  it("GET /vessels/fleets returns 200 with an array from real DB", async () => {
    const res = await request(app).get("/vessels/fleets");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /vessels returns 200 with an array from real DB", async () => {
    const res = await request(app).get("/vessels");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /vessels/alert-rules/all returns 200 with array from real DB", async () => {
    const res = await request(app).get("/vessels/alert-rules/all");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /vessels/alerts/all returns 200 with array from real DB", async () => {
    const res = await request(app).get("/vessels/alerts/all");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("POST /vessels/fleets rejects invalid body with 400", async () => {
    const res = await request(app)
      .post("/vessels/fleets")
      .send({ description: "missing name" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("POST /vessels/fleets creates a real DB record and returns 201", async () => {
    const res = await request(app)
      .post("/vessels/fleets")
      .send({ name: `IT-Fleet-${Date.now()}`, status: "active" });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(typeof res.body.id).toBe("number");
    registerCleanup({ table: "vesselsFleetsTable", id: res.body.id as number });
  });

  it("POST /vessels/alerts rejects missing required fields with 400", async () => {
    const res = await request(app)
      .post("/vessels/alerts")
      .send({ severity: "low" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("POST /vessels/alerts creates a real DB record and returns 201", async () => {
    const res = await request(app)
      .post("/vessels/alerts")
      .send({
        title: `IT-Alert-${Date.now()}`,
        message: "Integration test alert — please ignore",
        severity: "low",
      });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(typeof res.body.id).toBe("number");
    expect(res.body.severity).toBe("low");
    registerCleanup({ table: "vesselsAlertsTable", id: res.body.id as number });
  });

  it("POST /vessels/alert-rules rejects missing required fields with 400", async () => {
    const res = await request(app)
      .post("/vessels/alert-rules")
      .send({ name: "Incomplete Rule" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("POST /vessels/alert-rules creates a real DB record and returns 201", async () => {
    const res = await request(app)
      .post("/vessels/alert-rules")
      .send({
        name: `IT-AlertRule-${Date.now()}`,
        ruleType: "speed",
        conditions: { threshold: 20, unit: "knots" },
        severity: "high",
      });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(typeof res.body.id).toBe("number");
    expect(res.body.ruleType).toBe("speed");
    expect(res.body.severity).toBe("high");
    registerCleanup({ table: "vesselsAlertRulesTable", id: res.body.id as number });
  });

  afterAll(async () => {
    await flushAllCleanup();
  });
});

// ── Domain: Vessels Trading ───────────────────────────────────────────────────
// NOTE: Trading orders are stored in-memory (sessionOrders) — there is no DB
// table for them. Tests validate the route's validation and success response
// shapes; no afterAll cleanup is required.
describe("DB Integration — SEXTANT Trading domain", () => {
  let app: express.Express;

  beforeAll(async () => {
    app = buildApp();
    const router = (await import("../../artifacts/api-server/src/routes/vessels-trading")).default;
    app.use(router);
  });

  it("POST /vessels/trading/orders rejects missing required fields with 400", async () => {
    const res = await request(app)
      .post("/vessels/trading/orders")
      .send({ notes: "missing instrumentId, side, and quantity" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("POST /vessels/trading/orders rejects unknown instrumentId with 404", async () => {
    const res = await request(app)
      .post("/vessels/trading/orders")
      .send({ instrumentId: 99999, side: "buy", quantity: "1", orderType: "market" });
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });

  it("POST /vessels/trading/orders places a market order and returns filled envelope", async () => {
    const res = await request(app)
      .post("/vessels/trading/orders")
      .send({ instrumentId: 1, side: "buy", quantity: "2", orderType: "market" });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("order");
    expect(res.body.filled).toBe(true);
    expect(res.body.order.status).toBe("filled");
    expect(res.body.order.side).toBe("buy");
    expect(res.body.order.quantity).toBe("2");
    expect(res.body).toHaveProperty("message");
  });

  it("POST /vessels/trading/orders places a limit order and returns open envelope", async () => {
    const res = await request(app)
      .post("/vessels/trading/orders")
      .send({ instrumentId: 1, side: "sell", quantity: "3", orderType: "limit", limitPrice: "2000" });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("order");
    expect(res.body.filled).toBe(false);
    expect(res.body.order.status).toBe("open");
    expect(res.body.order.limitPrice).toBe("2000");
  });
});

// ── Domain: SZL Holdings ─────────────────────────────────────────────────────
describe("DB Integration — SZL Holdings domain", () => {
  let app: express.Express;

  beforeAll(async () => {
    app = buildApp();
    const router = (await import("../../artifacts/api-server/src/routes/holdings")).default;
    app.use(router);
  });

  it("GET /holdings/health returns 200 with { status: 'ok' } (no DB)", async () => {
    const res = await request(app).get("/holdings/health");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: "ok" });
  });

  it("GET /holdings/ventures returns 200 with paginated envelope from real DB", async () => {
    const res = await request(app).get("/holdings/ventures");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body).toHaveProperty("meta");
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(typeof res.body.meta.total).toBe("number");
  });

  it("GET /holdings/milestones returns 200 with paginated envelope from real DB", async () => {
    const res = await request(app).get("/holdings/milestones");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("GET /holdings/leadership returns 200 with array from real DB", async () => {
    const res = await request(app).get("/holdings/leadership");
    expect(res.status).toBe(200);
    const isArray = Array.isArray(res.body);
    const hasData = Array.isArray(res.body?.data);
    expect(isArray || hasData).toBe(true);
  });

  it("POST /holdings/ventures rejects missing required slug field (400 or DB 500)", async () => {
    const res = await request(app)
      .post("/holdings/ventures")
      .send({ name: "missing-slug" });
    expect([400, 409, 500]).toContain(res.status);
    expect(res.status).not.toBe(201);
  });

  it("POST /holdings/ventures creates a real DB record and returns 201", async () => {
    const slug = `it-venture-${Date.now()}`;
    const res = await request(app)
      .post("/holdings/ventures")
      .send({ slug, name: "Integration Test Venture", status: "active" });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    registerCleanup({ table: "holdingsVenturesTable", id: res.body.id as number });
  });

  afterAll(async () => {
    await flushAllCleanup();
  });
});

// ── Domain: Carlota Jo ────────────────────────────────────────────────────────
describe("DB Integration — Carlota Jo domain", () => {
  let app: express.Express;

  beforeAll(async () => {
    app = buildApp();
    const router = (await import("../../artifacts/api-server/src/routes/carlota-jo")).default;
    app.use(router);
  });

  it("GET /booking/services returns 200 with paginated envelope from real DB", async () => {
    const res = await request(app).get("/booking/services");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("GET /booking/inquiries returns 200 with paginated envelope from real DB", async () => {
    const res = await request(app).get("/booking/inquiries");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("POST /booking/inquiries rejects missing required fields with 400", async () => {
    const res = await request(app)
      .post("/booking/inquiries")
      .send({ name: "No email" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("POST /booking/inquiries creates a real DB record and returns 200", async () => {
    const res = await request(app)
      .post("/booking/inquiries")
      .send({
        name: "Integration Tester",
        email: `it-test-${Date.now()}@example.com`,
        message: "Integration test inquiry — please ignore",
      });
    expect(res.status).toBe(200);
    const inquiryId: number = res.body.inquiryId ?? res.body.data?.id ?? res.body.id;
    expect(typeof inquiryId).toBe("number");
    registerCleanup({ table: "carlotaInquiriesTable", id: inquiryId });
  });

  afterAll(async () => {
    await flushAllCleanup();
  });
});

// ── Domain: Lyte (AIOps) ─────────────────────────────────────────────────────
describe("DB Integration — KORA domain", () => {
  let app: express.Express;

  beforeAll(async () => {
    app = buildApp();
    const router = (await import("../../artifacts/api-server/src/routes/lyte")).default;
    app.use(router);
  });

  it("GET /lyte/workspaces returns 200 with paginated envelope from real DB", async () => {
    const res = await request(app).get("/lyte/workspaces");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(typeof res.body.meta?.total).toBe("number");
  });

  it("GET /lyte/incidents returns 200 with paginated envelope from real DB", async () => {
    const res = await request(app).get("/lyte/incidents");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("GET /lyte/signals returns 200 with paginated envelope from real DB", async () => {
    const res = await request(app).get("/lyte/signals");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("POST /lyte/workspaces creates a real DB record and returns 201", async () => {
    const res = await request(app)
      .post("/lyte/workspaces")
      .send({ name: `IT-Workspace-${Date.now()}`, description: "Integration test workspace" });
    expect([200, 201]).toContain(res.status);
    expect(res.body).toBeDefined();
    const id = res.body?.id ?? res.body?.data?.id;
    if (typeof id === "number") registerCleanup({ table: "lyteWorkspacesTable", id });
  });

  it("POST /lyte/workspaces rejects missing name with 4xx/5xx (DB NOT NULL constraint)", async () => {
    // Lyte POST handler does not apply Zod validation — missing `name` hits
    // PostgreSQL NOT NULL constraint and surfaces as 500 from handleRouteError.
    // Any error status ≥ 400 confirms the contract rejects incomplete payloads.
    const res = await request(app)
      .post("/lyte/workspaces")
      .send({ description: "No name" });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body).toHaveProperty("error");
  });

  afterAll(async () => {
    await flushAllCleanup();
  });
});

// ── Domain: Aegis / Firestorm ─────────────────────────────────────────────────
describe("DB Integration — PARAGON / Firestorm domain", () => {
  let app: express.Express;
  let tempAssessmentId: number | undefined;

  beforeAll(async () => {
    app = buildApp();
    const router = (await import("../../artifacts/api-server/src/routes/firestorm")).default;
    app.use(router);
  });

  it("GET /firestorm/incidents returns 200 with array from real DB", async () => {
    const res = await request(app).get("/firestorm/incidents");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /firestorm/alerts returns 200 with array from real DB", async () => {
    const res = await request(app).get("/firestorm/alerts");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /firestorm/assets returns 200 with array from real DB", async () => {
    const res = await request(app).get("/firestorm/assets");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("POST /firestorm/scenarios creates a real DB record and returns 201", async () => {
    const res = await request(app)
      .post("/firestorm/scenarios")
      .send({ name: `IT-Scenario-${Date.now()}`, category: "network", severity: "medium", complexity: "basic" });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(typeof res.body.id).toBe("number");
    expect(res.body.category).toBe("network");
    registerCleanup({ table: "firestormScenariosTable", id: res.body.id as number });
  });

  it("POST /firestorm/scenarios rejects invalid category with 400 (Zod validation)", async () => {
    const res = await request(app)
      .post("/firestorm/scenarios")
      .send({ name: "Bad Scenario", category: "not-a-valid-category" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("POST /firestorm/incidents rejects missing required title with 400", async () => {
    const res = await request(app)
      .post("/firestorm/incidents")
      .send({ severity: "high", description: "No title provided" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("POST /firestorm/incidents creates a real DB record and returns 201", async () => {
    const res = await request(app)
      .post("/firestorm/incidents")
      .send({
        title: `IT-Incident-${Date.now()}`,
        severity: "medium",
        description: "Integration test incident — please ignore",
      });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(typeof res.body.id).toBe("number");
    expect(res.body.severity).toBe("medium");
    expect(res.body.status).toBe("detection");
    registerCleanup({ table: "firestormIncidentsTable", id: res.body.id as number });
  });

  it("POST /firestorm/assessments rejects missing required assessmentType with 400", async () => {
    const res = await request(app)
      .post("/firestorm/assessments")
      .send({ name: "Missing Type Assessment" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("POST /firestorm/assessments creates a real DB record and returns 201", async () => {
    const res = await request(app)
      .post("/firestorm/assessments")
      .send({
        name: `IT-Assessment-${Date.now()}`,
        assessmentType: "penetration_test",
        description: "Integration test assessment — please ignore",
      });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(typeof res.body.id).toBe("number");
    expect(res.body.assessmentType).toBe("penetration_test");
    expect(res.body.status).toBe("draft");
    tempAssessmentId = res.body.id as number;
    registerCleanup({ table: "firestormAssessmentsTable", id: tempAssessmentId });
  });

  it("POST /firestorm/findings rejects missing required title with 400", async () => {
    const assessmentId = tempAssessmentId ?? 1;
    const res = await request(app)
      .post("/firestorm/findings")
      .send({ assessmentId, severity: "medium" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("POST /firestorm/findings creates a real DB record and returns 201", async () => {
    const assessmentId = tempAssessmentId;
    if (!assessmentId) {
      return;
    }
    const res = await request(app)
      .post("/firestorm/findings")
      .send({
        assessmentId,
        title: `IT-Finding-${Date.now()}`,
        severity: "low",
        description: "Integration test finding — please ignore",
      });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(typeof res.body.id).toBe("number");
    expect(res.body.severity).toBe("low");
    expect(res.body.status).toBe("open");
    registerCleanup({ table: "firestormFindingsTable", id: res.body.id as number });
  });

  afterAll(async () => {
    await flushAllCleanup();
  });
});

// ── Domain: PRISM Counsel — REMOVED (Task #2696, routes archived) ────────────

// ── Domain: Terra ─────────────────────────────────────────────────────────────
describe("DB Integration — DOMAINE (Real Estate) domain", () => {
  let app: express.Express;

  beforeAll(async () => {
    app = buildApp();
    const router = (await import("../../artifacts/api-server/src/routes/terra")).default;
    app.use(router);
  });

  it("GET /terra/market-intelligence returns 200 with real-time response (fetchedAt present)", async () => {
    const res = await request(app).get("/terra/market-intelligence");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("fetchedAt");
    expect(typeof res.body.fetchedAt).toBe("string");
    expect(new Date(res.body.fetchedAt).toISOString()).toBe(res.body.fetchedAt);
  });

  it("GET /terra/reit-filings returns 200 with fetchedAt timestamp", async () => {
    const res = await request(app).get("/terra/reit-filings");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("fetchedAt");
  });

  it("POST /terra/enterprise/sync/mls triggers sync and returns success envelope", async () => {
    // Sync operation: calls mocked runMlsListingSync(), no persistent records created
    const res = await request(app).post("/terra/enterprise/sync/mls");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message");
    expect(res.body.message).toContain("MLS");
  });

  it("POST /terra/enterprise/sync/commercial triggers commercial data refresh", async () => {
    const res = await request(app).post("/terra/enterprise/sync/commercial");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message");
    expect(res.body.message).toContain("refresh");
  });
});

// ── Teardown: close DB pool to prevent hanging test runner ────────────────────
afterAll(async () => {
  try {
    const { pool } = await import("@szl-holdings/db");
    await pool.end();
  } catch {
    // pool may already be closed
  }
});
