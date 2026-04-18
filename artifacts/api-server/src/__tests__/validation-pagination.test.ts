/**
 * Validation & Pagination Integration Tests
 *
 * Verifies two categories of API contract invariants:
 *
 *  (A) Validation — mutation routes reject missing/invalid required fields
 *      with HTTP 400 and an { error, code, requestId } error shape.
 *
 *  (B) Pagination — list endpoints return a paginated envelope:
 *      { data: [...], meta: { page, limit, offset } }
 *
 * Routes under test:
 *   POST /billing/checkout            (billingCheckoutSchema)
 *   POST /auth/login-password         (loginPasswordSchema)
 *   POST /admin/tenants               (tenantCreateSchema)
 *   GET  /notifications               (pagination metadata)
 *   GET  /billing/subscriptions       (pagination metadata)
 */

import { describe, it, expect, vi, beforeAll } from "vitest";
import express from "express";
import type { Router as ExpressRouter } from "express";
import request from "supertest";
import type { Request, Response, NextFunction } from "express";

// ---------------------------------------------------------------------------
// Module mocks — declared before any dynamic imports (Vitest hoists these)
// ---------------------------------------------------------------------------

vi.mock("drizzle-orm", async (importOriginal) => {
  const noop = (..._args: unknown[]) => ({});
  return {
    eq: noop,
    ne: noop,
    and: noop,
    or: noop,
    desc: noop,
    asc: noop,
    isNull: noop,
    isNotNull: noop,
    inArray: noop,
    notInArray: noop,
    sql: noop,
    count: noop,
    gt: noop,
    gte: noop,
    lt: noop,
    lte: noop,
    like: noop,
    ilike: noop,
    not: noop,
  };
});

vi.mock("@szl-holdings/observability", () => ({
  serverTelemetry: {
    recordAuthFailure: vi.fn(),
    recordRequest: vi.fn(),
    recordError: vi.fn(),
    recordLatency: vi.fn(),
    recordMutation: vi.fn(),
  },
}));

vi.mock("@szl-holdings/db", () => {
  const makeChain: () => Record<string, unknown> = () => ({
    from: makeChain,
    innerJoin: makeChain,
    leftJoin: makeChain,
    where: () => ({
      orderBy: () => ({
        limit: () => ({
          offset: () => Promise.resolve([]),
        }),
      }),
      limit: () => ({
        offset: () => Promise.resolve([]),
      }),
    }),
    orderBy: () => ({
      limit: () => ({
        offset: () => Promise.resolve([]),
      }),
    }),
    limit: () => ({ offset: () => Promise.resolve([]) }),
    offset: () => Promise.resolve([]),
    execute: () => Promise.resolve([]),
    then: (res: (v: unknown[]) => void, _rej?: unknown) => Promise.resolve([]).then(res),
  });

  const db = {
    select: makeChain,
    insert: () => ({
      values: () => ({
        returning: () => Promise.resolve([{ id: 1 }]),
        onConflictDoNothing: () => ({ returning: () => Promise.resolve([]) }),
      }),
    }),
    update: () => ({ set: () => ({ where: () => ({ returning: () => Promise.resolve([]) }) }) }),
    delete: () => ({ where: () => Promise.resolve([]) }),
    transaction: (fn: (tx: unknown) => Promise<unknown>) => fn(db),
  };

  const stubTable = {};

  return new Proxy(
    {
      db,
      ROLE_HIERARCHY: {},
      isReadOnlyRole: () => false,
      toCanonicalRole: (r: string) => r,
      notificationsTable: stubTable,
      notificationPreferencesTable: stubTable,
      subscriptionsTable: stubTable,
      invoicesTable: stubTable,
      billingPlansTable: stubTable,
      revenueEventsTable: stubTable,
      organizationsTable: stubTable,
      usersTable: stubTable,
      sessionsTable: stubTable,
      rolesTable: stubTable,
      userRolesTable: stubTable,
      orgMembersTable: stubTable,
      azureTenantsTable: stubTable,
      auditLogsTable: stubTable,
      dataverseConnectionsTable: stubTable,
      scimTokensTable: stubTable,
      scimProvisionedUsersTable: stubTable,
      scimSyncLogsTable: stubTable,
      tenantBrandingTable: stubTable,
    } as Record<string, unknown>,
    {
      get(target, prop) {
        if (prop in target) return target[prop as string];
        return {};
      },
    },
  );
});

