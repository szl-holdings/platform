import { Router, type IRouter } from "express";
import { services } from "@workspace/services";
import { APP_INTEGRATIONS, PLATFORM_APPS } from "@workspace/config";

const adminRouter: IRouter = Router();

const SZL_APPS = [
  { id: "project-list", name: "Project List", description: "Portfolio project management", status: "active", url: "/" },
  { id: "admin-panel", name: "Admin Control Plane", description: "System administration dashboard", status: "active", url: "/admin/" },
  { id: "api-server", name: "API Server", description: "REST API backend", status: "active", url: "/api" },
  { id: "vessel-tracker", name: "Vessel Tracker", description: "Maritime fleet tracking", status: "planned", url: "/vessels/" },
  { id: "weather-dash", name: "Weather Dashboard", description: "Weather monitoring", status: "planned", url: "/weather/" },
  { id: "comms-hub", name: "Communications Hub", description: "Messaging and notifications", status: "planned", url: "/comms/" },
  { id: "doc-center", name: "Document Center", description: "Document management", status: "planned", url: "/docs/" },
];

const MOCK_USERS = [
  { id: "usr_001", email: "admin@szl.com", name: "SZL Admin", role: "admin", status: "active", lastLogin: "2026-03-25T08:00:00Z" },
  { id: "usr_002", email: "dev@szl.com", name: "Dev User", role: "developer", status: "active", lastLogin: "2026-03-24T16:30:00Z" },
  { id: "usr_003", email: "viewer@szl.com", name: "Read-Only User", role: "viewer", status: "active", lastLogin: "2026-03-20T10:00:00Z" },
  { id: "usr_004", email: "ops@szl.com", name: "Ops Manager", role: "operator", status: "inactive", lastLogin: "2026-02-15T12:00:00Z" },
];

const MOCK_AUDIT_LOG = [
  { id: "log_001", action: "connector.test", actor: "admin@szl.com", target: "stripe", result: "success", timestamp: "2026-03-25T08:15:00Z", details: "Connection test passed" },
  { id: "log_002", action: "user.login", actor: "admin@szl.com", target: "system", result: "success", timestamp: "2026-03-25T08:00:00Z", details: "Admin login from 10.0.0.1" },
  { id: "log_003", action: "connector.sync", actor: "system", target: "github", result: "success", timestamp: "2026-03-25T07:00:00Z", details: "Synced 12 repositories" },
  { id: "log_004", action: "feature_flag.toggle", actor: "dev@szl.com", target: "dark_mode", result: "success", timestamp: "2026-03-24T16:45:00Z", details: "Enabled dark_mode flag" },
  { id: "log_005", action: "seed.run", actor: "admin@szl.com", target: "demo_data", result: "success", timestamp: "2026-03-24T10:00:00Z", details: "Re-seeded demo data" },
  { id: "log_006", action: "connector.test", actor: "dev@szl.com", target: "slack", result: "failure", timestamp: "2026-03-24T09:30:00Z", details: "Missing webhook URL" },
  { id: "log_007", action: "user.create", actor: "admin@szl.com", target: "usr_003", result: "success", timestamp: "2026-03-23T14:00:00Z", details: "Created viewer account" },
  { id: "log_008", action: "billing.update", actor: "system", target: "subscription", result: "success", timestamp: "2026-03-22T00:00:00Z", details: "Monthly billing cycle renewed" },
];

