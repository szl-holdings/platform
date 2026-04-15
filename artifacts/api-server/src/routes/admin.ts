import { Router, type IRouter } from "express";
import { services } from "@szl-holdings/services";
import { APP_INTEGRATIONS, PLATFORM_APPS } from "@szl-holdings/config";
import {
  db, pool,
  billingPlansTable, subscriptionsTable, invoicesTable, entitlementsTable, usageEventsTable,
  usersTable, rolesTable, userRolesTable, auditEventsTable, featureFlagsTable, webhookEventsTable,
  platformJobRunsTable, artifactApprovalsTable, exportJobsTable,
} from "@szl-holdings/db";
import { seedLyteObservability } from "../lib/lyte-observability-seed";
import { desc, sql, ilike, or, eq, and, inArray, gte, lte } from "drizzle-orm";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { serverTelemetry } from "@szl-holdings/observability";
import { durableJobQueue } from "@szl-holdings/workflow-engine";
import { logActivity } from "../lib/activity-logger";
import { isFlagEnabled } from "../lib/platform-flags";

const adminRouter: IRouter = Router();

adminRouter.use("/admin", authMiddleware());
adminRouter.use("/admin", requireRole("admin"));

const SZL_APPS = [
  { id: "project-list", name: "Project List", description: "Portfolio project management", status: "active", url: "/" },
  { id: "admin-panel", name: "Admin Control Plane", description: "System administration dashboard", status: "active", url: "/admin/" },
  { id: "api-server", name: "API Server", description: "REST API backend", status: "active", url: "/api/healthz" },
  { id: "vessel-tracker", name: "Vessel Tracker", description: "Maritime fleet tracking", status: "active", url: "/vessels/" },
  { id: "firestorm", name: "Firestorm Security", description: "Security simulation platform", status: "active", url: "/firestorm/" },
  { id: "stephen-site", name: "Stephen Lutar", description: "Personal portfolio site", status: "active", url: "/stephen/" },
  { id: "mockup-sandbox", name: "Component Preview", description: "Design system preview", status: "active", url: "/__mockup/" },
  { id: "terra", name: "Terra Real Estate Intelligence", description: "Real estate portfolio observability platform", status: "active", url: "/terra/" },
];

async function getBillingConfig() {
  const plans = await db.select().from(billingPlansTable).where(eq(billingPlansTable.isActive, true)).orderBy(desc(billingPlansTable.priceMonthly)).limit(1);
  const plan = plans[0];
  const recentInvoices = await db.select().from(invoicesTable).orderBy(desc(invoicesTable.createdAt)).limit(5);
  const now = new Date();
  return {
    plan: plan?.name ?? "Enterprise",
    status: "active",
    currentPeriodStart: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
    currentPeriodEnd: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString(),
    monthlyAmount: plan?.priceMonthly ?? 9900,
    currency: "usd",
    seats: { used: 4, total: 10 },
    features: (plan?.features as string[]) ?? ["Unlimited connectors", "Priority support", "Custom branding", "SSO", "Audit logs", "Webhooks"],
    invoices: recentInvoices.length > 0
      ? recentInvoices.map((inv: any) => ({ id: inv.id, date: new Date(inv.createdAt).toISOString().split("T")[0], amount: inv.amount ?? 0, status: inv.status ?? "paid" }))
      : [
          { id: "inv_001", date: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0], amount: plan?.priceMonthly ?? 9900, status: "paid" },
          { id: "inv_002", date: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split("T")[0], amount: plan?.priceMonthly ?? 9900, status: "paid" },
          { id: "inv_003", date: new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().split("T")[0], amount: plan?.priceMonthly ?? 9900, status: "paid" },
        ],
  };
}

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
  "alloy_chat_kb_documents", "alloy_chat_advisories", "alloy_chat_comparisons",
  "azure_tenants", "dataverse_connections",
  "feedback", "feedback_survey_prefs",
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

