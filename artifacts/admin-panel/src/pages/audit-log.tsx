import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ScrollText, Search, Filter } from "lucide-react";
import { useState } from "react";

const ACTION_COLORS: Record<string, string> = {
  create: "text-emerald-400 bg-emerald-500/10",
  update: "text-blue-400 bg-blue-500/10",
  delete: "text-red-400 bg-red-500/10",
  login: "text-violet-400 bg-violet-500/10",
  logout: "text-amber-400 bg-amber-500/10",
};

export default function AuditLogPage() {
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-audit-log", search, action],
    queryFn: () => api.getAuditLog({ search, action }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Audit Log</h1>
        <p className="text-sm text-muted-foreground mt-1">Full audit trail of admin actions</p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            className="w-full pl-9 pr-4 py-2 text-sm bg-muted rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Search logs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <select
            className="pl-9 pr-4 py-2 text-sm bg-muted rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary appearance-none"
            value={action}
            onChange={e => setAction(e.target.value)}
          >
            <option value="">All actions</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="login">Login</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">{data?.total ?? 0} total events</span>
          </div>
          <div className="divide-y divide-border">
            {data?.logs.length === 0 && (
              <div className="px-5 py-12 text-center text-muted-foreground text-sm">No audit events found</div>
            )}
            {data?.logs.map((log) => (
              <div key={log.id} className="px-5 py-3.5 flex items-start gap-4 hover:bg-muted/20 transition-colors">
                <ScrollText className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ACTION_COLORS[log.action] || "bg-muted text-muted-foreground"}`}>
                      {log.action}
                    </span>
                    <span className="text-sm">{log.description}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    {log.userEmail && <span>{log.userEmail}</span>}
                    {log.resourceType && <span>on {log.resourceType}</span>}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
