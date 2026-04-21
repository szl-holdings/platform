import type { IRouter } from "express";
import {
  db, pool,
  billingPlansTable, subscriptionsTable, invoicesTable, entitlementsTable, usageEventsTable,
  platformJobRunsTable, artifactApprovalsTable,
  lyteSignalsTable,
} from "@szl-holdings/db";
import { seedLyteObservability } from "../../lib/lyte-observability-seed.js";
import { desc, sql, eq, and, inArray } from "drizzle-orm";
import { serverTelemetry } from "@szl-holdings/observability";
import { durableJobQueue } from "@szl-holdings/forge-runtime";
import { logger } from "../../lib/logger.js";
import { isFlagEnabled } from "../../lib/platform-flags.js";
import { adminSeedSchema, artifactApprovalApproveSchema, listQuerySchema, validateBody, validateQuery } from "../../lib/validation.js";
import { sendError, sendNotFound, sendForbidden, sendBadRequest } from "../../lib/api-response.js";
import { z } from "zod";
import { services } from "@szl-holdings/services";
import { logActivity } from "../../lib/activity-logger.js";
import { guardSeedInProduction } from "../../lib/seed-guard.js";

const reasonSchema = z.object({ reason: z.string().max(2000).optional() });
const broadcastSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  body: z.string().min(1).max(2000).optional(),
  data: z.record(z.unknown()).optional(),
  template: z.string().optional(),
  vars: z.record(z.unknown()).optional(),
});

export const SZL_APPS = [
  { id: "project-list", name: "Project List", description: "Portfolio project management", status: "active", url: "/" },
  { id: "admin-panel", name: "Admin Control Plane", description: "System administration dashboard", status: "active", url: "/admin/" },
  { id: "api-server", name: "API Server", description: "REST API backend", status: "active", url: "/api/healthz" },
  { id: "vessel-tracker", name: "Vessel Tracker", description: "Maritime fleet tracking", status: "active", url: "/vessels/" },
  { id: "firestorm", name: "Firestorm Security", description: "Security simulation platform", status: "active", url: "/firestorm/" },
  { id: "stephen-site", name: "Stephen Lutar", description: "Personal portfolio site", status: "active", url: "/stephen/" },
  { id: "mockup-sandbox", name: "Component Preview", description: "Design system preview", status: "active", url: "/__mockup/" },
  { id: "terra", name: "Terra Real Estate Intelligence", description: "Real estate portfolio observability platform", status: "active", url: "/terra/" },
];

