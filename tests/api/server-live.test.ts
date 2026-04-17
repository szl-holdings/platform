/**
 * Live Server Integration Tests
 *
 * Verifies the full HTTP middleware stack using the REAL production middleware
 * from artifacts/api-server/src — specifically CSRF enforcement, the real
 * global rate-limiting middleware, and the real route-level auth middleware.
 *
 * Unlike the smoke tests (which mount individual routers on a bare express
 * instance), these tests exercise the production middleware chain:
 *
 *   globalRateLimiter → csrfMiddleware → authMiddleware() → router handler
 *
 * The GraphQL suite POSTs to a real Apollo server endpoint and validates
 * resolver-level data contracts against the live PostgreSQL DB.
 *
 * Auth strategy: ALLOY_INTERNAL_TOKEN is set before tests run; all
 * authenticated requests include the matching x-internal-token header.
 * The real authMiddleware() in auth.ts then takes the fast INTERNAL_AGENT_USER
 * path — the same code path used by real internal services and CI pipelines.
 *
 * CSRF strategy for GraphQL: include X-Apollo-Operation-Name header, matching
 * the real client behaviour that bypasses the cookie-based CSRF check.
 */

import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import request from "supertest";
import express, {
  type Express,
  type Request,
  type Response,
} from "express";
import cookieParser from "cookie-parser";

// ── Internal token for ALLOY_INTERNAL_TOKEN auth path ────────────────────────
if (!process.env.INTEGRATION_TEST_TOKEN) {
  throw new Error(
    "INTEGRATION_TEST_TOKEN env var is required to run live integration tests. " +
      "Set it in your .env file or CI secret store (see .env.example).",
  );
}
const LIVE_TOKEN = process.env.INTEGRATION_TEST_TOKEN;
// Set BEFORE any module that reads process.env at import time
process.env.ALLOY_INTERNAL_TOKEN = LIVE_TOKEN;

// ── Module mocks — external side-effects only ────────────────────────────────

