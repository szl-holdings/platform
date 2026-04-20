import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import v8 from "node:v8";
import { HealthCheckResponse } from "@szl-holdings/api-zod";
import { getBackupHealthStatus } from "../lib/backup-service";
import { pool } from "@szl-holdings/db";
import { adminGuard } from "../middlewares/admin-guard";
import { verifyInternalHeader, tokenHasScope } from "../lib/internal-tokens";
import { Sentry } from "../lib/sentry";

/**
 * Apply a lightweight diagnostics guard in production environments.
 * In development/staging the endpoint is accessible without auth so local
 * operators and integration tests can reach diagnostics without a session.
 * Set APP_ENV=production or NODE_ENV=production to activate the guard.
 *
 * Production policy (GAP-016):
 *   - An internal token (scoped or legacy) with `health:read` scope is
 *     accepted. The legacy ALLOY_INTERNAL_TOKEN carries `health:read` by
 *     default and `/health/detailed` is in its path allowlist.
 *   - Otherwise, fall back to `adminGuard` (which requires an authenticated
 *     ops/super_admin/exec session).
 */
const IS_PRODUCTION = process.env.NODE_ENV === "production" || process.env.APP_ENV === "production";
function healthDiagnosticsGuard(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers["x-internal-token"] as string | undefined;
  if (header) {
    const match = verifyInternalHeader(header, req.originalUrl || req.url);
    if (match && tokenHasScope(match.context, "health:read")) {
      next();
      return;
    }
  }
  adminGuard(req, res, next);
}
const productionAdminGuard = IS_PRODUCTION
  ? healthDiagnosticsGuard
  : (_req: Request, _res: Response, next: NextFunction) => next();

const router: IRouter = Router();

const PLATFORM_APPS = [
  { slug: "szl-holdings", name: "SZL Holdings Dashboard", type: "command_surface" },
  { slug: "command", name: "Unified Command", type: "command_surface" },
  { slug: "aegis", name: "Aegis — Defense & Intelligence", type: "domain_pack" },
  { slug: "terra", name: "Terra — Real Estate Intelligence", type: "domain_pack" },
  { slug: "vessels", name: "Vessels — Maritime Intelligence", type: "domain_pack" },
  { slug: "carlota-jo", name: "Carlota Jo Consulting", type: "domain_pack" },
  { slug: "szl-holdings-mobile", name: "CORTEX — Mobile Command", type: "mobile" },
  { slug: "api-server", name: "API Server", type: "backend" },
];

async function checkDatabase(): Promise<{ status: string; latencyMs: number; tables?: number }> {
  const start = Date.now();
  try {
    const result = await pool.query("SELECT count(*)::int AS cnt FROM pg_tables WHERE schemaname = 'public'");
    return { status: "ok", latencyMs: Date.now() - start, tables: result.rows[0]?.cnt ?? 0 };
  } catch {
    return { status: "degraded", latencyMs: Date.now() - start };
  }
}

/**
 * Snapshot of pg connection pool saturation. Used by the self-monitor
 * (OBS-007) to alert when usage approaches the configured pool max.
 *   - total:   pool.totalCount   (all connections currently held by the pool)
 *   - idle:    pool.idleCount    (connections sitting idle, available for checkout)
 *   - waiting: pool.waitingCount (queries queued waiting for a free connection)
 *   - active:  total - idle      (connections currently executing a query)
 *   - max:     pool.options.max  (the configured ceiling)
 *   - usedPct: active / max * 100
 */
function getPoolStats(): {
  total: number;
  idle: number;
  active: number;
  waiting: number;
  max: number;
  usedPct: number;
  status: "ok" | "elevated" | "saturated";
} {
  const total = (pool as unknown as { totalCount: number }).totalCount ?? 0;
  const idle = (pool as unknown as { idleCount: number }).idleCount ?? 0;
  const waiting = (pool as unknown as { waitingCount: number }).waitingCount ?? 0;
  const max = ((pool as unknown as { options?: { max?: number } }).options?.max ?? 10) || 10;
  const active = Math.max(0, total - idle);
  const usedPct = max > 0 ? (active / max) * 100 : 0;
  let status: "ok" | "elevated" | "saturated" = "ok";
  if (usedPct > 80 || waiting > 0) status = "saturated";
  else if (usedPct > 60) status = "elevated";
  return { total, idle, active, waiting, max, usedPct: Math.round(usedPct * 10) / 10, status };
}

