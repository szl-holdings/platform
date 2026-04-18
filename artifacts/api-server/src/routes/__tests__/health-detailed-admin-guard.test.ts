/**
 * /health/detailed Admin Guard — Integration Tests
 *
 * adminGuard is only applied when NODE_ENV or APP_ENV is "production".
 * These tests verify:
 *  - In production mode: unauthenticated → 401, wrong token → 401, correct token → 200
 *  - In non-production mode: endpoint is open (200 without auth)
 *  - envStatus response contains only boolean flags (no raw secret values)
 */

import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import express from "express";
import request from "supertest";

// ---------------------------------------------------------------------------
// Common mocks — must be declared before any dynamic imports
// ---------------------------------------------------------------------------

vi.mock("@szl-holdings/db", () => ({
  pool: { query: vi.fn().mockResolvedValue({ rows: [{ cnt: 42 }] }) },
  db: {
    select: () => { const c: any = {}; c.from = () => c; c.where = () => c; c.innerJoin = () => c; c.orderBy = () => c; c.then = (r: any) => Promise.resolve([]).then(r); return c; },
  },
  orgMembersTable: { orgId: "orgId", userId: "userId" },
  organizationsTable: { id: "id", slug: "slug" },
  ROLE_HIERARCHY: {},
  isReadOnlyRole: () => false,
  toCanonicalRole: (r: string) => r,
}));

vi.mock("@szl-holdings/api-zod", () => ({
  HealthCheckResponse: { parse: (v: unknown) => v },
}));

vi.mock("../../lib/auth", () => ({
  getSessionToken: () => undefined,
  getSessionUser: vi.fn().mockResolvedValue(null),
  SESSION_COOKIE: "sid",
}));

vi.mock("../../lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock("@szl-holdings/observability", () => ({
  serverTelemetry: { recordAuthFailure: vi.fn(), recordRequest: vi.fn() },
}));

vi.mock("../../lib/backup-service", () => ({
  getBackupHealthStatus: () => ({
    status: "ok",
    lastBackupAt: null,
    lastBackupSizeBytes: 0,
    ageHours: null,
    warning: null,
    totalBackups: 0,
    details: [],
  }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildApp(router: express.Router): express.Express {
  const app = express();
  app.use(express.json());
  app.use(router);
  return app;
}

// ---------------------------------------------------------------------------
// Production-mode tests — dynamically import after setting production env
// ---------------------------------------------------------------------------

describe("GET /health/detailed — production mode (APP_ENV=production)", () => {
  let productionRouter: express.Router;
  const originalAppEnv = process.env.APP_ENV;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeAll(async () => {
    // Set production env BEFORE importing — productionAdminGuard is evaluated at import time
    process.env.APP_ENV = "production";
    delete (process.env as Record<string, string | undefined>).NODE_ENV;
    vi.resetModules();
    // Re-apply mocks after reset (vi.mock factory functions are hoisted so they survive resetModules)
    productionRouter = ((await import("../health.js")) as { default: express.Router }).default;
  });

  afterAll(() => {
    process.env.APP_ENV = originalAppEnv;
    if (originalNodeEnv !== undefined) process.env.NODE_ENV = originalNodeEnv;
    vi.resetModules();
  });

  it("returns 401 for unauthenticated requests (no session, no internal token)", async () => {
    delete (process.env as Record<string, string | undefined>).ALLOY_INTERNAL_TOKEN;
    const app = buildApp(productionRouter);
    const res = await request(app).get("/health/detailed");
    expect(res.status).toBe(401);
  });

  it("returns 401 for requests with the wrong internal token", async () => {
    const correct = "correct-service-token-32-chars!!";
    const wrong   = "WRONG---service-token-32-chars!!";
    process.env.ALLOY_INTERNAL_TOKEN = correct;
    const app = buildApp(productionRouter);
    const res = await request(app).get("/health/detailed").set("x-internal-token", wrong);
    expect(res.status).toBe(401);
  });

  it("returns 200 with diagnostics for the correct internal token", async () => {
    const token = "correct-service-token-32-chars!!";
    process.env.ALLOY_INTERNAL_TOKEN = token;
    const app = buildApp(productionRouter);
    const res = await request(app).get("/health/detailed").set("x-internal-token", token);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status");
    expect(res.body).toHaveProperty("database");
    expect(res.body).toHaveProperty("envStatus");
  });

  it("envStatus values are all booleans — no raw secret values leaked", async () => {
    const token = "correct-service-token-32-chars!!";
    process.env.ALLOY_INTERNAL_TOKEN = token;
    const app = buildApp(productionRouter);
    const res = await request(app).get("/health/detailed").set("x-internal-token", token);
    expect(res.status).toBe(200);
    for (const [, val] of Object.entries(res.body.envStatus as Record<string, unknown>)) {
      expect(typeof val).toBe("boolean");
    }
  });
});

// ---------------------------------------------------------------------------
// Non-production mode — endpoint accessible without credentials
// ---------------------------------------------------------------------------

describe("GET /health/detailed — non-production mode (NODE_ENV=test)", () => {
  let devRouter: express.Router;
  const originalNodeEnv = process.env.NODE_ENV;
  const originalAppEnv = process.env.APP_ENV;

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    delete (process.env as Record<string, string | undefined>).APP_ENV;
    vi.resetModules();
    devRouter = ((await import("../health.js")) as { default: express.Router }).default;
  });

  afterAll(() => {
    if (originalNodeEnv !== undefined) process.env.NODE_ENV = originalNodeEnv;
    process.env.APP_ENV = originalAppEnv;
    vi.resetModules();
  });

  it("returns 200 without credentials in development mode", async () => {
    delete (process.env as Record<string, string | undefined>).ALLOY_INTERNAL_TOKEN;
    const app = buildApp(devRouter);
    const res = await request(app).get("/health/detailed");
    expect(res.status).toBe(200);
  });
});