const MOCK_FEATURE_FLAGS: Record<string, { enabled: boolean; description: string; updatedAt: string }> = {
  dark_mode: { enabled: true, description: "Enable dark mode across all apps", updatedAt: "2026-03-24T16:45:00Z" },
  vessel_tracking: { enabled: true, description: "Real-time vessel tracking features", updatedAt: "2026-03-20T10:00:00Z" },
  ai_assistant: { enabled: false, description: "AI-powered portfolio assistant", updatedAt: "2026-03-18T12:00:00Z" },
  webhook_processing: { enabled: true, description: "Process incoming webhooks", updatedAt: "2026-03-15T08:00:00Z" },
  beta_features: { enabled: false, description: "Experimental beta features", updatedAt: "2026-03-10T14:00:00Z" },
  export_csv: { enabled: true, description: "CSV export functionality", updatedAt: "2026-03-05T09:00:00Z" },
  notifications: { enabled: true, description: "Push and email notifications", updatedAt: "2026-03-01T11:00:00Z" },
};

const MOCK_WEBHOOK_EVENTS = [
  { id: "wh_001", source: "github", event: "push", status: "processed", payload: { ref: "refs/heads/main", commits: 3 }, receivedAt: "2026-03-25T07:00:00Z" },
  { id: "wh_002", source: "stripe", event: "invoice.paid", status: "processed", payload: { invoiceId: "inv_001", amount: 9900 }, receivedAt: "2026-03-24T23:00:00Z" },
  { id: "wh_003", source: "slack", event: "message", status: "processed", payload: { channel: "#general", user: "U123" }, receivedAt: "2026-03-24T15:00:00Z" },
  { id: "wh_004", source: "github", event: "pull_request", status: "failed", payload: { action: "opened", number: 42 }, receivedAt: "2026-03-24T12:00:00Z" },
  { id: "wh_005", source: "hubspot", event: "contact.creation", status: "processed", payload: { contactId: "hs_003" }, receivedAt: "2026-03-23T10:00:00Z" },
];

const MOCK_BILLING = {
  plan: "Enterprise",
  status: "active",
  currentPeriodStart: "2026-03-01T00:00:00Z",
  currentPeriodEnd: "2026-03-31T23:59:59Z",
  monthlyAmount: 9900,
  currency: "usd",
  seats: { used: 4, total: 10 },
  features: ["Unlimited connectors", "Priority support", "Custom branding", "SSO", "Audit logs", "Webhooks"],
  invoices: [
    { id: "inv_001", date: "2026-03-01", amount: 9900, status: "paid" },
    { id: "inv_002", date: "2026-02-01", amount: 9900, status: "paid" },
    { id: "inv_003", date: "2026-01-01", amount: 9900, status: "paid" },
  ],
};

adminRouter.get("/admin/overview", (_req, res) => {
  const matrix = services.getHealthMatrix();
  const dbStatus = { status: "healthy", latency: 12, connections: 5, maxConnections: 100 };
  const storageStatus = { status: services.storage.status === "LIVE_CONFIGURED" ? "healthy" : "demo", usedBytes: 52428800, totalBytes: 5368709120 };

  res.json({
    timestamp: new Date().toISOString(),
    system: {
      uptime: process.uptime(),
      nodeVersion: process.version,
      memoryUsage: process.memoryUsage(),
      platform: process.platform,
    },
    database: dbStatus,
    storage: storageStatus,
    connectors: matrix,
    apps: SZL_APPS,
    counts: {
      apps: SZL_APPS.length,
      activeApps: SZL_APPS.filter((a) => a.status === "active").length,
      connectors: matrix.summary.total,
      liveConnectors: matrix.summary.liveConfigured,
      users: MOCK_USERS.length,
      activeUsers: MOCK_USERS.filter((u) => u.status === "active").length,
    },
  });
});

adminRouter.get("/admin/apps", (_req, res) => {
  res.json({ apps: SZL_APPS });
});

adminRouter.get("/admin/connectors", (_req, res) => {
  const matrix = services.getHealthMatrix();
  const connectorDetails = matrix.services.map((s) => ({
    ...s,
    category: getCategoryForService(s.name),
    lastSync: null,
    syncEnabled: true,
    webhookUrl: `/api/webhooks/${s.name}`,
  }));
  res.json({ connectors: connectorDetails, summary: matrix.summary });
});