adminRouter.get("/admin/overview", async (_req, res) => {
  const matrix = services.getHealthMatrix();
  const dbStart = Date.now();
  let dbStatus = { status: "healthy", latency: 0, connections: 0, maxConnections: 100 };
  let userCounts = { total: 0, active: 0 };
  try {
    const [, userResult] = await Promise.all([
      pool.query("SELECT COUNT(*)::int as tbl_count FROM pg_tables WHERE schemaname = 'public'"),
      pool.query("SELECT COUNT(*)::int as total, COUNT(*) FILTER (WHERE is_active = true)::int as active FROM users"),
    ]);
    dbStatus = { status: "healthy", latency: Date.now() - dbStart, connections: 5, maxConnections: 100 };
    userCounts = { total: userResult.rows[0]?.total ?? 0, active: userResult.rows[0]?.active ?? 0 };
  } catch {
    dbStatus = { status: "degraded", latency: Date.now() - dbStart, connections: 0, maxConnections: 100 };
  }
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
      users: userCounts.total,
      activeUsers: userCounts.active,
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

adminRouter.get("/admin/provisioning", (_req, res) => {
  const matrix = services.getHealthMatrix();
  const entries = matrix.services.map((s) => {
    const docs = PROVISIONING_DOCS[s.name] ?? null;
    return {
      name: s.name,
      description: s.description ?? null,
      category: getCategoryForService(s.name),
      status: s.status,
      isLive: s.status === "LIVE_CONFIGURED",
      requiredEnvVars: s.requiredEnvVars ?? [],
      missingEnvVars: (s.requiredEnvVars ?? []).filter((v) => !process.env[v]),
      signup: docs?.signup ?? null,
      docsUrl: docs?.docsUrl ?? null,
      notes: docs?.notes ?? null,
    };
  });
  const configured = entries.filter((e) => e.isLive).length;
  const unconfigured = entries.filter((e) => !e.isLive && e.requiredEnvVars.length > 0).length;
  res.json({
    total: entries.length,
    configured,
    unconfigured,
    noKeyRequired: entries.filter((e) => !e.isLive && e.requiredEnvVars.length === 0).length,
    adapters: entries,
  });
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
    itemsSynced: 0,
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

adminRouter.get("/admin/users", async (_req, res) => {
  try {
    const users = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        displayName: usersTable.displayName,
        avatarUrl: usersTable.avatarUrl,
        isActive: usersTable.isActive,
        lastLoginAt: usersTable.lastLoginAt,
        createdAt: usersTable.createdAt,
      })
      .from(usersTable)
      .orderBy(desc(usersTable.createdAt));

    const userIds = users.map((u) => u.id);
    const roleRows = userIds.length > 0
      ? await db
          .select({ userId: userRolesTable.userId, roleName: rolesTable.name })
          .from(userRolesTable)
          .innerJoin(rolesTable, eq(userRolesTable.roleId, rolesTable.id))
          .where(inArray(userRolesTable.userId, userIds))
      : [];

    const roleMap = new Map<number, string[]>();
    for (const r of roleRows) {
      const existing = roleMap.get(r.userId) ?? [];
      existing.push(r.roleName);
      roleMap.set(r.userId, existing);
    }

    const enriched = users.map((u) => ({
      id: `usr_${u.id}`,
      email: u.email,
      name: u.displayName,
      roles: roleMap.get(u.id) ?? [],
      role: (roleMap.get(u.id) ?? ["viewer"])[0] ?? "viewer",
      status: u.isActive ? "active" : "inactive",
      lastLogin: u.lastLoginAt?.toISOString() ?? null,
      createdAt: u.createdAt.toISOString(),
    }));

    res.json({ users: enriched, total: enriched.length });
  } catch {
    res.status(500).json({ error: "Failed to fetch users" });
  }
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

adminRouter.get("/admin/audit-log", async (req, res) => {
  const enabled = await isFlagEnabled("internal_audit_console_enabled");
  if (!enabled) {
    res.status(403).json({ error: "Feature not available", feature: "internal_audit_console_enabled", fallback: { entries: [], total: 0 } });
    return;
  }
  try {
    const action = req.query["action"] as string | undefined;
    const search = req.query["search"] as string | undefined;
    const dateFrom = req.query["dateFrom"] as string | undefined;
    const dateTo = req.query["dateTo"] as string | undefined;
    const userFilter = req.query["user"] as string | undefined;
    const limitParam = parseInt(req.query["limit"] as string ?? "50", 10);
    const limit = Math.min(isNaN(limitParam) ? 50 : limitParam, 200);

    const conditions = [];
    if (dateFrom) conditions.push(gte(auditEventsTable.createdAt, new Date(dateFrom)));
    if (dateTo) conditions.push(lte(auditEventsTable.createdAt, new Date(dateTo)));
    if (action) {
      conditions.push(ilike(auditEventsTable.action, `%${action}%`));
    } else if (search) {
      conditions.push(
        or(
          ilike(auditEventsTable.action, `%${search}%`),
          ilike(auditEventsTable.entityType, `%${search}%`),
          ilike(usersTable.email, `%${search}%`),
          ilike(usersTable.displayName, `%${search}%`),
        )!,
      );
    }
    if (userFilter) {
      conditions.push(
        or(
          ilike(usersTable.email, `%${userFilter}%`),
          ilike(usersTable.displayName, `%${userFilter}%`),
        )!,
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
      .select({
        id: auditEventsTable.id,
        action: auditEventsTable.action,
        entityType: auditEventsTable.entityType,
        entityId: auditEventsTable.entityId,
        userId: auditEventsTable.userId,
        userName: usersTable.displayName,
        userEmail: usersTable.email,
        oldValues: auditEventsTable.oldValues,
        newValues: auditEventsTable.newValues,
        ipAddress: auditEventsTable.ipAddress,
        createdAt: auditEventsTable.createdAt,
      })
      .from(auditEventsTable)
      .leftJoin(usersTable, eq(auditEventsTable.userId, usersTable.id))
      .where(whereClause)
      .orderBy(desc(auditEventsTable.createdAt))
      .limit(limit);

    const logs = rows.map((r) => ({
      id: `log_${r.id}`,
      action: r.action,
      actor: r.userEmail ?? r.userName ?? `user_${r.userId}`,
      target: r.entityType + (r.entityId ? `/${r.entityId}` : ""),
      result: "success",
      timestamp: r.createdAt.toISOString(),
      details: r.newValues ? JSON.stringify(r.newValues).slice(0, 120) : null,
      ipAddress: r.ipAddress,
    }));

    res.json({ logs, total: logs.length });
  } catch {
    res.status(500).json({ error: "Failed to fetch audit log" });
  }
});

adminRouter.get("/admin/export-history", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query["page"] as string ?? "1", 10));
    const limit = Math.min(parseInt(req.query["limit"] as string ?? "50", 10), 200);
    const offset = (page - 1) * limit;

    const rows = await db
      .select({
        id: exportJobsTable.id,
        exportId: exportJobsTable.exportId,
        name: exportJobsTable.name,
        dataSource: exportJobsTable.dataSource,
        format: exportJobsTable.format,
        status: exportJobsTable.status,
        rowCount: exportJobsTable.rowCount,
        fileSizeBytes: exportJobsTable.fileSizeBytes,
        downloadToken: exportJobsTable.downloadToken,
        expiresAt: exportJobsTable.expiresAt,
        errorMessage: exportJobsTable.errorMessage,
        scheduleFrequency: exportJobsTable.scheduleFrequency,
        filterParams: exportJobsTable.filterParams,
        triggeredByEmail: exportJobsTable.triggeredByEmail,
        triggeredByName: usersTable.displayName,
        completedAt: exportJobsTable.completedAt,
        createdAt: exportJobsTable.createdAt,
      })
      .from(exportJobsTable)
      .leftJoin(usersTable, eq(exportJobsTable.triggeredByUserId, usersTable.id))
      .orderBy(desc(exportJobsTable.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(exportJobsTable);

    res.json({ exports: rows, total: count, page, limit });
  } catch {
    res.status(500).json({ error: "Failed to fetch export history" });
  }
});

adminRouter.get("/admin/feature-flags", async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(featureFlagsTable)
      .orderBy(featureFlagsTable.key);
    const flags = rows.map((r) => ({
      key: r.key,
      name: r.name,
      enabled: r.isEnabled,
      description: r.description ?? "",
      rolloutPercentage: r.rolloutPercentage,
      updatedAt: r.updatedAt.toISOString(),
    }));
    res.json({ flags });
  } catch {
    res.status(500).json({ error: "Failed to fetch feature flags" });
  }
});

adminRouter.put("/admin/feature-flags/:key", async (req, res) => {
  try {
    const key = req.params["key"]!;
    const { enabled } = req.body as { enabled: boolean };
    const [updated] = await db
      .update(featureFlagsTable)
      .set({ isEnabled: enabled, updatedAt: new Date() })
      .where(eq(featureFlagsTable.key, key))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Flag not found" });
      return;
    }
    res.json({ key: updated.key, name: updated.name, enabled: updated.isEnabled, updatedAt: updated.updatedAt.toISOString() });
  } catch {
    res.status(500).json({ error: "Failed to update feature flag" });
  }
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
        seats: { used: 4, total: 10 },
        features: (await getBillingConfig()).features,
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
      const billing = await getBillingConfig();
      res.json({ ...billing, stripeMode: "seed", stripeConnected: false, products: [] });
    }
  } catch {
    const billing = await getBillingConfig();
    res.json({ ...billing, stripeMode: "seed", stripeConnected: false, products: [] });
  }
});

