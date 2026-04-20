import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { pool } from "@szl-holdings/db";

const WORKSPACE_ROOT = path.resolve(process.cwd(), "../../");
const BACKUP_DIR = process.env.BACKUP_DIR ?? path.resolve(WORKSPACE_ROOT, "backups");
const MANIFEST_PATH = path.join(BACKUP_DIR, "backup_manifest.json");
const MAX_BACKUP_AGE_HOURS = 24;

/**
 * Tier RPO (recovery point objective) the *remote* upload must satisfy.
 *
 * Defaults to 24h to match the Pilot tier RPO defined in
 * `docs/operations/backup-restore.md`. Production deployments override via
 * BACKUP_REMOTE_RPO_HOURS (e.g. Pro=4, Enterprise=1). When the most recent
 * successful remote upload is older than this window, the health endpoint
 * reports `remoteUpload.status="error"` and the self-monitor pages on-call.
 */
const REMOTE_UPLOAD_RPO_HOURS = Number(process.env.BACKUP_REMOTE_RPO_HOURS ?? 24);

export interface BackupRemoteUploadManifest {
  status?: "ok" | "skipped" | "error" | string;
  backend?: string;
  message?: string;
  remoteUrl?: string;
  remoteSizeBytes?: number;
  uploadedAt?: string | null;
}

export interface BackupManifest {
  lastBackupAt: string | null;
  lastBackupFile: string | null;
  lastBackupSizeBytes: number;
  label: string;
  totalBackups: number;
  dailyRetained: number;
  weeklyRetained: number;
  backupDir: string;
  status: "ok" | "error" | "never";
  remoteUpload?: BackupRemoteUploadManifest;
  lastRemoteUploadAt?: string | null;
  lastRemoteUploadStatus?: string | null;
}

/**
 * Health view of the remote (object-storage) leg of the backup pipeline.
 * `status` is independent of the local backup status so a stale or failed
 * remote upload does not get masked by a fresh local dump on the runner.
 *   - "ok"        — backend configured and last successful upload within RPO
 *   - "warning"   — backend configured, last upload aged but inside 2× RPO
 *   - "error"     — last successful upload older than 2× RPO, or last
 *                   attempt errored, or backend configured but no upload
 *                   has ever succeeded
 *   - "disabled"  — BACKUP_REMOTE_BACKEND unset / "none" (local-only mode)
 */
export interface BackupRemoteHealth {
  status: "ok" | "warning" | "error" | "disabled";
  backend: string;
  lastSuccessfulUploadAt: string | null;
  ageHours: number | null;
  rpoHours: number;
  rpoBreached: boolean;
  lastAttemptStatus: string | null;
  lastAttemptMessage: string | null;
  details: string;
}

export interface BackupHealthStatus {
  status: "ok" | "warning" | "error";
  lastBackupAt: string | null;
  lastBackupSizeBytes: number;
  ageHours: number | null;
  warning: boolean;
  totalBackups: number;
  details: string;
  remoteUpload: BackupRemoteHealth;
}

export function readManifest(): BackupManifest | null {
  try {
    if (!fs.existsSync(MANIFEST_PATH)) return null;
    const raw = fs.readFileSync(MANIFEST_PATH, "utf-8");
    return JSON.parse(raw) as BackupManifest;
  } catch {
    return null;
  }
}

