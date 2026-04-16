import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import express from "express";
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

vi.mock("../../artifacts/api-server/src/lib/platform-flags", () => ({
  isFlagEnabled: vi.fn().mockResolvedValue(true),
}));

vi.mock("../../artifacts/api-server/src/routes/webhooks", () => ({
  deliverWebhookEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../artifacts/api-server/src/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("@szl-holdings/db", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve([])),
        innerJoin: vi.fn(() => ({ where: vi.fn(() => Promise.resolve([])) })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([{ id: 1 }])),
      })),
    })),
  },
  alloySignals: { id: "id", source: "source", sourceType: "sourceType", severity: "severity", title: "title", summary: "summary", domain: "domain", status: "status", metadata: "metadata" },
  connectorsTable: { id: "id", type: "type", name: "name", config: "config" },
}));

vi.mock("@szl-holdings/services", () => ({
  services: {
    salesforce: {
      getHealthReport: vi.fn(() => ({ status: "healthy", adapter: "salesforce", lastCheck: new Date().toISOString() })),
      testConnection: vi.fn(() => Promise.resolve({ connected: true, latencyMs: 10 })),
      runHealthCheck: vi.fn(() => Promise.resolve({ status: "healthy" })),
      queryAccounts: vi.fn(() => Promise.resolve([])),
      queryOpportunities: vi.fn(() => Promise.resolve([])),
      queryCases: vi.fn(() => Promise.resolve([])),
      queryLeads: vi.fn(() => Promise.resolve([])),
      executeSOQL: vi.fn(() => Promise.resolve({ records: [], totalSize: 0 })),
      getPipelineHealth: vi.fn(() => Promise.resolve({ stages: [] })),
      ingestSignals: vi.fn(() => Promise.resolve([])),
      createTask: vi.fn(() => Promise.resolve({ id: "task-1" })),
      createCase: vi.fn(() => Promise.resolve({ id: "case-1" })),
      sync: vi.fn(() => Promise.resolve({ synced: 0, timestamp: new Date().toISOString() })),
    },
    jira: {
      getHealthReport: vi.fn(() => ({ status: "healthy", adapter: "jira", lastCheck: new Date().toISOString() })),
      testConnection: vi.fn(() => Promise.resolve({ connected: true, latencyMs: 10 })),
      runHealthCheck: vi.fn(() => Promise.resolve({ status: "healthy" })),
      listProjects: vi.fn(() => Promise.resolve([])),
      searchIssues: vi.fn(() => Promise.resolve([])),
      getActiveSprints: vi.fn(() => Promise.resolve([])),
      getSprintHealth: vi.fn(() => Promise.resolve([])),
      ingestSignals: vi.fn(() => Promise.resolve([])),
      createIssue: vi.fn(() => Promise.resolve({ id: "jira-1", key: "TEST-1" })),
      sync: vi.fn(() => Promise.resolve({ synced: 0, projects: 0, issues: 0, timestamp: new Date().toISOString() })),
    },
  },
}));

function buildAuthenticatedApp(roles: string[] = ["ops", "super_admin"]) {
  const app = createTestApp();
  app.use((req: unknown, _res: unknown, next: () => void) => {
    (req as Record<string, unknown>).user = {
      id: 1,
      displayName: "Test User",
      email: "test@example.com",
      roles,
      orgs: [],
    };
    next();
  });
  return app;
}

