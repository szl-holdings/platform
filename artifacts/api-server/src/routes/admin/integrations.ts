import type { IRouter } from "express";
import { services } from "@szl-holdings/services";
import { APP_INTEGRATIONS, PLATFORM_APPS } from "@szl-holdings/config";
import { db, invoicesTable, webhookEventsTable } from "@szl-holdings/db";
import { desc, sql, eq } from "drizzle-orm";
import { z } from "zod";
import { validateBody } from "../../lib/validation.js";
import { sendError, sendNotFound } from "../../lib/api-response.js";
import { getBillingConfig } from "./system.js";

export interface IntegrationActivity {
  id: string;
  type: "connection_test" | "sync" | "webhook" | "api_call" | "error" | "health_check";
  connector: string;
  app: string | null;
  status: "success" | "error" | "warning";
  message: string;
  timestamp: string;
  responseTimeMs: number | null;
}

export const integrationActivityLog: IntegrationActivity[] = [
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

function getCategoryForService(name: string): string {
  const categories: Record<string, string> = {
    stripe: "Payments", github: "Development", slack: "Communication", twilio: "Communication",
    gmail: "Communication", notion: "Productivity", confluence: "Productivity",
    "google-calendar": "Productivity", "google-docs": "Productivity", "google-drive": "Storage",
    dropbox: "Storage", onedrive: "Storage", storage: "Storage", google: "Platform",
    weather: "Data", stormglass: "Data", shipping: "Logistics", monitoring: "Observability",
    posthog: "Analytics", hubspot: "CRM", elevenlabs: "AI & ML", ai: "AI & ML",
    figma: "Design", "marine-traffic": "Maritime", "vessel-finder": "Maritime",
    zillow: "Real Estate", corelogic: "Real Estate", redfin: "Real Estate",
    pacer: "Legal", "court-listener": "Legal", virustotal: "Threat Intel",
    shodan: "Threat Intel", "alien-vault-otx": "Threat Intel", "alpha-vantage": "Finance",
    "dun-bradstreet": "Business Intel", crunchbase: "Business Intel",
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

const enabledSchema = z.object({ enabled: z.boolean() });

export function register(router: IRouter): void {
  router.get("/admin/connectors", (_req, res) => {
    const matrix = services.getHealthMatrix();
    const connectorDetails = matrix.services.map((s) => ({ ...s, category: getCategoryForService(s.name), lastSync: null, syncEnabled: true, webhookUrl: `/api/webhooks/${s.name}` }));
    res.json({ connectors: connectorDetails, summary: matrix.summary });
  });

  router.post("/admin/connectors/:name/test", async (req, res) => {
    const result = await services.testConnection(req.params["name"]!);
    if (!result) { sendNotFound(res, "Connector"); return; }
    integrationActivityLog.unshift({ id: `act_${Date.now()}`, type: "connection_test", connector: result.name, app: null, status: result.success ? "success" : "error", message: result.message, timestamp: result.testedAt, responseTimeMs: result.responseTimeMs });
    if (integrationActivityLog.length > 200) integrationActivityLog.length = 200;
    res.json(result);
  });

  router.put("/admin/connectors/:name/enable", validateBody(enabledSchema), (req, res) => {
    const adapter = services.getAdapter(req.params["name"]!);
    if (!adapter) { sendNotFound(res, "Connector"); return; }
    const { enabled } = req.body as z.infer<typeof enabledSchema>;
    adapter.setEnabled(enabled);
    integrationActivityLog.unshift({ id: `act_${Date.now()}`, type: "connection_test", connector: adapter.name, app: null, status: enabled ? "success" : "warning", message: enabled ? "Connector enabled" : "Connector disabled by user", timestamp: new Date().toISOString(), responseTimeMs: null });
    if (integrationActivityLog.length > 200) integrationActivityLog.length = 200;
    res.json({ name: adapter.name, enabled, status: adapter.getHealthReport().status });
  });

  router.get("/admin/provisioning", (_req, res) => {
    const matrix = services.getHealthMatrix();
    const entries = matrix.services.map((s) => {
      const docs = PROVISIONING_DOCS[s.name] ?? null;
      return { name: s.name, description: s.description ?? null, category: getCategoryForService(s.name), status: s.status, isLive: s.status === "LIVE_CONFIGURED", requiredEnvVars: s.requiredEnvVars ?? [], missingEnvVars: (s.requiredEnvVars ?? []).filter((v) => !process.env[v]), signup: docs?.signup ?? null, docsUrl: docs?.docsUrl ?? null, notes: docs?.notes ?? null };
    });
    const configured = entries.filter((e) => e.isLive).length;
    const unconfigured = entries.filter((e) => !e.isLive && e.requiredEnvVars.length > 0).length;
    res.json({ total: entries.length, configured, unconfigured, noKeyRequired: entries.filter((e) => !e.isLive && e.requiredEnvVars.length === 0).length, adapters: entries });
  });

  router.post("/admin/connectors/:name/sync", async (req, res) => {
    const adapter = services.getAdapter(req.params["name"]!);
    if (!adapter) { sendNotFound(res, "Connector"); return; }
    const syncResult = { name: adapter.name, synced: true, syncedAt: new Date().toISOString(), itemsSynced: 0 };
    integrationActivityLog.unshift({ id: `act_${Date.now()}`, type: "sync", connector: adapter.name, app: null, status: "success", message: `Synced ${syncResult.itemsSynced} items`, timestamp: syncResult.syncedAt, responseTimeMs: null });
    if (integrationActivityLog.length > 200) integrationActivityLog.length = 200;
    res.json(syncResult);
  });

  router.get("/admin/billing", async (_req, res) => {
    try {
      if (services.stripe.isLive) {
        const products = await services.stripe.listProducts();
        const invoices = await services.stripe.listInvoices(undefined, 10);
        const connection = await services.stripe.testConnection();
        const mainProduct = products[0];
        const mainPrice = mainProduct?.prices[0];
        res.json({ plan: mainProduct?.name ?? "No Plan", status: connection.connected ? "active" : "inactive", currentPeriodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(), currentPeriodEnd: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59).toISOString(), monthlyAmount: mainPrice?.amount ?? 0, currency: mainPrice?.currency ?? "usd", seats: { used: 4, total: 10 }, features: (await getBillingConfig()).features, invoices: invoices.map((inv) => ({ id: inv.id, date: new Date(inv.created * 1000).toISOString().split("T")[0], amount: inv.amount, status: inv.status })), stripeMode: connection.mode, stripeConnected: connection.connected, products });
      } else {
        const billing = await getBillingConfig();
        res.json({ ...billing, stripeMode: "seed", stripeConnected: false, products: [] });
      }
    } catch {
      const billing = await getBillingConfig();
      res.json({ ...billing, stripeMode: "seed", stripeConnected: false, products: [] });
    }
  });

  router.get("/admin/webhooks", async (req, res) => {
    try {
      const limitParam = parseInt(req.query["limit"] as string ?? "50", 10);
      const limit = Math.min(isNaN(limitParam) ? 50 : limitParam, 200);
      const source = req.query["source"] as string | undefined;
      let query = db.select().from(webhookEventsTable).orderBy(desc(webhookEventsTable.createdAt)).limit(limit).$dynamic();
      if (source) query = query.where(eq(webhookEventsTable.source, source));
      const rows = await query;
      const events = rows.map((r) => ({ id: `wh_${r.id}`, source: r.source, event: r.eventType, status: r.status, payload: r.payload, errorMessage: r.errorMessage, processedAt: r.processedAt?.toISOString() ?? null, receivedAt: r.createdAt.toISOString() }));
      res.json({ events, total: events.length });
    } catch {
      sendError(res, "Failed to fetch webhook events", 500, "INTERNAL_ERROR");
    }
  });

  router.get("/admin/files", async (_req, res) => {
    const files = await services.storage.listFiles();
    res.json({ files });
  });

  router.get("/admin/integration-health", (_req, res) => {
    const matrix = services.getHealthMatrix();
    const appHealth: Record<string, { slug: string; name: string; connectors: string[]; health: ReturnType<typeof services.getHealthMatrix> }> = {};
    for (const app of PLATFORM_APPS) {
      const mapping = APP_INTEGRATIONS[app.slug];
      if (mapping) appHealth[app.slug] = { slug: app.slug, name: app.name, connectors: mapping.connectors, health: services.getAppHealthMatrix(mapping.connectors) };
    }
    const unhealthyConnectors = matrix.services.filter((s) => s.status === "MANUAL_REQUIRED");
    const demoConnectors = matrix.services.filter((s) => s.status === "MOCKED_DEMO_MODE");
    res.json({ timestamp: new Date().toISOString(), overall: matrix, perApp: appHealth, alerts: { unhealthyCount: unhealthyConnectors.length, demoCount: demoConnectors.length, unhealthyConnectors: unhealthyConnectors.map((c) => c.name), demoConnectors: demoConnectors.map((c) => c.name) } });
  });

  router.get("/admin/integration-activity", (req, res) => {
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
}