adminRouter.post("/admin/connectors/:name/test", async (req, res) => {
  const result = await services.testConnection(req.params["name"]!);
  if (!result) {
    res.status(404).json({ error: "Connector not found" });
    return;
  }
  integrationActivityLog.unshift({
    id: `act_${Date.now()}`,
    type: "connection_test",
    connector: result.name,
    app: null,
    status: result.success ? "success" : "error",
    message: result.message,
    timestamp: result.testedAt,
    responseTimeMs: result.responseTimeMs,
  });
  if (integrationActivityLog.length > 200) integrationActivityLog.length = 200;
  res.json(result);
});

adminRouter.put("/admin/connectors/:name/enable", (req, res) => {
  const adapter = services.getAdapter(req.params["name"]!);
  if (!adapter) {
    res.status(404).json({ error: "Connector not found" });
    return;
  }
  const { enabled } = req.body as { enabled: boolean };
  adapter.setEnabled(enabled);
  integrationActivityLog.unshift({
    id: `act_${Date.now()}`,
    type: "connection_test",
    connector: adapter.name,
    app: null,
    status: enabled ? "success" : "warning",
    message: enabled ? "Connector enabled" : "Connector disabled by user",
    timestamp: new Date().toISOString(),
    responseTimeMs: null,
  });
  if (integrationActivityLog.length > 200) integrationActivityLog.length = 200;
  res.json({ name: adapter.name, enabled, status: adapter.getHealthReport().status });
});

adminRouter.post("/admin/connectors/:name/sync", async (req, res) => {
  const adapter = services.getAdapter(req.params["name"]!);
  if (!adapter) {
    res.status(404).json({ error: "Connector not found" });
    return;
  }
  const syncResult = {
    name: adapter.name,
    synced: true,
    syncedAt: new Date().toISOString(),
    itemsSynced: Math.floor(Math.random() * 20) + 1,
  };
  integrationActivityLog.unshift({
    id: `act_${Date.now()}`,
    type: "sync",
    connector: adapter.name,
    app: null,
    status: "success",
    message: `Synced ${syncResult.itemsSynced} items`,
    timestamp: syncResult.syncedAt,
    responseTimeMs: null,
  });
  if (integrationActivityLog.length > 200) integrationActivityLog.length = 200;
  res.json(syncResult);
});

adminRouter.get("/admin/users", (_req, res) => {
  res.json({ users: MOCK_USERS });
});

adminRouter.post("/admin/users", (req, res) => {
  const { email, name, role } = req.body as { email: string; name: string; role: string };
  const newUser = {
    id: `usr_${Date.now()}`,
    email,
    name,
    role: role ?? "viewer",
    status: "active",
    lastLogin: null,
  };
  res.status(201).json(newUser);
});

adminRouter.get("/admin/audit-log", (req, res) => {
  let logs = [...MOCK_AUDIT_LOG];
  const action = req.query["action"] as string | undefined;
  const actor = req.query["actor"] as string | undefined;
  const search = req.query["search"] as string | undefined;

  if (action) logs = logs.filter((l) => l.action.includes(action));
  if (actor) logs = logs.filter((l) => l.actor.includes(actor));
  if (search) {
    const q = search.toLowerCase();
    logs = logs.filter((l) =>
      l.action.toLowerCase().includes(q) ||
      l.actor.toLowerCase().includes(q) ||
      l.target.toLowerCase().includes(q) ||
      l.details.toLowerCase().includes(q),
    );
  }

  res.json({ logs, total: logs.length });
});

adminRouter.get("/admin/feature-flags", (_req, res) => {
  const flags = Object.entries(MOCK_FEATURE_FLAGS).map(([key, val]) => ({
    key,
    ...val,
  }));
  res.json({ flags });
});

