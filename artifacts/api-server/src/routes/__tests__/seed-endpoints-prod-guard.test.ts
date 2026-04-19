/**
 * Seed Endpoints Production Guard — Integration Tests
 *
 * Verifies that all seven other seed/demo-data endpoints are blocked when the
 * runtime environment is production (NODE_ENV or APP_ENV === "production"),
 * mirroring the existing guard on POST /firestorm/seed.
 *
 * The guard returns HTTP 404 with body `{ code: "SEED_DISABLED_IN_PRODUCTION" }`,
 * matching the response shape used by the firestorm seed guard for consistency.
 *
 * Each route module is imported via vi.mock-stubbed dependencies so the real
 * production-guard code path is exercised without touching DBs, AI engines,
 * object storage, or any other external service.
 */

import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import express from "express";
import request from "supertest";

// ---------------------------------------------------------------------------
// Generic, broad mocks for dependencies imported by the route modules
// ---------------------------------------------------------------------------

vi.mock("../../middlewares/auth", () => ({
  authMiddleware: (_opts?: unknown) => (_req: any, _res: any, next: () => void) => next(),
  requireRole: (..._roles: string[]) => (_req: any, _res: any, next: () => void) => next(),
  parseIdParam: (raw: string) => parseInt(raw, 10),
}));

vi.mock("../../middlewares/admin-guard", () => ({
  adminGuard: (_req: any, _res: any, next: () => void) => next(),
}));

vi.mock("../../lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock("../../lib/seed-vessels", () => ({
  seedVesselsData: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../lib/agent-scheduler", () => ({
  dispatchCovenantBreaches: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../lib/objectStorage", () => ({
  ObjectStorageService: class {
    async upload() { return { ok: true }; }
    async download() { return null; }
    getPublicURL() { return ""; }
  },
}));

vi.mock("../../lib/lead-scoring", () => ({
  computeLeadScore: vi.fn().mockReturnValue(0),
}));

vi.mock("@szl-holdings/observability", () => ({
  serverTelemetry: {
    recordAuthFailure: vi.fn(),
    recordRequest: vi.fn(),
    recordError: vi.fn(),
  },
}));

const makeTable = () =>
  new Proxy({}, { get: (_t, prop) => String(prop) });

const drizzleChain: Record<string, any> = {};
drizzleChain.from = () => drizzleChain;
drizzleChain.where = () => drizzleChain;
drizzleChain.innerJoin = () => drizzleChain;
drizzleChain.leftJoin = () => drizzleChain;
drizzleChain.orderBy = () => drizzleChain;
drizzleChain.groupBy = () => drizzleChain;
drizzleChain.limit = () => Promise.resolve([]);
drizzleChain.offset = () => Promise.resolve([]);
drizzleChain.then = (resolve: (v: unknown[]) => unknown) =>
  Promise.resolve([]).then(resolve);

vi.mock("@szl-holdings/db", () => {
  const mockDb = {
    select: () => drizzleChain,
    insert: () => ({
      values: () => ({
        returning: () => Promise.resolve([]),
        onConflictDoNothing: () => Promise.resolve([]),
        onConflictDoUpdate: () => ({ returning: () => Promise.resolve([]) }),
      }),
    }),
    update: () => ({ set: () => ({ where: () => ({ returning: () => Promise.resolve([]) }) }) }),
    delete: () => ({ where: () => ({ returning: () => Promise.resolve([]) }) }),
    transaction: async (fn: (tx: any) => Promise<unknown>) => fn(mockDb),
  };

  return new Proxy(
    {
      db: mockDb,
      pool: { query: vi.fn().mockResolvedValue({ rows: [] }) },
      ROLE_HIERARCHY: {},
      isReadOnlyRole: () => false,
      toCanonicalRole: (r: string) => r,
    },
    {
      get: (target: any, prop: string) => {
        if (prop in target) return target[prop];
        // Tables: anything ending in "Table"
        if (prop.endsWith("Table")) return makeTable();
        // Insert schemas: zod-like passthrough
        if (prop.startsWith("insert") && prop.endsWith("Schema")) {
          return { parse: (v: unknown) => v, partial: () => ({ parse: (v: unknown) => v }) };
        }
        return undefined;
      },
    },
  );
});

vi.mock("@szl-holdings/ai-engine", () => {
  const stubFn = (..._args: unknown[]) => undefined;
  return {
    twinRegistry: { register: stubFn, get: () => null, list: () => [], update: () => null },
    vesselTwin: { simulate: () => ({}) },
    propertyTwin: { simulate: () => ({}) },
    postureTwin: { simulate: () => ({}) },
    fusionCortex: {
      seedDemoAlerts: stubFn,
      getAlerts: () => [],
      startContinuousScan: stubFn,
    },
    patternLibrary: { list: () => [] },
    predictiveCascadeEngine: { seedDemoAlerts: stubFn, getCascades: () => [] },
    validateAndBuildDecision: vi.fn().mockResolvedValue({ ok: true }),
  };
});

