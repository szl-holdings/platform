
import { Download, Clock, User, AlertTriangle, CheckCircle, XCircle, Loader, Calendar, Database, FileText, FileSpreadsheet } from "lucide-react";
import { useStandardQuery } from "@szl-holdings/api-client-react";

async function apiFetch<T>(path: string): Promise<T> {
  const r = await fetch(`/api${path}`);
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json();
}

interface ExportRecord {
  id: number;
  exportId: string;
  name: string;
  dataSource: string;
  format: "csv" | "pdf";
  status: "pending" | "processing" | "completed" | "failed";
  rowCount: number | null;
  fileSizeBytes: number | null;
  downloadToken: string | null;
  expiresAt: string | null;
  errorMessage: string | null;
  scheduleFrequency: "once" | "daily" | "weekly";
  filterParams: string | null;
  triggeredByEmail: string | null;
  triggeredByName: string | null;
  completedAt: string | null;
  createdAt: string;
}

function formatBytes(bytes: number | null): string {
  if (bytes === null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function StatusBadge({ status }: { status: ExportRecord["status"] }) {
  const configs = {
    pending: { icon: Loader, label: "Pending", cls: "text-[#d4a054] bg-[#d4a054]/10" },
    processing: { icon: Loader, label: "Processing", cls: "text-blue-400 bg-blue-400/10" },
    completed: { icon: CheckCircle, label: "Completed", cls: "text-[#6b8f71] bg-[#6b8f71]/10" },
    failed: { icon: XCircle, label: "Failed", cls: "text-[#c45a4a] bg-[#c45a4a]/10" },
  };
  const cfg = configs[status] ?? configs.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.cls}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function FormatBadge({ format }: { format: "csv" | "pdf" }) {
  const Icon = format === "pdf" ? FileText : FileSpreadsheet;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-[10px] font-mono uppercase">
      <Icon className="w-3 h-3" />
      {format}
    </span>
  );
}

const DATA_SOURCE_LABELS: Record<string, string> = {
  audit_events: "Audit Log",
  firestorm_findings: "Aegis Incidents",
  vessels: "Vessels Fleet",
  terra_deals: "Terra Deals",
  lyte_signals: "Lyte Signals",
  msp_tickets: "MSP Tickets",
};

export default function ExportHistory() {
  const { data, isLoading, error } = useStandardQuery<{ exports: ExportRecord[]; total: number; page: number; limit: number }>({
    queryKey: ["admin-export-history"],
    queryFn: () => apiFetch("/admin/export-history"),
    staleTime: 15000,
    refetchInterval: 30000,
  });

  const exports = data?.exports ?? [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-display font-bold flex items-center gap-2">
          <Download className="w-5 h-5 text-primary" />
          Export History
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Audit trail of all data exports — who triggered them, what data, and when. Downloads expire after 24 hours.
        </p>
      </div>

      {error ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
          <AlertTriangle className="w-8 h-8 text-[#d4a054] mx-auto mb-2" />
          <p className="text-sm">Export history requires API connection</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="p-3 border-b border-border flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{data?.total ?? 0} total exports</span>
            <Database className="w-4 h-4 text-muted-foreground" />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : exports.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              <Download className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p>No exports yet</p>
              <p className="text-xs mt-1">Exports from audit logs and data tables will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {exports.map((exp) => {
                const isExpired = exp.expiresAt ? new Date(exp.expiresAt) < new Date() : false;
                return (
                  <div key={exp.id} className="px-4 py-3 hover:bg-muted/20 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-sm font-medium truncate">{exp.name}</span>
                          <FormatBadge format={exp.format} />
                          <StatusBadge status={exp.status} />
                          {exp.scheduleFrequency !== "once" && (
                            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded capitalize">
                              {exp.scheduleFrequency}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-[10px] text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <Database className="w-3 h-3" />
                            {DATA_SOURCE_LABELS[exp.dataSource] ?? exp.dataSource}
                          </span>
                          {exp.rowCount !== null && (
                            <span>{exp.rowCount.toLocaleString()} rows</span>
                          )}
                          {exp.fileSizeBytes !== null && (
                            <span>{formatBytes(exp.fileSizeBytes)}</span>
                          )}
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {exp.triggeredByEmail ?? exp.triggeredByName ?? "System"}
                          </span>
                          {exp.filterParams && (
                            <span className="font-mono text-[9px] bg-muted px-1.5 py-0.5 rounded truncate max-w-[180px]">
                              {exp.filterParams.length > 60 ? exp.filterParams.slice(0, 60) + "…" : exp.filterParams}
                            </span>
                          )}
                        </div>
                        {exp.errorMessage && (
                          <p className="mt-1 text-[10px] text-[#c45a4a]">{exp.errorMessage}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(exp.createdAt).toLocaleString()}
                        </span>
                        {exp.expiresAt && exp.status === "completed" && (
                          <span className={isExpired ? "text-[#c45a4a]" : "text-muted-foreground"}>
                            {isExpired ? "Expired" : `Expires ${new Date(exp.expiresAt).toLocaleDateString()}`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="rounded-xl bg-muted/30 border border-border p-4 text-xs text-muted-foreground space-y-1">
        <p className="font-semibold text-foreground text-sm mb-2 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          Compliance Notes
        </p>
        <p>• All exports are logged for SOC 2 Type II audit trail compliance</p>
        <p>• Download tokens expire after 24 hours — files are generated on-demand and not stored server-side</p>
        <p>• GDPR data portability requests should use the bulk export endpoints with appropriate date filters</p>
        <p>• Exports over 10,000 rows are limited to the first 10,000 records — contact support for full dumps</p>
        <p>• Only users with admin or compliance role can access export history and trigger audit exports</p>
      </div>
    </div>
  );
}
