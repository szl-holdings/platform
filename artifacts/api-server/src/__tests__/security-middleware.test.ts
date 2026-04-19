/**
 * Security Middleware Integration Tests
 *
 * Verifies that the three core security middlewares enforce their contracts
 * independently, without needing to spin up the full server or hit a real DB.
 *
 * Covered:
 *  1. globalAuthEnforcer — 401 deny-by-default for /api/* routes
 *  2. validateBody        — 400 with Zod error details for invalid payloads
 *  3. tenantScope         — 403 for cross-tenant access / missing memberships
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import type { Request, Response, NextFunction } from "express";
import request from "supertest";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Module mocks — hoisted before any imports
// ---------------------------------------------------------------------------

vi.mock("@szl-holdings/observability", () => ({
  serverTelemetry: {
    recordAuthFailure: vi.fn(),
    recordRequest: vi.fn(),
    recordError: vi.fn(),
    recordLatency: vi.fn(),
  },
}));

// DB mock used by tenantScope's hydrateOrgMemberships
const mockDbWhere = vi.fn(() => Promise.resolve([]));
const mockDbInnerJoin = vi.fn(() => ({ where: mockDbWhere }));
const mockDbFrom = vi.fn(() => ({ innerJoin: mockDbInnerJoin, where: mockDbWhere }));
const mockDbSelect = vi.fn(() => ({ from: mockDbFrom }));

vi.mock("@szl-holdings/db", () => ({
  db: { select: mockDbSelect },
  orgMembersTable: { orgId: "orgId", userId: "userId" },
  organizationsTable: { id: "id", slug: "slug", name: "name" },
  ROLE_HIERARCHY: {},
  isReadOnlyRole: () => false,
  toCanonicalRole: (r: string) => r,
}));

// ---------------------------------------------------------------------------
// Import middlewares AFTER mocks
// ---------------------------------------------------------------------------

const { globalAuthEnforcer } = await import("../middlewares/global-auth-enforcer.js");
const { validateBody, validateQuery, jsonObjectBodySchema, listQuerySchema } = await import("../lib/validation.js");
const { tenantScope } = await import("../middlewares/tenant-scope.js");

// ---------------------------------------------------------------------------
// Helper: build an Express app with optional middleware and a success handler
// ---------------------------------------------------------------------------

function buildApp(...middlewares: Array<(req: Request, res: Response, next: NextFunction) => void>) {
  const app = express();
  app.use(express.json());
  for (const mw of middlewares) {
    app.use(mw as express.RequestHandler);
  }
  return app;
}

// ---------------------------------------------------------------------------
// 1. globalAuthEnforcer
// ---------------------------------------------------------------------------

describe("globalAuthEnforcer", () => {
  const successHandler = (_req: Request, res: Response) => res.json({ ok: true });

  it("returns 401 for unauthenticated requests to /api/* paths", async () => {
    const app = express();
    app.use(express.json());
    app.use(globalAuthEnforcer as express.RequestHandler);
    app.get("/api/protected-resource", successHandler);

    const res = await request(app).get("/api/protected-resource");

    expect(res.status).toBe(401);
    expect((res.body as Record<string, unknown>).error).toBeDefined();
    expect((res.body as Record<string, unknown>).code).toBe("UNAUTHORIZED");
  });

  it("passes through when req.user is populated (authenticated)", async () => {
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      (req as Request & { user: unknown }).user = { id: 1, displayName: "Test User", email: "user@example.com", roles: ["member"], orgs: [] };
      next();
    });
    app.use(globalAuthEnforcer as express.RequestHandler);
    app.get("/api/protected-resource", successHandler);

    const res = await request(app).get("/api/protected-resource");

    expect(res.status).toBe(200);
    expect((res.body as Record<string, unknown>).ok).toBe(true);
  });

  it("passes through for public exact path /api/health", async () => {
    const app = express();
    app.use(express.json());
    app.use(globalAuthEnforcer as express.RequestHandler);
    app.get("/api/health", successHandler);

    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
  });

  it("passes through for public prefix /api/auth/login", async () => {
    const app = express();
    app.use(express.json());
    app.use(globalAuthEnforcer as express.RequestHandler);
    app.post("/api/auth/login", successHandler);

    const res = await request(app).post("/api/auth/login");

    expect(res.status).toBe(200);
  });

  it("passes through for public prefix /api/public/pricing", async () => {
    const app = express();
    app.use(express.json());
    app.use(globalAuthEnforcer as express.RequestHandler);
    app.get("/api/public/pricing", successHandler);

    const res = await request(app).get("/api/public/pricing");

    expect(res.status).toBe(200);
  });

  it("passes through when a valid X-Internal-Token header is provided on a legacy-allowed prefix", async () => {
    const token = "test-internal-token-abc123";
    const original = process.env["ALLOY_INTERNAL_TOKEN"];
    process.env["ALLOY_INTERNAL_TOKEN"] = token;

    const app = express();
    app.use(express.json());
    app.use(globalAuthEnforcer as express.RequestHandler);
    // GAP-016: legacy ALLOY_INTERNAL_TOKEN is restricted to its historical
    // path prefixes (`/api/internal/`, `/api/alloy/agent/`, `/api/health`,
    // `/api/env-registry`). A path outside that allowlist would be rejected
    // — see the dedicated rejection test below.
    app.get("/api/internal/protected-resource", successHandler);

    const res = await request(app)
      .get("/api/internal/protected-resource")
      .set("x-internal-token", token);

    // Restore original value precisely — delete if it was absent, reset if it had a value
    if (original === undefined) {
      delete process.env["ALLOY_INTERNAL_TOKEN"];
    } else {
      process.env["ALLOY_INTERNAL_TOKEN"] = original;
    }

    expect(res.status).toBe(200);
  });

  it("rejects X-Internal-Token that doesn't match (still 401)", async () => {
    const original = process.env["ALLOY_INTERNAL_TOKEN"];
    process.env["ALLOY_INTERNAL_TOKEN"] = "correct-token";

    const app = express();
    app.use(express.json());
    app.use(globalAuthEnforcer as express.RequestHandler);
    app.get("/api/internal/protected-resource", (_req, res) => res.json({ ok: true }));

    const res = await request(app)
      .get("/api/internal/protected-resource")
      .set("x-internal-token", "wrong-token");

    // Restore original value precisely
    if (original === undefined) {
      delete process.env["ALLOY_INTERNAL_TOKEN"];
    } else {
      process.env["ALLOY_INTERNAL_TOKEN"] = original;
    }

    expect(res.status).toBe(401);
  });

  it("does not block non-/api paths regardless of auth state", async () => {
    const app = express();
    app.use(express.json());
    app.use(globalAuthEnforcer as express.RequestHandler);
    app.get("/some-public-page", successHandler);

    const res = await request(app).get("/some-public-page");

    expect(res.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// 2. validateBody
// ---------------------------------------------------------------------------

describe("validateBody", () => {
  const testSchema = z.object({
    name: z.string().min(1).max(50),
    score: z.number().int().min(0).max(100),
    email: z.string().email().optional(),
  });

  const validPayload = { name: "Alice", score: 42 };

  it("calls next() for a valid payload and sets req.body to parsed data", async () => {
    const app = express();
    app.use(express.json());
    app.post("/test", validateBody(testSchema), (req, res) => {
      res.json({ received: req.body });
    });

    const res = await request(app).post("/test").send(validPayload);

    expect(res.status).toBe(200);
    expect((res.body as Record<string, unknown>).received).toMatchObject(validPayload);
  });

  it("returns 400 with structured Zod issues when a required field is missing", async () => {
    const app = express();
    app.use(express.json());
    app.post("/test", validateBody(testSchema), (_req, res) => res.json({ ok: true }));

    const res = await request(app).post("/test").send({ score: 10 });

    expect(res.status).toBe(400);
    const body = res.body as { error: string; code: string; details?: { issues: Array<{ path: unknown[]; message: string; code: string }> } };
    expect(body.error).toContain("Validation error");
    expect(body.code).toBe("BAD_REQUEST");
    // Structured Zod details must be present
    expect(body.details).toBeDefined();
    expect(Array.isArray(body.details?.issues)).toBe(true);
    expect((body.details?.issues.length ?? 0) > 0).toBe(true);
    const nameIssue = body.details?.issues.find(i => String(i.path[0]) === "name");
    expect(nameIssue).toBeDefined();
    expect(nameIssue?.message).toBeDefined();
    expect(nameIssue?.code).toBeDefined();
  });

  it("returns structured Zod issues when a field has the wrong type", async () => {
    const app = express();
    app.use(express.json());
    app.post("/test", validateBody(testSchema), (_req, res) => res.json({ ok: true }));

    const res = await request(app).post("/test").send({ name: "Bob", score: "not-a-number" });

    expect(res.status).toBe(400);
    const body = res.body as { error: string; details?: { issues: Array<{ path: unknown[]; message: string; code: string }> } };
    expect(body.error).toContain("Validation error");
    expect(Array.isArray(body.details?.issues)).toBe(true);
    const scoreIssue = body.details?.issues.find(i => String(i.path[0]) === "score");
    expect(scoreIssue).toBeDefined();
  });

  it("returns structured Zod issues when a string field exceeds maxLength", async () => {
    const app = express();
    app.use(express.json());
    app.post("/test", validateBody(testSchema), (_req, res) => res.json({ ok: true }));

    const res = await request(app)
      .post("/test")
      .send({ name: "x".repeat(200), score: 5 });

    expect(res.status).toBe(400);
    const body = res.body as { error: string; details?: { issues: Array<{ path: unknown[]; message: string; code: string }> } };
    expect(body.error).toContain("Validation error");
    expect(Array.isArray(body.details?.issues)).toBe(true);
    const nameIssue = body.details?.issues.find(i => String(i.path[0]) === "name");
    expect(nameIssue?.code).toBe("too_big");
  });

  it("returns 400 when a numeric field is out of range", async () => {
    const app = express();
    app.use(express.json());
    app.post("/test", validateBody(testSchema), (_req, res) => res.json({ ok: true }));

    const res = await request(app).post("/test").send({ name: "Bob", score: 999 });

    expect(res.status).toBe(400);
    const body = res.body as { details?: { issues: Array<{ path: unknown[]; code: string }> } };
    expect(Array.isArray(body.details?.issues)).toBe(true);
    const scoreIssue = body.details?.issues.find(i => String(i.path[0]) === "score");
    expect(scoreIssue?.code).toBe("too_big");
  });

  it("returns 400 when an email field has an invalid format", async () => {
    const app = express();
    app.use(express.json());
    app.post("/test", validateBody(testSchema), (_req, res) => res.json({ ok: true }));

    const res = await request(app)
      .post("/test")
      .send({ name: "Bob", score: 10, email: "not-an-email" });

    expect(res.status).toBe(400);
    const body = res.body as { details?: { issues: Array<{ path: unknown[] }> } };
    expect(Array.isArray(body.details?.issues)).toBe(true);
    const emailIssue = body.details?.issues.find(i => String(i.path[0]) === "email");
    expect(emailIssue).toBeDefined();
  });

  it("returns 400 with issues array for a completely empty body on a required-fields schema", async () => {
    const app = express();
    app.use(express.json());
    app.post("/test", validateBody(testSchema), (_req, res) => res.json({ ok: true }));

    const res = await request(app).post("/test").send({});

    expect(res.status).toBe(400);
    const body = res.body as { code: string; details?: { issues: Array<unknown> } };
    expect(body.code).toBe("BAD_REQUEST");
    expect(Array.isArray(body.details?.issues)).toBe(true);
    expect((body.details?.issues.length ?? 0) > 0).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 3. tenantScope
// ---------------------------------------------------------------------------

describe("tenantScope", () => {
  beforeEach(() => {
    mockDbWhere.mockResolvedValue([]);
  });

  function makeUser(overrides: Record<string, unknown> = {}) {
    return {
      id: 1,
      email: "user@example.com",
      roles: ["member"],
      orgs: [],
      ...overrides,
    };
  }

  function injectUser(user: any) {
    return (req: Request, _res: Response, next: NextFunction) => {
      (req as any).user = user;
      next();
    };
  }

  it("returns 401 when req.user is absent", async () => {
    const app = express();
    app.use(express.json());
    app.use(tenantScope() as express.RequestHandler);
    app.get("/resource", (_req, res) => res.json({ ok: true }));

    const res = await request(app).get("/resource");

    expect(res.status).toBe(401);
  });

  it("returns 403 when the user has no org memberships (DB returns empty)", async () => {
    mockDbWhere.mockResolvedValue([]);

    const app = express();
    app.use(express.json());
    app.use(injectUser(makeUser({ orgs: [] })) as express.RequestHandler);
    app.use(tenantScope() as express.RequestHandler);
    app.get("/resource", (_req, res) => res.json({ ok: true }));

    const res = await request(app).get("/resource");

    expect(res.status).toBe(403);
    expect((res.body as Record<string, unknown>).error).toContain("No organization membership");
  });

  it("sets tenantOrgId and passes through when org memberships match", async () => {
    const app = express();
    app.use(express.json());
    app.use(
      injectUser(
        makeUser({
          orgs: [{ orgId: 42, orgSlug: "acme", orgName: "Acme Corp", role: "member" }],
        }),
      ) as express.RequestHandler,
    );
    app.use(tenantScope() as express.RequestHandler);
    app.get("/resource", (req, res) => res.json({ tenantOrgId: req.tenantOrgId, tenantOrgSlug: req.tenantOrgSlug }));

    const res = await request(app).get("/resource");

    expect(res.status).toBe(200);
    expect((res.body as Record<string, unknown>).tenantOrgId).toBe(42);
    expect((res.body as Record<string, unknown>).tenantOrgSlug).toBe("acme");
  });

  it("returns 403 for cross-tenant access when orgSlug in params doesn't match user's orgs", async () => {
    // tenantScope reads req.params which is only populated at route-match time,
    // so we attach it directly to the route handler rather than via app.use().
    const app = express();
    app.use(express.json());
    app.get(
      "/orgs/:orgSlug/data",
      injectUser(
        makeUser({
          orgs: [{ orgId: 42, orgSlug: "acme", orgName: "Acme Corp", role: "member" }],
        }),
      ) as express.RequestHandler,
      tenantScope() as express.RequestHandler,
      (_req, res) => res.json({ ok: true }),
    );

    const res = await request(app).get("/orgs/rival-org/data");

    expect(res.status).toBe(403);
    expect((res.body as Record<string, unknown>).error).toContain("not a member of this organization");
  });

  it("allows access when orgSlug in params matches the user's org membership", async () => {
    const app = express();
    app.use(express.json());
    app.get(
      "/orgs/:orgSlug/data",
      injectUser(
        makeUser({
          orgs: [{ orgId: 42, orgSlug: "acme", orgName: "Acme Corp", role: "member" }],
        }),
      ) as express.RequestHandler,
      tenantScope() as express.RequestHandler,
      (req, res) =>
        res.json({ tenantOrgId: req.tenantOrgId, tenantOrgSlug: req.tenantOrgSlug }),
    );

    const res = await request(app).get("/orgs/acme/data");

    expect(res.status).toBe(200);
    expect((res.body as Record<string, unknown>).tenantOrgId).toBe(42);
  });

  it("admin user bypasses org membership checks entirely", async () => {
    const app = express();
    app.use(express.json());
    app.use(
      injectUser(makeUser({ roles: ["admin"], orgs: [] })) as express.RequestHandler,
    );
    app.use(tenantScope() as express.RequestHandler);
    app.get("/orgs/:orgSlug/data", (_req, res) => res.json({ ok: true }));

    const res = await request(app).get("/orgs/any-org/data");

    expect(res.status).toBe(200);
    expect((res.body as Record<string, unknown>).ok).toBe(true);
  });

  it("super_admin bypasses org membership checks", async () => {
    const app = express();
    app.use(express.json());
    app.use(
      injectUser(makeUser({ roles: ["super_admin"], orgs: [] })) as express.RequestHandler,
    );
    app.use(tenantScope() as express.RequestHandler);
    app.get("/orgs/:orgSlug/data", (_req, res) => res.json({ ok: true }));

    const res = await request(app).get("/orgs/anything/data");

    expect(res.status).toBe(200);
  });

  it("returns 403 for cross-tenant access via numeric orgId param", async () => {
    const app = express();
    app.use(express.json());
    app.get(
      "/orgs/:orgId/data",
      injectUser(
        makeUser({
          orgs: [{ orgId: 42, orgSlug: "acme", orgName: "Acme Corp", role: "member" }],
        }),
      ) as express.RequestHandler,
      tenantScope() as express.RequestHandler,
      (_req, res) => res.json({ ok: true }),
    );

    const res = await request(app).get("/orgs/99/data");

    expect(res.status).toBe(403);
    expect((res.body as Record<string, unknown>).error).toContain("not a member of this organization");
  });
});

// ---------------------------------------------------------------------------
// 4. validateQuery
// ---------------------------------------------------------------------------

describe("validateQuery", () => {
  const testQuerySchema = z.object({
    page: z.coerce.number().int().min(1).max(1000).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    status: z.enum(["active", "inactive", "pending"]).optional(),
  });

  function buildQueryApp(schema: z.ZodSchema<unknown>) {
    const app = express();
    app.use(express.json());
    app.get("/items", validateQuery(schema) as express.RequestHandler, (_req, res) => {
      res.json({ ok: true });
    });
    app.use((_err: unknown, _req: Request, res: Response, _next: NextFunction) => {
      res.status(500).json({ error: "unexpected" });
    });
    return app;
  }

  it("calls next() for valid query params", async () => {
    const res = await request(buildQueryApp(testQuerySchema)).get(
      "/items?page=2&limit=10&status=active",
    );
    expect(res.status).toBe(200);
    expect((res.body as { ok: boolean }).ok).toBe(true);
  });

  it("returns 400 with error message when a coerced number param is not numeric", async () => {
    const res = await request(buildQueryApp(testQuerySchema)).get("/items?page=not-a-number");

    expect(res.status).toBe(400);
    const body = res.body as { error: string; code: string };
    expect(body.code).toBe("BAD_REQUEST");
    expect(body.error).toMatch(/Invalid query parameters/i);
  });

  it("returns 400 when an enum param has an invalid value", async () => {
    const res = await request(buildQueryApp(testQuerySchema)).get("/items?status=unknown-status");

    expect(res.status).toBe(400);
    expect((res.body as { code: string }).code).toBe("BAD_REQUEST");
  });

  it("returns 400 when page exceeds the max bound", async () => {
    const res = await request(buildQueryApp(testQuerySchema)).get("/items?page=99999");

    expect(res.status).toBe(400);
    expect((res.body as { code: string }).code).toBe("BAD_REQUEST");
  });

  it("listQuerySchema rejects an oversized limit", async () => {
    const res = await request(buildQueryApp(listQuerySchema)).get("/items?limit=9999");

    expect(res.status).toBe(400);
    expect((res.body as { code: string }).code).toBe("BAD_REQUEST");
  });

  it("listQuerySchema accepts all standard search/filter fields without error", async () => {
    const res = await request(buildQueryApp(listQuerySchema)).get(
      "/items?page=1&limit=25&status=active&type=incident&q=test&order=desc",
    );

    expect(res.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// 5. jsonObjectBodySchema — rejects non-object bodies
// ---------------------------------------------------------------------------

describe("jsonObjectBodySchema", () => {
  it("accepts a plain object body and passes it through", async () => {
    const app = express();
    app.use(express.json());
    app.post("/endpoint", validateBody(jsonObjectBodySchema), (req, res) => {
      res.json({ received: req.body });
    });

    const res = await request(app).post("/endpoint").send({ foo: "bar", count: 3 });

    expect(res.status).toBe(200);
    expect((res.body as Record<string, unknown>).received).toMatchObject({ foo: "bar", count: 3 });
  });

  it("accepts a nested object body with arbitrary keys", async () => {
    const app = express();
    app.use(express.json());
    app.post("/endpoint", validateBody(jsonObjectBodySchema), (req, res) => {
      res.json({ received: req.body });
    });

    const res = await request(app)
      .post("/endpoint")
      .send({ type: "command", payload: { action: "restart", target: "pod-1" }, meta: { ts: 1234 } });

    expect(res.status).toBe(200);
    const body = res.body as { received: Record<string, unknown> };
    expect(body.received.type).toBe("command");
  });

  it("returns 400 with BAD_REQUEST code when the body is a JSON array", async () => {
    const app = express();
    app.use(express.json());
    app.post("/endpoint", validateBody(jsonObjectBodySchema), (_req, res) => {
      res.json({ ok: true });
    });

    const res = await request(app)
      .post("/endpoint")
      .set("Content-Type", "application/json")
      .send("[1,2,3]");

    expect(res.status).toBe(400);
    const body = res.body as { code?: string };
    expect(body.code).toBe("BAD_REQUEST");
  });

  it("accepts an empty body (defaults to empty object)", async () => {
    const app = express();
    app.use(express.json());
    app.post("/endpoint", validateBody(jsonObjectBodySchema), (_req, res) => {
      res.json({ ok: true });
    });

    const res = await request(app).post("/endpoint");

    expect(res.status).toBe(200);
  });

  it("returns 400 when the body is a primitive (handled at parser or middleware layer)", async () => {
    const app = express();
    app.use(express.json());
    app.post("/endpoint", validateBody(jsonObjectBodySchema), (_req, res) => {
      res.json({ ok: true });
    });
    app.use((_err: unknown, _req: Request, res: Response, _next: NextFunction) => {
      res.status(400).json({ code: "BAD_REQUEST", error: "Invalid request body" });
    });

    const res = await request(app)
      .post("/endpoint")
      .set("Content-Type", "application/json")
      .send("true");

    expect(res.status).toBe(400);
  });
});
