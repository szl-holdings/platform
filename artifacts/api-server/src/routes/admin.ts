import { Router, type IRouter } from "express";
import { services } from "@workspace/services";
import { APP_INTEGRATIONS, PLATFORM_APPS } from "@workspace/config";
import { db, pool, billingPlansTable, subscriptionsTable, invoicesTable, entitlementsTable, usageEventsTable } from "@workspace/db";
import { desc, sql } from "drizzle-orm";

const adminRouter: IRouter = Router();

const SZL_APPS = [
  { id: "project-list", name: "Project List", description: "Portfolio project management", status: "active", url: "/" },
  { id: "admin-panel", name: "Admin Control Plane", description: "System administration dashboard", status: "active", url: "/admin/" },
  { id: "api-server", name: "API Server", description: "REST API backend", status: "active", url: "/api/healthz" },
  { id: "vessel-tracker", name: "Vessel Tracker", description: "Maritime fleet tracking", status: "active", url: "/vessels/" },
  { id: "firestorm", name: "Firestorm Security", description: "Security simulation platform", status: "active", url: "/firestorm/" },
  { id: "stephen-site", name: "Stephen Lutar", description: "Personal portfolio site", status: "active", url: "/stephen/" },
  { id: "mockup-sandbox", name: "Component Preview", description: "Design system preview", status: "active", url: "/__mockup/" },
];

