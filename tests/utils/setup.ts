import { vi } from "vitest";

vi.mock("@workspace/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
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
  connectorsTable: { id: "id", type: "type", name: "name", config: "config" },
  alloySignals: { id: "id", source: "source", sourceType: "sourceType", severity: "severity", title: "title", summary: "summary", domain: "domain", status: "status", metadata: "metadata" },
  toCanonicalRole: vi.fn().mockReturnValue("viewer"),
  ROLE_HIERARCHY: { super_admin: 100, ops: 80, admin: 60, analyst: 40, viewer: 20, anonymous_visitor: 0 },
  isReadOnlyRole: vi.fn().mockReturnValue(false),
}));

vi.mock("@workspace/auth", () => ({
  createAuthService: vi.fn(() => ({
    verifyIdentity: vi.fn(),
    getProviders: vi.fn().mockReturnValue(["replit"]),
  })),
}));

vi.mock("@workspace/observability", () => ({
  serverTelemetry: {
    startSpan: vi.fn().mockReturnValue({ end: vi.fn(), setStatus: vi.fn() }),
    recordError: vi.fn(),
  },
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("@workspace/services", () => ({
  services: {
    salesforce: {
      getHealthReport: vi.fn().mockReturnValue({ status: "ok" }),
      testConnection: vi.fn().mockResolvedValue({ connected: true }),
      runHealthCheck: vi.fn().mockResolvedValue({ status: "ok" }),
      queryAccounts: vi.fn().mockResolvedValue([]),
      queryOpportunities: vi.fn().mockResolvedValue([]),
      queryCases: vi.fn().mockResolvedValue([]),
      queryLeads: vi.fn().mockResolvedValue([]),
      getPipelineHealth: vi.fn().mockResolvedValue({}),
      ingestSignals: vi.fn().mockResolvedValue([]),
      executeSOQL: vi.fn().mockResolvedValue({ records: [] }),
      sync: vi.fn().mockResolvedValue({ synced: 0, timestamp: new Date().toISOString() }),
      createTask: vi.fn().mockResolvedValue({ id: "t1", success: true }),
      createCase: vi.fn().mockResolvedValue({ id: "c1", success: true }),
    },
    jira: {
      getHealthReport: vi.fn().mockReturnValue({ status: "ok" }),
      testConnection: vi.fn().mockResolvedValue({ connected: true }),
      runHealthCheck: vi.fn().mockResolvedValue({ status: "ok" }),
      listProjects: vi.fn().mockResolvedValue([]),
      searchIssues: vi.fn().mockResolvedValue([]),
      getActiveSprints: vi.fn().mockResolvedValue([]),
      getSprintHealth: vi.fn().mockResolvedValue([]),
      ingestSignals: vi.fn().mockResolvedValue([]),
      sync: vi.fn().mockResolvedValue({ projects: 0, issues: 0, timestamp: new Date().toISOString() }),
      createIssue: vi.fn().mockResolvedValue({ id: "i1", key: "LYTE-1", self: "" }),
      handleWebhookEvent: vi.fn().mockResolvedValue({ id: "ev1", timestamp: new Date().toISOString() }),
    },
  },
}));

vi.mock("../artifacts/api-server/src/lib/platform-flags", () => ({
  isFlagEnabled: vi.fn().mockResolvedValue(true),
}));

vi.mock("../artifacts/api-server/src/routes/webhooks", () => ({
  deliverWebhookEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../artifacts/api-server/src/lib/activity-logger", () => ({
  logActivity: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../artifacts/api-server/src/lib/websocket.js", () => ({
  issueWsTicket: vi.fn().mockReturnValue("mock-ws-ticket"),
}));

vi.mock("../artifacts/api-server/src/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));
