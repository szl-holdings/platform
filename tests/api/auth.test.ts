import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import { createTestApp } from "../utils/test-app";

vi.mock("../../artifacts/api-server/src/middlewares/auth", () => {
  const mockAuthMiddleware = (_options: { required?: boolean } = {}) =>
    (req: unknown, res: unknown, next: () => void) => {
      const r = req as Record<string, unknown>;
      const respondRes = res as { status: (n: number) => { json: (b: unknown) => void } };
      if (r["user"]) {
        next();
      } else {
        respondRes.status(401).json({ error: "Authentication required" });
      }
    };

  const requireRole = (..._roles: string[]) =>
    (req: unknown, res: unknown, next: () => void) => {
      const r = req as Record<string, unknown>;
      const user = r["user"] as { roles?: string[] } | undefined;
      const respondRes = res as { status: (n: number) => { json: (b: unknown) => void } };
      if (!user) {
        respondRes.status(401).json({ error: "Authentication required" });
        return;
      }
      const allowed = _roles.some((role) => user?.roles?.includes(role));
      if (!allowed) {
        respondRes.status(403).json({ error: "Insufficient permissions" });
      } else {
        next();
      }
    };

  return {
    authMiddleware: mockAuthMiddleware,
    requireRole,
    parseIdParam: (id: string) => {
      const n = parseInt(id, 10);
      if (isNaN(n)) throw new Error("InvalidId");
      return n;
    },
    InvalidIdError: class InvalidIdError extends Error {},
  };
});

vi.mock("../../artifacts/api-server/src/lib/auth", () => ({
  getSessionToken: vi.fn().mockReturnValue(null),
  getSessionUser: vi.fn().mockResolvedValue(null),
  ISSUER_URL: "https://replit.com/oidc",
  SESSION_COOKIE: "sid",
  SESSION_TTL: 604800000,
  isOidcConfigured: vi.fn().mockReturnValue(false),
  isAzureAdConfigured: vi.fn().mockReturnValue(false),
}));

vi.mock("../../artifacts/api-server/src/lib/websocket.js", () => ({
  issueWsTicket: vi.fn().mockReturnValue("mock-ws-ticket"),
}));

vi.mock("../../artifacts/api-server/src/lib/activity-logger", () => ({
  logActivity: vi.fn().mockResolvedValue(undefined),
}));

const sharedVerifyIdentity = vi.fn();
const sharedGetProviders = vi.fn().mockReturnValue(["replit", "dev"]);

vi.mock("@workspace/auth", () => ({
  createAuthService: vi.fn(() => ({
    verifyIdentity: sharedVerifyIdentity,
    getProviders: sharedGetProviders,
  })),
}));

const sharedDbSelect = vi.fn();
const sharedDbInsert = vi.fn();
const sharedDbDelete = vi.fn();

vi.mock("@workspace/db", () => ({
  db: {
    get select() { return sharedDbSelect; },
    get insert() { return sharedDbInsert; },
    get delete() { return sharedDbDelete; },
    update: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
    values: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
  },
  usersTable: { id: "id", replitId: "replitId", displayName: "displayName", email: "email", avatarUrl: "avatarUrl", isActive: "isActive", createdAt: "createdAt", platformRole: "platformRole" },
  sessionsTable: { id: "id", userId: "userId", token: "token", expiresAt: "expiresAt", ipAddress: "ipAddress", userAgent: "userAgent" },
  rolesTable: { id: "id", name: "name" },
  userRolesTable: { userId: "userId", roleId: "roleId" },
  orgMembersTable: { userId: "userId", orgId: "orgId", role: "role" },
  organizationsTable: { id: "id", slug: "slug", name: "name" },
  azureTenantsTable: { id: "id" },
  connectorsTable: { id: "id", type: "type", name: "name", config: "config" },
  alloySignals: { id: "id" },
  toCanonicalRole: vi.fn().mockReturnValue("viewer"),
  ROLE_HIERARCHY: { super_admin: 100, ops: 80, admin: 60, analyst: 40, viewer: 20, anonymous_visitor: 0 },
  isReadOnlyRole: vi.fn().mockReturnValue(false),
}));

