import { useQuery } from "@tanstack/react-query";
import { FileText, Search, Filter, AlertTriangle, User, Clock, Shield, Zap } from "lucide-react";
import { useState } from "react";

async function apiFetch<T>(path: string): Promise<T> {
  const r = await fetch(`/api${path}`);
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json();
}

interface AuditEntry {
  id: number;
  timestamp: string;
  action: string;
  resource: string;
  actorEmail: string;
  actorName: string;
  severity: string;
  details: string;
  status: string;
  metadata?: Record<string, unknown>;
}

const actionIcons: Record<string, typeof FileText> = { auth: Shield, user: User, system: Zap, data: FileText };
const severityColors: Record<string, string> = {
  low: "text-emerald-400 bg-emerald-500/10",
  medium: "text-amber-400 bg-amber-500/10",
  high: "text-red-400 bg-red-500/10",
  critical: "text-red-400 bg-red-500/10 ring-1 ring-red-500/30",
};
const statusColors: Record<string, string> = {
  success: "text-emerald-400",
  failure: "text-red-400",
  warning: "text-amber-400",
};

export default function AuditLog() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const { data, isLoading, error } = useQuery<{ logs: AuditEntry[]; total: number }>({
    queryKey: ["audit-log", search, actionFilter],
    queryFn: () => {
      const qs = new URLSearchParams();
      if (search) qs.set("search", search);
      if (actionFilter !== "all") qs.set("action", actionFilter);
      return apiFetch(`/admin/audit-log${qs.toString() ? `?${qs}` : ""}`);
    },
    staleTime: 10000,
  });

  const logs = data?.logs ?? [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-display font-bold flex items-center gap-2"><FileText className="w-5 h-5 text-primary" />Audit Log</h1>
        <p className="text-xs text-muted-foreground mt-1">Complete event history for security, compliance, and debugging</p>
      </div>

      {error ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
          <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
          <p>Audit log requires API connection</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search logs..." className="w-full pl-9 pr-4 py-2 text-sm bg-muted rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div className="flex items-center gap-1.5">
              {["all", "auth", "user", "system", "data"].map(act => (
                <button key={act} onClick={() => setActionFilter(act)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${actionFilter === act ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}>
                  {act === "all" ? "All" : act.charAt(0).toUpperCase() + act.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card">
            <div className="p-3 border-b border-border flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{data?.total ?? 0} total events</span>
              <Filter className="w-4 h-4 text-muted-foreground" />
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center py-12"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
            ) : (
              <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
                {logs.map((log) => {
                  const ActIcon = actionIcons[log.action] ?? FileText;
                  return (
                    <div key={log.id} className="px-4 py-3 hover:bg-muted/30 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`mt-0.5 p-1.5 rounded-md ${severityColors[log.severity] ?? "text-muted-foreground bg-muted"}`}>
                            <ActIcon className="w-3 h-3" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium">{log.details}</span>
                              <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded uppercase font-mono">{log.action}</span>
                              <span className={`text-[10px] font-bold ${statusColors[log.status] ?? "text-muted-foreground"}`}>{log.status}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                              <span className="flex items-center gap-1"><User className="w-3 h-3" />{log.actorName || log.actorEmail}</span>
                              <span>Resource: {log.resource}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1 shrink-0">
                          <Clock className="w-3 h-3" />
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {logs.length === 0 && <div className="py-8 text-center text-sm text-muted-foreground">No logs found</div>}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
