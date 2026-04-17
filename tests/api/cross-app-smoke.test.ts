/**
 * Cross-App Integration Smoke Tests
 *
 * Verifies data contract paths between each major app domain and the API server.
 * Uses real DB + drizzle-orm (same as db-integration.test.ts) — no drizzle/DB mocks.
 * External side-effects (email, pubsub, AI engine, geocoding) are mocked.
 *
 * Domains covered: Vessels, Terra, PRISM Counsel, Aegis/Firestorm, Lyte, Carlota Jo, SZL Holdings
 */
import { describe, it, expect, afterAll, vi } from "vitest";
import request from "supertest";
import { createTestApp } from "../utils/test-app";

// ── Module mocks (external side-effects only — DB is real) ────────────────────

vi.mock("../../artifacts/api-server/src/middlewares/auth", () => {
  const authMiddleware = (_opts: { required?: boolean } = {}) =>
    (req: Record<string, unknown>, _res: unknown, next: () => void) => {
      next();
    };

  const requireRole = (..._roles: string[]) =>
    (_req: unknown, _res: unknown, next: () => void) => next();

  const denyIfReadOnly = () =>
    (_req: unknown, _res: unknown, next: () => void) => next();

  const parseIdParam = (id: string) => {
    const n = parseInt(id, 10);
    if (isNaN(n)) throw new Error("Invalid ID");
    return n;
  };

  class InvalidIdError extends Error {}

  return { authMiddleware, requireRole, denyIfReadOnly, parseIdParam, InvalidIdError };
});

vi.mock("../../artifacts/api-server/src/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
  },
}));

vi.mock("../../artifacts/api-server/src/lib/pubsub-bridge.js", () => ({
  broadcastWs: vi.fn(),
  pubsub: { publish: vi.fn(), asyncIterableIterator: vi.fn() },
  VESSELS_EVENTS: {},
  FIRESTORM_EVENTS: {},
  LYTE_EVENTS: {},
  CARLOTA_EVENTS: {},
  ALLOY_EVENTS: {},
}));

vi.mock("../../artifacts/api-server/src/lib/email", () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
  buildCarlotaContactAckEmail: vi.fn().mockReturnValue("<p>ack</p>"),
  buildCarlotaInquiryNotificationEmail: vi.fn().mockReturnValue("<p>notify</p>"),
  buildInquiryAckEmail: vi.fn().mockReturnValue("<p>ack</p>"),
  buildLeadNotificationEmail: vi.fn().mockReturnValue("<p>lead</p>"),
  CARLOTA_ADMIN_EMAIL: "admin@carlotajo.com",
  INTERNAL_EMAIL: "internal@szl.holdings",
}));

vi.mock("@szl-holdings/services", () => ({
  services: {
    getAll: vi.fn().mockResolvedValue([]),
    getBySlug: vi.fn().mockResolvedValue(null),
  },
}));

vi.mock("@szl-holdings/ai-engine/domain-embedding-hooks", () => ({
  ingestLyteSystem: vi.fn().mockResolvedValue(undefined),
  ingestFirestormFinding: vi.fn().mockResolvedValue(undefined),
  ingestFirestormScenario: vi.fn().mockResolvedValue(undefined),
  ingestFirestormAlert: vi.fn().mockResolvedValue(undefined),
  ingestCarlotaService: vi.fn().mockResolvedValue(undefined),
  ingestPrismMatter: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../artifacts/api-server/src/lib/geocoding", () => ({
  geocodeAddress: vi.fn().mockResolvedValue({ lat: 0, lng: 0 }),
  reverseGeocode: vi.fn().mockResolvedValue({ address: "Test Address" }),
  getGeocodingProviderStatus: vi.fn().mockReturnValue({ status: "ok" }),
}));

vi.mock("../../artifacts/api-server/src/lib/terra-enterprise-ingestion", () => ({
  getMlsListings: vi.fn().mockResolvedValue([]),
  getCommercialProperties: vi.fn().mockResolvedValue([]),
  getCommercialComps: vi.fn().mockResolvedValue([]),
  runMlsListingSync: vi.fn().mockResolvedValue({ synced: 0 }),
  runCommercialDataRefresh: vi.fn().mockResolvedValue({ refreshed: 0 }),
  getEnterpriseFeatureFlags: vi.fn().mockResolvedValue({}),
}));

