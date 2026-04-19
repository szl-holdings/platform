/**
 * ATLAS Scene Export — HTTP Integration Tests
 *
 * Tests the HTTP route handlers defined in routes/atlas-scene-export.ts.
 * Verifies that each route:
 *   - returns 503 when ENABLE_ATLAS_SPATIAL_RUNTIME is disabled
 *   - returns 401 when no auth is provided
 *   - returns 200 with a valid ExportAdapterResult payload when authenticated
 *   - returns 400 for missing required fields on POST routes
 *
 * Routes under test:
 *   GET  /atlas/snapshot/:sceneId
 *   POST /atlas/branch/export
 *   POST /atlas/proof-bundle/export
 *   GET  /atlas/export/openusd/:sceneId
 */

import { describe, it, expect, vi, beforeAll } from "vitest";
import express from "express";
import type { Request, Response, NextFunction } from "express";
import request from "supertest";

// ---------------------------------------------------------------------------
// Module mocks — must be declared before dynamic imports (Vitest hoists these)
// ---------------------------------------------------------------------------

vi.mock("drizzle-orm", async () => {
  const noop = (..._args: unknown[]) => ({});
  return { eq: noop, and: noop, or: noop, desc: noop, sql: noop, ilike: noop };
});

const auditInsertCalls: Array<Record<string, unknown>> = [];
let auditInsertShouldFail = false;

vi.mock("@szl-holdings/db", () => {
  const stubTable = {};
  const db = {
    select: () => ({ from: () => ({ where: () => Promise.resolve([]) }) }),
    insert: (_table: unknown) => ({
      values: (vals: Record<string, unknown>) => {
        if (auditInsertShouldFail) {
          // Return a thenable that rejects so `await db.insert(...).values(...)`
          // and `.returning()` both fail — simulates a real DB write error.
          const rejection = Promise.reject(
            new Error("simulated audit_events insert failure"),
          );
          // Prevent unhandled-rejection noise: attach a no-op handler now;
          // tests will await this rejection through the route.
          rejection.catch(() => {});
          return {
            returning: () => rejection,
            then: (onFulfilled: unknown, onRejected: unknown) =>
              rejection.then(
                onFulfilled as never,
                onRejected as never,
              ),
            catch: (onRejected: unknown) =>
              rejection.catch(onRejected as never),
          };
        }
        auditInsertCalls.push(vals);
        return { returning: () => Promise.resolve([{ id: 1 }]) };
      },
    }),
    update: () => ({ set: () => ({ where: () => ({ returning: () => Promise.resolve([]) }) }) }),
    delete: () => ({ where: () => Promise.resolve([]) }),
  };
  return new Proxy(
    {
      db,
      ROLE_HIERARCHY: {
        super_admin: ["super_admin", "admin", "ops", "exec", "operator"],
        admin: ["admin", "ops", "exec", "operator"],
        exec: ["exec", "ops", "operator"],
        ops: ["ops", "operator"],
        operator: ["operator"],
        analyst: ["analyst"],
        viewer: ["viewer"],
      },
      isReadOnlyRole: () => false,
      toCanonicalRole: (r: string) => r,
      sessionsTable: stubTable,
      usersTable: stubTable,
      auditEventsTable: stubTable,
      featureFlagsTable: stubTable,
      featureFlagOverridesTable: stubTable,
    } as Record<string, unknown>,
    { get(t, p) { return p in t ? t[p as string] : {}; } },
  );
});

vi.mock("@szl-holdings/observability", () => ({
  serverTelemetry: { recordAuthFailure: vi.fn(), recordRequest: vi.fn(), recordError: vi.fn() },
  initializeOpenTelemetry: () => Promise.resolve(),
}));

vi.mock("@szl-holdings/audit", () => ({ hashIp: (ip: string) => `hashed-${ip}` }));
vi.mock("@szl-holdings/config", () => ({ resolveRuntimeMode: () => "standard" }));

// ---------------------------------------------------------------------------
// Feature flag mock — controlled per test suite
// ---------------------------------------------------------------------------

let atlasEnabled = true;

vi.mock("../lib/platform-flags", () => ({
  isFlagEnabled: vi.fn((key: string) => {
    if (key === "ENABLE_ATLAS_SPATIAL_RUNTIME") return Promise.resolve(atlasEnabled);
    return Promise.resolve(true);
  }),
}));

// ---------------------------------------------------------------------------
// Auth middleware mock — injects an authenticated operator user
// ---------------------------------------------------------------------------

let authUser: { id: number; role: string } | null = { id: 1, role: "operator" };