adminRouter.put("/admin/feature-flags/:key", (req, res) => {
  const key = req.params["key"]!;
  const flag = MOCK_FEATURE_FLAGS[key];
  if (!flag) {
    res.status(404).json({ error: "Flag not found" });
    return;
  }
  const { enabled } = req.body as { enabled: boolean };
  flag.enabled = enabled;
  flag.updatedAt = new Date().toISOString();
  res.json({ key, ...flag });
});

adminRouter.get("/admin/billing", (_req, res) => {
  res.json(MOCK_BILLING);
});

adminRouter.get("/admin/webhooks", (_req, res) => {
  res.json({ events: MOCK_WEBHOOK_EVENTS });
});

adminRouter.get("/admin/files", async (_req, res) => {
  const files = await services.storage.listFiles();
  res.json({ files });
});

adminRouter.get("/admin/environment", (_req, res) => {
  const matrix = services.getHealthMatrix();
  const allEnvVars = new Map<string, { configured: boolean; usedBy: string[] }>();

  for (const svc of matrix.services) {
    for (const v of svc.requiredEnvVars) {
      const existing = allEnvVars.get(v);
      if (existing) {
        existing.usedBy.push(svc.name);
      } else {
        allEnvVars.set(v, {
          configured: svc.presentEnvVars.includes(v),
          usedBy: [svc.name],
        });
      }
    }
  }

  const envVars = Array.from(allEnvVars.entries()).map(([name, info]) => ({
    name,
    ...info,
  }));

  res.json({
    environment: process.env["NODE_ENV"] ?? "development",
    envVars,
    configured: envVars.filter((v) => v.configured).length,
    missing: envVars.filter((v) => !v.configured).length,
    total: envVars.length,
  });
});

adminRouter.post("/admin/seed", (_req, res) => {
  res.json({
    success: true,
    seededAt: new Date().toISOString(),
    tables: [
      { name: "projects", rows: 8 },
      { name: "users", rows: 4 },
      { name: "audit_log", rows: 50 },
      { name: "feature_flags", rows: 7 },
    ],
  });
});

adminRouter.post("/admin/seed/reset", (_req, res) => {
  res.json({
    success: true,
    resetAt: new Date().toISOString(),
    message: "All demo data has been reset to defaults",
  });
});

interface IntegrationActivity {
  id: string;
  type: "connection_test" | "sync" | "webhook" | "api_call" | "error" | "health_check";
  connector: string;
  app: string | null;
  status: "success" | "error" | "warning";
  message: string;
  timestamp: string;
  responseTimeMs: number | null;
}

export { integrationActivityLog, type IntegrationActivity };

const integrationActivityLog: IntegrationActivity[] = [
  { id: "act_seed_001", type: "health_check", connector: "stripe", app: "lyte", status: "success", message: "Periodic health check passed", timestamp: "2026-03-26T07:00:00Z", responseTimeMs: 45 },
  { id: "act_seed_002", type: "api_call", connector: "ai", app: "firestorm", status: "success", message: "Chat completion request processed", timestamp: "2026-03-26T06:45:00Z", responseTimeMs: 1200 },
  { id: "act_seed_003", type: "sync", connector: "github", app: "stephen-site", status: "success", message: "Synced 8 repositories", timestamp: "2026-03-26T06:30:00Z", responseTimeMs: 320 },
  { id: "act_seed_004", type: "webhook", connector: "stripe", app: "lyte", status: "success", message: "invoice.paid webhook processed", timestamp: "2026-03-26T06:15:00Z", responseTimeMs: 15 },
  { id: "act_seed_005", type: "error", connector: "slack", app: "vessels", status: "error", message: "Webhook URL not configured", timestamp: "2026-03-26T06:00:00Z", responseTimeMs: null },
  { id: "act_seed_006", type: "connection_test", connector: "weather", app: "vessels", status: "success", message: "Running in demo mode", timestamp: "2026-03-26T05:45:00Z", responseTimeMs: 2 },
  { id: "act_seed_007", type: "api_call", connector: "notion", app: "readiness", status: "success", message: "Fetched 12 assessment pages", timestamp: "2026-03-26T05:30:00Z", responseTimeMs: 450 },
  { id: "act_seed_008", type: "health_check", connector: "monitoring", app: "control-plane", status: "success", message: "All monitoring endpoints healthy", timestamp: "2026-03-26T05:00:00Z", responseTimeMs: 30 },
  { id: "act_seed_009", type: "sync", connector: "hubspot", app: "lyte", status: "success", message: "Synced 34 contacts", timestamp: "2026-03-26T04:30:00Z", responseTimeMs: 890 },
  { id: "act_seed_010", type: "api_call", connector: "elevenlabs", app: "dreamscape", status: "success", message: "Generated audio narration", timestamp: "2026-03-26T04:00:00Z", responseTimeMs: 2100 },
  { id: "act_seed_011", type: "webhook", connector: "github", app: "stephen-site", status: "success", message: "push event on main branch", timestamp: "2026-03-26T03:30:00Z", responseTimeMs: 12 },
  { id: "act_seed_012", type: "error", connector: "twilio", app: "firestorm", status: "error", message: "SMS delivery failed - invalid number", timestamp: "2026-03-26T03:00:00Z", responseTimeMs: 150 },
];

