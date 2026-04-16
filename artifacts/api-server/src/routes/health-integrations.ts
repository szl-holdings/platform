import { Router, type IRouter } from "express";
import { LRUCache } from "lru-cache";
import { services } from "@szl-holdings/services";
import { db } from "@szl-holdings/db";
import { sql } from "drizzle-orm";
import { getOtelConfig } from "@szl-holdings/observability";
import { getEmailProviderStatus } from "../lib/email";
import { isAzureAdConfigured } from "../lib/auth";
import { authMiddleware } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

interface IntegrationHealth {
  name: string;
  status: "healthy" | "degraded" | "unavailable" | "unconfigured";
  latencyMs?: number;
  lastChecked: string;
  details?: Record<string, unknown>;
  error?: string;
}

async function checkWithTimeout<T>(fn: () => Promise<T>, timeoutMs = 5000): Promise<{ result: T | null; latencyMs: number; error?: string }> {
  const start = Date.now();
  try {
    const result = await Promise.race([
      fn(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs),
      ),
    ]);
    return { result, latencyMs: Date.now() - start };
  } catch (err) {
    return { result: null, latencyMs: Date.now() - start, error: (err as Error).message };
  }
}

async function checkDatabase(): Promise<IntegrationHealth> {
  const { result, latencyMs, error } = await checkWithTimeout(async () => {
    await db.execute(sql`SELECT 1`);
    return true;
  });

  return {
    name: "database",
    status: result ? "healthy" : "degraded",
    latencyMs,
    lastChecked: new Date().toISOString(),
    ...(error ? { error } : {}),
  };
}

async function checkStripe(): Promise<IntegrationHealth> {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return {
      name: "stripe",
      status: "unconfigured",
      lastChecked: new Date().toISOString(),
      details: { mode: "mock" },
    };
  }

  const { result, latencyMs, error } = await checkWithTimeout(async () => {
    return await services.stripe.testConnection();
  });

  return {
    name: "stripe",
    status: result?.connected ? "healthy" : "degraded",
    latencyMs,
    lastChecked: new Date().toISOString(),
    details: result ? { mode: result.mode, accountId: result.accountId } : undefined,
    ...(error ? { error } : {}),
  };
}

async function checkHubSpot(): Promise<IntegrationHealth> {
  if (!process.env.HUBSPOT_ACCESS_TOKEN) {
    return { name: "hubspot", status: "unconfigured", lastChecked: new Date().toISOString() };
  }

  const { result, latencyMs, error } = await checkWithTimeout(async () => {
    return await services.hubspot.testConnection();
  });

  return {
    name: "hubspot",
    status: result?.connected ? "healthy" : "degraded",
    latencyMs,
    lastChecked: new Date().toISOString(),
    details: result ? { portalId: result.portalId } : undefined,
    ...(error ? { error } : {}),
  };
}

async function checkSendGrid(): Promise<IntegrationHealth> {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    return { name: "sendgrid", status: "unconfigured", lastChecked: new Date().toISOString() };
  }

  const { result, latencyMs, error } = await checkWithTimeout(async () => {
    const res = await fetch("https://api.sendgrid.com/v3/user/credits", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok && res.status !== 403) throw new Error(`SendGrid returned ${res.status}`);
    return { reachable: true };
  });

  return {
    name: "sendgrid",
    status: result ? "healthy" : "degraded",
    latencyMs,
    lastChecked: new Date().toISOString(),
    ...(error ? { error } : {}),
  };
}

async function checkResend(): Promise<IntegrationHealth> {
  if (!process.env.RESEND_API_KEY) {
    return { name: "resend", status: "unconfigured", lastChecked: new Date().toISOString() };
  }

  const { result, latencyMs, error } = await checkWithTimeout(async () => {
    const res = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
    });
    if (!res.ok) throw new Error(`Resend returned ${res.status}`);
    return { reachable: true };
  });

  return {
    name: "resend",
    status: result ? "healthy" : "degraded",
    latencyMs,
    lastChecked: new Date().toISOString(),
    ...(error ? { error } : {}),
  };
}

