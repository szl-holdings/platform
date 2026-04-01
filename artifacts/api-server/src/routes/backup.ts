import { Router, type IRouter } from "express";
import archiver from "archiver";
import { authMiddleware, requireRole } from "../middlewares/auth";
import {
  getBackupHealthStatus,
  listBackups,
  runBackup,
  exportTenantData,
} from "../lib/backup-service";

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
      tenantId: tenantId ?? "all",
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

export default backupRouter;