vi.mock("../../artifacts/api-server/src/lib/tradecraft-evidence-store", () => ({
  queryEvidenceIndex: vi.fn().mockResolvedValue([]),
  ingestDecisionToEvidenceIndex: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@szl-holdings/ai-engine", () => ({
  validateAndBuildDecision: vi.fn().mockResolvedValue({ id: "test-decision" }),
}));

vi.mock("../../artifacts/api-server/src/middlewares/optimistic-concurrency", () => ({
  validateIfMatch: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

vi.mock("../../artifacts/api-server/src/lib/backup-service", () => ({
  getBackupHealthStatus: vi.fn().mockReturnValue({ status: "ok", totalBackups: 0 }),
}));

vi.mock("../../artifacts/api-server/src/lib/websocket.js", () => ({
  publish: vi.fn(),
  WS_CHANNELS: {},
}));

vi.mock("../../artifacts/api-server/src/lib/platform-flags", () => ({
  isFlagEnabled: vi.fn().mockResolvedValue(true),
}));

vi.mock("../../artifacts/api-server/src/lib/api-response", async () => {
  const actual = await vi.importActual<typeof import("../../artifacts/api-server/src/lib/api-response")>(
    "../../artifacts/api-server/src/lib/api-response",
  );
  return actual;
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildAuthApp(roles: string[] = ["admin", "ops", "exec", "super_admin"]) {
  const app = createTestApp();
  app.use((req, _res, next) => {
    (req as Record<string, unknown>).user = {
      id: 1,
      displayName: "Integration Test User",
      email: "test@szl.holdings",
      roles,
      orgs: [{ orgId: 1, orgSlug: "szl", orgName: "SZL Holdings", role: "admin" }],
    };
    next();
  });
  return app;
}

// Pool handle for cleanup
let pool: { end: () => Promise<void> } | null = null;

afterAll(async () => {
  // Cleanup: end the real DB pool used by routes (imported by the route modules)
  try {
    const dbModule = await import("@szl-holdings/db");
    if (dbModule.pool && typeof (dbModule.pool as { end?: () => Promise<void> }).end === "function") {
      await (dbModule.pool as { end: () => Promise<void> }).end();
    }
  } catch {
    // pool may already be closed or not exported
  }
  pool = null;
});

// ── Domain: Vessels ──────────────────────────────────────────────────────────

describe("Domain: Vessels", () => {
  const cleanupFleetIds: number[] = [];

  it("GET /vessels/fleets returns 200 with array", async () => {
    const app = buildAuthApp();
    const router = (await import("../../artifacts/api-server/src/routes/vessels")).default;
    app.use(router);
    const res = await request(app).get("/vessels/fleets");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /vessels returns 200 with array", async () => {
    const app = buildAuthApp();
    const router = (await import("../../artifacts/api-server/src/routes/vessels")).default;
    app.use(router);
    const res = await request(app).get("/vessels");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("POST /vessels/fleets returns 201 with fleet object", async () => {
    const app = buildAuthApp(["ops", "exec", "admin"]);
    const router = (await import("../../artifacts/api-server/src/routes/vessels")).default;
    app.use(router);
    const res = await request(app)
      .post("/vessels/fleets")
      .send({ name: "Smoke Test Fleet", description: "Smoke test fleet — safe to delete" });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    if (typeof res.body?.id === "number") cleanupFleetIds.push(res.body.id as number);
  });

  it("GET /vessels/fleets/:id returns a valid HTTP response (200 or 404, not 500)", async () => {
    const app = buildAuthApp();
    const router = (await import("../../artifacts/api-server/src/routes/vessels")).default;
    app.use(router);
    const res = await request(app).get("/vessels/fleets/1");
    expect([200, 404]).toContain(res.status);
    expect(res.status).not.toBe(500);
  });

  it("GET /vessels/alert-rules/all returns 200 with array", async () => {
    const app = buildAuthApp();
    const router = (await import("../../artifacts/api-server/src/routes/vessels")).default;
    app.use(router);
    const res = await request(app).get("/vessels/alert-rules/all");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /vessels/alerts/all returns 200 with array", async () => {
    const app = buildAuthApp();
    const router = (await import("../../artifacts/api-server/src/routes/vessels")).default;
    app.use(router);
    const res = await request(app).get("/vessels/alerts/all");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  afterAll(async () => {
    if (cleanupFleetIds.length > 0) {
      const app = buildAuthApp(["ops", "exec", "admin"]);
      const router = (await import("../../artifacts/api-server/src/routes/vessels")).default;
      app.use(router);
      for (const id of cleanupFleetIds) {
        await request(app).delete(`/vessels/fleets/${id}`);
      }
    }
  });
});

// ── Domain: Terra (Real Estate) ──────────────────────────────────────────────

describe("Domain: Terra", () => {
  it("GET /terra/market-intelligence returns 200 with status", async () => {
    const app = buildAuthApp();
    const router = (await import("../../artifacts/api-server/src/routes/terra")).default;
    app.use(router);
    const res = await request(app).get("/terra/market-intelligence");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status");
  });

  it("GET /terra/reit-filings returns 200 with count", async () => {
    const app = buildAuthApp();
    const router = (await import("../../artifacts/api-server/src/routes/terra")).default;
    app.use(router);
    const res = await request(app).get("/terra/reit-filings");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("count");
  });

  it("GET /terra/demographics returns 200", async () => {
    const app = buildAuthApp();
    const router = (await import("../../artifacts/api-server/src/routes/terra")).default;
    app.use(router);
    const res = await request(app).get("/terra/demographics");
    expect(res.status).toBe(200);
  });

  it("Terra responses include fetchedAt timestamp field", async () => {
    const app = buildAuthApp();
    const router = (await import("../../artifacts/api-server/src/routes/terra")).default;
    app.use(router);
    const res = await request(app).get("/terra/market-intelligence");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("fetchedAt");
    expect(typeof res.body.fetchedAt).toBe("string");
  });
});

// ── Domain: PRISM Counsel ────────────────────────────────────────────────────

describe("Domain: PRISM Counsel", () => {
  it("GET /prism-counsel/health returns 200 with service identifier", async () => {
    const app = buildAuthApp();
    const router = (await import("../../artifacts/api-server/src/routes/prism-counsel-core")).default;
    app.use(router);
    const res = await request(app).get("/prism-counsel/health");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status");
    expect(res.body.status).toBe("ok");
  });

  it("GET /prism-counsel/matters returns 200 with array for authenticated user", async () => {
    const app = buildAuthApp();
    const router = (await import("../../artifacts/api-server/src/routes/prism-counsel-core")).default;
    app.use(router);
    const res = await request(app).get("/prism-counsel/matters");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /prism-counsel/dashboard returns 200 with aggregated fields", async () => {
    const app = buildAuthApp();
    const router = (await import("../../artifacts/api-server/src/routes/prism-counsel-core")).default;
    app.use(router);
    const res = await request(app).get("/prism-counsel/dashboard");
    expect(res.status).toBe(200);
    expect(typeof res.body).toBe("object");
  });

  it("GET /prism-counsel/approvals returns 200 with array", async () => {
    const app = buildAuthApp();
    const router = (await import("../../artifacts/api-server/src/routes/prism-counsel-core")).default;
    app.use(router);
    const res = await request(app).get("/prism-counsel/approvals");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ── Domain: Aegis / Firestorm ─────────────────────────────────────────────────

describe("Domain: Aegis / Firestorm", () => {
  it("GET /firestorm/scenarios returns 200 with array", async () => {
    const app = buildAuthApp();
    const router = (await import("../../artifacts/api-server/src/routes/firestorm")).default;
    app.use(router);
    const res = await request(app).get("/firestorm/scenarios");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /firestorm/incidents returns 200 with array", async () => {
    const app = buildAuthApp();
    const router = (await import("../../artifacts/api-server/src/routes/firestorm")).default;
    app.use(router);
    const res = await request(app).get("/firestorm/incidents");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /firestorm/alerts returns 200 with array", async () => {
    const app = buildAuthApp();
    const router = (await import("../../artifacts/api-server/src/routes/firestorm")).default;
    app.use(router);
    const res = await request(app).get("/firestorm/alerts");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /firestorm/assets returns 200 with array", async () => {
    const app = buildAuthApp();
    const router = (await import("../../artifacts/api-server/src/routes/firestorm")).default;
    app.use(router);
    const res = await request(app).get("/firestorm/assets");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /firestorm/findings returns 200 with array", async () => {
    const app = buildAuthApp();
    const router = (await import("../../artifacts/api-server/src/routes/firestorm")).default;
    app.use(router);
    const res = await request(app).get("/firestorm/findings");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ── Domain: Lyte ─────────────────────────────────────────────────────────────

describe("Domain: Lyte", () => {
  it("GET /lyte/workspaces returns 200 with pagination envelope", async () => {
    const app = buildAuthApp();
    const router = (await import("../../artifacts/api-server/src/routes/lyte")).default;
    app.use(router);
    const res = await request(app).get("/lyte/workspaces");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body).toHaveProperty("meta");
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("GET /lyte/signals returns 200 with pagination envelope", async () => {
    const app = buildAuthApp();
    const router = (await import("../../artifacts/api-server/src/routes/lyte")).default;
    app.use(router);
    const res = await request(app).get("/lyte/signals");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body).toHaveProperty("meta");
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("GET /lyte/incidents returns 200 with pagination envelope", async () => {
    const app = buildAuthApp();
    const router = (await import("../../artifacts/api-server/src/routes/lyte")).default;
    app.use(router);
    const res = await request(app).get("/lyte/incidents");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body).toHaveProperty("meta");
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("GET /lyte/workspaces/:id returns valid HTTP response (200 or 404, not 500)", async () => {
    const app = buildAuthApp();
    const router = (await import("../../artifacts/api-server/src/routes/lyte")).default;
    app.use(router);
    const res = await request(app).get("/lyte/workspaces/1");
    expect([200, 404]).toContain(res.status);
    expect(res.status).not.toBe(500);
  });

  it("GET /lyte/playbooks returns 200 with pagination envelope", async () => {
    const app = buildAuthApp();
    const router = (await import("../../artifacts/api-server/src/routes/lyte")).default;
    app.use(router);
    const res = await request(app).get("/lyte/playbooks");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body).toHaveProperty("meta");
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

// ── Domain: Carlota Jo ───────────────────────────────────────────────────────

describe("Domain: Carlota Jo", () => {
  const cleanupInquiryIds: number[] = [];

  it("GET /booking/inquiries returns 200 with pagination envelope for authenticated user", async () => {
    const app = buildAuthApp();
    const router = (await import("../../artifacts/api-server/src/routes/carlota-jo")).default;
    app.use(router);
    const res = await request(app).get("/booking/inquiries");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body).toHaveProperty("meta");
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("POST /booking/inquiries returns 200 with created record for valid payload", async () => {
    const app = createTestApp();
    const router = (await import("../../artifacts/api-server/src/routes/carlota-jo")).default;
    app.use(router);
    const res = await request(app)
      .post("/booking/inquiries")
      .send({
        name: "Jane Smith",
        email: "jane@example.com",
        message: "Integration test inquiry for smoke testing",
      });
    expect([200, 201]).toContain(res.status);
    const inquiryId: number | undefined = res.body?.inquiryId ?? res.body?.id;
    if (typeof inquiryId === "number") cleanupInquiryIds.push(inquiryId);
  });

  it("POST /booking/inquiries returns 400 when required fields are missing", async () => {
    const app = createTestApp();
    const router = (await import("../../artifacts/api-server/src/routes/carlota-jo")).default;
    app.use(router);
    const res = await request(app)
      .post("/booking/inquiries")
      .send({ name: "Incomplete" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("GET /booking/services returns 200 with pagination envelope", async () => {
    const app = buildAuthApp();
    const router = (await import("../../artifacts/api-server/src/routes/carlota-jo")).default;
    app.use(router);
    const res = await request(app).get("/booking/services");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body).toHaveProperty("meta");
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  afterAll(async () => {
    if (cleanupInquiryIds.length > 0) {
      const { pool } = await import("@szl-holdings/db");
      for (const id of cleanupInquiryIds) {
        await pool.query("DELETE FROM carlota_inquiries WHERE id = $1", [id]);
      }
    }
  });
});

// ── Domain: SZL Holdings ─────────────────────────────────────────────────────

describe("Domain: SZL Holdings", () => {
  it("GET /holdings/health returns 200 with status ok", async () => {
    const app = buildAuthApp();
    const router = (await import("../../artifacts/api-server/src/routes/holdings")).default;
    app.use(router);
    const res = await request(app).get("/holdings/health");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status");
    expect(res.body.status).toBe("ok");
  });

  it("GET /holdings/ventures returns 200 with pagination envelope", async () => {
    const app = buildAuthApp();
    const router = (await import("../../artifacts/api-server/src/routes/holdings")).default;
    app.use(router);
    const res = await request(app).get("/holdings/ventures");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body).toHaveProperty("meta");
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("GET /holdings/milestones returns 200 with pagination envelope", async () => {
    const app = buildAuthApp();
    const router = (await import("../../artifacts/api-server/src/routes/holdings")).default;
    app.use(router);
    const res = await request(app).get("/holdings/milestones");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("GET /holdings/leadership returns 200 with array or envelope", async () => {
    const app = buildAuthApp();
    const router = (await import("../../artifacts/api-server/src/routes/holdings")).default;
    app.use(router);
    const res = await request(app).get("/holdings/leadership");
    expect(res.status).toBe(200);
    const isArray = Array.isArray(res.body);
    const hasDataArray = res.body && Array.isArray(res.body.data);
    expect(isArray || hasDataArray).toBe(true);
  });

  it("GET /holdings/metrics returns 200 with pagination envelope", async () => {
    const app = buildAuthApp();
    const router = (await import("../../artifacts/api-server/src/routes/holdings")).default;
    app.use(router);
    const res = await request(app).get("/holdings/metrics");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("GET /holdings/kpis returns 200 with KPI object", async () => {
    const app = buildAuthApp();
    const router = (await import("../../artifacts/api-server/src/routes/holdings")).default;
    app.use(router);
    const res = await request(app).get("/holdings/kpis");
    expect(res.status).toBe(200);
  });
});

// ── Cross-Domain: Response shape contracts ───────────────────────────────────

describe("Cross-Domain: Response shape contracts", () => {
  it("Lyte domain uses paginated envelope {data, meta} while Vessels uses plain arrays", async () => {
    const lyteApp = buildAuthApp();
    const lyteRouter = (await import("../../artifacts/api-server/src/routes/lyte")).default;
    lyteApp.use(lyteRouter);

    const vesselsApp = buildAuthApp();
    const vesselsRouter = (await import("../../artifacts/api-server/src/routes/vessels")).default;
    vesselsApp.use(vesselsRouter);

    const [lyteRes, vesselsRes] = await Promise.all([
      request(lyteApp).get("/lyte/workspaces"),
      request(vesselsApp).get("/vessels/fleets"),
    ]);

    expect(lyteRes.status).toBe(200);
    expect(lyteRes.body).toHaveProperty("data");
    expect(lyteRes.body).toHaveProperty("meta");

    expect(vesselsRes.status).toBe(200);
    expect(Array.isArray(vesselsRes.body)).toBe(true);
  });

  it("PRISM health and Holdings health both return {status: 'ok'}", async () => {
    const prismApp = buildAuthApp();
    const prismRouter = (await import("../../artifacts/api-server/src/routes/prism-counsel-core")).default;
    prismApp.use(prismRouter);

    const holdingsApp = buildAuthApp();
    const holdingsRouter = (await import("../../artifacts/api-server/src/routes/holdings")).default;
    holdingsApp.use(holdingsRouter);

    const [prismRes, holdingsRes] = await Promise.all([
      request(prismApp).get("/prism-counsel/health"),
      request(holdingsApp).get("/holdings/health"),
    ]);

    expect(prismRes.status).toBe(200);
    expect(prismRes.body.status).toBe("ok");

    expect(holdingsRes.status).toBe(200);
    expect(holdingsRes.body.status).toBe("ok");
  });

  it("Terra endpoints always include fetchedAt ISO timestamp for cache busting", async () => {
    const app = buildAuthApp();
    const terraRouter = (await import("../../artifacts/api-server/src/routes/terra")).default;
    app.use(terraRouter);

    const [marketRes, filingRes] = await Promise.all([
      request(app).get("/terra/market-intelligence"),
      request(app).get("/terra/reit-filings"),
    ]);

    for (const res of [marketRes, filingRes]) {
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("fetchedAt");
      expect(() => new Date(res.body.fetchedAt)).not.toThrow();
    }
  });

  it("All list endpoints return HTTP 200 (not 401) when authenticated", async () => {
    const endpoints: Array<{ route: string; path: string }> = [
      { route: "../../artifacts/api-server/src/routes/vessels", path: "/vessels/fleets" },
      { route: "../../artifacts/api-server/src/routes/lyte", path: "/lyte/workspaces" },
      { route: "../../artifacts/api-server/src/routes/firestorm", path: "/firestorm/scenarios" },
      { route: "../../artifacts/api-server/src/routes/holdings", path: "/holdings/ventures" },
    ];

    const results = await Promise.all(
      endpoints.map(async ({ route, path }) => {
        const app = buildAuthApp();
        const router = (await import(route)).default;
        app.use(router);
        return request(app).get(path);
      }),
    );

    for (const res of results) {
      expect(res.status).toBe(200);
    }
  });
});