export async function getBillingConfig() {
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

export const VALID_TABLE_NAMES = new Set([
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

export const SEED_TABLE_EXPECTATIONS = [
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
  { table: "vessels", minRows: 5, description: "SEXTANT" },
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

export function register(router: IRouter): void {
  router.get("/admin/overview", async (_req, res) => {
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
      system: { uptime: process.uptime(), nodeVersion: process.version, memoryUsage: process.memoryUsage(), platform: process.platform },
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

  router.get("/admin/system-health", async (_req, res) => {
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
    checks.push({ name: "Object Storage", category: "Storage", status: storageAdapter.isLive ? "healthy" : "degraded", latencyMs: null, details: storageAdapter.isLive ? "Live configured" : "Demo mode (local fallback)" });

    const authStart = Date.now();
    try {
      const sessionResult = await pool.query("SELECT COUNT(*)::int as cnt FROM sessions WHERE expires_at > NOW()");
      const activeSessions = sessionResult.rows[0]?.cnt ?? 0;
      checks.push({ name: "Session Auth", category: "Auth", status: "healthy", latencyMs: Date.now() - authStart, details: `${activeSessions} active sessions, Replit Auth fallback available` });
    } catch {
      checks.push({ name: "Session Auth", category: "Auth", status: "degraded", latencyMs: Date.now() - authStart, details: "Session table query failed" });
    }

    const matrix = services.getHealthMatrix();
    const liveCount = matrix.summary.liveConfigured;
    const totalCount = matrix.summary.total;
    checks.push({ name: "Connectors", category: "Integrations", status: liveCount > 0 ? "healthy" : "degraded", latencyMs: null, details: `${liveCount}/${totalCount} live, ${matrix.summary.mockedDemoMode} in demo mode` });

    try {
      const whResult = await pool.query(`SELECT COUNT(*)::int as total, COUNT(*) FILTER (WHERE status = 'processed')::int as processed, COUNT(*) FILTER (WHERE status = 'failed')::int as failed FROM webhook_events`);
      const wh = whResult.rows[0];
      checks.push({ name: "Webhook Processing", category: "Webhooks", status: wh.failed > 0 ? "degraded" : "healthy", latencyMs: null, details: `${wh.processed} processed, ${wh.failed} failed of ${wh.total} total` });
    } catch {
      checks.push({ name: "Webhook Processing", category: "Webhooks", status: "degraded", latencyMs: null, details: "Unable to query webhook events" });
    }

    try {
      const notifResult = await pool.query(`SELECT COUNT(*)::int as total, COUNT(*) FILTER (WHERE is_read = true)::int as read_count FROM notifications`);
      const n = notifResult.rows[0];
      checks.push({ name: "Notifications", category: "Notifications", status: "healthy", latencyMs: null, details: `${n.total} notifications (${n.read_count} read)` });
    } catch {
      checks.push({ name: "Notifications", category: "Notifications", status: "degraded", latencyMs: null, details: "Unable to query notifications" });
    }

    const stripeAdapter = services.stripe;
    checks.push({ name: "Billing (Stripe)", category: "Billing", status: stripeAdapter.isLive ? "healthy" : "degraded", latencyMs: null, details: stripeAdapter.isLive ? "Stripe connected" : "Demo mode — no live payments" });

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
            return { name: app.name, category: "Apps" as const, status: (response.ok || response.status === 304 ? "healthy" : "degraded") as "healthy" | "degraded", latencyMs: latency, details: response.ok || response.status === 304 ? `Serving at ${app.url} (${response.status})` : `HTTP ${response.status} at ${app.url}` };
          } catch {
            clearTimeout(timeout);
            return { name: app.name, category: "Apps" as const, status: "down" as const, latencyMs: Date.now() - appStart, details: `Unreachable at ${app.url}` };
          }
        })
      );
      for (const result of probeResults) {
        checks.push(result.status === "fulfilled" ? result.value : { name: "Unknown", category: "Apps", status: "down", latencyMs: null, details: "Probe failed" });
      }
    } else {
      for (const app of SZL_APPS) {
        checks.push({ name: app.name, category: "Apps", status: "degraded", latencyMs: null, details: `Unverified — no REPLIT_DEV_DOMAIN (registered at ${app.url})` });
      }
    }

    try {
      const { getFeedHealthSummary } = await import("../../lib/intelligence-feeds-init.js");
      const feedHealthList = await getFeedHealthSummary();
      for (const feed of feedHealthList) {
        checks.push({ name: feed.feedName, category: "Intelligence Feeds", status: feed.status === "healthy" ? "healthy" : feed.status === "down" ? "down" : "degraded", latencyMs: feed.avgPollDurationMs > 0 ? feed.avgPollDurationMs : null, details: `${feed.entitiesIngested} entities ingested, ${feed.consecutiveFailures} consecutive failures, last success: ${feed.lastSuccessAt ?? "never"}` });
      }
    } catch {}

    const overallStatus = checks.some((c) => c.status === "down") ? "down" : checks.some((c) => c.status === "degraded") ? "degraded" : "healthy";
    res.json({ timestamp: new Date().toISOString(), status: overallStatus, checks, summary: { total: checks.length, healthy: checks.filter((c) => c.status === "healthy").length, degraded: checks.filter((c) => c.status === "degraded").length, down: checks.filter((c) => c.status === "down").length } });
  });

  router.get("/admin/feed-health", async (_req, res) => {
    try {
      const { getFeedIngestionView } = await import("../../lib/intelligence-feeds-init.js");
      const feeds = await getFeedIngestionView();
      const summary = {
        totalFeeds: feeds.length,
        healthy: feeds.filter(f => f.status === "healthy").length,
        degraded: feeds.filter(f => f.status === "degraded").length,
        down: feeds.filter(f => f.status === "down").length,
        totalEntitiesCreated: feeds.reduce((s, f) => s + f.totalEntitiesCreated, 0),
        totalEntitiesMerged: feeds.reduce((s, f) => s + f.totalEntitiesMerged, 0),
      };
      res.json({ timestamp: new Date().toISOString(), summary, feeds });
    } catch (err) {
      logger.warn({ err }, "[admin] feed-health route failed");
      res.json({ timestamp: new Date().toISOString(), summary: { totalFeeds: 0, healthy: 0, degraded: 0, down: 0, totalEntitiesCreated: 0, totalEntitiesMerged: 0 }, feeds: [] });
    }
  });

  router.get("/admin/seed/validate", async (_req, res) => {
    const results: { table: string; description: string; expected: number; actual: number; status: "pass" | "fail" | "error" }[] = [];
    for (const expectation of SEED_TABLE_EXPECTATIONS) {
      if (!VALID_TABLE_NAMES.has(expectation.table)) {
        results.push({ table: expectation.table, description: expectation.description, expected: expectation.minRows, actual: 0, status: "error" });
        continue;
      }
      try {
        const result = await pool.query(`SELECT COUNT(*)::int as count FROM "${expectation.table}"`);
        const actual = result.rows[0]?.count ?? 0;
        results.push({ table: expectation.table, description: expectation.description, expected: expectation.minRows, actual, status: actual >= expectation.minRows ? "pass" : "fail" });
      } catch {
        results.push({ table: expectation.table, description: expectation.description, expected: expectation.minRows, actual: 0, status: "error" });
      }
    }
    const passed = results.filter((r) => r.status === "pass").length;
    const failed = results.filter((r) => r.status === "fail").length;
    const errors = results.filter((r) => r.status === "error").length;
    res.json({ timestamp: new Date().toISOString(), overallStatus: errors > 0 ? "error" : failed > 0 ? "incomplete" : "complete", results, summary: { total: results.length, passed, failed, errors } });
  });

  router.get("/admin/security-alerts", async (req, res) => {
    const limitParam = parseInt(req.query["limit"] as string ?? "10", 10);
    const limit = Math.max(1, Math.min(isNaN(limitParam) ? 10 : limitParam, 50));
    try {
      const rows = await db
        .select()
        .from(lyteSignalsTable)
        .where(
          and(
            eq(lyteSignalsTable.source, "Lyte Self-Monitor"),
            sql`${lyteSignalsTable.metadata}->>'obsRef' IN ('OBS-005','OBS-006')`,
          ),
        )
        .orderBy(desc(lyteSignalsTable.receivedAt))
        .limit(limit);

      const items = rows.map((r: any) => {
        const meta = (r.metadata ?? {}) as Record<string, unknown>;
        const obsRef = (meta["obsRef"] as string | undefined) ?? null;
        const sample = Array.isArray(meta["sample"])
          ? (meta["sample"] as Array<Record<string, unknown>>)
          : [];
        const samplePath =
          (sample[0]?.["path"] as string | undefined) ??
          (sample[0]?.["route"] as string | undefined) ??
          null;
        return {
          id: r.id,
          severity: r.severity,
          title: r.title,
          body: r.body,
          status: r.status,
          receivedAt: r.receivedAt instanceof Date
            ? r.receivedAt.toISOString()
            : r.receivedAt,
          obsRef,
          category: obsRef === "OBS-005"
            ? "tenant-isolation"
            : obsRef === "OBS-006"
              ? "auth-failure"
              : "other",
          violationCount: (meta["violationCount"] as number | undefined) ?? null,
          authFailureRatePerMin:
            (meta["authFailureRatePerMin"] as number | undefined) ?? null,
          samplePath,
          detailUrl: `/operations/prism/signals?signal=${r.id}`,
        };
      });

      res.json({
        timestamp: new Date().toISOString(),
        total: items.length,
        items,
      });
    } catch (err) {
      logger.warn({ err }, "[admin] security-alerts route failed");
      res.json({ timestamp: new Date().toISOString(), total: 0, items: [] });
    }
  });

  router.get("/admin/billing/settings", async (_req, res) => {
    try {
      const plans = await db.select().from(billingPlansTable).orderBy(billingPlansTable.id);
      const subs = await db.select().from(subscriptionsTable).orderBy(desc(subscriptionsTable.createdAt)).limit(10);
      const invs = await db.select().from(invoicesTable).orderBy(desc(invoicesTable.createdAt)).limit(20);
      const ents = await db.select().from(entitlementsTable).orderBy(entitlementsTable.planId);
      const usageResult = await db.select({ featureKey: usageEventsTable.featureKey, totalQuantity: sql<number>`SUM(${usageEventsTable.quantity})::int`, eventCount: sql<number>`COUNT(*)::int` }).from(usageEventsTable).groupBy(usageEventsTable.featureKey);
      res.json({ stripeConfigured: services.stripe.isLive, plans, subscriptions: subs, invoices: invs, entitlements: ents, usageSummary: usageResult });
    } catch (err) {
      sendError(res, "Failed to load billing settings", 500, "INTERNAL_ERROR");
    }
  });

  router.get("/admin/apps", (_req, res) => {
    res.json({ apps: SZL_APPS });
  });

  router.get("/admin/environment", (_req, res) => {
    const matrix = services.getHealthMatrix();
    const allEnvVars = new Map<string, { configured: boolean; usedBy: string[] }>();
    for (const svc of matrix.services) {
      for (const v of svc.requiredEnvVars) {
        const existing = allEnvVars.get(v);
        if (existing) { existing.usedBy.push(svc.name); } else { allEnvVars.set(v, { configured: svc.presentEnvVars.includes(v), usedBy: [svc.name] }); }
      }
    }
    const envVars = Array.from(allEnvVars.entries()).map(([name, info]) => ({ name, ...info }));
    res.json({ environment: process.env["NODE_ENV"] ?? "development", envVars, configured: envVars.filter((v) => v.configured).length, missing: envVars.filter((v) => !v.configured).length, total: envVars.length });
  });

  router.post("/admin/seed", validateBody(adminSeedSchema), async (_req, res) => {
    if (guardSeedInProduction(res)) return;
    try {
      const results = await seedLyteObservability();
      res.json({ success: true, seededAt: new Date().toISOString(), tables: Object.entries(results).map(([name, rows]) => ({ name, rows })) });
    } catch (err: any) {
      logger.error({ err }, "[admin/seed] Error");
      sendError(res, err?.message ?? "Seed failed", 500, "SEED_ERROR");
    }
  });

  router.post("/admin/seed/reset", validateBody(adminSeedSchema), async (_req, res) => {
    if (guardSeedInProduction(res)) return;
    try {
      const results = await seedLyteObservability();
      res.json({ success: true, resetAt: new Date().toISOString(), message: "All observability data re-seeded", tables: Object.entries(results).map(([name, rows]) => ({ name, rows })) });
    } catch (err: any) {
      logger.error({ err }, "[admin/seed/reset] Error");
      sendError(res, err?.message ?? "Reset failed", 500, "SEED_ERROR");
    }
  });

  router.get("/admin/workflow-runs", validateQuery(listQuerySchema), async (req, res) => {
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
      const dbRuns = await db.select().from(platformJobRunsTable).where(conditions.length > 0 ? and(...conditions) : undefined).orderBy(desc(platformJobRunsTable.createdAt)).limit(limit);
      const jobRuns = (await durableJobQueue.getRecentJobs(50)).map((j) => ({
        id: j.id, runId: j.id, workflowType: j.type, status: j.status as "running" | "completed" | "failed" | "pending",
        domain: j.type.split("_")[0] ?? "platform", startedAt: j.startedAt ?? null, completedAt: j.completedAt ?? null,
        durationMs: j.startedAt && j.completedAt ? j.completedAt.getTime() - j.startedAt.getTime() : null,
        triggeredBy: "scheduler", triggeredByUserId: null, retries: j.retryCount, error: j.error ?? null,
        payload: null, result: null, correlationId: null, workflowRunId: j.id, signalId: null, artifactId: null, createdAt: j.createdAt,
      }));
      const filteredJobRuns = jobRuns.filter((j) => {
        if (domain && j.domain !== domain) return false;
        if (status && j.status !== status) return false;
        if (workflowType && j.workflowType !== workflowType) return false;
        return true;
      });
      const runs = [...filteredJobRuns, ...dbRuns].slice(0, limit);
      const summary = { total: runs.length, completed: runs.filter((r) => r.status === "completed").length, completedWithWarnings: runs.filter((r) => r.status === "completed_with_warnings").length, failed: runs.filter((r) => r.status === "failed").length, running: runs.filter((r) => r.status === "running").length, pending: runs.filter((r) => r.status === "pending").length };
      res.json({ timestamp: new Date().toISOString(), runs, summary });
    } catch (err) {
      sendError(res, "Failed to fetch workflow runs", 500, "INTERNAL_ERROR");
    }
  });

  router.get("/admin/workflow-runs/:id", async (req, res) => {
    const { id } = req.params as Record<string, string>;
    try {
      const dbRun = await db.select().from(platformJobRunsTable).where(eq(platformJobRunsTable.runId, id!)).limit(1);
      if (dbRun.length > 0) { res.json(dbRun[0]); return; }
      const jobRun = (await durableJobQueue.getRecentJobs(200)).find((j) => j.id === id);
      if (jobRun) { res.json(jobRun); return; }
      sendNotFound(res, "Workflow run");
    } catch (err) {
      sendError(res, "Failed to fetch workflow run", 500, "INTERNAL_ERROR");
    }
  });

  router.get("/admin/artifact-approvals", validateQuery(listQuerySchema), async (req, res) => {
    const approvalsEnabled = await isFlagEnabled("alloy_artifact_approvals_enabled");
    if (!approvalsEnabled) { sendForbidden(res, "Feature not available: alloy_artifact_approvals_enabled"); return; }
    const status = req.query["status"] as string | undefined;
    const domain = req.query["domain"] as string | undefined;
    try {
      const conditions = [];
      if (status) conditions.push(eq(artifactApprovalsTable.status, status as "pending" | "approved" | "rejected" | "expired"));
      if (domain) conditions.push(eq(artifactApprovalsTable.domain, domain));
      const approvals = await db.select().from(artifactApprovalsTable).where(conditions.length > 0 ? and(...conditions) : undefined).orderBy(desc(artifactApprovalsTable.requestedAt)).limit(100);
      const pendingCount = await db.select({ count: sql<number>`COUNT(*)::int` }).from(artifactApprovalsTable).where(eq(artifactApprovalsTable.status, "pending" as any)).then((rows) => rows[0]?.count ?? 0);
      res.json({ timestamp: new Date().toISOString(), approvals, total: approvals.length, pendingCount, summary: { pending: approvals.filter((a) => a.status === "pending").length, approved: approvals.filter((a) => a.status === "approved").length, rejected: approvals.filter((a) => a.status === "rejected").length, expired: approvals.filter((a) => a.status === "expired").length } });
    } catch (err) {
      sendError(res, "Failed to fetch artifact approvals", 500, "INTERNAL_ERROR");
    }
  });

  router.post("/admin/artifact-approvals/:id/approve", validateBody(artifactApprovalApproveSchema), async (req, res) => {
    const approvalsEnabled = await isFlagEnabled("alloy_artifact_approvals_enabled");
    if (!approvalsEnabled) { sendForbidden(res, "Feature not available: alloy_artifact_approvals_enabled"); return; }
    const { id } = req.params as Record<string, string>;
    try {
      const approval = await db.select().from(artifactApprovalsTable).where(eq(artifactApprovalsTable.approvalId, id!)).limit(1).then((rows) => rows[0]);
      if (!approval) { sendNotFound(res, "Artifact approval"); return; }
      if (approval.status !== "pending") { sendBadRequest(res, `Approval is already ${approval.status}`); return; }
      const reviewerLabel = req.user?.email ?? req.user?.displayName ?? "admin";
      const updated = await db.update(artifactApprovalsTable).set({ status: "approved", reviewedByUserId: req.user?.id ?? null, reviewedByLabel: reviewerLabel, reviewedAt: new Date() }).where(eq(artifactApprovalsTable.approvalId, id!)).returning().then((rows) => rows[0]);
      await logActivity(req, "approve_artifact", "artifact_approval", id!, `Approved artifact: ${approval.artifactId}`);
      res.json({ success: true, approval: updated });
    } catch (err) {
      sendError(res, "Failed to approve artifact", 500, "INTERNAL_ERROR");
    }
  });

  router.post("/admin/artifact-approvals/:id/reject", validateBody(reasonSchema), async (req, res) => {
    const approvalsEnabled = await isFlagEnabled("alloy_artifact_approvals_enabled");
    if (!approvalsEnabled) { sendForbidden(res, "Feature not available: alloy_artifact_approvals_enabled"); return; }
    const { id } = req.params as Record<string, string>;
    const { reason } = req.body as z.infer<typeof reasonSchema>;
    try {
      const approval = await db.select().from(artifactApprovalsTable).where(eq(artifactApprovalsTable.approvalId, id!)).limit(1).then((rows) => rows[0]);
      if (!approval) { sendNotFound(res, "Artifact approval"); return; }
      if (approval.status !== "pending") { sendBadRequest(res, `Approval is already ${approval.status}`); return; }
      const reviewerLabel = req.user?.email ?? req.user?.displayName ?? "admin";
      const updated = await db.update(artifactApprovalsTable).set({ status: "rejected", reviewedByUserId: req.user?.id ?? null, reviewedByLabel: reviewerLabel, reviewNote: reason ?? null, reviewedAt: new Date() }).where(eq(artifactApprovalsTable.approvalId, id!)).returning().then((rows) => rows[0]);
      await logActivity(req, "reject_artifact", "artifact_approval", id!, `Rejected artifact: ${approval.artifactId}${reason ? ` (${reason})` : ""}`);
      res.json({ success: true, approval: updated });
    } catch (err) {
      sendError(res, "Failed to reject artifact", 500, "INTERNAL_ERROR");
    }
  });

  router.get("/admin/health-dashboard", async (_req, res) => {
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
    const technicalMetrics = { requestCount: snapshot.requestCount, errorRate: snapshot.errorRate, p50Latency: snapshot.p50Latency, p95Latency: snapshot.p95Latency, p99Latency: snapshot.p99Latency, throughputPerHour: snapshot.throughputPerHour, authFailures: snapshot.authFailures ?? 0, retryCount: recentJobs.reduce((sum, j) => sum + j.retryCount, 0), workflowFailureRate: jobStats.failed > 0 ? Math.round((jobStats.failed / Math.max(jobStats.failed + jobStats.completed, 1)) * 100) : 0, dbLatencyMs, dbStatus };
    const productMetrics = { signalCountBySeverity: (snapshot.businessEvents as Record<string, number>) ?? {}, unresolvedActionCount: 0, jobFailures: snapshot.jobFailures, workflowCompletions: snapshot.workflowCompletions, artifactGenerationSuccess: 0, artifactGenerationFailed: 0, pendingApprovals: await db.select({ count: sql<number>`COUNT(*)::int` }).from(artifactApprovalsTable).where(eq(artifactApprovalsTable.status, "pending" as any)).then((rows) => rows[0]?.count ?? 0) };
    const eventsByType = snapshot.businessEvents as Record<string, number>;
    if (eventsByType) {
      productMetrics.artifactGenerationSuccess = eventsByType["artifact_generation_completed"] ?? 0;
      productMetrics.artifactGenerationFailed = snapshot.jobFailures ?? 0;
    }
    res.json({ timestamp: new Date().toISOString(), technical: technicalMetrics, product: productMetrics, jobs: { ...jobStats, recentFailures: recentJobs.filter((j) => j.status === "failed").map((j) => ({ id: j.id, type: j.type, error: j.error, retries: (j as any).retryCount ?? 0, completedAt: j.completedAt ? new Date(j.completedAt).toISOString() : null })) }, alerts: { active: activeAlerts.length, items: activeAlerts.slice(0, 10) }, uptime: process.uptime() });
  });

  router.get("/admin/push-tokens/stats", async (_req, res) => {
    try {
      const { pushTokensTable } = await import("@szl-holdings/db");
      const { sql: drizzleSql, eq } = await import("drizzle-orm");
      const totalResult = await db.select({ count: drizzleSql<number>`count(*)::int` }).from(pushTokensTable);
      const activeResult = await db.select({ count: drizzleSql<number>`count(*)::int` }).from(pushTokensTable).where(eq(pushTokensTable.isActive, true));
      const byPlatform = await db.select({ platform: pushTokensTable.platform, count: drizzleSql<number>`count(*)::int` }).from(pushTokensTable).where(eq(pushTokensTable.isActive, true)).groupBy(pushTokensTable.platform);
      const byApp = await db.select({ appId: pushTokensTable.appId, count: drizzleSql<number>`count(*)::int` }).from(pushTokensTable).where(eq(pushTokensTable.isActive, true)).groupBy(pushTokensTable.appId);
      res.json({ total: totalResult[0]?.count ?? 0, active: activeResult[0]?.count ?? 0, byPlatform, byApp });
    } catch (err) {
      sendError(res, "Failed to fetch push token stats", 500, "INTERNAL_ERROR");
    }
  });

  router.post("/admin/push-notifications/broadcast", validateBody(broadcastSchema), async (req, res) => {
    try {
      const { title, body, data, template, vars } = req.body as z.infer<typeof broadcastSchema>;
      const { sendPushBroadcast } = await import("../../lib/expo-push.js");
      const { buildPushMessage } = await import("../../lib/push-templates.js");
      let payload;
      if (template) {
        payload = buildPushMessage(template as any, (vars ?? {}) as any);
      } else {
        if (!title || !body) { sendBadRequest(res, "title and body are required"); return; }
        payload = { title, body, data: data ?? {}, sound: "default" as const };
      }
      const result = await sendPushBroadcast(payload);
      res.json({ success: true, sent: result.sent, failed: result.failed });
    } catch (err) {
      sendError(res, "Failed to send broadcast push notification", 500, "INTERNAL_ERROR");
    }
  });

  router.post("/admin/retention/sweep", async (req, res) => {
    try {
      const { runRetentionSweep } = await import("../../lib/persistence-init.js");
      const startedAt = Date.now();
      const counts = await runRetentionSweep();
      const durationMs = Date.now() - startedAt;
      await logActivity(req, "run_signal_mesh_retention_sweep", "system", "retention", "Manually triggered signal mesh retention sweep");
      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        durationMs,
        counts,
      });
    } catch (err) {
      logger.error({ err }, "[admin] retention sweep failed");
      sendError(res, "Failed to run retention sweep", 500, "INTERNAL_ERROR");
    }
  });

  router.get("/admin/environment/full", (_req, res) => {
    const { validateStartupConfig } = require("../../lib/startup-validation");
    const result = validateStartupConfig();
    res.json({
      timestamp: new Date().toISOString(),
      environment: process.env["NODE_ENV"] ?? "development",
      appEnv: process.env["APP_ENV"] ?? "development",
      runtimeMode: result.runtimeMode,
      demoMode: result.runtimeMode === "demo",
      valid: result.valid,
      errors: result.errors,
      warnings: result.warnings,
      envSummary: result.envSummary,
    });
  });
}