export function listBackups(): { filename: string; sizeBytes: number; createdAt: string; label: "daily" | "weekly" }[] {
  if (!fs.existsSync(BACKUP_DIR)) return [];
  try {
    const files = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith(".sql.gz"));
    return files
      .map(filename => {
        const filepath = path.join(BACKUP_DIR, filename);
        const stat = fs.statSync(filepath);
        const label = filename.startsWith("weekly_") ? "weekly" : "daily";
        return {
          filename,
          sizeBytes: stat.size,
          createdAt: stat.mtime.toISOString(),
          label: label as "daily" | "weekly",
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch {
    return [];
  }
}

/**
 * Compute the remote-upload health view.
 *
 * Inputs:
 *   - manifest.remoteUpload         — last attempt status emitted by
 *                                     scripts/backup-upload.sh
 *   - manifest.lastRemoteUploadAt   — timestamp of last *successful* upload
 *   - BACKUP_REMOTE_BACKEND env     — if "none"/unset, returns "disabled"
 *   - BACKUP_REMOTE_RPO_HOURS env   — tier RPO window (default 24h)
 *
 * The status escalates to "error" — and the wrapping BackupHealthStatus is
 * downgraded — when no successful upload has been recorded inside 2× the RPO
 * window, so monitoring pages on-call before the actual RPO is breached.
 */
export function computeRemoteUploadHealth(
  manifest: BackupManifest | null,
): BackupRemoteHealth {
  const envBackend = (process.env.BACKUP_REMOTE_BACKEND ?? "none").toLowerCase();
  const manifestRemote = manifest?.remoteUpload ?? {};
  const backend = manifestRemote.backend ?? envBackend ?? "none";
  const rpoHours = REMOTE_UPLOAD_RPO_HOURS;

  if (envBackend === "none" || envBackend === "") {
    return {
      status: "disabled",
      backend: "none",
      lastSuccessfulUploadAt: null,
      ageHours: null,
      rpoHours,
      rpoBreached: false,
      lastAttemptStatus: manifestRemote.status ?? null,
      lastAttemptMessage: manifestRemote.message ?? null,
      details: "Remote backup backend disabled (BACKUP_REMOTE_BACKEND unset). Local-only mode.",
    };
  }

  const lastSuccessfulUploadAt = manifest?.lastRemoteUploadAt ?? null;
  const lastAttemptStatus = manifest?.lastRemoteUploadStatus ?? manifestRemote.status ?? null;
  const lastAttemptMessage = manifestRemote.message ?? null;

  if (!lastSuccessfulUploadAt) {
    return {
      status: "error",
      backend,
      lastSuccessfulUploadAt: null,
      ageHours: null,
      rpoHours,
      rpoBreached: true,
      lastAttemptStatus,
      lastAttemptMessage,
      details:
        lastAttemptStatus === "error"
          ? `No successful remote upload on record. Last attempt failed: ${lastAttemptMessage ?? "unknown error"}`
          : `Remote backend "${backend}" configured but no successful upload has been recorded yet.`,
    };
  }

  const ageMs = Date.now() - new Date(lastSuccessfulUploadAt).getTime();
  const ageHours = ageMs / (1000 * 60 * 60);
  const rpoBreached = ageHours > rpoHours;
  const hardBreach = ageHours > rpoHours * 2;

  let status: BackupRemoteHealth["status"];
  if (lastAttemptStatus === "error") {
    status = "error";
  } else if (hardBreach) {
    status = "error";
  } else if (rpoBreached) {
    status = "warning";
  } else {
    status = "ok";
  }

  const ageRounded = Math.round(ageHours * 10) / 10;
  let details: string;
  if (status === "ok") {
    details = `Last remote upload ${ageRounded}h ago (within ${rpoHours}h RPO).`;
  } else if (status === "warning") {
    details = `Last remote upload ${ageRounded}h ago — exceeds ${rpoHours}h RPO but inside ${rpoHours * 2}h hard limit.`;
  } else if (lastAttemptStatus === "error") {
    details = `Last upload attempt errored: ${lastAttemptMessage ?? "unknown error"}. Last successful upload was ${ageRounded}h ago.`;
  } else {
    details = `Last successful remote upload was ${ageRounded}h ago — exceeds ${rpoHours * 2}h hard limit (2× RPO). Backup pipeline likely stalled.`;
  }

  return {
    status,
    backend,
    lastSuccessfulUploadAt,
    ageHours: ageRounded,
    rpoHours,
    rpoBreached,
    lastAttemptStatus,
    lastAttemptMessage,
    details,
  };
}

export function getBackupHealthStatus(): BackupHealthStatus {
  const manifest = readManifest();
  const actualBackups = listBackups();
  const actualCount = actualBackups.length;
  const remoteUpload = computeRemoteUploadHealth(manifest);

  // The composite status escalates to whichever leg is worst: a healthy local
  // dump cannot mask a stale or failed remote upload (that's the whole point
  // of this monitor).
  const escalate = (
    base: BackupHealthStatus["status"],
    remote: BackupRemoteHealth["status"],
  ): BackupHealthStatus["status"] => {
    if (remote === "error") return "error";
    if (remote === "warning" && base === "ok") return "warning";
    return base;
  };

  if (!manifest || !manifest.lastBackupAt) {
    return {
      status: escalate("warning", remoteUpload.status),
      lastBackupAt: null,
      lastBackupSizeBytes: 0,
      ageHours: null,
      warning: true,
      totalBackups: actualCount,
      details: "No backup manifest found. Run backup-db.sh to create the first backup.",
      remoteUpload,
    };
  }

  const latestActual = actualBackups[0];

  if (!latestActual) {
    return {
      status: escalate("warning", remoteUpload.status),
      lastBackupAt: manifest.lastBackupAt,
      lastBackupSizeBytes: 0,
      ageHours: null,
      warning: true,
      totalBackups: 0,
      details: "Manifest present but no backup files found on disk. Re-run backup-db.sh.",
      remoteUpload,
    };
  }

  const lastAt = new Date(latestActual.createdAt);
  const ageMs = Date.now() - lastAt.getTime();
  const ageHours = ageMs / (1000 * 60 * 60);
  const warning = ageHours > MAX_BACKUP_AGE_HOURS;
  const baseStatus: BackupHealthStatus["status"] = warning ? "warning" : "ok";

  return {
    status: escalate(baseStatus, remoteUpload.status),
    lastBackupAt: latestActual.createdAt,
    lastBackupSizeBytes: latestActual.sizeBytes,
    ageHours: Math.round(ageHours * 10) / 10,
    warning: warning || remoteUpload.status === "warning" || remoteUpload.status === "error",
    totalBackups: actualCount,
    details: warning
      ? `Last backup is ${Math.round(ageHours)}h old — exceeds 24h threshold`
      : `Backup is current (${Math.round(ageHours * 10) / 10}h old, ${latestActual.sizeBytes > 0 ? `${(latestActual.sizeBytes / 1024).toFixed(1)} KB` : "empty — dry-run?"})`,
    remoteUpload,
  };
}

export async function runBackup(): Promise<{ success: boolean; filename?: string; sizeBytes?: number; error?: string }> {
  const backupScript = path.resolve(WORKSPACE_ROOT, "scripts/backup-db.sh");
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return { success: false, error: "DATABASE_URL is not configured" };
  }

  if (!fs.existsSync(backupScript)) {
    return { success: false, error: "Backup script not found at scripts/backup-db.sh" };
  }

  try {
    execSync(`bash "${backupScript}"`, {
      env: { ...process.env, DATABASE_URL: databaseUrl, BACKUP_DIR },
      timeout: 5 * 60 * 1000,
      stdio: "pipe",
    });

    const backups = listBackups();
    const latest = backups[0];

    return {
      success: true,
      filename: latest?.filename,
      sizeBytes: latest?.sizeBytes,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Backup script failed: ${message}` };
  }
}

const TENANT_SCOPED_TABLES: Record<string, string> = {
  users: "org_id",
  org_members: "org_id",
  subscriptions: "org_id",
  invoices: "org_id",
  entitlements: "plan_id",
};

const PLATFORM_TABLES_ALL = [
  "roles", "billing_plans", "feature_flags", "apps_registry",
];

const TENANT_OWNED_TABLES = [
  "users", "org_members", "user_roles", "api_keys", "notifications",
  "notification_preferences", "activity_log", "audit_events", "sessions",
  "subscriptions", "invoices", "usage_events",
  "connector_logs", "webhook_events",
];

export async function exportTenantData(orgId?: number): Promise<Record<string, unknown[]>> {
  const result: Record<string, unknown[]> = {};

  if (orgId != null) {
    for (const table of TENANT_OWNED_TABLES) {
      try {
        const col = TENANT_SCOPED_TABLES[table] ?? "org_id";
        const tableHasOrgId = await pool
          .query(
            `SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 AND column_name=$2`,
            [table, col]
          )
          .then(r => r.rows.length > 0);

        if (tableHasOrgId) {
          const res = await pool.query(`SELECT * FROM "${table}" WHERE "${col}" = $1`, [orgId]);
          result[table] = res.rows;
        } else {
          result[table] = [];
        }
      } catch {
        result[table] = [];
      }
    }

    for (const table of PLATFORM_TABLES_ALL) {
      try {
        const res = await pool.query(`SELECT * FROM "${table}"`);
        result[table] = res.rows;
      } catch {
        result[table] = [];
      }
    }
  } else {
    const allTables = [...new Set([...TENANT_OWNED_TABLES, ...PLATFORM_TABLES_ALL])];
    for (const table of allTables) {
      try {
        const res = await pool.query(`SELECT * FROM "${table}"`);
        result[table] = res.rows;
      } catch {
        result[table] = [];
      }
    }
  }

  return result;
}