vi.mock("@szl-holdings/services", () => ({
  services: {
    stripe: {
      createCheckoutSession: vi.fn(async () => ({ url: "https://checkout.stripe.com/test" })),
      getCustomerByEmail: vi.fn(async () => null),
      listProducts: vi.fn(async () => []),
      createBillingPortalSession: vi.fn(async () => ({ url: "https://portal.stripe.com/test" })),
      createSubscription: vi.fn(async () => ({ id: "sub_test" })),
    },
  },
}));

vi.mock("@szl-holdings/auth", () => ({
  createAuthService: () => ({
    verifyIdentity: vi.fn(async () => null),
  }),
}));

vi.mock("@szl-holdings/forge-runtime", () => ({
  forgeRuntime: { execute: vi.fn(async () => ({})), isAvailable: () => false },
  durableJobQueue: {
    enqueue: vi.fn(async () => ({ id: "job-1" })),
  },
}));

vi.mock("@szl-holdings/config", () => ({
  config: {},
  getConfig: () => ({}),
}));

vi.mock("../lib/logger.js", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn(() => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    })),
  },
}));

vi.mock("../lib/activity-logger.js", () => ({
  logActivity: vi.fn(async () => undefined),
}));

vi.mock("../lib/auth.js", () => ({
  getSessionToken: vi.fn(() => null),
  getSessionUser: vi.fn(async () => null),
}));

vi.mock("../lib/websocket.js", () => ({
  WS_CHANNELS: {
    NOTIFICATIONS: "notifications",
    GENERAL: "general",
  },
  publish: vi.fn(),
  getMessagesSince: vi.fn(() => []),
  getPresence: vi.fn(() => []),
  issueWsTicket: vi.fn(() => "ticket-mock"),
}));

vi.mock("../lib/platform-flags.js", () => ({
  isFlagEnabled: vi.fn(() => false),
}));

vi.mock("../lib/platform-jobs.js", () => ({
  PLATFORM_JOB_TYPES: {
    NOTIFICATION_DISPATCH: "notification.dispatch",
  },
}));

vi.mock("../lib/crypto.js", () => ({
  encryptSecret: vi.fn((v: string) => `enc:${v}`),
  decryptSecret: vi.fn((v: string) => v.replace("enc:", "")),
}));

// ---------------------------------------------------------------------------
// authMiddleware mock — injects a valid user so validation fires (not auth)
// ---------------------------------------------------------------------------

const mockAuthUser = {
  id: 99,
  email: "tester@example.com",
  roles: ["admin"],
  orgs: [{ orgId: 1, orgSlug: "test-org", orgName: "Test Org", role: "admin" }],
};

vi.mock("../middlewares/auth.js", () => ({
  authMiddleware: (_opts?: unknown) => (req: Request, _res: Response, next: NextFunction) => {
    (req as Request & { user: typeof mockAuthUser }).user = mockAuthUser;
    next();
  },
  parseIdParam: (paramName: string) => (req: Request, res: Response, next: NextFunction) => {
    const val = req.params[paramName];
    if (!val || isNaN(Number(val))) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }
    next();
  },
  requireRole: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  requireOrgMembership: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  denyIfReadOnly: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  InvalidIdError: class extends Error {},
}));

// ---------------------------------------------------------------------------
// Dynamic imports (after all mocks are registered)
// ---------------------------------------------------------------------------

const { default: billingRouter } = await import("../routes/billing.js");
const { default: authRouter } = await import("../routes/auth.js");
const { default: notificationsRouter } = await import("../routes/notifications.js");
const { register: registerTenantProvisioning } = await import("../routes/tenant-provisioning/index.js");
const tenantProvisioningRouter = express.Router();
registerTenantProvisioning(tenantProvisioningRouter);

// ---------------------------------------------------------------------------
// Helper types
// ---------------------------------------------------------------------------

interface ErrorBody {
  error: string;
  code: string;
  requestId?: string;
}

interface PaginatedBody<T = unknown> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    offset: number;
  };
}

// ---------------------------------------------------------------------------
// Helper: build a minimal Express app (no global auth enforcer).
// authMiddleware is mocked to inject a user so routes proceed to validateBody.
// ---------------------------------------------------------------------------