router.get("/healthz", async (_req, res) => {
  const base = HealthCheckResponse.parse({ status: "ok" });
  const backupHealth = getBackupHealthStatus();
  const dbHealth = await checkDatabase();

  const hasSessionSecret = !!process.env.SESSION_SECRET;
  const hasAiKey = !!(process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY || process.env.AI_INTEGRATIONS_GEMINI_API_KEY);
  const hasCloudStorage = !!process.env.OBJECT_STORAGE_BUCKET_ID;
  const authStatus = hasSessionSecret ? "ok" : "degraded";
  const sentryDsnConfigured = !!process.env.SENTRY_DSN;
  const sentryInitialized = Sentry.isInitialized();

  const overallStatus = dbHealth.status === "ok" && authStatus === "ok" ? "ok" : "degraded";

  res.json({
    ...base,
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? "0.0.0",
    uptime: Math.floor(process.uptime()),
    services: {
      server: { status: "ok" },
      database: dbHealth,
      storage: { status: "ok", mode: hasCloudStorage ? "cloud" : "local" },
      auth: { status: authStatus, mode: hasSessionSecret ? "configured" : "missing_secret" },
      ai: { status: "ok", mode: hasAiKey ? "live" : "mock" },
      errorTracking: {
        status: sentryInitialized ? "ok" : sentryDsnConfigured ? "degraded" : "unconfigured",
        provider: "sentry",
        dsnConfigured: sentryDsnConfigured,
        initialized: sentryInitialized,
      },
      backup: {
        status: backupHealth.status,
        lastBackupAt: backupHealth.lastBackupAt,
        lastBackupSizeBytes: backupHealth.lastBackupSizeBytes,
        ageHours: backupHealth.ageHours,
        warning: backupHealth.warning,
        totalBackups: backupHealth.totalBackups,
        details: backupHealth.details,
        remoteUpload: backupHealth.remoteUpload,
      },
    },
    platform: {
      apps: PLATFORM_APPS,
      totalApps: PLATFORM_APPS.length,
    },
  });
});

router.get("/health", async (req, res) => {
  req.url = "/healthz";
  (router as any).handle(req, res, () => {});
});

/**
 * Detailed health endpoint — includes sensitive diagnostics.
 * In production (NODE_ENV or APP_ENV = "production"), requires adminGuard:
 *   either a session with super_admin/ops/exec role, or a correct
 *   x-internal-token matching ALLOY_INTERNAL_TOKEN (platform services).
 * In development/staging, the endpoint is unrestricted so operators and
 *   integration tests can access diagnostics without credentials.
 */
router.get("/health/detailed", productionAdminGuard, async (_req: Request, res: Response) => {
  const dbHealth = await checkDatabase();
  const dbPool = getPoolStats();
  const backupHealth = getBackupHealthStatus();
  const memUsage = process.memoryUsage();

  const sensitiveEnvStatus = {
    SESSION_SECRET: !!process.env.SESSION_SECRET,
    ALLOY_INTERNAL_TOKEN: !!process.env.ALLOY_INTERNAL_TOKEN,
    ALLOY_INTERNAL_TOKEN_LENGTH_OK: (process.env.ALLOY_INTERNAL_TOKEN?.length ?? 0) >= 32,
    CONNECTOR_ENCRYPTION_KEY: !!process.env.CONNECTOR_ENCRYPTION_KEY,
    DATABASE_URL: !!process.env.DATABASE_URL,
    STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
    AI_KEY_CONFIGURED: !!(
      process.env.AI_INTEGRATIONS_OPENAI_API_KEY ||
      process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY ||
      process.env.AI_INTEGRATIONS_GEMINI_API_KEY
    ),
    SENTRY_DSN: !!process.env.SENTRY_DSN,
    FIELD_ENCRYPTION_KEY: !!process.env.FIELD_ENCRYPTION_KEY,
  };

  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? "0.0.0",
    uptime: Math.floor(process.uptime()),
    nodeVersion: process.version,
    pid: process.pid,
    env: process.env.NODE_ENV,
    runtimeMode: process.env.RUNTIME_MODE ?? process.env.APP_ENV ?? "unknown",
    database: dbHealth,
    dbPool,
    backup: {
      status: backupHealth.status,
      lastBackupAt: backupHealth.lastBackupAt,
      ageHours: backupHealth.ageHours,
      totalBackups: backupHealth.totalBackups,
      remoteUpload: backupHealth.remoteUpload,
    },
    memory: {
      heapUsedMb: Math.round(memUsage.heapUsed / 1024 / 1024),
      // Use V8's heap_size_limit (the real OOM ceiling) as the denominator,
      // not process.memoryUsage().heapTotal (V8's currently-allocated heap,
      // which grows on demand and produces meaningless 90+% ratios when V8
      // hasn't yet expanded the heap to its limit).
      heapTotalMb: Math.round(v8.getHeapStatistics().heap_size_limit / 1024 / 1024),
      rssMb: Math.round(memUsage.rss / 1024 / 1024),
      externalMb: Math.round(memUsage.external / 1024 / 1024),
    },
    platform: {
      apps: PLATFORM_APPS,
      totalApps: PLATFORM_APPS.length,
    },
    envStatus: sensitiveEnvStatus,
  });
});

export default router;
