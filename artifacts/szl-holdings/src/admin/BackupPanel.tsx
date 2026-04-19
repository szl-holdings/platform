import React, { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useStandardMutation, useStandardQuery } from "@szl-holdings/api-client-react";
import {
  HardDrive, Download, CheckCircle2, AlertCircle, Loader2, RefreshCw,
  Database, Clock, Activity, Shield, X, FileText, Save, Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetchAdmin } from "./api";

const API = "/api";
function getCsrfToken(): string {
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

// ─── Backup & Recovery Panel ─────────────────────────────────────────────────

interface BackupFile {
  filename: string;
  sizeBytes: number;
  createdAt: string;
  label: "daily" | "weekly";
}

interface BackupStatus {
  health: {
    status: "ok" | "warning" | "error";
    lastBackupAt: string | null;
    lastBackupSizeBytes: number;
    ageHours: number | null;
    warning: boolean;
    totalBackups: number;
    details: string;
  };
  backups: BackupFile[];
  totalCount: number;
  dailyCount: number;
  weeklyCount: number;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function BackupPanel() {
  const queryClient = useQueryClient();
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const { data, isLoading, isError } = useStandardQuery<BackupStatus>({
    queryKey: ["backup-status"],
    queryFn: () => apiFetchAdmin<BackupStatus>("/admin/backup/status"),
    refetchInterval: 30000,
  });

  const runBackupMutation = useStandardMutation({
    mutationFn: () => apiFetchAdmin("/admin/backup/run", { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["backup-status"] }),
  });

  const handleExport = async () => {
    setExportLoading(true);
    setExportError(null);
    try {
      const res = await fetch(`${API}/admin/backup/export-tenant`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId: undefined }),
      });
      if (!res.ok) throw new Error(`Export failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tenant-export-${new Date().toISOString().split("T")[0]}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setExportError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExportLoading(false);
    }
  };

  const health = data?.health;
  const statusColor = health?.status === "ok"
    ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/20"
    : health?.status === "warning"
    ? "text-amber-600 bg-amber-500/10 border-amber-500/20"
    : "text-red-600 bg-red-500/10 border-red-500/20";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" /> Backup & Disaster Recovery
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage automated database backups, data exports, and recovery status.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={exportLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted/30 transition-colors disabled:opacity-50"
          >
            {exportLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Export All Data
          </button>
          <button
            onClick={() => runBackupMutation.mutate()}
            disabled={runBackupMutation.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {runBackupMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <HardDrive className="w-3.5 h-3.5" />}
            Run Backup Now
          </button>
        </div>
      </div>

      {runBackupMutation.isSuccess && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Backup completed successfully.
        </div>
      )}
      {runBackupMutation.isError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Backup failed. Check server logs for details.
        </div>
      )}
      {exportError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {exportError}
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {isError && (
        <div className="bg-card border border-border rounded-xl p-6 text-center">
          <AlertCircle className="w-6 h-6 text-amber-500 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Unable to load backup status from API.</p>
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-xl p-4 col-span-1 md:col-span-2">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">Backup Health</span>
                </div>
                <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider", statusColor)}>
                  {health?.status ?? "unknown"}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                  <span className="text-xs text-muted-foreground">Last Backup</span>
                  <span className="text-xs font-medium text-foreground">
                    {health?.lastBackupAt
                      ? new Date(health.lastBackupAt).toLocaleString()
                      : "Never"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                  <span className="text-xs text-muted-foreground">Backup Age</span>
                  <span className="text-xs font-medium text-foreground">
                    {health?.ageHours != null ? `${health.ageHours}h ago` : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                  <span className="text-xs text-muted-foreground">Last Backup Size</span>
                  <span className="text-xs font-medium text-foreground">
                    {formatBytes(health?.lastBackupSizeBytes ?? 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-xs text-muted-foreground">Details</span>
                  <span className="text-xs text-muted-foreground max-w-[60%] text-right">{health?.details ?? "—"}</span>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <HardDrive className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Storage</span>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="text-2xl font-bold text-foreground">{data.totalCount}</div>
                  <div className="text-xs text-muted-foreground">Total backups on disk</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-muted/30 rounded-lg p-2 text-center">
                    <div className="text-base font-bold text-foreground">{data.dailyCount}</div>
                    <div className="text-[10px] text-muted-foreground">Daily</div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-2 text-center">
                    <div className="text-base font-bold text-foreground">{data.weeklyCount}</div>
                    <div className="text-[10px] text-muted-foreground">Weekly</div>
                  </div>
                </div>
                <div className="text-[10px] text-muted-foreground leading-relaxed">
                  Policy: 7 daily + 4 weekly backups retained automatically.
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border">
              <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-primary" /> Backup Files
              </span>
              <span className="text-xs text-muted-foreground">{data.backups.length} files</span>
            </div>
            {data.backups.length === 0 ? (
              <div className="py-12 text-center">
                <HardDrive className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No backup files found.</p>
                <p className="text-xs text-muted-foreground mt-1">Run a backup to create the first file.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {data.backups.slice(0, 15).map(backup => (
                  <div key={backup.filename} className="flex items-center justify-between px-5 py-3 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn(
                        "text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider shrink-0",
                        backup.label === "weekly"
                          ? "text-violet-600 bg-violet-500/10 border-violet-500/20"
                          : "text-blue-600 bg-blue-500/10 border-blue-500/20"
                      )}>
                        {backup.label}
                      </div>
                      <span className="text-xs font-mono text-foreground truncate">{backup.filename}</span>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 ml-2">
                      <span className="text-xs text-muted-foreground">{formatBytes(backup.sizeBytes)}</span>
                      <span className="text-xs text-muted-foreground">{new Date(backup.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Download className="w-3.5 h-3.5 text-primary" /> Data Export (GDPR)
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Export all tenant data as a ZIP archive containing JSON files for each
                database table. Use for GDPR data portability requests or offline analysis.
              </p>
              <button
                onClick={handleExport}
                disabled={exportLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary border border-primary/20 text-xs font-semibold hover:bg-primary/20 transition-colors disabled:opacity-50"
              >
                {exportLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                Download Full Export
              </button>
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-primary" /> Recovery Documentation
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                Full disaster recovery playbook including point-in-time restore,
                migration rollbacks, and data retention policy.
              </p>
              <div className="space-y-1">
                {[
                  "docs/disaster-recovery.md",
                  "scripts/rollback/README.md",
                  "scripts/backup-db.sh",
                ].map(doc => (
                  <div key={doc} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <FileText className="w-3 h-3 text-primary/60 shrink-0" />
                    <span className="font-mono">{doc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}


export { BackupPanel };
