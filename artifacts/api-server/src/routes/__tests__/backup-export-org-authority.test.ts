/**
 * AF-004 — Backup Export Org Authority
 *
 * Verifies that POST /admin/backup/export-tenant enforces an org-authority
 * check on the `orgId` body parameter:
 *   - admin-role user requesting another org's data → 403
 *   - admin-role user requesting their own org's data → 200
 *   - admin-role user omitting orgId (cross-org dump)  → 403
 *   - super_admin user requesting any org's data       → 200
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import type { AuthenticatedUser } from "../../middlewares/auth";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@szl-holdings/observability", () => ({
  serverTelemetry: { recordAuthFailure: vi.fn(), recordRequest: vi.fn() },
}));

vi.mock("@szl-holdings/db", () => ({
  pool: { query: vi.fn().mockResolvedValue({ rows: [] }) },
  PgPool: class MockPgPool {
    query() { return Promise.resolve({ rows: [] }); }
    end() { return Promise.resolve(); }
    on() { return this; }
  },
  db: {},
  usersTable: {},
  sessionsTable: {},
  userRolesTable: {},
  rolesTable: {},
  orgMembersTable: {},
  organizationsTable: {},
  ROLE_HIERARCHY: {},
  isReadOnlyRole: () => false,
  toCanonicalRole: (r: string) => r,
}));

vi.mock("../../lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock("../../lib/backup-service", () => ({
  getBackupHealthStatus: vi.fn(),
  listBackups: vi.fn(),
  runBackup: vi.fn(),
  exportTenantData: vi.fn(async () => ({ users: [{ id: 1 }] })),
}));

// Stub out auth middleware so we can inject req.user per-test.
let currentUser: AuthenticatedUser | null = null;
vi.mock("../../middlewares/auth", async () => {
  const actual = await vi.importActual<typeof import("../../middlewares/auth")>(
    "../../middlewares/auth"
  );
  return {
    ...actual,
    authMiddleware: () => (req: express.Request, _res: express.Response, next: express.NextFunction) => {
      if (currentUser) req.user = currentUser;
      next();
    },
    requireRole: () => (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
  };
});

function buildApp(router: express.Router): express.Express {
  const app = express();
  app.use(express.json());
  app.use(router);
  return app;
}

function makeUser(overrides: Partial<AuthenticatedUser>): AuthenticatedUser {
  return {
    id: 1,
    displayName: "Test User",
    email: "test@example.com",
    roles: [],
    orgs: [],
    ...overrides,
  } as AuthenticatedUser;
}

describe("POST /admin/backup/export-tenant — org authority (AF-004)", () => {
  let backupRouter: express.Router;

  beforeEach(async () => {
    vi.resetModules();
    backupRouter = ((await import("../backup.js")) as { default: express.Router }).default;
  });

  it("returns 403 when an admin requests another org's data", async () => {
    currentUser = makeUser({
      id: 10,
      roles: ["admin"],
      orgs: [{ orgId: 1, orgSlug: "my-org", orgName: "My Org", role: "admin" }],
    });
    const app = buildApp(backupRouter);
    const res = await request(app)
      .post("/admin/backup/export-tenant")
      .send({ orgId: 999 });
    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 403 when a non-super_admin omits orgId (cross-org dump)", async () => {
    currentUser = makeUser({
      id: 11,
      roles: ["admin"],
      orgs: [{ orgId: 1, orgSlug: "my-org", orgName: "My Org", role: "admin" }],
    });
    const app = buildApp(backupRouter);
    const res = await request(app).post("/admin/backup/export-tenant").send({});
    expect(res.status).toBe(403);
  });

  it("allows an admin to export their own org's data", async () => {
    currentUser = makeUser({
      id: 12,
      roles: ["admin"],
      orgs: [{ orgId: 7, orgSlug: "my-org", orgName: "My Org", role: "admin" }],
    });
    const app = buildApp(backupRouter);
    const res = await request(app)
      .post("/admin/backup/export-tenant")
      .send({ orgId: 7 })
      .buffer(true);
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/zip/);
  });

  it("allows a super_admin to export any org's data", async () => {
    currentUser = makeUser({
      id: 13,
      roles: ["super_admin"],
      orgs: [],
    });
    const app = buildApp(backupRouter);
    const res = await request(app)
      .post("/admin/backup/export-tenant")
      .send({ orgId: 999 })
      .buffer(true);
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/zip/);
  });

  it("allows a super_admin to omit orgId for a cross-org export", async () => {
    currentUser = makeUser({
      id: 14,
      roles: ["super_admin"],
      orgs: [],
    });
    const app = buildApp(backupRouter);
    const res = await request(app)
      .post("/admin/backup/export-tenant")
      .send({})
      .buffer(true);
    expect(res.status).toBe(200);
  });
});