vi.mock("../middlewares/auth", () => ({
  authMiddleware: () => (req: Request, _res: Response, next: NextFunction): void => {
    if (!authUser) { _res.status(401).json({ error: "Unauthorized", code: "UNAUTHORIZED" }); return; }
    (req as Request & { user: { id: number; role: string } }).user = authUser;
    next();
  },
  requireRole: (...roles: string[]) => (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as Request & { user?: { role: string } }).user;
    if (!user) { res.status(401).json({ error: "Unauthorized", code: "UNAUTHORIZED" }); return; }
    if (!roles.includes(user.role)) {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" }); return;
    }
    next();
  },
}));

vi.mock("express-rate-limit", () => ({
  default: () => (_req: Request, _res: Response, next: NextFunction) => next(),
}));

// ---------------------------------------------------------------------------
// App bootstrap
// ---------------------------------------------------------------------------

let app: ReturnType<typeof express>;
let csrfApp: ReturnType<typeof express>;

beforeAll(async () => {
  app = express();
  app.use(express.json());

  const { default: atlasSceneExportRouter } = await import("../routes/atlas-scene-export");
  app.use(atlasSceneExportRouter);

  // A separate minimal app that includes csrfMiddleware to test CSRF bypass
  // behaviour with bearer tokens vs cookie-auth. This simulates the real app
  // middleware order without requiring the full app.ts startup chain.
  const cookieParser = (await import("cookie-parser")).default;
  const { csrfMiddleware } = await import("../middlewares/csrf");

  csrfApp = express();
  csrfApp.use(express.json());
  csrfApp.use(cookieParser());
  csrfApp.use(csrfMiddleware);
  csrfApp.use(atlasSceneExportRouter);
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ATLAS Scene Export Routes", () => {
  describe("GET /atlas/snapshot/:sceneId", () => {
    it("returns 200 with a json_snapshot payload for an authenticated operator", async () => {
      authUser = { id: 1, role: "operator" };
      atlasEnabled = true;

      const res = await request(app).get("/atlas/snapshot/test-scene-001");
      expect(res.status).toBe(200);
      expect(res.body.format).toBe("json_snapshot");
      expect(res.body.adapterVersion).toBe("1.0.0");
      expect(res.body.payload).toBeDefined();
    });

    it("reflects sceneId from URL param in the snapshot payload", async () => {
      authUser = { id: 1, role: "operator" };
      atlasEnabled = true;

      const res = await request(app).get("/atlas/snapshot/my-special-scene-42");
      expect(res.status).toBe(200);
      const snapshot = res.body.payload?.snapshot;
      expect(snapshot?.sceneId).toBe("my-special-scene-42");
    });

    it("returns 503 when ENABLE_ATLAS_SPATIAL_RUNTIME is disabled", async () => {
      authUser = { id: 1, role: "operator" };
      atlasEnabled = false;

      const res = await request(app).get("/atlas/snapshot/scene-disabled");
      expect(res.status).toBe(503);
      expect(res.body.code).toBe("FEATURE_DISABLED");

      atlasEnabled = true;
    });

    it("returns 401 when no authenticated user", async () => {
      authUser = null;
      atlasEnabled = true;

      const res = await request(app).get("/atlas/snapshot/scene-unauthed");
      expect(res.status).toBe(401);

      authUser = { id: 1, role: "operator" };
    });

    it("returns 403 for a role below operator (analyst)", async () => {
      authUser = { id: 2, role: "analyst" };
      atlasEnabled = true;

      const res = await request(app).get("/atlas/snapshot/scene-forbidden");
      expect(res.status).toBe(403);

      authUser = { id: 1, role: "operator" };
    });

    it("accepts domain and entityType as query params", async () => {
      authUser = { id: 1, role: "operator" };
      atlasEnabled = true;

      const res = await request(app)
        .get("/atlas/snapshot/vessel-scene-01")
        .query({ domain: "maritime", entityType: "vessel", entityId: "IMO-9876543" });

      expect(res.status).toBe(200);
      const snapshot = res.body.payload?.snapshot;
      expect(snapshot?.domain).toBe("maritime");
      expect(snapshot?.entityType).toBe("vessel");
      expect(snapshot?.entityId).toBe("IMO-9876543");
    });
  });

  describe("POST /atlas/branch/export", () => {
    const validBranch = {
      parentSceneId: "parent-scene-001",
      branchId: "branch-001",
      branchLabel: "Cape route",
      domain: "maritime",
      branchedAt: new Date().toISOString(),
      hypothesis: "Reroute via Cape of Good Hope",
      deltaState: { route: "Cape" },
      outcomeProjections: [],
      approvedBy: null,
      correlationId: null,
    };

    it("returns 200 with branch_package payload for a valid request", async () => {
      authUser = { id: 1, role: "operator" };
      atlasEnabled = true;

      const res = await request(app)
        .post("/atlas/branch/export")
        .send(validBranch);

      expect(res.status).toBe(200);
      expect(res.body.format).toBe("branch_package");
      expect(res.body.payload).toBeDefined();
    });

    it("returns 400 when parentSceneId is missing", async () => {
      authUser = { id: 1, role: "operator" };
      atlasEnabled = true;

      const { parentSceneId: _omit, ...body } = validBranch;
      const res = await request(app).post("/atlas/branch/export").send(body);
      expect(res.status).toBe(400);
    });

    it("returns 400 when branchId is missing", async () => {
      authUser = { id: 1, role: "operator" };
      atlasEnabled = true;

      const { branchId: _omit, ...body } = validBranch;
      const res = await request(app).post("/atlas/branch/export").send(body);
      expect(res.status).toBe(400);
    });

    it("returns 400 when hypothesis is missing", async () => {
      authUser = { id: 1, role: "operator" };
      atlasEnabled = true;

      const { hypothesis: _omit, ...body } = validBranch;
      const res = await request(app).post("/atlas/branch/export").send(body);
      expect(res.status).toBe(400);
    });

    it("returns 503 when feature flag is disabled", async () => {
      authUser = { id: 1, role: "operator" };
      atlasEnabled = false;

      const res = await request(app).post("/atlas/branch/export").send(validBranch);
      expect(res.status).toBe(503);

      atlasEnabled = true;
    });

    it("returns 401 when unauthenticated", async () => {
      authUser = null;

      const res = await request(app).post("/atlas/branch/export").send(validBranch);
      expect(res.status).toBe(401);

      authUser = { id: 1, role: "operator" };
    });
  });

  describe("POST /atlas/proof-bundle/export", () => {
    const validBundle = {
      bundleId: "bundle-http-001",
      contentId: "content-http-001",
      contentType: "atlas_artifact",
      sourceClass: "llm_generated",
      confidenceScore: 0.9,
      serviceAttribution: "atlas",
      citations: [],
      approvalChain: [],
      generatedAt: new Date().toISOString(),
    };

    it("returns 200 with proof_bundle payload for a valid request", async () => {
      authUser = { id: 1, role: "ops" };
      atlasEnabled = true;

      const res = await request(app)
        .post("/atlas/proof-bundle/export")
        .send(validBundle);

      expect(res.status).toBe(200);
      expect(res.body.format).toBe("proof_bundle");
      expect(res.body.payload?.integrity).toBeDefined();
    });

    it("returns 400 when bundleId is missing", async () => {
      authUser = { id: 1, role: "operator" };
      atlasEnabled = true;

      const { bundleId: _omit, ...body } = validBundle;
      const res = await request(app).post("/atlas/proof-bundle/export").send(body);
      expect(res.status).toBe(400);
    });

    it("returns 400 when contentId is missing", async () => {
      authUser = { id: 1, role: "operator" };
      atlasEnabled = true;

      const { contentId: _omit, ...body } = validBundle;
      const res = await request(app).post("/atlas/proof-bundle/export").send(body);
      expect(res.status).toBe(400);
    });

    it("returns 400 when confidenceScore is missing", async () => {
      authUser = { id: 1, role: "operator" };
      atlasEnabled = true;

      const { confidenceScore: _omit, ...body } = validBundle;
      const res = await request(app).post("/atlas/proof-bundle/export").send(body);
      expect(res.status).toBe(400);
    });

    it("returns 503 when feature flag is disabled", async () => {
      authUser = { id: 1, role: "operator" };
      atlasEnabled = false;

      const res = await request(app).post("/atlas/proof-bundle/export").send(validBundle);
      expect(res.status).toBe(503);

      atlasEnabled = true;
    });
  });

  describe("GET /atlas/export/openusd/:sceneId", () => {
    it("returns 200 with openusd_manifest payload for an authenticated operator", async () => {
      authUser = { id: 1, role: "operator" };
      atlasEnabled = true;

      const res = await request(app).get("/atlas/export/openusd/scene-openusd-001");
      expect(res.status).toBe(200);
      expect(res.body.format).toBe("openusd_manifest");
      expect(res.body.warnings).toBeDefined();
      expect(res.body.warnings.length).toBeGreaterThan(0);
    });

    it("USDA text in payload starts with #usda 1.0", async () => {
      authUser = { id: 1, role: "operator" };
      atlasEnabled = true;

      const res = await request(app).get("/atlas/export/openusd/scene-usda-test");
      expect(res.status).toBe(200);
      expect(res.body.payload?.usdaText).toMatch(/^#usda 1\.0/);
    });

    it("accepts domain as a query param and reflects it in manifest", async () => {
      authUser = { id: 1, role: "operator" };
      atlasEnabled = true;

      const res = await request(app)
        .get("/atlas/export/openusd/vessel-scene-02")
        .query({ domain: "maritime", entityId: "IMO-1111111" });

      expect(res.status).toBe(200);
      expect(res.body.payload?.manifest?.domain).toBe("maritime");
    });

    it("returns 503 when ENABLE_ATLAS_SPATIAL_RUNTIME is disabled", async () => {
      authUser = { id: 1, role: "operator" };
      atlasEnabled = false;

      const res = await request(app).get("/atlas/export/openusd/scene-flag-off");
      expect(res.status).toBe(503);
      expect(res.body.code).toBe("FEATURE_DISABLED");

      atlasEnabled = true;
    });

    it("returns 401 when no authenticated user", async () => {
      authUser = null;
      atlasEnabled = true;

      const res = await request(app).get("/atlas/export/openusd/scene-unauthed");
      expect(res.status).toBe(401);

      authUser = { id: 1, role: "operator" };
    });

    it("returns 403 for a role below operator (analyst)", async () => {
      authUser = { id: 2, role: "analyst" };
      atlasEnabled = true;

      const res = await request(app).get("/atlas/export/openusd/scene-analyst-forbidden");
      expect(res.status).toBe(403);

      authUser = { id: 1, role: "operator" };
    });

    it("admin role is permitted (operator or above)", async () => {
      authUser = { id: 3, role: "admin" };
      atlasEnabled = true;

      const res = await request(app).get("/atlas/export/openusd/scene-admin");
      expect(res.status).toBe(200);

      authUser = { id: 1, role: "operator" };
    });

    it("returns 400 for a non-numeric proofChainId query param", async () => {
      authUser = { id: 1, role: "operator" };
      atlasEnabled = true;

      const res = await request(app)
        .get("/atlas/export/openusd/scene-bad-proof-id")
        .query({ proofChainId: "not-a-number" });

      expect(res.status).toBe(400);
    });

    it("returns 400 for a negative proofChainId query param", async () => {
      authUser = { id: 1, role: "operator" };
      atlasEnabled = true;

      const res = await request(app)
        .get("/atlas/export/openusd/scene-negative-proof-id")
        .query({ proofChainId: "-5" });

      expect(res.status).toBe(400);
    });

    it("returns 400 for a decimal proofChainId query param", async () => {
      authUser = { id: 1, role: "operator" };
      atlasEnabled = true;

      const res = await request(app)
        .get("/atlas/export/openusd/scene-decimal-proof-id")
        .query({ proofChainId: "1.7" });

      expect(res.status).toBe(400);
    });
  });

  describe("Audit trail", () => {
    it("records an audit event when a scene snapshot is exported", async () => {
      authUser = { id: 42, role: "operator" };
      atlasEnabled = true;
      auditInsertCalls.length = 0;

      const res = await request(app).get("/atlas/snapshot/audit-scene-001");
      expect(res.status).toBe(200);

      expect(auditInsertCalls.length).toBeGreaterThanOrEqual(1);
      const event = auditInsertCalls[auditInsertCalls.length - 1];
      expect(event.action).toBe("atlas.snapshot.export");
      expect(event.entityType).toBe("atlas_scene");
      expect(event.entityId).toBe("audit-scene-001");
      expect(event.userId).toBe(42);
      expect(event.product).toBe("atlas");
      expect((event.newValues as { format: string }).format).toBe("json_snapshot");
    });

    it("records an audit event when a branch package is exported", async () => {
      authUser = { id: 7, role: "ops" };
      atlasEnabled = true;
      auditInsertCalls.length = 0;

      const body = {
        parentSceneId: "audit-parent",
        branchId: "audit-branch-01",
        hypothesis: "What if we audit?",
        deltaState: {},
        outcomeProjections: [],
      };
      const res = await request(app).post("/atlas/branch/export").send(body);
      expect(res.status).toBe(200);

      const event = auditInsertCalls[auditInsertCalls.length - 1];
      expect(event.action).toBe("atlas.branch.export");
      expect(event.entityType).toBe("atlas_branch");
      expect(event.entityId).toBe("audit-branch-01");
      expect(event.userId).toBe(7);
    });

    it("records an audit event when a proof bundle is exported", async () => {
      authUser = { id: 9, role: "operator" };
      atlasEnabled = true;
      auditInsertCalls.length = 0;

      const body = {
        bundleId: "audit-bundle-01",
        contentId: "audit-content-01",
        confidenceScore: 0.42,
      };
      const res = await request(app).post("/atlas/proof-bundle/export").send(body);
      expect(res.status).toBe(200);

      const event = auditInsertCalls[auditInsertCalls.length - 1];
      expect(event.action).toBe("atlas.proof_bundle.export");
      expect(event.entityType).toBe("atlas_proof_bundle");
      expect(event.entityId).toBe("audit-bundle-01");
    });

    it("records an audit event when an OpenUSD manifest is exported", async () => {
      authUser = { id: 11, role: "operator" };
      atlasEnabled = true;
      auditInsertCalls.length = 0;

      const res = await request(app).get("/atlas/export/openusd/audit-usd-scene");
      expect(res.status).toBe(200);

      const event = auditInsertCalls[auditInsertCalls.length - 1];
      expect(event.action).toBe("atlas.openusd.export");
      expect(event.entityType).toBe("atlas_scene");
      expect(event.entityId).toBe("audit-usd-scene");
      expect((event.newValues as { format: string }).format).toBe("openusd_manifest");
    });

    it("does NOT record an audit event when the export is rejected by validation", async () => {
      authUser = { id: 1, role: "operator" };
      atlasEnabled = true;
      auditInsertCalls.length = 0;

      const res = await request(app)
        .post("/atlas/branch/export")
        .send({ branchId: "x", hypothesis: "y" });
      expect(res.status).toBe(400);
      expect(auditInsertCalls.length).toBe(0);
    });

    it("does NOT record an audit event when the feature flag is disabled", async () => {
      authUser = { id: 1, role: "operator" };
      atlasEnabled = false;
      auditInsertCalls.length = 0;

      const res = await request(app).get("/atlas/snapshot/audit-disabled");
      expect(res.status).toBe(503);
      expect(auditInsertCalls.length).toBe(0);

      atlasEnabled = true;
    });

    it("FAILS the export with 503 AUDIT_LOG_UNAVAILABLE when the audit write fails (snapshot)", async () => {
      authUser = { id: 1, role: "operator" };
      atlasEnabled = true;
      auditInsertShouldFail = true;

      const res = await request(app).get("/atlas/snapshot/audit-fail-scene");
      expect(res.status).toBe(503);
      expect(res.body.code).toBe("AUDIT_LOG_UNAVAILABLE");

      auditInsertShouldFail = false;
    });

    it("FAILS the export with 503 AUDIT_LOG_UNAVAILABLE when the audit write fails (proof bundle)", async () => {
      authUser = { id: 1, role: "operator" };
      atlasEnabled = true;
      auditInsertShouldFail = true;

      const res = await request(app)
        .post("/atlas/proof-bundle/export")
        .send({
          bundleId: "fail-bundle",
          contentId: "fail-content",
          confidenceScore: 0.5,
        });
      expect(res.status).toBe(503);
      expect(res.body.code).toBe("AUDIT_LOG_UNAVAILABLE");

      auditInsertShouldFail = false;
    });
  });

  describe("CSRF middleware compatibility", () => {
    const validBranch = {
      parentSceneId: "csrf-test-parent",
      branchId: "csrf-test-branch",
      hypothesis: "CSRF regression test",
      deltaState: {},
      outcomeProjections: [],
    };

    it("POST with bearer token passes CSRF middleware without a CSRF cookie", async () => {
      authUser = { id: 1, role: "operator" };
      atlasEnabled = true;

      const res = await request(csrfApp)
        .post("/atlas/branch/export")
        .set("Authorization", "Bearer test-token-abc123")
        .send(validBranch);

      expect(res.status).not.toBe(403);
      expect(res.body.code).not.toBe("CSRF_TOKEN_MISSING");
      expect(res.status).toBe(200);
    });

    it("POST with cookie-auth (no bearer) is blocked by CSRF when CSRF token is absent", async () => {
      authUser = { id: 1, role: "operator" };
      atlasEnabled = true;

      const res = await request(csrfApp)
        .post("/atlas/branch/export")
        .send(validBranch);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("CSRF_TOKEN_MISSING");
    });
  });
});