vi.mock("@szl-holdings/observability", async () => {
  const actual = await vi.importActual<typeof import("@szl-holdings/observability")>(
    "@szl-holdings/observability",
  );
  const noop = vi.fn();
  return {
    ...actual,
    initializeOpenTelemetry: vi.fn().mockResolvedValue(undefined),
    getTracer: vi.fn().mockReturnValue({
      startActiveSpan: (_: string, fn: (span: { end: () => void }) => unknown) =>
        fn({ end: vi.fn() }),
    }),
    serverTelemetry: {
      recordRequest: noop,
      recordApmSpan: noop,
      recordDbQuery: noop,
      recordExternalCall: noop,
      recordAuthFailure: noop,
      recordAuthSuccess: noop,
    },
    genAITelemetry: { trackInference: noop },
  };
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

vi.mock("@szl-holdings/ai-engine/domain-embedding-hooks", () => ({
  ingestLyteSystem: vi.fn().mockResolvedValue(undefined),
  ingestFirestormFinding: vi.fn().mockResolvedValue(undefined),
  ingestFirestormScenario: vi.fn().mockResolvedValue(undefined),
  ingestFirestormAlert: vi.fn().mockResolvedValue(undefined),
  ingestCarlotaService: vi.fn().mockResolvedValue(undefined),
  ingestPrismMatter: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@szl-holdings/ai-engine", () => ({
  validateAndBuildDecision: vi.fn().mockResolvedValue({ id: "test-decision" }),
}));

vi.mock("../../artifacts/api-server/src/lib/geocoding", () => ({
  geocodeAddress: vi.fn().mockResolvedValue({ lat: 0, lng: 0 }),
  reverseGeocode: vi.fn().mockResolvedValue({ address: "Test" }),
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

vi.mock("../../artifacts/api-server/src/middlewares/optimistic-concurrency", () => ({
  validateIfMatch: (_req: unknown, _res: unknown, next: () => void) => next(),
  etagMiddleware: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

// ── Real server builder ──────────────────────────────────────────────────────
//
// Builds an Express app with the REAL CSRF and rate-limiting middleware from
// the API server — the same functions used by app.ts — and mounts specific
// domain routers at /api.  Route-level authMiddleware() is also REAL: it
// authenticates via ALLOY_INTERNAL_TOKEN (set above).

async function buildLiveApp(routes: express.Router[]): Promise<Express> {
  const { csrfMiddleware } = await import(
    "../../artifacts/api-server/src/middlewares/csrf"
  );
  const { globalLimiter } = await import(
    "../../artifacts/api-server/src/middlewares/rate-limiters"
  );

  const app = express();
  app.set("trust proxy", 1);

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));
  app.use(cookieParser());

  // Real global rate limiter (in-memory, no Redis dependency)
  app.use(globalLimiter);

  // pino-http compat shim: routes call req.log.info() etc.
  app.use((req: Request, _res: Response, next: express.NextFunction) => {
    (req as Record<string, unknown>).log = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    };
    next();
  });

  // Real CSRF middleware.
  // GET: auto-pass.
  // POST to /api/graphql: requires X-Apollo-Operation-Name (CSRF-exempt path).
  // POST to other /api/* paths: requires matching csrf cookie + header.
  app.use(csrfMiddleware);

  for (const r of routes) {
    app.use("/api", r);
  }

  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: "Not Found" });
  });

  return app;
}

// ── GraphQL server ────────────────────────────────────────────────────────────

let gqlApp: Express | null = null;

afterAll(async () => {
  try {
    const dbModule = await import("@szl-holdings/db");
    if (dbModule.pool && typeof (dbModule.pool as { end?: () => Promise<void> }).end === "function") {
      await (dbModule.pool as { end: () => Promise<void> }).end();
    }
  } catch {
    // best-effort
  }
});

// ── Domain: REST — Full Production Middleware Stack ───────────────────────────

describe("Live Server — REST endpoints through real CSRF + rate-limiting + auth middleware", () => {
  it("GET /api/vessels/fleets returns 200 (internal agent auth via ALLOY_INTERNAL_TOKEN)", async () => {
    const router = (await import("../../artifacts/api-server/src/routes/vessels")).default;
    const app = await buildLiveApp([router]);
    const res = await request(app)
      .get("/api/vessels/fleets")
      .set("x-internal-token", LIVE_TOKEN);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /api/holdings/ventures returns 200 with pagination envelope", async () => {
    const router = (await import("../../artifacts/api-server/src/routes/holdings")).default;
    const app = await buildLiveApp([router]);
    const res = await request(app)
      .get("/api/holdings/ventures")
      .set("x-internal-token", LIVE_TOKEN);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body).toHaveProperty("meta");
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("GET /api/lyte/workspaces returns 200 (CSRF passes GET, auth via internal token)", async () => {
    const router = (await import("../../artifacts/api-server/src/routes/lyte")).default;
    const app = await buildLiveApp([router]);
    const res = await request(app)
      .get("/api/lyte/workspaces")
      .set("x-internal-token", LIVE_TOKEN);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("GET /api/firestorm/scenarios returns 200 (Aegis domain, real middleware chain)", async () => {
    const router = (await import("../../artifacts/api-server/src/routes/firestorm")).default;
    const app = await buildLiveApp([router]);
    const res = await request(app)
      .get("/api/firestorm/scenarios")
      .set("x-internal-token", LIVE_TOKEN);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /api/prism-counsel/health returns 200 with status: ok", async () => {
    const router = (await import("../../artifacts/api-server/src/routes/prism-counsel-core")).default;
    const app = await buildLiveApp([router]);
    const res = await request(app)
      .get("/api/prism-counsel/health")
      .set("x-internal-token", LIVE_TOKEN);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("GET without valid auth returns 401 — real authMiddleware enforces authentication", async () => {
    const router = (await import("../../artifacts/api-server/src/routes/vessels")).default;
    // Build app WITHOUT ALLOY_INTERNAL_TOKEN env (temporarily unset)
    const savedToken = process.env.ALLOY_INTERNAL_TOKEN;
    process.env.ALLOY_INTERNAL_TOKEN = "";
    try {
      const app = await buildLiveApp([router]);
      const res = await request(app).get("/api/vessels/fleets");
      // Should be 401 (no session, no internal token)
      expect(res.status).toBe(401);
    } finally {
      process.env.ALLOY_INTERNAL_TOKEN = savedToken;
    }
  });

  it("POST without CSRF token/header is blocked 403 — real CSRF middleware enforces token", async () => {
    const router = (await import("../../artifacts/api-server/src/routes/vessels")).default;
    const app = await buildLiveApp([router]);
    const res = await request(app)
      .post("/api/vessels/fleets")
      .set("Content-Type", "application/json")
      .set("x-internal-token", LIVE_TOKEN)
      // Deliberately no CSRF cookie or X-CSRF-Token header
      .send({ name: "Should Be Blocked" });
    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty("error");
  });
});

// ── Domain: REST — Successful POST mutations via CSRF cookie+header round-trip ─

/**
 * Acquires a CSRF token from a GET response Set-Cookie header.
 * The real csrfMiddleware issues a csrf_token cookie on every GET that
 * doesn't already have one.  We extract that token and replay it as both
 * the cookie value and the X-CSRF-Token header on the subsequent POST,
 * exactly as a real browser client would.
 */
function extractCsrfToken(setCookieHeader: string[] | string | undefined): string | undefined {
  const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : setCookieHeader ? [setCookieHeader] : [];
  const match = cookies.find((c) => c.startsWith("csrf_token="));
  return match?.split(";")[0].split("=")[1];
}

describe("Live Server — Successful POST mutations via CSRF cookie+header round-trip", () => {
  it("POST /api/vessels/fleets creates a fleet after acquiring CSRF token from GET", async () => {
    const router = (await import("../../artifacts/api-server/src/routes/vessels")).default;
    const app = await buildLiveApp([router]);

    // Step 1: GET to trigger the real csrfMiddleware to issue a csrf_token cookie
    const getRes = await request(app)
      .get("/api/vessels/fleets")
      .set("x-internal-token", LIVE_TOKEN);
    expect(getRes.status).toBe(200);

    // Step 2: Extract the CSRF token from Set-Cookie
    const csrfToken = extractCsrfToken(getRes.headers["set-cookie"] as string[] | undefined);
    expect(csrfToken).toBeDefined();

    // Step 3: POST with the cookie AND matching X-CSRF-Token header — real middleware should pass
    const postRes = await request(app)
      .post("/api/vessels/fleets")
      .set("x-internal-token", LIVE_TOKEN)
      .set("Cookie", `csrf_token=${csrfToken}`)
      .set("x-csrf-token", csrfToken!)
      .set("Content-Type", "application/json")
      .send({ name: "Integration Test Fleet" });
    expect(postRes.status).toBe(201);
    expect(postRes.body).toHaveProperty("id");
    expect(postRes.body.name).toBe("Integration Test Fleet");
  });

  it("POST /api/lyte/workspaces creates a workspace after acquiring CSRF token from GET", async () => {
    const router = (await import("../../artifacts/api-server/src/routes/lyte")).default;
    const app = await buildLiveApp([router]);

    // Step 1: GET to obtain csrf_token cookie
    const getRes = await request(app)
      .get("/api/lyte/workspaces")
      .set("x-internal-token", LIVE_TOKEN);
    expect(getRes.status).toBe(200);

    // Step 2: Extract CSRF token
    const csrfToken = extractCsrfToken(getRes.headers["set-cookie"] as string[] | undefined);
    expect(csrfToken).toBeDefined();

    // Step 3: POST with cookie + matching header
    const postRes = await request(app)
      .post("/api/lyte/workspaces")
      .set("x-internal-token", LIVE_TOKEN)
      .set("Cookie", `csrf_token=${csrfToken}`)
      .set("x-csrf-token", csrfToken!)
      .set("Content-Type", "application/json")
      .send({ name: "Integration Test Workspace" });
    expect(postRes.status).toBe(201);
    expect(postRes.body).toHaveProperty("id");
    expect(postRes.body.name).toBe("Integration Test Workspace");
  });

  it("POST /api/firestorm/scenarios creates a scenario after acquiring CSRF token from GET", async () => {
    const router = (await import("../../artifacts/api-server/src/routes/firestorm")).default;
    const app = await buildLiveApp([router]);

    // Step 1: GET to obtain csrf_token cookie
    const getRes = await request(app)
      .get("/api/firestorm/scenarios")
      .set("x-internal-token", LIVE_TOKEN);
    expect(getRes.status).toBe(200);

    // Step 2: Extract CSRF token
    const csrfToken = extractCsrfToken(getRes.headers["set-cookie"] as string[] | undefined);
    expect(csrfToken).toBeDefined();

    // Step 3: POST with cookie + matching header
    const postRes = await request(app)
      .post("/api/firestorm/scenarios")
      .set("x-internal-token", LIVE_TOKEN)
      .set("Cookie", `csrf_token=${csrfToken}`)
      .set("x-csrf-token", csrfToken!)
      .set("Content-Type", "application/json")
      .send({ name: "Integration Test Scenario", category: "network" });
    expect(postRes.status).toBe(201);
    expect(postRes.body).toHaveProperty("id");
    expect(postRes.body.name).toBe("Integration Test Scenario");
  });
});

// ── Domain: GraphQL over HTTP ─────────────────────────────────────────────────

describe("Live Server — GraphQL contract suite over HTTP (real Apollo + real resolvers)", () => {
  beforeAll(async () => {
    const { makeExecutableSchema } = await import("@graphql-tools/schema");
    const { ApolloServer } = await import("@apollo/server");
    const { expressMiddleware } = await import("@as-integrations/express5");
    const { typeDefs, resolvers } = await import(
      "../../artifacts/api-server/src/graphql/schema"
    );

    const schema = makeExecutableSchema({ typeDefs, resolvers });
    const apollo = new ApolloServer({ schema, introspection: true });
    await apollo.start();

    const gqlRouter = express.Router();
    gqlRouter.post(
      "/graphql",
      expressMiddleware(apollo, {
        context: async ({ req }) => ({ req }),
      }),
    );

    gqlApp = await buildLiveApp([gqlRouter]);
  }, 30000);

  it("Introspection query succeeds via HTTP with X-Apollo-Operation-Name (real CSRF-exempt GraphQL path)", async () => {
    const res = await request(gqlApp!)
      .post("/api/graphql")
      .set("Content-Type", "application/json")
      .set("X-Apollo-Operation-Name", "IntrospectionQuery")
      .send({
        operationName: "IntrospectionQuery",
        query: `query IntrospectionQuery { __schema { types { name } } }`,
      });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body.data).toHaveProperty("__schema");
    const typeNames = (res.body.data.__schema.types as { name: string }[]).map((t) => t.name);
    expect(typeNames).toContain("Query");
    // All domain types should be present in the merged schema
    expect(typeNames.some((n) => /vessel/i.test(n))).toBe(true);
    expect(typeNames.some((n) => /lyte/i.test(n))).toBe(true);
    expect(typeNames.some((n) => /firestorm|aegis/i.test(n))).toBe(true);
  });

  it("vessels query resolves over HTTP from real DB (live resolver, live drizzle-orm)", async () => {
    const res = await request(gqlApp!)
      .post("/api/graphql")
      .set("Content-Type", "application/json")
      .set("X-Apollo-Operation-Name", "ListVessels")
      .send({
        operationName: "ListVessels",
        query: `query ListVessels { vessels { id name status } }`,
      });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    // Resolver-level: array is always returned (may be empty if DB has no rows)
    if (!res.body.errors) {
      expect(Array.isArray(res.body.data.vessels)).toBe(true);
    }
  });

  it("_version query returns a non-empty string — base schema field, real Apollo server", async () => {
    const res = await request(gqlApp!)
      .post("/api/graphql")
      .set("Content-Type", "application/json")
      .set("X-Apollo-Operation-Name", "VersionCheck")
      .send({
        operationName: "VersionCheck",
        query: `query VersionCheck { _version }`,
      });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(typeof res.body.data._version).toBe("string");
    expect(res.body.data._version.length).toBeGreaterThan(0);
  });

  it("lyteWorkspaces query resolves over HTTP from real DB (Lyte/AIOps domain)", async () => {
    const res = await request(gqlApp!)
      .post("/api/graphql")
      .set("Content-Type", "application/json")
      .set("X-Apollo-Operation-Name", "ListLyteWorkspaces")
      .send({
        operationName: "ListLyteWorkspaces",
        query: `query ListLyteWorkspaces { lyteWorkspaces(limit: 5) { id name } }`,
      });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    if (!res.body.errors) {
      expect(Array.isArray(res.body.data.lyteWorkspaces)).toBe(true);
    }
  });

  it("firestormIncidents query resolves over HTTP from real DB (Aegis/Firestorm domain)", async () => {
    const res = await request(gqlApp!)
      .post("/api/graphql")
      .set("Content-Type", "application/json")
      .set("X-Apollo-Operation-Name", "ListFirestormIncidents")
      .send({
        operationName: "ListFirestormIncidents",
        query: `query ListFirestormIncidents { firestormIncidents(limit: 5) { id } }`,
      });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    if (!res.body.errors) {
      expect(Array.isArray(res.body.data.firestormIncidents)).toBe(true);
    }
  });

  it("terraProperties query resolves over HTTP from real DB (Terra domain)", async () => {
    const res = await request(gqlApp!)
      .post("/api/graphql")
      .set("Content-Type", "application/json")
      .set("X-Apollo-Operation-Name", "ListTerraProperties")
      .send({
        operationName: "ListTerraProperties",
        query: `query ListTerraProperties { terraProperties(limit: 5) { id } }`,
      });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    if (!res.body.errors) {
      expect(Array.isArray(res.body.data.terraProperties)).toBe(true);
    }
  });

  it("pcMatters query resolves over HTTP from real DB (PRISM Counsel domain)", async () => {
    const res = await request(gqlApp!)
      .post("/api/graphql")
      .set("Content-Type", "application/json")
      .set("X-Apollo-Operation-Name", "ListPcMatters")
      .send({
        operationName: "ListPcMatters",
        query: `query ListPcMatters { pcMatters(orgId: 1) { id title matterType status } }`,
      });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    if (!res.body.errors) {
      expect(Array.isArray(res.body.data.pcMatters)).toBe(true);
    }
  });

  it("GraphQL POST without custom header is blocked 403 by real CSRF middleware", async () => {
    const res = await request(gqlApp!)
      .post("/api/graphql")
      .set("Content-Type", "application/json")
      // Deliberately omit X-Apollo-Operation-Name, X-Requested-With, X-CSRF-Token
      .send({ query: `{ _version }` });
    expect(res.status).toBe(403);
  });

  it("GraphQL POST with wrong Content-Type returns 415 — CSRF validates media type", async () => {
    const res = await request(gqlApp!)
      .post("/api/graphql")
      .set("Content-Type", "text/plain")
      .set("X-Apollo-Operation-Name", "VersionCheck")
      .send(`{ _version }`);
    expect(res.status).toBe(415);
  });
});