function buildApp(router: ExpressRouter, mountPrefix = "") {
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
// POST /billing/checkout  — Validation (400)
// ===========================================================================

describe("POST /billing/checkout — validation", () => {
  const app = buildApp(billingRouter as unknown as ExpressRouter);

  it("returns 400 with { error, code, requestId } when priceId is missing", async () => {
    const res = await request(app)
      .post("/billing/checkout")
      .send({
        successUrl: "https://example.com/success",
        cancelUrl: "https://example.com/cancel",
      });

    expect(res.status).toBe(400);
    const body = res.body as ErrorBody;
    expect(body.error).toBeDefined();
    expect(body.code).toBe("BAD_REQUEST");
    expect(body.requestId).toBeDefined();
  });

  it("returns 400 with issues detail when successUrl is not a valid URL", async () => {
    const res = await request(app)
      .post("/billing/checkout")
      .send({
        priceId: "price_test123",
        successUrl: "not-a-url",
        cancelUrl: "https://example.com/cancel",
      });

    expect(res.status).toBe(400);
    const body = res.body as ErrorBody & { details?: { issues: unknown[] } };
    expect(body.code).toBe("BAD_REQUEST");
    expect(Array.isArray(body.details?.issues)).toBe(true);
  });

  it("returns 400 when both successUrl and cancelUrl are missing", async () => {
    const res = await request(app)
      .post("/billing/checkout")
      .send({ priceId: "price_test123" });

    expect(res.status).toBe(400);
    const body = res.body as ErrorBody;
    expect(body.code).toBe("BAD_REQUEST");
    expect(body.error).toMatch(/Validation error/i);
  });

  it("returns 400 for a completely empty body", async () => {
    const res = await request(app).post("/billing/checkout").send({});

    expect(res.status).toBe(400);
    expect((res.body as ErrorBody).code).toBe("BAD_REQUEST");
  });

  it("passes validation and returns a checkout URL on a valid payload", async () => {
    const res = await request(app)
      .post("/billing/checkout")
      .send({
        priceId: "price_test123",
        successUrl: "https://example.com/success",
        cancelUrl: "https://example.com/cancel",
      });

    expect(res.status).toBe(200);
    const body = res.body as { url: string };
    expect(typeof body.url).toBe("string");
    expect(body.url.length).toBeGreaterThan(0);
  });
});

// ===========================================================================
// POST /auth/login-password  — Validation (400)
// ===========================================================================

describe("POST /auth/login-password — validation", () => {
  const app = buildApp(authRouter as unknown as ExpressRouter);

  it("returns 400 with { error, code, requestId } when email is missing", async () => {
    const res = await request(app)
      .post("/auth/login-password")
      .send({ password: "secret123" });

    expect(res.status).toBe(400);
    const body = res.body as ErrorBody;
    expect(body.error).toBeDefined();
    expect(body.code).toBe("BAD_REQUEST");
    expect(body.requestId).toBeDefined();
  });

  it("returns 400 when password is missing", async () => {
    const res = await request(app)
      .post("/auth/login-password")
      .send({ email: "user@example.com" });

    expect(res.status).toBe(400);
    const body = res.body as ErrorBody;
    expect(body.code).toBe("BAD_REQUEST");
    expect(body.error).toMatch(/Validation error/i);
  });

  it("returns 400 when email is not a valid email address", async () => {
    const res = await request(app)
      .post("/auth/login-password")
      .send({ email: "not-an-email", password: "secret123" });

    expect(res.status).toBe(400);
    const body = res.body as ErrorBody & { details?: { issues: unknown[] } };
    expect(body.code).toBe("BAD_REQUEST");
    expect(Array.isArray(body.details?.issues)).toBe(true);
  });

  it("returns 400 for an empty body", async () => {
    const res = await request(app).post("/auth/login-password").send({});

    expect(res.status).toBe(400);
    expect((res.body as ErrorBody).code).toBe("BAD_REQUEST");
  });
});

// ===========================================================================
// POST /admin/tenants  — Validation (400)
// ===========================================================================

describe("POST /admin/tenants — validation", () => {
  const app = buildApp(tenantProvisioningRouter as unknown as ExpressRouter);

  it("returns 400 with { error, code, requestId } when azureTenantId is missing", async () => {
    const res = await request(app)
      .post("/admin/tenants")
      .send({ displayName: "Acme Corp" });

    expect(res.status).toBe(400);
    const body = res.body as ErrorBody;
    expect(body.error).toBeDefined();
    expect(body.code).toBe("BAD_REQUEST");
    expect(body.requestId).toBeDefined();
  });

  it("returns 400 when displayName is missing", async () => {
    const res = await request(app)
      .post("/admin/tenants")
      .send({ azureTenantId: "00000000-0000-0000-0000-000000000001" });

    expect(res.status).toBe(400);
    const body = res.body as ErrorBody;
    expect(body.code).toBe("BAD_REQUEST");
    expect(body.error).toMatch(/Validation error/i);
  });

  it("returns 400 for an empty body", async () => {
    const res = await request(app).post("/admin/tenants").send({});

    expect(res.status).toBe(400);
    const body = res.body as ErrorBody;
    expect(body.code).toBe("BAD_REQUEST");
  });

  it("returns 400 when azureTenantId exceeds max length", async () => {
    const res = await request(app)
      .post("/admin/tenants")
      .send({
        azureTenantId: "x".repeat(200),
        displayName: "Acme Corp",
      });

    expect(res.status).toBe(400);
    const body = res.body as ErrorBody & { details?: { issues: unknown[] } };
    expect(body.code).toBe("BAD_REQUEST");
    expect(Array.isArray(body.details?.issues)).toBe(true);
  });
});

// ===========================================================================
// GET /notifications  — Pagination metadata shape
// ===========================================================================

describe("GET /notifications — pagination metadata", () => {
  const app = buildApp(notificationsRouter as unknown as ExpressRouter);

  it("returns { data, meta: { page, limit, offset } } with default pagination", async () => {
    const res = await request(app).get("/notifications");

    expect(res.status).toBe(200);
    const body = res.body as PaginatedBody;
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.meta).toBeDefined();
    expect(typeof body.meta.page).toBe("number");
    expect(typeof body.meta.limit).toBe("number");
    expect(typeof body.meta.offset).toBe("number");
  });

  it("reflects custom page and limit in meta", async () => {
    const res = await request(app).get("/notifications?page=2&limit=10");

    expect(res.status).toBe(200);
    const body = res.body as PaginatedBody;
    expect(body.meta.page).toBe(2);
    expect(body.meta.limit).toBe(10);
    expect(body.meta.offset).toBe(10);
  });

  it("uses default limit of 50 when none is specified", async () => {
    const res = await request(app).get("/notifications");

    expect(res.status).toBe(200);
    const body = res.body as PaginatedBody;
    expect(body.meta.limit).toBe(50);
  });

  it("has offset = 0 on page 1", async () => {
    const res = await request(app).get("/notifications?page=1&limit=25");

    expect(res.status).toBe(200);
    const body = res.body as PaginatedBody;
    expect(body.meta.page).toBe(1);
    expect(body.meta.offset).toBe(0);
  });
});

