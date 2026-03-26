import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useState } from "react";
import { Search, CheckCircle, XCircle, Clock } from "lucide-react";

export default function AuditLogPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-audit-log", search],
    queryFn: () => api.getAuditLog({ search: search || undefined }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Audit Log</h1>
        <p className="text-sm text-muted-foreground mt-1">System activity and change history</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search actions, actors, targets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm rounded-md border border-border bg-muted/40 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Time</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Action</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Actor</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Target</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Result</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Details</th>
              </tr>
            </thead>
            <tbody>
              {data?.logs.map((entry) => (
                <tr key={entry.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                      <Clock className="w-3 h-3" />
                      {new Date(entry.timestamp).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <code className="text-xs px-1.5 py-0.5 rounded bg-muted font-mono text-foreground">{entry.action}</code>
                  </td>
                  <td className="px-5 py-3 text-sm">{entry.actor}</td>
                  <td className="px-5 py-3">
                    <code className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono">{entry.target}</code>
                  </td>
                  <td className="px-5 py-3">
                    {entry.result === "success" ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                        <CheckCircle className="w-3 h-3" /> success
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-red-400">
                        <XCircle className="w-3 h-3" /> failure
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-xs text-muted-foreground max-w-xs truncate">{entry.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data && (
            <div className="px-5 py-3 border-t border-border text-xs text-muted-foreground">
              {data.total} entries
            </div>
          )}
        </div>
      )}
    </div>
  );
}
