import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useState } from "react";
import { Search, CheckCircle, XCircle, Clock, Filter, ArrowUpDown, ScrollText, Zap, Shield, Settings, Eye, Database, Webhook, Flag } from "lucide-react";

const EVENT_ICONS: Record<string, React.ReactNode> = {
  "user.create": <Zap className="w-3.5 h-3.5 text-blue-400" />,
  "user.update": <Settings className="w-3.5 h-3.5 text-amber-400" />,
  "user.delete": <XCircle className="w-3.5 h-3.5 text-red-400" />,
  "connector.test": <Shield className="w-3.5 h-3.5 text-emerald-400" />,
  "connector.sync": <Database className="w-3.5 h-3.5 text-purple-400" />,
  "webhook.received": <Webhook className="w-3.5 h-3.5 text-cyan-400" />,
  "flag.toggle": <Flag className="w-3.5 h-3.5 text-orange-400" />,
  "auth.login": <Eye className="w-3.5 h-3.5 text-green-400" />,
};

function getEventIcon(action: string) {
  return EVENT_ICONS[action] || <Zap className="w-3.5 h-3.5 text-muted-foreground" />;
}

function getEventColor(action: string): string {
  if (action.includes("delete") || action.includes("error")) return "border-l-red-500";
  if (action.includes("create") || action.includes("success")) return "border-l-emerald-500";
  if (action.includes("update") || action.includes("sync")) return "border-l-amber-500";
  if (action.includes("test") || action.includes("check")) return "border-l-blue-500";
  return "border-l-muted-foreground";
}

type SortField = "timestamp" | "action" | "actor" | "result";
type SortDir = "asc" | "desc";

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <div className="h-7 w-32 bg-muted rounded animate-pulse" />
        <div className="h-4 w-56 bg-muted/60 rounded animate-pulse mt-2" />
      </div>
      <div className="flex gap-3">
        <div className="h-9 flex-1 max-w-md bg-muted rounded-lg animate-pulse" />
        <div className="h-9 w-32 bg-muted rounded-lg animate-pulse" />
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-3 border-b border-border/50">
            <div className="w-7 h-7 rounded-lg bg-muted animate-pulse" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-40 bg-muted rounded animate-pulse" />
              <div className="h-3 w-64 bg-muted/60 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
        <ScrollText className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-medium mb-1">No audit entries</h3>
      <p className="text-xs text-muted-foreground text-center max-w-sm">System events will appear here as actions are performed.</p>
    </div>
  );
}

export default function AuditLogPage() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("timestamp");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-audit-log", search],
    queryFn: () => api.getAuditLog({ search: search || undefined }),
  });

  if (isLoading) return <LoadingSkeleton />;

  const uniqueActions = [...new Set(data?.logs.map((l) => l.action) ?? [])];

  let logs = data?.logs ?? [];
  if (actionFilter !== "all") {
    logs = logs.filter((l) => l.action === actionFilter);
  }

  logs = [...logs].sort((a, b) => {
    let cmp = 0;
    if (sortField === "timestamp") cmp = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    else if (sortField === "action") cmp = a.action.localeCompare(b.action);
    else if (sortField === "actor") cmp = a.actor.localeCompare(b.actor);
    else if (sortField === "result") cmp = a.result.localeCompare(b.result);
    return sortDir === "desc" ? -cmp : cmp;
  });

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(sortDir === "desc" ? "asc" : "desc");
    else { setSortField(field); setSortDir("desc"); }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Audit Log</h1>
        <p className="text-sm text-muted-foreground mt-1">System activity and change history</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search actions, actors, targets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-muted/40 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="pl-9 pr-8 py-2 text-sm rounded-lg border border-border bg-muted/40 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none cursor-pointer transition-all"
          >
            <option value="all">All Actions</option>
            {uniqueActions.sort().map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      {logs.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">
                  <button onClick={() => toggleSort("timestamp")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                    Time <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">
                  <button onClick={() => toggleSort("action")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                    Action <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">
                  <button onClick={() => toggleSort("actor")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                    Actor <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Target</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">
                  <button onClick={() => toggleSort("result")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                    Result <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3 hidden lg:table-cell">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((entry) => (
                <tr key={entry.id} className={`border-b border-border/50 hover:bg-muted/30 transition-colors border-l-2 ${getEventColor(entry.action)}`}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                      <Clock className="w-3 h-3 shrink-0" />
                      <span className="whitespace-nowrap">{new Date(entry.timestamp).toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-muted/60 flex items-center justify-center shrink-0">
                        {getEventIcon(entry.action)}
                      </div>
                      <code className="text-xs px-1.5 py-0.5 rounded bg-muted font-mono text-foreground">{entry.action}</code>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm">{entry.actor}</td>
                  <td className="px-5 py-3">
                    <code className="text-xs px-2 py-0.5 rounded-md bg-primary/10 text-primary font-mono border border-primary/20">{entry.target}</code>
                  </td>
                  <td className="px-5 py-3">
                    {entry.result === "success" ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        <CheckCircle className="w-3 h-3" /> Success
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs text-red-400 font-medium bg-red-500/10 px-2 py-0.5 rounded-full">
                        <XCircle className="w-3 h-3" /> Failed
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-xs text-muted-foreground max-w-xs truncate hidden lg:table-cell">{entry.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data && (
            <div className="px-5 py-3 border-t border-border text-xs text-muted-foreground flex items-center justify-between bg-muted/20">
              <span>{logs.length} of {data.total} entries</span>
              <span className="font-mono">{actionFilter !== "all" ? `Filtered: ${actionFilter}` : "All actions"}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