// ===========================================================================
// GET /billing/subscriptions  — Pagination metadata shape
// ===========================================================================

describe("GET /billing/subscriptions — pagination metadata", () => {
  const app = buildApp(billingRouter as unknown as ExpressRouter);

  it("returns { data, meta: { page, limit, offset } } with default pagination", async () => {
    const res = await request(app).get("/billing/subscriptions");

    expect(res.status).toBe(200);
    const body = res.body as PaginatedBody;
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.meta).toBeDefined();
    expect(typeof body.meta.page).toBe("number");
    expect(typeof body.meta.limit).toBe("number");
    expect(typeof body.meta.offset).toBe("number");
  });

  it("reflects custom page and limit in meta", async () => {
    const res = await request(app).get("/billing/subscriptions?page=3&limit=20");

    expect(res.status).toBe(200);
    const body = res.body as PaginatedBody;
    expect(body.meta.page).toBe(3);
    expect(body.meta.limit).toBe(20);
    expect(body.meta.offset).toBe(40);
  });

  it("clamps limit to 100 when an excessive value is supplied", async () => {
    const res = await request(app).get("/billing/subscriptions?limit=9999");

    expect(res.status).toBe(200);
    const body = res.body as PaginatedBody;
    expect(body.meta.limit).toBeLessThanOrEqual(100);
  });
});