adminRouter.get("/admin/webhooks", async (req, res) => {
  try {
    const limitParam = parseInt(req.query["limit"] as string ?? "50", 10);
    const limit = Math.min(isNaN(limitParam) ? 50 : limitParam, 200);
    const source = req.query["source"] as string | undefined;

    let query = db
      .select()
      .from(webhookEventsTable)
      .orderBy(desc(webhookEventsTable.createdAt))
      .limit(limit)
      .$dynamic();

    if (source) {
      query = query.where(eq(webhookEventsTable.source, source));
    }

    const rows = await query;
    const events = rows.map((r) => ({
      id: `wh_${r.id}`,
      source: r.source,
      event: r.eventType,
      status: r.status,
      payload: r.payload,
      errorMessage: r.errorMessage,
      processedAt: r.processedAt?.toISOString() ?? null,
      receivedAt: r.createdAt.toISOString(),
    }));
    res.json({ events, total: events.length });
  } catch {
    res.status(500).json({ error: "Failed to fetch webhook events" });
  }
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

adminRouter.post("/admin/seed", async (_req, res) => {
  try {
    const results = await seedLyteObservability();
    res.json({
      success: true,
      seededAt: new Date().toISOString(),
      tables: Object.entries(results).map(([name, rows]) => ({ name, rows })),
    });
  } catch (err: any) {
    console.error("[admin/seed] Error:", err);
    res.status(500).json({ success: false, error: err?.message ?? "Seed failed" });
  }
});

adminRouter.post("/admin/seed/reset", async (_req, res) => {
  try {
    const results = await seedLyteObservability();
    res.json({
      success: true,
      resetAt: new Date().toISOString(),
      message: "All observability data re-seeded",
      tables: Object.entries(results).map(([name, rows]) => ({ name, rows })),
    });
  } catch (err: any) {
    console.error("[admin/seed/reset] Error:", err);
    res.status(500).json({ success: false, error: err?.message ?? "Reset failed" });
  }
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
    "marine-traffic": "Maritime",
    "vessel-finder": "Maritime",
    zillow: "Real Estate",
    corelogic: "Real Estate",
    redfin: "Real Estate",
    pacer: "Legal",
    "court-listener": "Legal",
    virustotal: "Threat Intel",
    shodan: "Threat Intel",
    "alien-vault-otx": "Threat Intel",
    "alpha-vantage": "Finance",
    "dun-bradstreet": "Business Intel",
    crunchbase: "Business Intel",
  };
  return categories[name] ?? "Other";
}

const PROVISIONING_DOCS: Record<string, { signup: string; docsUrl: string; notes?: string }> = {
  "marine-traffic": { signup: "https://www.marinetraffic.com/en/p/api-services", docsUrl: "https://www.marinetraffic.com/en/ais-api-services", notes: "Requires commercial API plan" },
  "vessel-finder": { signup: "https://api.vesselfinder.com/", docsUrl: "https://api.vesselfinder.com/docs", notes: "Free tier available for development" },
  zillow: { signup: "https://www.zillow.com/howzillow/zillowgroup/tech/", docsUrl: "https://bridgeinteractive.github.io/zillow-swagger/", notes: "Contact Zillow Bridge API team for access" },
  corelogic: { signup: "https://developer.corelogic.com/", docsUrl: "https://developer.corelogic.com/documentation", notes: "Enterprise only — requires sales approval" },
  redfin: { signup: "https://www.redfin.com/news/data-center/", docsUrl: "https://redfin.com/stingray/api/gis-csv", notes: "Limited public API; contact for commercial use" },
  pacer: { signup: "https://pacer.uscourts.gov/register-account", docsUrl: "https://pacer.uscourts.gov/file-case/developer-resources", notes: "US federal court account required" },
  "court-listener": { signup: "https://www.courtlistener.com/sign-in/?next=/", docsUrl: "https://www.courtlistener.com/help/api/rest/", notes: "Free non-commercial tier available" },
  virustotal: { signup: "https://www.virustotal.com/gui/join-us", docsUrl: "https://developers.virustotal.com/reference", notes: "Free tier: 4 lookups/min, 500/day" },
  shodan: { signup: "https://account.shodan.io/register", docsUrl: "https://developer.shodan.io/api", notes: "Membership required for full scanning" },
  "alien-vault-otx": { signup: "https://otx.alienvault.com/", docsUrl: "https://otx.alienvault.com/api", notes: "Free; requires OTX account" },
  "alpha-vantage": { signup: "https://www.alphavantage.co/support/#api-key", docsUrl: "https://www.alphavantage.co/documentation/", notes: "Free tier: 25 requests/day" },
  "dun-bradstreet": { signup: "https://developer.dnb.com/", docsUrl: "https://developer.dnb.com/docs", notes: "Requires commercial contract for production" },
  crunchbase: { signup: "https://data.crunchbase.com/docs/getting-started", docsUrl: "https://data.crunchbase.com/reference", notes: "Free trial available; basic/pro/enterprise tiers" },
};

adminRouter.get("/admin/workflow-runs", async (req, res) => {
  const domain = req.query["domain"] as string | undefined;
  const status = req.query["status"] as string | undefined;
  const workflowType = req.query["workflowType"] as string | undefined;
  const limitParam = parseInt(req.query["limit"] as string ?? "50", 10);
  const limit = Math.min(isNaN(limitParam) ? 50 : limitParam, 200);

  try {
    const conditions = [];
    if (domain) conditions.push(eq(platformJobRunsTable.domain, domain));
    if (status) conditions.push(eq(platformJobRunsTable.status, status as "pending" | "running" | "completed" | "failed"));
    if (workflowType) conditions.push(eq(platformJobRunsTable.workflowType, workflowType));

    const dbRuns = await db
      .select()
      .from(platformJobRunsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(platformJobRunsTable.createdAt))
      .limit(limit);

    const jobRuns = (await durableJobQueue.getRecentJobs(50)).map((j) => ({
      id: j.id,
      runId: j.id,
      workflowType: j.type,
      status: j.status as "running" | "completed" | "failed" | "pending",
      domain: j.type.split("_")[0] ?? "platform",
      startedAt: j.startedAt ?? null,
      completedAt: j.completedAt ?? null,
      durationMs: j.startedAt && j.completedAt ? j.completedAt.getTime() - j.startedAt.getTime() : null,
      triggeredBy: "scheduler",
      triggeredByUserId: null,
      retries: j.retryCount,
      error: j.error ?? null,
      payload: null,
      result: null,
      correlationId: null,
      workflowRunId: j.id,
      signalId: null,
      artifactId: null,
      createdAt: j.createdAt,
    }));

    const filteredJobRuns = jobRuns.filter((j) => {
      if (domain && j.domain !== domain) return false;
      if (status && j.status !== status) return false;
      if (workflowType && j.workflowType !== workflowType) return false;
      return true;
    });

    const runs = [...filteredJobRuns, ...dbRuns].slice(0, limit);

    const summary = {
      total: runs.length,
      completed: runs.filter((r) => r.status === "completed").length,
      completedWithWarnings: runs.filter((r) => r.status === "completed_with_warnings").length,
      failed: runs.filter((r) => r.status === "failed").length,
      running: runs.filter((r) => r.status === "running").length,
      pending: runs.filter((r) => r.status === "pending").length,
    };

    res.json({ timestamp: new Date().toISOString(), runs, summary });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch workflow runs" });
  }
});

adminRouter.get("/admin/workflow-runs/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const dbRun = await db
      .select()
      .from(platformJobRunsTable)
      .where(eq(platformJobRunsTable.runId, id!))
      .limit(1);

    if (dbRun.length > 0) {
      res.json(dbRun[0]);
      return;
    }

    const jobRun = (await durableJobQueue.getRecentJobs(200)).find((j) => j.id === id);
    if (jobRun) {
      res.json(jobRun);
      return;
    }

    res.status(404).json({ error: "Workflow run not found" });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch workflow run" });
  }
});

