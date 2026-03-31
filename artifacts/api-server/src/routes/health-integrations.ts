import { Router, type IRouter } from "express";
import { services } from "@workspace/services";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { getOtelConfig } from "@workspace/observability";
import { getEmailProviderStatus } from "../lib/email";
import { isAzureAdConfigured } from "../lib/auth";
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
    const { services } = await import("@workspace/services");
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

export default router;
