import { describe, it, expect, vi, beforeEach } from "vitest";
import express, { type Request, type Response, type NextFunction } from "express";
import request from "supertest";

let _selectQueue: unknown[][] = [];

vi.mock("@szl-holdings/db", () => {
  return {
    db: {
      select() {
        const result = (_selectQueue.shift() ?? []) as unknown[];
        const chain: Record<string, unknown> = {
          from: () => chain,
          where: () => chain,
          innerJoin: () => chain,
          leftJoin: () => chain,
          orderBy: () => chain,
          limit: () => Promise.resolve(result),
          then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
            Promise.resolve(result).then(resolve, reject),
        };
        return chain;
      },
      insert() {
        const chain: Record<string, unknown> = {
          values: () => chain,
          onConflictDoUpdate: () => chain,
          returning: () => Promise.resolve([]),
        };
        return chain;
      },
      update() {
        const chain: Record<string, unknown> = {
          set: () => chain,
          where: () => chain,
          returning: () => Promise.resolve([]),
        };
        return chain;
      },
      delete() {
        const chain: Record<string, unknown> = {
          where: () => chain,
          returning: () => Promise.resolve([]),
        };
        return chain;
      },
    },
    pool: { query: vi.fn().mockResolvedValue({ rows: [] }) },
    organizationsTable: {},
    orgMembersTable: {},
    orgBrandingTable: {},
    orgCustomDomainsTable: {},
    partnerAccountsTable: {},
    partnerOrgAssignmentsTable: {},
    partnerUsersTable: {},
    usersTable: {},
    meteringEventsTable: {},
    usageAggregatesTable: {},
    usageEventsTable: {},
    sessionsTable: {},
    notificationPreferencesTable: {},
    notificationsTable: {},
    auditEventsTable: {},
    rateCardsTable: {},
    rateCardTiersTable: {},
    rateCardAssignmentsTable: {},
    quotaConfigsTable: {},
    quotaViolationsTable: {},
    costAllocationsTable: {},
    billingLineItemsTable: {},
    invoicesTable: {},
    subscriptionsTable: {},
    revenueEventsTable: {},
  };
});

vi.mock("drizzle-orm", () => ({
  eq: (_col: unknown, _val: unknown) => ({ op: "eq" }),
  and: (..._conds: unknown[]) => ({ op: "and" }),
  desc: (_col: unknown) => ({ op: "desc" }),
  asc: (_col: unknown) => ({ op: "asc" }),
  count: (_col: unknown) => ({ op: "count" }),
  sum: (_col: unknown) => ({ op: "sum" }),
  avg: (_col: unknown) => ({ op: "avg" }),
  inArray: (_col: unknown, _vals: unknown) => ({ op: "inArray" }),
  or: (..._conds: unknown[]) => ({ op: "or" }),
  ne: (_col: unknown, _val: unknown) => ({ op: "ne" }),
  gte: (_col: unknown, _val: unknown) => ({ op: "gte" }),
  lte: (_col: unknown, _val: unknown) => ({ op: "lte" }),
  isNull: (_col: unknown) => ({ op: "isNull" }),
  sql: (_strings: TemplateStringsArray, ..._values: unknown[]) => ({ op: "sql" }),
}));

vi.mock("../../lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock("../../lib/ssrf-guard", () => ({
  assertExternalUrl: vi.fn(),
}));

vi.mock("../../lib/validation", () => ({
  validateBody: (_schema: unknown) => (_req: Request, _res: Response, next: NextFunction) => next(),
  jsonObjectBodySchema: {},
  validateQuery: (_schema: unknown) => (_req: Request, _res: Response, next: NextFunction) => next(),
  listQuerySchema: {},
}));

vi.mock("dns", () => ({
  promises: {
    resolve: vi.fn().mockResolvedValue(["127.0.0.1"]),
  },
}));

vi.mock("crypto", async () => {
  const actual = await vi.importActual<typeof import("crypto")>("crypto");
  return { ...actual, randomBytes: (_n: number) => ({ toString: () => "test-token" }) };
});

vi.mock("../../middlewares/auth", () => ({
  authMiddleware: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  requireRole: (..._roles: string[]) => (_req: Request, _res: Response, next: NextFunction) => next(),
  parseIdParam: (raw: string) => parseInt(raw, 10),
}));

vi.mock("../../middlewares/rate-limiters", () => ({
  readLimiter: (_req: Request, _res: Response, next: NextFunction) => next(),
  writeLimiter: (_req: Request, _res: Response, next: NextFunction) => next(),
}));

vi.mock("../../middlewares/sliding-window-limiter", () => ({
  perUserApiSlidingLimiter: (_req: Request, _res: Response, next: NextFunction) => next(),
  perUserWriteSlidingLimiter: (_req: Request, _res: Response, next: NextFunction) => next(),
}));

function makeOrgAUser() {
  return {
    id: 1,
    displayName: "Alice",
    email: "alice@org-a.example",
    roles: ["member"] as string[],
    orgs: [{ orgId: 1, orgSlug: "org-a", orgName: "Org A", role: "member" }],
  };
}