vi.mock("@szl-holdings/ai-engine/domain-embedding-hooks", () => ({
  ingestFirestormFinding: vi.fn().mockResolvedValue(undefined),
  ingestFirestormScenario: vi.fn().mockResolvedValue(undefined),
  ingestFirestormAlert: vi.fn().mockResolvedValue(undefined),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function buildAppWithRouter(routerImporter: () => Promise<{ default: express.Router }>): Promise<express.Express> {
  const mod = await routerImporter();
  const app = express();
  app.use(express.json());
  app.use(mod.default);
  return app;
}

function expectBlocked(res: { status: number; body: { code?: string } }): void {
  expect(res.status).toBe(404);
  expect(res.body.code).toBe("SEED_DISABLED_IN_PRODUCTION");
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("seed endpoints — production guard", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalAppEnv = process.env.APP_ENV;

  beforeEach(() => {
    process.env.NODE_ENV = "production";
    delete (process.env as Record<string, string | undefined>).APP_ENV;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.APP_ENV = originalAppEnv;
  });

  it("POST /digital-twins/demo/seed returns 404 in production", async () => {
    const app = await buildAppWithRouter(() => import("../digital-twins.js") as any);
    const res = await request(app).post("/digital-twins/demo/seed").send({});
    expectBlocked(res);
  });

  it("POST /fusion/demo/seed returns 404 in production", async () => {
    const app = await buildAppWithRouter(() => import("../fusion.js") as any);
    const res = await request(app).post("/fusion/demo/seed").send({});
    expectBlocked(res);
  });

  it("POST /aegis/ot-ics/demo/seed returns 404 in production", async () => {
    const app = await buildAppWithRouter(() => import("../ot-ics.js") as any);
    const res = await request(app).post("/aegis/ot-ics/demo/seed").send({});
    expectBlocked(res);
  });

  it("POST /vessels/seed returns 404 in production", async () => {
    const app = await buildAppWithRouter(() => import("../vessels-extended.js") as any);
    const res = await request(app).post("/vessels/seed").send({});
    expectBlocked(res);
  });

  it("POST /certification/seed returns 404 in production", async () => {
    const app = await buildAppWithRouter(() => import("../certification-readiness.js") as any);
    const res = await request(app).post("/certification/seed").send({});
    expectBlocked(res);
  });

  it("POST /terra/cognitive/covenants/seed returns 404 in production", async () => {
    const app = await buildAppWithRouter(() => import("../terra-cognitive.js") as any);
    const res = await request(app).post("/terra/cognitive/covenants/seed").send({});
    expectBlocked(res);
  });

  it("POST /seed (distribution-os/publishing) returns 404 in production", async () => {
    const mod = await import("../distribution-os/publishing.js" as any);
    const app = express();
    app.use(express.json());
    const router = express.Router();
    mod.register(router);
    app.use(router);
    const res = await request(app).post("/seed").send({});
    expectBlocked(res);
  });

  it("POST /admin/seed/reset-demo returns 403 when RUNTIME_MODE=production", async () => {
    process.env.NODE_ENV = "development";
    delete (process.env as Record<string, string | undefined>).APP_ENV;
    process.env.RUNTIME_MODE = "production";
    try {
      const mod: any = await import("../admin/seed.js" as any);
      const app = express();
      app.use(express.json());
      const router = express.Router();
      mod.register(router);
      app.use(router);
      const res = await request(app).post("/admin/seed/reset-demo").send({});
      expect(res.status).toBe(403);
      expect(res.body.code).toBe("SEED_DISABLED_IN_PRODUCTION");
    } finally {
      delete (process.env as Record<string, string | undefined>).RUNTIME_MODE;
    }
  });

  it("POST /admin/seed/reset-demo returns 403 when NODE_ENV=production", async () => {
    process.env.NODE_ENV = "production";
    const mod: any = await import("../admin/seed.js" as any);
    const app = express();
    app.use(express.json());
    const router = express.Router();
    mod.register(router);
    app.use(router);
    const res = await request(app).post("/admin/seed/reset-demo").send({});
    expect(res.status).toBe(403);
    expect(res.body.code).toBe("SEED_DISABLED_IN_PRODUCTION");
  });

  it("blocks when only APP_ENV=production (NODE_ENV=development)", async () => {
    process.env.NODE_ENV = "development";
    process.env.APP_ENV = "production";
    const app = await buildAppWithRouter(() => import("../fusion.js") as any);
    const res = await request(app).post("/fusion/demo/seed").send({});
    expectBlocked(res);
  });
});
