import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@szl-holdings/api-zod";
import { getBackupHealthStatus } from "../lib/backup-service";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const base = HealthCheckResponse.parse({ status: "ok" });
  const backupHealth = getBackupHealthStatus();

  res.json({
    ...base,
    backup: {
      status: backupHealth.status,
      lastBackupAt: backupHealth.lastBackupAt,
      lastBackupSizeBytes: backupHealth.lastBackupSizeBytes,
      ageHours: backupHealth.ageHours,
      warning: backupHealth.warning,
      totalBackups: backupHealth.totalBackups,
      details: backupHealth.details,
    },
  });
});

export default router;