function injectUser(userFactory: () => ReturnType<typeof makeOrgAUser>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    (req as any).user = userFactory();
    next();
  };
}

function buildApp(router: express.Router, userFactory: () => ReturnType<typeof makeOrgAUser>) {
  const app = express();
  app.use(express.json());
  app.use(injectUser(userFactory));
  app.use(router);
  return app;
}

describe("Handler-level cross-tenant isolation — real domain handlers", () => {
  beforeEach(() => {
    _selectQueue = [];
  });

  describe("partner-portal — GET /orgs/:orgId/branding", () => {
    async function buildPartnerPortalApp(userFactory: () => ReturnType<typeof makeOrgAUser>) {
      const { default: router } = await import("../partner-portal");
      return buildApp(router, userFactory);
    }

    it("returns 403 when Org A user requests Org B branding (orgId=2)", async () => {
      _selectQueue = [[]];
      const app = await buildPartnerPortalApp(makeOrgAUser);
      const res = await request(app).get("/orgs/2/branding");
      expect(res.status).toBe(403);
    });

    it("returns 200 when Org A user requests their own org branding (orgId=1)", async () => {
      _selectQueue = [[{ id: 1, orgId: 1, primaryColor: "#0f172a", isActive: true }]];
      const app = await buildPartnerPortalApp(makeOrgAUser);
      const res = await request(app).get("/orgs/1/branding");
      expect(res.status).toBe(200);
    });

    it("returns 403 when a no-org user requests any org branding", async () => {
      _selectQueue = [[]];
      const app = await buildPartnerPortalApp(() => ({ ...makeOrgAUser(), orgs: [] }));
      const res = await request(app).get("/orgs/1/branding");
      expect(res.status).toBe(403);
    });

    it("returns 403 when Org A user requests an unrelated org (orgId=99) with no partner relationship", async () => {
      _selectQueue = [[]];
      const app = await buildPartnerPortalApp(makeOrgAUser);
      const res = await request(app).get("/orgs/99/branding");
      expect(res.status).toBe(403);
    });
  });

  describe("org-settings — GET /orgs/:orgSlug/profile", () => {
    async function buildOrgSettingsApp(userFactory: () => ReturnType<typeof makeOrgAUser>) {
      const { default: router } = await import("../org-settings");
      return buildApp(router, userFactory);
    }

    it("returns 403 when Org A user requests Org B profile (slug=org-b)", async () => {
      _selectQueue = [[{ id: 2, slug: "org-b", name: "Org B", isActive: true }], []];
      const app = await buildOrgSettingsApp(makeOrgAUser);
      const res = await request(app).get("/orgs/org-b/profile");
      expect(res.status).toBe(403);
    });

    it("returns 200 when Org A user requests their own org profile (slug=org-a)", async () => {
      _selectQueue = [
        [{ id: 1, slug: "org-a", name: "Org A", isActive: true, logoUrl: null, domain: null, plan: "starter", createdAt: new Date() }],
        [{ userId: 1, orgId: 1, role: "member" }],
      ];
      const app = await buildOrgSettingsApp(makeOrgAUser);
      const res = await request(app).get("/orgs/org-a/profile");
      expect(res.status).toBe(200);
    });

    it("returns 404 when org slug does not exist", async () => {
      _selectQueue = [[]];
      const app = await buildOrgSettingsApp(makeOrgAUser);
      const res = await request(app).get("/orgs/nonexistent/profile");
      expect(res.status).toBe(404);
    });
  });

  describe("usage — GET /orgs/:orgSlug/usage", () => {
    async function buildUsageApp(userFactory: () => ReturnType<typeof makeOrgAUser>) {
      const { default: router } = await import("../usage");
      return buildApp(router, userFactory);
    }

    it("returns 403 when Org A user requests Org B usage (slug=org-b)", async () => {
      _selectQueue = [[{ id: 2, slug: "org-b", name: "Org B" }], []];
      const app = await buildUsageApp(makeOrgAUser);
      const res = await request(app).get("/orgs/org-b/usage");
      expect(res.status).toBe(403);
    });

    it("returns 404 when org slug does not exist", async () => {
      _selectQueue = [[]];
      const app = await buildUsageApp(makeOrgAUser);
      const res = await request(app).get("/orgs/nonexistent/usage");
      expect(res.status).toBe(404);
    });
  });

  describe("metering — GET /metering/rate-cards/assignments/:orgId", () => {
    async function buildMeteringApp(userFactory: () => ReturnType<typeof makeOrgAUser>) {
      const { register } = await import("../metering/index.js");
      const router = express.Router();
      register(router);
      return buildApp(router as express.Router, userFactory);
    }

    it("returns 403 when Org A user requests Org B rate card assignments (orgId=2)", async () => {
      const app = await buildMeteringApp(makeOrgAUser);
      const res = await request(app).get("/metering/rate-cards/assignments/2");
      expect(res.status).toBe(403);
    });

    it("allows Org A user to access their own assignments (orgId=1)", async () => {
      _selectQueue = [[]];
      const app = await buildMeteringApp(makeOrgAUser);
      const res = await request(app).get("/metering/rate-cards/assignments/1");
      expect(res.status).toBe(200);
    });
  });
});
