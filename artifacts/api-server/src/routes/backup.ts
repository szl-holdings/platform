import { Router, type IRouter } from "express";
import archiver from "archiver";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { sendForbidden } from "../lib/api-response";
import {
  getBackupHealthStatus,
  listBackups,
  runBackup,
  exportTenantData,
} from "../lib/backup-service";
import { getLastDrillRuns, runBackupRestoreDrill } from "../jobs/backup-restore-drill";
import { logger } from "../lib/logger";

const backupRouter: IRouter = Router();

backupRouter.use("/admin/backup", authMiddleware());
backupRouter.use("/admin/backup", requireRole("admin"));

backupRouter.get("/admin/backup/status", (_req, res) => {
  const health = getBackupHealthStatus();
  const backups = listBackups();
  res.json({
    timestamp: new Date().toISOString(),
    health,
    backups,
    totalCount: backups.length,
    dailyCount: backups.filter(b => b.label === "daily").length,
    weeklyCount: backups.filter(b => b.label === "weekly").length,
  });
});

backupRouter.post("/admin/backup/run", async (_req, res) => {
  const result = await runBackup();
  if (!result.success) {
    res.status(500).json({ success: false, error: result.error });
    return;
  }
  res.json({
    success: true,
    triggeredAt: new Date().toISOString(),
    filename: result.filename,
    sizeBytes: result.sizeBytes,
    message: "Backup completed successfully",
  });
});

backupRouter.post("/admin/backup/export-tenant", async (req, res) => {
  const { orgId } = req.body as { orgId?: number };

  // AF-004: Verify the requesting admin has authority over the requested org.
  // Only super_admin may export across orgs (orgId omitted = all tenants, or
  // an orgId not in the caller's membership list). A plain `admin` role user
  // is constrained to exporting orgs they belong to.
  const user = req.user;
  if (!user) {
    sendForbidden(res, "Authentication required");
    return;
  }
  const isSuperAdmin = user.roles.includes("super_admin");
  if (!isSuperAdmin) {
    if (orgId == null) {
      logger.warn(
        { userId: user.id, roles: user.roles },
        "[backup] Cross-org tenant export blocked — super_admin required"
      );
      sendForbidden(
        res,
        "Cross-org backup export requires super_admin role"
      );
      return;
    }
    const memberOfOrg = user.orgs.some((o) => o.orgId === orgId);
    if (!memberOfOrg) {
      logger.warn(
        { userId: user.id, requestedOrgId: orgId, memberOrgs: user.orgs.map((o) => o.orgId) },
        "[backup] Tenant export blocked — admin lacks authority over requested org"
      );
      sendForbidden(
        res,
        "You do not have authority to export data for the requested organization"
      );
      return;
    }
  }

  try {
    const data = await exportTenantData(orgId);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const zipFilename = `tenant-export-${orgId != null ? `org_${orgId}` : "all"}-${timestamp}.zip`;

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${zipFilename}"`);

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.pipe(res);

    for (const [tableName, rows] of Object.entries(data)) {
      const content = JSON.stringify(rows, null, 2);
      archive.append(content, { name: `${tableName}.json` });
    }

    const manifest = {
      exportedAt: new Date().toISOString(),
      tenantId: orgId ?? "all",
      tables: Object.keys(data),
      rowCounts: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, v.length])
      ),
    };
    archive.append(JSON.stringify(manifest, null, 2), { name: "export_manifest.json" });

    await archive.finalize();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Export failed";
    if (!res.headersSent) {
      res.status(500).json({ error: message });
    }
  }
});

backupRouter.get("/admin/backup/drill/status", async (_req, res) => {
  try {
    const { runs, lastSuccessAt } = await getLastDrillRuns(20);
    const lastRun = runs[0] ?? null;
    const health = getBackupHealthStatus();
    res.json({
      timestamp: new Date().toISOString(),
      lastSuccessAt,
      lastRun,
      schedule: "Weekly on Sunday at 03:00 UTC (cron: 0 3 * * 0)",
      totalRuns: runs.length,
      passedRuns: runs.filter(r => r.status === "completed").length,
      failedRuns: runs.filter(r => r.status === "failed").length,
      backupHealth: health,
      runs,
    });
  } catch (err) {
    logger.error({ err }, "[backup-drill] Failed to load drill status");
    res.status(500).json({ error: "Failed to load drill status" });
  }
});

backupRouter.post("/admin/backup/drill/run", async (_req, res) => {
  try {
    logger.info("[backup-drill] Manual drill triggered via admin API");
    const result = await runBackupRestoreDrill();
    res.json({
      success: true,
      triggeredAt: new Date().toISOString(),
      drillRunId: result.runId,
      status: result.status,
      durationMs: result.durationMs,
      backupFile: result.backupFile,
      gzipIntegrityOk: result.gzipIntegrityOk,
      smokeChecksPassed: result.smokeChecksPassed,
      smokeChecksFailed: result.smokeChecksFailed,
      smokeChecks: result.smokeChecks,
      error: result.error,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Drill failed";
    logger.error({ err }, "[backup-drill] Manual drill failed");
    res.status(500).json({ success: false, error: message });
  }
});

export default backupRouter;