describe("Integration Routes", () => {
  let app: express.Express;
  let integrationsRouter: express.Router;

  beforeEach(async () => {
    vi.clearAllMocks();
    integrationsRouter = (await import("../../artifacts/api-server/src/routes/integrations")).default;
  });

  describe("GET /integrations/salesforce/status", () => {
    it("returns salesforce status for authenticated user", async () => {
      app = buildAuthenticatedApp();
      app.use(integrationsRouter);
      const res = await request(app).get("/integrations/salesforce/status");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("health");
      expect(res.body).toHaveProperty("connection");
    });

    it("returns 401 when not authenticated", async () => {
      const unauthApp = createTestApp();
      unauthApp.use(integrationsRouter);
      const res = await request(unauthApp).get("/integrations/salesforce/status");
      expect(res.status).toBe(401);
    });
  });

  describe("GET /integrations/salesforce/query", () => {
    beforeEach(() => {
      app = buildAuthenticatedApp(["ops", "analyst", "super_admin", "admin"]);
      app.use(integrationsRouter);
    });

    it("returns 400 for missing object parameter", async () => {
      const res = await request(app).get("/integrations/salesforce/query");
      expect(res.status).toBe(400);
    });

    it("returns accounts list", async () => {
      const res = await request(app).get("/integrations/salesforce/query?object=accounts");
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ object: "Account", totalSize: expect.any(Number) });
    });

    it("returns opportunities list", async () => {
      const res = await request(app).get("/integrations/salesforce/query?object=opportunities");
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ object: "Opportunity" });
    });

    it("returns cases list", async () => {
      const res = await request(app).get("/integrations/salesforce/query?object=cases");
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ object: "Case" });
    });

    it("returns leads list", async () => {
      const res = await request(app).get("/integrations/salesforce/query?object=leads");
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ object: "Lead" });
    });

    it("returns 401 when not authenticated", async () => {
      const unauthApp = createTestApp();
      unauthApp.use(integrationsRouter);
      const res = await request(unauthApp).get("/integrations/salesforce/query?object=accounts");
      expect(res.status).toBe(401);
    });
  });

  describe("POST /integrations/salesforce/push/task", () => {
    beforeEach(() => {
      app = buildAuthenticatedApp(["ops", "super_admin", "admin"]);
      app.use(integrationsRouter);
    });

    it("returns 400 when subject is missing", async () => {
      const res = await request(app).post("/integrations/salesforce/push/task").send({});
      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({ error: "subject is required" });
    });

    it("creates task successfully", async () => {
      const res = await request(app).post("/integrations/salesforce/push/task").send({
        subject: "Test Task",
        description: "A test task",
        priority: "High",
      });
      expect([201, 200]).toContain(res.status);
    });
  });

  describe("POST /integrations/salesforce/push/case", () => {
    beforeEach(() => {
      app = buildAuthenticatedApp(["ops", "super_admin", "admin"]);
      app.use(integrationsRouter);
    });

    it("returns 400 when subject is missing", async () => {
      const res = await request(app).post("/integrations/salesforce/push/case").send({});
      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({ error: "subject is required" });
    });

    it("creates case successfully", async () => {
      const res = await request(app).post("/integrations/salesforce/push/case").send({
        subject: "Test Case",
        description: "A test case",
      });
      expect([201, 200]).toContain(res.status);
    });
  });

  describe("POST /integrations/salesforce/webhook", () => {
    it("returns 401 without valid webhook secret", async () => {
      const unauthApp = createTestApp();
      unauthApp.use(integrationsRouter);
      const res = await request(unauthApp)
        .post("/integrations/salesforce/webhook")
        .send({ eventType: "test", sObject: "Account", id: "001" });
      expect(res.status).toBe(401);
    });
  });

  describe("GET /integrations/jira/status", () => {
    it("returns jira status for authenticated user", async () => {
      app = buildAuthenticatedApp();
      app.use(integrationsRouter);
      const res = await request(app).get("/integrations/jira/status");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("health");
      expect(res.body).toHaveProperty("connection");
    });
  });

  describe("GET /integrations/jira/query", () => {
    beforeEach(() => {
      app = buildAuthenticatedApp(["ops", "analyst", "super_admin", "admin"]);
      app.use(integrationsRouter);
    });

    it("returns 400 for missing type parameter", async () => {
      const res = await request(app).get("/integrations/jira/query");
      expect(res.status).toBe(400);
    });

    it("returns projects list", async () => {
      const res = await request(app).get("/integrations/jira/query?type=projects");
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ type: "projects" });
    });

    it("returns issues list", async () => {
      const res = await request(app).get("/integrations/jira/query?type=issues");
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ type: "issues" });
    });

    it("returns sprints list", async () => {
      const res = await request(app).get("/integrations/jira/query?type=sprints");
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ type: "sprints" });
    });
  });

  describe("POST /integrations/jira/push/issue", () => {
    beforeEach(() => {
      app = buildAuthenticatedApp(["ops", "super_admin", "admin"]);
      app.use(integrationsRouter);
    });

    it("returns 400 when projectKey or summary is missing", async () => {
      const res = await request(app).post("/integrations/jira/push/issue").send({});
      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({ error: "projectKey and summary are required" });
    });

    it("creates issue successfully", async () => {
      const res = await request(app).post("/integrations/jira/push/issue").send({
        projectKey: "LYTE",
        summary: "Test Issue",
        description: "A test issue",
      });
      expect([201, 200]).toContain(res.status);
    });
  });

  describe("POST /integrations/jira/webhook", () => {
    it("acknowledges webhook events", async () => {
      app = buildAuthenticatedApp();
      app.use(integrationsRouter);
      const res = await request(app)
        .post("/integrations/jira/webhook")
        .send({
          webhookEvent: "jira:issue_updated",
          issue: { key: "LYTE-1", fields: { summary: "Test issue", status: { name: "In Progress" } } },
        });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("received", true);
    });
  });

  describe("GET /integrations/health", () => {
    it("returns aggregated health for all integrations", async () => {
      app = buildAuthenticatedApp();
      app.use(integrationsRouter);
      const res = await request(app).get("/integrations/health");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("salesforce");
      expect(res.body).toHaveProperty("jira");
    });
  });
});
