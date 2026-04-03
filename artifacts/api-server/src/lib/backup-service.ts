import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { pool } from "@szl-holdings/db";

const WORKSPACE_ROOT = path.resolve(process.cwd(), "../../");
const BACKUP_DIR = process.env.BACKUP_DIR ?? path.resolve(WORKSPACE_ROOT, "backups");
const MANIFEST_PATH = path.join(BACKUP_DIR, "backup_manifest.json");
const MAX_BACKUP_AGE_HOURS = 24;

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
}

export interface BackupHealthStatus {
  status: "ok" | "warning" | "error";
  lastBackupAt: string | null;
  lastBackupSizeBytes: number;
  ageHours: number | null;
  warning: boolean;
  totalBackups: number;
  details: string;
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

export function getBackupHealthStatus(): BackupHealthStatus {
  const manifest = readManifest();
  const actualBackups = listBackups();
  const actualCount = actualBackups.length;

  if (!manifest || !manifest.lastBackupAt) {
    return {
      status: "warning",
      lastBackupAt: null,
      lastBackupSizeBytes: 0,
      ageHours: null,
      warning: true,
      totalBackups: actualCount,
      details: "No backup manifest found. Run backup-db.sh to create the first backup.",
    };
  }

  const latestActual = actualBackups[0];

  if (!latestActual) {
    return {
      status: "warning",
      lastBackupAt: manifest.lastBackupAt,
      lastBackupSizeBytes: 0,
      ageHours: null,
      warning: true,
      totalBackups: 0,
      details: "Manifest present but no backup files found on disk. Re-run backup-db.sh.",
    };
  }

  const lastAt = new Date(latestActual.createdAt);
  const ageMs = Date.now() - lastAt.getTime();
  const ageHours = ageMs / (1000 * 60 * 60);
  const warning = ageHours > MAX_BACKUP_AGE_HOURS;

  return {
    status: warning ? "warning" : "ok",
    lastBackupAt: latestActual.createdAt,
    lastBackupSizeBytes: latestActual.sizeBytes,
    ageHours: Math.round(ageHours * 10) / 10,
    warning,
    totalBackups: actualCount,
    details: warning
      ? `Last backup is ${Math.round(ageHours)}h old — exceeds 24h threshold`
      : `Backup is current (${Math.round(ageHours * 10) / 10}h old, ${latestActual.sizeBytes > 0 ? `${(latestActual.sizeBytes / 1024).toFixed(1)} KB` : "empty — dry-run?"})`,
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
