/**
 * Rate Limiting & Lockout — Security Regression Tests
 *
 * Covers the sliding-window rate limiters (perUserApiSlidingLimiter,
 * perUserWriteSlidingLimiter) and the simulation-specific limiter on
 * POST /monte-carlo/simulate.
 *
 * Strategy
 * ─────────
 * Sliding-window limiters (PostgreSQL-backed):
 *   A controlled pool mock tracks the in-window hit count via a module-level
 *   counter.  Tests fire N+1 requests against a custom limiter configured with
 *   max=2 so they never touch a real DB.  The mock returns count=N on the
 *   (N+1)th call, which satisfies the `count >= max` guard and triggers 429.
 *
 * simulationLimiter (express-rate-limit, in-memory):
 *   `express-rate-limit` is module-mocked to force max=2.  A fresh app (and
 *   thus a fresh limiter instance) is created in beforeEach for every test so
 *   there is no shared state between tests.  The real `monteCarloRouter` is
 *   also imported and tested to prove the route is actually wired to the
 *   limiter — a regression where the middleware is accidentally removed will
 *   be caught here.
 *
 * For every 429 case the tests also assert that Retry-After (sliding-window)
 * or RateLimit-Reset (express-rate-limit standardHeaders) is present.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import express, { type RequestHandler, type Router as ExpressRouter } from 'express';
import request from "supertest";

// ---------------------------------------------------------------------------
// Controlled pool mock — must be declared via vi.hoisted so vitest hoists it
// above all imports (including the module under test).
// ---------------------------------------------------------------------------

const { mockPoolConnect, setWindowHits, resetWindowHits } = vi.hoisted(() => {
  let windowHits = 0;

  function makeMockClient() {
    return {
      query: vi.fn(async (sql: string) => {
        if (sql.includes("COUNT(*)")) {
          return { rows: [{ count: String(windowHits) }] };
        }
        if (sql.includes("INSERT INTO rate_limit_log")) {
          windowHits++;
          return { rows: [] };
        }
        // BEGIN, COMMIT, pg_advisory_xact_lock, CREATE TABLE, DELETE, etc.
        return { rows: [] };
      }),
      release: vi.fn(),
    };
  }

  const mockPoolConnect = vi.fn(async () => makeMockClient());

  return {
    mockPoolConnect,
    setWindowHits: (n: number) => { windowHits = n; },
    resetWindowHits: () => { windowHits = 0; },
  };
});

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock("@szl-holdings/db", () => ({
  pool: { connect: mockPoolConnect },
}));

// Force express-rate-limit to use max=2 in all test instances so that:
//  a) tests don't need 200+ requests to trigger a 429, and
//  b) the real monteCarloRouter (which calls rateLimit()) is also capped at 2.
vi.mock("express-rate-limit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("express-rate-limit")>();
  const patched = (opts: Parameters<typeof actual.default>[0]) =>
    actual.default({ ...opts, max: 2 });
  return { default: patched, rateLimit: patched };
});

vi.mock("@szl-holdings/observability", async () => {
  const m = await import("./helpers/mocks.js");
  return m.createObservabilityMock();
});

vi.mock("@szl-holdings/forge-runtime", async () => {
  const m = await import("./helpers/mocks.js");
  return m.createForgeRuntimeMock();
});

vi.mock("@szl-holdings/ai-engine", () => ({ ModelLifecycle: {} }));
vi.mock("@szl-holdings/constellation", () => ({
  lyteAdapter: { upsertEntity: vi.fn(async () => ({})) },
}));

vi.mock("../lib/logger.js", async () => {
  const m = await import("./helpers/mocks.js");
  return m.createLoggerMock();
});

vi.mock("../middlewares/auth.js", async () => {
  const m = await import("./helpers/mocks.js");
  return m.createAuthMiddlewareMock({
    id: 42,
    email: "ratelimit-tester@example.com",
    roles: ["member"],
    orgs: [{ orgId: 1, orgSlug: "test-org", orgName: "Test Org", role: "member" }],
  });
});

vi.mock("../lib/websocket.js", async () => {
  const m = await import("./helpers/mocks.js");
  return m.createWebsocketMock();
});

vi.mock("../lib/monte-carlo-service.js", () => ({
  listScenarios: vi.fn(() => []),
  getScenario: vi.fn((id: string) =>
    id === "s1" ? { id, title: "Test", domain: "test", inputs: [], outputs: [] } : undefined,
  ),
  getVariants: vi.fn(() => []),
  startSimulationJob: vi.fn(() => ({
    jobId: "job-test",
    status: "running",
    scenarioId: "s1",
    config: {},
    createdAt: new Date().toISOString(),
  })),
  startCustomSimulationJob: vi.fn(() => ({
    jobId: "job-custom",
    status: "running",
    scenarioId: "custom",
    config: {},
    createdAt: new Date().toISOString(),
  })),
  getJob: vi.fn(() => null),
  listJobs: vi.fn(() => []),
  runComparison: vi.fn(async () => ({})),
  runCalibrationCheck: vi.fn(() => ({})),
  runBacktest: vi.fn(() => ({})),
  cleanupOldJobs: vi.fn(),
  validateSerializableScenario: vi.fn(() => true),
}));

vi.mock("../services/prism-queue.js", () => ({
  enqueuePrismJob: vi.fn(async () => ({ id: 1 })),
  PRISM_JOB_TYPES: { EXTRACT: "extract", GENERATE: "generate" },
  getJobStats: vi.fn(async () => ({})),
  replayDeadLetterEvent: vi.fn(async () => 1),
}));

vi.mock("../services/prism-connectors.js", () => ({
  getConnectorHealth: vi.fn(async () => ({})),
  triggerSync: vi.fn(async () => ({})),
  getConnectorSyncHistory: vi.fn(async () => []),
}));

vi.mock("../services/prism-document-pipeline.js", () => ({
  getDocumentPipelineStats: vi.fn(async () => ({})),
  getDocumentsForMatter: vi.fn(async () => []),
}));

vi.mock("../lib/ny-forecast-engine.js", () => ({
  runAllForecasts: vi.fn(async () => ({})),
  runSingleForecast: vi.fn(async () => ({})),
}));

vi.mock("../lib/ml-pipeline-service.js", () => ({
  featureStoreService: {
    getDefinitions: vi.fn(() => []),
    getCatalog: vi.fn(() => ({})),
    computeFeature: vi.fn(() => ({})),
    getFeatureVector: vi.fn(() => ({})),
  },
  trainingService: { createRun: vi.fn(async () => ({})), getRun: vi.fn(() => null), listRuns: vi.fn(() => []) },
  modelRegistryService: { register: vi.fn(async () => ({})), getModel: vi.fn(() => null), listModels: vi.fn(() => []) },
  inferenceService: { predict: vi.fn(async () => ({})), batchPredict: vi.fn(async () => ({})) },
  monitoringService: { getDrift: vi.fn(() => ({})), getAlerts: vi.fn(() => []) },
  abTestingService: { create: vi.fn(async () => ({})), list: vi.fn(() => []) },
  explainabilityService: { explain: vi.fn(async () => ({})) },
  datasetService: { create: vi.fn(async () => ({})), get: vi.fn(() => null), list: vi.fn(() => []) },
  domainTemplatesService: { list: vi.fn(() => []), get: vi.fn(() => null) },
  getMlPipelineStatus: vi.fn(() => ({ status: "ok" })),
}));

// ---------------------------------------------------------------------------
// Dynamic imports (after all mocks are in place)
// ---------------------------------------------------------------------------

const { createSlidingWindowLimiter } = await import(
  "../middlewares/sliding-window-limiter.js"
);
const { default: monteCarloRouter } = await import("../routes/monte-carlo.js");

import rateLimit from "express-rate-limit";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Minimal app wrapping a single limiter middleware + 200 handler.
function buildLimiterApp(limiter: RequestHandler) {
  const app = express();
  app.use(express.json());
  app.get("/probe", limiter, (_req, res) => res.json({ ok: true }));
  app.post("/probe", limiter, (_req, res) => res.json({ ok: true }));
  return app;
}

// Auth-bypass app — mirrors the helper in security-routes.test.ts.
function buildAuthBypassApp(router: ExpressRouter, mountPrefix = "") {
  const app = express();
  app.use(express.json());
  if (mountPrefix) {
    app.use(mountPrefix, router);
  } else {
    app.use(router);
  }
  return app;
}

const MAX = 2; // shared ceiling for sliding-window custom limiters

// ===========================================================================
// Sliding-window — READ path  (failOpen: true)
// ===========================================================================

describe("Sliding-window rate limiter — read path (failOpen: true)", () => {
  const readLimiter = createSlidingWindowLimiter({
    windowMs: 60_000,
    max: MAX,
    endpointGroup: "test-read",
    failOpen: true,
    message: { error: "Read rate limit exceeded." },
  });

  const app = buildLimiterApp(readLimiter);

  beforeEach(() => {
    resetWindowHits();
    mockPoolConnect.mockClear();
  });

  it("allows the first request through (count = 0 < max)", async () => {
    const res = await request(app).get("/probe");
    expect(res.status).toBe(200);
  });

  it("allows request when count equals max - 1", async () => {
    setWindowHits(MAX - 1);
    const res = await request(app).get("/probe");
    expect(res.status).toBe(200);
  });

  it("returns 429 when in-window count equals max", async () => {
    setWindowHits(MAX);
    const res = await request(app).get("/probe");
    expect(res.status).toBe(429);
  });

  it("includes Retry-After header on 429", async () => {
    setWindowHits(MAX);
    const res = await request(app).get("/probe");
    expect(res.status).toBe(429);
    const retryAfter = Number(res.headers["retry-after"]);
    expect(Number.isFinite(retryAfter) && retryAfter > 0).toBe(true);
  });

  it("returns RATE_LIMITED error code on 429", async () => {
    setWindowHits(MAX);
    const res = await request(app).get("/probe");
    expect(res.status).toBe(429);
    expect((res.body as { code: string }).code).toBe("RATE_LIMITED");
  });

  it("fires N+1 sequential requests and only the last one is blocked", async () => {
    const results: number[] = [];
    for (let i = 0; i < MAX + 1; i++) {
      const res = await request(app).get("/probe");
      results.push(res.status);
    }
    for (let i = 0; i < MAX; i++) {
      expect(results[i]).toBe(200);
    }
    expect(results[MAX]).toBe(429);
  });

  it("sets X-RateLimit-Limit header matching the configured max", async () => {
    const res = await request(app).get("/probe");
    expect(Number(res.headers["x-ratelimit-limit"])).toBe(MAX);
  });

  it("sets X-RateLimit-Remaining to 0 when limit is reached", async () => {
    setWindowHits(MAX);
    const res = await request(app).get("/probe");
    expect(res.status).toBe(429);
    expect(Number(res.headers["x-ratelimit-remaining"])).toBe(0);
  });
});

// ===========================================================================
// Sliding-window — WRITE path  (failOpen: false)
// ===========================================================================

describe("Sliding-window rate limiter — write path (failOpen: false)", () => {
  const writeLimiter = createSlidingWindowLimiter({
    windowMs: 60_000,
    max: MAX,
    endpointGroup: "test-write",
    failOpen: false,
    message: { error: "Write rate limit exceeded." },
  });

  const app = buildLimiterApp(writeLimiter);

  beforeEach(() => {
    resetWindowHits();
    mockPoolConnect.mockClear();
  });

  it("allows write requests below the limit", async () => {
    const res = await request(app).post("/probe").send({});
    expect(res.status).toBe(200);
  });

  it("returns 429 on write when in-window count equals max", async () => {
    setWindowHits(MAX);
    const res = await request(app).post("/probe").send({});
    expect(res.status).toBe(429);
  });

  it("includes Retry-After header on write-path 429", async () => {
    setWindowHits(MAX);
    const res = await request(app).post("/probe").send({});
    expect(res.status).toBe(429);
    const retryAfter = Number(res.headers["retry-after"]);
    expect(Number.isFinite(retryAfter) && retryAfter > 0).toBe(true);
  });

  it("returns RATE_LIMITED error code on write-path 429", async () => {
    setWindowHits(MAX);
    const res = await request(app).post("/probe").send({});
    expect(res.status).toBe(429);
    expect((res.body as { code: string }).code).toBe("RATE_LIMITED");
  });

  it("fires N+1 sequential POST requests and only the last one is blocked", async () => {
    const results: number[] = [];
    for (let i = 0; i < MAX + 1; i++) {
      const res = await request(app).post("/probe").send({});
      results.push(res.status);
    }
    for (let i = 0; i < MAX; i++) {
      expect(results[i]).toBe(200);
    }
    expect(results[MAX]).toBe(429);
  });

  it("returns 503 (not 429) when DB is unavailable and failOpen is false", async () => {
    mockPoolConnect.mockRejectedValueOnce(new Error("DB connection refused"));
    const res = await request(app).post("/probe").send({});
    expect(res.status).toBe(503);
  });
});

// ===========================================================================
// simulationLimiter — express-rate-limit behaviour (standalone)
// ===========================================================================
//
// A fresh rateLimit() instance (max forced to 2 by the module mock above) is
// created per test via beforeEach so each test runs against a clean in-memory
// store — no shared state, no order-dependence.

describe("simulationLimiter — express-rate-limit behaviour (standalone, per-test isolation)", () => {
  let app: ReturnType<typeof express>;

  beforeEach(() => {
    // Re-create limiter + app for every test so the in-memory counter resets.
    const testLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: "Too many simulation requests. Please try again later." },
    }) as unknown as RequestHandler;

    app = express();
    app.use(express.json());
    app.post("/monte-carlo/simulate", testLimiter, (_req, res) => {
      res.json({ ok: true });
    });
  });

  it("allows the first simulation request through", async () => {
    const res = await request(app)
      .post("/monte-carlo/simulate")
      .send({ scenarioId: "s1" });
    expect(res.status).toBe(200);
  });

  it("returns 429 after N+1 requests exceed the simulation limit", async () => {
    const results: number[] = [];
    for (let i = 0; i < MAX + 1; i++) {
      const res = await request(app)
        .post("/monte-carlo/simulate")
        .send({ scenarioId: "s1" });
      results.push(res.status);
    }
    for (let i = 0; i < MAX; i++) {
      expect(results[i]).toBe(200);
    }
    expect(results[MAX]).toBe(429);
  });

  it("includes RateLimit-Reset header when limit is exceeded", async () => {
    let lastRes: request.Response | null = null;
    for (let i = 0; i < MAX + 1; i++) {
      lastRes = await request(app)
        .post("/monte-carlo/simulate")
        .send({ scenarioId: "s1" });
    }
    expect(lastRes?.status).toBe(429);
    expect(lastRes?.headers["ratelimit-reset"]).toBeDefined();
  });

  it("returns expected 429 message body from the simulationLimiter", async () => {
    let lastRes: request.Response | null = null;
    for (let i = 0; i < MAX + 1; i++) {
      lastRes = await request(app)
        .post("/monte-carlo/simulate")
        .send({ scenarioId: "s1" });
    }
    expect(lastRes?.status).toBe(429);
    const body = lastRes?.body as { error?: string };
    expect(typeof body.error).toBe("string");
    expect(body.error).toMatch(/simulation/i);
  });

  it("sets RateLimit-Remaining to 0 when the limit is exhausted", async () => {
    let lastRes: request.Response | null = null;
    for (let i = 0; i < MAX + 1; i++) {
      lastRes = await request(app)
        .post("/monte-carlo/simulate")
        .send({ scenarioId: "s1" });
    }
    expect(lastRes?.status).toBe(429);
    expect(Number(lastRes?.headers["ratelimit-remaining"])).toBe(0);
  });
});

// ===========================================================================
// simulationLimiter — REAL monteCarloRouter wiring verification
// ===========================================================================
//
// Uses the actual imported monteCarloRouter (not a reconstructed app) to
// prove the simulationLimiter middleware is actually mounted on the route.
// If the middleware were accidentally removed, this describe block would fail
// because many requests to a valid scenarioId would all return 201, not 429.
// The `express-rate-limit` module mock forces max=2 so the router is tested
// under the exact same middleware code path as production, just with a lower
// ceiling to keep the test fast.
//
// Note: monteCarloRouter is a module-level singleton (cached after first
// import), so the simulationLimiter's in-memory hit counter accumulates across
// tests in this file.  The tests below are designed to be resilient to this:
// they fire MAX+3 requests (well above the max=2 ceiling) and only assert
// that a 429 is reached — not the exact request number on which it occurs.

describe("simulationLimiter — REAL monteCarloRouter route wiring (POST /monte-carlo/simulate)", () => {
  const app = buildAuthBypassApp(monteCarloRouter as unknown as ExpressRouter);

  it("real router eventually returns 429, proving simulationLimiter is wired", async () => {
    const statuses: number[] = [];
    // Fire MAX+3 requests — guaranteed to exhaust max=2 regardless of any
    // prior accumulated state from other tests in this file.
    for (let i = 0; i < MAX + 3; i++) {
      const res = await request(app)
        .post("/monte-carlo/simulate")
        .send({ scenarioId: "s1" });
      statuses.push(res.status);
    }
    expect(statuses).toContain(429);
  });

  it("real router 429 includes RateLimit-Reset from simulationLimiter", async () => {
    let lastRes: request.Response | null = null;
    for (let i = 0; i < MAX + 3; i++) {
      lastRes = await request(app)
        .post("/monte-carlo/simulate")
        .send({ scenarioId: "s1" });
    }
    expect(lastRes?.status).toBe(429);
    expect(lastRes?.headers["ratelimit-reset"]).toBeDefined();
  });

  it("real router 429 carries the simulationLimiter error message", async () => {
    let lastRes: request.Response | null = null;
    for (let i = 0; i < MAX + 3; i++) {
      lastRes = await request(app)
        .post("/monte-carlo/simulate")
        .send({ scenarioId: "s1" });
    }
    expect(lastRes?.status).toBe(429);
    const body = lastRes?.body as { error?: string };
    expect(typeof body.error).toBe("string");
    expect(body.error).toMatch(/simulation/i);
  });
});