vi.mock("@workspace/observability", () => ({
  serverTelemetry: {
    startSpan: vi.fn().mockReturnValue({ end: vi.fn(), setStatus: vi.fn() }),
    recordError: vi.fn(),
  },
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

function makeSelectChain(result: unknown[]) {
  const resolveChain = vi.fn().mockResolvedValue(result);
  const chain = {
    from: vi.fn(),
    where: resolveChain,
    innerJoin: vi.fn(),
    orderBy: resolveChain,
    limit: resolveChain,
  };
  chain.from.mockReturnValue(chain);
  chain.innerJoin.mockReturnValue(chain);
  return chain;
}

function makeInsertChain(result: unknown[]) {
  const chain = { values: vi.fn(), returning: vi.fn() };
  chain.values.mockReturnValue(chain);
  chain.returning.mockResolvedValue(result);
  return chain;
}

describe("Auth Routes", () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(async () => {
    sharedVerifyIdentity.mockReset();
    sharedDbSelect.mockReset();
    sharedDbInsert.mockReset();
    sharedDbDelete.mockReset();

    app = createTestApp();
    const authRouter = (await import("../../artifacts/api-server/src/routes/auth")).default;
    app.use(authRouter);
  });

  describe("POST /auth/login", () => {
    it("returns 400 when credential is missing", async () => {
      const res = await request(app).post("/auth/login").send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/credential/i);
    });

    it("returns 400 when credential is not a string", async () => {
      const res = await request(app).post("/auth/login").send({ credential: 12345 });
      expect(res.status).toBe(400);
    });

    it("returns 401 when identity verification fails", async () => {
      sharedVerifyIdentity.mockResolvedValueOnce(null);
      const res = await request(app).post("/auth/login").send({ credential: "bad-cred" });
      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({ error: "Invalid credentials" });
    });

    it("returns 403 when account is disabled", async () => {
      const mockUser = { id: 1, displayName: "Test User", email: "test@example.com", replitId: "r1", avatarUrl: null, isActive: false };
      sharedVerifyIdentity.mockResolvedValueOnce({
        externalId: "r1",
        displayName: "Test User",
        email: "test@example.com",
        avatarUrl: null,
      });
      sharedDbSelect.mockReturnValueOnce(makeSelectChain([mockUser]));

      const res = await request(app).post("/auth/login").send({ credential: "valid-cred" });
      expect(res.status).toBe(403);
      expect(res.body).toMatchObject({ error: "Account is disabled" });
    });
  });

  describe("GET /auth/providers", () => {
    it("returns available auth providers", async () => {
      const res = await request(app).get("/auth/providers");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("providers");
      expect(Array.isArray(res.body.providers)).toBe(true);
    });

    it("returns at least one provider", async () => {
      const res = await request(app).get("/auth/providers");
      expect(res.status).toBe(200);
      expect(res.body.providers.length).toBeGreaterThan(0);
    });
  });

  describe("GET /auth/me", () => {
    it("returns 401 when not authenticated", async () => {
      const res = await request(app).get("/auth/me");
      expect(res.status).toBe(401);
    });

    it("returns user data when authenticated and user exists", async () => {
      const authenticatedApp = createTestApp();
      authenticatedApp.use((req: unknown, _res: unknown, next: () => void) => {
        (req as Record<string, unknown>).user = {
          id: 1,
          displayName: "Test User",
          email: "test@example.com",
          roles: ["viewer"],
          orgs: [],
        };
        next();
      });
      const authRouter = (await import("../../artifacts/api-server/src/routes/auth")).default;
      authenticatedApp.use(authRouter);

      const mockUser = { id: 1, displayName: "Test User", email: "test@example.com", avatarUrl: null };
      sharedDbSelect.mockReturnValueOnce(makeSelectChain([mockUser]));

      const res = await request(authenticatedApp).get("/auth/me");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("id");
      expect(res.body).toHaveProperty("displayName");
      expect(res.body).toHaveProperty("email");
    });
  });

  describe("GET /auth/roles", () => {
    it("returns 401 when not authenticated", async () => {
      const res = await request(app).get("/auth/roles");
      expect(res.status).toBe(401);
    });

    it("returns roles list for privileged user (ops)", async () => {
      const privilegedApp = createTestApp();
      privilegedApp.use((req: unknown, _res: unknown, next: () => void) => {
        (req as Record<string, unknown>).user = {
          id: 1,
          displayName: "Admin User",
          email: "admin@example.com",
          roles: ["ops"],
          orgs: [],
        };
        next();
      });
      const authRouter = (await import("../../artifacts/api-server/src/routes/auth")).default;
      privilegedApp.use(authRouter);

      sharedDbSelect.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue([
            { id: 1, name: "ops" },
            { id: 2, name: "viewer" },
          ]),
        }),
      });

      const res = await request(privilegedApp).get("/auth/roles");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe("GET /auth/users", () => {
    it("returns 401 when not authenticated", async () => {
      const res = await request(app).get("/auth/users");
      expect(res.status).toBe(401);
    });

    it("returns 403 when user has insufficient role", async () => {
      const viewerApp = createTestApp();
      viewerApp.use((req: unknown, _res: unknown, next: () => void) => {
        (req as Record<string, unknown>).user = {
          id: 1,
          displayName: "Viewer",
          email: "viewer@example.com",
          roles: ["viewer"],
          orgs: [],
        };
        next();
      });
      const authRouter = (await import("../../artifacts/api-server/src/routes/auth")).default;
      viewerApp.use(authRouter);

      const res = await request(viewerApp).get("/auth/users");
      expect(res.status).toBe(403);
    });
  });

  describe("DELETE /auth/sessions/current", () => {
    it("returns 401 when not authenticated", async () => {
      const res = await request(app).delete("/auth/sessions/current");
      expect(res.status).toBe(401);
    });
  });
});
