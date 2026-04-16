import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@szl-holdings/api-zod";
import { getBackupHealthStatus } from "../lib/backup-service";
import { pool } from "@szl-holdings/db";

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

router.get("/healthz", async (_req, res) => {
  const base = HealthCheckResponse.parse({ status: "ok" });
  const backupHealth = getBackupHealthStatus();
  const dbHealth = await checkDatabase();

  const hasSessionSecret = !!process.env.SESSION_SECRET;
  const hasAiKey = !!(process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || process.env.OPENAI_API_KEY);
  const hasCloudStorage = !!process.env.OBJECT_STORAGE_BUCKET_ID;
  const authStatus = hasSessionSecret ? "ok" : "degraded";

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
      backup: {
        status: backupHealth.status,
        lastBackupAt: backupHealth.lastBackupAt,
        lastBackupSizeBytes: backupHealth.lastBackupSizeBytes,
        ageHours: backupHealth.ageHours,
        warning: backupHealth.warning,
        totalBackups: backupHealth.totalBackups,
        details: backupHealth.details,
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
  router.handle(req, res, () => {});
});

export default router;
