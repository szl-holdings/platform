/**
 * Cross-Tenant Data Isolation Tests
 *
 * Verifies that the tenantScope({ required: true }) middleware gate applied at
 * the domain-group router level prevents Org A users from accessing Org B data.
 *
 * These tests exercise the tenantScope middleware directly — mounted the same
 * way the domain group files mount it (router.use("/vessels", tenantScope(...))).
 * This validates the middleware-gate pattern rather than individual route handlers.
 *
 * Coverage:
 *  - No org membership → 403
 *  - Wrong org membership → 403
 *  - Correct org membership → passes through (200 from stub handler)
 *  - Elevated user (admin) → passes through regardless of orgs
 *  - Multi-org user can only access their orgs
 *  - Cross-tenant attempt via :orgSlug param → 403
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import express, { type Request, type Response, type NextFunction } from "express";
import request from "supertest";
import { tenantScope } from "../../middlewares/tenant-scope";

// ---------------------------------------------------------------------------
// DB mock — only hydrateOrgMemberships touches the DB in tenantScope
// ---------------------------------------------------------------------------

vi.mock("@szl-holdings/db", () => {
  const hydrateResults: Array<{ orgId: number; orgSlug: string; orgName: string; role: string }[]> = [];

  return {
    db: {
      select() {
        const result = hydrateResults.shift() ?? [];
        const chain: Record<string, unknown> = {
          from: () => chain,
          where: () => chain,
          innerJoin: () => chain,
          then: (resolve: (v: unknown) => unknown, _reject?: (e: unknown) => unknown) =>
            Promise.resolve(result).then(resolve, _reject),
        };
        return chain;
      },
    },
    orgMembersTable: { orgId: "org_id", userId: "user_id" },
    organizationsTable: { id: "id", slug: "slug", name: "name" },
  };
});

vi.mock("drizzle-orm", () => ({
  eq: (col: unknown, val: unknown) => ({ op: "eq", col, val }),
  and: (...conds: unknown[]) => ({ op: "and", conds }),
  inArray: (col: unknown, vals: unknown) => ({ op: "inArray", col, vals }),
}));

vi.mock("../../lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock("@szl-holdings/observability", () => ({
  serverTelemetry: { recordAuthFailure: vi.fn(), recordRequest: vi.fn() },
}));

// ---------------------------------------------------------------------------
// User factories
// ---------------------------------------------------------------------------

function makeUser(overrides: Partial<ReturnType<typeof baseUser>> = {}) {
  return { ...baseUser(), ...overrides };
}

function baseUser() {
  return {
    id: 1,
    displayName: "Alice",
    email: "alice@org1.example",
    roles: ["member"] as string[],
    orgs: [{ orgId: 1, orgSlug: "org-one", orgName: "Org One", role: "member" }],
    isInternalAgent: false,
  };
}

// ---------------------------------------------------------------------------
// App builders
// ---------------------------------------------------------------------------

/**
 * Build a minimal Express app with tenantScope applied to a path prefix,
 * followed by a stub handler that returns 200.
 */