const MOCK_USERS = [
  { id: "usr_001", email: "admin@szl.com", name: "SZL Admin", role: "admin", status: "active", lastLogin: "2026-03-25T08:00:00Z" },
  { id: "usr_002", email: "dev@szl.com", name: "Dev User", role: "developer", status: "active", lastLogin: "2026-03-24T16:30:00Z" },
  { id: "usr_003", email: "viewer@szl.com", name: "Read-Only User", role: "viewer", status: "active", lastLogin: "2026-03-20T10:00:00Z" },
  { id: "usr_004", email: "ops@szl.com", name: "Ops Manager", role: "ops", status: "inactive", lastLogin: "2026-02-15T12:00:00Z" },
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

const VALID_TABLE_NAMES = new Set([
  "roles", "users", "organizations", "org_members", "user_roles",
  "connectors", "connector_logs", "notifications", "notification_preferences",
  "activity_log", "audit_events", "sessions", "api_keys",
  "feature_flags", "feature_flag_overrides",
  "billing_plans", "subscriptions", "invoices", "entitlements", "usage_events",
  "files", "assets", "apps_registry", "health_checks", "webhook_events",
  "projects",
  "stephen_site_testimonials", "stephen_site_case_studies", "stephen_site_contacts",
  "stephen_content_blocks", "stephen_case_studies", "stephen_booking_requests",
  "vessels_fleets", "vessels", "vessels_positions", "vessels_cargo",
  "vessels_routes", "vessels_alert_rules", "vessels_alerts",
  "vessels_weather_snapshots", "vessels_simulations",
  "firestorm_scenarios", "firestorm_assessments", "firestorm_simulation_runs",
  "firestorm_findings", "firestorm_risk_scores",
  "firestorm_campaigns", "firestorm_leads", "firestorm_analytics",
  "lyte_workspaces", "lyte_signals", "lyte_command_cards",
  "lyte_incidents", "lyte_playbooks", "lyte_recommendations",
  "dreamscape_campaigns", "dreamscape_scripts", "dreamscape_storyboards",
  "dreamscape_voice_assets", "dreamscape_campaign_assets", "dreamscape_reviews",
  "readiness_programs", "readiness_dimensions", "readiness_score_history",
  "readiness_milestones", "readiness_risks", "readiness_alerts",
]);

const SEED_TABLE_EXPECTATIONS = [
  { table: "roles", minRows: 6, description: "RBAC roles" },
  { table: "users", minRows: 6, description: "Platform users" },
  { table: "organizations", minRows: 1, description: "Organizations" },
  { table: "org_members", minRows: 6, description: "Organization members" },
  { table: "connectors", minRows: 5, description: "Integration connectors" },
  { table: "connector_logs", minRows: 4, description: "Connector logs" },
  { table: "notifications", minRows: 4, description: "Notifications" },
  { table: "notification_preferences", minRows: 3, description: "Notification preferences" },
  { table: "activity_log", minRows: 3, description: "Activity log entries" },
  { table: "audit_events", minRows: 3, description: "Audit events" },
  { table: "sessions", minRows: 2, description: "User sessions" },
  { table: "api_keys", minRows: 2, description: "API keys" },
  { table: "feature_flags", minRows: 6, description: "Feature flags" },
  { table: "feature_flag_overrides", minRows: 2, description: "Feature flag overrides" },
  { table: "billing_plans", minRows: 4, description: "Billing plans" },
  { table: "subscriptions", minRows: 1, description: "Subscriptions" },
  { table: "invoices", minRows: 3, description: "Invoices" },
  { table: "entitlements", minRows: 8, description: "Plan entitlements" },
  { table: "usage_events", minRows: 6, description: "Usage events" },
  { table: "files", minRows: 3, description: "Uploaded files" },
  { table: "assets", minRows: 3, description: "File assets" },
  { table: "apps_registry", minRows: 7, description: "Registered apps" },
  { table: "health_checks", minRows: 4, description: "Health check records" },
  { table: "webhook_events", minRows: 3, description: "Webhook events" },
  { table: "projects", minRows: 6, description: "Portfolio projects" },
  { table: "stephen_site_testimonials", minRows: 3, description: "Testimonials" },
  { table: "stephen_site_case_studies", minRows: 2, description: "Case studies" },
  { table: "stephen_site_contacts", minRows: 2, description: "Site contacts" },
  { table: "vessels_fleets", minRows: 3, description: "Vessel fleets" },
  { table: "vessels", minRows: 5, description: "Vessels" },
  { table: "vessels_positions", minRows: 6, description: "Vessel positions" },
  { table: "vessels_cargo", minRows: 4, description: "Vessel cargo" },
  { table: "vessels_routes", minRows: 4, description: "Vessel routes" },
  { table: "vessels_alert_rules", minRows: 5, description: "Vessel alert rules" },
  { table: "vessels_alerts", minRows: 4, description: "Vessel alerts" },
  { table: "vessels_weather_snapshots", minRows: 5, description: "Weather snapshots" },
  { table: "vessels_simulations", minRows: 3, description: "Vessel simulations" },
  { table: "firestorm_scenarios", minRows: 8, description: "Security scenarios" },
  { table: "firestorm_assessments", minRows: 4, description: "Security assessments" },
  { table: "firestorm_simulation_runs", minRows: 4, description: "Simulation runs" },
  { table: "firestorm_findings", minRows: 8, description: "Security findings" },
  { table: "firestorm_risk_scores", minRows: 8, description: "Risk scores" },
  { table: "firestorm_campaigns", minRows: 2, description: "Firestorm campaigns" },
  { table: "firestorm_leads", minRows: 3, description: "Firestorm leads" },
  { table: "firestorm_analytics", minRows: 4, description: "Firestorm analytics" },
  { table: "lyte_workspaces", minRows: 1, description: "Lyte workspaces" },
  { table: "lyte_signals", minRows: 5, description: "Lyte signals" },
  { table: "lyte_command_cards", minRows: 3, description: "Lyte command cards" },
  { table: "lyte_incidents", minRows: 2, description: "Lyte incidents" },
  { table: "lyte_playbooks", minRows: 2, description: "Lyte playbooks" },
  { table: "lyte_recommendations", minRows: 2, description: "Lyte recommendations" },
  { table: "dreamscape_campaigns", minRows: 4, description: "Dreamscape campaigns" },
  { table: "dreamscape_scripts", minRows: 3, description: "Dreamscape scripts" },
  { table: "dreamscape_storyboards", minRows: 3, description: "Dreamscape storyboards" },
  { table: "dreamscape_voice_assets", minRows: 3, description: "Dreamscape voice assets" },
  { table: "dreamscape_campaign_assets", minRows: 3, description: "Dreamscape campaign assets" },
  { table: "dreamscape_reviews", minRows: 3, description: "Dreamscape reviews" },
  { table: "readiness_programs", minRows: 1, description: "Readiness programs" },
  { table: "readiness_dimensions", minRows: 5, description: "Readiness dimensions" },
  { table: "readiness_score_history", minRows: 10, description: "Readiness score history" },
  { table: "readiness_milestones", minRows: 2, description: "Readiness milestones" },
  { table: "readiness_risks", minRows: 3, description: "Readiness risks" },
  { table: "readiness_alerts", minRows: 3, description: "Readiness alerts" },
];

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

adminRouter.get("/admin/system-health", async (_req, res) => {
  const checks: { name: string; category: string; status: "healthy" | "degraded" | "down"; latencyMs: number | null; details: string }[] = [];
  const dbStart = Date.now();
  try {
    const dbResult = await pool.query("SELECT COUNT(*)::int as tbl_count FROM pg_tables WHERE schemaname = 'public'");
    const tblCount = dbResult.rows[0]?.tbl_count ?? 0;
    checks.push({ name: "PostgreSQL", category: "Database", status: "healthy", latencyMs: Date.now() - dbStart, details: `Connection pool active, ${tblCount} tables` });
  } catch {
    checks.push({ name: "PostgreSQL", category: "Database", status: "down", latencyMs: Date.now() - dbStart, details: "Connection failed" });
  }

  const storageAdapter = services.storage;
  checks.push({
    name: "Object Storage",
    category: "Storage",
    status: storageAdapter.isLive ? "healthy" : "degraded",
    latencyMs: null,
    details: storageAdapter.isLive ? "Live configured" : "Demo mode (local fallback)",
  });

  const authStart = Date.now();
  try {
    const sessionResult = await pool.query("SELECT COUNT(*)::int as cnt FROM sessions WHERE expires_at > NOW()");
    const activeSessions = sessionResult.rows[0]?.cnt ?? 0;
    checks.push({
      name: "Session Auth",
      category: "Auth",
      status: "healthy",
      latencyMs: Date.now() - authStart,
      details: `${activeSessions} active sessions, Replit Auth fallback available`,
    });
  } catch {
    checks.push({
      name: "Session Auth",
      category: "Auth",
      status: "degraded",
      latencyMs: Date.now() - authStart,
      details: "Session table query failed",
    });
  }

  const matrix = services.getHealthMatrix();
  const liveCount = matrix.summary.liveConfigured;
  const totalCount = matrix.summary.total;
  checks.push({
    name: "Connectors",
    category: "Integrations",
    status: liveCount > 0 ? "healthy" : "degraded",
    latencyMs: null,
    details: `${liveCount}/${totalCount} live, ${matrix.summary.mockedDemoMode} in demo mode`,
  });

  try {
    const whResult = await pool.query(`
      SELECT 
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE status = 'processed')::int as processed,
        COUNT(*) FILTER (WHERE status = 'failed')::int as failed
      FROM webhook_events
    `);
    const wh = whResult.rows[0];
    checks.push({
      name: "Webhook Processing",
      category: "Webhooks",
      status: wh.failed > 0 ? "degraded" : "healthy",
      latencyMs: null,
      details: `${wh.processed} processed, ${wh.failed} failed of ${wh.total} total`,
    });
  } catch {
    checks.push({
      name: "Webhook Processing",
      category: "Webhooks",
      status: "degraded",
      latencyMs: null,
      details: "Unable to query webhook events",
    });
  }

  try {
    const notifResult = await pool.query(`
      SELECT 
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE is_read = true)::int as read_count
      FROM notifications
    `);
    const n = notifResult.rows[0];
    checks.push({
      name: "Notifications",
      category: "Notifications",
      status: "healthy",
      latencyMs: null,
      details: `${n.total} notifications (${n.read_count} read)`,
    });
  } catch {
    checks.push({
      name: "Notifications",
      category: "Notifications",
      status: "degraded",
      latencyMs: null,
      details: "Unable to query notifications",
    });
  }

  const stripeAdapter = services.stripe;
  checks.push({
    name: "Billing (Stripe)",
    category: "Billing",
    status: stripeAdapter.isLive ? "healthy" : "degraded",
    latencyMs: null,
    details: stripeAdapter.isLive ? "Stripe connected" : "Demo mode — no live payments",
  });

  const devDomain = process.env.REPLIT_DEV_DOMAIN;

  if (devDomain) {
    const probeBaseUrl = `https://${devDomain}`;
    const probeResults = await Promise.allSettled(
      SZL_APPS.map(async (app) => {
        const appStart = Date.now();
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        try {
          const response = await fetch(`${probeBaseUrl}${app.url}`, { signal: controller.signal });
          clearTimeout(timeout);
          const latency = Date.now() - appStart;
          return {
            name: app.name,
            category: "Apps" as const,
            status: (response.ok || response.status === 304 ? "healthy" : "degraded") as "healthy" | "degraded",
            latencyMs: latency,
            details: response.ok || response.status === 304 ? `Serving at ${app.url} (${response.status})` : `HTTP ${response.status} at ${app.url}`,
          };
        } catch {
          clearTimeout(timeout);
          return {
            name: app.name,
            category: "Apps" as const,
            status: "down" as const,
            latencyMs: Date.now() - appStart,
            details: `Unreachable at ${app.url}`,
          };
        }
      })
    );
    for (const result of probeResults) {
      checks.push(result.status === "fulfilled" ? result.value : { name: "Unknown", category: "Apps", status: "down", latencyMs: null, details: "Probe failed" });
    }
  } else {
    for (const app of SZL_APPS) {
      checks.push({
        name: app.name,
        category: "Apps",
        status: "degraded",
        latencyMs: null,
        details: `Unverified — no REPLIT_DEV_DOMAIN (registered at ${app.url})`,
      });
    }
  }

  const overallStatus = checks.some((c) => c.status === "down") ? "down" : checks.some((c) => c.status === "degraded") ? "degraded" : "healthy";

  res.json({
    timestamp: new Date().toISOString(),
    status: overallStatus,
    checks,
    summary: {
      total: checks.length,
      healthy: checks.filter((c) => c.status === "healthy").length,
      degraded: checks.filter((c) => c.status === "degraded").length,
      down: checks.filter((c) => c.status === "down").length,
    },
  });
});

adminRouter.get("/admin/seed/validate", async (_req, res) => {
  const results: { table: string; description: string; expected: number; actual: number; status: "pass" | "fail" | "error" }[] = [];

  for (const expectation of SEED_TABLE_EXPECTATIONS) {
    if (!VALID_TABLE_NAMES.has(expectation.table)) {
      results.push({ table: expectation.table, description: expectation.description, expected: expectation.minRows, actual: 0, status: "error" });
      continue;
    }
    try {
      const result = await pool.query(`SELECT COUNT(*)::int as count FROM "${expectation.table}"`);
      const actual = result.rows[0]?.count ?? 0;
      results.push({
        table: expectation.table,
        description: expectation.description,
        expected: expectation.minRows,
        actual,
        status: actual >= expectation.minRows ? "pass" : "fail",
      });
    } catch {
      results.push({
        table: expectation.table,
        description: expectation.description,
        expected: expectation.minRows,
        actual: 0,
        status: "error",
      });
    }
  }

  const passed = results.filter((r) => r.status === "pass").length;
  const failed = results.filter((r) => r.status === "fail").length;
  const errors = results.filter((r) => r.status === "error").length;

  res.json({
    timestamp: new Date().toISOString(),
    overallStatus: errors > 0 ? "error" : failed > 0 ? "incomplete" : "complete",
    results,
    summary: { total: results.length, passed, failed, errors },
  });
});

adminRouter.get("/admin/billing/settings", async (_req, res) => {
  try {
    const plans = await db.select().from(billingPlansTable).orderBy(billingPlansTable.id);
    const subs = await db.select().from(subscriptionsTable).orderBy(desc(subscriptionsTable.createdAt)).limit(10);
    const invs = await db.select().from(invoicesTable).orderBy(desc(invoicesTable.createdAt)).limit(20);
    const ents = await db.select().from(entitlementsTable).orderBy(entitlementsTable.planId);
    const usageResult = await db.select({
      featureKey: usageEventsTable.featureKey,
      totalQuantity: sql<number>`SUM(${usageEventsTable.quantity})::int`,
      eventCount: sql<number>`COUNT(*)::int`,
    }).from(usageEventsTable).groupBy(usageEventsTable.featureKey);

    res.json({
      stripeConfigured: services.stripe.isLive,
      plans,
      subscriptions: subs,
      invoices: invs,
      entitlements: ents,
      usageSummary: usageResult,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to load billing settings" });
  }
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

adminRouter.get("/admin/billing", async (_req, res) => {
  try {
    if (services.stripe.isLive) {
      const products = await services.stripe.listProducts();
      const invoices = await services.stripe.listInvoices(undefined, 10);
      const connection = await services.stripe.testConnection();

      const mainProduct = products[0];
      const mainPrice = mainProduct?.prices[0];

      res.json({
        plan: mainProduct?.name ?? "No Plan",
        status: connection.connected ? "active" : "inactive",
        currentPeriodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
        currentPeriodEnd: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59).toISOString(),
        monthlyAmount: mainPrice?.amount ?? 0,
        currency: mainPrice?.currency ?? "usd",
        seats: MOCK_BILLING.seats,
        features: MOCK_BILLING.features,
        invoices: invoices.map((inv) => ({
          id: inv.id,
          date: new Date(inv.created * 1000).toISOString().split("T")[0],
          amount: inv.amount,
          status: inv.status,
        })),
        stripeMode: connection.mode,
        stripeConnected: connection.connected,
        products,
      });
    } else {
      res.json({ ...MOCK_BILLING, stripeMode: "mock", stripeConnected: false, products: [] });
    }
  } catch {
    res.json({ ...MOCK_BILLING, stripeMode: "mock", stripeConnected: false, products: [] });
  }
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