async function checkMapbox(): Promise<IntegrationHealth> {
  const token = process.env.MAPBOX_ACCESS_TOKEN;
  if (!token) {
    return { name: "mapbox", status: "unconfigured", lastChecked: new Date().toISOString() };
  }

  const { result, latencyMs, error } = await checkWithTimeout(async () => {
    const res = await fetch(`https://api.mapbox.com/tokens/v2?access_token=${token}`);
    if (!res.ok) throw new Error(`Mapbox returned ${res.status}`);
    return { reachable: true };
  });

  return {
    name: "mapbox",
    status: result ? "healthy" : "degraded",
    latencyMs,
    lastChecked: new Date().toISOString(),
    ...(error ? { error } : {}),
  };
}

async function checkGoogleMaps(): Promise<IntegrationHealth> {
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    return { name: "google_maps", status: "unconfigured", lastChecked: new Date().toISOString() };
  }

  const { result, latencyMs, error } = await checkWithTimeout(async () => {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=test&key=${process.env.GOOGLE_MAPS_API_KEY}`,
    );
    if (!res.ok) throw new Error(`Google Maps returned ${res.status}`);
    const data = await res.json() as { status: string };
    if (data.status === "REQUEST_DENIED") throw new Error("Google Maps API key invalid");
    return { reachable: true };
  });

  return {
    name: "google_maps",
    status: result ? "healthy" : "degraded",
    latencyMs,
    lastChecked: new Date().toISOString(),
    ...(error ? { error } : {}),
  };
}

async function checkAzureServices(): Promise<IntegrationHealth> {
  const azureAdConfigured = isAzureAdConfigured();
  const azureInsightsConfigured = !!process.env.AZURE_APP_INSIGHTS_CONNECTION_STRING;
  const azureStorageConfigured = !!process.env.AZURE_STORAGE_CONNECTION_STRING;

  const configured = azureAdConfigured || azureInsightsConfigured || azureStorageConfigured;

  return {
    name: "azure",
    status: configured ? "healthy" : "unconfigured",
    lastChecked: new Date().toISOString(),
    details: {
      azureAd: azureAdConfigured,
      multiTenantProvisioning: azureAdConfigured,
      appInsights: azureInsightsConfigured,
      blobStorage: azureStorageConfigured,
    },
  };
}

async function checkDynamics365(): Promise<IntegrationHealth> {
  const dataverseOrgUrl = process.env.DATAVERSE_ORG_URL;
  const dataverseTenantId = process.env.DATAVERSE_TENANT_ID;
  const dataverseClientId = process.env.DATAVERSE_CLIENT_ID;
  const dataverseClientSecret = process.env.DATAVERSE_CLIENT_SECRET;

  const configured = !!(dataverseOrgUrl && dataverseTenantId && dataverseClientId && dataverseClientSecret);

  if (!configured) {
    return {
      name: "dynamics365",
      status: "unconfigured",
      lastChecked: new Date().toISOString(),
      details: {
        mode: "demo",
        orgUrl: dataverseOrgUrl ?? null,
        entities: ["accounts", "contacts", "leads", "opportunities", "activities"],
      },
    };
  }

  const { result, latencyMs, error } = await checkWithTimeout(async () => {
    const { services } = await import("@szl-holdings/services");
    return await services.dataverse.testConnection();
  });

  return {
    name: "dynamics365",
    status: result?.connected ? "healthy" : "degraded",
    latencyMs,
    lastChecked: new Date().toISOString(),
    details: {
      orgUrl: dataverseOrgUrl,
      tenantId: dataverseTenantId,
      entities: ["accounts", "contacts", "leads", "opportunities", "activities"],
    },
    ...(error ? { error } : {}),
  };
}

async function checkRedis(): Promise<IntegrationHealth> {
  const redisUrl = process.env.REDIS_URL ?? process.env.AZURE_REDIS_CONNECTION_STRING;
  if (!redisUrl) {
    return { name: "redis", status: "unconfigured", lastChecked: new Date().toISOString() };
  }

  return {
    name: "redis",
    status: "healthy",
    lastChecked: new Date().toISOString(),
    details: { configured: true, note: "Health check via connection string presence" },
  };
}

let cachedHealth: { data: IntegrationHealth[]; checkedAt: number } | null = null;
const CACHE_TTL_MS = 30_000;

async function runAllChecks(): Promise<IntegrationHealth[]> {
  if (cachedHealth && Date.now() - cachedHealth.checkedAt < CACHE_TTL_MS) {
    return cachedHealth.data;
  }

  const checks = await Promise.all([
    checkDatabase(),
    checkStripe(),
    checkHubSpot(),
    checkSendGrid(),
    checkResend(),
    checkMapbox(),
    checkGoogleMaps(),
    checkAzureServices(),
    checkDynamics365(),
    checkRedis(),
  ]);

  cachedHealth = { data: checks, checkedAt: Date.now() };
  return checks;
}

router.get("/health/integrations", async (_req, res) => {
  try {
    const checks = await runAllChecks();

    const summary = {
      total: checks.length,
      healthy: checks.filter((c) => c.status === "healthy").length,
      degraded: checks.filter((c) => c.status === "degraded").length,
      unavailable: checks.filter((c) => c.status === "unavailable").length,
      unconfigured: checks.filter((c) => c.status === "unconfigured").length,
    };

    const overallStatus =
      summary.degraded > 0 || summary.unavailable > 0 ? "degraded" : "healthy";

    const emailStatus = getEmailProviderStatus();
    const otelConfig = getOtelConfig();

    res.json({
      status: overallStatus,
      checkedAt: new Date().toISOString(),
      summary,
      integrations: checks,
      meta: {
        email: emailStatus,
        telemetry: {
          otelInitialized: otelConfig.initialized,
          serviceName: otelConfig.serviceName,
          exporters: {
            otlp: !!otelConfig.otlpEndpoint,
            azureMonitor: otelConfig.azureMonitor,
            newRelic: otelConfig.newRelic,
          },
        },
        auth: {
          oidcConfigured: !!process.env.REPL_ID,
          azureAdConfigured: isAzureAdConfigured(),
        },
        webhooks: {
          zapierCompatible: true,
          n8nCompatible: true,
          hmacSignatureVerification: true,
        },
      },
    });
  } catch (err) {
    logger.error({ err }, "Integration health check failed");
    res.status(500).json({ error: "Health check failed", details: (err as Error).message });
  }
});

router.get("/health/integrations/refresh", async (_req, res) => {
  try {
    cachedHealth = null;
    const checks = await runAllChecks();
    res.json({ refreshed: true, count: checks.length, checkedAt: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: "Refresh failed" });
  }
});

// ─── External Data Feed Health Dashboard ────────────────────────────────────

interface ExternalFeedStatus {
  name: string;
  provider: string;
  platform: string;
  url: string;
  lastChecked: string;
  status: "live" | "degraded" | "unavailable" | "unchecked";
  latencyMs: number | null;
  httpStatus: number | null;
  cacheKey: string;
  ttlMinutes: number;
  requiresKey: boolean;
  error?: string;
}

const feedStatusCache = new LRUCache<string, { status: ExternalFeedStatus; checkedAt: number }>({ max: 100 });
const FEED_CACHE_TTL = 5 * 60 * 1000;

const EXTERNAL_FEEDS: Array<{
  name: string;
  provider: string;
  platform: string;
  url: string;
  cacheKey: string;
  ttlMinutes: number;
  requiresKey: boolean;
  method?: "POST";
  body?: string;
  contentType?: string;
}> = [
  { name: "AIS Vessel Positions", provider: "Digitraffic (Finnish Transport)", platform: "Vessels", url: "https://meri.digitraffic.fi/api/ais/v1/locations/latest", cacheKey: "digitraffic-ais", ttlMinutes: 5, requiresKey: false },
  { name: "Marine Weather", provider: "Open-Meteo Marine API", platform: "Vessels", url: "https://marine-api.open-meteo.com/v1/marine?latitude=60&longitude=25&current=wave_height", cacheKey: "open-meteo-marine", ttlMinutes: 15, requiresKey: false },
  { name: "AIS Norwegian Waters", provider: "BarentsWatch (Norwegian Coastal Admin)", platform: "Vessels", url: "https://www.barentswatch.no/bwapi/v2/latest/combined?area=NOR", cacheKey: "barentswatch-ais", ttlMinutes: 5, requiresKey: false },
  { name: "NYC PLUTO Property Data", provider: "NYC Open Data", platform: "Terra", url: "https://data.cityofnewyork.us/resource/64uk-42ks.json?$limit=1", cacheKey: "nyc-pluto", ttlMinutes: 360, requiresKey: false },
  { name: "NYC 311 Complaints", provider: "NYC Open Data", platform: "Terra", url: "https://data.cityofnewyork.us/resource/erm2-nwe9.json?$limit=1", cacheKey: "nyc-311", ttlMinutes: 60, requiresKey: false },
  { name: "Census ACS Housing", provider: "U.S. Census Bureau", platform: "Terra", url: "https://api.census.gov/data/2022/acs/acs5?get=NAME&for=state:36&key=DEMO", cacheKey: "census-acs", ttlMinutes: 1440, requiresKey: false },
  { name: "FRED Mortgage Rates", provider: "Federal Reserve (FRED)", platform: "Terra", url: "https://api.stlouisfed.org/fred/series/observations?series_id=MORTGAGE30US&api_key=DEMO_KEY&limit=1&file_type=json", cacheKey: "fred-mortgage", ttlMinutes: 360, requiresKey: false },
  { name: "Shodan InternetDB", provider: "Shodan", platform: "Aegis", url: "https://internetdb.shodan.io/8.8.8.8", cacheKey: "shodan-internetdb", ttlMinutes: 60, requiresKey: false },
  { name: "GreyNoise Community", provider: "GreyNoise", platform: "Aegis", url: "https://api.greynoise.io/v3/community/8.8.8.8", cacheKey: "greynoise-community", ttlMinutes: 60, requiresKey: false },
  { name: "MalwareBazaar Feed", provider: "Abuse.ch", platform: "Aegis", url: "https://mb-api.abuse.ch/api/v1/", cacheKey: "malwarebazaar", ttlMinutes: 60, requiresKey: false, method: "POST", body: "query=get_recent&selector=5", contentType: "application/x-www-form-urlencoded" },
  { name: "URLhaus Malicious URLs", provider: "Abuse.ch", platform: "Aegis", url: "https://urlhaus-api.abuse.ch/v1/urls/recent/limit/5/", cacheKey: "urlhaus", ttlMinutes: 60, requiresKey: false },
  { name: "NVD CVE Feed", provider: "NIST NVD", platform: "Aegis", url: "https://services.nvd.nist.gov/rest/json/cves/2.0?resultsPerPage=1", cacheKey: "nvd-cves", ttlMinutes: 60, requiresKey: false },
  { name: "CISA KEV Catalog", provider: "CISA", platform: "Aegis", url: "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json", cacheKey: "cisa-kev", ttlMinutes: 1440, requiresKey: false },
  { name: "FEMA National Risk Index", provider: "FEMA", platform: "Terra", url: "https://hazards.fema.gov/nri/api/counties?stateAbbreviation=FL&top=1", cacheKey: "fema-nri", ttlMinutes: 1440 * 30, requiresKey: false },
  { name: "BLS Construction Employment", provider: "Bureau of Labor Statistics", platform: "Terra", url: "https://api.bls.gov/publicAPI/v2/timeseries/data/CES2000000001", cacheKey: "bls-construction", ttlMinutes: 1440, requiresKey: false },
  { name: "GitHub API", provider: "GitHub", platform: "Lyte", url: "https://api.github.com/", cacheKey: "github-api", ttlMinutes: 5, requiresKey: false },
];

async function checkExternalFeed(feed: typeof EXTERNAL_FEEDS[number]): Promise<ExternalFeedStatus> {
  const cached = feedStatusCache.get(feed.cacheKey);
  if (cached && Date.now() - cached.checkedAt < FEED_CACHE_TTL) {
    return cached.status;
  }

  const start = Date.now();
  let status: ExternalFeedStatus["status"] = "unavailable";
  let httpStatus: number | null = null;
  let errorMsg: string | undefined;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(feed.url, {
      method: feed.method ?? "GET",
      signal: controller.signal,
      headers: {
        "User-Agent": "SZL-HealthCheck/1.0",
        Accept: "application/json",
        ...(feed.contentType ? { "Content-Type": feed.contentType } : {}),
      },
      ...(feed.body ? { body: feed.body } : {}),
    });
    clearTimeout(timer);
    httpStatus = response.status;
    if (response.ok) {
      status = "live";
    } else if ([404, 204, 401, 403].includes(response.status)) {
      status = "live";
      errorMsg = `HTTP ${response.status} (endpoint reachable)`;
    } else {
      status = "degraded";
      errorMsg = `HTTP ${response.status}`;
    }
  } catch (err: any) {
    status = "unavailable";
    errorMsg = err.message?.slice(0, 80) ?? "Connection failed";
  }

  const result: ExternalFeedStatus = {
    name: feed.name,
    provider: feed.provider,
    platform: feed.platform,
    url: feed.url,
    lastChecked: new Date().toISOString(),
    status,
    latencyMs: Date.now() - start,
    httpStatus,
    cacheKey: feed.cacheKey,
    ttlMinutes: feed.ttlMinutes,
    requiresKey: feed.requiresKey,
    ...(errorMsg ? { error: errorMsg } : {}),
  };

  feedStatusCache.set(feed.cacheKey, { status: result, checkedAt: Date.now() });
  return result;
}

router.get("/health/external-feeds", async (_req, res) => {
  try {
    const feedResults = await Promise.all(EXTERNAL_FEEDS.map(checkExternalFeed));

    const byPlatform = feedResults.reduce((acc: Record<string, ExternalFeedStatus[]>, f) => {
      if (!acc[f.platform]) acc[f.platform] = [];
      acc[f.platform].push(f);
      return acc;
    }, {});

    const liveCount = feedResults.filter(f => f.status === "live").length;
    const degradedCount = feedResults.filter(f => f.status === "degraded").length;
    const unavailableCount = feedResults.filter(f => f.status === "unavailable").length;

    const overallStatus = unavailableCount > 3 ? "degraded" : degradedCount > 2 ? "degraded" : "operational";

    res.json({
      overallStatus,
      summary: {
        total: feedResults.length,
        live: liveCount,
        degraded: degradedCount,
        unavailable: unavailableCount,
        livePercentage: +((liveCount / feedResults.length) * 100).toFixed(0),
      },
      byPlatform,
      feeds: feedResults,
      checkedAt: new Date().toISOString(),
    });
  } catch (err) {
    logger.error({ err }, "External feed health check failed");
    res.status(500).json({ error: "External feed health check failed" });
  }
});

router.get("/health/external-feeds/refresh", async (_req, res) => {
  try {
    feedStatusCache.clear();
    const feedResults = await Promise.all(EXTERNAL_FEEDS.map(checkExternalFeed));
    const liveCount = feedResults.filter(f => f.status === "live").length;
    res.json({ refreshed: true, total: feedResults.length, live: liveCount, checkedAt: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: "Feed refresh failed" });
  }
});


// ─── AI Provider Health ──────────────────────────────────────────────────────

router.get("/health/ai", async (_req, res) => {
  try {
    const { getRouteConfig, alloyRetrieval } = await import("@szl-holdings/ai-engine");
    const config = getRouteConfig();
    const stats = alloyRetrieval.getStats();

    const openaiKey = process.env.OPENAI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;
    const hfToken = process.env.HF_TOKEN ?? process.env.HUGGINGFACE_API_KEY;
    const executionMode = process.env.AI_EXECUTION_MODE ?? "propose_only";

    const providers: Record<string, { status: string; latencyMs?: number; details?: unknown }> = {};

    if (openaiKey) {
      const start = Date.now();
      try {
        const resp = await Promise.race([
          fetch("https://api.openai.com/v1/models", {
            headers: { Authorization: `Bearer ${openaiKey}` },
            signal: AbortSignal.timeout(5000),
          }),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 5000)),
        ]) as Response;
        providers["openai"] = { status: resp.ok ? "healthy" : "degraded", latencyMs: Date.now() - start };
      } catch {
        providers["openai"] = { status: "unreachable", latencyMs: Date.now() - start };
      }
    } else {
      providers["openai"] = { status: "unconfigured" };
    }

    if (anthropicKey) {
      providers["anthropic"] = { status: "configured", details: { note: "Token present" } };
    } else {
      providers["anthropic"] = { status: "unconfigured" };
    }

    if (geminiKey) {
      providers["gemini"] = { status: "configured", details: { note: "Token present" } };
    } else {
      providers["gemini"] = { status: "unconfigured" };
    }

    if (hfToken) {
      providers["huggingface"] = { status: "configured", details: { note: "Token present" } };
    } else {
      providers["huggingface"] = { status: "unconfigured" };
    }

    const anyHealthy = Object.values(providers).some(p => p.status === "healthy" || p.status === "configured");

    res.json({
      status: anyHealthy ? "operational" : "degraded",
      degraded: !anyHealthy,
      providers,
      executionMode,
      retrieval: {
        indexedChunks: stats.totalChunks,
        withEmbeddings: stats.withEmbeddings,
        status: stats.totalChunks > 0 ? "indexed" : "empty",
      },
      models: config.models,
      routes: Object.keys(config.routes),
      checkedAt: new Date().toISOString(),
    });
  } catch (err) {
    logger.error({ err }, "AI health check failed");
    res.status(500).json({ status: "error", error: "AI health check failed" });
  }
});

// ─── WebSocket Health ────────────────────────────────────────────────────────

router.get("/health/websocket", async (_req, res) => {
  try {
    const { getWsStats } = await import("../lib/websocket.js");
    const stats = getWsStats();
    res.json({
      status: "operational",
      connections: stats.connections ?? 0,
      channels: stats.channels ?? 0,
      messagesPerMinute: stats.messagesPerMinute ?? 0,
      uptime: process.uptime(),
      checkedAt: new Date().toISOString(),
    });
  } catch {
    res.json({
      status: "operational",
      connections: 0,
      channels: 0,
      note: "WebSocket stats unavailable — server running",
      checkedAt: new Date().toISOString(),
    });
  }
});

// ─── Billing Provider Health ─────────────────────────────────────────────────

router.get("/health/billing", async (_req, res) => {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      res.json({
        status: "unconfigured",
        provider: "stripe",
        mode: "mock",
        message: "Stripe not configured — billing is in mock mode",
        checkedAt: new Date().toISOString(),
      });
      return;
    }

    const { services } = await import("@szl-holdings/services");
    const { result, latencyMs, error } = await checkWithTimeout(() => services.stripe.testConnection());

    res.json({
      status: result?.connected ? "healthy" : "degraded",
      provider: "stripe",
      mode: result?.mode ?? "unknown",
      accountId: result?.accountId ?? null,
      latencyMs,
      error: error ?? null,
      checkedAt: new Date().toISOString(),
    });
  } catch (err) {
    logger.error({ err }, "Billing health check failed");
    res.status(500).json({ status: "error", error: "Billing health check failed" });
  }
});

// ─── Service Registry Health Matrix (all adapters with circuit breaker + latency) ─

router.get("/integrations/health", authMiddleware(), async (_req, res) => {
  try {
    const matrix = services.getHealthMatrix();
    res.json(matrix);
  } catch (err) {
    logger.error({ err }, "Adapter health matrix failed");
    res.status(500).json({ error: "Adapter health matrix failed" });
  }
});

router.get("/integrations/health/live", authMiddleware(), async (_req, res) => {
  try {
    const results = await services.testAllConnections();
    const matrix = services.getHealthMatrix();
    res.json({
      ...matrix,
      liveCheck: {
        testedAt: new Date().toISOString(),
        total: results.length,
        passed: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        results,
      },
    });
  } catch (err) {
    logger.error({ err }, "Live health check failed");
    res.status(500).json({ error: "Live health check failed" });
  }
});

router.get("/integrations/health/test", authMiddleware(), async (_req, res) => {
  try {
    const results = await services.testAllConnections();
    res.json({
      testedAt: new Date().toISOString(),
      total: results.length,
      passed: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    });
  } catch (err) {
    logger.error({ err }, "Connection test failed");
    res.status(500).json({ error: "Connection test failed" });
  }
});

router.get("/integrations/health/:name", authMiddleware(), async (req, res) => {
  try {
    const adapter = services.getAdapter(req.params.name as string);
    if (!adapter) {
      res.status(404).json({ error: `Adapter "${req.params.name as string}" not found` });
      return;
    }
    const result = await adapter.runHealthCheck();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Health check failed" });
  }
});

// ─── New Relic APM Endpoints ─────────────────────────────────────────────────

router.get("/integrations/new-relic/apm", authMiddleware(), async (req, res) => {
  try {
    const metrics = await services.newRelic.getApmMetrics(
      req.query?.appName as string | undefined,
    );
    res.json({ status: services.newRelic.status, metrics });
  } catch (err) {
    logger.error({ err }, "New Relic APM fetch failed");
    res.status(500).json({ error: "New Relic APM fetch failed" });
  }
});

router.get("/integrations/new-relic/hosts", authMiddleware(), async (_req, res) => {
  try {
    const hosts = await services.newRelic.getInfraHosts();
    res.json({ status: services.newRelic.status, hosts });
  } catch (err) {
    res.status(500).json({ error: "New Relic hosts fetch failed" });
  }
});

router.get("/integrations/new-relic/alerts", authMiddleware(), async (_req, res) => {
  try {
    const alerts = await services.newRelic.getAlertConditions();
    res.json({ status: services.newRelic.status, alerts });
  } catch (err) {
    res.status(500).json({ error: "New Relic alerts fetch failed" });
  }
});

// ─── NVIDIA DCGM GPU Endpoints ──────────────────────────────────────────────

router.get("/integrations/nvidia-dcgm/gpus", authMiddleware(), async (_req, res) => {
  try {
    const gpus = await services.nvidiaDcgm.getGpuMetrics();
    res.json({ status: services.nvidiaDcgm.status, gpus });
  } catch (err) {
    logger.error({ err }, "DCGM GPU metrics fetch failed");
    res.status(500).json({ error: "DCGM GPU metrics fetch failed" });
  }
});

router.get("/integrations/nvidia-dcgm/cluster", authMiddleware(), async (_req, res) => {
  try {
    const summary = await services.nvidiaDcgm.getClusterSummary();
    res.json({ status: services.nvidiaDcgm.status, summary });
  } catch (err) {
    res.status(500).json({ error: "DCGM cluster summary failed" });
  }
});

// ─── MISP/TAXII Threat Intel Endpoints ──────────────────────────────────────

router.get("/integrations/misp-taxii/collections", authMiddleware(), async (_req, res) => {
  try {
    const collections = await services.mispTaxii.getCollections();
    res.json({ status: services.mispTaxii.status, collections });
  } catch (err) {
    logger.error({ err }, "TAXII collections fetch failed");
    res.status(500).json({ error: "TAXII collections fetch failed" });
  }
});

router.get("/integrations/misp-taxii/indicators", authMiddleware(), async (req, res) => {
  try {
    const collectionId = req.query.collectionId as string | undefined;
    const addedAfter = req.query.addedAfter as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const result = await services.mispTaxii.pollIndicators(collectionId, addedAfter, limit);
    res.json({ status: services.mispTaxii.status, ...result });
  } catch (err) {
    logger.error({ err }, "TAXII indicator poll failed");
    res.status(500).json({ error: "TAXII indicator poll failed" });
  }
});

// ─── CISA KEV Enhanced Endpoints ────────────────────────────────────────────

router.get("/integrations/cisa/kev", authMiddleware(), async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const vulns = await services.cisa.getKnownExploitedVulnerabilities(limit);
    res.json({ status: services.cisa.status, count: vulns.length, vulnerabilities: vulns });
  } catch (err) {
    res.status(500).json({ error: "CISA KEV fetch failed" });
  }
});

router.get("/integrations/cisa/kev/search", authMiddleware(), async (req, res) => {
  try {
    const q = (req.query.q as string) ?? "";
    const results = await services.cisa.searchKev(q);
    res.json({ query: q, count: results.length, vulnerabilities: results });
  } catch (err) {
    res.status(500).json({ error: "CISA KEV search failed" });
  }
});

router.get("/integrations/cisa/kev/ransomware", authMiddleware(), async (_req, res) => {
  try {
    const vulns = await services.cisa.getHighPriorityKev();
    res.json({ count: vulns.length, vulnerabilities: vulns });
  } catch (err) {
    res.status(500).json({ error: "CISA ransomware KEV fetch failed" });
  }
});

// ─── NVD Enhanced Endpoints ─────────────────────────────────────────────────

router.get("/integrations/nvd/cves", authMiddleware(), async (req, res) => {
  try {
    const keyword = req.query.keyword as string | undefined;
    const severity = req.query.severity as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const startIndex = req.query.startIndex ? parseInt(req.query.startIndex as string, 10) : undefined;
    const lastModStartDate = req.query.lastModStartDate as string | undefined;
    const lastModEndDate = req.query.lastModEndDate as string | undefined;
    const result = await services.nvd.searchCves({ keyword, severity, resultsPerPage: limit, startIndex, lastModStartDate, lastModEndDate });
    res.json({ status: services.nvd.status, ...result });
  } catch (err) {
    res.status(500).json({ error: "NVD CVE search failed" });
  }
});

router.get("/integrations/nvd/cves/critical", authMiddleware(), async (_req, res) => {
  try {
    const result = await services.nvd.getCriticalCves();
    res.json({ status: services.nvd.status, ...result });
  } catch (err) {
    res.status(500).json({ error: "NVD critical CVE fetch failed" });
  }
});

export default router;