adminRouter.get("/admin/artifact-approvals", async (req, res) => {
  const approvalsEnabled = await isFlagEnabled("alloy_artifact_approvals_enabled");
  if (!approvalsEnabled) {
    res.status(403).json({ error: "Feature not available", feature: "alloy_artifact_approvals_enabled", fallback: { approvals: [], total: 0, pendingCount: 0 } });
    return;
  }
  const status = req.query["status"] as string | undefined;
  const domain = req.query["domain"] as string | undefined;

  try {
    const conditions = [];
    if (status) conditions.push(eq(artifactApprovalsTable.status, status as "pending" | "approved" | "rejected" | "expired"));
    if (domain) conditions.push(eq(artifactApprovalsTable.domain, domain));

    const approvals = await db
      .select()
      .from(artifactApprovalsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(artifactApprovalsTable.requestedAt))
      .limit(100);

    const pendingCount = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(artifactApprovalsTable)
      .where(eq(artifactApprovalsTable.status, "pending"))
      .then((rows) => rows[0]?.count ?? 0);

    res.json({
      timestamp: new Date().toISOString(),
      approvals,
      total: approvals.length,
      pendingCount,
      summary: {
        pending: approvals.filter((a) => a.status === "pending").length,
        approved: approvals.filter((a) => a.status === "approved").length,
        rejected: approvals.filter((a) => a.status === "rejected").length,
        expired: approvals.filter((a) => a.status === "expired").length,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch artifact approvals" });
  }
});

adminRouter.post("/admin/artifact-approvals/:id/approve", async (req, res) => {
  const approvalsEnabled = await isFlagEnabled("alloy_artifact_approvals_enabled");
  if (!approvalsEnabled) {
    res.status(403).json({ error: "Feature not available", feature: "alloy_artifact_approvals_enabled" });
    return;
  }
  const { id } = req.params;
  try {
    const approval = await db
      .select()
      .from(artifactApprovalsTable)
      .where(eq(artifactApprovalsTable.approvalId, id!))
      .limit(1)
      .then((rows) => rows[0]);

    if (!approval) {
      res.status(404).json({ error: "Artifact approval not found" });
      return;
    }
    if (approval.status !== "pending") {
      res.status(400).json({ error: `Approval is already ${approval.status}` });
      return;
    }

    const reviewerLabel = req.user?.email ?? req.user?.displayName ?? "admin";
    const updated = await db
      .update(artifactApprovalsTable)
      .set({
        status: "approved",
        reviewedByUserId: req.user?.id ?? null,
        reviewedByLabel: reviewerLabel,
        reviewedAt: new Date(),
      })
      .where(eq(artifactApprovalsTable.approvalId, id!))
      .returning()
      .then((rows) => rows[0]);

    await logActivity(req, "approve_artifact", "artifact_approval", id!, `Approved artifact: ${approval.artifactId}`);
    res.json({ success: true, approval: updated });
  } catch (err) {
    res.status(500).json({ error: "Failed to approve artifact" });
  }
});

adminRouter.post("/admin/artifact-approvals/:id/reject", async (req, res) => {
  const approvalsEnabled = await isFlagEnabled("alloy_artifact_approvals_enabled");
  if (!approvalsEnabled) {
    res.status(403).json({ error: "Feature not available", feature: "alloy_artifact_approvals_enabled" });
    return;
  }
  const { id } = req.params;
  const { reason } = req.body as { reason?: string };

  try {
    const approval = await db
      .select()
      .from(artifactApprovalsTable)
      .where(eq(artifactApprovalsTable.approvalId, id!))
      .limit(1)
      .then((rows) => rows[0]);

    if (!approval) {
      res.status(404).json({ error: "Artifact approval not found" });
      return;
    }
    if (approval.status !== "pending") {
      res.status(400).json({ error: `Approval is already ${approval.status}` });
      return;
    }

    const reviewerLabel = req.user?.email ?? req.user?.displayName ?? "admin";
    const updated = await db
      .update(artifactApprovalsTable)
      .set({
        status: "rejected",
        reviewedByUserId: req.user?.id ?? null,
        reviewedByLabel: reviewerLabel,
        reviewNote: reason ?? null,
        reviewedAt: new Date(),
      })
      .where(eq(artifactApprovalsTable.approvalId, id!))
      .returning()
      .then((rows) => rows[0]);

    await logActivity(req, "reject_artifact", "artifact_approval", id!, `Rejected artifact: ${approval.artifactId}${reason ? ` (${reason})` : ""}`);
    res.json({ success: true, approval: updated });
  } catch (err) {
    res.status(500).json({ error: "Failed to reject artifact" });
  }
});

adminRouter.get("/admin/health-dashboard", async (_req, res) => {
  const snapshot = serverTelemetry.getSnapshot();
  const [jobStats, recentJobs] = await Promise.all([durableJobQueue.getStats(), durableJobQueue.getRecentJobs(20)]);
  const activeAlerts = serverTelemetry.getActiveAlerts();

  let dbLatencyMs = 0;
  let dbStatus = "unknown";
  try {
    const start = Date.now();
    await pool.query("SELECT 1");
    dbLatencyMs = Date.now() - start;
    dbStatus = "healthy";
  } catch {
    dbStatus = "degraded";
  }

  const technicalMetrics = {
    requestCount: snapshot.requestCount,
    errorRate: snapshot.errorRate,
    p50Latency: snapshot.p50Latency,
    p95Latency: snapshot.p95Latency,
    p99Latency: snapshot.p99Latency,
    throughputPerHour: snapshot.throughputPerHour,
    authFailures: snapshot.authFailures ?? 0,
    retryCount: recentJobs.reduce((sum, j) => sum + j.retryCount, 0),
    workflowFailureRate: jobStats.failed > 0
      ? Math.round((jobStats.failed / Math.max(jobStats.failed + jobStats.completed, 1)) * 100)
      : 0,
    dbLatencyMs,
    dbStatus,
  };

  const productMetrics = {
    signalCountBySeverity: (snapshot.businessEvents as Record<string, number>) ?? {},
    unresolvedActionCount: 0,
    jobFailures: snapshot.jobFailures,
    workflowCompletions: snapshot.workflowCompletions,
    artifactGenerationSuccess: 0,
    artifactGenerationFailed: 0,
    pendingApprovals: await db.select({ count: sql<number>`COUNT(*)::int` }).from(artifactApprovalsTable).where(eq(artifactApprovalsTable.status, "pending")).then((rows) => rows[0]?.count ?? 0),
  };

  const eventsByType = snapshot.businessEvents as Record<string, number>;
  if (eventsByType) {
    productMetrics.artifactGenerationSuccess = eventsByType["artifact_generation_completed"] ?? 0;
    productMetrics.artifactGenerationFailed = snapshot.jobFailures ?? 0;
  }

  res.json({
    timestamp: new Date().toISOString(),
    technical: technicalMetrics,
    product: productMetrics,
    jobs: {
      ...jobStats,
      recentFailures: recentJobs.filter((j) => j.status === "failed").map((j) => ({
        id: j.id,
        type: j.type,
        error: j.error,
        retries: j.retries,
        completedAt: j.completedAt ? new Date(j.completedAt).toISOString() : null,
      })),
    },
    alerts: {
      active: activeAlerts.length,
      items: activeAlerts.slice(0, 10),
    },
    uptime: process.uptime(),
  });
});

adminRouter.get("/admin/push-tokens/stats", async (_req, res) => {
  try {
    const { pushTokensTable } = await import("@szl-holdings/db");
    const { sql: drizzleSql, eq } = await import("drizzle-orm");
    const totalResult = await db.select({ count: drizzleSql<number>`count(*)::int` }).from(pushTokensTable);
    const activeResult = await db.select({ count: drizzleSql<number>`count(*)::int` }).from(pushTokensTable).where(eq(pushTokensTable.isActive, true));
    const byPlatform = await db
      .select({
        platform: pushTokensTable.platform,
        count: drizzleSql<number>`count(*)::int`,
      })
      .from(pushTokensTable)
      .where(eq(pushTokensTable.isActive, true))
      .groupBy(pushTokensTable.platform);
    const byApp = await db
      .select({
        appId: pushTokensTable.appId,
        count: drizzleSql<number>`count(*)::int`,
      })
      .from(pushTokensTable)
      .where(eq(pushTokensTable.isActive, true))
      .groupBy(pushTokensTable.appId);
    res.json({
      total: totalResult[0]?.count ?? 0,
      active: activeResult[0]?.count ?? 0,
      byPlatform,
      byApp,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch push token stats" });
  }
});

adminRouter.post("/admin/push-notifications/broadcast", async (req, res) => {
  try {
    const { title, body, data, template, vars } = req.body;
    const { sendPushBroadcast } = await import("../lib/expo-push");
    const { buildPushMessage } = await import("../lib/push-templates");

    let payload;
    if (template) {
      payload = buildPushMessage(template, vars ?? {});
    } else {
      if (!title || !body) {
        res.status(400).json({ error: "title and body are required" });
        return;
      }
      payload = { title, body, data: data ?? {}, sound: "default" as const };
    }

    const result = await sendPushBroadcast(payload);
    res.json({ success: true, sent: result.sent, failed: result.failed });
  } catch (err) {
    res.status(500).json({ error: "Failed to send broadcast push notification" });
  }
});

adminRouter.get("/admin/environment/full", (_req, res) => {
  const { validateStartupConfig } = require("../lib/startup-validation");
  const result = validateStartupConfig();
  res.json({
    timestamp: new Date().toISOString(),
    environment: process.env["NODE_ENV"] ?? "development",
    appEnv: process.env["APP_ENV"] ?? "development",
    demoMode: process.env["DEMO_MODE"] === "true",
    valid: result.valid,
    errors: result.errors,
    warnings: result.warnings,
    envSummary: result.envSummary,
  });
});

// ─── Admin Impersonation ────────────────────────────────────────────────────

adminRouter.post("/admin/impersonate/:userId", requireRole("admin"), async (req, res) => {
  try {
    const { startImpersonation } = await import("../middlewares/session-policy");
    const targetUserId = parseInt(req.params["userId"] as string, 10);
    if (isNaN(targetUserId) || targetUserId < 1) {
      res.status(400).json({ error: "Invalid user ID" });
      return;
    }
    const { reason } = req.body as { reason?: string };
    const result = await startImpersonation({
      impersonatorId: req.user!.id,
      targetUserId,
      ipAddress: req.ip ?? null,
      userAgent: req.headers["user-agent"] ?? null,
      reason,
    });
    res.status(200).json({
      token: result.token,
      expiresAt: result.expiresAt,
      message: "Impersonation session started. Use the token as a Bearer token.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to start impersonation";
    res.status(403).json({ error: message });
  }
});

adminRouter.post("/admin/impersonate/end", requireRole("admin"), async (req, res) => {
  try {
    const { endImpersonation } = await import("../middlewares/session-policy");
    const { impersonationToken } = req.body as { impersonationToken?: string };
    if (!impersonationToken) {
      res.status(400).json({ error: "impersonationToken is required" });
      return;
    }
    await endImpersonation({
      impersonatorId: req.user!.id,
      impersonationToken,
      ipAddress: req.ip ?? null,
      userAgent: req.headers["user-agent"] ?? null,
    });
    res.status(200).json({ message: "Impersonation session ended" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to end impersonation";
    const status = message.includes("Not authorized") ? 403 : 400;
    res.status(status).json({ error: message });
  }
});

adminRouter.delete("/admin/sessions/:userId", requireRole("admin"), async (req, res) => {
  try {
    const { forceTerminateUserSessions } = await import("../middlewares/session-policy");
    const targetUserId = parseInt(req.params["userId"] as string, 10);
    if (isNaN(targetUserId) || targetUserId < 1) {
      res.status(400).json({ error: "Invalid user ID" });
      return;
    }
    const { reason } = req.body as { reason?: string };
    const result = await forceTerminateUserSessions({
      adminUserId: req.user!.id,
      targetUserId,
      ipAddress: req.ip ?? null,
      userAgent: req.headers["user-agent"] ?? null,
      reason,
    });
    res.status(200).json({ deletedCount: result.deletedCount, message: "Sessions terminated" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to terminate sessions";
    res.status(500).json({ error: message });
  }
});

export default adminRouter;