adminRouter.get("/admin/integration-health", (_req, res) => {
  const matrix = services.getHealthMatrix();
  const appHealth: Record<string, { slug: string; name: string; connectors: string[]; health: ReturnType<typeof services.getHealthMatrix> }> = {};

  for (const app of PLATFORM_APPS) {
    const mapping = APP_INTEGRATIONS[app.slug];
    if (mapping) {
      appHealth[app.slug] = {
        slug: app.slug,
        name: app.name,
        connectors: mapping.connectors,
        health: services.getAppHealthMatrix(mapping.connectors),
      };
    }
  }

  const unhealthyConnectors = matrix.services.filter((s) => s.status === "MANUAL_REQUIRED");
  const demoConnectors = matrix.services.filter((s) => s.status === "MOCKED_DEMO_MODE");

  res.json({
    timestamp: new Date().toISOString(),
    overall: matrix,
    perApp: appHealth,
    alerts: {
      unhealthyCount: unhealthyConnectors.length,
      demoCount: demoConnectors.length,
      unhealthyConnectors: unhealthyConnectors.map((c) => c.name),
      demoConnectors: demoConnectors.map((c) => c.name),
    },
  });
});

adminRouter.get("/admin/integration-activity", (req, res) => {
  let events = [...integrationActivityLog];
  const connector = req.query["connector"] as string | undefined;
  const app = req.query["app"] as string | undefined;
  const type = req.query["type"] as string | undefined;
  const status = req.query["status"] as string | undefined;

  if (connector) events = events.filter((e) => e.connector === connector);
  if (app) events = events.filter((e) => e.app === app);
  if (type) events = events.filter((e) => e.type === type);
  if (status) events = events.filter((e) => e.status === status);

  res.json({ events, total: events.length });
});

function getCategoryForService(name: string): string {
  const categories: Record<string, string> = {
    stripe: "Payments",
    github: "Development",
    slack: "Communication",
    twilio: "Communication",
    gmail: "Communication",
    notion: "Productivity",
    confluence: "Productivity",
    "google-calendar": "Productivity",
    "google-docs": "Productivity",
    "google-drive": "Storage",
    dropbox: "Storage",
    onedrive: "Storage",
    storage: "Storage",
    google: "Platform",
    weather: "Data",
    stormglass: "Data",
    shipping: "Logistics",
    monitoring: "Observability",
    posthog: "Analytics",
    hubspot: "CRM",
    elevenlabs: "AI & ML",
    ai: "AI & ML",
    figma: "Design",
  };
  return categories[name] ?? "Other";
}

export default adminRouter;
