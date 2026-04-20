/**
 * Route-Level Security Integration Tests
 *
 * Verifies that each of the four key mutation routes enforces two security
 * invariants end-to-end:
 *
 *  (A) 401 — unauthenticated requests are blocked by globalAuthEnforcer before
 *            they ever reach the route handler. Tested by mounting the REAL router
 *            alongside globalAuthEnforcer so the full middleware chain is wired.
 *
 *  (B) 400 — malformed / missing-field payloads are rejected by the validateBody
 *            middleware with status 400, a human-readable error message, and a
 *            structured `details.issues` array (path + message + code per field),
 *            not a 500 from undefined data inside the handler.
 *
 * Routes under test:
 *   POST /api/ml/features/compute                            (ml-pipeline)
 *   POST /api/monte-carlo/simulate                           (monte-carlo)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import type { Router as ExpressRouter } from "express";
import request from "supertest";

// ---------------------------------------------------------------------------
// Module mocks — must be declared before any dynamic imports
// ---------------------------------------------------------------------------

vi.mock("@szl-holdings/observability", async () => {
  const m = await import("./helpers/mocks.js");
  return m.createObservabilityMock();
});

// Generic DB mock — covers every table/function exported from the package.
// Route handlers are never reached in these tests (401 or 400 fires first),
// so the DB chain just needs to be importable and return promises.
vi.mock("@szl-holdings/db", async () => {
  const m = await import("./helpers/mocks.js");
  return m.createDbMock();
});

vi.mock("@szl-holdings/forge-runtime", async () => {
  const m = await import("./helpers/mocks.js");
  return m.createForgeRuntimeMock();
});

vi.mock("@szl-holdings/ai-engine", () => ({
  ModelLifecycle: {},
}));

vi.mock("@szl-holdings/constellation", () => ({
  lyteAdapter: { upsertEntity: vi.fn(async () => ({})) },
}));

vi.mock("../lib/logger.js", async () => {
  const m = await import("./helpers/mocks.js");
  return m.createLoggerMock();
});

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

vi.mock("../lib/monte-carlo-service.js", () => ({
  listScenarios: vi.fn(() => []),
  getScenario: vi.fn((id: string) =>
    id === "test-scenario"
      ? { id, title: "Test", domain: "test", inputs: [], outputs: [] }
      : undefined,
  ),
  getVariants: vi.fn(() => []),
  startSimulationJob: vi.fn(() => ({
    jobId: "job-1",
    status: "running",
    scenarioId: "test-scenario",
    config: {},
    createdAt: new Date().toISOString(),
  })),
  startCustomSimulationJob: vi.fn(() => ({
    jobId: "job-2",
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

vi.mock("../lib/websocket.js", async () => {
  const m = await import("./helpers/mocks.js");
  return m.createWebsocketMock();
});

// ---------------------------------------------------------------------------
// authMiddleware mock
//
// For 401 tests the mock is irrelevant — globalAuthEnforcer fires first and
// returns 401 before any route handler (including its authMiddleware) runs.
//
// For 400 tests the mock injects a valid user so auth passes, then
// validateBody rejects the malformed payload before the handler runs.
// ---------------------------------------------------------------------------

vi.mock("../middlewares/auth.js", async () => {
  const m = await import("./helpers/mocks.js");
  return m.createAuthMiddlewareMock({
    id: 99,
    email: "tester@example.com",
    roles: ["member"],
    orgs: [{ orgId: 1, orgSlug: "test-org", orgName: "Test Org", role: "member" }],
  });
});

// ---------------------------------------------------------------------------
// Dynamic imports after all mocks are in place
// ---------------------------------------------------------------------------

const { globalAuthEnforcer } = await import("../middlewares/global-auth-enforcer.js");
const { default: mlPipelineRouter } = await import("../routes/ml-pipeline.js");
const { default: monteCarloRouter } = await import("../routes/monte-carlo.js");

// Import mocked service modules to access spy call counts in fail-fast tests
const { featureStoreService } = await import("../lib/ml-pipeline-service.js");
const { startSimulationJob } = await import("../lib/monte-carlo-service.js");

// ---------------------------------------------------------------------------
// Helper types
// ---------------------------------------------------------------------------

interface ValidationErrorBody {
  error: string;
  code: string;
  details?: {
    issues: Array<{ path: (string | number)[]; message: string; code: string }>;
  };
}

// ---------------------------------------------------------------------------
// Helper: build an Express app that mounts globalAuthEnforcer + a real router.
// The router is placed under /api to match the production path where
// globalAuthEnforcer's /api check fires.
// ---------------------------------------------------------------------------

function buildRouteApp(router: ExpressRouter, mountPrefix: string) {
  const app = express();
  app.use(express.json());
  app.use(globalAuthEnforcer as express.RequestHandler);
  app.use(mountPrefix, router);
  return app;
}

// ---------------------------------------------------------------------------
// Helper: build an app with only the router (no auth enforcer).
// authMiddleware is already mocked to inject a user so the route proceeds
// to validateBody, which fires for 400 tests.
// ---------------------------------------------------------------------------

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

// ===========================================================================
// POST /api/ml/features/compute
// ===========================================================================

describe("POST /api/ml/features/compute — 401 (unauthenticated, real router)", () => {
  // mlPipelineRouter uses full paths starting with /ml/...
  // mounting at /api maps it to /api/ml/...
  const app = buildRouteApp(mlPipelineRouter as unknown as ExpressRouter, "/api");

  it("blocks unauthenticated request with 401", async () => {
    const res = await request(app)
      .post("/api/ml/features/compute")
      .send({ featureId: "f1", domain: "vessels", entityId: "e1", entityType: "vessel", value: 42 });

    expect(res.status).toBe(401);
    expect((res.body as { code: string }).code).toBe("UNAUTHORIZED");
  });
});

describe("POST /ml/features/compute — 400 (malformed payload, structured Zod details)", () => {
  const app = buildAuthBypassApp(mlPipelineRouter as unknown as ExpressRouter);

  beforeEach(() => {
    vi.mocked(featureStoreService.computeFeature).mockClear();
  });

  it("returns 400 with issues when featureId is missing", async () => {
    const res = await request(app)
      .post("/ml/features/compute")
      .send({ domain: "vessels", entityId: "e1", entityType: "vessel", value: 42 });

    expect(res.status).toBe(400);
    const body = res.body as ValidationErrorBody;
    expect(body.error).toMatch(/Validation error/);
    expect(body.code).toBe("BAD_REQUEST");
    expect(Array.isArray(body.details?.issues)).toBe(true);
    const issue = body.details?.issues.find(i => String(i.path[0]) === "featureId");
    expect(issue).toBeDefined();
  });

  it("returns 400 with issues when domain is missing", async () => {
    const res = await request(app)
      .post("/ml/features/compute")
      .send({ featureId: "f1", entityId: "e1", entityType: "vessel", value: 0 });

    expect(res.status).toBe(400);
    const body = res.body as ValidationErrorBody;
    expect(body.details?.issues.some(i => String(i.path[0]) === "domain")).toBe(true);
  });

  it("returns 400 when entityId is missing", async () => {
    const res = await request(app)
      .post("/ml/features/compute")
      .send({ featureId: "f1", domain: "vessels", entityType: "vessel", value: 1 });

    expect(res.status).toBe(400);
    const body = res.body as ValidationErrorBody;
    expect(Array.isArray(body.details?.issues)).toBe(true);
  });

  it("returns 400 for an empty body", async () => {
    const res = await request(app).post("/ml/features/compute").send({});

    expect(res.status).toBe(400);
    const body = res.body as ValidationErrorBody;
    expect(Array.isArray(body.details?.issues)).toBe(true);
    expect((body.details?.issues.length ?? 0) > 0).toBe(true);
  });

  it("returns 400 when featureId exceeds maxLength", async () => {
    const res = await request(app)
      .post("/ml/features/compute")
      .send({
        featureId: "f".repeat(300),
        domain: "vessels",
        entityId: "e1",
        entityType: "vessel",
        value: 1,
      });

    expect(res.status).toBe(400);
    const body = res.body as ValidationErrorBody;
    const issue = body.details?.issues.find(i => String(i.path[0]) === "featureId");
    expect(issue?.code).toBe("too_big");
  });

  it("does not invoke the feature compute service when payload is invalid (fail-fast proof)", async () => {
    await request(app).post("/ml/features/compute").send({ domain: "vessels" });

    // validateBody fires before the handler — the service should never be reached
    expect(vi.mocked(featureStoreService.computeFeature)).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// POST /api/monte-carlo/simulate
// ===========================================================================

describe("POST /api/monte-carlo/simulate — 401 (unauthenticated, real router)", () => {
  // monteCarloRouter uses full paths starting with /monte-carlo/...
  // mounting at /api maps it to /api/monte-carlo/...
  const app = buildRouteApp(monteCarloRouter as unknown as ExpressRouter, "/api");

  it("blocks unauthenticated request with 401", async () => {
    const res = await request(app)
      .post("/api/monte-carlo/simulate")
      .send({ scenarioId: "test-scenario" });

    expect(res.status).toBe(401);
    expect((res.body as { code: string }).code).toBe("UNAUTHORIZED");
  });
});

describe("POST /monte-carlo/simulate — 400 (malformed payload, structured Zod details)", () => {
  const app = buildAuthBypassApp(monteCarloRouter as unknown as ExpressRouter);

  beforeEach(() => {
    vi.mocked(startSimulationJob).mockClear();
  });

  it("returns 400 with issues when scenarioId is missing", async () => {
    const res = await request(app)
      .post("/monte-carlo/simulate")
      .send({ iterations: 5000 });

    expect(res.status).toBe(400);
    const body = res.body as ValidationErrorBody;
    expect(body.error).toMatch(/Validation error/);
    expect(body.code).toBe("BAD_REQUEST");
    expect(Array.isArray(body.details?.issues)).toBe(true);
    const issue = body.details?.issues.find(i => String(i.path[0]) === "scenarioId");
    expect(issue).toBeDefined();
  });

  it("returns 400 with issues when iterations is below minimum", async () => {
    const res = await request(app)
      .post("/monte-carlo/simulate")
      .send({ scenarioId: "test-scenario", iterations: 10 });

    expect(res.status).toBe(400);
    const body = res.body as ValidationErrorBody;
    expect(body.details?.issues.some(i => String(i.path[0]) === "iterations")).toBe(true);
  });

  it("returns 400 when iterations exceeds maximum", async () => {
    const res = await request(app)
      .post("/monte-carlo/simulate")
      .send({ scenarioId: "test-scenario", iterations: 999999 });

    expect(res.status).toBe(400);
    const body = res.body as ValidationErrorBody;
    const issue = body.details?.issues.find(i => String(i.path[0]) === "iterations");
    expect(issue?.code).toBe("too_big");
  });

  it("returns 400 when scenarioId exceeds maxLength", async () => {
    const res = await request(app)
      .post("/monte-carlo/simulate")
      .send({ scenarioId: "s".repeat(300) });

    expect(res.status).toBe(400);
    const body = res.body as ValidationErrorBody;
    const issue = body.details?.issues.find(i => String(i.path[0]) === "scenarioId");
    expect(issue?.code).toBe("too_big");
  });

  it("returns 400 for an empty body", async () => {
    const res = await request(app).post("/monte-carlo/simulate").send({});

    expect(res.status).toBe(400);
    const body = res.body as ValidationErrorBody;
    expect(Array.isArray(body.details?.issues)).toBe(true);
    expect((body.details?.issues.length ?? 0) > 0).toBe(true);
  });

  it("does not invoke startSimulationJob when payload is invalid (fail-fast proof)", async () => {
    await request(app).post("/monte-carlo/simulate").send({ iterations: 5000 });

    // validateBody fires before the handler — the service should never be reached
    expect(vi.mocked(startSimulationJob)).not.toHaveBeenCalled();
  });
});