function buildApp(prefix: string, userFactory: () => ReturnType<typeof makeUser>) {
  const app = express();
  app.use(express.json());

  app.use((req: Request, _res: Response, next: NextFunction) => {
    (req as any).user = userFactory();
    (req as Request & { isInternalAgent: boolean }).isInternalAgent = false;
    next();
  });

  app.use(prefix, tenantScope({ required: true }));

  app.get(`${prefix}/data`, (_req: Request, res: Response) => {
    res.status(200).json({ ok: true });
  });

  app.get(`${prefix}/:orgSlug/data`, (_req: Request, res: Response) => {
    res.status(200).json({ ok: true, scoped: true });
  });

  return app;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Tenant isolation — middleware gate on domain route prefix", () => {
  const DOMAIN_PREFIXES = ["/vessels", "/lyte", "/terra", "/alloy", "/firestorm", "/prism-counsel"];

  for (const prefix of DOMAIN_PREFIXES) {
    describe(`${prefix}`, () => {
      it("allows a user with the correct org membership to access data", async () => {
        const app = buildApp(prefix, () => makeUser());
        const res = await request(app).get(`${prefix}/data`);
        expect(res.status).toBe(200);
      });

      it("blocks a user with no org memberships with 403", async () => {
        const app = buildApp(prefix, () => makeUser({ orgs: [] }));
        const res = await request(app).get(`${prefix}/data`);
        expect(res.status).toBe(403);
      });

      it("allows an elevated admin user through regardless of org membership", async () => {
        const app = buildApp(prefix, () => makeUser({ roles: ["admin"], orgs: [] }));
        const res = await request(app).get(`${prefix}/data`);
        expect(res.status).toBe(200);
      });

      it("allows a super_admin user through regardless of org membership", async () => {
        const app = buildApp(prefix, () => makeUser({ roles: ["super_admin"], orgs: [] }));
        const res = await request(app).get(`${prefix}/data`);
        expect(res.status).toBe(200);
      });
    });
  }

  /**
   * Group-level prefix middleware (router.use("/vessels", tenantScope(...)))
   * enforces: "you must have at least one org membership". It does NOT parse
   * route-level :orgSlug params — those arrive later during route matching.
   * Cross-tenant orgSlug enforcement requires either:
   *   (a) tenantScope mounted as route middleware (proven in the next describe block), or
   *   (b) explicit membership assertion in the handler (proven in handler-cross-tenant.test.ts)
   */
  describe("group-level gate: membership-presence check", () => {
    it("allows a member of any org to access the domain prefix", async () => {
      const app = buildApp("/vessels", () => makeUser());
      const res = await request(app).get("/vessels/org-one/data");
      expect(res.status).toBe(200);
    });

    it("blocks user with no orgs from accessing any org-scoped path", async () => {
      const app = buildApp("/vessels", () => makeUser({ orgs: [] }));
      const res = await request(app).get("/vessels/org-one/data");
      expect(res.status).toBe(403);
    });
  });

  /**
   * When the tenantScope middleware IS given direct access to orgSlug via
   * req.params (i.e., mounted as part of a route definition, not just a prefix),
   * it enforces cross-tenant isolation for the specific org slug.
   */
  describe(":orgSlug param enforcement (tenantScope mounted as route middleware)", () => {
    function buildOrgSlugApp(userFactory: () => ReturnType<typeof makeUser>) {
      const app = express();
      app.use(express.json());

      app.use((req: Request, _res: Response, next: NextFunction) => {
        (req as any).user = userFactory();
        (req as Request & { isInternalAgent: boolean }).isInternalAgent = false;
        next();
      });

      app.get(
        "/vessels/:orgSlug/data",
        tenantScope({ required: true }),
        (_req: Request, res: Response) => {
          res.status(200).json({ ok: true });
        },
      );

      return app;
    }

    it("allows Org A user to access /vessels/org-one/data (their own org)", async () => {
      const app = buildOrgSlugApp(() => makeUser());
      const res = await request(app).get("/vessels/org-one/data");
      expect(res.status).toBe(200);
    });

    it("blocks Org A user from accessing /vessels/org-two/data (Org B)", async () => {
      const app = buildOrgSlugApp(() => makeUser());
      const res = await request(app).get("/vessels/org-two/data");
      expect(res.status).toBe(403);
    });

    it("blocks user with no orgs from any org-scoped param route", async () => {
      const app = buildOrgSlugApp(() => makeUser({ orgs: [] }));
      const res = await request(app).get("/vessels/org-one/data");
      expect(res.status).toBe(403);
    });
  });

  describe("multi-org user at group gate", () => {
    const multiOrgUser = () =>
      makeUser({
        orgs: [
          { orgId: 1, orgSlug: "org-one", orgName: "Org One", role: "member" },
          { orgId: 2, orgSlug: "org-two", orgName: "Org Two", role: "member" },
        ],
      });

    it("passes the group gate and can access data routes", async () => {
      const app = buildApp("/lyte", multiOrgUser);
      const res = await request(app).get("/lyte/data");
      expect(res.status).toBe(200);
    });

    it("is blocked when they have no orgs at all", async () => {
      const app = buildApp("/lyte", () => makeUser({ orgs: [] }));
      const res = await request(app).get("/lyte/data");
      expect(res.status).toBe(403);
    });
  });

  describe("multi-org user orgSlug route enforcement", () => {
    function buildOrgSlugApp(userFactory: () => ReturnType<typeof makeUser>) {
      const app = express();
      app.use(express.json());
      app.use((req: Request, _res: Response, next: NextFunction) => {
        (req as any).user = userFactory();
        (req as Request & { isInternalAgent: boolean }).isInternalAgent = false;
        next();
      });
      app.get(
        "/lyte/:orgSlug/data",
        tenantScope({ required: true }),
        (_req: Request, res: Response) => {
          res.status(200).json({ ok: true });
        },
      );
      return app;
    }

    const multiOrgUser = () =>
      makeUser({
        orgs: [
          { orgId: 1, orgSlug: "org-one", orgName: "Org One", role: "member" },
          { orgId: 2, orgSlug: "org-two", orgName: "Org Two", role: "member" },
        ],
      });

    it("can access a route scoped to their first org", async () => {
      const app = buildOrgSlugApp(multiOrgUser);
      const res = await request(app).get("/lyte/org-one/data");
      expect(res.status).toBe(200);
    });

    it("can access a route scoped to their second org", async () => {
      const app = buildOrgSlugApp(multiOrgUser);
      const res = await request(app).get("/lyte/org-two/data");
      expect(res.status).toBe(200);
    });

    it("is blocked from accessing Org Three (not a member)", async () => {
      const app = buildOrgSlugApp(multiOrgUser);
      const res = await request(app).get("/lyte/org-three/data");
      expect(res.status).toBe(403);
    });
  });

  describe("unauthenticated request (no req.user)", () => {
    it("returns 401 when there is no authenticated user", async () => {
      const app = express();
      app.use(express.json());
      app.use("/vessels", tenantScope({ required: true }));
      app.get("/vessels/data", (_req: Request, res: Response) => {
        res.status(200).json({ ok: true });
      });

      const res = await request(app).get("/vessels/data");
      expect(res.status).toBe(401);
    });
  });
});
